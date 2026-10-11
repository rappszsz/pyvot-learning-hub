<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstructor
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_instructor) {
            return response()->json(['message' => 'Instructor access is required.'], 403);
        }

        return $next($request);
    }
}
