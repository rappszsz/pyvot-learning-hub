<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class CourseController extends Controller
{
    public function index(): JsonResponse
    {
        $courses = Course::query()
            ->with('materials')
            ->latest()
            ->get()
            ->map(fn (Course $course) => $this->courseDetails($course))
            ->values();

        return response()->json(['courses' => $courses]);
    }

    public function show(Course $course): JsonResponse
    {
        return response()->json([
            'course' => $this->courseDetails($course->load('materials')),
        ]);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'category_track' => ['sometimes', 'nullable', 'string', 'max:255'],
            'thumbnail' => ['sometimes', 'nullable', 'file', 'mimes:jpeg,png,jpg', 'max:2048'],
        ]);

        $oldThumbnail = $course->thumbnail;
        $newThumbnail = null;

        try {
            if (isset($validated['thumbnail'])) {
                $newThumbnail = $validated['thumbnail']->store('thumbnails', 'public');

                if ($newThumbnail === false) {
                    throw new RuntimeException('Failed to store the uploaded course thumbnail.');
                }

                $validated['thumbnail'] = $newThumbnail;
            }

            $course->update($validated);
        } catch (Throwable $exception) {
            if ($newThumbnail !== null) {
                Storage::disk('public')->delete($newThumbnail);
            }

            throw $exception;
        }

        if ($newThumbnail !== null && $oldThumbnail !== null) {
            $disk = Storage::disk('public');

            if ($disk->exists($oldThumbnail) && ! $disk->delete($oldThumbnail)) {
                throw new RuntimeException('Failed to delete the previous course thumbnail.');
            }
        }

        return response()->json([
            'message' => 'Course updated successfully.',
            'course' => $this->courseDetails($course->load('materials')),
        ]);
    }

    public function destroy(Course $course): JsonResponse
    {
        $disk = Storage::disk('public');
        $paths = $course->materials()
            ->pluck('file_path')
            ->push($course->thumbnail)
            ->filter()
            ->unique()
            ->values();

        foreach ($paths as $path) {
            if ($disk->exists($path) && ! $disk->delete($path)) {
                throw new RuntimeException("Failed to delete course file {$path}.");
            }
        }

        $course->delete();

        return response()->json([
            'message' => 'Course and associated files deleted successfully.',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'courseTitle' => ['required', 'string', 'max:255'],
            'courseDescription' => ['required', 'string'],
            'category_track' => ['nullable', 'string', 'max:255'],
            'thumbnail' => ['nullable', 'file', 'mimes:jpeg,png,jpg', 'max:2048'],
            'moduleTitle' => ['required', 'string', 'max:255'],
            'moduleDescription' => ['required', 'string'],
            'lessonVideo' => ['nullable', 'file', 'mimes:mp4,mov,avi,wmv,mpeg,webm,mkv', 'max:512000'],
            'studyMaterial' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'videos' => ['nullable', 'array'],
            'videos.*' => ['file', 'mimes:mp4,mov,avi,wmv,mpeg,webm,mkv', 'max:512000'],
            'pdfs' => ['nullable', 'array'],
            'pdfs.*' => ['file', 'mimes:pdf', 'max:20480'],
        ]);

        $uploads = [];

        foreach (['lessonVideo', 'studyMaterial'] as $field) {
            if ($request->hasFile($field)) {
                $uploads[] = ['field' => $field, 'file' => $request->file($field)];
            }
        }

        foreach (['videos', 'pdfs'] as $field) {
            foreach ($request->file($field, []) as $file) {
                $uploads[] = ['field' => $field, 'file' => $file];
            }
        }

        $storedPaths = [];

        try {
            [$course, $materials] = DB::transaction(function () use ($validated, $uploads, &$storedPaths) {
                $thumbnailPath = null;

                if (isset($validated['thumbnail'])) {
                    $thumbnailPath = $validated['thumbnail']->store('thumbnails', 'public');

                    if ($thumbnailPath === false) {
                        throw new RuntimeException('Failed to store the uploaded course thumbnail.');
                    }

                    $storedPaths[] = $thumbnailPath;
                }

                $course = Course::create([
                    'title' => $validated['courseTitle'],
                    'description' => $validated['courseDescription'],
                    'category_track' => $validated['category_track'] ?? null,
                    'thumbnail' => $thumbnailPath,
                ]);
                $materials = [];
                $files = [];

                foreach ($uploads as ['field' => $field, 'file' => $file]) {
                    $path = $file->store('materials', 'public');

                    if ($path === false) {
                        throw new RuntimeException("Failed to store the uploaded {$field} file.");
                    }

                    $storedPaths[] = $path;

                    $material = CourseMaterial::create([
                        'course_id' => $course->id,
                        'title' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                    $materials[] = $this->materialDetails($material);

                    if (in_array($field, ['lessonVideo', 'studyMaterial'], true)) {
                        $files[$field] = [
                            'path' => $path,
                            'url' => asset('storage/'.$path),
                        ];
                    }
                }

                return [$course, ['materials' => $materials, 'files' => $files]];
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);

            throw $exception;
        }

        return response()->json([
            'message' => 'Course material uploaded successfully.',
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'description' => $course->description,
                'category_track' => $course->category_track,
                'thumbnail' => $course->thumbnail,
                'courseTitle' => $validated['courseTitle'],
                'courseDescription' => $validated['courseDescription'],
                'moduleTitle' => $validated['moduleTitle'],
                'moduleDescription' => $validated['moduleDescription'],
            ],
            'files' => $materials['files'],
            'materials' => $materials['materials'],
        ], 201);
    }

    /**
     * @return array{id: int, title: string, description: string, category_track: ?string, thumbnail: ?string, created_at: string, materials: array}
     */
    private function courseDetails(Course $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'category_track' => $course->category_track,
            'thumbnail' => $course->thumbnail,
            'created_at' => $course->created_at->toISOString(),
            'materials' => $course->materials
                ->map(fn (CourseMaterial $material) => $this->materialDetails($material))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array{id: int, course_id: int, title: string, path: string, url: string, mime_type: string, file_size: int}
     */
    private function materialDetails(CourseMaterial $material): array
    {
        return [
            'id' => $material->id,
            'course_id' => $material->course_id,
            'title' => $material->title,
            'path' => $material->file_path,
            'url' => asset('storage/'.$material->file_path),
            'mime_type' => $material->mime_type,
            'file_size' => $material->file_size,
        ];
    }
}
