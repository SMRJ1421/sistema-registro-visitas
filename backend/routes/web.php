<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VisitaController;

// Tus rutas actuales
Route::get('/', function () {
    return view('welcome');
});

// NUEVAS RUTAS PARA LA INTEGRACIÓN DE VISITAS
// Estas permiten que tu JavaScript consulte al controlador
Route::get('/buscar-ciudadano/{dni}', [VisitaController::class, 'buscarCiudadano']);
Route::get('/visitas', [VisitaController::class, 'index']);
Route::post('/visitas', [VisitaController::class, 'store']);
Route::get('/visitas/activas', [VisitaController::class, 'obtenerActivas']);
Route::put('/visitas/salida/{id}', [VisitaController::class, 'registrarSalida']);
Route::get('/reporte', [VisitaController::class, 'generarReporte']);