<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'description', 'category_track', 'thumbnail'])]
class Course extends Model
{
    public function materials(): HasMany
    {
        return $this->hasMany(CourseMaterial::class);
    }
}
