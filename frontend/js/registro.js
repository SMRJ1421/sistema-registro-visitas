/**
 * js/registro.js
 * Lógica de negocio para Registro de Visitas.
 * NOTA: La navegación, efectos de fondo y estados .active se gestionan en estilos.js
 */

const API_BASE_URL = "http://127.0.0.1:8000/api";
const VOICE_MODE_KEY = 'registro_visitas_voz_activada';

$(document).ready(function() {
    
    // --- 1. GESTIÓN DE VOZ (Texto a Voz y Reconocimiento) ---
    const speechSynthesisSupported = 'speechSynthesis' in window;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    let recognition = null;

    function isVoiceEnabled() {
        return localStorage.getItem(VOICE_MODE_KEY) === 'true';
    }
    
    // --- CONTROL DEL DESPLEGABLE DE MOTIVOS ---
    $('#MotivoSelect').on('change', function() {
        if ($(this).val() === 'Otro') {
            $('#contenedorMotivoOtro').slideDown('fast'); // Muestra la caja de texto con animación
            $('#MotivoVisita').prop('required', true).focus(); // La hace obligatoria y pone el cursor ahí
        } else {
            $('#contenedorMotivoOtro').slideUp('fast');   // Oculta la caja de texto
            $('#MotivoVisita').prop('required', false).val(''); // Ya no es obligatoria y se limpia
        }
    });

    function speak(text) {
        if (!speechSynthesisSupported || !isVoiceEnabled()) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-PE';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    // Inicializar control de voz
    if ($('#btnVoiceToggle').length) {
        $('#btnVoiceToggle').on('click', function() {
            const enabled = !isVoiceEnabled();
            localStorage.setItem(VOICE_MODE_KEY, enabled);
            speak(enabled ? 'Modo voz activado.' : 'Modo voz desactivado.');
        });
    }

    // --- 2. GESTIÓN DE USUARIO Y AUTENTICACIÓN ---
    function updateAuthUI() {
        const container = $('#authContainer');
        const token = localStorage.getItem('token_asistencia');
        const nombre = localStorage.getItem('usuario_nombre');
        const rol = localStorage.getItem('usuario_rol');
        
        const adminBtn = $('#btnAdminPanel'); 
        
        if (token && nombre) {
            if (rol === 'Administrador') adminBtn.show();
            else adminBtn.hide();

            container.html(`
                <div class="btn-group">
                    <button id="btnUser" type="button" class="btn btn-outline-light btn-sm dropdown-toggle fw-medium" data-bs-toggle="dropdown" style="height: 34px; font-size: 0.85rem; padding: 0 15px;">
                        ${nombre}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                        <li><a class="dropdown-item text-danger" href="#" id="btnLogout"><i class="fa-solid fa-power-off me-2"></i>Cerrar sesión</a></li>
                    </ul>
                </div>`);

            $('#btnLogout').on('click', (e) => { e.preventDefault(); localStorage.clear(); window.location.href = 'login.html'; });
        } else {
            adminBtn.hide();
            container.html('<a href="login.html" class="btn btn-outline-light btn-sm fw-medium" style="height: 34px; font-size: 0.85rem; padding: 0 15px;">Iniciar sesión</a>');
        }
    }

    // --- 3. LÓGICA DE NEGOCIO (API) ---
    function listarVisitas() {
        $.get(`${API_BASE_URL}/visitas`, function(data) {
            const html = data.length ? data.map(v => `
                <tr class="animated-row">
                    <td class="ps-3 fw-bold text-secondary">#${v.id_visita}</td>
                    <td class="fw-semibold">${v.dni}</td>
                    <td>${v.nombres} ${v.apellidos || ''}</td>
                    <td><span class="badge bg-light text-dark border"><i class="fa-regular fa-clock me-1 text-danger"></i>${v.hora_ingreso}</span></td>
                    <td class="pe-3 text-muted">${v.motivo}</td>
                </tr>`).join('') : '<tr><td colspan="5" class="text-center py-4 text-muted">No hay visitas hoy</td></tr>';
            $("#tablaVisitas").html(html);
        });
    }

    // --- NUEVO: FUNCIÓN PARA ACTUALIZAR EL TEXTO E INTERFAZ DEL ESTADO DE LA API ---
    function actualizarTextoEstado() {
        let apiActiva = $("#modoAutomatico").is(":checked");
        
        if (apiActiva) {
            $("#estadoApi").text("Activado").removeClass("text-muted").addClass("text-danger fw-bold");
        } else {
            $("#estadoApi").text("Desactivado").removeClass("text-danger fw-bold").addClass("text-muted");
        }
    }

    // Escucha el evento de cambio cuando se hace clic en el interruptor de modo automático
    $("#modoAutomatico").on("change", function() {
        actualizarTextoEstado();
    });

    // --- FUNCIÓN UNIFICADA E INTELIGENTE PARA EVALUAR DNI (BD LOCAL + API OPCIONAL) ---
    function ejecutarBusquedaDni() {
        let dni = $("#Dni").val().trim();
        let busquedaApiActivada = $("#modoAutomatico").is(":checked"); 

        if (dni.length !== 8) {
            if (dni.length > 0) {
                console.log("-> El DNI no cuenta con 8 dígitos.");
            }
            return;
        }

        console.log("-> Iniciando búsqueda en historial local para DNI:", dni);

        // PASO 1: Buscar SIEMPRE en el historial local primero
        $.ajax({
            url: `${API_BASE_URL}/visitas/buscar/${dni}`, // <-- Si tu endpoint backend es diferente (ej. /ciudadano/local/${dni}), cámbialo aquí
            method: 'GET',
            statusCode: {
                200: function(respuestaLocal) {
                    console.log("-> ¡Encontrado en Base de Datos Local!", respuestaLocal);
                    
                    // Adaptamos por si los datos vienen directo o dentro de un objeto 'data'
                    let datosCiudadano = respuestaLocal.data || respuestaLocal;
                    
                    $("#Nombres").val(datosCiudadano.nombres || '');
                    let apellidosCombinados = datosCiudadano.apellidos || `${datosCiudadano.apellido_paterno || ''} ${datosCiudadano.apellido_materno || ''}`.trim();
                    $("#Apellidos").val(apellidosCombinados);
                    
                    // Bloqueamos campos para mantener integridad de los datos existentes
                    $("#Nombres, #Apellidos").prop("readonly", true);
                    
                    if (typeof speak === "function") {
                        speak(`Ciudadano ${datosCiudadano.nombres || ''} recuperado del sistema.`);
                    }
                    $("#MotivoSelect").focus();
                },
                404: function() {
                    console.log("-> DNI no encontrado en el historial local (404). Evaluando si se usa API externa...");
                    evaluarApiExterna(dni, busquedaApiActivada);
                }
            },
            error: function(xhr, textStatus, errorThrown) {
                // Si falla por otra razón que no sea 404 (ej. el endpoint no está programado en el backend todavía)
                if (xhr.status !== 404) {
                    console.warn("-> Error de conexión con el servidor local. Evaluando API externa de todos modos...");
                    evaluarApiExterna(dni, busquedaApiActivada);
                }
            }
        });
    }

    // FUNCIÓN AUXILIAR: Se ejecuta solo si el ciudadano NO tiene historial en tu base de datos local
    function evaluarApiExterna(dni, apiActivada) {
        if (!apiActivada) {
            console.log("-> API APAGADA: Modo manual activo para nuevo ciudadano. Pasando al campo Nombres.");
            // Dejamos las cajas libres y editables para que el operador escriba a mano
            $("#Nombres, #Apellidos").val('').prop("readonly", false);
            $("#Nombres").focus();
            return;
        }

        console.log("-> API ENCENDIDA: Consultando API Externa (Reniec) para DNI:", dni);
        
        $.ajax({
            url: `${API_BASE_URL}/ciudadano/${dni}`, // Endpoint puente hacia la API externa
            method: 'GET',
            success: function(res) {
                console.log("-> API Externa respondió con éxito:", res);
                if (res) {
                    $("#Nombres").val(res.nombres || '');
                    
                    let apellidosCombinados = res.apellidos || `${res.apellido_paterno || ''} ${res.apellido_materno || ''}`.trim();
                    $("#Apellidos").val(apellidosCombinados);
                    
                    $("#Nombres, #Apellidos").prop("readonly", true);
                    
                    if (typeof speak === "function") {
                        speak(`Ciudadano ${res.nombres || ''} identificado por API.`);
                    }
                    $("#MotivoSelect").focus();
                }
            },
            error: function(err) {
                console.error("-> La API externa tampoco encontró el DNI:", err);
                $("#Nombres, #Apellidos").val('').prop("readonly", false);
                $("#Nombres").focus();
            }
        });
    }

    // Evento A: Captura cuando el usuario presiona ENTER en la casilla DNI
    $("#Dni").on("keypress", function(e) {
        if (e.which === 13) { 
            e.preventDefault(); // Evita que el formulario se envíe antes de tiempo
            ejecutarBusquedaDni();
        }
    });

    // Evento B: Captura cuando el usuario cambia de casilla (clic afuera o tabulación)
    $("#Dni").on("blur", function() {
        if ($(this).val().trim().length > 0) {
            ejecutarBusquedaDni();
        }
    });

    // --- ENVIAR REGISTRO ---
    $("#formAsistencia").on("submit", function(e) {
        e.preventDefault();

        const motivoSeleccionado = $("#MotivoSelect").val();
        const motivoFinal = (motivoSeleccionado === "Otro") ? $("#MotivoVisita").val().trim() : motivoSeleccionado;

        const apellidosInput = $("#Apellidos").val().trim();
        const partesApellidos = apellidosInput.split(/\s+/);
        const paterno = partesApellidos[0] || "No especificado";
        const materno = partesApellidos.slice(1).join(" ") || "No especificado";

        const datos = {
            dni: $("#Dni").val().trim(),
            nombres: $("#Nombres").val().trim(),
            apellido_paterno: paterno, 
            apellido_materno: materno, 
            motivo: motivoFinal,
            id_funcionario: 1,
            origen_dato: "api"               
        };

        $.ajax({
            url: `${API_BASE_URL}/visitas`,
            type: "POST",
            data: datos, 
            success: () => {
                Swal.fire({ title: '¡Registrado!', icon: 'success', confirmButtonColor: '#BF0909' });
                $("#formAsistencia")[0].reset();
                $('#contenedorMotivoOtro').hide(); 
                $("#Nombres, #Apellidos").prop("readonly", false);
                listarVisitas();
                speak("Ingreso registrado con éxito.");
                // Restablecemos el texto de estado visual de la API según se haya quedado el interruptor
                actualizarTextoEstado();
            },
            error: (xhr) => {
                console.error(xhr.responseText);
                alert("Error al guardar. Revisa la consola.");
            }
        });
    });

    // --- 4. INICIALIZACIÓN ---
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-PE';
        recognition.onstart = () => $('#btnMicMotivo i').addClass('fa-fade text-danger');
        recognition.onresult = (e) => $('#MotivoVisita').val(($('#MotivoVisita').val() + ' ' + e.results[0][0].transcript).trim());
        recognition.onend = () => $('#btnMicMotivo i').removeClass('fa-fade text-danger');
        $('#btnMicMotivo').on('click', () => { try { recognition.start(); } catch(e) {} });
    }

    updateAuthUI();
    listarVisitas();
    
    // Ejecución inicial para pintar "Desactivado" al cargar la vista
    actualizarTextoEstado();
});