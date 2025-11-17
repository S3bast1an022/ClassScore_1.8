// ================================================================
// ARCHIVO: estudiante.js
// DESCRIPCIÓN:
//   Controla toda la lógica del panel del estudiante, incluyendo
//   consulta de notas, visualización de horario, comunicados y
//   gestión del perfil del estudiante.
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
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    view.classList.add('oculto'); // Agregamos 'oculto' para ocultar
    view.classList.remove('active'); // Removemos 'active' por si acaso
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
  cargarNombreUsuarioEstudiante();
});

// ---------------------------------------------------------------
// FUNCIÓN: cargarNombreUsuarioEstudiante
// DESCRIPCIÓN:
//   Carga el nombre del estudiante desde el perfil y lo muestra
//   en el encabezado como "Bienvenido, [Nombre]". También
//   actualiza el título de la página.
// ---------------------------------------------------------------
function cargarNombreUsuarioEstudiante() {
  fetch("panel_estudiante.php?accion=obtener_perfil")
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
//   Muestra solo la sección del panel seleccionada y oculta las
//   demás secciones. Actualiza las pestañas activas visualmente.
//   Carga los datos necesarios para cada sección SOLO cuando el
//   usuario hace clic en la pestaña correspondiente.
// PARÁMETRO:
//   seccion → ID de la sección que se desea mostrar.
// ---------------------------------------------------------------
function mostrarSeccion(seccion) {
  // Ocultar todas las secciones usando la clase 'oculto'
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    view.classList.add('oculto');
    view.classList.remove('active'); // Removemos active por si acaso
  });
  
  // Mostrar la sección seleccionada removiendo la clase 'oculto'
  const viewSeleccionada = document.getElementById('view-' + seccion);
  if (viewSeleccionada) {
    viewSeleccionada.classList.remove('oculto');
    viewSeleccionada.classList.add('active'); // Agregamos active para estilos adicionales si es necesario
    
    // Scroll automático hacia la sección con animación suave
    setTimeout(() => {
      viewSeleccionada.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else {
    console.error(`No se encontró la sección con ID: view-${seccion}`);
    return;
  }
  
  // Actualizar pestañas indicadoras visualmente (no clickeables)
  const tabs = document.querySelectorAll('.tab-indicador');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    // Si el data-seccion coincide con la sección actual, la marcamos como activa
    if (tab.getAttribute('data-seccion') === seccion) {
      tab.classList.add('active');
      // Cambiar estilo cuando está activo
      tab.style.background = 'rgba(255, 255, 255, 0.25)';
      tab.style.borderRadius = '6px';
    } else {
      tab.style.background = 'transparent';
    }
  });
  
  // Cargar datos cuando se muestra una sección SOLO cuando el usuario hace clic
  // NO se ejecuta automáticamente al cargar la página
  if (seccion === 'notas') {
    cargarMateriasEstudiante();
    cargarPeriodosParaNotasEstudiante();
  } else if (seccion === 'horario') {
    cargarHorarioEstudiante();
  } else if (seccion === 'comunicados') {
    cargarComunicados();
  } else if (seccion === 'perfil') {
    cargarPerfilEstudiante();
  } else if (seccion === 'reporte') {
    cargarPeriodosParaReporte();
  }
}

// ================================================================
// SECCIÓN: FUNCIONES DEL PERFIL DEL ESTUDIANTE
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarPerfilEstudiante
// DESCRIPCIÓN:
//   Carga los datos del perfil del estudiante desde el servidor
//   y los muestra en el formulario de perfil.
// ---------------------------------------------------------------
function cargarPerfilEstudiante() {
  fetch("panel_estudiante.php?accion=obtener_perfil")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById('perfil-nombre-est').value = data.nombre || '';
        document.getElementById('perfil-correo-est').value = data.correo || '';
        document.getElementById('perfil-telefono-est').value = data.telefono || '';
        document.getElementById('perfil-tipo-documento-est').value = data.tipo_documento || '';
        document.getElementById('perfil-numero-documento-est').value = data.numero_documento || '';
        
        if (data.profile_image && data.profile_image !== '') {
          document.getElementById('foto-perfil-estudiante').src = data.profile_image;
        } else {
          document.getElementById('foto-perfil-estudiante').src = './imagenes_de_pagina/sin_foto_perfil.jpeg';
        }
      } else {
        console.error("Error al cargar el perfil:", data.message);
        mostrarMensajePerfilEstudiante('Error al cargar el perfil', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar el perfil:", error);
      mostrarMensajePerfilEstudiante('Error al cargar el perfil', 'error');
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: toggleEditarPerfilEstudiante
// DESCRIPCIÓN:
//   Activa o desactiva el modo de edición del perfil del estudiante.
// ---------------------------------------------------------------
function toggleEditarPerfilEstudiante() {
  const btnEditar = document.getElementById('btn-editar-perfil-est');
  const btnActualizar = document.getElementById('btn-actualizar-perfil-est');
  const inputs = document.querySelectorAll('#form-perfil-estudiante input, #form-perfil-estudiante select');
  
  const estaEditando = btnEditar.textContent === 'Cancelar';
  
  if (estaEditando) {
    inputs.forEach(input => {
      input.readOnly = true;
      input.disabled = true;
    });
    btnEditar.textContent = 'Editar';
    btnActualizar.style.display = 'none';
    cargarPerfilEstudiante();
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
// FUNCIÓN: actualizarPerfilEstudiante
// DESCRIPCIÓN:
//   Valida y envía los datos del perfil del estudiante al servidor
//   para actualizarlos.
// ---------------------------------------------------------------
function actualizarPerfilEstudiante() {
  const nombre = document.getElementById('perfil-nombre-est').value.trim();
  const correo = document.getElementById('perfil-correo-est').value.trim();
  const telefono = document.getElementById('perfil-telefono-est').value.trim();
  const tipoDocumento = document.getElementById('perfil-tipo-documento-est').value.trim();
  const numeroDocumento = document.getElementById('perfil-numero-documento-est').value.trim();
  
  if (!nombre || !correo) {
    mostrarMensajePerfilEstudiante('El nombre y el correo son obligatorios', 'error');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    mostrarMensajePerfilEstudiante('El formato del correo no es válido', 'error');
    return;
  }
  
  if (numeroDocumento && !/^[0-9]+$/.test(numeroDocumento)) {
    mostrarMensajePerfilEstudiante('El número de documento solo debe contener números', 'error');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "actualizar_perfil");
  datos.append("nombre", nombre);
  datos.append("correo", correo);
  datos.append("telefono", telefono);
  datos.append("tipo_documento", tipoDocumento);
  datos.append("numero_documento", numeroDocumento);
  
  const btnActualizar = document.getElementById('btn-actualizar-perfil-est');
  const textoOriginal = btnActualizar.textContent;
  btnActualizar.textContent = "Actualizando...";
  btnActualizar.disabled = true;
  
  fetch("panel_estudiante.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnActualizar.textContent = textoOriginal;
      btnActualizar.disabled = false;
      
      if (data.success) {
        mostrarMensajePerfilEstudiante('Perfil actualizado correctamente', 'success');
        toggleEditarPerfilEstudiante();
      } else {
        mostrarMensajePerfilEstudiante(data.message || 'Error al actualizar el perfil', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al actualizar el perfil:", error);
      mostrarMensajePerfilEstudiante('Error al actualizar el perfil', 'error');
      btnActualizar.textContent = textoOriginal;
      btnActualizar.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: actualizarPasswordEstudiante
// DESCRIPCIÓN:
//   Valida y actualiza la contraseña del estudiante.
// ---------------------------------------------------------------
function actualizarPasswordEstudiante() {
  const passwordActual = document.getElementById('password-actual-est').value.trim();
  const passwordNueva = document.getElementById('password-nueva-est').value.trim();
  const passwordConfirmar = document.getElementById('password-confirmar-est').value.trim();
  
  if (!passwordActual) {
    mostrarMensajePasswordEstudiante('Debe ingresar la contraseña actual', 'error');
    return;
  }
  
  if (!passwordNueva || passwordNueva.length < 6) {
    mostrarMensajePasswordEstudiante('La nueva contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  if (passwordNueva !== passwordConfirmar) {
    mostrarMensajePasswordEstudiante('Las contraseñas no coinciden', 'error');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "actualizar_password");
  datos.append("password_actual", passwordActual);
  datos.append("password_nueva", passwordNueva);
  
  const btnPassword = document.querySelector('#form-password-estudiante button[type="button"]');
  const textoOriginal = btnPassword.textContent;
  btnPassword.textContent = "Actualizando...";
  btnPassword.disabled = true;
  
  fetch("panel_estudiante.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnPassword.textContent = textoOriginal;
      btnPassword.disabled = false;
      
      if (data.success) {
        mostrarMensajePasswordEstudiante('Contraseña actualizada correctamente', 'success');
        document.getElementById('form-password-estudiante').reset();
      } else {
        mostrarMensajePasswordEstudiante(data.message || 'Error al actualizar la contraseña', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al actualizar la contraseña:", error);
      mostrarMensajePasswordEstudiante('Error al actualizar la contraseña', 'error');
      btnPassword.textContent = textoOriginal;
      btnPassword.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: abrirModalFotoEstudiante
// DESCRIPCIÓN:
//   Abre el modal para subir una nueva foto de perfil del estudiante.
//   SOLO se ejecuta cuando el usuario hace clic en el botón
//   "Modificar foto de perfil" en la sección de Perfil.
//   NO se ejecuta automáticamente al cargar la página.
// ---------------------------------------------------------------
function abrirModalFotoEstudiante() {
  // Verificamos que el modal exista antes de intentar abrirlo
  const modal = document.getElementById('modal-foto-estudiante');
  if (!modal) {
    console.error("No se encontró el modal de foto del estudiante");
    return;
  }
  
  // Solo abrimos el modal si el usuario está en la sección de perfil
  const seccionPerfil = document.getElementById('view-perfil');
  if (!seccionPerfil || !seccionPerfil.classList.contains('active')) {
    console.warn("El modal de foto solo se puede abrir desde la sección de Perfil");
    return;
  }
  
  // Abrimos el modal
  modal.classList.remove('oculto');
  
  // Agregamos evento para preview de imagen (solo una vez)
  const inputFoto = document.getElementById('input-foto-estudiante');
  if (inputFoto) {
    // Removemos listeners previos para evitar duplicados
    const nuevoInput = inputFoto.cloneNode(true);
    inputFoto.parentNode.replaceChild(nuevoInput, inputFoto);
    
    nuevoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const imgPreview = document.getElementById('img-preview-estudiante');
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
// FUNCIÓN: cerrarModalFotoEstudiante
// DESCRIPCIÓN:
//   Cierra el modal de subida de foto de perfil del estudiante.
// ---------------------------------------------------------------
function cerrarModalFotoEstudiante() {
  const modal = document.getElementById('modal-foto-estudiante');
  modal.classList.add('oculto');
  document.getElementById('form-foto-estudiante').reset();
  document.getElementById('img-preview-estudiante').style.display = 'none';
}

// ---------------------------------------------------------------
// FUNCIÓN: subirFotoPerfilEstudiante
// DESCRIPCIÓN:
//   Valida y sube la foto de perfil del estudiante al servidor.
// ---------------------------------------------------------------
function subirFotoPerfilEstudiante() {
  const inputFoto = document.getElementById('input-foto-estudiante');
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
  
  const btnSubir = document.querySelector('#form-foto-estudiante button[type="button"]');
  const textoOriginal = btnSubir.textContent;
  btnSubir.textContent = "Subiendo...";
  btnSubir.disabled = true;
  
  fetch("panel_estudiante.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnSubir.textContent = textoOriginal;
      btnSubir.disabled = false;
      
      if (data.success) {
        document.getElementById('foto-perfil-estudiante').src = data.imageUrl;
        cerrarModalFotoEstudiante();
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
// FUNCIÓN: togglePasswordEstudiante
// DESCRIPCIÓN:
//   Muestra u oculta la contraseña en el campo especificado.
//   Iconos: ◉ (mostrar cuando está oculta) y ◎ (ocultar cuando está visible)
// PARÁMETRO:
//   inputId → ID del campo de contraseña
// ---------------------------------------------------------------
function togglePasswordEstudiante(inputId) {
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
// FUNCIÓN: mostrarMensajePerfilEstudiante
// DESCRIPCIÓN:
//   Muestra un mensaje en la sección de información personal del perfil.
// PARÁMETROS:
//   mensaje → Texto del mensaje
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajePerfilEstudiante(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-perfil-est');
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
// FUNCIÓN: mostrarMensajePasswordEstudiante
// DESCRIPCIÓN:
//   Muestra un mensaje en la sección de cambio de contraseña del perfil.
// PARÁMETROS:
//   mensaje → Texto del mensaje
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajePasswordEstudiante(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-password-est');
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
// SECCIÓN: FUNCIONES DE CONSULTA DE NOTAS
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarMateriasEstudiante
// DESCRIPCIÓN:
//   Carga la lista de materias del estudiante para seleccionar
//   en la consulta de notas.
// ---------------------------------------------------------------
function cargarMateriasEstudiante() {
  fetch("panel_estudiante.php?accion=materias_estudiante")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('select-materia-notas-est');
      if (!select) return;
      
      select.innerHTML = '<option value="">Seleccione una materia...</option>';
      
      if (data.success && data.materias.length > 0) {
        data.materias.forEach(materia => {
          const option = document.createElement('option');
          option.value = materia.id_materia;
          option.textContent = materia.nombre_materia;
          select.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar materias:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarPeriodosParaNotasEstudiante
// DESCRIPCIÓN:
//   Carga la lista de períodos académicos para el filtro de notas.
// ---------------------------------------------------------------
function cargarPeriodosParaNotasEstudiante() {
  fetch("panel_estudiante.php?accion=listar_periodos")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('select-periodo-notas-est');
      if (!select) return;
      
      // Limpiar el select (mantener solo la opción "Seleccione un período...")
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
// FUNCIÓN: cargarNotasEstudiante
// DESCRIPCIÓN:
//   Carga las notas del estudiante para la materia y período seleccionados.
//   Muestra todas las actividades con sus notas y porcentajes (solo lectura).
//   También carga la información del profesor de la materia (foto, nombre, correo).
// ---------------------------------------------------------------
function cargarNotasEstudiante() {
  const materiaId = document.getElementById('select-materia-notas-est')?.value || '';
  const periodoId = document.getElementById('select-periodo-notas-est')?.value || '';
  
  if (!materiaId) {
    document.getElementById('tbody-notas-est').innerHTML = 
      '<tr><td colspan="3" style="text-align:center; padding:20px;">Seleccione una materia para ver sus notas</td></tr>';
    document.getElementById('info-profesor').style.display = 'none';
    return;
  }
  
  if (!periodoId) {
    document.getElementById('tbody-notas-est').innerHTML = 
      '<tr><td colspan="3" style="text-align:center; padding:20px;">Seleccione un período académico para ver sus notas</td></tr>';
    document.getElementById('info-profesor').style.display = 'none';
    return;
  }
  
  const url = `panel_estudiante.php?accion=notas_estudiante&materia_id=${materiaId}&periodo_id=${periodoId}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('tbody-notas-est');
      tbody.innerHTML = '';
      
      if (data.success && data.notas.length > 0) {
        let sumaPonderada = 0;
        let sumaPorcentajes = 0;
        
        // Mostrar cada actividad con su nota y porcentaje (solo lectura)
        data.notas.forEach(nota => {
          const tr = document.createElement('tr');
          const notaValor = parseFloat(nota.nota) || 0;
          const porcentajeValor = parseFloat(nota.porcentaje) || 0;
          
          // Calcular para promedio ponderado
          sumaPonderada += (notaValor * porcentajeValor);
          sumaPorcentajes += porcentajeValor;
          
          tr.innerHTML = `
            <td>${nota.nombre_actividad}</td>
            <td style="text-align:center;">${notaValor.toFixed(2)}</td>
            <td style="text-align:center;">${porcentajeValor.toFixed(2)}%</td>
          `;
          tbody.appendChild(tr);
        });
        
        // Calcular nota final (promedio ponderado)
        const notaFinal = sumaPorcentajes > 0 ? sumaPonderada / sumaPorcentajes : 0;
        const estaAprobado = notaFinal >= 30; // Nota mínima aprobatoria: 30
        
        // Agregar fila de nota final
        const trFinal = document.createElement('tr');
        trFinal.style.fontWeight = 'bold';
        trFinal.style.backgroundColor = '#f8f9fc';
        trFinal.innerHTML = `
          <td style="text-align:right; padding-right:20px;">Nota Final:</td>
          <td style="text-align:center;">${notaFinal.toFixed(2)}</td>
          <td style="text-align:center;">${sumaPorcentajes.toFixed(2)}%</td>
        `;
        tbody.appendChild(trFinal);
        
        // Mostrar estado aprobado/reprobado debajo de la tabla
        const estadoContainer = document.getElementById('estado-nota-final');
        if (estadoContainer) {
          estadoContainer.innerHTML = `
            <div style="margin-top:15px; padding:12px; background:${estaAprobado ? '#d1fae5' : '#fee2e2'}; border-radius:8px; text-align:center;">
              <strong style="color:${estaAprobado ? '#065f46' : '#991b1b'}; font-size:1.1em;">
                ${estaAprobado ? '✓ Aprobado' : '✗ Reprobado'}
              </strong>
            </div>
          `;
          estadoContainer.style.display = 'block';
        }
      } else {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">No hay notas registradas para esta materia y período</td></tr>';
        const estadoContainer = document.getElementById('estado-nota-final');
        if (estadoContainer) {
          estadoContainer.style.display = 'none';
        }
      }
      
      // Cargar información del profesor (foto, nombre, correo) - al final
      if (data.profesor) {
        const contenidoProfesor = document.getElementById('contenido-profesor');
        const fotoUrl = data.profesor.foto || './imagenes_de_pagina/sin_foto_perfil.jpeg';
        contenidoProfesor.innerHTML = `
          <img src="${fotoUrl}" alt="Foto del profesor" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid var(--borde);">
          <div>
            <div style="font-weight:600; font-size:1.1em; margin-bottom:5px;">${data.profesor.nombre || '—'}</div>
            <div style="color:#666;">${data.profesor.correo || '—'}</div>
          </div>
        `;
        document.getElementById('info-profesor').style.display = 'block';
      } else {
        document.getElementById('info-profesor').style.display = 'none';
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar notas:", error);
      document.getElementById('tbody-notas-est').innerHTML = 
        '<tr><td colspan="3" style="text-align:center; padding:20px;">Error al cargar las notas</td></tr>';
      document.getElementById('info-profesor').style.display = 'none';
      const estadoContainer = document.getElementById('estado-nota-final');
      if (estadoContainer) {
        estadoContainer.style.display = 'none';
      }
    });
}

// ================================================================
// SECCIÓN: FUNCIONES DE HORARIO
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarHorarioEstudiante
// DESCRIPCIÓN:
//   Carga el horario del estudiante desde el servidor y lo muestra
//   en una tabla con días como columnas (Lunes-Viernes) y horas como filas (6 AM - 2 PM).
// ---------------------------------------------------------------
function cargarHorarioEstudiante() {
  fetch("panel_estudiante.php?accion=horario_estudiante")
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('tbody-horario-est');
      tbody.innerHTML = '';
      
      if (data.success && data.horarios.length > 0) {
        // Crear matriz de horarios: [rango][dia] = {materia}
        // Rangos de 2 horas: 6-8, 8-10, 10-12, 12-14, 14-16, 16-18, 17-18 (6 AM - 6 PM)
        const rangos = [
          { inicio: 6, fin: 8 },
          { inicio: 8, fin: 10 },
          { inicio: 10, fin: 12 },
          { inicio: 12, fin: 14 },
          { inicio: 14, fin: 16 },
          { inicio: 16, fin: 17 },
          { inicio: 17, fin: 18 }
        ];
        
        const horariosMap = {};
        rangos.forEach((rango, idx) => {
          horariosMap[idx] = { 1: null, 2: null, 3: null, 4: null, 5: null }; // 1=Lunes, 5=Viernes
        });
        
        // Llenar la matriz con los horarios
        data.horarios.forEach(horario => {
          const horaInicio = parseInt(horario.hora_inicio.split(':')[0]);
          const horaFin = parseInt(horario.hora_fin.split(':')[0]);
          const dia = horario.dia_semana;
          
          // Solo procesar días de lunes (1) a viernes (5)
          if (dia >= 1 && dia <= 5) {
            rangos.forEach((rango, idx) => {
              // Verificar si el horario se superpone con este rango
              if ((horaInicio < rango.fin && horaFin > rango.inicio)) {
                horariosMap[idx][dia] = {
                  materia: horario.nombre_materia || '—'
                };
              }
            });
          }
        });
        
        // Crear filas de la tabla
        rangos.forEach((rango, idx) => {
          const tr = document.createElement('tr');
          const horaInicioTexto = rango.inicio < 12 ? `${rango.inicio}:00 AM` : rango.inicio === 12 ? '12:00 PM' : `${rango.inicio-12}:00 PM`;
          const horaFinTexto = rango.fin < 12 ? `${rango.fin}:00 AM` : rango.fin === 12 ? '12:00 PM' : `${rango.fin-12}:00 PM`;
          
          tr.innerHTML = `
            <td style="font-weight:600; text-align:center;">${horaInicioTexto} - ${horaFinTexto}</td>
            <td>${horariosMap[idx][1] ? horariosMap[idx][1].materia : '—'}</td>
            <td>${horariosMap[idx][2] ? horariosMap[idx][2].materia : '—'}</td>
            <td>${horariosMap[idx][3] ? horariosMap[idx][3].materia : '—'}</td>
            <td>${horariosMap[idx][4] ? horariosMap[idx][4].materia : '—'}</td>
            <td>${horariosMap[idx][5] ? horariosMap[idx][5].materia : '—'}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No tiene horarios asignados</td></tr>';
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar horario:", error);
      document.getElementById('tbody-horario-est').innerHTML = 
        '<tr><td colspan="6" style="text-align:center; padding:20px;">Error al cargar el horario</td></tr>';
    });
}

// ================================================================
// SECCIÓN: FUNCIONES DE COMUNICADOS
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarComunicados
// DESCRIPCIÓN:
//   Carga los comunicados publicados por administradores y docentes
//   y los muestra en una tabla.
// ---------------------------------------------------------------
function cargarComunicados() {
  fetch("panel_estudiante.php?accion=listar_comunicados")
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('tbody-comunicados-est');
      tbody.innerHTML = '';
      
      if (data.success && data.comunicados.length > 0) {
        data.comunicados.forEach(comunicado => {
          const tr = document.createElement('tr');
          const fecha = new Date(comunicado.fecha_publicacion).toLocaleDateString('es-ES');
          tr.innerHTML = `
            <td>${fecha}</td>
            <td>${comunicado.titulo}</td>
            <td>${comunicado.contenido}</td>
            <td>${comunicado.nombre_autor || '—'}</td>
            <td>${comunicado.cargo_autor || '—'}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay comunicados disponibles</td></tr>';
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar comunicados:", error);
      document.getElementById('tbody-comunicados-est').innerHTML = 
        '<tr><td colspan="5" style="text-align:center; padding:20px;">Error al cargar los comunicados</td></tr>';
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cerrarSesion
// DESCRIPCIÓN:
//   Cierra la sesión del estudiante y redirige al login.
// ---------------------------------------------------------------
function cerrarSesion() {
  alert("Sesión cerrada correctamente");
  window.location.href = "index.html";
}

// ================================================================
// SECCIÓN: FUNCIONES PARA GENERAR REPORTE PDF
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarPeriodosParaReporte
// DESCRIPCIÓN:
//   Carga la lista de períodos académicos para el selector de
//   generación de reporte PDF.
// ---------------------------------------------------------------
function cargarPeriodosParaReporte() {
  fetch("panel_estudiante.php?accion=listar_periodos")
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('select-periodo-reporte');
      if (!select) return;
      
      // Limpiar el select (mantener solo la opción "Seleccione un período...")
      select.innerHTML = '<option value="">Seleccione un período...</option>';
      
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
      console.error("❌ Error al cargar periodos para reporte:", error);
      mostrarMensajeReporte('Error al cargar los periodos académicos', 'error');
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: generarReportePDF
// DESCRIPCIÓN:
//   Genera un reporte PDF con todas las materias del estudiante
//   y sus notas definitivas para el periodo académico seleccionado.
//   El PDF incluye el nombre de la institución, el nombre del
//   estudiante y una tabla con materias y notas definitivas.
// ---------------------------------------------------------------
function generarReportePDF() {
  const periodoId = document.getElementById('select-periodo-reporte')?.value || '';
  
  if (!periodoId) {
    mostrarMensajeReporte('Por favor seleccione un período académico', 'error');
    return;
  }
  
  // Deshabilitar el botón mientras se genera el reporte
  const btnGenerar = document.getElementById('btn-generar-reporte');
  const textoOriginal = btnGenerar.textContent;
  btnGenerar.textContent = "Generando...";
  btnGenerar.disabled = true;
  
  // Ocultar mensajes anteriores
  const mensajeReporte = document.getElementById('mensaje-reporte-est');
  if (mensajeReporte) {
    mensajeReporte.style.display = 'none';
  }
  
  // Abrir el reporte en una nueva ventana
  // El servidor generará un HTML formateado que el usuario puede imprimir como PDF
  const url = `panel_estudiante.php?accion=generar_reporte_pdf&periodo_id=${periodoId}`;
  
  // Abrir en una nueva ventana para que el usuario pueda imprimir o guardar como PDF
  const ventanaReporte = window.open(url, '_blank', 'width=1200,height=800');
  
  // Verificar si la ventana se abrió correctamente
  if (!ventanaReporte) {
    mostrarMensajeReporte('No se pudo abrir la ventana del reporte. Por favor, permite ventanas emergentes.', 'error');
    btnGenerar.textContent = textoOriginal;
    btnGenerar.disabled = false;
    return;
  }
  
  // Restaurar el botón después de un breve delay
  setTimeout(() => {
    btnGenerar.textContent = textoOriginal;
    btnGenerar.disabled = false;
  }, 1000);
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajeReporte
// DESCRIPCIÓN:
//   Muestra un mensaje de éxito o error en la sección de reporte.
// PARÁMETROS:
//   mensaje → Texto del mensaje a mostrar
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajeReporte(mensaje, tipo) {
  const mensajeReporte = document.getElementById('mensaje-reporte-est');
  if (!mensajeReporte) return;
  
  mensajeReporte.textContent = mensaje;
  mensajeReporte.className = `alert ${tipo === 'error' ? 'error' : 'success'}`;
  mensajeReporte.style.display = 'block';
  
  // Ocultar el mensaje después de 5 segundos
  setTimeout(() => {
    mensajeReporte.style.display = 'none';
  }, 5000);
}

