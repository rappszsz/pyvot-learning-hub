<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SubscriptionPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_submit_payment_with_receipt_for_manual_verification(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/api/subscription-payments', [
            'plan_type' => '1_week',
            'reference_number' => '1234567890123',
            'receipt' => UploadedFile::fake()->image('gcash-receipt.png'),
        ], ['Accept' => 'application/json']);

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Payment submitted successfully! Your account will be verified and activated shortly.'
            )
            ->assertJsonPath('payment.plan_type', '1_week')
            ->assertJsonPath('payment.amount', '199.00')
            ->assertJsonPath('payment.currency', 'PHP')
            ->assertJsonPath('payment.status', 'pending');

        $receiptPath = $response->json('payment.receipt_path');
        $this->assertDatabaseHas('pending_payments', [
            'user_id' => $user->id,
            'plan_type' => '1_week',
            'amount' => 199,
            'currency' => 'PHP',
            'reference_number' => '1234567890123',
            'status' => 'pending',
        ]);
        $this->assertNotNull($receiptPath);
        Storage::disk('public')->assertExists($receiptPath);
        $this->assertSame('inactive', $user->fresh()->subscription_status);
    }

    public function test_student_can_submit_payment_without_optional_receipt(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/subscription-payments', [
                'plan_type' => '1_month',
                'reference_number' => '9876543210123',
            ])
            ->assertCreated()
            ->assertJsonPath('payment.amount', '1599.00');

        $this->assertDatabaseHas('pending_payments', [
            'user_id' => $user->id,
            'plan_type' => '1_month',
            'receipt_path' => null,
            'status' => 'pending',
        ]);
    }

    public function test_payment_submission_requires_authentication(): void
    {
        $this->postJson('/api/subscription-payments', [
            'plan_type' => '1_week',
            'reference_number' => '1234567890123',
        ])->assertUnauthorized();
    }

    public function test_payment_submission_validates_plan_reference_and_receipt(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/subscription-payments', [
                'plan_type' => 'free',
                'reference_number' => 'not-a-reference',
                'receipt' => UploadedFile::fake()->create('receipt.pdf', 10, 'application/pdf'),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['plan_type', 'reference_number', 'receipt']);
    }

    public function test_instructors_cannot_submit_student_subscription_payments(): void
    {
        $instructor = User::factory()->instructor()->create();

        $this->actingAs($instructor)
            ->postJson('/api/subscription-payments', [
                'plan_type' => '1_week',
                'reference_number' => '1234567890123',
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('pending_payments', 0);
    }
}
