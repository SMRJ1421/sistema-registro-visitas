// ==========================================================================
// PORTAL PÚBLICO - ASIGNACIÓN DE CLICK EVENTS (index.js)
// ==========================================================================

$(document).ready(function () {

    // Redirección a Reportes Públicos
    $("#cardReportes").on("click", function () {
        window.location.href = "reportes.html";
    });

    // Redirección a Gráficos Estadísticos
    $("#cardGraficos").on("click", function () {
        window.location.href = "graficos.html";
    });

    // Redirección al área de login exclusivo en la esquina superior
    $("#btnAccesoFuncionario").on("click", function (e) {
        e.stopPropagation();
        window.location.href = "login.html";
    });

});