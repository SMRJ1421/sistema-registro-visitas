<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Auditoria;

class VisitaController extends Controller
{
    /**
     * Helper privado para unificar el formateo de apellidos en todo el sistema.
     * Elimina textos por defecto para que no afecten la visualización del frontend.
     */
    private function limpiarApellidos($paterno, $materno)
    {
        $apPaterno = ($paterno && $paterno !== 'No especificado') ? $paterno : '';
        $apMaterno = ($materno && $materno !== 'No especificado') ? $materno : '';
        return trim("$apPaterno $apMaterno");
    }

    // 1. Listar visitas del día (Mapeado con nombres estándar en minúsculas para JS)
    public function index()
    {
        try {
            $hoy = now()->toDateString();

            $visitas = DB::table('visita')
                ->join('ciudadano', 'visita.dni_visitante', '=', 'ciudadano.dni')
                ->select(
                    'visita.id_visita',
                    'visita.dni_visitante as dni',
                    'ciudadano.nombres',
                    'ciudadano.apellido_paterno',
                    'ciudadano.apellido_materno',
                    'visita.motivo',
                    'visita.fecha',
                    'visita.hora_ingreso'
                )
                ->where('visita.fecha', '=', $hoy)
                ->orderBy('visita.hora_ingreso', 'desc')
                ->get();

            $resultado = $visitas->map(function($v) {
                return [
                    'id_visita'    => $v->id_visita,
                    'dni'          => $v->dni,
                    'nombres'      => $v->nombres,
                    'apellidos'    => $this->limpiarApellidos($v->apellido_paterno, $v->apellido_materno),
                    'motivo'       => $v->motivo,
                    'fecha'        => $v->fecha,
                    'hora_ingreso' => $v->hora_ingreso
                ];
            });

            return response()->json($resultado, 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al listar: ' . $e->getMessage()], 500);
        }
    }

    // 1.2 Buscar por DNI (Optimizado: Consulta directa a la entidad Ciudadano)
    public function buscarPorDni($dni) 
    {
        try {
            $ciudadano = DB::table('ciudadano')->where('dni', $dni)->first();
            
            if ($ciudadano) {
                return response()->json([
                    'nombres' => $ciudadano->nombres,
                    'apellidos' => $this->limpiarApellidos($ciudadano->apellido_paterno, $ciudadano->apellido_materno) ?: 'No especificado'
                ], 200);
            }
            
            return response()->json(['message' => 'No registrado antes'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // 2. Registrar nueva visita y asegurar ciudadano
    public function store(Request $request)
    {
        $request->validate([
            'dni'            => 'required|string|size:8',
            'nombres'        => 'required|string|max:100',
            'motivo'         => 'required|string|max:255',
            'id_funcionario' => 'nullable|integer'
        ]);

        try {
            DB::beginTransaction();

            $dni     = $request->input('dni');
            $nombres = $request->input('nombres');
            $motivo  = $request->input('motivo');

            $apellidoPaterno = trim($request->input('apellido_paterno', ''));
            $apellidoMaterno = trim($request->input('apellido_materno', ''));

            if (empty($apellidoPaterno) && $request->filled('apellidos')) {
                $partes = preg_split('/\s+/', trim($request->input('apellidos')));
                $apellidoPaterno = $partes[0] ?? '';
                $apellidoMaterno = count($partes) > 1 ? implode(' ', array_slice($partes, 1)) : '';
            }

            if (empty($apellidoPaterno)) $apellidoPaterno = 'No especificado';
            if (empty($apellidoMaterno)) $apellidoMaterno = 'No especificado';

            // A. Asegurar la existencia del Ciudadano
            $ciudadanoExiste = DB::table('ciudadano')->where('dni', $dni)->exists();
            if (!$ciudadanoExiste) {
                DB::table('ciudadano')->insert([
                    'dni'              => $dni,
                    'nombres'          => $nombres,
                    'apellido_paterno' => $apellidoPaterno,
                    'apellido_materno' => $apellidoMaterno,
                ]);
            }

            // B. Registrar la Visita
            DB::table('visita')->insert([
                'dni_visitante'  => $dni,
                'fecha'          => now()->toDateString(), 
                'hora_ingreso'   => now()->toTimeString(),  
                'motivo'         => $motivo,
                'id_funcionario' => $request->input('id_funcionario', 1),
                'origen_dato'    => $request->input('origen_dato', 'manual'), // Mapeado a la tabla visita según el DDL
                'created_at'     => now(),
                'updated_at'     => now()
            ]);

            // C. Registrar en Auditoría (Corregido para la tabla auditoria_sistema)
            try {
                DB::table('auditoria_sistema')->insert([
                    'usuario'     => $request->input('usuario_activo', 'Rafael Jeyson Seguil Martinez'), 
                    'accion'      => 'Registro de Visita',
                    'descripcion' => "Se registró de forma exitosa el ingreso del ciudadano con DNI: " . $dni,
                    'ip_origen'   => $request->ip() ?? '127.0.0.1',
                    'created_at'  => now()
                ]);
            } catch (\Exception $auditError) {
                Log::error("Error en auditoría registro: " . $auditError->getMessage());
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => '¡Visita registrada correctamente!'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error en el servidor: ' . $e->getMessage()], 500);
        }
    }

    // 3. Obtener visitas activas (Sin hora de salida registrada)
    public function obtenerActivas()
    {
        try {
            $visitas = DB::table('visita')
                ->join('ciudadano', 'visita.dni_visitante', '=', 'ciudadano.dni')
                ->select(
                    'visita.id_visita',
                    'visita.dni_visitante as dni',
                    'ciudadano.nombres',
                    'ciudadano.apellido_paterno',
                    'ciudadano.apellido_materno',
                    'visita.motivo',
                    'visita.fecha',
                    'visita.hora_ingreso'
                )
                ->whereNull('visita.hora_salida') 
                ->orderBy('visita.hora_ingreso', 'desc')
                ->get();

            $resultado = $visitas->map(function($v) {
                return [
                    'id_visita'    => $v->id_visita,
                    'dni'          => $v->dni,
                    'nombres'      => $v->nombres,
                    'apellidos'    => $this->limpiarApellidos($v->apellido_paterno, $v->apellido_materno),
                    'motivo'       => $v->motivo,
                    'fecha'        => $v->fecha,
                    'hora_ingreso' => $v->hora_ingreso
                ];
            });

            return response()->json($resultado, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener visitas activas: ' . $e->getMessage()], 500);
        }
    }

    // 4. Registrar salida del ciudadano
    public function registrarSalida(Request $request, $id)
    {
        try {
            $horaSalida = now()->toTimeString(); 

            $updated = DB::table('visita')
                ->where('id_visita', $id)
                ->update([
                    'hora_salida' => $horaSalida,
                    'updated_at'  => now()
                ]);

            if (!$updated) {
                return response()->json(['success' => false, 'message' => 'Visita no encontrada'], 404);
            }

            // Registrar en Auditoría (Corregido para la tabla auditoria_sistema)
            try {
                DB::table('auditoria_sistema')->insert([
                    'usuario'     => $request->input('usuario_activo', 'Rafael Jeyson Seguil Martinez'),
                    'accion'      => 'Salida de Visita',
                    'descripcion' => "Se completó el registro de salida (Check-out) para la visita ID: " . $id,
                    'ip_origen'   => $request->ip() ?? '127.0.0.1',
                    'created_at'  => now()
                ]);
            } catch (\Exception $auditError) {
                Log::error("Error en auditoría salida: " . $auditError->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'Salida registrada correctamente'], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al registrar salida: ' . $e->getMessage()], 500);
        }
    }

    // 5. Obtener los logs de auditoría (Actualizado a la tabla correcta por consistencia)
    public function obtenerAuditoria()
    {
        try {
            $logs = DB::table('auditoria_sistema')
                ->orderBy('id_auditoria', 'desc')
                ->limit(100)
                ->get();
            return response()->json($logs, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener auditoría: ' . $e->getMessage()], 500);
        }
    }

    // 6. Generar reporte de trazabilidad (Mapeado exacto con filtro de nulos para JavaScript)
    public function generarReporte(Request $request) 
    {
        try {
            $dni = $request->query('dni');
            $desde = $request->query('desde');
            $hasta = $request->query('hasta');

            $query = DB::table('visita as v')
                ->join('ciudadano as c', 'v.dni_visitante', '=', 'c.dni')
                ->join('funcionario as f', 'v.id_funcionario', '=', 'f.id_funcionario')
                ->select(
                    'v.id_visita',
                    'v.fecha',
                    'v.hora_ingreso',
                    'v.hora_salida',
                    'v.motivo',
                    'v.origen_dato', // Se lee directo de visita gracias al DDL nuevo
                    'c.dni',
                    DB::raw("CONCAT(c.nombres, ' ', c.apellido_paterno, ' ', c.apellido_materno) as visitante"),
                    'f.nombre_completo as funcionario'
                );

            if (!empty($dni)) { $query->where('c.dni', $dni); }
            if (!empty($desde)) { $query->where('v.fecha', '>=', $desde); }
            if (!empty($hasta)) { $query->where('v.fecha', '<=', $hasta); }

            $reportes = $query->orderBy('v.fecha', 'desc')
                              ->orderBy('v.hora_ingreso', 'desc')
                              ->get();

            return response()->json($reportes, 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error en reportes: ' . $e->getMessage()
            ], 500);
        }
    }

    // 7. Endpoint Analítico para alimentar los gráficos de Chart.js
    public function obtenerEstadisticas()
    {
        try {
            $anioActual = date('Y');

            // A. Visitas agrupadas por mes del año actual (PostgreSQL Engine)
            $visitasMesRaw = DB::table('visita')
                ->select(DB::raw("EXTRACT(MONTH FROM fecha) as mes"), DB::raw("COUNT(*) as total"))
                ->whereRaw("EXTRACT(YEAR FROM fecha) = ?", [$anioActual])
                ->groupBy(DB::raw("EXTRACT(MONTH FROM fecha)"))
                ->orderBy('mes')
                ->get();

            $mesesValores = array_fill(1, 12, 0);
            foreach ($visitasMesRaw as $row) {
                $mesesValores[(int)$row->mes] = (int)$row->total;
            }

            // B. Visitas por Tipo de Visitante (Filtro por origen del dato amarrado a la tabla visita)
            $tiposRaw = DB::table('visita')
                ->select('origen_dato', DB::raw("COUNT(*) as total"))
                ->groupBy('origen_dato')
                ->get();

            // Estructura por defecto para tus 3 categorías del gráfico de pastel
            $categorias = ['api' => 0, 'excel' => 0, 'manual' => 0];
            foreach ($tiposRaw as $row) {
                $key = strtolower($row->origen_dato);
                if (array_key_exists($key, $categorias)) {
                    $categorias[$key] = (int)$row->total;
                }
            }

            return response()->json([
                'status' => 'success',
                'visitas_mes' => array_values($mesesValores), // [0, 15, 30...] Ene a Dic
                'tipos_visitante' => array_values($categorias) // Orden: API, Excel, Manual
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error en analítica: ' . $e->getMessage()
            ], 500);
        }
    }
}