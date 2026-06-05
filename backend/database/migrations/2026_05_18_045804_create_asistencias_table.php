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
        Schema::create('visitas', function (Blueprint $table) {
            $table->id('id_visita');
            $table->string('dni_visitante', 8);
            $table->date('fecha');
            $table->time('hora_ingreso');
            $table->time('hora_salida')->nullable();
            $table->string('motivo');
            $table->unsignedBigInteger('id_funcionario')->nullable();
            $table->string('oficina_destino')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitas');
    }
};
