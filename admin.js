// ================================================================
// ARCHIVO: admin.js
// DESCRIPCIÓN:
//   Controla toda la lógica del panel del administrador.
//   Incluye gestión de usuarios, cursos, horarios, comunicados
//   y perfil del administrador. Maneja la navegación por pestañas
//   y las operaciones CRUD del sistema.
// ================================================================


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
  if (id === "usuarios") {
    cargarUsuarios();
  } else if (id === "perfil") {
    cargarPerfil();
  } else if (id === "horarios") {
    cargarHorariosAdmin();
  } else if (id === "comunicados") {
    cargarComunicadosAdmin();
  } else if (id === "cursos") {
    // Cargamos los cursos cuando el usuario accede a la sección
    cargarCursos();
  }
}


//=================================== LOGICA PARA CARGAR USUARIOS EN LA TABLA =============================

      // ---------------------------------------------------------------
      // FUNCIÓN: cargarUsuarios
      // DESCRIPCIÓN:
      //   Obtiene los usuarios desde el servidor (panel_admin.php)
      //   y los muestra dentro de la tabla en el panel.
      // ---------------------------------------------------------------
      function cargarUsuarios() {
        // Hacemos una petición GET al archivo PHP (GET es el método por defecto)
        // MÉTODO HTTP: GET (por defecto, no se especifica explícitamente)
        fetch("panel_admin.php")
          .then(response => response.json()) // Convertimos la respuesta a JSON
          .then(data => {
            mostrarUsuariosEnTabla(data); // Mostramos los datos en la tabla
          })
          .catch(error => {
            console.error("❌ Error al cargar los usuarios:", error);
          });
      }


      // ---------------------------------------------------------------
      // FUNCIÓN: mostrarUsuariosEnTabla
      // DESCRIPCIÓN:
      //   Inserta los datos recibidos desde PHP en la tabla HTML.
      //   Incluye las nuevas columnas de tipo y número de documento.
      //   Protege el perfil del administrador principal (id = 1) deshabilitando
      //   su checkbox para evitar eliminación accidental.
      // PARÁMETRO:
      //   usuarios → Array de objetos JSON con los datos de cada usuario.
      // ---------------------------------------------------------------
      function mostrarUsuariosEnTabla(usuarios) {
        const tbody = document.querySelector("#tabla-usuarios tbody");
        tbody.innerHTML = ""; // Limpiamos la tabla antes de llenarla

        // Si no hay usuarios registrados
        if (usuarios.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7">No hay usuarios registrados.</td></tr>`;
          return;
        }

        // Recorremos cada usuario y creamos una fila en la tabla
        usuarios.forEach(usuario => {
          // Proteger el administrador principal (id = 1) deshabilitando el checkbox
          const esAdminPrincipal = usuario.id == 1;
          const checkboxDisabled = esAdminPrincipal ? 'disabled title="No se puede eliminar el perfil del administrador principal"' : '';
          const checkboxClass = esAdminPrincipal ? 'chkUsuario chk-disabled' : 'chkUsuario';
          
          // Mostrar salón/materias: si está vacío (estudiante sin curso) mostrar vacío, 
          // si es "—" (admin o sin datos) mostrar "—", sino mostrar el valor
          const salonMaterias = (usuario.salon_materias === "" || usuario.salon_materias === null) 
                                ? "" 
                                : (usuario.salon_materias === "—" ? "—" : usuario.salon_materias);
          
          const fila = `
            <tr ${esAdminPrincipal ? 'style="opacity: 0.7; background-color: #f5f5f5;"' : ''}>
              <td>${usuario.nombre || '—'}</td>
              <td>${usuario.correo || '—'}</td>
              <td>${usuario.rol || '—'}</td>
              <td>${usuario.tipo_documento || '—'}</td>
              <td>${usuario.numero_documento || '—'}</td>
              <td>${salonMaterias}</td>
              <td><input type="checkbox" class="${checkboxClass}" data-id="${usuario.id}" ${checkboxDisabled}></td>
            </tr>
          `;
          tbody.innerHTML += fila;
        });
      }

//=========================================  FIN  ===========================================================


// ---------------------------------------------------------------
// FUNCIÓN: crearUsuario
// DESCRIPCIÓN:
//   Captura los datos del formulario de registro, valida los campos
//   (incluyendo tipo y número de documento) y los envía al servidor.
//   Valida que el número de documento contenga solo números y que
//   el correo tenga formato válido.
// PARÁMETRO:
//   event → Objeto del evento submit del formulario
// ---------------------------------------------------------------
function crearUsuario(event) {
  event.preventDefault(); // Evita que el formulario recargue la página

  // Limpiamos mensajes de error previos
  limpiarErrores();

  // Capturamos los valores del formulario
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const password = document.getElementById('password').value.trim();
  const rol = document.getElementById('rol').value.trim();
  const tipoDocumento = document.getElementById('tipo_documento').value.trim();
  const numeroDocumento = document.getElementById('numero_documento').value.trim();
  const materia = document.getElementById('materia') ? document.getElementById('materia').value : '';

  // Validación de campos obligatorios
  let hayErrores = false;

  if (!nombre) {
    mostrarError('nombre', 'El nombre es obligatorio');
    hayErrores = true;
  }

  if (!correo) {
    mostrarError('correo', 'El correo es obligatorio');
    hayErrores = true;
  } else if (!validarEmail(correo)) {
    mostrarError('correo', 'El formato del correo no es válido');
    hayErrores = true;
  }

  if (!password || password.length < 6) {
    mostrarError('password', 'La contraseña debe tener al menos 6 caracteres');
    hayErrores = true;
  }

  if (!tipoDocumento) {
    mostrarError('tipo-documento', 'Debe seleccionar un tipo de documento');
    hayErrores = true;
  }

  if (!numeroDocumento) {
    mostrarError('numero-documento', 'El número de documento es obligatorio');
    hayErrores = true;
  } else if (!validarSoloNumeros(numeroDocumento)) {
    mostrarError('numero-documento', 'El número de documento solo debe contener números');
    hayErrores = true;
  }

  if (!rol) {
    mostrarError('rol', 'Debe seleccionar un rol');
    hayErrores = true;
  }

  // Si el rol es docente, verificar que tenga materia
  if (rol.toLowerCase() === "docente" && !materia) {
    alert("⚠️ Ingresa la materia que enseña el docente.");
    hayErrores = true;
  }

  // Si hay errores, detenemos el proceso
  if (hayErrores) {
    return;
  }

  // Preparamos los datos para enviar al servidor
  const datos = new FormData();
  datos.append("accion", "crear_usuario");
  datos.append("nombre", nombre);
  datos.append("correo", correo);
  datos.append("password", password);
  datos.append("rol", rol);
  datos.append("tipo_documento", tipoDocumento);
  datos.append("numero_documento", numeroDocumento);

  // Solo si es docente, enviamos también la materia
  if (rol.toLowerCase() === "docente") {
    datos.append("materia", materia);
  }

  // Mostramos un spinner de carga
  const btnSubmit = event.target.querySelector('button[type="submit"]');
  const textoOriginal = btnSubmit.textContent;
  btnSubmit.textContent = "Registrando...";
  btnSubmit.disabled = true;

  // Enviamos los datos mediante fetch()
  fetch("panel_admin.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.text())
    .then(data => {
      // Restauramos el botón
      btnSubmit.textContent = textoOriginal;
      btnSubmit.disabled = false;

      if (data.includes("✅")) {
        alert(data);
        document.getElementById('form-usuario').reset();
        cargarUsuarios(); // Recargamos la tabla de usuarios
      } else {
        alert("❌ Error: " + data);
      }
    })
    .catch(error => {
      console.error("❌ Error al crear el usuario:", error);
      alert("Ocurrió un error al intentar crear el usuario.");
      btnSubmit.textContent = textoOriginal;
      btnSubmit.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: validarEmail
// DESCRIPCIÓN:
//   Valida que una cadena de texto tenga formato de email válido.
// PARÁMETRO:
//   email → Cadena de texto a validar
// RETORNA:
//   boolean → true si el email es válido, false en caso contrario
// ---------------------------------------------------------------
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ---------------------------------------------------------------
// FUNCIÓN: validarSoloNumeros
// DESCRIPCIÓN:
//   Valida que una cadena de texto contenga solo números.
// PARÁMETRO:
//   texto → Cadena de texto a validar
// RETORNA:
//   boolean → true si solo contiene números, false en caso contrario
// ---------------------------------------------------------------
function validarSoloNumeros(texto) {
  const regex = /^[0-9]+$/;
  return regex.test(texto);
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarError
// DESCRIPCIÓN:
//   Muestra un mensaje de error debajo del campo correspondiente.
// PARÁMETROS:
//   campoId → ID del campo (sin el prefijo 'error-')
//   mensaje → Mensaje de error a mostrar
// ---------------------------------------------------------------
function mostrarError(campoId, mensaje) {
  const errorElement = document.getElementById(`error-${campoId}`);
  if (errorElement) {
    errorElement.textContent = mensaje;
    errorElement.style.color = '#dc3545';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '5px';
    errorElement.style.display = 'block';
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: limpiarErrores
// DESCRIPCIÓN:
//   Limpia todos los mensajes de error del formulario de creación de usuarios.
// ---------------------------------------------------------------
function limpiarErrores() {
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(element => {
    element.textContent = '';
    element.style.display = 'none';
  });
}

// ============================================================================
// FUNCIÓN: mostrarCampoMateria()
// DESCRIPCIÓN:
//   Muestra el campo "Materia" solo cuando el rol seleccionado es "Docente".
//   Si se elige otro tipo de usuario, el campo se oculta y se limpia.
// ============================================================================
function mostrarCampoMateria() {
  const selectRol = document.getElementById("rol");              // Select del tipo de usuario
  const campoMateria = document.getElementById("campo-materia"); // Contenedor del campo materia

  // Detecta cuando se cambia la opción del select
  selectRol.addEventListener("change", function() {
    if (this.value === "Docente") {
      campoMateria.classList.remove("oculto"); // Muestra el campo
    } else {
      campoMateria.classList.add("oculto");    // Oculta el campo
      document.getElementById("materia").value = ""; // Limpia el texto
    }
  });
}


// ---------------------------------------------------------------
// EVENTO: DOMContentLoaded
// DESCRIPCIÓN:
//   Se ejecuta cuando el DOM está completamente cargado.
//   Solo inicializa el campo de materia para el formulario de
//   creación de usuarios. NO abre modales ni ejecuta funciones
//   automáticamente.
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// EVENTO: DOMContentLoaded
// DESCRIPCIÓN:
//   Se ejecuta cuando el DOM está completamente cargado.
//   Solo inicializa el campo de materia para el formulario de
//   creación de usuarios. NO abre modales ni ejecuta funciones
//   automáticamente. También carga el nombre del usuario en el
//   encabezado y actualiza el título de la página.
// ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function() {
  // Solo inicializamos el campo de materia para el formulario
  // NO ejecutamos ninguna función que abra modales o ventanas
  mostrarCampoMateria();
  
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
  const tabs = document.querySelectorAll('.tab-indicador');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Cargar el nombre del usuario en el encabezado
  cargarNombreUsuario();
});

// ---------------------------------------------------------------
// FUNCIÓN: cargarNombreUsuario
// DESCRIPCIÓN:
//   Carga el nombre del usuario desde el perfil y lo muestra
//   en el encabezado como "Bienvenido, [Nombre]". También
//   actualiza el título de la página.
// ---------------------------------------------------------------
function cargarNombreUsuario() {
  fetch("panel_admin.php?accion=obtener_perfil")
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
// FUNCIÓN: borrarSeleccionados
// DESCRIPCIÓN:
//   Elimina todos los usuarios seleccionados mediante checkbox.
//   Esta función utiliza el método HTTP POST (no DELETE) porque
//   el hosting InfinityFree bloquea métodos como DELETE, PUT, PATCH.
//   
//   FLUJO DE EJECUCIÓN:
//   1. Filtra los checkboxes seleccionados (excluye admin principal)
//   2. Valida que haya al menos un usuario seleccionado
//   3. Protege el administrador principal (id_usuario = 1)
//   4. Solicita confirmación al usuario
//   5. Prepara los datos en FormData con accion="borrar" e ids en JSON
//   6. Envía petición POST a panel_admin.php
//   7. Recibe respuesta y actualiza la tabla automáticamente
//
//   MÉTODO HTTP: POST (requerido por limitaciones del hosting)
//   PARÁMETROS ENVIADOS:
//     - accion: "borrar" (indica la acción a realizar)
//     - ids: JSON.stringify([id1, id2, ...]) (array de IDs a eliminar)
//
//   NOTA: El servidor procesa esta petición y ejecuta SQL DELETE
//         para eliminar los usuarios de la base de datos.
// ---------------------------------------------------------------
function borrarSeleccionados() {
  // Paso 1: Filtrar solo los checkboxes habilitados (excluye el admin principal)
  // Los checkboxes del admin principal están deshabilitados en el HTML
  const seleccionados = Array.from(document.querySelectorAll(".chkUsuario:checked"))
    .filter(chk => !chk.disabled);

  // Paso 2: Validar que haya al menos un usuario seleccionado
  if (seleccionados.length === 0) {
    alert("⚠️ Debes seleccionar al menos un usuario para borrar.");
    return;
  }

  // Paso 3: Verificar si se intentó seleccionar el administrador principal
  // Esta es una protección adicional en caso de que el checkbox se habilite
  const intentoEliminarAdmin = Array.from(document.querySelectorAll(".chkUsuario:checked"))
    .some(chk => chk.dataset.id == 1);
  
  if (intentoEliminarAdmin) {
    alert("⚠️ No se puede eliminar el perfil del administrador principal. Este perfil es indispensable para el sistema.");
    // Desmarcar el checkbox del administrador si estaba seleccionado
    const adminCheckbox = document.querySelector(".chkUsuario[data-id='1']");
    if (adminCheckbox) {
      adminCheckbox.checked = false;
    }
    return;
  }

  // Paso 4: Solicitar confirmación al usuario antes de eliminar
  if (!confirm("¿Seguro que deseas eliminar los usuarios seleccionados?")) return;

  // Paso 5: Extraer los IDs seleccionados (ya filtrados para excluir el admin)
  const ids = seleccionados.map(chk => chk.dataset.id);

  // Paso 6: Preparar datos para enviar mediante POST
  // IMPORTANTE: Usamos POST porque InfinityFree bloquea DELETE, PUT, PATCH
  // Enviamos la acción "borrar" y los IDs en formato JSON
  const datos = new FormData();
  datos.append("accion", "borrar");
  datos.append("ids", JSON.stringify(ids));

  // Paso 7: Enviar petición POST al servidor
  fetch("panel_admin.php", {
    method: "POST",  // Método HTTP: POST (no DELETE por limitaciones del hosting)
    body: datos      // FormData con accion="borrar" e ids en JSON
  })
  .then(response => response.text())  // El servidor devuelve texto plano
  .then(msg => {
    alert(msg);  // Mostrar mensaje de éxito o error
    cargarUsuarios(); // Refrescar la tabla automáticamente después de eliminar
  })
  .catch(err => {
    console.error("❌ Error al eliminar:", err);
    alert("Error al eliminar usuarios. Por favor, intente nuevamente.");
  });
}

// ================================================================
// ARCHIVO: crearCurso
// DESCRIPCIÓN:
//   Captura los datos del formulario de registro y los envía al servidor.
// ================================================================

function crearCurso(event) {
  event.preventDefault();

  const nombre = document.getElementById('nombre_curso').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();

  if (!nombre) {
    alert("⚠️ El curso necesita un nombre.");
    return;
  }

  const datos = new FormData();
  datos.append("accion", "crear_curso");
  datos.append("nombre_curso", nombre);
  datos.append("descripcion", descripcion);

  fetch("panel_admin.php", { method: "POST", body: datos })
    .then(r => r.text())
    .then(msg => { alert(msg); cargarCursos(); document.getElementById("form-curso").reset(); });
}

//=================================== LOGICA PARA CARGAR Y MOSTRAR CURSOS =============================

      // ---------------------------------------------------------------
      // FUNCIÓN: cargarCursos
      // DESCRIPCIÓN:
      //   Realiza una petición GET al servidor para obtener la lista
      //   de cursos con su cantidad de estudiantes asociados.
      //   Al recibir la respuesta, llama a mostrarCursos() para
      //   renderizar los botones en el contenedor.
      // ---------------------------------------------------------------
      function cargarCursos() {
        // Realizamos una petición GET al endpoint que lista cursos
        fetch("panel_admin.php?accion=listar_cursos")
          .then(r => r.json()) // Convertimos la respuesta a JSON
          .then(cursos => mostrarCursos(cursos)) // Pasamos los datos a la función de renderizado
          .catch(e => console.error("Error al cargar cursos:", e)); // Manejamos errores en consola
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: mostrarCursos
      // DESCRIPCIÓN:
      //   Recibe un array de cursos y crea botones dinámicamente
      //   para cada uno, mostrando el nombre del curso y la cantidad
      //   de estudiantes. Cada botón tiene un evento click que
      //   activa la visualización detallada del curso.
      // PARÁMETRO:
      //   cursos → Array de objetos con datos de cada curso
      //            (id_curso, nombre_curso, descripcion_curso, cantidad_estudiantes)
      // ---------------------------------------------------------------
      function mostrarCursos(cursos) {
        // Obtenemos el contenedor donde se mostrarán los botones de cursos
        const contenedor = document.getElementById("contenedor-cursos");
        contenedor.innerHTML = ""; // Limpiamos el contenedor antes de llenarlo

        // Si no hay cursos registrados, mostramos un mensaje
        if (cursos.length === 0) {
          contenedor.innerHTML = "<p>No hay cursos registrados.</p>";
          return; // Salimos de la función
        }

        // Recorremos cada curso del array
        cursos.forEach(curso => {
          // Creamos un elemento button para cada curso
          const btn = document.createElement("button");
          
          // Agregamos la clase CSS que estiliza los botones de cursos
          btn.classList.add("curso-btn");
          
          // Establecemos el texto del botón: nombre del curso y cantidad de estudiantes
          // Ejemplo: "702 (15 estudiantes)"
          btn.textContent = `${curso.nombre_curso} (${curso.cantidad_estudiantes} estudiante${curso.cantidad_estudiantes !== 1 ? 's' : ''})`;
          
          // Agregamos un tooltip con la descripción del curso (visible al pasar el mouse)
          btn.title = curso.descripcion_curso || "Sin descripción";
          
          // Guardamos el ID del curso como atributo data para usarlo después
          btn.setAttribute("data-id-curso", curso.id_curso);
          btn.setAttribute("data-nombre-curso", curso.nombre_curso);
          
          // Agregamos un evento click que activa la visualización del curso
          btn.addEventListener("click", function() {
            seleccionarCurso(curso.id_curso, curso.nombre_curso);
          });
          
          // Agregamos el botón al contenedor en el DOM
          contenedor.appendChild(btn);
        });
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: seleccionarCurso
      // DESCRIPCIÓN:
      //   Se ejecuta cuando el usuario hace click en un botón de curso.
      //   Oculta todos los demás botones y muestra la tabla de estudiantes
      //   ya inscritos en el curso seleccionado.
      // PARÁMETROS:
      //   idCurso → ID numérico del curso seleccionado
      //   nombreCurso → Nombre del curso (para mostrar en la interfaz)
      // ---------------------------------------------------------------
      function seleccionarCurso(idCurso, nombreCurso) {
        // Obtenemos todos los botones de cursos del contenedor
        const todosLosBotones = document.querySelectorAll(".curso-btn");
        
        // Recorremos todos los botones y los ocultamos
        todosLosBotones.forEach(btn => {
          btn.style.display = "none";
          btn.classList.remove("curso-btn-seleccionado", "activo");
        });
        
        // Guardamos el ID del curso seleccionado para la inscripción
        cursoMatriculaActual = idCurso;
        
        // Ocultamos la tabla de inscripción si está visible
        const tablaInscripcionContainer = document.getElementById("tabla-inscripcion-container");
        if (tablaInscripcionContainer) {
          tablaInscripcionContainer.classList.add("oculto");
        }
        
        // Mostramos el contenedor de la tabla de estudiantes del curso
        const tablaEstudiantesContainer = document.getElementById("tabla-estudiantes-curso-container");
        if (tablaEstudiantesContainer) {
          tablaEstudiantesContainer.classList.remove("oculto");
        }
        
        // Cargamos y mostramos los estudiantes ya inscritos en el curso
        cargarEstudiantesCurso(idCurso);
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: cargarEstudiantesCurso
      // DESCRIPCIÓN:
      //   Realiza una petición GET al servidor para obtener la lista
      //   de estudiantes que pertenecen a un curso específico.
      //   Los estudiantes vienen ordenados alfabéticamente desde el servidor.
      // PARÁMETRO:
      //   idCurso → ID numérico del curso del cual queremos obtener estudiantes
      // ---------------------------------------------------------------
      function cargarEstudiantesCurso(idCurso) {
        // Realizamos una petición GET con el ID del curso como parámetro
        fetch(`panel_admin.php?accion=estudiantes_curso&id_curso=${idCurso}`)
          .then(r => r.json()) // Convertimos la respuesta a JSON
          .then(estudiantes => mostrarEstudiantesEnTabla(estudiantes)) // Mostramos en la tabla
          .catch(e => {
            console.error("Error al cargar estudiantes del curso:", e);
            // Si hay error, mostramos un mensaje en la tabla
            const tbody = document.getElementById("tbody-estudiantes-curso");
            if (tbody) {
              tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Error al cargar los estudiantes.</td></tr>';
            }
          });
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: mostrarEstudiantesEnTabla
      // DESCRIPCIÓN:
      //   Muestra los estudiantes del curso en una tabla con las columnas:
      //   Nombre, Tipo de documento, Número de documento.
      // PARÁMETRO:
      //   estudiantes → Array de objetos con datos de cada estudiante
      // ---------------------------------------------------------------
      function mostrarEstudiantesEnTabla(estudiantes) {
        const tbody = document.getElementById("tbody-estudiantes-curso");
        if (!tbody) {
          console.error("No se encontró el tbody para la tabla de estudiantes del curso");
          return;
        }
        
        // Limpiamos la tabla antes de llenarla
        tbody.innerHTML = "";
        
        // Si no hay estudiantes en el curso, mostramos un mensaje
        if (estudiantes.length === 0) {
          tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Este curso no tiene estudiantes registrados.</td></tr>';
          return;
        }
        
        // Recorremos cada estudiante y creamos una fila en la tabla
        estudiantes.forEach(estudiante => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${estudiante.nombre || '—'}</td>
            <td>${estudiante.tipo_documento || '—'}</td>
            <td>${estudiante.numero_documento || '—'}</td>
          `;
          tbody.appendChild(tr);
        });
      }

//=========================================  FIN  ===========================================================

      // ---------------------------------------------------------------
      // FUNCIÓN: volverAListaCursos
      // DESCRIPCIÓN:
      //   Restaura la vista inicial mostrando todos los botones de cursos
      //   y ocultando las tablas de estudiantes e inscripción.
      // ---------------------------------------------------------------
      function volverAListaCursos() {
        // Obtenemos todos los botones de cursos
        const todosLosBotones = document.querySelectorAll(".curso-btn");
        
        // Recorremos todos los botones y los mostramos nuevamente
        todosLosBotones.forEach(btn => {
          btn.style.display = ""; // Restauramos el display por defecto
          btn.classList.remove("curso-btn-seleccionado", "activo");
        });
        
        // Ocultamos el contenedor de la tabla de estudiantes del curso
        const tablaEstudiantesContainer = document.getElementById("tabla-estudiantes-curso-container");
        if (tablaEstudiantesContainer) {
          tablaEstudiantesContainer.classList.add("oculto");
        }
        
        // Ocultamos el contenedor de la tabla de inscripción
        const tablaInscripcionContainer = document.getElementById("tabla-inscripcion-container");
        if (tablaInscripcionContainer) {
          tablaInscripcionContainer.classList.add("oculto");
        }
        
        // Limpiamos la variable del curso actual
        cursoMatriculaActual = null;
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: mostrarTablaInscripcion
      // DESCRIPCIÓN:
      //   Muestra la tabla de inscripción con todos los estudiantes
      //   disponibles para inscribir en el curso.
      // ---------------------------------------------------------------
      function mostrarTablaInscripcion() {
        if (!cursoMatriculaActual) {
          alert('No se ha seleccionado un curso');
          return;
        }
        
        // Ocultamos la tabla de estudiantes del curso
        const tablaEstudiantesContainer = document.getElementById("tabla-estudiantes-curso-container");
        if (tablaEstudiantesContainer) {
          tablaEstudiantesContainer.classList.add("oculto");
        }
        
        // Mostramos la tabla de inscripción
        const tablaInscripcionContainer = document.getElementById("tabla-inscripcion-container");
        if (tablaInscripcionContainer) {
          tablaInscripcionContainer.classList.remove("oculto");
        }
        
        // Cargamos los estudiantes disponibles para inscribir
        cargarEstudiantesParaInscripcion();
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: ocultarTablaInscripcion
      // DESCRIPCIÓN:
      //   Oculta la tabla de inscripción y vuelve a mostrar la tabla
      //   de estudiantes del curso.
      // ---------------------------------------------------------------
      function ocultarTablaInscripcion() {
        // Ocultamos la tabla de inscripción
        const tablaInscripcionContainer = document.getElementById("tabla-inscripcion-container");
        if (tablaInscripcionContainer) {
          tablaInscripcionContainer.classList.add("oculto");
        }
        
        // Mostramos la tabla de estudiantes del curso
        const tablaEstudiantesContainer = document.getElementById("tabla-estudiantes-curso-container");
        if (tablaEstudiantesContainer) {
          tablaEstudiantesContainer.classList.remove("oculto");
        }
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: inscribirEstudiantesSeleccionados
      // DESCRIPCIÓN:
      //   Inscribe los estudiantes seleccionados en el curso actual.
      //   Usa la función guardarInscripcionEstudiantes existente.
      // ---------------------------------------------------------------
      function inscribirEstudiantesSeleccionados() {
        guardarInscripcionEstudiantes();
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: gestionarInscripcionEstudiantes
      // DESCRIPCIÓN:
      //   Gestiona el proceso de inscripción de estudiantes en un curso.
      //   Si la tabla está vacía o muestra el mensaje inicial, carga los estudiantes.
      //   Si la tabla ya tiene estudiantes cargados, guarda los estudiantes seleccionados.
      // ---------------------------------------------------------------
      function gestionarInscripcionEstudiantes() {
        if (!cursoMatriculaActual) {
          mostrarMensajeInscripcion('No se ha seleccionado un curso', 'error');
          return;
        }
        
        const tbody = document.getElementById("tbody-inscripcion-estudiantes");
        if (!tbody) {
          console.error("No se encontró el tbody para la tabla de inscripción");
          return;
        }
        
        // Verificamos si la tabla ya tiene estudiantes cargados
        const primeraFila = tbody.querySelector('tr');
        const tieneEstudiantes = primeraFila && 
                                 !primeraFila.textContent.includes("Haga clic en el botón") &&
                                 primeraFila.querySelector('input[type="checkbox"]');
        
        if (!tieneEstudiantes) {
          // Primera vez: Cargar estudiantes desde el servidor
          cargarEstudiantesParaInscripcion();
        } else {
          // Segunda vez: Guardar estudiantes seleccionados
          guardarInscripcionEstudiantes();
        }
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: cargarEstudiantesParaInscripcion
      // DESCRIPCIÓN:
      //   Carga la lista de todos los estudiantes disponibles para inscribir
      //   desde el servidor y los muestra en la tabla de inscripción.
      //   Excluye los estudiantes ya matriculados en el curso actual.
      // ---------------------------------------------------------------
      function cargarEstudiantesParaInscripcion() {
        if (!cursoMatriculaActual) {
          mostrarMensajeInscripcion('No se ha seleccionado un curso', 'error');
          return;
        }
        
        const btnInscribir = document.getElementById("btn-inscribir-estudiantes");
        const textoOriginal = btnInscribir ? btnInscribir.textContent : "Inscribir";
        if (btnInscribir) {
          btnInscribir.textContent = "Cargando...";
          btnInscribir.disabled = true;
        }
        
        // Construimos la URL con el parámetro curso_id para excluir estudiantes ya matriculados
        const url = `panel_admin.php?accion=listar_estudiantes&curso_id=${cursoMatriculaActual}`;
        
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            // Verificar que la respuesta sea JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              return response.text().then(text => {
                console.error("Respuesta no es JSON:", text);
                throw new Error('La respuesta del servidor no es JSON válido');
              });
            }
            return response.json();
          })
          .then(data => {
            if (btnInscribir) {
              btnInscribir.textContent = textoOriginal;
              btnInscribir.disabled = false;
            }
            
            // Verificar que data existe y tiene la estructura esperada
            if (!data) {
              console.error("No se recibieron datos del servidor");
              mostrarMensajeInscripcion('No se recibieron datos del servidor', 'error');
              return;
            }
            
            if (data.success === true || data.success === undefined) {
              // Si success es true o no existe, asumimos que es exitoso
              todosLosEstudiantes = data.estudiantes || [];
              mostrarEstudiantesEnTablaInscripcion(todosLosEstudiantes);
            } else {
              console.error("Error al cargar estudiantes:", data.message || 'Error desconocido', data);
              mostrarMensajeInscripcion(data.message || 'Error al cargar los estudiantes', 'error');
            }
          })
          .catch(error => {
            console.error("❌ Error al cargar estudiantes:", error);
            mostrarMensajeInscripcion('Error al cargar los estudiantes: ' + error.message, 'error');
            if (btnInscribir) {
              btnInscribir.textContent = textoOriginal;
              btnInscribir.disabled = false;
            }
          });
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: mostrarEstudiantesEnTablaInscripcion
      // DESCRIPCIÓN:
      //   Muestra la lista de estudiantes en la tabla de inscripción.
      //   Cada estudiante tiene un checkbox para seleccionarlo.
      //   Muestra: Nombre, Tipo de documento, Número de documento.
      // PARÁMETRO:
      //   estudiantes → Array de estudiantes a mostrar
      // ---------------------------------------------------------------
      function mostrarEstudiantesEnTablaInscripcion(estudiantes) {
        const tbody = document.getElementById("tbody-inscripcion-estudiantes");
        if (!tbody) {
          console.error("No se encontró el tbody para la tabla de inscripción");
          return;
        }
        
        tbody.innerHTML = '';
        
        if (estudiantes.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="4" style="text-align: center; padding: 20px;">
                No hay estudiantes disponibles para inscribir en este curso.
              </td>
            </tr>
          `;
          return;
        }
        
        // Recorremos cada estudiante y creamos una fila en la tabla
        estudiantes.forEach(estudiante => {
          const tr = document.createElement('tr');
          
          tr.innerHTML = `
            <td style="text-align: center;">
              <input type="checkbox" class="chk-estudiante-inscripcion" 
                     data-id="${estudiante.id_estudiante}" 
                     data-nombre="${estudiante.nombre || estudiante.nombre_completo || ''}">
            </td>
            <td>${estudiante.nombre || estudiante.nombre_completo || '—'}</td>
            <td>${estudiante.tipo_documento || '—'}</td>
            <td>${estudiante.numero_documento || '—'}</td>
          `;
          
          tbody.appendChild(tr);
        });
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: guardarInscripcionEstudiantes
      // DESCRIPCIÓN:
      //   Guarda las inscripciones de los estudiantes seleccionados en el curso.
      //   Envía los datos al servidor para que se registren en la tabla estudiante_curso.
      // ---------------------------------------------------------------
      function guardarInscripcionEstudiantes() {
        if (!cursoMatriculaActual) {
          mostrarMensajeInscripcion('No se ha seleccionado un curso', 'error');
          return;
        }
        
        const checkboxes = document.querySelectorAll('.chk-estudiante-inscripcion:checked');
        const estudiantesIds = Array.from(checkboxes).map(cb => {
          const id = cb.getAttribute('data-id');
          return id ? parseInt(id) : null;
        }).filter(id => id !== null);
        
        
        if (estudiantesIds.length === 0) {
          mostrarMensajeInscripcion('Debe seleccionar al menos un estudiante para inscribir', 'error');
          return;
        }
        
        const datos = new FormData();
        datos.append("accion", "matricular_estudiantes");
        datos.append("curso_id", cursoMatriculaActual);
        datos.append("estudiantes_ids", JSON.stringify(estudiantesIds));
        
        const btnInscribir = document.getElementById("btn-inscribir-estudiantes");
        const textoOriginal = btnInscribir ? btnInscribir.textContent : "Inscribir";
        if (btnInscribir) {
          btnInscribir.textContent = "Inscribiendo...";
          btnInscribir.disabled = true;
        }
        
        fetch("panel_admin.php", {
          method: "POST",
          body: datos
        })
          .then(response => {
            return response.json();
          })
          .then(data => {
            if (btnInscribir) {
              btnInscribir.textContent = textoOriginal;
              btnInscribir.disabled = false;
            }
            
            if (data.success) {
              mostrarMensajeInscripcion('Estudiantes inscritos correctamente en el curso', 'success');
              
              // Ocultar la tabla de inscripción
              ocultarTablaInscripcion();
              
              // Recargar la tabla de estudiantes del curso para mostrar los nuevos inscritos
              cargarEstudiantesCurso(cursoMatriculaActual);
              
              // Recargar cursos para actualizar el contador
              cargarCursos();
            } else {
              console.error('Error del servidor:', data.message);
              mostrarMensajeInscripcion(data.message || 'Error al inscribir estudiantes', 'error');
            }
          })
          .catch(error => {
            console.error("❌ Error al inscribir estudiantes:", error);
            mostrarMensajeInscripcion('Error al inscribir estudiantes: ' + error.message, 'error');
            if (btnInscribir) {
              btnInscribir.textContent = textoOriginal;
              btnInscribir.disabled = false;
            }
          });
      }

      // ---------------------------------------------------------------
      // FUNCIÓN: mostrarMensajeInscripcion
      // DESCRIPCIÓN:
      //   Muestra un mensaje en la sección de inscripción de estudiantes.
      // PARÁMETROS:
      //   mensaje → Texto del mensaje
      //   tipo → Tipo de mensaje ('success' o 'error')
      // ---------------------------------------------------------------
      function mostrarMensajeInscripcion(mensaje, tipo) {
        const mensajeElement = document.getElementById('mensaje-inscripcion');
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

//=========================================  FIN  ===========================================================


// ================================================================
// SECCIÓN: FUNCIONES DEL PERFIL DEL ADMINISTRADOR
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarPerfil
// DESCRIPCIÓN:
//   Carga los datos del perfil del administrador desde el servidor
//   y los muestra en el formulario de perfil.
//   Se ejecuta automáticamente cuando se accede a la sección de perfil.
// ---------------------------------------------------------------
function cargarPerfil() {
  // Realizamos una petición GET para obtener los datos del perfil
  fetch("panel_admin.php?accion=obtener_perfil")
    .then(response => response.json())
    .then(data => {
      // Si hay datos, los mostramos en el formulario
      if (data.success) {
        // Llenamos los campos del formulario
        document.getElementById('perfil-nombre').value = data.nombre || '';
        document.getElementById('perfil-correo').value = data.correo || '';
        document.getElementById('perfil-telefono').value = data.telefono || '';
        document.getElementById('perfil-cargo').value = data.cargo || '';
        document.getElementById('perfil-tipo-documento').value = data.tipo_documento || '';
        document.getElementById('perfil-numero-documento').value = data.numero_documento || '';

        // Actualizamos la foto de perfil
        if (data.profile_image && data.profile_image !== '') {
          document.getElementById('foto-perfil').src = data.profile_image;
        } else {
          document.getElementById('foto-perfil').src = './imagenes_de_pagina/sin_foto_perfil.jpeg';
        }
      } else {
        console.error("Error al cargar el perfil:", data.message);
        mostrarMensajePerfil('Error al cargar el perfil', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar el perfil:", error);
      mostrarMensajePerfil('Error al cargar el perfil', 'error');
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: toggleEditarPerfil
// DESCRIPCIÓN:
//   Activa o desactiva el modo de edición del perfil.
//   Cuando está en modo edición, los campos se desbloquean
//   y aparece el botón "Actualizar perfil".
// ---------------------------------------------------------------
function toggleEditarPerfil() {
  const btnEditar = document.getElementById('btn-editar-perfil');
  const btnActualizar = document.getElementById('btn-actualizar-perfil');
  const inputs = document.querySelectorAll('#form-perfil input, #form-perfil select');

  // Verificamos si estamos en modo edición
  const estaEditando = btnEditar.textContent === 'Cancelar';

  if (estaEditando) {
    // Modo visualización: bloqueamos los campos
    inputs.forEach(input => {
      input.readOnly = true;
      input.disabled = true;
    });
    btnEditar.textContent = 'Editar';
    btnActualizar.style.display = 'none';
    
    // Recargamos los datos del servidor para descartar cambios
    cargarPerfil();
  } else {
    // Modo edición: desbloqueamos los campos
    inputs.forEach(input => {
      input.readOnly = false;
      input.disabled = false;
    });
    btnEditar.textContent = 'Cancelar';
    btnActualizar.style.display = 'block';
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: actualizarPerfil
// DESCRIPCIÓN:
//   Valida y envía los datos del perfil al servidor para actualizarlos.
//   Valida que el número de documento contenga solo números y que
//   el correo tenga formato válido.
// ---------------------------------------------------------------
function actualizarPerfil() {
  // Capturamos los valores del formulario
  const nombre = document.getElementById('perfil-nombre').value.trim();
  const correo = document.getElementById('perfil-correo').value.trim();
  const telefono = document.getElementById('perfil-telefono').value.trim();
  const cargo = document.getElementById('perfil-cargo').value.trim();
  const tipoDocumento = document.getElementById('perfil-tipo-documento').value.trim();
  const numeroDocumento = document.getElementById('perfil-numero-documento').value.trim();

  // Validaciones
  if (!nombre) {
    mostrarMensajePerfil('El nombre es obligatorio', 'error');
    return;
  }

  if (!correo) {
    mostrarMensajePerfil('El correo es obligatorio', 'error');
    return;
  }

  if (!validarEmail(correo)) {
    mostrarMensajePerfil('El formato del correo no es válido', 'error');
    return;
  }

  if (numeroDocumento && !validarSoloNumeros(numeroDocumento)) {
    mostrarMensajePerfil('El número de documento solo debe contener números', 'error');
    return;
  }

  // Validar teléfono (puede contener números, espacios, + y -)
  if (telefono && !/^[\d\s\+\-\(\)]+$/.test(telefono)) {
    mostrarMensajePerfil('El formato del teléfono no es válido', 'error');
    return;
  }

  // Preparamos los datos para enviar
  const datos = new FormData();
  datos.append("accion", "actualizar_perfil");
  datos.append("nombre", nombre);
  datos.append("correo", correo);
  datos.append("telefono", telefono);
  datos.append("cargo", cargo);
  datos.append("tipo_documento", tipoDocumento);
  datos.append("numero_documento", numeroDocumento);

  // Mostramos un indicador de carga
  const btnActualizar = document.getElementById('btn-actualizar-perfil');
  const textoOriginal = btnActualizar.textContent;
  btnActualizar.textContent = "Actualizando...";
  btnActualizar.disabled = true;

  // Enviamos los datos al servidor
  fetch("panel_admin.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      // Restauramos el botón
      btnActualizar.textContent = textoOriginal;
      btnActualizar.disabled = false;

      if (data.success) {
        mostrarMensajePerfil('Perfil actualizado correctamente', 'success');
        // Salimos del modo edición
        toggleEditarPerfil();
      } else {
        mostrarMensajePerfil(data.message || 'Error al actualizar el perfil', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al actualizar el perfil:", error);
      mostrarMensajePerfil('Error al actualizar el perfil', 'error');
      btnActualizar.textContent = textoOriginal;
      btnActualizar.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: actualizarPassword
// DESCRIPCIÓN:
//   Valida y actualiza la contraseña del administrador.
//   Verifica que la contraseña actual sea correcta, que la nueva
//   contraseña coincida con la confirmación y que tenga al menos 6 caracteres.
// ---------------------------------------------------------------
function actualizarPassword() {
  // Capturamos los valores del formulario
  const passwordActual = document.getElementById('password-actual').value.trim();
  const passwordNueva = document.getElementById('password-nueva').value.trim();
  const passwordConfirmar = document.getElementById('password-confirmar').value.trim();

  // Validaciones
  if (!passwordActual) {
    mostrarMensajePassword('Debe ingresar la contraseña actual', 'error');
    return;
  }

  if (!passwordNueva || passwordNueva.length < 6) {
    mostrarMensajePassword('La nueva contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  if (passwordNueva !== passwordConfirmar) {
    mostrarMensajePassword('Las contraseñas no coinciden', 'error');
    return;
  }

  // Preparamos los datos para enviar
  const datos = new FormData();
  datos.append("accion", "actualizar_password");
  datos.append("password_actual", passwordActual);
  datos.append("password_nueva", passwordNueva);

  // Mostramos un indicador de carga
  const btnPassword = document.querySelector('#form-password button[type="button"]');
  const textoOriginal = btnPassword.textContent;
  btnPassword.textContent = "Actualizando...";
  btnPassword.disabled = true;

  // Enviamos los datos al servidor
  fetch("panel_admin.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      // Restauramos el botón
      btnPassword.textContent = textoOriginal;
      btnPassword.disabled = false;

      if (data.success) {
        mostrarMensajePassword('Contraseña actualizada correctamente', 'success');
        // Limpiamos el formulario
        document.getElementById('form-password').reset();
      } else {
        mostrarMensajePassword(data.message || 'Error al actualizar la contraseña', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al actualizar la contraseña:", error);
      mostrarMensajePassword('Error al actualizar la contraseña', 'error');
      btnPassword.textContent = textoOriginal;
      btnPassword.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: abrirModalFoto
// DESCRIPCIÓN:
//   Abre el modal para subir una nueva foto de perfil.
//   SOLO se ejecuta cuando el usuario hace clic en el botón
//   "Modificar foto de perfil" en la sección de Perfil.
//   NO se ejecuta automáticamente al cargar la página.
// ---------------------------------------------------------------
function abrirModalFoto() {
  // Verificamos que el modal exista antes de intentar abrirlo
  const modal = document.getElementById('modal-foto');
  if (!modal) {
    console.error("No se encontró el modal de foto");
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
  const inputFoto = document.getElementById('input-foto');
  if (inputFoto) {
    // Removemos listeners previos para evitar duplicados
    const nuevoInput = inputFoto.cloneNode(true);
    inputFoto.parentNode.replaceChild(nuevoInput, inputFoto);
    
    nuevoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const imgPreview = document.getElementById('img-preview');
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
// FUNCIÓN: cerrarModalFoto
// DESCRIPCIÓN:
//   Cierra el modal de subida de foto de perfil y limpia el formulario.
// ---------------------------------------------------------------
function cerrarModalFoto() {
  const modal = document.getElementById('modal-foto');
  modal.classList.add('oculto');
  
  // Limpiamos el formulario
  document.getElementById('form-foto').reset();
  document.getElementById('img-preview').style.display = 'none';
}

// ---------------------------------------------------------------
// FUNCIÓN: subirFotoPerfil
// DESCRIPCIÓN:
//   Valida y sube la foto de perfil al servidor.
//   Valida el tipo de archivo (solo jpg, jpeg, png) y el tamaño (máximo 2MB).
//   Actualiza la imagen mostrada dinámicamente después de subirla.
// ---------------------------------------------------------------
function subirFotoPerfil() {
  const inputFoto = document.getElementById('input-foto');
  const file = inputFoto.files[0];

  // Validaciones
  if (!file) {
    alert('Por favor seleccione una imagen');
    return;
  }

  // Validar tipo de archivo
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!tiposPermitidos.includes(file.type)) {
    alert('Solo se permiten archivos JPG, JPEG o PNG');
    return;
  }

  // Validar tamaño (máximo 2MB)
  const tamanioMaximo = 2 * 1024 * 1024; // 2MB en bytes
  if (file.size > tamanioMaximo) {
    alert('La imagen no debe superar los 2MB');
    return;
  }

  // Preparamos los datos para enviar
  const datos = new FormData();
  datos.append("accion", "subir_foto_perfil");
  datos.append("foto", file);

  // Mostramos un indicador de carga
  const btnSubir = document.querySelector('#form-foto button[type="button"]');
  const textoOriginal = btnSubir.textContent;
  btnSubir.textContent = "Subiendo...";
  btnSubir.disabled = true;

  // Enviamos la imagen al servidor
  fetch("panel_admin.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      // Restauramos el botón
      btnSubir.textContent = textoOriginal;
      btnSubir.disabled = false;

      if (data.success) {
        // Actualizamos la imagen mostrada
        document.getElementById('foto-perfil').src = data.imageUrl;
        // Cerramos el modal
        cerrarModalFoto();
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
// FUNCIÓN: togglePassword
// DESCRIPCIÓN:
//   Muestra u oculta la contraseña en el campo especificado.
//   Iconos: ◉ (mostrar cuando está oculta) y ◎ (ocultar cuando está visible)
// PARÁMETRO:
//   inputId → ID del campo de contraseña a mostrar/ocultar
// ---------------------------------------------------------------
function togglePassword(inputId) {
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
// FUNCIÓN: mostrarMensajePerfil
// DESCRIPCIÓN:
//   Muestra un mensaje en la sección de información personal del perfil.
// PARÁMETROS:
//   mensaje → Texto del mensaje a mostrar
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajePerfil(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-perfil');
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

  // Ocultamos el mensaje después de 5 segundos
  setTimeout(() => {
    mensajeElement.style.display = 'none';
  }, 5000);
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajePassword
// DESCRIPCIÓN:
//   Muestra un mensaje en la sección de cambio de contraseña del perfil.
// PARÁMETROS:
//   mensaje → Texto del mensaje a mostrar
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajePassword(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-password');
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

  // Ocultamos el mensaje después de 5 segundos
  setTimeout(() => {
    mensajeElement.style.display = 'none';
  }, 5000);
}

// ---------------------------------------------------------------
// FUNCIÓN: cerrarSesion()
// DESCRIPCIÓN:
//   Simula el cierre de sesión del usuario y lo redirige al login.
// ---------------------------------------------------------------
function cerrarSesion() {
  alert("Sesión cerrada correctamente");
  window.location.href = "index.html"; // Redirige al login
}

// ================================================================
// SECCIÓN: FUNCIONES DE MATRÍCULA DE ESTUDIANTES
// ================================================================

// Variable global para almacenar el curso actual seleccionado para matrícula
let cursoMatriculaActual = null;
let todosLosEstudiantes = [];

// ---------------------------------------------------------------
// FUNCIÓN: abrirModalMatricula
// DESCRIPCIÓN:
//   Abre el modal para matricular estudiantes en un curso.
//   SOLO se ejecuta cuando el usuario hace clic en el botón
//   "Matricular estudiantes en este curso" en la sección de Cursos.
//   NO se ejecuta automáticamente al cargar la página.
// ---------------------------------------------------------------
function abrirModalMatricula() {
  // Verificamos que el modal exista antes de intentar abrirlo
  const modal = document.getElementById('modal-matricula');
  if (!modal) {
    console.error("No se encontró el modal de matrícula");
    return;
  }
  
  // Solo abrimos el modal si el usuario está en la sección de cursos
  const seccionCursos = document.getElementById('cursos');
  if (!seccionCursos || seccionCursos.classList.contains('oculto')) {
    console.warn("El modal de matrícula solo se puede abrir desde la sección de Cursos");
    return;
  }
  
  // Obtenemos el ID del curso desde el botón
  const btnRegistrar = document.getElementById('btn-registrar-usuarios');
  if (!btnRegistrar) {
    alert('No se ha seleccionado un curso');
    return;
  }
  
  const cursoId = btnRegistrar.getAttribute('data-id-curso');
  if (!cursoId) {
    alert('No se ha seleccionado un curso');
    return;
  }
  
  // Guardamos el ID del curso y abrimos el modal
  cursoMatriculaActual = cursoId;
  modal.classList.remove('oculto');
  // Cargamos estudiantes excluyendo los ya matriculados en este curso
  cargarEstudiantesParaMatricula(cursoId);
}

// ---------------------------------------------------------------
// FUNCIÓN: cerrarModalMatricula
// DESCRIPCIÓN:
//   Cierra el modal de matrícula y limpia los campos.
// ---------------------------------------------------------------
function cerrarModalMatricula() {
  document.getElementById('modal-matricula').classList.add('oculto');
  document.getElementById('buscar-estudiante-matricula').value = '';
  cursoMatriculaActual = null;
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarEstudiantesParaMatricula
// DESCRIPCIÓN:
//   Carga la lista de todos los estudiantes disponibles para matricular.
//   Si se proporciona cursoId, excluye los estudiantes ya matriculados en ese curso.
// PARÁMETRO:
//   cursoId → ID del curso (opcional) para filtrar estudiantes ya matriculados
// ---------------------------------------------------------------
function cargarEstudiantesParaMatricula(cursoId = null) {
  // Construimos la URL con el parámetro curso_id si se proporciona
  let url = "panel_admin.php?accion=listar_estudiantes";
  if (cursoId) {
    url += "&curso_id=" + cursoId;
  }
  
  fetch(url)
    .then(response => {
      // Verificamos que la respuesta sea válida
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        todosLosEstudiantes = data.estudiantes || [];
        mostrarEstudiantesMatricula(todosLosEstudiantes);
      } else {
        console.error("Error al cargar estudiantes:", data.message || 'Error desconocido');
        const tbody = document.getElementById('tbody-estudiantes-matricula');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #dc3545;">' + 
                           (data.message || 'Error al cargar los estudiantes') + '</td></tr>';
        }
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar estudiantes:", error);
      const tbody = document.getElementById('tbody-estudiantes-matricula');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #dc3545;">Error al cargar los estudiantes. Verifique la conexión.</td></tr>';
      }
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarEstudiantesMatricula
// DESCRIPCIÓN:
//   Muestra la lista de estudiantes en la tabla del modal de matrícula.
// PARÁMETRO:
//   estudiantes → Array de estudiantes a mostrar
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// FUNCIÓN: mostrarEstudiantesMatricula
// DESCRIPCIÓN:
//   Muestra la lista de estudiantes en la tabla del modal de matrícula.
//   Cada estudiante tiene un checkbox para seleccionarlo.
//   Muestra: Nombre completo, Tipo de documento, Número de documento y Correo.
// PARÁMETRO:
//   estudiantes → Array de estudiantes a mostrar
// ---------------------------------------------------------------
function mostrarEstudiantesMatricula(estudiantes) {
  const tbody = document.getElementById('tbody-estudiantes-matricula');
  if (!tbody) {
    console.error("No se encontró el tbody para estudiantes");
    return;
  }
  
  tbody.innerHTML = '';
  
  if (estudiantes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay estudiantes disponibles</td></tr>';
    return;
  }
  
  // Recorremos cada estudiante y creamos una fila en la tabla
  estudiantes.forEach(estudiante => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-estudiante-id', estudiante.id_estudiante);
    
    // Construimos el texto del documento (tipo + número)
    let documentoTexto = '—';
    if (estudiante.tipo_documento && estudiante.numero_documento) {
      documentoTexto = `${estudiante.tipo_documento}: ${estudiante.numero_documento}`;
    } else if (estudiante.numero_documento) {
      documentoTexto = estudiante.numero_documento;
    }
    
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="chk-estudiante-matricula" 
               data-id="${estudiante.id_estudiante}" 
               data-nombre="${estudiante.nombre}">
      </td>
      <td>${estudiante.nombre || '—'}</td>
      <td>${documentoTexto}</td>
      <td>${estudiante.correo || '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------
// FUNCIÓN: filtrarEstudiantesMatricula
// DESCRIPCIÓN:
//   Filtra la lista de estudiantes según el texto de búsqueda.
// PARÁMETRO:
//   texto → Texto de búsqueda
// ---------------------------------------------------------------
function filtrarEstudiantesMatricula(texto) {
  const textoLower = texto.toLowerCase();
  const filas = document.querySelectorAll('#tbody-estudiantes-matricula tr');
  
  filas.forEach(fila => {
    const textoFila = fila.textContent.toLowerCase();
    if (textoFila.includes(textoLower)) {
      fila.style.display = '';
    } else {
      fila.style.display = 'none';
    }
  });
}

// ---------------------------------------------------------------
// FUNCIÓN: guardarMatriculas
// DESCRIPCIÓN:
//   Guarda las matrículas de los estudiantes seleccionados en el curso.
// ---------------------------------------------------------------
function guardarMatriculas() {
  if (!cursoMatriculaActual) {
    alert('No se ha seleccionado un curso');
    return;
  }
  
  const checkboxes = document.querySelectorAll('.chk-estudiante-matricula:checked');
  const estudiantesIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
  
  if (estudiantesIds.length === 0) {
    alert('Debe seleccionar al menos un estudiante');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "matricular_estudiantes");
  datos.append("curso_id", cursoMatriculaActual);
  datos.append("estudiantes_ids", JSON.stringify(estudiantesIds));
  
  const btnGuardar = document.querySelector('#modal-matricula button[onclick="guardarMatriculas()"]');
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.textContent = "Matriculando...";
  btnGuardar.disabled = true;
  
  fetch("panel_admin.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
      
      if (data.success) {
        mostrarMensajeMatricula('Estudiantes matriculados correctamente', 'success');
        cerrarModalMatricula();
        // Recargar el mapa de estudiantes del curso
        cargarEstudiantesCurso(cursoMatriculaActual);
        // Recargar cursos para actualizar el contador
        cargarCursos();
      } else {
        mostrarMensajeMatricula(data.message || 'Error al matricular estudiantes', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al matricular estudiantes:", error);
      mostrarMensajeMatricula('Error al matricular estudiantes', 'error');
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajeMatricula
// DESCRIPCIÓN:
//   Muestra un mensaje en el modal de matrícula.
// PARÁMETROS:
//   mensaje → Texto del mensaje
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajeMatricula(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-matricula');
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
// SECCIÓN: FUNCIONES DE VINCULACIÓN DE DOCENTES A CURSOS
// ================================================================

// Variable global para almacenar el curso actual seleccionado para vincular docente
let cursoVinculacionActual = null;

// ---------------------------------------------------------------
// FUNCIÓN: abrirModalVincularDocente
// DESCRIPCIÓN:
//   Abre el modal para vincular un docente a un curso.
//   SOLO se ejecuta cuando el usuario hace clic en el botón
//   "Vincular docente" en la sección de Cursos.
//   NO se ejecuta automáticamente al cargar la página.
// ---------------------------------------------------------------
function abrirModalVincularDocente() {
  // Verificamos que el modal exista antes de intentar abrirlo
  const modal = document.getElementById('modal-vincular-docente');
  if (!modal) {
    console.error("No se encontró el modal de vincular docente");
    return;
  }
  
  // Solo abrimos el modal si el usuario está en la sección de cursos
  const seccionCursos = document.getElementById('cursos');
  if (!seccionCursos || seccionCursos.classList.contains('oculto')) {
    console.warn("El modal de vincular docente solo se puede abrir desde la sección de Cursos");
    return;
  }
  
  // Obtenemos el ID del curso desde el botón
  const btnVincular = document.getElementById('btn-vincular-docente');
  if (!btnVincular) {
    alert('No se ha seleccionado un curso');
    return;
  }
  
  const cursoId = btnVincular.getAttribute('data-id-curso');
  if (!cursoId) {
    alert('No se ha seleccionado un curso');
    return;
  }
  
  // Guardamos el ID del curso y abrimos el modal
  cursoVinculacionActual = cursoId;
  modal.classList.remove('oculto');
  
  // Cargamos los docentes disponibles si no están cargados
  const selectDocente = document.getElementById('vincular-docente-select');
  if (selectDocente && selectDocente.options.length <= 1) {
    cargarDocentesParaVinculacion();
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: cerrarModalVincularDocente
// DESCRIPCIÓN:
//   Cierra el modal de vincular docente y limpia los campos.
// ---------------------------------------------------------------
function cerrarModalVincularDocente() {
  const modal = document.getElementById('modal-vincular-docente');
  if (!modal) return;
  modal.classList.add('oculto');
  const form = document.getElementById('form-vincular-docente');
  if (form) form.reset();
  cursoVinculacionActual = null;
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarDocentesParaVinculacion
// DESCRIPCIÓN:
//   Carga la lista de docentes disponibles para vincular a cursos.
// ---------------------------------------------------------------
function cargarDocentesParaVinculacion() {
  fetch("panel_admin.php?accion=listar_docentes")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const select = document.getElementById('vincular-docente-select');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un docente...</option>';
        data.docentes.forEach(docente => {
          const option = document.createElement('option');
          option.value = docente.id_docente;
          option.textContent = docente.nombre;
          select.appendChild(option);
        });
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar docentes:", error);
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: guardarVinculacionDocente
// DESCRIPCIÓN:
//   Guarda la vinculación de un docente a un curso.
// ---------------------------------------------------------------
function guardarVinculacionDocente() {
  if (!cursoVinculacionActual) {
    alert('No se ha seleccionado un curso');
    return;
  }
  
  const docenteId = document.getElementById('vincular-docente-select')?.value;
  const materiaId = document.getElementById('vincular-materia-select')?.value || '';
  
  if (!docenteId) {
    alert('Debe seleccionar un docente');
    return;
  }
  
  const datos = new FormData();
  datos.append("accion", "vincular_docente_curso");
  datos.append("docente_id", docenteId);
  datos.append("curso_id", cursoVinculacionActual);
  if (materiaId) {
    datos.append("materia_id", materiaId);
  }
  
  const btnGuardar = document.querySelector('#form-vincular-docente button[onclick="guardarVinculacionDocente()"]');
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.textContent = "Vinculando...";
  btnGuardar.disabled = true;
  
  fetch("panel_admin.php", {
    method: "POST",
    body: datos
  })
    .then(response => response.json())
    .then(data => {
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
      
      if (data.success) {
        mostrarMensajeVinculacionDocente('Docente vinculado al curso correctamente', 'success');
        cerrarModalVincularDocente();
        // Recargar cursos para actualizar la información
        cargarCursos();
      } else {
        mostrarMensajeVinculacionDocente(data.message || 'Error al vincular el docente', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al vincular docente:", error);
      mostrarMensajeVinculacionDocente('Error al vincular el docente', 'error');
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajeVinculacionDocente
// DESCRIPCIÓN:
//   Muestra un mensaje en el modal de vincular docente.
// PARÁMETROS:
//   mensaje → Texto del mensaje
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajeVinculacionDocente(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-vincular-docente');
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

// ================================================================
// SECCIÓN: FUNCIONES DE HORARIOS (ADMIN)
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: cargarHorariosAdmin
// DESCRIPCIÓN:
//   Carga los datos necesarios cuando se accede a la sección de horarios.
//   Carga los docentes y cursos en los selects del formulario y filtros.
// ---------------------------------------------------------------
function cargarHorariosAdmin() {
  // Cargar docentes en el formulario
  cargarDocentesParaHorario();
  // Cargar cursos en el formulario
  cargarCursosParaHorario();
  // Cargar docentes en el filtro
  cargarDocentesParaFiltro();
  // Cargar cursos en el filtro
  cargarCursosParaFiltro();
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarDocentesParaHorario
// DESCRIPCIÓN:
//   Carga los docentes en el select del formulario de horarios.
// ---------------------------------------------------------------
function cargarDocentesParaHorario() {
  fetch("panel_admin.php?accion=listar_docentes")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const select = document.getElementById('horario-docente');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un profesor...</option>';
        data.docentes.forEach(docente => {
          const option = document.createElement('option');
          option.value = docente.id_docente;
          option.textContent = docente.nombre;
          select.appendChild(option);
        });
      }
    })
    .catch(error => console.error("❌ Error al cargar docentes:", error));
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarCursosParaHorario
// DESCRIPCIÓN:
//   Carga los cursos en el select del formulario de horarios.
// ---------------------------------------------------------------
function cargarCursosParaHorario() {
  fetch("panel_admin.php?accion=listar_cursos")
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        const select = document.getElementById('horario-curso');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un curso...</option>';
        data.forEach(curso => {
          const option = document.createElement('option');
          option.value = curso.id_curso;
          option.textContent = curso.nombre_curso; // Solo el nombre del curso (ej: 702, 902)
          select.appendChild(option);
        });
      }
    })
    .catch(error => console.error("❌ Error al cargar cursos:", error));
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarDocentesParaFiltro
// DESCRIPCIÓN:
//   Carga los docentes en el select de filtro por profesor.
// ---------------------------------------------------------------
function cargarDocentesParaFiltro() {
  fetch("panel_admin.php?accion=listar_docentes")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const select = document.getElementById('filtro-docente-horarios');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un profesor...</option>';
        data.docentes.forEach(docente => {
          const option = document.createElement('option');
          option.value = docente.id_docente;
          option.textContent = docente.nombre;
          select.appendChild(option);
        });
      }
    })
    .catch(error => console.error("❌ Error al cargar docentes:", error));
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarCursosParaFiltro
// DESCRIPCIÓN:
//   Carga los cursos en el select de filtro por curso.
// ---------------------------------------------------------------
function cargarCursosParaFiltro() {
  fetch("panel_admin.php?accion=listar_cursos")
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        const select = document.getElementById('filtro-curso-horarios');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un curso...</option>';
        data.forEach(curso => {
          const option = document.createElement('option');
          option.value = curso.id_curso;
          option.textContent = curso.nombre_curso;
          select.appendChild(option);
        });
      }
    })
    .catch(error => console.error("❌ Error al cargar cursos:", error));
}

// ---------------------------------------------------------------
// FUNCIÓN: guardarHorario
// DESCRIPCIÓN:
//   Guarda un nuevo horario desde el formulario.
//   El salón será el nombre del curso.
// PARÁMETRO:
//   event → Evento del formulario para prevenir el submit por defecto
// ---------------------------------------------------------------
function guardarHorario(event) {
  event.preventDefault();
  
  const docenteId = document.getElementById('horario-docente')?.value;
  const cursoId = document.getElementById('horario-curso')?.value;
  const dia = document.getElementById('horario-dia')?.value;
  const horaInicio = document.getElementById('horario-inicio')?.value;
  const horaFin = document.getElementById('horario-fin')?.value;
  
  if (!docenteId || !cursoId || !dia || !horaInicio || !horaFin) {
    mostrarMensajeHorario('Debe completar todos los campos obligatorios', 'error');
    return;
  }
  
  // Obtener el nombre del curso para usarlo como salón
  const selectCurso = document.getElementById('horario-curso');
  const nombreCurso = selectCurso.options[selectCurso.selectedIndex].text;
  
  const datos = new FormData();
  datos.append("accion", "crear_horario");
  datos.append("docente_id", docenteId);
  datos.append("curso_id", cursoId);
  datos.append("dia_semana", dia);
  datos.append("hora_inicio", horaInicio);
  datos.append("hora_fin", horaFin);
  datos.append("salon", nombreCurso); // El salón es el nombre del curso
  
  const btnGuardar = document.querySelector('#form-horario button[type="submit"]');
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.textContent = "Guardando...";
  btnGuardar.disabled = true;
  
  fetch("panel_admin.php", { method: "POST", body: datos })
    .then(response => response.json())
    .then(data => {
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
      
      if (data.success) {
        mostrarMensajeHorario('Horario guardado correctamente', 'success');
        document.getElementById('form-horario').reset();
        // Recargar los horarios si hay filtros activos
        const filtroDocente = document.getElementById('filtro-docente-horarios')?.value;
        const filtroCurso = document.getElementById('filtro-curso-horarios')?.value;
        if (filtroDocente) {
          cargarHorariosPorProfesor();
        }
        if (filtroCurso) {
          cargarHorariosPorCurso();
        }
      } else {
        mostrarMensajeHorario(data.message || 'Error al guardar el horario', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al guardar horario:", error);
      mostrarMensajeHorario('Error al guardar el horario', 'error');
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarHorariosPorProfesor
// DESCRIPCIÓN:
//   Carga y muestra los horarios de un profesor específico.
// ---------------------------------------------------------------
function cargarHorariosPorProfesor() {
  const docenteId = document.getElementById('filtro-docente-horarios')?.value;
  const tbody = document.getElementById('tbody-horarios-profesor');
  
  if (!docenteId) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Seleccione un profesor para ver su horario.</td></tr>';
    return;
  }
  
  fetch(`panel_admin.php?accion=horarios_docentes&docente_id=${docenteId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        mostrarHorariosPorProfesor(data.horarios);
      } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Error al cargar los horarios.</td></tr>';
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar horarios por profesor:", error);
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Error al cargar los horarios.</td></tr>';
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarHorariosPorProfesor
// DESCRIPCIÓN:
//   Muestra los horarios de un profesor en la tabla.
// PARÁMETRO:
//   horarios → Array de horarios del profesor
// ---------------------------------------------------------------
function mostrarHorariosPorProfesor(horarios) {
  const tbody = document.getElementById('tbody-horarios-profesor');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (horarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Este profesor no tiene horarios asignados.</td></tr>';
    return;
  }
  
  const diasSemana = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  horarios.forEach(horario => {
    const tr = document.createElement('tr');
    const horaInicio = horario.hora_inicio.substring(0, 5); // Formato HH:MM
    const horaFin = horario.hora_fin.substring(0, 5); // Formato HH:MM
    tr.innerHTML = `
      <td>${diasSemana[horario.dia_semana] || '—'}</td>
      <td>${horaInicio}</td>
      <td>${horaFin}</td>
      <td>${horario.salon || horario.nombre_curso || '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarHorariosPorCurso
// DESCRIPCIÓN:
//   Carga y muestra los horarios de un curso específico.
//   Muestra: Materia, Profesor, Día, Hora inicio, Hora fin.
// ---------------------------------------------------------------
function cargarHorariosPorCurso() {
  const cursoId = document.getElementById('filtro-curso-horarios')?.value;
  const tbody = document.getElementById('tbody-horarios-curso');
  
  if (!cursoId) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Seleccione un curso para ver su horario.</td></tr>';
    return;
  }
  
  fetch(`panel_admin.php?accion=horarios_curso&curso_id=${cursoId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        mostrarHorariosPorCurso(data.horarios);
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Error al cargar los horarios.</td></tr>';
      }
    })
    .catch(error => {
      console.error("❌ Error al cargar horarios por curso:", error);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Error al cargar los horarios.</td></tr>';
    });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarHorariosPorCurso
// DESCRIPCIÓN:
//   Muestra los horarios de un curso en la tabla.
//   Muestra: Materia, Profesor, Día, Hora inicio, Hora fin.
// PARÁMETRO:
//   horarios → Array de horarios del curso
// ---------------------------------------------------------------
function mostrarHorariosPorCurso(horarios) {
  const tbody = document.getElementById('tbody-horarios-curso');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (horarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Este curso no tiene horarios asignados.</td></tr>';
    return;
  }
  
  const diasSemana = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  horarios.forEach(horario => {
    const tr = document.createElement('tr');
    const horaInicio = horario.hora_inicio.substring(0, 5); // Formato HH:MM
    const horaFin = horario.hora_fin.substring(0, 5); // Formato HH:MM
    tr.innerHTML = `
      <td>${horario.nombre_materia || '—'}</td>
      <td>${horario.nombre_docente || '—'}</td>
      <td>${diasSemana[horario.dia_semana] || '—'}</td>
      <td>${horaInicio}</td>
      <td>${horaFin}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarMensajeHorario
// DESCRIPCIÓN:
//   Muestra un mensaje en la sección de horarios.
// PARÁMETROS:
//   mensaje → Texto del mensaje
//   tipo → Tipo de mensaje ('success' o 'error')
// ---------------------------------------------------------------
function mostrarMensajeHorario(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-horario');
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

// ================================================================
// SECCIÓN: FUNCIONES DE COMUNICADOS (ADMIN)
// ================================================================

function cargarComunicadosAdmin() {
  fetch("panel_admin.php?accion=listar_comunicados")
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        mostrarComunicadosAdmin(data.comunicados);
      }
    })
    .catch(error => console.error("❌ Error al cargar comunicados:", error));
}

function mostrarComunicadosAdmin(comunicados) {
  const tbody = document.getElementById('tbody-comunicados-admin');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (comunicados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No hay comunicados publicados</td></tr>';
    return;
  }
  comunicados.forEach(comunicado => {
    const tr = document.createElement('tr');
    const fecha = new Date(comunicado.fecha_publicacion).toLocaleDateString('es-ES');
    tr.innerHTML = `<td>${fecha}</td><td>${comunicado.titulo}</td><td>${comunicado.contenido.substring(0, 100)}${comunicado.contenido.length > 100 ? '...' : ''}</td><td>${comunicado.nombre_autor || '—'}</td><td>${comunicado.cargo_autor || '—'}</td>`;
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------
// FUNCIÓN: abrirModalCrearComunicado
// DESCRIPCIÓN:
//   Abre el modal para crear un nuevo comunicado.
//   SOLO se ejecuta cuando el usuario hace clic en el botón
//   "+ Publicar nuevo comunicado" en la sección de Comunicados.
//   NO se ejecuta automáticamente al cargar la página.
// ---------------------------------------------------------------
function abrirModalCrearComunicado() {
  // Verificamos que el modal exista antes de intentar abrirlo
  const modal = document.getElementById('modal-crear-comunicado');
  if (!modal) {
    console.error("No se encontró el modal de crear comunicado");
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

function cerrarModalCrearComunicado() {
  const modal = document.getElementById('modal-crear-comunicado');
  if (!modal) return;
  modal.classList.add('oculto');
  const form = document.getElementById('form-comunicado');
  if (form) form.reset();
}

function guardarComunicado() {
  const titulo = document.getElementById('comunicado-titulo')?.value.trim();
  const contenido = document.getElementById('comunicado-contenido')?.value.trim();
  if (!titulo || !contenido) {
    alert('Debe completar todos los campos');
    return;
  }
  const datos = new FormData();
  datos.append("accion", "crear_comunicado");
  datos.append("titulo", titulo);
  datos.append("contenido", contenido);
  const btnGuardar = document.querySelector('#form-comunicado button[type="button"]');
  if (!btnGuardar) return;
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.textContent = "Publicando...";
  btnGuardar.disabled = true;
  fetch("panel_admin.php", { method: "POST", body: datos })
    .then(response => response.json())
    .then(data => {
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
      if (data.success) {
        mostrarMensajeComunicadosAdmin('Comunicado publicado correctamente', 'success');
        cerrarModalCrearComunicado();
        // Actualizar automáticamente la tabla de comunicados
        cargarComunicadosAdmin();
      } else {
        mostrarMensajeComunicadosAdmin(data.message || 'Error al publicar el comunicado', 'error');
      }
    })
    .catch(error => {
      console.error("❌ Error al publicar comunicado:", error);
      mostrarMensajeComunicadosAdmin('Error al publicar el comunicado', 'error');
      btnGuardar.textContent = textoOriginal;
      btnGuardar.disabled = false;
    });
}

function mostrarMensajeComunicadosAdmin(mensaje, tipo) {
  const mensajeElement = document.getElementById('mensaje-comunicados-admin');
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
  setTimeout(() => { mensajeElement.style.display = 'none'; }, 5000);
}

