<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstructorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_course_catalog_is_public_but_course_creation_requires_instructor_access(): void
    {
        $this->getJson('/api/courses')->assertOk();
        $this->postJson('/api/courses', [])->assertUnauthorized();
    }

    public function test_authenticated_students_cannot_use_instructor_mutation_endpoints(): void
    {
        $this->actingAs(User::factory()->create());

        $this->postJson('/api/courses', [])->assertForbidden();
        $this->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('user.is_instructor', false);
    }

    public function test_instructor_can_sign_in_access_the_session_and_sign_out(): void
    {
        $instructor = User::factory()->instructor()->create([
            'email' => 'instructor@example.com',
            'password' => 'correct horse battery staple',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $instructor->email,
            'password' => 'correct horse battery staple',
        ])
            ->assertOk()
            ->assertJsonPath('user.id', $instructor->id)
            ->assertJsonPath('user.is_instructor', true);

        $this->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('user.email', $instructor->email);

        $this->postJson('/api/auth/logout')->assertOk();
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_students_cannot_sign_in_to_the_instructor_portal(): void
    {
        $student = User::factory()->create([
            'email' => 'student@example.com',
            'password' => 'correct horse battery staple',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $student->email,
            'password' => 'correct horse battery staple',
        ])->assertForbidden();

        $this->postJson('/api/courses', [])->assertUnauthorized();
    }

    public function test_students_can_sign_in_to_the_student_portal_and_sign_out(): void
    {
        $student = User::factory()->create([
            'email' => 'student@example.com',
            'password' => 'correct horse battery staple',
        ]);

        $this->postJson('/api/auth/student/login', [
            'email' => $student->email,
            'password' => 'correct horse battery staple',
        ])
            ->assertOk()
            ->assertJsonPath('user.id', $student->id)
            ->assertJsonPath('user.is_instructor', false);

        $this->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('user.email', $student->email)
            ->assertJsonPath('user.is_instructor', false);

        $this->postJson('/api/courses', [])->assertForbidden();
        $this->postJson('/api/auth/logout')->assertOk();
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_instructors_cannot_sign_in_to_the_student_portal(): void
    {
        $instructor = User::factory()->instructor()->create([
            'email' => 'instructor@example.com',
            'password' => 'correct horse battery staple',
        ]);

        $this->postJson('/api/auth/student/login', [
            'email' => $instructor->email,
            'password' => 'correct horse battery staple',
        ])->assertForbidden();

        $this->getJson('/api/auth/user')->assertUnauthorized();
    }
}
