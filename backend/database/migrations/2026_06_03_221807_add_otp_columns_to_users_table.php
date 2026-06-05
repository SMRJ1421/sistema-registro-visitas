<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Añade las columnas necesarias para soportar la autenticación de doble factor (2FA).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Almacena el código OTP temporal de 6 dígitos (puede ser null si el usuario no está en flujo de login)
            $table->string('codigo_otp', 6)->nullable();
            
            // Registra la fecha y hora exacta en la que el código expirará (Vigencia de 5 minutos)
            $table->timestamp('otp_expires_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     * Revierte los cambios aplicados eliminando de forma segura las columnas añadidas.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remueve las columnas si se realiza un rollback de la migración
            $table->dropColumn(['codigo_otp', 'otp_expires_at']);
        });
    }
};