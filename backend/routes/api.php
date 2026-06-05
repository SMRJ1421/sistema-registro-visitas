<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CiudadanoController;
use App\Http\Controllers\RecoveryController;
use App\Http\Controllers\VisitaController;
use App\Http\Controllers\AuditoriaController;
use App\Http\Controllers\UsuarioController;

/*
|--------------------------------------------------------------------------
| Rutas públicas
|--------------------------------------------------------------------------
*/

// Ruta para crear un usuario (puedes protegerla luego con el middleware de Sanctum)
Route::post('/usuarios', [UsuarioController::class, 'store']);

// ==========================================
// MÓDULO: AUDITORÍA (TRAZABILIDAD)
// ==========================================
// Centralizado en su propio controlador nativo
Route::get('/auditoria', [AuditoriaController::class, 'index']);

// Ruta para el panel estadístico de gráficos
Route::get('/visitas/estadisticas', [VisitaController::class, 'obtenerEstadisticas']);

Route::get('/visitas/buscar/{dni}', [VisitaController::class, 'buscarPorDni']);

// REUBICACIÓN AQUÍ: Sacamos la ruta del candado para que funcione libremente como antes
Route::get('/visitas/activas', [VisitaController::class, 'obtenerActivas']);
Route::put('/visitas/{id}/salida', [VisitaController::class, 'registrarSalida']);
Route::get('/visitas/reportes', [VisitaController::class, 'generarReporte']);

// ==========================================
// AUTH & 2FA (MÓDULO DE SEGURIDAD MEJORADO)
// ==========================================
Route::post('/auth/login', [AuthController::class, 'login']);

// 🚨 SOPORTE MULTI-RUTA (Acepta peticiones con o sin guion medio para evitar conflictos con login.js)
Route::post('/auth/verificar-2fa', [AuthController::class, 'verificar2fa']);
Route::post('/auth/verificar2fa', [AuthController::class, 'verificar2fa']); 

Route::post('/auth/recover-password', [RecoveryController::class, 'recoverPassword']);
Route::post('/auth/recover-password/verify', [RecoveryController::class, 'verifyCode']);
Route::post('/auth/recover-password/reset', [RecoveryController::class, 'resetPassword']);
Route::post('/auth/recover-username', [RecoveryController::class, 'recoverUsername']);

// ==========================================
// CIUDADANOS
// ==========================================
Route::post('/ciudadano/consultar', [CiudadanoController::class, 'consultarDni']);
Route::get('/ciudadano/{dni}', [CiudadanoController::class, 'consultarDni']);


// ==========================================
// VISITAS (PÚBLICAS PARA EL MÓDULO DE REGISTRO)
// ==========================================
// Sacamos index (listar) y store (guardar) para que el formulario principal funcione libremente
Route::get('/visitas', [VisitaController::class, 'index']);
Route::post('/visitas', [VisitaController::class, 'store']);


/*
|--------------------------------------------------------------------------
| Rutas protegidas
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ==========================================
    // LOGOUT
    // ==========================================
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // ==========================================
    // VISITAS ADMINISTRATIVAS (Siguen protegidas para el panel de control)
    // ==========================================
    
    // NOTA: Se removieron las referencias duplicadas e inactivas a [VisitaController::class, 'obtenerAuditoria'] 
    // para habilitar el flujo limpio hacia el AuditoriaController global de arriba.

});