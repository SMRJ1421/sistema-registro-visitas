<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // =====================================================================
        // CONFIGURACIÓN DE CORS Y SANCTUM PARA LARAVEL 11
        // =====================================================================
        
        // Habilita el comportamiento de API con soporte de estado y cookies para Sanctum
        $middleware->statefulApi();

        // Agrega las cabeceras CORS de forma manual para tus orígenes locales
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();