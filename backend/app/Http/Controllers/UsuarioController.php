<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash; // <-- 1. IMPORTANTE: La importación va aquí arriba
use Illuminate\Support\Facades\Log;

class UsuarioController extends Controller
{
    /**
     * Almacenar un nuevo usuario en el sistema.
     */
    public function store(Request $request)
    {
        // 2. Validación estricta de los datos entrantes antes de insertar
        $request->validate([
            'username' => 'required|string|max:50|unique:usuario_sistema,username',
            'password' => 'required|string|min:4',
            'rol' => 'required|string|max:30',
            'nombre_completo' => 'required|string|max:100',
        ]);

        try {
            // 3. AQUÍ COLOCAS TU CÓDIGO DE INSERCIÓN
            DB::table('usuario_sistema')->insert([
                'username'        => $request->username,
                'password'        => Hash::make($request->password), // Encriptación Bcrypt segura
                'rol'             => $request->rol,
                'nombre_completo' => $request->nombre_completo,
                'estado'          => true, // Activo por defecto al registrarse
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);

            // Retornar respuesta de éxito al frontend (ej. a un AJAX en tu panel de administración)
            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado exitosamente.'
            ], 201);

        } catch (\Exception $e) {
            // Registrar el error en los logs en caso de fallas en la base de datos
            Log::error('Error al registrar usuario: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno al procesar el registro.'
            ], 500);
        }
    }
}