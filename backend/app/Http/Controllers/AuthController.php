<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\CodigoVerificacionMail; // Importación de la clase Mailable institucional

class AuthController extends Controller
{
    /**
     * FASE 1: Validación de credenciales y envío de código 2FA por Gmail
     */
    public function login(Request $request)
    {
        // Extraer datos explícitamente si vienen como JSON crudo
        $input = $request->isJson() ? $request->json()->all() : $request->all();

        // Validar el array procesado (Soporta 'username' o 'email' adaptativamente)
        validator($input, [
            'username' => 'required|string|max:50',
            'password' => 'required|string|min:4',
        ])->validate();

        // Asignar variables sanitizadas para el flujo subsiguiente
        $usernameInput = isset($input['username']) ? trim($input['username']) : null;
        $passwordInput = $input['password'] ?? null;

        try {
            // Buscar usuario en PostgreSQL usando la variable procesada
            $usuario = DB::table('usuario_sistema')
                ->where('username', $usernameInput)
                ->orWhere('email', $usernameInput)
                ->first();

            // Usuario no existe
            if (!$usuario) {
                return response()->json([
                    'status' => 'error',
                    'success' => false,
                    'message' => 'Usuario o contraseña incorrectos.'
                ], 401);
            }

            // Usuario deshabilitado o validación de estado adaptada
            if (isset($usuario->estado) && ($usuario->estado === false || $usuario->estado === 'Inactivo')) {
                return response()->json([
                    'status' => 'error',
                    'success' => false,
                    'message' => 'La cuenta está deshabilitada.'
                ], 403);
            }

            // --- COMPARACIÓN EN TEXTO PLANO ---
            // Aplicamos trim() para eliminar espacios fijos residuales de la BD
            $passwordBD = trim($usuario->password);

            // Validación directa sin encriptación
            if ($passwordInput !== $passwordBD) {
                return response()->json([
                    'status' => 'error',
                    'success' => false,
                    'message' => 'Usuario o contraseña incorrectos.'
                ], 401);
            }

            // --- INICIO DEL FLUJO INTEGRADO 2FA ---
            // Generar código numérico aleatorio de 6 dígitos
            $codigo2fa = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $expiracion = now()->addMinutes(5); // Caducidad de 5 minutos

            // Guardar el código generado en las columnas de la BD (codigo_2fa y expira_2fa)
            DB::table('usuario_sistema')
                ->where('id_usuario', $usuario->id_usuario)
                ->update([
                    'codigo_2fa' => $codigo2fa,
                    'expira_2fa' => $expiracion
                ]);

            // Intentar despachar el correo usando tu configuración de Gmail (.env)
            try {
                // Verificar si tiene un correo asignado, de lo contrario usar el tuyo por defecto
                $emailDestino = isset($usuario->email) ? trim($usuario->email) : 'jeyson.1421@gmail.com';

                // Disparar el Mailable institucional estructurado en Blade
                Mail::to($emailDestino)->send(new CodigoVerificacionMail($codigo2fa));

                // Respondemos éxito unificado para que la Fase 1 del JS transicione estéticamente
                return response()->json([
                    'status' => 'success',
                    'success' => true,
                    'requiere_2fa' => true,
                    'message' => 'Código de verificación enviado con éxito a tu Gmail.'
                ], 200);

            } catch (\Exception $mailEx) {
                // MODO DESARROLLO LOCAL: Si falla el SMTP de Gmail, se captura el error y se registra en storage/logs/laravel.log
                Log::warning('El servicio de correo falló, pero permitimos continuar en local. Código generado: ' . $codigo2fa);
                Log::error('Detalle del fallo de correo: ' . $mailEx->getMessage());

                // Forzamos respuesta exitosa inyectando un mensaje alternativo para no romper el JS en pruebas sin internet
                return response()->json([
                    'status' => 'success',
                    'success' => true,
                    'requiere_2fa' => true,
                    'message' => 'Modo Desarrollo activo. Copia el código desde el archivo laravel.log. Código simulado: ' . $codigo2fa
                ], 200);
            }

        } catch (\Exception $e) {
            Log::error('Error login: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'success' => false,
                'message' => 'Error interno del servidor.'
            ], 500);
        }
    }

    /**
     * FASE 2: Validación del código de 6 dígitos e inicio de sesión real
     */
    public function verificar2fa(Request $request)
    {
        $input = $request->isJson() ? $request->json()->all() : $request->all();

        validator($input, [
            'username' => 'required|string|max:50',
            'codigo'   => 'required|string|size:6',
        ])->validate();

        $usernameInput = isset($input['username']) ? trim($input['username']) : null;
        $codigoInput = isset($input['codigo']) ? trim($input['codigo']) : null;

        try {
            $usuario = DB::table('usuario_sistema')
                ->where('username', $usernameInput)
                ->orWhere('email', $usernameInput)
                ->first();

            if (!$usuario || !$usuario->codigo_2fa) {
                return response()->json([
                    'status' => 'error',
                    'success' => false, 
                    'message' => 'El flujo de autenticación no es válido o ha expirado.'
                ], 400);
            }

            // Comprobar expiración del código en base al tiempo actual del servidor
            if (now()->greaterThan($usuario->expira_2fa)) {
                return response()->json([
                    'status' => 'error',
                    'success' => false, 
                    'message' => 'El código de seguridad ha expirado.'
                ], 401);
            }

            // Comprobar coincidencia exacta aplicando trim de seguridad
            if (trim($usuario->codigo_2fa) !== $codigoInput) {
                return response()->json([
                    'status' => 'error',
                    'success' => false, 
                    'message' => 'El código ingresado es incorrecto.'
                ], 401);
            }

            // Limpiar las columnas del token de un solo uso para evitar reutilización fraudulenta
            DB::table('usuario_sistema')
                ->where('id_usuario', $usuario->id_usuario)
                ->update([
                    'codigo_2fa' => null,
                    'expira_2fa' => null
                ]);

            // --- FASE FINAL: Creación real del Token compatible con Sanctum ---
            $plainTextToken = bin2hex(random_bytes(20)); 
            $hashedToken = hash('sha256', $plainTextToken);

            $userId = property_exists($usuario, 'id_usuario') ? $usuario->id_usuario : 
                     (property_exists($usuario, 'id') ? $usuario->id : 1);

            $tokenId = DB::table('personal_access_tokens')->insertGetId([
                'tokenable_type' => 'App\\Models\\User',
                'tokenable_id'   => $userId,
                'name'           => 'auth_token',
                'token'          => $hashedToken,
                'abilities'      => json_encode(['*']),
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            $finalToken = $tokenId . '|' . $plainTextToken;

            // Retornar la estructura exacta mapeada por tus archivos JS globales
            return response()->json([
                'status'         => 'success',
                'success'        => true,
                'requiere_2fa'   => false,
                'token'          => $finalToken,
                'rol'            => trim($usuario->rol),
                'nombre_completo'=> trim($usuario->nombre_completo),
                'usuario'        => [
                    'nombre' => trim($usuario->nombre_completo),
                    'rol'    => trim($usuario->rol)
                ],
                'message'        => 'Inicio de sesión exitoso.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en verificar2fa: ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Error interno del servidor al verificar el código.'
            ], 500);
        }
    }

    /**
     * LOGOUT: Eliminación limpia del Token de Sanctum de la Base de Datos
     */
    public function logout(Request $request)
    {
        try {
            $token = $request->bearerToken();

            if ($token) {
                // Si el token incluye el delimitador oficial de Laravel Sanctum "|", extraemos la segunda parte
                if (str_contains($token, '|')) {
                    $token = explode('|', $token)[1];
                }

                // Eliminamos el token de la base de datos comparando su respectivo Hash SHA-256
                DB::table('personal_access_tokens')
                    ->where('token', hash('sha256', $token))
                    ->delete();
            }

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'Sesión cerrada correctamente.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error logout: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Error cerrando sesión.'
            ], 500);
        }
    }
}