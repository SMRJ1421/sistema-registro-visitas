<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('usuario_sistema', 'email')) {
            Schema::table('usuario_sistema', function (Blueprint $table) {
                $table->string('email')->nullable()->after('nombre_completo');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('usuario_sistema', 'email')) {
            Schema::table('usuario_sistema', function (Blueprint $table) {
                $table->dropColumn('email');
            });
        }
    }
};
