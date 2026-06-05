<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visita extends Model
{
    protected $table = 'visita';
    protected $primaryKey = 'id_visita';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'dni_visitante',
        'fecha',
        'hora_ingreso',
        'hora_salida',
        'motivo',
        'id_funcionario',
    ];
}