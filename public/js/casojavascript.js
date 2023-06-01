
function verDocumento(documentoId) {
    
    fetch(`/get-documento-url/${documentoId}`)
      .then(response => response.json())
      .then(data => {
        // Abrir la URL firmada en una nueva pestaña
        window.open(data.url, '_blank');
      })
      .catch(error => {
        console.error(error);
        alert("Ocurrió un error al obtener la URL del documento");
      });
  }
  
  function borrarDocumento(documentoId) {
    if (confirm("¿Estás seguro de que quieres borrar este documento?")) {
      fetch(`/borrar-documento/${documentoId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert("Documento borrado exitosamente");
            location.reload();
          } else {
            alert("Error al borrar el documento");
          }
        })
        .catch(error => {
          console.error(error);
          alert("Ocurrió un error al borrar el documento");
        });
    }
  }
  