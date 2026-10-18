<?php

namespace Tests\Feature;

use App\Models\PendingPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PaymentApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_list_all_payment_submissions_with_student_details(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('receipts/receipt.jpg', 'receipt');
        $instructor = User::factory()->instructor()->create();
        $student = User::factory()->create([
            'name' => 'Student Example',
            'email' => 'student@example.com',
        ]);
        $payment = $this->createPayment($student, [
            'receipt_path' => 'receipts/receipt.jpg',
        ]);

        $this->actingAs($instructor)
            ->getJson('/api/instructor/payment-approvals')
            ->assertOk()
            ->assertJsonPath('payments.0.id', $payment->id)
            ->assertJsonPath('payments.0.student.name', 'Student Example')
            ->assertJsonPath('payments.0.student.email', 'student@example.com')
            ->assertJsonPath('payments.0.plan_type', '1_week')
            ->assertJsonPath('payments.0.reference_number', '1234567890123')
            ->assertJsonPath('payments.0.status', 'pending')
            ->assertJsonPath('payments.0.receipt_url', asset('storage/receipts/receipt.jpg'));
    }

    public function test_admin_can_access_payment_approvals(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->getJson('/api/instructor/payment-approvals')
            ->assertOk()
            ->assertJsonCount(0, 'payments');
    }

    public function test_payment_approval_activates_weekly_access_for_seven_days(): void
    {
        $instructor = User::factory()->instructor()->create();
        $student = User::factory()->create();
        $payment = $this->createPayment($student, ['plan_type' => '1_week']);
        $approvedAt = Carbon::now()->startOfSecond();
        Carbon::setTestNow($approvedAt);

        $this->actingAs($instructor)
            ->postJson("/api/instructor/payment-approvals/{$payment->id}/approve")
            ->assertOk()
            ->assertJsonPath('message', 'Payment approved and student access activated!');

        $this->assertSame('approved', $payment->fresh()->status);
        $student->refresh();
        $this->assertSame('active', $student->subscription_status);
        $this->assertTrue($student->subscription_ends_at->equalTo($approvedAt->copy()->addDays(7)));
        Carbon::setTestNow();
    }

    public function test_monthly_and_lifetime_approval_set_the_expected_expiration(): void
    {
        $instructor = User::factory()->instructor()->create();
        $monthlyStudent = User::factory()->create();
        $monthlyPayment = $this->createPayment($monthlyStudent, ['plan_type' => '1_month']);
        $lifetimeStudent = User::factory()->create();
        $lifetimePayment = $this->createPayment($lifetimeStudent, [
            'plan_type' => 'lifetime',
            'reference_number' => '1234567890124',
        ]);
        $approvedAt = Carbon::now()->startOfSecond();
        Carbon::setTestNow($approvedAt);

        $this->actingAs($instructor)
            ->postJson("/api/instructor/payment-approvals/{$monthlyPayment->id}/approve")
            ->assertOk();
        $this->assertTrue(
            $monthlyStudent->fresh()->subscription_ends_at->equalTo($approvedAt->copy()->addDays(30))
        );

        $this->actingAs($instructor)
            ->postJson("/api/instructor/payment-approvals/{$lifetimePayment->id}/approve")
            ->assertOk();
        $this->assertNull($lifetimeStudent->fresh()->subscription_ends_at);
        $this->assertSame('active', $lifetimeStudent->fresh()->subscription_status);
        Carbon::setTestNow();
    }

    public function test_declining_a_payment_rejects_it_without_activating_student_access(): void
    {
        $instructor = User::factory()->instructor()->create();
        $student = User::factory()->create([
            'subscription_status' => 'inactive',
            'subscription_ends_at' => null,
        ]);
        $payment = $this->createPayment($student);

        $this->actingAs($instructor)
            ->postJson("/api/instructor/payment-approvals/{$payment->id}/decline")
            ->assertOk()
            ->assertJsonPath('message', 'Payment declined.');

        $this->assertSame('rejected', $payment->fresh()->status);
        $this->assertSame('inactive', $student->fresh()->subscription_status);
        $this->assertNull($student->fresh()->subscription_ends_at);
    }

    public function test_reviewing_a_payment_twice_is_rejected(): void
    {
        $instructor = User::factory()->instructor()->create();
        $student = User::factory()->create();
        $payment = $this->createPayment($student, ['status' => 'approved']);

        $this->actingAs($instructor)
            ->postJson("/api/instructor/payment-approvals/{$payment->id}/approve")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['payment']);
    }

    public function test_payment_approval_routes_require_instructor_access(): void
    {
        $this->getJson('/api/instructor/payment-approvals')->assertUnauthorized();

        $student = User::factory()->create();
        $payment = $this->createPayment($student);

        $this->actingAs($student)
            ->getJson('/api/instructor/payment-approvals')
            ->assertForbidden();

        $this->actingAs($student)
            ->postJson("/api/instructor/payment-approvals/{$payment->id}/approve")
            ->assertForbidden();
    }

    private function createPayment(User $student, array $overrides = []): PendingPayment
    {
        return PendingPayment::create(array_merge([
            'user_id' => $student->id,
            'plan_type' => '1_week',
            'amount' => 199,
            'currency' => 'PHP',
            'reference_number' => '1234567890123',
            'receipt_path' => null,
            'status' => 'pending',
        ], $overrides));
    }
}
