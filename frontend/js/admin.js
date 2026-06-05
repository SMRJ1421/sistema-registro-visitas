/**
 * ==========================================================================
 * NÚCLEO DE COMPORTAMIENTO INTERACTIVO DEL PANEL DE ADMINISTRACIÓN
 * ==========================================================================
 */

const VOICE_MODE_KEY = 'registro_visitas_voz_activada';
const speechSynthesisSupported = 'speechSynthesis' in window;

// Funciones de Gestión de Voz
function isVoiceEnabled() { return localStorage.getItem(VOICE_MODE_KEY) === 'true'; }

function setVoiceEnabled(enabled) { 
    localStorage.setItem(VOICE_MODE_KEY, enabled ? 'true' : 'false'); 
    updateVoiceButton(); 
}

function updateVoiceButton() {
    const button = $('#btnVoiceToggle'); 
    if (!button.length) return;
    
    if (isVoiceEnabled()) { 
        button.addClass('active').html('<i class="fa-solid fa-volume-high mb-1"></i> Voz<br>activada'); 
    } else { 
        button.removeClass('active').html('<i class="fa-solid fa-headphones-simple mb-1"></i> Activar<br>voz'); 
    }
}

function speak(text) { 
    if (!speechSynthesisSupported || !isVoiceEnabled()) return; 
    const u = new SpeechSynthesisUtterance(text); 
    u.lang = 'es-PE'; 
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(u); 
}

$(document).ready(function() {
    // Inicialización del estado de voz
    setVoiceEnabled(false);
    if (!speechSynthesisSupported) $('#btnVoiceToggle').prop('disabled', true);
    updateVoiceButton();
    
    $('#btnVoiceToggle').on('click', function() { 
        const enabled = !isVoiceEnabled(); 
        setVoiceEnabled(enabled); 
        speak(enabled ? 'Modo voz activado.' : 'Modo voz desactivado.'); 
    });

    /**
     * Sistema de Gestión de Autenticación
     * Lógica pura: Solo gestiona el DOM basado en el estado de autenticación
     */
    function updateAuthButton() {
        const container = $('#authContainer');
        const token = localStorage.getItem('token_asistencia');
        const nombre = localStorage.getItem('usuario_nombre');
        
        if (token && nombre) {
            const nombreFormateado = nombre.replace(' ', '<br>');
            container.html(`
                <div class="dropdown">
                    <a href="#" class="btn-admin-panel dropdown-toggle d-flex align-items-center justify-content-center" 
                       id="btnUser" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fa-solid fa-user mb-1"></i> ${nombreFormateado}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" id="btnLogout">Cerrar sesión</a></li>
                    </ul>
                </div>
            `);
            
            $('#btnLogout').on('click', function(e) { 
                e.preventDefault();
                localStorage.removeItem('token_asistencia'); 
                localStorage.removeItem('usuario_nombre'); 
                window.location.href = 'login.html'; 
            });
        } else {
            container.html('<a href="login.html" class="btn-admin-panel">Iniciar<br>sesión</a>');
        }
    }
    
    updateAuthButton();
});

/**
 * Módulo del Bot de Ayuda
 */
(function() {
    $(document).ready(function() {
        $('#helpToggle').on('click', () => $('#helpPanel').toggle());
        $('#helpClose').on('click', () => $('#helpPanel').hide());
        
        $(document).on('click', '.help-cmd', function() {
            const routes = { 'registro': 'index.html', 'salidas': 'salidas.html', 'reportes': 'reportes.html', 'graficos': 'graficos.html' };
            const cmd = $(this).data('cmd');
            if (routes[cmd]) window.location.href = routes[cmd];
        });
    });
})();