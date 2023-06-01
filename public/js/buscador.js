$(document).ready(function() {
    // Detecta cuando el valor del cuadro de búsqueda cambia
    $('#search-input').on('input', function() {
        // Obtiene el valor del cuadro de búsqueda
        var searchTerm = $(this).val();

        // Realiza una solicitud GET al servidor para buscar usuarios
        $.get('/usuarios', { searchTerm: searchTerm }, function(data) {
            // Actualiza la tabla de usuarios con los nuevos resultados
            $('#user-table').html(data);
        });
    });
});