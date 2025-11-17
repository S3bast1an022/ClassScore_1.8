// ================================================================
// ARCHIVO: docente.js
// DESCRIPCIÓN:
//   Controla toda la lógica del panel del docente, incluyendo
//   gestión de notas, visualización de estudiantes, cursos,
//   horarios y perfil del docente.
// ================================================================

// ---------------------------------------------------------------
// EVENTO: DOMContentLoaded
// DESCRIPCIÓN:
//   Se ejecuta cuando el DOM está completamente cargado.
//   Asegura que todas las secciones y modales estén ocultos al cargar
//   la página. NO abre modales ni ejecuta funciones automáticamente.
//   También carga el nombre del usuario en el encabezado.
// ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function() {
  // Aseguramos que todas las secciones estén ocultas al cargar
  const secciones = document.querySelectorAll('.seccion');
  secciones.forEach(sec => {
    if (!sec.classList.contains('oculto')) {
      sec.classList.add('oculto');
    }
  });
  
  // Aseguramos que todos los modales estén cerrados al cargar
  const modales = document.querySelectorAll('.modal');
  modales.forEach(modal => {
    if (!modal.classList.contains('oculto')) {
      modal.classList.add('oculto');
    }
  });
  
  // Removemos la clase 'active' de todas las pestañas al cargar
  // para evitar que se muestre automáticamente ninguna sección
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Cargar el nombre del usuario en el encabezado
  cargarNombreUsuarioDocente();
});

// ---------------------------------------------------------------
// FUNCIÓN: cargarNombreUsuarioDocente
// DESCRIPCIÓN:
//   Carga el nombre del docente desde el perfil y lo muestra
//   en el encabezado como "Bienvenido, [Nombre]". También
//   actualiza el título de la página.
// ---------------------------------------------------------------
function cargarNombreUsuarioDocente() {
  fetch("panel_docente.php?accion=obtener_perfil")
    .then(response => response.json())
    .then(data => {
      if (data.success && data.nombre) {
        const nombreUsuario = data.nombre || 'Usuario';
        const headerTitulo = document.getElementById('header-titulo');
        if (headerTitulo) {
          headerTitulo.textContent = `Bienvenido, ${nombreUsuario}`;
        }
        // Actualizar el título de la página
        document.title = `Bienvenido, ${nombreUsuario} — Class Score`;
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar el nombre del usuario:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarSeccion
// DESCRIPCIÓN:
//   Muestra solo la sección del panel seleccionada (por su ID) y
//   oculta las demás secciones. Actualiza las pestañas activas
//   visualmente. Carga los datos necesarios para cada sección
//   SOLO cuando el usuario hace clic en la pestaña correspondiente.
// PARÁMETRO:
//   id → ID de la sección <section> que se desea mostrar.
// ---------------------------------------------------------------
function mostrarSeccion(id) {
  // Seleccionamos todas las secciones que tengan la clase .seccion
  const secciones = document.querySelectorAll('.seccion');
  
  // Ocultamos todas las secciones
  secciones.forEach(sec => sec.classList.add('oculto'));
  
  // Mostramos la sección seleccionada
  const seccionSeleccionada = document.getElementById(id);
  if (seccionSeleccionada) {
    seccionSeleccionada.classList.remove('oculto');
    
    // Scroll automático hacia la sección con animación suave
    setTimeout(() => {
      seccionSeleccionada.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else {
    console.error(`No se encontró la sección con ID: ${id}`);
    return;
  }
  
  // Actualizamos las pestañas indicadoras visualmente (no clickeables)
  const tabs = document.querySelectorAll('.tab-indicador');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    // Si el data-seccion coincide con la sección actual, la marcamos como activa
    if (tab.getAttribute('data-seccion') === id) {
      tab.classList.add('active');
      // Cambiar estilo cuando está activo
      tab.style.background = 'rgba(255, 255, 255, 0.25)';
      tab.style.borderRadius = '6px';
    } else {
      tab.style.background = 'transparent';
    }
  });
  
  // Cargamos los datos necesarios para cada sección SOLO cuando el usuario hace clic
  // NO se ejecuta automáticamente al cargar la página
  if (id === "editar") {
    cargarDatosEditar();
    modoEdicion = false;
  } else if (id === "perfil") {
    cargarPerfilDocente();
  } else if (id === "comunicados") {
    cargarComunicadosDocente();
  } else if (id === "estudiantes") {
    cargarEstudiantes();
  } else if (id === "cursos") {
    cargarCursosDocente();
  } else if (id === "horario") {
    cargarHorarioDocente();
  }
}

// ================================================================
// SECCIÓN: FUNCIONES DEL PERFIL DEL DOCENTE
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarPerfilDocente
// DESCRIPCIÓN:
//   Carga los datos del perfil del docente desde el servidor
//   y los muestra en el formulario de perfil.
// ---------------------------------------------------------------
function cargarPerfilDocente() {
  fetch("panel_docente.php?accion=obtener_perfil")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById('perfil-nombre-docente').value = data.nombre || '';
        document.getElementById('perfil-correo-docente').value = data.correo || '';
        document.getElementById('perfil-telefono-docente').value = data.telefono || '';
        document.getElementById('perfil-tipo-documento-docente').value = data.tipo_documento || '';
        document.getElementById('perfil-numero-documento-docente').value = data.numero_documento || '';
        
        if (data.profile_image && data.profile_image !== '') {
          document.getElementById('foto-perfil-docente').src = data.profile_image;
        } else {
          document.getElementById('foto-perfil-docente').src = './imagenes_de_pagina/sin_foto_perfil.jpeg';
        }
      } else {
        console.error("Error al cargar el perfil:", data.message);
        mostrarMensajePerfilDocente('Error al cargar el perfil', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar el perfil:", error);
      mostrarMensajePerfilDocente('Error al cargar el perfil', 'error');
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: toggleEditarPerfilDocente
// DESCRIPCIÓN:
//   Activa o desactiva el modo de edición del perfil del docente.
// ---------------------------------------------------------------
function toggleEditarPerfilDocente() {
  const btnEditar = document.getElementById('btn-editar-perfil-docente');
  const btnActualizar = document.getElementById('btn-actualizar-perfil-docente');
  const inputs = document.querySelectorAll('#form-perfil-docente input, #form-perfil-docente select');
  
  const estaEditando = btnEditar.textContent === 'Cancelar';
  
  if (estaEditando) {
    inputs.forEach(input => {
      input.readOnly = true;
      input.disabled = true;
    });
    btnEditar.textContent = 'Editar';
    btnActualizar.style.display = 'none';
    cargarPerfilDocente();
  } else {
    inputs.forEach(input => {
      input.readOnly = false;
      input.disabled = false;
    });
    btnEditar.textContent = 'Cancelar';
    btnActualizar.style.display = 'block';
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: actualizarPerfilDocente
// DESCRIPCIÓN:
//   Valida y envía los datos del perfil del docente al servidor
//   para actualizarlos.
// ---------------------------------------------------------------
function actualizarPerfilDocente() {
  const nombre = document.getElementById('perfil-nombre-docente').value.trim();
  const correo = document.getElementById('perfil-correo-docente').value.trim();
  const telefono = document.getElementById('perfil-telefono-docente').value.trim();
  const tipoDocumento = document.getElementById('perfil-tipo-documento-docente').value.trim();
  const numeroDocumento = document.getElementById('perfil-numero-documento-docente').value.trim();
  
  if (!nombre || !correo) {
    mostrarMensajePerfilDocente('El nombre y el correo son obligatorios', 'error');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    mostrarMensajePerfilDocente('El formato del correo no es válido', 'error');
    return;
  }
  
  if (numeroDocumento && !/^[0-9]+$/.test(numeroDocumento)) {
    mostrarMensajePerfilDocente('El número de documento solo debe contener números', 'error');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "actualizar_perfil");
  datos.append("nombre", nombre);
  datos.append("correo", correo);
  datos.append("telefono", telefono);
  datos.append("tipo_documento", tipoDocumento);
  datos.append("numero_documento", numeroDocumento);
  
  const btnActualizar = document.getElementById('btn-actualizar-perfil-docente');
  const textoOriginal = btnActualizar.textContent;
  btnActualizar.textContent = "Actualizando...";
  btnActualizar.disabled = true;
  
  fetch("panel_docente.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnActualizar.textContent = textoOriginal;
      btnActualizar.disabled = false;
      
      if (data.success) {
        mostrarMensajePerfilDocente('Perfil actualizado correctamente', 'success');
        toggleEditarPerfilDocente();
      } else {
        mostrarMensajePerfilDocente(data.message || 'Error al actualizar el perfil', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al actualizar el perfil:", error);
      mostrarMensajePerfilDocente('Error al actualizar el perfil', 'error');
      btnActualizar.textContent = textoOriginal;
      btnActualizar.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: actualizarPasswordDocente
// DESCRIPCIÓN:
//   Valida y actualiza la contraseña del docente.
// ---------------------------------------------------------------
function actualizarPasswordDocente() {
  const passwordActual = document.getElementById('password-actual-docente').value.trim();
  const passwordNueva = document.getElementById('password-nueva-docente').value.trim();
  const passwordConfirmar = document.getElementById('password-confirmar-docente').value.trim();
  
  if (!passwordActual) {
    mostrarMensajePasswordDocente('Debe ingresar la contraseña actual', 'error');
    return;
  }
  
  if (!passwordNueva || passwordNueva.length < 6) {
    mostrarMensajePasswordDocente('La nueva contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  if (passwordNueva !== passwordConfirmar) {
    mostrarMensajePasswordDocente('Las contraseñas no coinciden', 'error');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "actualizar_password");
  datos.append("password_actual", passwordActual);
  datos.append("password_nueva", passwordNueva);
  
  const btnPassword = document.querySelector('#form-password-docente button[type="button"]');
  const textoOriginal = btnPassword.textContent;
  btnPassword.textContent = "Actualizando...";
  btnPassword.disabled = true;
  
  fetch("panel_docente.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnPassword.textContent = textoOriginal;
      btnPassword.disabled = false;
      
      if (data.success) {
        mostrarMensajePasswordDocente('Contraseña actualizada correctamente', 'success');
        document.getElementById('form-password-docente').reset();
      } else {
        mostrarMensajePasswordDocente(data.message || 'Error al actualizar la contraseña', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al actualizar la contraseña:", error);
      mostrarMensajePasswordDocente('Error al actualizar la contraseña', 'error');
      btnPassword.textContent = textoOriginal;
      btnPassword.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: abrirModalFotoDocente
// DESCRIPCIÓN:
//   Abre el modal para subir una nueva foto de perfil del docente.
//   SOLO se ejecuta cuando el usuario hace clic en el botón
//   "Modificar foto de perfil" en la sección de Perfil.
//   NO se ejecuta automáticamente al cargar la página.
// ---------------------------------------------------------------
function abrirModalFotoDocente() {
  // Verificamos que el modal exista antes de intentar abrirlo
  const modal = document.getElementById('modal-foto-docente');
  if (!modal) {
    console.error("No se encontró el modal de foto del docente");
    return;
  }
  
  // Solo abrimos el modal si el usuario está en la sección de perfil
  const seccionPerfil = document.getElementById('perfil');
  if (!seccionPerfil || seccionPerfil.classList.contains('oculto')) {
    console.warn("El modal de foto solo se puede abrir desde la sección de Perfil");
    return;
  }
  
  // Abrimos el modal
  modal.classList.remove('oculto');
  
  // Agregamos evento para preview de imagen (solo una vez)
  const inputFoto = document.getElementById('input-foto-docente');
  if (inputFoto) {
    // Removemos listeners previos para evitar duplicados
    const nuevoInput = inputFoto.cloneNode(true);
    inputFoto.parentNode.replaceChild(nuevoInput, inputFoto);
    
    nuevoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const imgPreview = document.getElementById('img-preview-docente');
          if (imgPreview) {
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: cerrarModalFotoDocente
// DESCRIPCIÓN:
//   Cierra el modal de subida de foto de perfil del docente.
// ---------------------------------------------------------------
function cerrarModalFotoDocente() {
  const modal = document.getElementById('modal-foto-docente');
  modal.classList.add('oculto');
  document.getElementById('form-foto-docente').reset();
  document.getElementById('img-preview-docente').style.display = 'none';
}

// ---------------------------------------------------------------
// FUNCIÓN: subirFotoPerfilDocente
// DESCRIPCIÓN:
//   Valida y sube la foto de perfil del docente al servidor.
// ---------------------------------------------------------------
function subirFotoPerfilDocente() {
  const inputFoto = document.getElementById('input-foto-docente');
  const file = inputFoto.files[0];
  
  if (!file) {
    alert('Por favor seleccione una imagen');
    return;
  }
  
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!tiposPermitidos.includes(file.type)) {
    alert('Solo se permiten archivos JPG, JPEG o PNG');
    return;
  }
  
  const tamanioMaximo = 2 * 1024 * 1024;
  if (file.size > tamanioMaximo) {
    alert('La imagen no debe superar los 2MB');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "subir_foto_perfil");
  datos.append("foto", file);
  
  const btnSubir = document.querySelector('#form-foto-docente button[type="button"]');
  const textoOriginal = btnSubir.textContent;
  btnSubir.textContent = "Subiendo...";
  btnSubir.disabled = true;
  
  fetch("panel_docente.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnSubir.textContent = textoOriginal;
      btnSubir.disabled = false;
      
      if (data.success) {
        document.getElementById('foto-perfil-docente').src = data.imageUrl;
        cerrarModalFotoDocente();
        alert('Foto de perfil actualizada correctamente');
      } else {
        alert('Error: ' + (data.message || 'Error al subir la foto'));
      }
    })
    .catch(error => {
      console.error("❌ Error al subir la foto:", error);
      alert('Error al subir la foto');
      btnSubir.textContent = textoOriginal;
      btnSubir.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: togglePasswordDocente
// DESCRIPCIÓN:
//   Muestra u oculta la contraseña en el campo especificado.
//   Iconos: ◉ (mostrar cuando está oculta) y ◎ (ocultar cuando está visible)
// PARÁMETRO:
//   inputId → ID del campo de contraseña
// ---------------------------------------------------------------
function togglePasswordDocente(inputId) {
  const input = document.getElementById(inputId);
  const toggleBtn = input.nextElementSibling; // Botón toggle que está después del input
  if (input.type === 'password') {
    input.type = 'text'; // Cambiar a texto visible
    toggleBtn.textContent = '◎'; // Icono para ocultar contraseña (cuando está visible)
    toggleBtn.setAttribute('aria-label', 'Ocultar contraseña');
  } else {
    input.type = 'password'; // Cambiar a contraseña oculta
    toggleBtn.textContent = '◉'; // Icono para mostrar contraseña (cuando está oculta)
    toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajePerfilDocente
// DESCRIPCIÓN:
//   Muestra un mensaje en la sección de información personal del perfil.
// PARÁMETROS:
//   mensaje → Texto del mensaje
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajePerfilDocente(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-perfil-docente');
  mensajeElement.textContent = mensaje;
  mensajeElement.style.display = 'block';
  
  if (tipo === 'success') {
    mensajeElement.style.background = 'rgba(16,185,129,.12)';
    mensajeElement.style.color = '#10B981';
    mensajeElement.style.border = '1px solid rgba(16,185,129,.35)';
  } else {
    mensajeElement.style.background = 'rgba(220,53,69,.12)';
    mensajeElement.style.color = '#dc3545';
    mensajeElement.style.border = '1px solid rgba(220,53,69,.35)';
  }
  
  setTimeout(() => {
    mensajeElement.style.display = 'none';
  }, 5000);
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajePasswordDocente
// DESCRIPCIÓN:
//   Muestra un mensaje en la sección de cambio de contraseña del perfil.
// PARÁMETROS:
//   mensaje → Texto del mensaje
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajePasswordDocente(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-password-docente');
  mensajeElement.textContent = mensaje;
  mensajeElement.style.display = 'block';
  
  if (tipo === 'success') {
    mensajeElement.style.background = 'rgba(16,185,129,.12)';
    mensajeElement.style.color = '#10B981';
    mensajeElement.style.border = '1px solid rgba(16,185,129,.35)';
  } else {
    mensajeElement.style.background = 'rgba(220,53,69,.12)';
    mensajeElement.style.color = '#dc3545';
    mensajeElement.style.border = '1px solid rgba(220,53,69,.35)';
  }
  
  setTimeout(() => {
    mensajeElement.style.display = 'none';
  }, 5000);
}

// ================================================================
// SECCIÓN: FUNCIONES DEL MÓDULO DE NOTAS
// ================================================================

// Variable global para almacenar las actividades del curso seleccionado
let actividadesActuales = [];
let estudiantesActuales = [];
let notasActuales = {};

// ================================================================
// SECCIÓN: FUNCIONES DE GESTIÓN DE NOTAS (NUEVA IMPLEMENTACIÓN)
// ================================================================

// Variables globales para notas
let estudiantesNotas = [];
let actividadesNotas = [];
let notasEstudiantes = {}; // { "estudiante_id_actividad_id": { nota: X, porcentaje: Y } }
let modoEdicion = false;

// ---------------------------------------------------------------
// FUNCIÓN: cargarDatosEditar
// DESCRIPCIÓN:
//   Carga los datos iniciales cuando se entra a la sección de editar notas.
// ---------------------------------------------------------------
function cargarDatosEditar() {
  cargarCursosParaNotas();
  cargarPeriodosParaNotas();
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarCursosParaNotas
// DESCRIPCIÓN:
//   Carga la lista de cursos asignados al docente.
// ---------------------------------------------------------------
function cargarCursosParaNotas() {
  fetch("panel_docente.php?accion=cursos_docente")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('filtro-curso-notas');
      select.innerHTML = '<option value="">Seleccione un curso...</option>';
      
      if (data.success && data.cursos.length > 0) {
        data.cursos.forEach(curso => {
          const option = document.createElement('option');
          option.value = curso.id_curso;
          option.textContent = curso.nombre_curso;
          select.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar cursos:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarPeriodosParaNotas
// DESCRIPCIÓN:
//   Carga la lista de períodos académicos.
// ---------------------------------------------------------------
function cargarPeriodosParaNotas() {
  fetch("panel_docente.php?accion=listar_periodos")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('filtro-periodo-notas');
      select.innerHTML = '<option value="">Seleccione un periodo...</option>';
      
      if (data.success && data.periodos.length > 0) {
        data.periodos.forEach(periodo => {
          const option = document.createElement('option');
          option.value = periodo.id_periodo;
          option.textContent = periodo.nombre;
          select.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar periodos:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarEstudiantesYActividades
// DESCRIPCIÓN:
//   Carga estudiantes y actividades cuando se seleccionan curso y período.
// ---------------------------------------------------------------
function cargarEstudiantesYActividades() {
  const cursoId = document.getElementById('filtro-curso-notas').value;
  const periodoId = document.getElementById('filtro-periodo-notas').value;
  
  if (!cursoId || !periodoId) {
    document.getElementById('contenedor-tabla-notas').style.display = 'none';
    return;
  }
  
  // Cargar estudiantes del curso (ordenados alfabéticamente)
  fetch(`panel_docente.php?accion=estudiantes_docente&curso_id=${cursoId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        estudiantesNotas = (data.estudiantes || []).sort((a, b) => {
          return a.nombre.localeCompare(b.nombre);
        });
        cargarActividadesYNotas(cursoId, periodoId);
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar estudiantes:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarActividadesYNotas
// DESCRIPCIÓN:
//   Carga las actividades del curso/período y las notas de los estudiantes.
// ---------------------------------------------------------------
function cargarActividadesYNotas(cursoId, periodoId) {
  // Cargar actividades
  fetch(`panel_docente.php?accion=actividades_curso&curso_id=${cursoId}&periodo_id=${periodoId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        actividadesNotas = data.actividades || [];
        
        // Cargar notas si hay actividades
        if (actividadesNotas.length > 0) {
          const actividadIds = actividadesNotas.map(a => a.id_actividad).join(',');
          fetch(`panel_docente.php?accion=notas_estudiantes&actividad_ids=${actividadIds}`)
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                notasEstudiantes = {};
                data.notas.forEach(nota => {
                  const key = `${nota.estudiante_id}_${nota.actividad_id}`;
                  notasEstudiantes[key] = {
                    nota: nota.nota,
                    porcentaje: nota.porcentaje || 0
                  };
                });
              }
              renderizarTablaNotasCompleta();
            })
            .catch(error => {
              console.error("❌ Error al cargar notas:", error);
              renderizarTablaNotasCompleta();
            });
        } else {
          notasEstudiantes = {};
          renderizarTablaNotasCompleta();
        }
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar actividades:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: renderizarTablaNotasCompleta
// DESCRIPCIÓN:
//   Renderiza la tabla de notas dinámicamente:
//   Estudiante | Actividad1 (nombre+fecha, con nota) | Porcentaje1 | Actividad2 | Porcentaje2 | ...
//   La tabla se construye conforme se agregan actividades.
// ---------------------------------------------------------------
function renderizarTablaNotasCompleta() {
  const thead = document.getElementById('thead-notas');
  const tbody = document.getElementById('tbody-notas');
  
  // Limpiar tabla
  thead.innerHTML = '';
  tbody.innerHTML = '';
  
  // Crear fila de encabezado
  const tr = document.createElement('tr');
  
  // Primera columna: Estudiante
  const thEstudiante = document.createElement('th');
  thEstudiante.textContent = 'Estudiante';
  thEstudiante.style.minWidth = '200px';
  tr.appendChild(thEstudiante);
  
  // Columnas dinámicas para cada actividad: Actividad (nombre+fecha) | Porcentaje
  actividadesNotas.forEach(actividad => {
    // Columna Actividad (nombre + fecha)
    const thActividad = document.createElement('th');
    thActividad.style.minWidth = '200px';
    thActividad.innerHTML = `<div style="font-weight: 600; margin-bottom: 5px;">${actividad.nombre}</div><div style="font-size: 0.85em; color: #666;">${actividad.fecha_creacion || '—'}</div>`;
    tr.appendChild(thActividad);
    
    // Columna Porcentaje
    const thPorcentaje = document.createElement('th');
    thPorcentaje.textContent = 'Porcentaje';
    thPorcentaje.style.minWidth = '120px';
    tr.appendChild(thPorcentaje);
  });
  
  thead.appendChild(tr);
  
  // Crear filas para cada estudiante (ordenados alfabéticamente)
  estudiantesNotas.forEach(estudiante => {
    const trEstudiante = document.createElement('tr');
    
    // Primera columna: Nombre del estudiante
    const tdEstudiante = document.createElement('td');
    tdEstudiante.textContent = estudiante.nombre;
    tdEstudiante.style.fontWeight = '600';
    trEstudiante.appendChild(tdEstudiante);
    
    // Columnas por actividad: Actividad (con nota) | Porcentaje
    actividadesNotas.forEach(actividad => {
      const key = `${estudiante.id_estudiante}_${actividad.id_actividad}`;
      const notaData = notasEstudiantes[key] || {};
      
      // Celda Actividad (contiene el input de nota)
      const tdActividad = document.createElement('td');
      const inputNota = document.createElement('input');
      inputNota.type = 'number';
      inputNota.min = 0;
      inputNota.max = 50;
      inputNota.step = 0.1;
      inputNota.style.width = '100%';
      inputNota.style.padding = '8px';
      inputNota.style.border = '1px solid #d1d5db';
      inputNota.style.borderRadius = '4px';
      inputNota.value = notaData.nota || '';
      inputNota.disabled = !modoEdicion;
      inputNota.dataset.estudianteId = estudiante.id_estudiante;
      inputNota.dataset.actividadId = actividad.id_actividad;
      inputNota.placeholder = 'Nota';
      tdActividad.appendChild(inputNota);
      trEstudiante.appendChild(tdActividad);
      
      // Celda porcentaje (input editable solo en modo edición)
      const tdPorcentaje = document.createElement('td');
      const inputPorcentaje = document.createElement('input');
      inputPorcentaje.type = 'number';
      inputPorcentaje.min = 0;
      inputPorcentaje.max = 100;
      inputPorcentaje.step = 0.01;
      inputPorcentaje.style.width = '100%';
      inputPorcentaje.style.padding = '8px';
      inputPorcentaje.style.border = '1px solid #d1d5db';
      inputPorcentaje.style.borderRadius = '4px';
      // El porcentaje viene de la nota guardada o de la actividad
      inputPorcentaje.value = notaData.porcentaje || actividad.porcentaje || '';
      inputPorcentaje.disabled = !modoEdicion;
      inputPorcentaje.dataset.actividadId = actividad.id_actividad;
      inputPorcentaje.dataset.estudianteId = estudiante.id_estudiante;
      inputPorcentaje.placeholder = '%';
      if (!modoEdicion) {
        inputPorcentaje.style.background = '#f9fafb';
        inputPorcentaje.style.color = '#666';
      }
      tdPorcentaje.appendChild(inputPorcentaje);
      trEstudiante.appendChild(tdPorcentaje);
    });
    
    tbody.appendChild(trEstudiante);
  });
  
  // Mostrar tabla
  document.getElementById('contenedor-tabla-notas').style.display = 'block';
  
  // Actualizar estado de botones
  document.getElementById('btn-editar-notas').style.display = modoEdicion ? 'none' : 'inline-block';
  document.getElementById('btn-guardar-notas').style.display = modoEdicion ? 'inline-block' : 'none';
}

// ---------------------------------------------------------------
// FUNCIÓN: toggleEditarNotas
// DESCRIPCIÓN:
//   Activa/desactiva el modo de edición de notas.
// ---------------------------------------------------------------
function toggleEditarNotas() {
  modoEdicion = true;
  renderizarTablaNotasCompleta();
}

// ---------------------------------------------------------------
// FUNCIÓN: guardarNotas
// DESCRIPCIÓN:
//   Guarda todas las notas con sus porcentajes en la tabla notas_actividades.
//   Cada nota se guarda con su porcentaje correspondiente.
// ---------------------------------------------------------------
function guardarNotas() {
  const notasAGuardar = [];
  const notasMap = {}; // Para agrupar notas y porcentajes por estudiante y actividad
  
  // Recopilar todas las notas
  const inputsNotas = document.querySelectorAll('#tbody-notas input[type="number"]:not([disabled])');
  inputsNotas.forEach(input => {
    const estudianteId = input.dataset.estudianteId;
    const actividadId = input.dataset.actividadId;
    const valor = input.value.trim();
    
    if (!estudianteId || !actividadId || valor === '') return;
    
    const key = `${estudianteId}_${actividadId}`;
    
    // Determinar si es nota o porcentaje por el max del input
    const esNota = input.max === '50';
    const esPorcentaje = input.max === '100';
    
    if (!notasMap[key]) {
      notasMap[key] = {
        estudiante_id: estudianteId,
        actividad_id: actividadId,
        nota: null,
        porcentaje: null
      };
    }
    
    if (esNota) {
      notasMap[key].nota = parseFloat(valor);
    } else if (esPorcentaje) {
      notasMap[key].porcentaje = parseFloat(valor);
    }
  });
  
  // Convertir el mapa a array y filtrar solo los que tienen nota
  Object.values(notasMap).forEach(item => {
    if (item.nota !== null && item.nota !== undefined) {
      notasAGuardar.push({
        estudiante_id: item.estudiante_id,
        actividad_id: item.actividad_id,
        nota: item.nota,
        porcentaje: item.porcentaje || 0
      });
    }
  });
  
  if (notasAGuardar.length === 0) {
    mostrarMensajeNotas('No hay cambios para guardar', 'error');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "guardar_notas");
  datos.append("notas", JSON.stringify(notasAGuardar));
  
  const btnGuardar = document.getElementById('btn-guardar-notas');
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.textContent = "Guardando...";
  btnGuardar.disabled = true;
  
  fetch("panel_docente.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
      
      if (data.success) {
        mostrarMensajeNotas('Notas y porcentajes guardados correctamente', 'success');
        modoEdicion = false;
        const cursoId = document.getElementById('filtro-curso-notas').value;
        const periodoId = document.getElementById('filtro-periodo-notas').value;
        cargarActividadesYNotas(cursoId, periodoId);
      } else {
        mostrarMensajeNotas(data.message || 'Error al guardar las notas', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al guardar notas:", error);
      mostrarMensajeNotas('Error al guardar las notas', 'error');
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: abrirModalCrearActividad
// DESCRIPCIÓN:
//   Abre el modal para crear una nueva actividad.
// ---------------------------------------------------------------
function abrirModalCrearActividad() {
  const cursoId = document.getElementById('filtro-curso-notas').value;
  const periodoId = document.getElementById('filtro-periodo-notas').value;
  
  if (!cursoId || !periodoId) {
    alert('Debe seleccionar un curso y período primero');
    return;
  }
  
  // Cargar porcentaje disponible
  actualizarPorcentajeDisponible();
  
  document.getElementById('modal-actividad').classList.remove('oculto');
}

// ---------------------------------------------------------------
// FUNCIÓN: cerrarModalActividad
// DESCRIPCIÓN:
//   Cierra el modal de creación de actividad.
// ---------------------------------------------------------------
function cerrarModalActividad() {
  document.getElementById('modal-actividad').classList.add('oculto');
  document.getElementById('form-actividad').reset();
  document.getElementById('porcentaje-disponible').textContent = '';
}

// ---------------------------------------------------------------
// FUNCIÓN: actualizarPorcentajeDisponible
// DESCRIPCIÓN:
//   Actualiza el mensaje de porcentaje disponible al crear actividad.
// ---------------------------------------------------------------
function actualizarPorcentajeDisponible() {
  const cursoId = document.getElementById('filtro-curso-notas').value;
  const periodoId = document.getElementById('filtro-periodo-notas').value;
  const porcentajeInput = document.getElementById('porcentaje-actividad');
  const porcentajeNuevo = parseFloat(porcentajeInput.value) || 0;
  
  if (!cursoId || !periodoId) {
    return;
  }
  
  fetch(`panel_docente.php?accion=porcentaje_total&curso_id=${cursoId}&periodo_id=${periodoId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const porcentajeTotal = parseFloat(data.porcentaje_total) || 0;
        const nuevoTotal = porcentajeTotal + porcentajeNuevo;
        const disponible = 100 - porcentajeTotal;
        const mensaje = document.getElementById('porcentaje-disponible');
        
        if (porcentajeNuevo > 0) {
          mensaje.textContent = `Porcentaje usado: ${porcentajeTotal.toFixed(2)}% | Nuevo total: ${nuevoTotal.toFixed(2)}% | Disponible: ${disponible.toFixed(2)}%`;
          mensaje.style.color = nuevoTotal <= 100 ? '#666' : '#dc3545';
        } else {
          mensaje.textContent = `Porcentaje usado: ${porcentajeTotal.toFixed(2)}% | Disponible: ${disponible.toFixed(2)}%`;
          mensaje.style.color = '#666';
        }
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar porcentaje:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: crearActividad
// DESCRIPCIÓN:
//   Crea una nueva actividad académica.
// ---------------------------------------------------------------
function crearActividad() {
  const cursoId = document.getElementById('filtro-curso-notas').value;
  const periodoId = document.getElementById('filtro-periodo-notas').value;
  const nombre = document.getElementById('nombre-actividad').value.trim();
  const porcentaje = parseFloat(document.getElementById('porcentaje-actividad').value.trim());
  
  if (!cursoId || !periodoId) {
    alert('Debe seleccionar un curso y período primero');
    return;
  }
  
  if (!nombre || isNaN(porcentaje)) {
    alert('El nombre y el porcentaje son obligatorios');
    return;
  }
  
  if (porcentaje < 0 || porcentaje > 100) {
    alert('El porcentaje debe estar entre 0 y 100');
    return;
  }
  
  // Validar que no exceda el 100%
  fetch(`panel_docente.php?accion=porcentaje_total&curso_id=${cursoId}&periodo_id=${periodoId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const porcentajeTotal = parseFloat(data.porcentaje_total) || 0;
        const nuevoTotal = porcentajeTotal + porcentaje;
        
        if (nuevoTotal > 100) {
          alert(`El porcentaje total excedería el 100%. Actualmente hay ${porcentajeTotal.toFixed(2)}% asignado. Puede asignar máximo ${(100 - porcentajeTotal).toFixed(2)}%`);
          return;
        }
        
        // Crear la actividad
        const datos = new FormData();
        datos.append("accion", "crear_actividad");
        datos.append("curso_id", cursoId);
        datos.append("periodo_id", periodoId);
        datos.append("nombre", nombre);
        datos.append("descripcion", '');
        datos.append("porcentaje", porcentaje);
        
        const btnGuardar = document.querySelector('#form-actividad button[type="button"]');
        const textoOriginal = btnGuardar.textContent;
        btnGuardar.textContent = "Creando...";
        btnGuardar.disabled = true;
        
        fetch("panel_docente.php", {
          method: "POST",
          body: datos
        })
          .then(response => response.json())
          .then(data => {
            btnGuardar.textContent = textoOriginal;
            btnGuardar.disabled = false;
            
            if (data.success) {
              cerrarModalActividad();
              mostrarMensajeNotas('Actividad creada correctamente', 'success');
              // Recargar actividades y notas para actualizar la tabla
              const cursoId = document.getElementById('filtro-curso-notas').value;
              const periodoId = document.getElementById('filtro-periodo-notas').value;
              cargarActividadesYNotas(cursoId, periodoId);
            } else {
              alert('Error: ' + (data.message || 'Error al crear la actividad'));
            }
          })
          .catch(error => {
            console.error("❌ Error al crear actividad:", error);
            alert('Error al crear la actividad');
            btnGuardar.textContent = textoOriginal;
            btnGuardar.disabled = false;
          });
      }
    })
    .catch(error => {
      console.error("❌ Error al validar porcentajes:", error);
      alert('Error al validar los porcentajes');
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajeNotas
// DESCRIPCIÓN:
//   Muestra un mensaje en el módulo de notas.
// ---------------------------------------------------------------
function mostrarMensajeNotas(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-notas');
  mensajeElement.textContent = mensaje;
  mensajeElement.style.display = 'block';
  
  if (tipo === 'success') {
    mensajeElement.style.background = 'rgba(16,185,129,.12)';
    mensajeElement.style.color = '#10B981';
    mensajeElement.style.border = '1px solid rgba(16,185,129,.35)';
  } else {
    mensajeElement.style.background = 'rgba(220,53,69,.12)';
    mensajeElement.style.color = '#dc3545';
    mensajeElement.style.border = '1px solid rgba(220,53,69,.35)';
  }
  
  setTimeout(() => {
    mensajeElement.style.display = 'none';
  }, 5000);
}

// ================================================================
// SECCIÓN: FUNCIONES DE CURSOS Y HORARIOS
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarCursosDocente
// DESCRIPCIÓN:
//   Carga la lista de cursos asignados al docente con información
//   de número de estudiantes y promedio (nota final de todos los estudiantes).
//   Requiere que se seleccione un período académico para mostrar datos.
// ---------------------------------------------------------------
function cargarCursosDocente() {
  // Cargar períodos en el filtro si no están cargados
  const filtroPeriodo = document.getElementById('filtro-periodo-cursos');
  if (filtroPeriodo && filtroPeriodo.options.length <= 1) {
    cargarPeriodosParaCursos();
  }
  
  const periodoId = filtroPeriodo ? filtroPeriodo.value : '';
  
  // Si no hay período seleccionado, no mostrar nada
  if (!periodoId || periodoId === '') {
    const tbody = document.querySelector('#tabla-cursos-docente tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">Seleccione un período académico para ver los cursos</td></tr>';
    }
    return;
  }
  
  const url = `panel_docente.php?accion=cursos_docente&periodo_id=${periodoId}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const tbody = document.querySelector('#tabla-cursos-docente tbody');
      tbody.innerHTML = '';
      
      if (data.success && data.cursos.length > 0) {
        data.cursos.forEach(curso => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${curso.nombre_curso}</td>
            <td>${curso.descripcion || '—'}</td>
            <td>${curso.numero_estudiantes || 0}</td>
            <td>${parseFloat(curso.promedio || 0).toFixed(2)}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="4">No tiene cursos asignados para este período</td></tr>';
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar cursos:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarPeriodosParaCursos
// DESCRIPCIÓN:
//   Carga la lista de períodos académicos para el filtro de cursos.
//   Limpia el select antes de agregar opciones para evitar duplicados.
// ---------------------------------------------------------------
function cargarPeriodosParaCursos() {
  fetch("panel_docente.php?accion=listar_periodos")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('filtro-periodo-cursos');
      if (!select) return;
      
      // Limpiar el select (mantener solo la opción "Todos los períodos")
      const primeraOpcion = select.options[0];
      select.innerHTML = '';
      select.appendChild(primeraOpcion);
      
      if (data.success && data.periodos.length > 0) {
        data.periodos.forEach(periodo => {
          const option = document.createElement('option');
          option.value = periodo.id_periodo;
          option.textContent = periodo.nombre;
          select.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar periodos:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarHorarioDocente
// DESCRIPCIÓN:
//   Carga el horario del docente desde el servidor y lo muestra
//   en una tabla organizada por días de la semana.
// ---------------------------------------------------------------
function cargarHorarioDocente() {
  fetch("panel_docente.php?accion=horario_docente")
    .then(response => response.json())
    .then(data => {
      const tbody = document.querySelector('#tabla-horario-docente tbody');
      tbody.innerHTML = '';
      
      if (data.success && data.horarios.length > 0) {
        const diasSemana = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        data.horarios.forEach(horario => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${diasSemana[horario.dia_semana] || '—'}</td>
            <td>${horario.hora_inicio}</td>
            <td>${horario.hora_fin}</td>
            <td>${horario.nombre_curso || '—'}</td>
            <td>${horario.salon || '—'}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="5">No tiene horarios asignados</td></tr>';
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar horario:", error);
    });
}

// Variables globales para estudiantes
let estudiantesCompleto = [];
let actividadesEstudiantes = [];
let notasEstudiantesCompleto = {};

// ---------------------------------------------------------------
// FUNCIÓN: cargarEstudiantes
// DESCRIPCIÓN:
//   Carga los datos iniciales cuando se entra a la sección de estudiantes.
// ---------------------------------------------------------------
function cargarEstudiantes() {
  cargarCursosParaEstudiantes();
  cargarPeriodosParaEstudiantes();
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarCursosParaEstudiantes
// DESCRIPCIÓN:
//   Carga la lista de cursos asignados al docente para el filtro de estudiantes.
// ---------------------------------------------------------------
function cargarCursosParaEstudiantes() {
  fetch("panel_docente.php?accion=cursos_docente")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('filtro-curso-estudiantes');
      if (!select) return;
      
      select.innerHTML = '<option value="">Seleccione un curso...</option>';
      
      if (data.success && data.cursos.length > 0) {
        data.cursos.forEach(curso => {
          const option = document.createElement('option');
          option.value = curso.id_curso;
          option.textContent = curso.nombre_curso;
          select.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar cursos:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarPeriodosParaEstudiantes
// DESCRIPCIÓN:
//   Carga la lista de períodos académicos para el filtro de estudiantes.
// ---------------------------------------------------------------
function cargarPeriodosParaEstudiantes() {
  fetch("panel_docente.php?accion=listar_periodos")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('filtro-periodo-estudiantes');
      if (!select) return;
      
      select.innerHTML = '<option value="">Seleccione un periodo...</option>';
      
      if (data.success && data.periodos.length > 0) {
        data.periodos.forEach(periodo => {
          const option = document.createElement('option');
          option.value = periodo.id_periodo;
          option.textContent = periodo.nombre;
          select.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar periodos:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarEstudiantesCompleto
// DESCRIPCIÓN:
//   Carga la tabla completa de estudiantes con sus notas por actividad,
//   promedio y estado, filtrados por curso y periodo.
// ---------------------------------------------------------------
function cargarEstudiantesCompleto() {
  const cursoId = document.getElementById('filtro-curso-estudiantes')?.value || '';
  const periodoId = document.getElementById('filtro-periodo-estudiantes')?.value || '';
  
  if (!cursoId || !periodoId) {
    document.getElementById('contenedor-tabla-estudiantes').style.display = 'none';
    return;
  }
  
  // Cargar estudiantes del curso
  fetch(`panel_docente.php?accion=estudiantes_docente&curso_id=${cursoId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        estudiantesCompleto = data.estudiantes || [];
        cargarActividadesYNotasEstudiantes(cursoId, periodoId);
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar estudiantes:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarActividadesYNotasEstudiantes
// DESCRIPCIÓN:
//   Carga las actividades del curso/período y las notas de los estudiantes.
// ---------------------------------------------------------------
function cargarActividadesYNotasEstudiantes(cursoId, periodoId) {
  // Cargar actividades
  fetch(`panel_docente.php?accion=actividades_curso&curso_id=${cursoId}&periodo_id=${periodoId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        actividadesEstudiantes = data.actividades || [];
        
        // Cargar notas si hay actividades
        if (actividadesEstudiantes.length > 0) {
          const actividadIds = actividadesEstudiantes.map(a => a.id_actividad).join(',');
          fetch(`panel_docente.php?accion=notas_estudiantes&actividad_ids=${actividadIds}`)
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                notasEstudiantesCompleto = {};
                data.notas.forEach(nota => {
                  const key = `${nota.estudiante_id}_${nota.actividad_id}`;
                  notasEstudiantesCompleto[key] = nota.nota;
                });
              }
              renderizarTablaEstudiantesCompleta();
            })
            .catch(error => {
              console.error("❌ Error al cargar notas:", error);
              renderizarTablaEstudiantesCompleta();
            });
        } else {
          notasEstudiantesCompleto = {};
          renderizarTablaEstudiantesCompleta();
        }
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar actividades:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: renderizarTablaEstudiantesCompleta
// DESCRIPCIÓN:
//   Renderiza la tabla de estudiantes con: Nombre, cada actividad con su nota,
//   nota final (promedio ponderado) y estado (aprobado/reprobado).
//   Nota mínima para aprobar: 30
// ---------------------------------------------------------------
function renderizarTablaEstudiantesCompleta() {
  const thead = document.getElementById('thead-estudiantes');
  const tbody = document.getElementById('tbody-estudiantes');
  
  // Limpiar tabla
  thead.innerHTML = '';
  tbody.innerHTML = '';
  
  // Crear encabezados
  const tr = document.createElement('tr');
  const thNombre = document.createElement('th');
  thNombre.textContent = 'Nombre';
  thNombre.style.minWidth = '200px';
  tr.appendChild(thNombre);
  
  // Columnas para cada actividad
  actividadesEstudiantes.forEach(actividad => {
    const thActividad = document.createElement('th');
    thActividad.textContent = actividad.nombre;
    thActividad.style.minWidth = '120px';
    tr.appendChild(thActividad);
  });
  
  // Columna Nota Final
  const thNotaFinal = document.createElement('th');
  thNotaFinal.textContent = 'Nota Final';
  thNotaFinal.style.minWidth = '100px';
  tr.appendChild(thNotaFinal);
  
  // Columna Estado
  const thEstado = document.createElement('th');
  thEstado.textContent = 'Estado';
  thEstado.style.minWidth = '120px';
  tr.appendChild(thEstado);
  
  thead.appendChild(tr);
  
  // Crear filas para cada estudiante
  estudiantesCompleto.forEach(estudiante => {
    const trEstudiante = document.createElement('tr');
    
    // Columna nombre
    const tdNombre = document.createElement('td');
    tdNombre.textContent = estudiante.nombre;
    tdNombre.style.fontWeight = '600';
    trEstudiante.appendChild(tdNombre);
    
    // Calcular promedio ponderado
    let sumaPonderada = 0;
    let sumaPorcentajes = 0;
    
    // Columnas por actividad
    actividadesEstudiantes.forEach(actividad => {
      const tdActividad = document.createElement('td');
      const nota = notasEstudiantesCompleto[`${estudiante.id_estudiante}_${actividad.id_actividad}`];
      
      if (nota !== undefined && nota !== null && nota !== '') {
        tdActividad.textContent = parseFloat(nota).toFixed(2);
        tdActividad.style.textAlign = 'center';
        
        // Calcular para promedio ponderado
        const notaNum = parseFloat(nota);
        const porcentajeNum = parseFloat(actividad.porcentaje) || 0;
        sumaPonderada += (notaNum * porcentajeNum);
        sumaPorcentajes += porcentajeNum;
      } else {
        tdActividad.textContent = '—';
        tdActividad.style.textAlign = 'center';
        tdActividad.style.color = '#999';
      }
      
      trEstudiante.appendChild(tdActividad);
    });
    
    // Columna Nota Final (promedio ponderado)
    const tdNotaFinal = document.createElement('td');
    let notaFinal = 0;
    if (sumaPorcentajes > 0) {
      notaFinal = sumaPonderada / sumaPorcentajes;
    }
    tdNotaFinal.textContent = notaFinal > 0 ? notaFinal.toFixed(2) : '—';
    tdNotaFinal.style.textAlign = 'center';
    tdNotaFinal.style.fontWeight = '600';
    trEstudiante.appendChild(tdNotaFinal);
    
    // Columna Estado
    const tdEstado = document.createElement('td');
    const estado = notaFinal >= 30 ? 'Aprobado' : 'Reprobado';
    const estadoClass = notaFinal >= 30 ? 'ok' : 'warn';
    tdEstado.innerHTML = `<span class="badge ${estadoClass}">${estado}</span>`;
    tdEstado.style.textAlign = 'center';
    trEstudiante.appendChild(tdEstado);
    
    tbody.appendChild(trEstudiante);
  });
  
  // Mostrar tabla
  document.getElementById('contenedor-tabla-estudiantes').style.display = 'block';
}



// ---------------------------------------------------------------
// FUNCIÓN: cerrarSesion
// DESCRIPCIÓN:
//   Cierra la sesión del docente y redirige al login.
// ---------------------------------------------------------------
function cerrarSesion() {
  alert("Sesión cerrada correctamente");
  window.location.href = "index.html";
}



// ================================================================
// SECCIÓN: FUNCIONES DE COMUNICADOS (DOCENTE)
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarComunicadosDocente
// DESCRIPCIÓN:
//   Carga los comunicados publicados por el docente y otros.
// ---------------------------------------------------------------
function cargarComunicadosDocente() {
  fetch("panel_docente.php?accion=listar_comunicados")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        mostrarComunicadosDocente(data.comunicados);
      } else {
        console.error("Error al cargar comunicados:", data.message);
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar comunicados:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarComunicadosDocente
// DESCRIPCIÓN:
//   Muestra los comunicados en la tabla del panel docente.
// PARÁMETRO:
//   comunicados → Array de comunicados a mostrar
// ---------------------------------------------------------------
function mostrarComunicadosDocente(comunicados) {
  const tbody = document.getElementById('tbody-comunicados-docente');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (comunicados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No hay comunicados publicados</td></tr>';
    return;
  }
  
  comunicados.forEach(comunicado => {
    const tr = document.createElement('tr');
    const fecha = new Date(comunicado.fecha_publicacion).toLocaleDateString('es-ES');
    tr.innerHTML = `
      <td>${fecha}</td>
      <td>${comunicado.titulo}</td>
      <td>${comunicado.contenido.substring(0, 100)}${comunicado.contenido.length > 100 ? '...' : ''}</td>
      <td>${comunicado.nombre_autor || '—'}</td>
      <td>${comunicado.cargo_autor || '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------
// FUNCIÓN: abrirModalCrearComunicadoDocente
// DESCRIPCIÓN:
//   Abre el modal para crear un nuevo comunicado.
//   SOLO se ejecuta cuando el usuario hace clic en el botón
//   "+ Publicar nuevo comunicado" en la sección de Comunicados.
//   NO se ejecuta automáticamente al cargar la página.
// ---------------------------------------------------------------
function abrirModalCrearComunicadoDocente() {
  // Verificamos que el modal exista antes de intentar abrirlo
  const modal = document.getElementById('modal-crear-comunicado-docente');
  if (!modal) {
    console.error("No se encontró el modal de crear comunicado del docente");
    return;
  }
  
  // Solo abrimos el modal si el usuario está en la sección de comunicados
  const seccionComunicados = document.getElementById('comunicados');
  if (!seccionComunicados || seccionComunicados.classList.contains('oculto')) {
    console.warn("El modal de comunicado solo se puede abrir desde la sección de Comunicados");
    return;
  }
  
  // Abrimos el modal
  modal.classList.remove('oculto');
}

// ---------------------------------------------------------------
// FUNCIÓN: cerrarModalCrearComunicadoDocente
// DESCRIPCIÓN:
//   Cierra el modal de crear comunicado.
// ---------------------------------------------------------------
function cerrarModalCrearComunicadoDocente() {
  const modal = document.getElementById('modal-crear-comunicado-docente');
  if (!modal) return;
  modal.classList.add('oculto');
  const form = document.getElementById('form-comunicado-docente');
  if (form) form.reset();
}

// ---------------------------------------------------------------
// FUNCIÓN: guardarComunicadoDocente
// DESCRIPCIÓN:
//   Guarda un nuevo comunicado en la base de datos.
// ---------------------------------------------------------------
function guardarComunicadoDocente() {
  const titulo = document.getElementById('comunicado-titulo-docente')?.value.trim();
  const contenido = document.getElementById('comunicado-contenido-docente')?.value.trim();
  
  if (!titulo || !contenido) {
    alert('Debe completar todos los campos');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "crear_comunicado");
  datos.append("titulo", titulo);
  datos.append("contenido", contenido);
  
  const btnGuardar = document.querySelector('#form-comunicado-docente button[type="button"]');
  if (!btnGuardar) return;
  
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.textContent = "Publicando...";
  btnGuardar.disabled = true;
  
  fetch("panel_docente.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
      
      if (data.success) {
        mostrarMensajeComunicadosDocente('Comunicado publicado correctamente', 'success');
        cerrarModalCrearComunicadoDocente();
        // Actualizar automáticamente la tabla de comunicados
        cargarComunicadosDocente();
      } else {
        mostrarMensajeComunicadosDocente(data.message || 'Error al publicar el comunicado', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al publicar comunicado:", error);
      mostrarMensajeComunicadosDocente('Error al publicar el comunicado', 'error');
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajeComunicadosDocente
// DESCRIPCIÓN:
//   Muestra un mensaje en la sección de comunicados del docente.
// PARÁMETROS:
//   mensaje → Texto del mensaje
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajeComunicadosDocente(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-comunicados-docente');
  if (!mensajeElement) return;
  
  mensajeElement.textContent = mensaje;
  mensajeElement.style.display = 'block';
  
  if (tipo === 'success') {
    mensajeElement.style.background = 'rgba(16,185,129,.12)';
    mensajeElement.style.color = '#10B981';
    mensajeElement.style.border = '1px solid rgba(16,185,129,.35)';
  } else {
    mensajeElement.style.background = 'rgba(220,53,69,.12)';
    mensajeElement.style.color = '#dc3545';
    mensajeElement.style.border = '1px solid rgba(220,53,69,.35)';
  }
  
  setTimeout(() => {
    mensajeElement.style.display = 'none';
  }, 5000);
}
