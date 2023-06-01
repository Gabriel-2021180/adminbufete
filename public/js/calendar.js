  var calendar;
  var eventos = []; // Aquí se almacenarán todas las citas y reuniones
  var usuariosInvitados = [];
  document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      timeZone: 'local',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      },
      initialDate: new Date(),
      navLinks: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      editable: true,
      select: openSelectModal,
      eventClick: openEventModal,
      events: function (info, successCallback, failureCallback) {
        console.log('Preparando para cargar las citas y reuniones...');
        Promise.all([
          fetch('/citasJSON'),
          fetch('/reunionesJSON'),
        ])
          .then(async ([resCitas, resReuniones]) => {
            if (!resCitas.ok || !resReuniones.ok) {
              throw new Error('Error al cargar las citas y reuniones');
            }
            const citas = await resCitas.json();
            const reuniones = await resReuniones.json();
            citas.forEach((cita) => (cita.tipo = 'cita')); // Agregar un campo 'tipo' a cada cita
            reuniones.forEach((reunion) => (reunion.tipo = 'reunion')); // Agregar un campo 'tipo' a cada reunión
            eventos = [...citas, ...reuniones]; // Actualizar la variable eventos
            return eventos;
          })
          .then((eventos) => {
            console.log('Eventos antes de mapear:', eventos); // Agrega esto
            const events = eventos.map((evento) => {
              let fechaYHora;
              let fecha;
              let fechaInicio;
              let fechaFin;

              // Tratar tanto citas como reuniones de la misma manera
              fechaYHora = evento.fecha.split(', ');
              fecha = fechaYHora[0];
              fechaInicio = new Date(fecha + 'T' + evento.hora);
              fechaFin = new Date(fecha + 'T' + evento.horaFin);

              return {
                title: evento.motivo || evento.asunto,
                start: fechaInicio,
                end: fechaFin,
                allDay: false,
                description: evento.motivo || evento.asunto,
                extendedProps: {
                  estado: evento.estado,
                  horaFin: evento.horaFin,
                },
                color: evento.tipo === 'cita' ? 'blue' : 'red', // Azul para citas, rojo para reuniones
              };
            });

            console.log('EventosDespués de mapear:', events); // Agrega esto
            console.log('Eventos en el calendario:', calendar.getEvents());
            successCallback(events);
          })
          .catch((error) => {
            console.error('Error al cargar las citas y reuniones:', error);
            failureCallback(error);
          });
      },
    });

    function openSelectModal(info) {
      var selectModal = document.getElementById('selectModal');
      var citaBtn = document.getElementById('citaBtn');
      var reunionBtn = document.getElementById('reunionBtn');
      var closemodalbtn = document.getElementById('selectClose');
      selectModal.style.display = 'block';

      citaBtn.onclick = function () {
        selectModal.style.display = 'none';
        openModal(info, 'cita');
      };

      reunionBtn.onclick = function () {
        selectModal.style.display = 'none';
        openModal(info, 'reunion');
      };

      closemodalbtn.onclick = function () {
        closeModal('selectModal');
      };
    }
    
//inicio open modal
    function openModal(info, tipo) {
      var modal;
      var dateInput;
      var submitBtn;
      var closeBtn;
      var timeInput;
      var titleInput;
      var timeFinReunion;
      var clienteId;
      
      var today = new Date();
      var yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (tipo === 'cita') {
        // Muestra el modal de citas
        modal = document.getElementById('citaModal');
        dateInput = document.getElementById('date');
        submitBtn = document.getElementById('save-event');
        closeBtn = document.getElementById('xclose');
        timeInput = document.getElementById('time');
        titleInput = document.getElementById('title');
        clienteId = document.getElementById('cliente');
      } else if (tipo === 'reunion') {
        modal = document.getElementById('reunionModal');
        dateInput = document.getElementById('reunionDate');
        submitBtn = document.getElementById('save-reunion');
        closeBtn = document.getElementById('reunionClose');
        timeInput = document.getElementById('reunionTimeInicio');
        titleInput = document.getElementById('asuntoReunion');
        timeFinReunion = document.getElementById('reunionTimeFin');
        timeInput.addEventListener('change', function () {
          generateReunionTimes(timeInput.value, timeFinReunion);
        });
        generateReunionTimes(timeInput.value, timeFinReunion);
        var searchUserInput = document.getElementById('searchUser');
        searchUserInput.addEventListener('input', function () {
          var searchTerm = searchUserInput.value;
          if (searchTerm.length >= 3) { // Solo buscar si el término de búsqueda tiene al menos 3 caracteres
            fetch('/api/usuarios?search=' + searchTerm) // Asume que esta ruta devuelve los usuarios que coinciden con el término de búsqueda
              .then((response) => {
                if (!response.ok) {
                  throw new Error('Error al buscar usuarios');
                }
                return response.json();
              })
              .then((usuarios) => {
                // Llena la tabla con los resultados de la búsqueda
                var searchResultsTable = document.getElementById('searchResults');
                searchResultsTable.innerHTML = ''; // Limpia los resultados de búsqueda existentes
                usuarios.forEach((usuario) => {
                  var row = document.createElement('tr');
                  var nameCell = document.createElement('td');
                  nameCell.textContent = usuario.nombres; // Asume que el usuario tiene una propiedad 'nombre'
                  var actionCell = document.createElement('td');
                  var addButton = document.createElement('button');
                  addButton.textContent = 'Agregar';
                  addButton.onclick = function () {
                    // Agregar el usuario a la reunión
                    usuariosInvitados.push(usuario); // Agrega el usuario al array
                    addButton.remove(); // Elimina el botón de invitación
                  };
                  actionCell.appendChild(addButton);
                  row.appendChild(nameCell);
                  row.appendChild(actionCell);
                  searchResultsTable.appendChild(row);
                });
              })
              .catch((error) => {
                console.error('Error al buscar usuarios:', error);
              });
          }
        });
      }

      if (info.start < yesterday) {
        Swal.fire({
          title: 'Error',
          text: 'Solo puedes hacer citas para hoy y mañana.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }

      dateInput.value = info.startStr;
      modal.style.display = 'block';

      // Filtrar horarios entre 8:00 AM y 6:00 PM
      generateTimes(timeInput);
      fetch('/clientesDelAbogado') // Asume que esta ruta devuelve los clientes del abogado
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al cargar los clientes del abogado');
        }
        return response.json();
      })
      .then((clientes) => {
        // Llena el campo de selección con los clientes del abogado
        var clienteSelect = document.getElementById('cliente');
        clienteSelect.innerHTML = ''; // Limpia las opciones existentes
        clientes.forEach((cliente) => {
          var option = document.createElement('option');
          option.value = cliente._id;
          option.text = cliente.nombres; // Asume que el cliente tiene una propiedad 'nombre'
          clienteSelect.appendChild(option);
        });
      })
      .catch((error) => {
        console.error('Error al cargar los clientes del abogado:', error);
      });

      submitBtn.onclick = function (e) {
        e.preventDefault();

        var title = titleInput.value;
        var selectedTime = timeInput.value;
        var date = new Date('1970-01-01T' + selectedTime + 'Z');
        var endDate = new Date(date.getTime() + 30 * 60000); // Agrega 30 minutos
        var endTime =
          endDate.toISOString().split('T')[1].split(':')[0] +
          ':' +
          endDate.toISOString().split('T')[1].split(':')[1]; // Crea una cadena con la hora de finalización

        var event = {
          title: title,
          start: info.startStr + 'T' + selectedTime,
          end: info.startStr + 'T' + endTime,
          allDay: selectedTime === '',
        };

        // Validar la fecha y el intervalo de tiempo seleccionado
        if (!isValidDateTime(event.start, event.end, selectedTime)) {
          Swal.fire({
            title: 'Error',
            text: 'La hora seleccionada no está disponible.',
            icon: 'error',
            confirmButtonText: 'OK',
          });
          return;
        }

        // Agregar el evento al calendario y enviar al servidor
        calendar.addEvent(event);
        if (tipo === 'cita') {
          console.log('Preparando para guardar la cita...');
          console.log('Datos de la cita a guardar:', event);
          saveEvent(event, endTime);
        } else if (tipo === 'reunion') {
          console.log('Preparando para guardar la reunión...');
          console.log('Datos de la reunión a guardar:', event);
          saveReunion(event, endTime);
        }

        // Cerrar el modal
        closeModal(modal.id);
      };

      closeBtn.onclick = function () {
        closeModal(modal.id);
      };
    }
//fin de open modal
    function generateTimes(timeInput) {
      var start = 8; // Hora de inicio (8am)
      var end = 18; // Hora de fin (6pm)
      var interval = 10; // Intervalo de tiempo (10 minutos)
      var options = '';

      for (var hour = start; hour < end; hour++) {
        for (var minute = 0; minute < 60; minute += interval) {
          var time = (hour < 10 ? '0' : '') + hour + ':' + (minute < 10 ? '0' : '') + minute;
          options += '<option value="' + time + '">' + time + '</option>';
        }
      }

      // Actualizar el input de la hora con las nuevas opciones
      timeInput.innerHTML = options;
    }

    function closeModal(modalId) {
      var modal = document.getElementById(modalId);
      modal.style.display = 'none';
    }

    calendar.render();
    console.log('Antes de cargar citas'); // Agregar este mensaje de consola
  });

  function openEventModal(info) {
    console.log('Abriendo modal de información para el evento:', info.event);
    if (info.event.color === 'blue') {
      // Abrir el modal de detalles de la cita
      var eventModal = document.getElementById('eventModal');
      var eventClose = document.getElementById('eventClose');
      var eventMotivo = document.getElementById('eventMotivo');
      var eventFecha = document.getElementById('eventFecha');
      var eventHora = document.getElementById('eventHora');
      var eventEstado = document.getElementById('eventEstado');
      var eventHoraFin = document.getElementById('eventHoraFin');
      eventMotivo.textContent = 'Motivo: ' + info.event.title;
      eventFecha.textContent = 'Fecha: ' + info.event.start.toLocaleDateString();
      eventHora.textContent = 'Hora Inicio: ' + info.event.start.toLocaleTimeString();
      eventEstado.textContent = 'Estado: ' + info.event.extendedProps.estado;
      eventHoraFin.textContent = 'Hora Fin: ' + info.event.extendedProps.horaFin;
      eventModal.style.display = 'block';

      eventClose.onclick = function () {
        eventModal.style.display = 'none';
      };
    } else if (info.event.color === 'red') {
      // Abrir el modal de detalles de la reunión
      var reunionDetailsModal = document.getElementById('reunionDetailsModal');
      var reunionDetailsClose = document.getElementById('reunionDetailsClose');
      var reunionAsunto = document.getElementById('reunionAsunto');
      var reunionLugar = document.getElementById('reunionLugar');
      var reunionFecha = document.getElementById('reunionFecha');
      var reunionHoraInicio = document.getElementById('reunionHoraInicio');
      var reunionHoraFin = document.getElementById('reunionHoraFin');
      var reunionEstado = document.getElementById('reunionEstado');
      reunionAsunto.textContent = 'Asunto: ' + info.event.title;
      reunionLugar.textContent = 'Lugar: ' + info.event.extendedProps.lugar; // Ajusta la propiedad según corresponda
      reunionFecha.textContent = 'Fecha: ' + info.event.start.toLocaleDateString();
      reunionHoraInicio.textContent = 'Hora Inicio: ' + info.event.start.toLocaleTimeString();
      reunionEstado.textContent = 'Estado: ' + info.event.extendedProps.estado;
      reunionHoraFin.textContent = 'Hora Fin: ' + info.event.extendedProps.horaFin;
      reunionDetailsModal.style.display = 'block';

      reunionDetailsClose.onclick = function () {
        reunionDetailsModal.style.display = 'none';
      };
    }
  }

  function saveEvent(event, endTime) {
    var fechaSinZonaHoraria = document.getElementById('date').value;
    var selectedTime = document.getElementById('time').value;
    var title = document.getElementById('title').value;
    var clienteId = document.getElementById('cliente').value;

    if (title.trim() === '') {
      alert('Debes ingresar un motivo para la cita.');
      return;
    }

    // Verificar si la hora seleccionada y el intervalo de tiempo son válidos
    if (!isValidDateTime(event.start, event.end, selectedTime)) {
      Swal.fire({
        title: 'Error',
        text: 'La hora seleccionada no está disponible.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    // Verificar si la hora seleccionada está disponible
    console.log('Preparando para cargar las citas... en save event');
    fetch('/citasJSON')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al cargar las citas');
        }
        return response.json();
      })
      .then((citas) => {
        let isTimeAvailable = citas.every((cita) => {
          let citaFecha = new Date(cita.fecha);
          let citaHoraInicio = cita.hora.split(':').slice(0, 2).join(':'); // Extraer solo la hora y minutos
          let citaHoraFin = cita.horaFin.split(':').slice(0, 2).join(':'); // Extraer solo la hora y minutos
          let selectedTimeFin = endTime.split(':').slice(0, 2).join(':'); // Extraer solo la hora y minutos
          let selectedDate = new Date(fechaSinZonaHoraria);

          // Comparamos si la fecha y el intervalo de tiempo seleccionado se superponen con el de la cita
          return !(selectedDate.getTime() === citaFecha.getTime() && selectedTime >= citaHoraInicio && selectedTimeFin <= citaHoraFin);
        });

        const cita = {
          motivo: title,
          estado: 'pendiente',
          fecha: fechaSinZonaHoraria,
          hora: selectedTime,
          horafin: endTime,
          cliente: clienteId, 
        };

        console.log('Preparando para guardar la cita...');
        console.log('Datos de la cita a guardar:', cita);
        fetch('/citas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cita),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Error al guardar la cita');
            }
            return response.json();
          })
          .then((savedEvent) => {
            console.log('Cita guardada exitosamente:', savedEvent);
          })
          .catch((error) => {
            console.error('Error al guardar la cita:', error);
          });
      })
      .catch((error) => {
        console.error('Error al cargar las citas:', error);
      });
  }

 function saveReunion(event, endTime) {
    var reunionTimeFin = document.getElementById('reunionTimeFin').value;
    var fechaSinZonaHoraria = document.getElementById('reunionDate').value;
    var reunionTimeInicio = document.getElementById('reunionTimeInicio').value;
    var asuntoReunion = document.getElementById('asuntoReunion').value;
    var lugarReunion = document.getElementById('lugarReunion').value;

    if (asuntoReunion.trim() === '') {
      alert('Debes ingresar un asunto para la reunión.');
      return;
    }

    // Verificar si la hora seleccionada y el intervalo de tiempo son válidos
    if (!isValidDateTime(event.start, event.end, reunionTimeInicio)) {
      Swal.fire({
        title: 'Error',
        text: 'La hora seleccionada no está disponible.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    // Verificar si la hora seleccionada está disponible
    console.log('Preparando para cargar las reuniones... en save reunion');
    fetch('/reunionesJSON')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al cargar las reuniones');
        }
        return response.json();
      })
      .then((reuniones) => {
        let isTimeAvailable = reuniones.every((reunion) => {
          let reunionFecha = new Date(reunion.fecha);
          let reunionHoraInicio = reunion.hora.split(':').slice(0, 2).join(':'); // Extraer solo la hora y minutos
          let reunionHoraFin = reunion.horaFin.split(':').slice(0, 2).join(':'); // Extraer solo la hora y minutos
          let selectedTimeFin = endTime.split(':').slice(0, 2).join(':'); // Extraer solo la hora y minutos
          let selectedDate = new Date(fechaSinZonaHoraria);

          // Comparamos si la fecha y el intervalo de tiempo seleccionado se superponen con el de la reunión
          return !(selectedDate.getTime() === reunionFecha.getTime() && reunionTimeInicio >= reunionHoraInicio && selectedTimeFin <= reunionHoraFin);
        });

        const reunion = {
          asunto: asuntoReunion,
          estado: 'pendiente',
          fecha: fechaSinZonaHoraria,
          hora: reunionTimeInicio,
          horaFin: endTime,
          lugar: lugarReunion,
          usuarios: usuariosInvitados.map(usuario => usuario._id), // Enviar solo los IDs de los usuarios
        };

        console.log('Preparando para guardar la reunión...');
        console.log( reunion);
        fetch('/reuniones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reunion),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Error al guardar la reunión');
            }
            return response.json();
          })
          .then((savedEvent) => {
            console.log('Reunión guardada:', savedEvent);
          })
          .catch((error) => {
            console.error('Error al guardar la reunión:', error);
          });
      })
      .catch((error) => {
        console.error('Error al cargar las reuniones:', error);
      });
  }

  function isValidDateTime(start, end, selectedTime) {
    var events = calendar.getEvents(); // Obtener todos los eventos del calendario
    var isValid = true;

    for (var i = 0; i < events.length; i++) {
      var eventStart = events[i].start;
      var eventEnd = events[i].end;

      // Verificar si el evento se superpone con el rango de tiempo seleccionado
      if (eventStart <= end && eventEnd >= start) {
        // Si el evento se superpone, verificar si el tiempo seleccionado está dentro del rango del evento
        if (selectedTime >= eventStart && selectedTime <= eventEnd) {
          isValid = false;
          break;
        }
      }
    }

    return isValid;
  }

  function generateReunionTimes(selectedTime, timeFinReunion) {
    var options = '';
    var start = new Date('1970-01-01T' + selectedTime + 'Z');
    var end = new Date('1970-01-01T18:00Z'); // Hora de fin fija a las 6:00 PM

    while (start < end) {
      var time = start.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      options += '<option value="' + time + '">' + time + '</option>';
      start.setTime(start.getTime() + 30 * 60000); // Agrega 30 minutos
    }

    timeFinReunion.innerHTML = options;
  }
