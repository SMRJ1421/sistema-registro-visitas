// Declaramos la constante una única vez de forma segura
const API_REPORTES = "http://127.0.0.1:8000/api/visitas/reportes";

$(document).ready(function() {
    
    // ==========================================================================
    // CONTROL DE AUTENTICACIÓN Y SEGURIDAD DE VISTAS (MENÚ SUPERIOR)
    // ==========================================================================
    const token = localStorage.getItem("token_asistencia");
    const rol = localStorage.getItem("usuario_rol");
    const nombreUsuario = localStorage.getItem("usuario_nombre");

    // EVALUACIÓN DE ROLES PARA DESPLIEGUE VISUAL DEL HEADER
    if (token && (rol === "Administrador" || rol === "admin")) {
        // SI ES ADMINISTRADOR: Se despliega la barra completa removiendo el 'd-none'
        $(".solo-admin").removeClass("d-none");
        
        // Seteamos el nombre del administrador en el contenedor de perfil nativo
        $("#navUsuarioNombre").text(nombreUsuario || "Administrador");
    } else {
        // SI ES CIUDADANO COMÚN: Aseguramos el aislamiento total del entorno administrativo
        $(".solo-admin").addClass("d-none");
        
        // Desarmamos el contenedor dropdown y renderizamos un botón plano de Iniciar Sesión
        $("#itemAutenticacionDinamica").html(`
            <button id="btnIniciarSesionEspectador" class="btn btn-outline-light px-3 py-2 rounded-pill shadow-sm fw-medium" type="button" style="font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.4); background-color: rgba(255, 255, 255, 0.15); color: white; transition: all 0.3s;">
                <i class="fa-solid fa-user-shield me-2"></i>Iniciar Sesión
            </button>
        `);

        // Evento de redirección directa al login para el espectador
        $("#btnIniciarSesionEspectador").on("click", function() {
            window.location.href = "login.html";
        });

        // Añadimos un efecto hover básico al botón dinámico de inicio de sesión
        $("#btnIniciarSesionEspectador").hover(
            function() { $(this).css({"background-color": "white", "color": "#bc1624"}); },
            function() { $(this).css({"background-color": "rgba(255, 255, 255, 0.15)", "color": "white"}); }
        );
    }

    // ==========================================================================
    // 1. Evento de Búsqueda y Filtrado (Actualizado con índice correlativo)
    // ==========================================================================
    $('#formFiltros').on('submit', function(e) {
        e.preventDefault();
        
        const params = {
            dni: $('#filtroDni').val().trim(),
            desde: $('#filtroDesde').val(),
            hasta: $('#filtroHasta').val()
        };

        // Mostrar indicador de carga estético adaptado a las 7 columnas actuales
        $('#tablaReportes').html('<tr><td colspan="7" class="p-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Consultando historial al servidor...</td></tr>');

        $.ajax({
            url: API_REPORTES,
            type: 'GET',
            data: params,
            dataType: 'json',
            success: function(data) {
                if (!data || data.length === 0) {
                    $('#tablaReportes').html('<tr><td colspan="7" class="p-4 text-warning fw-medium"><i class="fa-solid fa-circle-info me-2"></i>No se encontraron registros con los filtros seleccionados.</td></tr>');
                    return;
                }
                
                // Mapeo modificado: Usamos (v, index) para pintar el número correlativo de fila iniciando en 1
                let html = data.map((v, index) => `
                    <tr class="animate__animated animate__fadeIn">
                        <td class="text-center fw-bold text-muted" style="font-size: 0.9rem;">${index + 1}</td>
                        <td><span class="badge bg-light text-dark border">${v.fecha}</span></td>
                        <td><span class="badge bg-secondary" style="font-size: 0.9rem;">${v.dni || '--------'}</span></td>
                        <td class="text-start fw-medium">${v.nombres || ''} ${v.apellidos || ''}</td>
                        <td><span class="badge bg-light text-success border"><i class="fa-regular fa-clock me-1"></i>${v.hora_ingreso}</span></td>
                        <td>
                            ${v.hora_salida 
                                ? `<span class="badge bg-light text-danger border"><i class="fa-regular fa-clock me-1"></i>${v.hora_salida}</span>` 
                                : '<span class="badge bg-warning text-dark">En curso</span>'
                            }
                        </td>
                        <td class="text-start text-muted small">${v.motivo}</td>
                    </tr>
                `).join('');
                
                $('#tablaReportes').html(html);
            },
            error: function(xhr) {
                console.error("Error en reporte:", xhr);
                let msg = "Error de Red: No se pudo conectar con el servidor.";
                if (xhr.status === 500) msg = "Error interno del servidor (Tabla o columnas no encontradas).";
                
                $('#tablaReportes').html(`<tr><td colspan="7" class="p-4 text-danger fw-medium"><i class="fas fa-exclamation-triangle me-2"></i>${msg}</td></tr>`);
            }
        });
    });

    // ==========================================================================
    // 2. Función del Botón de Exportación PDF (MEJORADO CON LOGO LOCAL Y METADATOS)
    // ==========================================================================
    $('#btnExportarPDF').on('click', function() {
        const { jsPDF } = window.jspdf;
        
        const filasVisibles = $('#tablaReportes tr');
        if (filasVisibles.length === 0 || filasVisibles.find('td').length <= 1) {
            alert('No hay datos disponibles en la tabla para generar el PDF.');
            return;
        }

        // 1. Instanciamos el objeto de imagen y asignamos la ruta de la carpeta local
        const logoImg = new Image();
        logoImg.src = 'img/gob_pe_logo.png'; 

        // 2. Ejecutamos la construcción una vez la imagen haya cargado en la memoria del cliente
        logoImg.onload = function() {
            const doc = new jsPDF('p', 'pt', 'a4'); // Unidades en puntos (A4 mide 595 x 842 pt)

            // --- ENCABEZADO INSTITUCIONAL ---
            // Barra Roja Superior Oficial de la Identidad Gráfica Gob.pe (#C81D31)
            doc.setFillColor(200, 29, 49); 
            doc.rect(0, 0, 595, 15, 'F');
            
            // Renderizado del Isotipo local (Proporciones simétricas para el escudo institucional)
            doc.addImage(logoImg, 'PNG', 40, 22, 110, 36); 

            // --- BLOQUE DE METADATOS Y ADMINISTRADOR AUTENTICADO ---
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(85, 85, 85); // Gris corporativo discreto
            
            const fechaActual = new Date().toLocaleString('es-PE');
            const administradorActivo = nombreUsuario || "Rafael Jeyson Seguil Martinez";

            // Posicionamiento alineado a la derecha (Margen derecho en 555pt)
            doc.text(`Fecha de emisión: ${fechaActual}`, 555, 42, { align: "right" });
            doc.setFont("helvetica", "bold");
            doc.text(`Generado por: ${administradorActivo} (Administrador)`, 555, 54, { align: "right" });
            
            // Línea divisoria elegante que separa el encabezado del contenido
            doc.setDrawColor(211, 211, 211); // Gris claro #D3D3D3
            doc.setLineWidth(1);
            doc.line(40, 75, 555, 75); 

            // --- TÍTULOS DEL REPORTE ---
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(17, 17, 17); // Negro suave
            doc.text("SISTEMA DE REGISTRO DE VISITAS", 40, 98);
            
            doc.setFontSize(9.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text("Reporte Oficial de Control de Accesos - Trazabilidad de Ciudadanos", 40, 112);

            // --- EXTRACCIÓN DE DATOS DE LA TABLA ---
            const dataTabla = [];
            filasVisibles.each(function() {
                const cols = $(this).find('td');
                if (cols.length > 1) {
                    dataTabla.push([
                        $(cols[0]).text().trim(), // #
                        $(cols[1]).text().trim(), // Fecha
                        $(cols[2]).text().trim(), // DNI
                        $(cols[3]).text().trim(), // Visitante
                        $(cols[4]).text().trim(), // Ingreso
                        $(cols[5]).text().trim(), // Salida
                        $(cols[6]).text().trim()  // Motivo
                    ]);
                }
            });

            // --- CONSTRUCCIÓN DE LA TABLA AUTO-AJUSTABLE ---
            doc.autoTable({
                startY: 125,
                head: [['#', 'Fecha', 'DNI', 'Ciudadano Visitante', 'H. Ingreso', 'H. Salida', 'Motivo']],
                body: dataTabla,
                theme: 'striped',
                headStyles: { fillColor: [43, 54, 67], halign: 'center', valign: 'middle' },
                styles: { fontSize: 8.5, cellPadding: 6 },
                margin: { left: 40, right: 40 },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 30 },  // Numeración #
                    1: { halign: 'center', cellWidth: 65 },  // Fecha
                    2: { halign: 'center', cellWidth: 60 },  // DNI
                    3: { halign: 'left', cellWidth: 130 },   // Ciudadano Visitante
                    4: { halign: 'center', cellWidth: 50 },  // Hora Ingreso
                    5: { halign: 'center', cellWidth: 50 },  // Hora Salida
                    6: { halign: 'left' }                    // Motivo (Ancho dinámico)
                }
            });

            // Despacho del documento en una pestaña independiente
            const blob = doc.output('bloburl');
            window.open(blob, '_blank');
        };

        // Captura defensiva en caso de que el archivo sufra alteraciones de ruta o nombre
        logoImg.onerror = function() {
            alert("Error: No se pudo localizar la imagen en 'img/gob_pe_logo.png'. Asegúrate de que el archivo conserve ese nombre exacto.");
        };
    });

    // ==========================================================================
    // 3. Función del Botón de Exportación Excel (Actualizado para incluir la columna #)
    // ==========================================================================
    $('#btnExportarExcel').on('click', function() {
        const filasVisibles = $('#tablaReportes tr');
        if (filasVisibles.length === 0 || filasVisibles.find('td').length <= 1) {
            alert('No hay datos disponibles en la tabla para exportar a Excel.');
            return;
        }

        // Definir la fila de los nombres de columna incluyendo el N°
        const wbData = [
            ["N°", "Fecha", "DNI", "Ciudadano Visitante", "Hora de Ingreso", "Hora de Salida", "Motivo de la Visita"]
        ];

        // Recorrer el cuerpo e insertar los valores limpios de las 7 columnas
        filasVisibles.each(function() {
            const cols = $(this).find('td');
            if (cols.length > 1) {
                wbData.push([
                    parseInt($(cols[0]).text().trim()), // Forzar como número entero en Excel
                    $(cols[1]).text().trim(),
                    $(cols[2]).text().trim(),
                    $(cols[3]).text().trim(),
                    $(cols[4]).text().trim(),
                    $(cols[5]).text().trim(),
                    $(cols[6]).text().trim()
                ]);
            }
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wbData);

        // Ajuste automático del ancho de celdas
        const maxCols = wbData[0].map((_, i) => ({
            wch: Math.max(...wbData.map(row => row[i] ? row[i].toString().length : 10)) + 3
        }));
        const wsCols = maxCols;
        ws['!cols'] = wsCols;

        XLSX.utils.book_append_sheet(wb, ws, "Historial de Visitas");
        XLSX.writeFile(wb, `Reporte_Visitas_${new Date().toISOString().slice(0,10)}.xlsx`);
    });
});