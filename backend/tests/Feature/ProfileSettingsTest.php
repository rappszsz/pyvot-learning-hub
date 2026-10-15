<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_update_profile_details(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/auth/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
                'bio' => 'I enjoy learning.',
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Name')
            ->assertJsonPath('user.email', 'updated@example.com')
            ->assertJsonPath('user.bio', 'I enjoy learning.');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'bio' => 'I enjoy learning.',
        ]);
    }

    public function test_profile_updates_reject_duplicate_emails(): void
    {
        $user = User::factory()->create();
        User::factory()->create(['email' => 'taken@example.com']);

        $this->actingAs($user)
            ->putJson('/api/auth/profile', [
                'name' => 'Updated Name',
                'email' => 'taken@example.com',
                'bio' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_users_can_update_password_with_current_password(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($user)
            ->putJson('/api/auth/password', [
                'current_password' => 'old-password',
                'new_password' => 'new-password',
                'new_password_confirmation' => 'new-password',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Password updated successfully.');

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }

    public function test_password_update_rejects_an_incorrect_current_password(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($user)
            ->putJson('/api/auth/password', [
                'current_password' => 'incorrect-password',
                'new_password' => 'new-password',
                'new_password_confirmation' => 'new-password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_profile_settings_endpoints_require_authentication(): void
    {
        $this->putJson('/api/auth/profile', [])->assertUnauthorized();
        $this->putJson('/api/auth/password', [])->assertUnauthorized();
    }
}
