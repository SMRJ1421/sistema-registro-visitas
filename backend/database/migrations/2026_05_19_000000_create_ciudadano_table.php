<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ciudadano', function (Blueprint $table) {
            $table->string('dni', 8)->primary();
            $table->string('nombres');
            $table->string('apellido_paterno');
            $table->string('apellido_materno')->default('No especificado');
            $table->string('origen_dato')->default('manual');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ciudadano');
    }
};
