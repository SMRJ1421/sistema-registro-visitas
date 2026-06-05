// --- Configuración Global ---
const API_BASE_URL = "http://127.0.0.1:8000/api";
const VOICE_MODE_KEY = 'registro_visitas_voz_activada';
const speechSynthesisSupported = 'speechSynthesis' in window;

// --- Funciones de Voz ---
function isVoiceEnabled() { return localStorage.getItem(VOICE_MODE_KEY) === 'true'; }

function setVoiceEnabled(enabled) {
    localStorage.setItem(VOICE_MODE_KEY, enabled ? 'true' : 'false');
    updateVoiceButton();
}

function updateVoiceButton() {
    const button = $('#btnVoiceToggle');
    if (!button.length) return;
    if (isVoiceEnabled()) {
        button.removeClass('btn-outline-light').addClass('btn-success')
              .html('<i class="fa-solid fa-volume-high me-1"></i> Voz activada');
    } else {
        button.removeClass('btn-success').addClass('btn-outline-light')
              .html('<i class="fa-solid fa-headphones-simple me-1"></i> Activar voz');
    }
}

function speak(text) {
    if (!speechSynthesisSupported || !isVoiceEnabled()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function cargarVisitasActivas() {
    const token = localStorage.getItem('token_asistencia');

    $.ajax({
        url: `${API_BASE_URL}/visitas/activas`,
        type: "GET",
        dataType: "json",
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json',
            'Content-Type': 'application/json' // Crucial para que Sanctum no salte como "Unauthenticated"
        },
        success: function(data) {
            if (!data || data.length === 0) {
                $("#tablaSalidasPendientes").html('<tr><td colspan="6" class="text-muted p-4">No hay visitas activas en este momento.</td></tr>');
                return;
            }
            
            const filas = data.map(visita => {
                const idVisita = visita.id_visita || visita.id;
                const dni = visita.dni;
                const nombresCompletos = `${visita.nombres || ''} ${visita.apellido_paterno || visita.apellidos || ''} ${visita.apellido_materno || ''}`.trim();
                const horaIngreso = visita.hora_ingreso || visita.hora_entrada;
                const motivo = visita.motivo || visita.motivo_visita || 'No especificado';

                return `
                    <tr class="clickable-row animate__animated animate__fadeIn">
                        <td><strong>#${idVisita}</strong></td>
                        <td><span class="badge bg-secondary" style="font-size: 0.9rem;">${dni}</span></td>
                        <td class="text-start fw-medium">${nombresCompletos}</td>
                        <td><span class="badge bg-light text-dark border"><i class="fa-regular fa-clock me-1 text-danger"></i>${horaIngreso}</span></td>
                        <td class="text-start text-muted">${motivo}</td>
                        <td>
                            <button class="btn btn-danger btn-sm btn-marcar-salida fw-medium" data-id="${idVisita}">
                                <i class="fa-solid fa-right-from-bracket me-1"></i> Salida
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            $("#tablaSalidasPendientes").html(filas);
        },
        error: function(xhr) {
            console.error("Error al cargar visitas:", xhr);
            if (xhr.status === 401) {
                Swal.fire({
                    title: 'Sesión Inválida',
                    text: 'Su token de acceso ha expirado o no tiene autorización. Por favor, vuelva a autenticarse.',
                    icon: 'error',
                    confirmButtonColor: '#BF0909'
                }).then(() => {
                    window.location.href = 'login.html';
                });
            } else {
                $("#tablaSalidasPendientes").html('<tr><td colspan="6" class="text-danger p-4">Error de comunicación con el servidor.</td></tr>');
            }
        }
    });
}

// --- Inicialización ---
$(document).ready(function() {
    // Inicializar Voz
    updateVoiceButton();
    $('#btnVoiceToggle').on('click', function() {
        const enabled = !isVoiceEnabled();
        setVoiceEnabled(enabled);
        speak(enabled ? 'Modo voz activado' : 'Modo voz desactivado');
    });

    // Cargar datos iniciales
    cargarVisitasActivas();
    $("#btnRefrescarSalidas").click(cargarVisitasActivas);

    // Lógica Auth e interfaz de usuario superior
    const nombre = localStorage.getItem('usuario_nombre');
    if (nombre) {
        $('#authContainer').html(`
            <div class="btn-group">
                <button id="btnUser" type="button" class="btn btn-outline-light btn-sm dropdown-toggle fw-medium" data-bs-toggle="dropdown" style="height: 34px; font-size: 0.85rem; padding: 0 15px;">
                    ${nombre}
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                    <li><a class="dropdown-item text-danger" href="#" id="btnLogout"><i class="fa-solid fa-power-off me-2"></i>Cerrar sesión</a></li>
                </ul>
            </div>
        `);
        
        $('#btnLogout').on('click', (e) => { 
            e.preventDefault(); 
            localStorage.clear(); 
            window.location.href = 'login.html'; 
        });
    }

    // Control del Bot de Ayuda
    $('#helpToggle').on('click', () => $('#helpPanel').toggle());
    $('#helpClose').on('click', () => $('#helpPanel').hide());

    // Evento Delegado: Marcar Salida
    $(document).on("click", ".btn-marcar-salida", function() {
        const id = $(this).data("id");
        // El formato de hora it-IT nos asegura HH:MM:SS de manera limpia
        const horaActual = new Date().toLocaleTimeString('it-IT');
        const token = localStorage.getItem('token_asistencia');

        Swal.fire({
            title: '¿Confirmar Salida?',
            text: `Se registrará la salida del visitante a las ${horaActual}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#BF0909',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, registrar egreso',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${API_BASE_URL}/visitas/${id}/salida`,
                    type: "PUT", // Apuntamos nativamente al método PUT protegido en api.php
                    headers: { 
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    },
                    data: JSON.stringify({ hora_salida: horaActual }),
                    contentType: "application/json",
                    success: function() {
                        Swal.fire({
                            title: '¡Registrado!',
                            text: 'La salida del ciudadano fue grabada con éxito.',
                            icon: 'success',
                            confirmButtonColor: '#BF0909'
                        });
                        speak("Salida registrada con éxito.");
                        cargarVisitasActivas(); // Actualiza la lista automáticamente
                    },
                    error: function(xhr) {
                        console.error("Error al registrar salida:", xhr);
                        Swal.fire('Error', 'No se pudo guardar la salida del visitante.', 'error');
                    }
                });
            }
        });
    });
});