<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Exception;

class AuditoriaController extends Controller
{
    public function index()
    {
        try {
            $logs = Auditoria::orderBy('id_auditoria', 'desc')
                ->take(100)
                ->get()
                ->map(function ($log) {
                    return [
                        'id'          => $log->id_auditoria,
                        'created_at'  => Carbon::parse($log->created_at)->format('Y-m-d H:i:s'),
                        'usuario'     => $log->usuario,
                        'accion'      => $log->accion,
                        'descripcion' => $log->descripcion,
                        'ip_origen'   => $log->ip_origen,
                    ];
                });

            return response()->json($logs, 200);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error en el servidor: ' . $e->getMessage()
            ], 500);
        }
    }
}