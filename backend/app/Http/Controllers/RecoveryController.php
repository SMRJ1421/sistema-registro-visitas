<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;

class RecoveryController extends Controller
{
    public function recoverPassword(Request $request)
    {
        if (!Schema::hasTable('usuario_sistema') || !Schema::hasTable('recovery_codes')) {
            return response()->json(['success' => false, 'message' => 'Migraciones no aplicadas. Ejecuta php artisan migrate.'], 500);
        }

        $request->validate([ 'email' => 'required|email' ]);
        $email = $request->input('email');

        $user = DB::table('usuario_sistema')->where('email', $email)->first();
        if (!$user) {
            // For privacy, respond success even if not found
            return response()->json(['success' => true, 'message' => 'Si la dirección existe, se enviará un código.'], 200);
        }

        $code = rand(100000, 999999);
        $expiresAt = Carbon::now()->addMinutes(10);

        DB::table('recovery_codes')->insert([
            'email' => $email,
            'code' => $code,
            'expires_at' => $expiresAt,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Try sending email (will use configured mail driver). If mail fails, return 500.
        try {
            Mail::raw("Su código de recuperación es: {$code}", function($m) use ($email) {
                $m->to($email)->subject('Código de recuperación - RENIEC');
            });
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'No fue posible enviar el código. ' . $e->getMessage()], 500);
        }

        return response()->json(['success' => true, 'message' => 'Código enviado'], 200);
    }

    public function verifyCode(Request $request)
    {
        if (!Schema::hasTable('recovery_codes')) {
            return response()->json(['success' => false, 'message' => 'Migraciones no aplicadas. Ejecuta php artisan migrate.'], 500);
        }

        $request->validate([ 'email' => 'required|email', 'code' => 'required' ]);
        $record = DB::table('recovery_codes')->where('email', $request->email)->where('code', $request->code)->orderBy('created_at', 'desc')->first();
        if (!$record) return response()->json(['success' => false, 'message' => 'Código inválido'], 400);
        if (Carbon::now()->gt(new Carbon($record->expires_at))) return response()->json(['success' => false, 'message' => 'Código expirado'], 400);
        return response()->json(['success' => true, 'message' => 'Código válido'], 200);
    }

    public function resetPassword(Request $request)
    {
        if (!Schema::hasTable('recovery_codes') || !Schema::hasTable('usuario_sistema')) {
            return response()->json(['success' => false, 'message' => 'Migraciones no aplicadas. Ejecuta php artisan migrate.'], 500);
        }

        $request->validate([ 'email' => 'required|email', 'code' => 'required', 'password' => 'required|min:6' ]);
        $record = DB::table('recovery_codes')->where('email', $request->email)->where('code', $request->code)->orderBy('created_at', 'desc')->first();
        if (!$record) return response()->json(['success' => false, 'message' => 'Código inválido'], 400);
        if (Carbon::now()->gt(new Carbon($record->expires_at))) return response()->json(['success' => false, 'message' => 'Código expirado'], 400);

        // Update password (bcrypt)
        DB::table('usuario_sistema')->where('email', $request->email)->update(['password' => bcrypt($request->password), 'updated_at' => Carbon::now()]);

        // Optionally delete recovery codes for this email
        DB::table('recovery_codes')->where('email', $request->email)->delete();

        return response()->json(['success' => true, 'message' => 'Contraseña actualizada'], 200);
    }

    public function recoverUsername(Request $request)
    {
        if (!Schema::hasTable('usuario_sistema')) {
            return response()->json(['success' => false, 'message' => 'Migraciones no aplicadas. Ejecuta php artisan migrate.'], 500);
        }

        $request->validate([ 'email' => 'required|email' ]);
        $email = $request->input('email');

        $user = DB::table('usuario_sistema')->where('email', $email)->first();
        if (!$user) return response()->json(['success' => true, 'message' => 'Si la dirección existe, recibirá un correo.'], 200);

        try {
            Mail::raw("Su usuario es: {$user->username}", function($m) use ($email) {
                $m->to($email)->subject('Recuperación de usuario - RENIEC');
            });
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'No fue posible enviar el correo. ' . $e->getMessage()], 500);
        }

        return response()->json(['success' => true, 'message' => 'Correo enviado si la dirección existe.'], 200);
    }
}
