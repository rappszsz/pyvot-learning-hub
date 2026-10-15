<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
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

    public function test_student_registration_creates_an_inactive_student_and_authenticates_them(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New Student',
            'email' => 'new-student@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.name', 'New Student')
            ->assertJsonPath('user.email', 'new-student@example.com')
            ->assertJsonPath('user.is_instructor', false)
            ->assertJsonPath('user.subscription_status', 'inactive')
            ->assertJsonPath('user.is_subscribed', false)
            ->assertJsonStructure(['token']);

        $user = User::where('email', 'new-student@example.com')->firstOrFail();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_instructor' => false,
            'subscription_status' => 'inactive',
        ]);
        $this->assertTrue(Hash::check('secure-password', $user->password));
        $this->assertModelExists($user);

        Auth::guard('web')->logout();
        Auth::forgetGuards();

        $this->withToken($response->json('token'))
            ->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
        $this->withToken($response->json('token'))
            ->postJson('/api/courses', [])
            ->assertForbidden();
    }

    public function test_registration_token_authenticates_requests_without_a_session_and_can_be_revoked(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Token Student',
            'email' => 'token-student@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
        ])->assertCreated();

        $token = $response->json('token');
        Auth::guard('web')->logout();
        Auth::forgetGuards();
        $request = $this->withToken($token);

        $request->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('user.email', 'token-student@example.com');

        $request->postJson('/api/auth/logout')->assertOk();
        $request->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_student_registration_rejects_invalid_and_duplicate_emails(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $this->postJson('/api/register', [
            'name' => 'New Student',
            'email' => 'existing@example.com',
            'password' => 'secure-password',
            'password_confirmation' => 'different-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);

        $this->assertDatabaseCount('users', 1);
    }

    #[DataProvider('subscriptionCases')]
    public function test_authenticated_user_response_reports_subscription_status(
        string $subscriptionStatus,
        ?string $subscriptionEndsAt,
        bool $isSubscribed,
    ): void {
        $this->travelTo('2026-01-01 12:00:00');

        $user = User::factory()->create([
            'subscription_status' => $subscriptionStatus,
            'subscription_ends_at' => $subscriptionEndsAt,
        ]);

        $this->actingAs($user)
            ->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('user.subscription_status', $subscriptionStatus)
            ->assertJsonPath('user.is_subscribed', $isSubscribed);
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
            ->assertJsonPath('user.is_instructor', false)
            ->assertJsonPath('user.subscription_status', 'inactive')
            ->assertJsonPath('user.is_subscribed', false);

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

    public static function subscriptionCases(): array
    {
        return [
            'inactive by default' => ['inactive', null, false],
            'active without an end date' => ['active', null, true],
            'active with a future end date' => ['active', '2026-01-02 12:00:00', true],
            'active with a past end date' => ['active', '2026-01-01 11:59:59', false],
            'inactive with a future end date' => ['inactive', '2026-01-02 12:00:00', false],
        ];
    }
}
