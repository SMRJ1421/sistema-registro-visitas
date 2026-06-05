// Evalúa si la constante ya fue declarada globalmente para evitar el SyntaxError
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = "http://127.0.0.1:8000/api";
}
const VOICE_MODE_KEY = 'registro_visitas_voz_activada';

$(document).ready(function() {
    // 1. Lógica de Voz y Estandarización de Header
    initHeaderFeatures(); 
    
    // 2. Lógica específica de Auditoría
    cargarLogs();

    // 3. Evento para el botón Refrescar del HTML
    $('#btnRefrescar').on('click', function(e) {
        e.preventDefault();
        // Mostrar estado de carga temporal en la tabla
        $('#tablaAuditoria').html('<tr><td colspan="5" class="text-muted p-4">Actualizando registros de auditoría...</td></tr>');
        cargarLogs();
    });
});

function initHeaderFeatures() {
    const nombre = localStorage.getItem('usuario_nombre');
    const rol = localStorage.getItem('usuario_rol');
    if (rol === 'Administrador') $('#btnAdminPanel').show();

    if (nombre) {
        $('#authContainer').html(`
            <div class="btn-group">
                <button type="button" class="btn btn-outline-light btn-sm dropdown-toggle" data-bs-toggle="dropdown" style="border-radius:0;">
                    <i class="fa-solid fa-circle-user me-1"></i> Cuenta
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li class="dropdown-header text-dark fw-bold">${nombre}</li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="localStorage.clear(); location.href='login.html'"><i class="fa-solid fa-power-off me-2"></i>Cerrar sesión</a></li>
                </ul>
            </div>`);
    } else {
        location.href = 'login.html';
    }
}

function cargarLogs() {
    $.ajax({
        url: `${API_BASE_URL}/auditoria`,
        type: "GET",
        dataType: "json",
        success: function(response) {
            // Soporta si el backend envía el array directo o envuelto en un objeto (response.data)
            let registros = Array.isArray(response) ? response : (response.data || []);

            let html = registros.map(log => {
                // Soporta tanto 'fecha_hora' personalizado como el 'created_at' por defecto
                let fechaHora = log.fecha_hora || log.created_at;

                return `
                <tr>
                    <td><small class="text-muted">${fechaHora}</small></td>
                    <td><span class="badge bg-secondary">${log.usuario ?? 'Sistema'}</span></td>
                    <td><span class="fw-bold">${log.accion}</span></td>
                    <td class="text-start">${log.descripcion}</td>
                    <td><code>${log.ip_origen ?? '127.0.0.1'}</code></td>
                </tr>`;
            }).join('');

            $('#tablaAuditoria').html(html || '<tr><td colspan="5" class="text-muted p-4">No hay registros de auditoría.</td></tr>');
        },
        error: function(xhr) {
            let mensaje = "Error al conectar con la API de auditoría.";
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                mensaje = xhr.responseJSON.message;
            } else if (xhr.status === 0) {
                mensaje = "No se pudo establecer conexión con el servidor (Verifique si PHP Artisan Serve está activo).";
            } else if (xhr.status === 500) {
                mensaje = "Error interno del servidor (500). Verifique la lógica del controlador o la base de datos.";
            }

            $('#tablaAuditoria').html(`
                <tr>
                    <td colspan="5" class="text-danger p-4">
                        <i class="fa-solid fa-circle-exclamation me-2"></i> ${mensaje}
                    </td>
                </tr>
            `);
        }
    });
}