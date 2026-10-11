<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use InvalidArgumentException;

class InstructorSeeder extends Seeder
{
    public function run(): void
    {
        $attributes = [
            'name' => env('INSTRUCTOR_NAME'),
            'email' => env('INSTRUCTOR_EMAIL'),
            'password' => env('INSTRUCTOR_PASSWORD'),
        ];
        $providedAttributes = array_filter($attributes, fn (?string $value): bool => $value !== null && $value !== '');

        if ($providedAttributes === []) {
            return;
        }

        if (count($providedAttributes) !== count($attributes)) {
            throw new InvalidArgumentException('Set INSTRUCTOR_NAME, INSTRUCTOR_EMAIL, and INSTRUCTOR_PASSWORD together.');
        }
        if (strlen($attributes['password']) < 12) {
            throw new InvalidArgumentException('INSTRUCTOR_PASSWORD must be at least 12 characters long.');
        }

        User::query()->updateOrCreate(
            ['email' => $attributes['email']],
            [
                'name' => $attributes['name'],
                'password' => $attributes['password'],
                'is_instructor' => true,
            ],
        );
    }
}
