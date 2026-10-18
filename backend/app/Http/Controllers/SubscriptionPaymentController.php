<?php

namespace App\Http\Controllers;

use App\Models\PendingPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class SubscriptionPaymentController extends Controller
{
    private const PLANS = [
        '1_week' => 199.00,
        '1_month' => 1599.00,
        'lifetime' => 3599.00,
    ];

    public function store(Request $request): JsonResponse
    {
        if ($request->user()->is_instructor) {
            return response()->json([
                'message' => 'Student accounts are required to submit subscription payments.',
            ], 403);
        }

        $validated = $request->validate([
            'plan_type' => ['required', Rule::in(array_keys(self::PLANS))],
            'reference_number' => ['required', 'digits:13', 'unique:pending_payments,reference_number'],
            'receipt' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $receiptPath = null;

        try {
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('receipts', 'public');

                if ($receiptPath === false) {
                    throw new RuntimeException('Failed to store the uploaded payment receipt.');
                }
            }

            $payment = DB::transaction(fn () => PendingPayment::create([
                'user_id' => $request->user()->id,
                'plan_type' => $validated['plan_type'],
                'amount' => self::PLANS[$validated['plan_type']],
                'currency' => 'PHP',
                'reference_number' => $validated['reference_number'],
                'receipt_path' => $receiptPath,
                'status' => 'pending',
            ]));
        } catch (Throwable $exception) {
            if ($receiptPath !== null) {
                Storage::disk('public')->delete($receiptPath);
            }

            throw $exception;
        }

        return response()->json([
            'message' => 'Payment submitted successfully! Your account will be verified and activated shortly.',
            'payment' => [
                'id' => $payment->id,
                'plan_type' => $payment->plan_type,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'receipt_path' => $payment->receipt_path,
                'status' => $payment->status,
            ],
        ], 201);
    }
}
