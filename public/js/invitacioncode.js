document.getElementById('generate-code-button').addEventListener('click', function() {
  // Generar un código aleatorio
  const code = Math.random().toString(36).substring(2, 10);

  // Enviar el código al servidor
  fetch('/invitationCodes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(response.status);
    }
    return response.json();
  })
  .then(data => {
    console.log(data);

    // Mostrar el código en el modal
    document.getElementById('invitation-code').textContent = code;

    // Mostrar el modal
    document.getElementById('invitation-code-modal').style.display = 'block';
  })
  .catch((error) => {
    if (error.message === '400') {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Has alcanzado el límite de 3 códigos de invitación por día',
      });
    } else {
      console.error('Error:', error);
    }
  });
});

  
  document.getElementById('copy-code-button').addEventListener('click', function() {
    // Copiar el código al portapapeles
    const code = document.getElementById('invitation-code').textContent;
    navigator.clipboard.writeText(code);
  });
  
  document.getElementById('close-modal-button').addEventListener('click', function() {
    // Cerrar el modal
    document.getElementById('invitation-code-modal').style.display = 'none';
  });
  