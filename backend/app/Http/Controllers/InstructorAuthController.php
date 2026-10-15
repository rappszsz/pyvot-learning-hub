<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

class InstructorAuthController extends Controller
{
    public function csrfToken(): JsonResponse
    {
        return response()->json(['token' => csrf_token()]);
    }

    public function login(Request $request): JsonResponse
    {
        return $this->authenticate($request, true);
    }

    public function studentLogin(Request $request): JsonResponse
    {
        return $this->authenticate($request, false);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'is_instructor' => false,
            'subscription_status' => 'inactive',
        ]);

        Auth::login($user);
        $request->session()->regenerate();
        $token = $user->createToken('student-registration')->plainTextToken;

        return response()->json([
            'user' => $this->userDetails($user),
            'token' => $token,
        ], 201);
    }

    private function authenticate(Request $request, bool $forInstructor): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'The provided credentials are invalid.'], 422);
        }

        $user = $request->user();

        if ((bool) $user?->is_instructor !== $forInstructor) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => $forInstructor
                    ? 'Instructor access is required.'
                    : 'This account belongs to the instructor portal.',
            ], 403);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => $this->userDetails($user),
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $this->userDetails($user),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

        $user->update($validated);

        return response()->json(['user' => $this->userDetails($user->refresh())]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();
        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
                'errors' => ['current_password' => ['The current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => $validated['new_password']]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    /**
     * @return array{id: int, name: string, email: string, bio: ?string, is_instructor: bool, subscription_status: string, subscription_ends_at: ?string, is_subscribed: bool}
     */
    private function userDetails(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'bio' => $user->bio,
            'is_instructor' => $user->is_instructor,
            'subscription_status' => $user->subscription_status,
            'subscription_ends_at' => $user->subscription_ends_at?->toISOString(),
            'is_subscribed' => $user->isSubscribed(),
        ];
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::forgetGuards();

        return response()->json(['message' => 'Signed out successfully.']);
    }
}
