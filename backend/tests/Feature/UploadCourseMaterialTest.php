<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadCourseMaterialTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->instructor()->create());
    }

    public function test_materials_can_be_listed(): void
    {
        Storage::fake('public');
        $course = $this->createCourse();
        $material = CourseMaterial::create([
            'course_id' => $course->id,
            'title' => 'React workshop',
            'file_path' => 'materials/react-workshop.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
        ]);

        $this->getJson('/api/materials')
            ->assertOk()
            ->assertJsonStructure([
                'materials' => [
                    '*' => ['id', 'course_id', 'title', 'path', 'url', 'mime_type', 'file_size'],
                ],
            ])
            ->assertJsonPath('materials.0.id', $material->id)
            ->assertJsonPath('materials.0.course_id', $course->id)
            ->assertJsonPath('materials.0.title', 'React workshop')
            ->assertJsonPath('materials.0.url', asset('storage/'.$material->file_path));
    }

    public function test_empty_material_list_is_returned_when_no_materials_exist(): void
    {
        $this->getJson('/api/materials')
            ->assertOk()
            ->assertExactJson(['materials' => []]);
    }

    public function test_pdf_and_video_materials_are_stored_and_persisted(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/materials', [
            'course_id' => $this->createCourse()->id,
            'lessonVideo' => UploadedFile::fake()->create('lesson.mp4', 10, 'video/mp4'),
            'studyMaterial' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Course material uploaded successfully.')
            ->assertJsonCount(2, 'materials')
            ->assertJsonStructure([
                'materials' => [
                    '*' => ['id', 'course_id', 'title', 'path', 'url', 'mime_type', 'file_size'],
                ],
            ]);

        foreach ($response->json('materials') as $material) {
            Storage::disk('public')->assertExists($material['path']);
            $this->assertDatabaseHas('course_materials', [
                'id' => $material['id'],
                'title' => $material['title'],
                'file_path' => $material['path'],
                'course_id' => $response->json('materials.0.course_id'),
            ]);
        }

        $this->assertSame(2, CourseMaterial::count());
    }

    public function test_material_upload_requires_an_existing_course(): void
    {
        Storage::fake('public');

        $this->postJson('/api/materials', [
            'lessonVideo' => UploadedFile::fake()->create('lesson.mp4', 10, 'video/mp4'),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('course_id');

        $this->assertDatabaseCount('course_materials', 0);
        Storage::disk('public')->assertDirectoryEmpty('materials');
    }

    public function test_multiple_videos_and_pdfs_can_be_uploaded_in_one_request(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/materials', [
            'course_id' => $this->createCourse()->id,
            'videos' => [
                UploadedFile::fake()->create('lesson-one.mp4', 10, 'video/mp4'),
                UploadedFile::fake()->create('lesson-two.avi', 10, 'video/x-msvideo'),
            ],
            'pdfs' => [
                UploadedFile::fake()->create('notes-one.pdf', 10, 'application/pdf'),
                UploadedFile::fake()->create('notes-two.pdf', 10, 'application/pdf'),
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'All course materials uploaded successfully.')
            ->assertJsonCount(4, 'materials');

        foreach ($response->json('materials') as $material) {
            Storage::disk('public')->assertExists($material['path']);
            $this->assertDatabaseHas('course_materials', [
                'id' => $material['id'],
                'title' => $material['title'],
                'file_path' => $material['path'],
            ]);
        }

        $this->assertSame(4, CourseMaterial::count());
    }

    public function test_batch_upload_validates_each_video_and_pdf(): void
    {
        Storage::fake('public');

        $this->postJson('/api/materials', [
            'course_id' => $this->createCourse()->id,
            'videos' => [UploadedFile::fake()->create('lesson.txt', 10, 'text/plain')],
            'pdfs' => [UploadedFile::fake()->create('notes.txt', 10, 'text/plain')],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['videos.0', 'pdfs.0']);

        $this->assertDatabaseCount('course_materials', 0);
        Storage::disk('public')->assertDirectoryEmpty('materials');
    }

    public function test_single_file_upload_requires_a_title(): void
    {
        Storage::fake('public');

        $this->postJson('/api/materials', [
            'course_id' => $this->createCourse()->id,
            'file' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');

        $this->assertDatabaseCount('course_materials', 0);
        Storage::disk('public')->assertDirectoryEmpty('materials');
    }

    public function test_upload_rejects_files_other_than_pdf_or_video(): void
    {
        Storage::fake('public');

        $this->postJson('/api/materials', [
            'course_id' => $this->createCourse()->id,
            'title' => 'Unsupported file',
            'file' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_material_title_can_be_updated_with_put_or_patch(): void
    {
        Storage::fake('public');
        $material = CourseMaterial::create([
            'title' => 'Original title',
            'file_path' => 'materials/original.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
        ]);

        $this->putJson("/api/materials/{$material->id}", ['title' => 'Updated with PUT'])
            ->assertOk()
            ->assertJsonPath('material.title', 'Updated with PUT');

        $this->patchJson("/api/materials/{$material->id}", ['title' => 'Updated with PATCH'])
            ->assertOk()
            ->assertJsonPath('material.title', 'Updated with PATCH');

        $this->assertDatabaseHas('course_materials', [
            'id' => $material->id,
            'title' => 'Updated with PATCH',
        ]);
    }

    public function test_material_title_update_requires_a_valid_title(): void
    {
        $material = CourseMaterial::create([
            'title' => 'Original title',
            'file_path' => 'materials/original.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
        ]);

        $this->patchJson("/api/materials/{$material->id}", ['title' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');

        $this->assertDatabaseHas('course_materials', [
            'id' => $material->id,
            'title' => 'Original title',
        ]);
    }

    public function test_deleting_material_removes_its_public_file_and_record(): void
    {
        Storage::fake('public');
        $path = 'materials/to-delete.pdf';
        Storage::disk('public')->put($path, 'course material');
        $material = CourseMaterial::create([
            'title' => 'Material to delete',
            'file_path' => $path,
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
        ]);

        $this->deleteJson("/api/materials/{$material->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Course material deleted successfully.');

        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('course_materials', ['id' => $material->id]);
    }

    private function createCourse(): Course
    {
        return Course::create([
            'title' => 'Test course',
            'description' => 'A course for testing.',
        ]);
    }
}
