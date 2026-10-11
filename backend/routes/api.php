<?php

use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseMaterialController;
use App\Http\Controllers\InstructorAuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function (): void {
    Route::get('/auth/csrf', [InstructorAuthController::class, 'csrfToken']);
    Route::post('/auth/login', [InstructorAuthController::class, 'login'])->middleware('throttle:6,1');
    Route::post('/auth/student/login', [InstructorAuthController::class, 'studentLogin'])->middleware('throttle:6,1');

    Route::middleware('auth')->group(function (): void {
        Route::get('/auth/user', [InstructorAuthController::class, 'user']);
        Route::post('/auth/logout', [InstructorAuthController::class, 'logout']);
    });

    Route::middleware(['auth', 'instructor'])->group(function (): void {
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{course}', [CourseController::class, 'update']);
        Route::patch('/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);
        Route::post('/courses/{course}/materials', [CourseMaterialController::class, 'storeForCourse']);
        Route::post('/materials', [CourseMaterialController::class, 'store']);
        Route::put('/materials/{material}', [CourseMaterialController::class, 'update']);
        Route::patch('/materials/{material}', [CourseMaterialController::class, 'update']);
        Route::delete('/materials/{material}', [CourseMaterialController::class, 'destroy']);
    });
});

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{course}', [CourseController::class, 'show']);
Route::get('/materials', [CourseMaterialController::class, 'index']);
