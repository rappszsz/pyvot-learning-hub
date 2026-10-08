<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class CourseController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'courseTitle' => ['required', 'string', 'max:255'],
            'courseDescription' => ['required', 'string'],
            'moduleTitle' => ['required', 'string', 'max:255'],
            'moduleDescription' => ['required', 'string'],
            'lessonVideo' => ['nullable', 'file', 'mimes:mp4,mov,avi,wmv,mpeg,webm,mkv', 'max:512000'],
            'studyMaterial' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
        ]);

        $files = [];

        foreach (['lessonVideo', 'studyMaterial'] as $field) {
            if (! $request->hasFile($field)) {
                continue;
            }

            $path = $request->file($field)->store('courses/'.$field, 'public');

            if ($path === false) {
                throw new RuntimeException("Failed to store the uploaded {$field} file.");
            }

            $files[$field] = [
                'path' => $path,
                'url' => Storage::disk('public')->url($path),
            ];
        }

        return response()->json([
            'message' => 'Course material uploaded successfully.',
            'course' => [
                'courseTitle' => $validated['courseTitle'],
                'courseDescription' => $validated['courseDescription'],
                'moduleTitle' => $validated['moduleTitle'],
                'moduleDescription' => $validated['moduleDescription'],
            ],
            'files' => $files,
        ], 201);
    }
}
