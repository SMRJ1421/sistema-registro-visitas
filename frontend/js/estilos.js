// js/estilos.js

// 1. Obtener el contenedor global configurado en el CSS
const container = document.getElementById('container');
const cubes = [];
const NUM_CUBES = 65; 
const PUSH_RADIUS = 260; 

let mouseX = Infinity;
let mouseY = Infinity;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mouseleave', () => {
    mouseX = Infinity;
    mouseY = Infinity;
});

// 2. Crear y posicionar los cubos dinámicamente al cargar la página
if (container) {
    for (let i = 0; i < NUM_CUBES; i++) {
        const cube = document.createElement('div');
        cube.classList.add('cube');
        const size = Math.random() * 50 + 20; 
        const baseX = Math.random() * (window.innerWidth - size);
        const baseY = Math.random() * (window.innerHeight - size);
        cube.style.width = `${size}px`;
        cube.style.height = `${size}px`;
        cube.style.left = `${baseX}px`;
        cube.style.top = `${baseY}px`;
        container.appendChild(cube);
        cubes.push({ element: cube, baseX: baseX, baseY: baseY, currentX: baseX, currentY: baseY, size: size });
    }
}

// 3. Bucle de animación
function animate() {
    cubes.forEach(cube => {
        const dx = cube.currentX + cube.size / 2 - mouseX;
        const dy = cube.currentY + cube.size / 2 - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let targetX = cube.baseX;
        let targetY = cube.baseY;
        if (distance < PUSH_RADIUS) {
            const force = (PUSH_RADIUS - distance) / PUSH_RADIUS;
            const angle = Math.atan2(dy, dx);
            targetX += Math.cos(angle) * force * 125;
            targetY += Math.sin(angle) * force * 125;
        }
        cube.currentX += (targetX - cube.currentX) * 0.08;
        cube.currentY += (targetY - cube.currentY) * 0.08;
        const transformX = cube.currentX - cube.baseX;
        const transformY = cube.currentY - cube.baseY;
        cube.element.style.transform = `translate3d(${transformX}px, ${transformY}px, 0)`;
    });
    requestAnimationFrame(animate);
}

if (container) { animate(); }

// 4. Resize con debounce para evitar saturación de CPU
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        cubes.forEach(cube => {
            cube.baseX = Math.random() * (window.innerWidth - cube.size);
            cube.baseY = Math.random() * (window.innerHeight - cube.size);
            cube.element.style.left = `${cube.baseX}px`;
            cube.element.style.top = `${cube.baseY}px`;
        });
    }, 250);
});

/* =============================================================================
   5. GESTIÓN DE NAVEGACIÓN Y ESTADOS DE VOZ
   ============================================================================= */
document.addEventListener("DOMContentLoaded", function () {
    // A. Marcador de página activa: comparamos el atributo href con la URL actual
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".navbar-nav a");

    navLinks.forEach(link => {
        // Obtenemos el href del link (sin el dominio)
        const linkPath = link.getAttribute("href");
        if (linkPath && currentPath.includes(linkPath)) {
            link.classList.add("active");
        }
    });

    // B. Gestión de estado de voz
    const btnVoice = document.getElementById('btnVoiceToggle');
    if (btnVoice) {
        // Restaurar estado guardado
        if (localStorage.getItem('voiceActive') === 'true') {
            btnVoice.classList.add('active');
        }

        btnVoice.addEventListener('click', function() {
            this.classList.toggle('active');
            localStorage.setItem('voiceActive', this.classList.contains('active'));
        });
    }
});

// ==========================================================
// INTERACTIVIDAD DEL MENÚ DE USUARIO (ADMINISTRADOR)
// ==========================================================

// 1. Alternar la visibilidad del menú (Abrir / Cerrar)
function toggleDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// 2. Cerrar el menú automáticamente si el usuario hace clic en cualquier otra parte de la pantalla
window.addEventListener('click', function(event) {
    const container = document.querySelector('.user-profile-container');
    if (container && !container.contains(event.target)) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
});

// 3. Cargar dinámicamente el nombre del usuario al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Jalamos el nombre del administrador guardado en el Login (se asume 'usuario_nombre')
    const nombreGuardado = localStorage.getItem('usuario_nombre') || sessionStorage.getItem('usuario_nombre');
    const txtNombre = document.getElementById('navUsuarioNombre');
    
    // Si existe en la sesión, reemplazamos el texto estático por el real
    if (nombreGuardado && txtNombre) {
        txtNombre.textContent = nombreGuardado;
    }
});

// 4. Función encargada de limpiar la sesión y redirigir
function cerrarSesionDelSistema(event) {
    event.preventDefault();
    
    // Limpiamos los tokens y variables de sesión del navegador
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirección directa al login
    window.location.href = 'login.html'; 
}