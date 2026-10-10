<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseMaterial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadCourseTest extends TestCase
{
    use RefreshDatabase;

    public function test_course_material_and_optional_files_can_be_uploaded(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/courses', [
            'courseTitle' => 'React Foundations',
            'courseDescription' => 'Learn the foundations of React.',
            'thumbnail' => UploadedFile::fake()->image('react-course.jpg'),
            'moduleTitle' => 'Getting started',
            'moduleDescription' => 'Set up a first React application.',
            'lessonVideo' => UploadedFile::fake()->create('lesson.mp4', 10, 'video/mp4'),
            'studyMaterial' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Course material uploaded successfully.')
            ->assertJsonPath('course.courseTitle', 'React Foundations')
            ->assertJsonPath('course.title', 'React Foundations')
            ->assertJsonCount(2, 'materials')
            ->assertJsonStructure([
                'files' => [
                    'lessonVideo' => ['path', 'url'],
                    'studyMaterial' => ['path', 'url'],
                ],
            ]);

        Storage::disk('public')->assertExists($response->json('files.lessonVideo.path'));
        Storage::disk('public')->assertExists($response->json('files.studyMaterial.path'));
        $courseId = $response->json('course.id');
        $this->assertDatabaseHas('courses', [
            'id' => $courseId,
            'title' => 'React Foundations',
            'thumbnail' => $response->json('course.thumbnail'),
        ]);
        Storage::disk('public')->assertExists($response->json('course.thumbnail'));
        $this->assertStringStartsWith('thumbnails/', $response->json('course.thumbnail'));
        $this->assertDatabaseCount('course_materials', 2);
        $this->assertDatabaseHas('course_materials', [
            'course_id' => $courseId,
            'title' => 'lesson.mp4',
        ]);
        $this->assertSame(
            asset('storage/'.$response->json('files.lessonVideo.path')),
            $response->json('files.lessonVideo.url')
        );
        $this->assertSame(
            asset('storage/'.$response->json('files.studyMaterial.path')),
            $response->json('files.studyMaterial.url')
        );
    }

    public function test_course_details_are_required(): void
    {
        $this->postJson('/api/courses', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'courseTitle',
                'courseDescription',
                'moduleTitle',
                'moduleDescription',
            ]);
    }

    public function test_courses_are_listed_with_nested_materials(): void
    {
        $course = Course::create([
            'title' => 'Accessible Web Design',
            'description' => 'Build inclusive interfaces.',
            'category_track' => 'Web development',
        ]);
        $material = CourseMaterial::create([
            'course_id' => $course->id,
            'title' => 'Accessibility lesson',
            'file_path' => 'materials/accessibility.mp4',
            'mime_type' => 'video/mp4',
            'file_size' => 1024,
        ]);

        $this->getJson('/api/courses')
            ->assertOk()
            ->assertJsonPath('courses.0.id', $course->id)
            ->assertJsonPath('courses.0.title', 'Accessible Web Design')
            ->assertJsonPath('courses.0.category_track', 'Web development')
            ->assertJsonPath('courses.0.thumbnail', null)
            ->assertJsonPath('courses.0.materials.0.id', $material->id)
            ->assertJsonPath('courses.0.materials.0.course_id', $course->id)
            ->assertJsonPath('courses.0.materials.0.title', 'Accessibility lesson');

        $this->getJson("/api/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('course.id', $course->id)
            ->assertJsonPath('course.thumbnail', null)
            ->assertJsonPath('course.materials.0.id', $material->id);
    }

    public function test_course_thumbnail_must_be_a_jpeg_or_png_under_two_megabytes(): void
    {
        $this->postJson('/api/courses', [
            'courseTitle' => 'Invalid thumbnail',
            'courseDescription' => 'A course.',
            'moduleTitle' => 'Module',
            'moduleDescription' => 'Module description.',
            'thumbnail' => UploadedFile::fake()->create('thumbnail.gif', 10, 'image/gif'),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('thumbnail');

        $this->postJson('/api/courses', [
            'courseTitle' => 'Oversized thumbnail',
            'courseDescription' => 'A course.',
            'moduleTitle' => 'Module',
            'moduleDescription' => 'Module description.',
            'thumbnail' => UploadedFile::fake()->image('large-thumbnail.png')->size(2049),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('thumbnail');

        $this->assertDatabaseCount('courses', 0);
    }

    public function test_course_can_be_created_with_multiple_linked_materials(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/courses', [
            'courseTitle' => 'React Foundations',
            'courseDescription' => 'Learn React.',
            'moduleTitle' => 'Components',
            'moduleDescription' => 'Learn about components.',
            'videos' => [UploadedFile::fake()->create('lesson.mp4', 10, 'video/mp4')],
            'pdfs' => [UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')],
        ]);

        $response->assertCreated()->assertJsonCount(2, 'materials');
        $courseId = $response->json('course.id');
        foreach ($response->json('materials') as $material) {
            $this->assertSame($courseId, $material['course_id']);
            Storage::disk('public')->assertExists($material['path']);
        }
    }

    public function test_course_details_can_be_updated(): void
    {
        $course = Course::create([
            'title' => 'Old title',
            'description' => 'Old description.',
        ]);

        $this->patchJson("/api/courses/{$course->id}", [
            'title' => 'Updated title',
            'description' => 'Updated description.',
        ])
            ->assertOk()
            ->assertJsonPath('course.title', 'Updated title')
            ->assertJsonPath('course.description', 'Updated description.');

        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'title' => 'Updated title',
            'description' => 'Updated description.',
        ]);
    }

    public function test_course_can_be_deleted_with_thumbnail_and_material_files(): void
    {
        Storage::fake('public');
        $thumbnailPath = 'thumbnails/course.jpg';
        $videoPath = 'materials/lesson.mp4';
        $pdfPath = 'materials/notes.pdf';
        Storage::disk('public')->put($thumbnailPath, 'thumbnail');
        Storage::disk('public')->put($videoPath, 'video');
        Storage::disk('public')->put($pdfPath, 'pdf');

        $course = Course::create([
            'title' => 'Course to delete',
            'description' => 'This course will be removed.',
            'thumbnail' => $thumbnailPath,
        ]);
        CourseMaterial::create([
            'course_id' => $course->id,
            'title' => 'Lesson',
            'file_path' => $videoPath,
            'mime_type' => 'video/mp4',
            'file_size' => 5,
        ]);
        CourseMaterial::create([
            'course_id' => $course->id,
            'title' => 'Notes',
            'file_path' => $pdfPath,
            'mime_type' => 'application/pdf',
            'file_size' => 3,
        ]);

        $this->deleteJson("/api/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Course and associated files deleted successfully.');

        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
        $this->assertDatabaseCount('course_materials', 0);
        foreach ([$thumbnailPath, $videoPath, $pdfPath] as $path) {
            Storage::disk('public')->assertMissing($path);
        }
    }

    public function test_course_thumbnail_can_be_replaced_when_updating_course(): void
    {
        Storage::fake('public');
        $oldThumbnail = 'thumbnails/old-course.jpg';
        Storage::disk('public')->put($oldThumbnail, 'old image');
        $course = Course::create([
            'title' => 'Course title',
            'description' => 'Course description.',
            'thumbnail' => $oldThumbnail,
        ]);

        $response = $this->patchJson("/api/courses/{$course->id}", [
            'title' => 'Updated course title',
            'description' => 'Updated course description.',
            'thumbnail' => UploadedFile::fake()->image('new-course.png'),
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('course.title', 'Updated course title')
            ->assertJsonPath('course.description', 'Updated course description.');

        $newThumbnail = $response->json('course.thumbnail');
        $this->assertNotSame($oldThumbnail, $newThumbnail);
        Storage::disk('public')->assertMissing($oldThumbnail);
        Storage::disk('public')->assertExists($newThumbnail);
        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'thumbnail' => $newThumbnail,
        ]);
    }

    public function test_materials_can_be_appended_to_an_existing_course(): void
    {
        Storage::fake('public');
        $course = Course::create([
            'title' => 'Existing course',
            'description' => 'An existing course.',
        ]);

        $response = $this->postJson("/api/courses/{$course->id}/materials", [
            'videos' => [UploadedFile::fake()->create('extra-lesson.mp4', 10, 'video/mp4')],
            'pdfs' => [UploadedFile::fake()->create('extra-notes.pdf', 10, 'application/pdf')],
        ]);

        $response->assertCreated()->assertJsonCount(2, 'materials');
        foreach ($response->json('materials') as $material) {
            $this->assertSame($course->id, $material['course_id']);
            Storage::disk('public')->assertExists($material['path']);
        }

        $this->getJson("/api/courses/{$course->id}")
            ->assertOk()
            ->assertJsonCount(2, 'course.materials');
    }

    public function test_frontend_origin_is_allowed_for_credentialed_api_requests(): void
    {
        $this->call('OPTIONS', '/api/courses', server: [
            'HTTP_ORIGIN' => 'http://localhost:5173',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ])
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }
}
