<?php

use App\Http\Controllers\CourseController;
use Illuminate\Support\Facades\Route;

Route::post('/courses', [CourseController::class, 'store']);
