document.addEventListener('DOMContentLoaded', function() {
    const inputDni = document.getElementById('dni'); // Asegúrate que tu input tenga id="dni"

    if (inputDni) {
        inputDni.addEventListener('input', function() {
            let dni = this.value;

            // Verificar si tiene 8 dígitos
            if (dni.length === 8) {
                // Hacemos la consulta al backend
                fetch('http://localhost/buscar-ciudadano/' + dni)
                    .then(response => response.json())
                    .then(data => {
                        if (data.existe) {
                            document.getElementById('nombres').value = data.nombres;
                            document.getElementById('apellidos').value = data.apellidos;
                        } else {
                            console.log('Ciudadano no encontrado en base de datos.');
                        }
                    })
                    .catch(error => console.error('Error al conectar con la API:', error));
            }
        });
    }
});