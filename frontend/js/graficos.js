document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // CONTROL DE AUTENTICACIÓN Y SEGURIDAD DE VISTAS (MENÚ SUPERIOR)
    // ==========================================================================
    const token = localStorage.getItem("token_asistencia");
    const rol = localStorage.getItem("usuario_rol");
    const nombreUsuario = localStorage.getItem("usuario_nombre");

    const elementosAdmin = document.querySelectorAll(".solo-admin");
    const navUsuarioNombre = document.getElementById("navUsuarioNombre");
    const itemAutenticacionDinamica = document.getElementById("itemAutenticacionDinamica");

    // EVALUACIÓN DE ROLES PARA DESPLIEGUE VISUAL DEL HEADER
    if (token && (rol === "Administrador" || rol === "admin")) {
        // SI ES ADMINISTRADOR: Se despliega la barra completa removiendo el 'd-none'
        elementosAdmin.forEach(el => el.classList.remove("d-none"));
        
        // Seteamos el nombre del administrador en el contenedor de perfil nativo
        if (navUsuarioNombre) {
            navUsuarioNombre.textContent = nombreUsuario || "Administrador";
        }
    } else {
        // SI ES CIUDADANO COMÚN: Aseguramos el aislamiento total del entorno administrativo
        elementosAdmin.forEach(el => el.classList.add("d-none"));
        
        // Desarmamos el contenedor dropdown y renderizamos un botón plano de Iniciar Sesión
        if (itemAutenticacionDinamica) {
            itemAutenticacionDinamica.innerHTML = `
                <button id="btnIniciarSesionEspectador" class="btn btn-outline-light px-3 py-2 rounded-pill shadow-sm fw-medium" type="button" style="font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.4); background-color: rgba(255, 255, 255, 0.15); color: white; transition: all 0.3s;">
                    <i class="fa-solid fa-user-shield me-2"></i>Iniciar Sesión
                </button>
            `;

            const btnLogin = document.getElementById("btnIniciarSesionEspectador");
            
            // Evento de redirección directa al login para el espectador
            btnLogin.addEventListener("click", function() {
                window.location.href = "login.html";
            });

            // Añadimos un efecto hover básico al botón dinámico de inicio de sesión
            btnLogin.addEventListener("mouseenter", function() {
                this.style.backgroundColor = "white";
                this.style.color = "#bc1624";
            });
            btnLogin.addEventListener("mouseleave", function() {
                this.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                this.style.color = "white";
            });
        }
    }

    // ==========================================================================
    // === 1. CONFIGURACIÓN DEL GRÁFICO DE BARRAS (Visitas por Mes) ===
    // ==========================================================================
    const ctxBarras = document.getElementById('graficoBarras').getContext('2d');
    const chartBarras = new Chart(ctxBarras, {
        type: 'bar',
        data: {
            // Expandido a los 12 meses ya que el controlador envía el año completo
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Cantidad de Visitantes',
                data: array_fill_inicial(12), // Inicializa en 0 antes de recibir la data de la DB
                backgroundColor: '#BF0909', 
                borderColor: '#990000',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { precision: 0 } // Solo números enteros para conteo de personas
                }
            }
        }
    });

    // ==========================================================================
    // === 2. CONFIGURACIÓN DEL GRÁFICO DE PASTEL (Por Origen de Dato) ===
    // ==========================================================================
    const ctxPastel = document.getElementById('graficoPastel').getContext('2d');
    const chartPastel = new Chart(ctxPastel, {
        type: 'pie',
        data: {
            // Adaptado a las 3 categorías mapeadas en el backend ('api', 'excel', 'manual')
            labels: ['Registro API', 'Carga Excel', 'Ingreso Manual'],
            datasets: [{
                data: [0, 0, 0], // Inicializa en 0
                backgroundColor: ['#BF0909', '#1e2229', '#64748b'], 
            }]
        },
        options: {
            responsive: true
        }
    });

    // ==========================================================================
    // === 3. CONEXIÓN DINÁMICA CON LA BASE DE DATOS (API BACKEND) ===
    // ==========================================================================
    const API_URL = "http://127.0.0.1:8000/api/visitas/estadisticas";

    function cargarDatosReales() {
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // A. Inyectar datos en el gráfico de barras (Métricas mensuales)
                    chartBarras.data.datasets[0].data = data.visitas_mes;
                    chartBarras.update(); // Renderiza los cambios con animación

                    // B. Inyectar datos en el gráfico de pastel (Métricas por origen)
                    chartPastel.data.datasets[0].data = data.tipos_visitante;
                    chartPastel.update(); // Renderiza los cambios con animación
                }
            })
            .catch(error => {
                console.error("Error al conectar los gráficos con la DB:", error);
            });
    }

    // Helper sencillo para llenar arrays vacíos temporalmente
    function array_fill_inicial(limite) {
        return Array(limite).fill(0);
    }

    // Ejecutar la petición inmediatamente al cargar la interfaz
    cargarDatosReales();
});