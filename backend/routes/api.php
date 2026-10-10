<?php

use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseMaterialController;
use Illuminate\Support\Facades\Route;

Route::post('/courses', [CourseController::class, 'store']);
Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{course}', [CourseController::class, 'show']);
Route::put('/courses/{course}', [CourseController::class, 'update']);
Route::patch('/courses/{course}', [CourseController::class, 'update']);
Route::delete('/courses/{course}', [CourseController::class, 'destroy']);
Route::post('/courses/{course}/materials', [CourseMaterialController::class, 'storeForCourse']);
Route::get('/materials', [CourseMaterialController::class, 'index']);
Route::post('/materials', [CourseMaterialController::class, 'store']);
Route::put('/materials/{material}', [CourseMaterialController::class, 'update']);
Route::patch('/materials/{material}', [CourseMaterialController::class, 'update']);
Route::delete('/materials/{material}', [CourseMaterialController::class, 'destroy']);
