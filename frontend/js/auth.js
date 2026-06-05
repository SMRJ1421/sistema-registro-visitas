$(document).ready(function() {
    // Simulamos la obtención del usuario (ajusta según cómo guardes tu sesión)
    const nombreUsuario = localStorage.getItem('nombre_usuario') || "Usuario";
    
    // Inyectamos el botón en el contenedor
    $('#authContainer').html(`
        <div class="btn-admin-panel" style="cursor: pointer;">
            <i class="fa-solid fa-user"></i>
            <span style="font-size: 0.65rem;">${nombreUsuario}</span>
        </div>
    `);
});