<?php

namespace App\Http\Controllers;

use App\Models\PendingPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentApprovalController extends Controller
{
    public function index(): JsonResponse
    {
        $payments = PendingPayment::query()
            ->with('user:id,name,email')
            ->latest()
            ->get()
            ->map(fn (PendingPayment $payment) => [
                'id' => $payment->id,
                'student' => [
                    'name' => $payment->user->name,
                    'email' => $payment->user->email,
                ],
                'plan_type' => $payment->plan_type,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'reference_number' => $payment->reference_number,
                'receipt_url' => $payment->receipt_path
                    ? asset('storage/'.$payment->receipt_path)
                    : null,
                'submitted_at' => $payment->created_at->toISOString(),
                'status' => $payment->status,
            ])
            ->values();

        return response()->json(['payments' => $payments]);
    }

    public function approve(PendingPayment $payment): JsonResponse
    {
        DB::transaction(function () use ($payment): void {
            $payment = PendingPayment::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);

            if ($payment->status !== 'pending') {
                throw ValidationException::withMessages([
                    'payment' => 'This payment has already been reviewed.',
                ]);
            }

            $expiresAt = match ($payment->plan_type) {
                '1_week' => now()->addDays(7),
                '1_month', 'monthly' => now()->addDays(30),
                'lifetime' => null,
                default => throw ValidationException::withMessages([
                    'payment' => 'This payment has an unsupported plan type.',
                ]),
            };

            $payment->update(['status' => 'approved']);
            $payment->user()->update([
                'subscription_status' => 'active',
                'subscription_ends_at' => $expiresAt,
            ]);
        });

        return response()->json([
            'message' => 'Payment approved and student access activated!',
        ]);
    }

    public function decline(PendingPayment $payment): JsonResponse
    {
        DB::transaction(function () use ($payment): void {
            $payment = PendingPayment::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);

            if ($payment->status !== 'pending') {
                throw ValidationException::withMessages([
                    'payment' => 'This payment has already been reviewed.',
                ]);
            }

            $payment->update(['status' => 'rejected']);
        });

        return response()->json([
            'message' => 'Payment declined.',
        ]);
    }
}
