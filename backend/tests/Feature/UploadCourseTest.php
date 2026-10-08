<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadCourseTest extends TestCase
{
    public function test_course_material_and_optional_files_can_be_uploaded(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/courses', [
            'courseTitle' => 'React Foundations',
            'courseDescription' => 'Learn the foundations of React.',
            'moduleTitle' => 'Getting started',
            'moduleDescription' => 'Set up a first React application.',
            'lessonVideo' => UploadedFile::fake()->create('lesson.mp4', 10, 'video/mp4'),
            'studyMaterial' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Course material uploaded successfully.')
            ->assertJsonPath('course.courseTitle', 'React Foundations')
            ->assertJsonStructure([
                'files' => [
                    'lessonVideo' => ['path', 'url'],
                    'studyMaterial' => ['path', 'url'],
                ],
            ]);

        Storage::disk('public')->assertExists($response->json('files.lessonVideo.path'));
        Storage::disk('public')->assertExists($response->json('files.studyMaterial.path'));
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
