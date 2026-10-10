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

class CourseMaterialController extends Controller
{
    public function index(): JsonResponse
    {
        $materials = CourseMaterial::query()
            ->latest()
            ->get()
            ->map(fn (CourseMaterial $material) => $this->materialDetails($material))
            ->values();

        return response()->json(['materials' => $materials]);
    }

    public function store(Request $request): JsonResponse
    {
        $isBatchUpload = $request->hasFile('videos') || $request->hasFile('pdfs');

        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'title' => ['nullable', 'required_without_all:lessonVideo,studyMaterial,videos,pdfs', 'string', 'max:255'],
            'file' => ['nullable', 'required_without_all:lessonVideo,studyMaterial,videos,pdfs', 'file', 'mimes:pdf,mp4,mov,avi,wmv,mpeg,webm,mkv', 'max:512000'],
            'lessonVideo' => ['nullable', 'required_without_all:file,studyMaterial,videos,pdfs', 'file', 'mimes:mp4,mov,avi,wmv,mpeg,webm,mkv', 'max:512000'],
            'studyMaterial' => ['nullable', 'required_without_all:file,lessonVideo,videos,pdfs', 'file', 'mimes:pdf', 'max:20480'],
            'videos' => ['nullable', 'required_without_all:file,lessonVideo,studyMaterial,pdfs', 'array'],
            'videos.*' => ['file', 'mimes:mp4,mov,avi', 'max:51200'],
            'pdfs' => ['nullable', 'required_without_all:file,lessonVideo,studyMaterial,videos', 'array'],
            'pdfs.*' => ['file', 'mimes:pdf', 'max:10240'],
        ]);

        $uploads = [];

        foreach (['file', 'lessonVideo', 'studyMaterial'] as $field) {
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
            $materials = DB::transaction(function () use ($uploads, $validated, &$storedPaths) {
                $materials = [];

                foreach ($uploads as ['field' => $field, 'file' => $file]) {
                    $path = $file->store('materials', 'public');

                    if ($path === false) {
                        throw new RuntimeException("Failed to store the uploaded {$field} file.");
                    }

                    $storedPaths[] = $path;

                    $material = CourseMaterial::create([
                        'course_id' => $validated['course_id'],
                        'title' => $field === 'file' && isset($validated['title'])
                            ? $validated['title']
                            : $file->getClientOriginalName(),
                        'file_path' => $path,
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);

                    $materials[] = $this->materialDetails($material);
                }

                return $materials;
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($storedPaths);

            throw $exception;
        }

        return response()->json([
            'message' => $isBatchUpload
                ? 'All course materials uploaded successfully.'
                : 'Course material uploaded successfully.',
            'materials' => $materials,
        ], 201);
    }

    public function storeForCourse(Request $request, Course $course): JsonResponse
    {
        $request->merge(['course_id' => $course->id]);

        return $this->store($request);
    }

    public function update(Request $request, CourseMaterial $material): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $material->update($validated);

        return response()->json([
            'message' => 'Course material updated successfully.',
            'material' => $this->materialDetails($material),
        ]);
    }

    public function destroy(CourseMaterial $material): JsonResponse
    {
        $disk = Storage::disk('public');

        if ($disk->exists($material->file_path) && ! $disk->delete($material->file_path)) {
            throw new RuntimeException('Failed to delete the uploaded course material file.');
        }

        $material->delete();

        return response()->json([
            'message' => 'Course material deleted successfully.',
        ]);
    }

    /**
     * @return array{id: int, course_id: ?int, title: string, path: string, url: string, mime_type: string, file_size: int}
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
