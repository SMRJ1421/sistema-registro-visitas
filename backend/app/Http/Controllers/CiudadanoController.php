<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CiudadanoController extends Controller
{
    public function consultarDni(Request $request, $dni = null)
    {
        $dni = $dni ?? $request->input('dni');

        if (! $dni) {
            return response()->json(['success' => false, 'message' => 'DNI no proporcionado'], 400);
        }

        $ciudadano = DB::table('ciudadano')->where('dni', $dni)->first();
        if ($ciudadano) {
            return response()->json([
                'success' => true,
                'data' => [
                    'nombres' => $ciudadano->nombres,
                    'apellidoPaterno' => $ciudadano->apellido_paterno,
                    'apellidoMaterno' => ($ciudadano->apellido_materno !== 'No especificado') ? $ciudadano->apellido_materno : '',
                ],
                'origen' => 'local',
            ], 200);
        }

        try {
            $reniecToken = config('services.reniec.token') ?? env('RENIEC_API_TOKEN');

            if (empty($reniecToken)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token RENIEC no configurado, ingrese datos manualmente',
                    'origen' => 'manual',
                ], 200);
            }

            $response = Http::timeout(5)->get('https://api.apis.net.pe/v2/reniec/dni', [
                'numero' => $dni,
                'token' => $reniecToken,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['nombres'])) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'nombres' => $data['nombres'] ?? '',
                            'apellidoPaterno' => $data['apellidoPaterno'] ?? '',
                            'apellidoMaterno' => $data['apellidoMaterno'] ?? '',
                        ],
                        'origen' => 'api',
                    ], 200);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'No se encontró el DNI',
                'origen' => 'manual',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Servicio no disponible, ingrese datos manualmente',
                'origen' => 'manual',
            ], 200);
        }
    }
}