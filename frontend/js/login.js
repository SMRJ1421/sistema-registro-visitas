// ========================================
// LOGIN.JS
// Sistema Registro de Visitas - Con Soporte 2FA (Gmail)
// ========================================


// ========================================
// CONFIGURACIÓN
// ========================================

const URL_API_LOGIN = "http://127.0.0.1:8000/api/auth/login";
const URL_API_VERIFICAR_2FA = "http://127.0.0.1:8000/api/auth/verificar2fa"; // <-- ACTUALIZADO CON LA RUTA EXACTA DEL CONTROLADOR

const VOICE_MODE_KEY = "registro_visitas_voz_activada";

const speechSynthesisSupported = "speechSynthesis" in window;


// ========================================
// VERIFICAR SESIÓN EXISTENTE
// ========================================

(function verificarSesion() {

    const token = localStorage.getItem("token_asistencia");

    if (!token) return;

    const rol = localStorage.getItem("usuario_rol");

    if (rol === "Administrador" || rol === "admin") {

        window.location.href = "admin.html";

    } else {

        window.location.href = "reportes.html";
    }

})();


// ========================================
// VOZ (FUNCIONES GLOBALES)
// ========================================

function isVoiceEnabled() {

    return localStorage.getItem(VOICE_MODE_KEY) === "true";
}

function setVoiceEnabled(enabled) {

    localStorage.setItem(
        VOICE_MODE_KEY,
        enabled ? "true" : "false"
    );

    updateVoiceButton();
}

function updateVoiceButton() {

    const button = $("#btnVoiceToggle");

    if (!button.length) return;

    if (isVoiceEnabled()) {

        button
            .removeClass("btn-outline-secondary")
            .addClass("btn-success");

        button.html(`
            <i class="fa-solid fa-volume-high me-1"></i>
            Voz activada
        `);

    } else {

        button
            .removeClass("btn-success")
            .addClass("btn-outline-secondary");

        button.html(`
            <i class="fa-solid fa-headphones-simple me-1"></i>
            Activar voz
        `);
    }
}

function speak(text) {

    if (!speechSynthesisSupported || !isVoiceEnabled()) {
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "es-PE";

    utterance.rate = 1;

    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(utterance);
}


// ========================================
// AUXILIAR CONTROL DE INTERFAZ
// ========================================

function restaurarBotonLogin(modo2FA = false) {

    setTimeout(() => {

        const textoBoton = modo2FA 
            ? `<i class="fa-solid fa-shield-halved me-2"></i> Verificar Código`
            : `<i class="fa-solid fa-right-to-bracket me-2"></i> Iniciar Sesión`;

        $("#btnSubmit")
            .prop("disabled", false)
            .html(textoBoton);

    }, 500);
}


// ========================================
// DOCUMENT READY
// ========================================

$(document).ready(function () {

    // Bandera de control para el flujo secuencial del Login
    let modo2FA = false;

    // ========================================
    // INICIALIZAR VOZ
    // ========================================

    if (!speechSynthesisSupported) {

        $("#btnVoiceToggle")
            .prop("disabled", true)
            .attr(
                "title",
                "Texto a voz no soportado"
            );
    }

    updateVoiceButton();


    // ========================================
    // ACTIVAR / DESACTIVAR VOZ
    // ========================================

    $("#btnVoiceToggle").on("click", function () {

        const enabled = !isVoiceEnabled();

        setVoiceEnabled(enabled);

        if (enabled) {

            speak(
                "Modo voz activado. Ingrese usuario y contraseña."
            );

        } else {

            window.speechSynthesis.cancel();
        }
    });


    // ========================================
    // MOSTRAR / OCULTAR PASSWORD
    // ========================================

    $("#btnTogglePassword").on("click", function () {

        // Fallback dinámico para interceptar por ID o por Atributo Name
        const passwordInput = $("#password").length ? $("#password") : ($("#txtPassword").length ? $("#txtPassword") : $("input[type='password']"));

        const eyeIcon = $("#eyeIcon");

        if (passwordInput.attr("type") === "password") {

            passwordInput.attr("type", "text");

            eyeIcon
                .removeClass("fa-eye")
                .addClass("fa-eye-slash");

        } else {

            passwordInput.attr("type", "password");

            eyeIcon
                .removeClass("fa-eye-slash")
                .addClass("fa-eye");
        }
    });


    // ========================================
    // DETECTAR CAPS LOCK
    // ========================================

    // Escucha de advertencia sobre mayúsculas adaptada a ambos formatos de ID comunes
    $("#password, #txtPassword").on("keyup", function (e) {

        const caps =
            e.originalEvent.getModifierState("CapsLock");

        if (caps) {

            $("#capsWarning").removeClass("d-none");

        } else {

            $("#capsWarning").addClass("d-none");
        }
    });


    // ========================================
    // ENTER GLOBAL
    // ========================================

    $(document).on("keypress", function (e) {

        // Verificar si la tecla presionada es Enter (13)
        if (e.which === 13) {

            // Evitar que el foco esté en un botón que duplique el evento
            e.preventDefault();

            // Si el botón ya está deshabilitado (buscando), no hacer nada
            if ($("#btnSubmit").prop("disabled")) {
                return;
            }

            // Disparar el submit de manera limpia
            $("#formLogin").trigger("submit");
        }
    });


    // ========================================
    // LOGIN (PROCESAMIENTO AJAX CONMUTABLE POR FLUJO 2FA)
    // ========================================

    $("#formLogin").on("submit", function (e) {

        e.preventDefault();

        // Extraer los inputs de usuario usando tus selectores híbridos estables de manera segura
        const inputUsuarioElement = $("#txtUsuario").length ? $("#txtUsuario") : ($("#username").length ? $("#username") : $("input[name='username']"));
        const rawUser = inputUsuarioElement.val();
        const usernameValue = rawUser ? rawUser.trim() : "";
        const rawPass = $("#txtPassword").length ? $("#txtPassword").val() : ($("#password").length ? $("#password").val() : $("input[name='password']").val());


        if (!modo2FA) {
            // =================================================================
            // FASE 1: ENVÍO DE CREDENCIALES TRADICIONALES
            // =================================================================

            $("#btnSubmit")
                .prop("disabled", true)
                .html(`
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Verificando credenciales...
                `);

            const loginData = {
                username: usernameValue,
                password: rawPass ? rawPass : ""
            };

            // Validar campos vacíos localmente en Fase 1
            if (!loginData.username || !loginData.password) {

                Swal.fire({
                    icon: "warning",
                    title: "Campos requeridos",
                    text: "Debe ingresar usuario y contraseña.",
                    confirmButtonColor: "#ffc107"
                });

                speak("Campos requeridos. Por favor, complete su usuario y contraseña.");
                restaurarBotonLogin(false);
                return;
            }

            // Procesamiento de Login Seguro hacia Laravel
            $.ajax({
                url: URL_API_LOGIN,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(loginData),
                dataType: 'json',
                success: function(response) {
                    if (response.success && response.requiere_2fa) {
                        console.log("Credenciales correctas, pasando a Fase 2FA.");
                        
                        // Alerta SweetAlert informativa integrada con la respuesta del Servidor
                        Swal.fire({
                            icon: "info",
                            title: "Código de Seguridad Requerido",
                            text: response.message,
                            confirmButtonColor: "#0d6efd"
                        }).then(() => {
                            // Cambiamos la bandera de control al cerrar la alerta
                            modo2FA = true;

                            // Transición visual mejorada vinculada exactamente con el HTML mejorado
                            $("#grupo-usuario").addClass("d-none");
                            $("#grupo-password").addClass("d-none");
                            
                            // Mostrar el contenedor del token 2FA y el botón de retorno
                            $("#grupo-codigo").removeClass("d-none");
                            $("#btnVolverLogin").removeClass("d-none");

                            // Actualizar textos dinámicos de cabecera de la tarjeta
                            $("#loginTitle").text("Validación de Identidad");
                            $("#loginSubtitle").text("Segundo factor de autenticación requerido");

                            // Reajustar foco y limpiar el valor previo si existiera
                            $("#codigo_2fa").val("").focus();

                            restaurarBotonLogin(true); // Modifica el botón a "Verificar Código"
                        });
                        
                        speak(response.message);
                    }
                },
                error: function(xhr) {
                    let mensaje = "Error interno del servidor.";
                    if (xhr.status === 401) {
                        mensaje = "Usuario o contraseña incorrectos.";
                    } else if (xhr.status === 403) {
                        mensaje = "La cuenta está deshabilitada.";
                    } else if (xhr.status === 0) {
                        mensaje = "No se pudo establecer conexión con el servidor de accesos.";
                    }
                    
                    Swal.fire({
                        icon: "error",
                        title: "Error de autenticación",
                        text: mensaje,
                        confirmButtonColor: "#dc3545"
                    });

                    speak(mensaje);
                    restaurarBotonLogin(false);
                }
            });
        } else {
            // =================================================================
            // FASE 2: VERIFICACIÓN DEL CÓDIGO 2FA RECIBIDO EN GMAIL
            // =================================================================

            // Corregido selector para capturar correctamente el input adaptado en login.html
            const codigoInput = $("#codigo_2fa").val() ? $("#codigo_2fa").val().trim() : "";

            if (codigoInput.length !== 6) {
                Swal.fire({
                    icon: "warning",
                    title: "Código incompleto",
                    text: "El código de seguridad enviado a su correo debe poseer exactamente 6 dígitos.",
                    confirmButtonColor: "#ffc107"
                });
                speak("Código incompleto. Ingrese los seis dígitos.");
                return;
            }

            $("#btnSubmit")
                .prop("disabled", true)
                .html(`
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Validando código de seguridad...
                `);

            const verificacionData = {
                username: usernameValue,
                codigo: codigoInput
            };

            $.ajax({
                url: URL_API_VERIFICAR_2FA,
                type: "POST",
                data: JSON.stringify(verificacionData),
                contentType: "application/json",
                dataType: "json",
                timeout: 10000,
                success: function (response) {
                    
                    // Almacenamos los tokens y credenciales regresadas por Laravel Sanctum
                    localStorage.setItem("token_asistencia", response.token);
                    localStorage.setItem("usuario_rol", response.rol);
                    localStorage.setItem("usuario_nombre", response.nombre_completo);

                    Swal.fire({
                        icon: "success",
                        title: "¡Acceso Autorizado!",
                        text: `Bienvenido(a), ${response.nombre_completo}`,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        // Redirección adaptada exactamente a tus roles finales
                        if (response.rol === "Administrador" || response.rol === "admin") {
                            window.location.href = "admin.html";
                        } else {
                            window.location.href = "reportes.html";
                        }
                    });
                },
                error: function (xhr) {
                    let mensajeError = "El código ingresado es incorrecto o ha expirado.";
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        mensajeError = xhr.responseJSON.message;
                    }

                    Swal.fire({
                        icon: "error",
                        title: "Verificación Fallida",
                        text: mensajeError,
                        confirmButtonColor: "#dc3545"
                    });

                    speak(mensajeError);
                    restaurarBotonLogin(true); // Mantenemos el botón en estado 2FA
                }
            });
        }
    });


    // ========================================
    // ACCIÓN: VOLVER ATRÁS DESDE LA PANTALLA 2FA
    // ========================================
    $(document).on("click", "#btnVolverLogin", function (e) {
        e.preventDefault();
        
        modo2FA = false;

        // Mostrar campos de credenciales tradicionales
        $("#grupo-usuario").removeClass("d-none");
        $("#grupo-password").removeClass("d-none");
        
        // Ocultar bloque del token 2FA y el botón de regreso
        $("#grupo-codigo").addClass("d-none");
        $(this).addClass("d-none");

        // Restaurar títulos de la tarjeta
        $("#loginTitle").text("Control de Accesos");
        $("#loginSubtitle").text("Ingrese sus credenciales del sistema");

        // Limpiar el campo del código y restaurar el botón primario
        $("#codigo_2fa").val("");
        restaurarBotonLogin(false);
        
        speak("Retornando a pantalla de credenciales.");
    });


    // ========================================
    // HELP BOT
    // ========================================

    $("#helpToggle").on("click", function () {

        $("#helpPanel").toggle();
    });

    $("#helpClose").on("click", function () {

        $("#helpPanel").hide();
    });

    $(document).on("click", ".help-cmd", function () {

        const cmd = $(this).data("cmd");

        switch (cmd) {

            case "usuario":

                window.location.href =
                    "recovery-username.html";

                break;


            case "contrasena":

                window.location.href =
                    "recovery-password.html";

                break;


            case "soporte":

                window.location.href =
                    "mailto:soporte@institucion.local?subject=Soporte Login";

                break;
        }
    });

});