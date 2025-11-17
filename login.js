// ================================================================
// ARCHIVO: login.js
// DESCRIPCIÓN:
//   Controla la funcionalidad del formulario de inicio de sesión.
//   Incluye validaciones de campos, toggle de contraseña y
//   manejo de errores antes de enviar el formulario al servidor.
// ================================================================

// ---------------------------------------------------------------
// FUNCIÓN: togglePasswordLogin
// DESCRIPCIÓN:
//   Muestra u oculta la contraseña en el campo de login.
//   Cambia el tipo del input entre 'password' (oculto) y 'text' (visible).
//   Actualiza el icono del botón según el estado actual.
//   Iconos: ◉ (contraseña oculta - mostrar) y ◎ (contraseña visible - ocultar)
// PARÁMETRO:
//   inputId → ID del campo de contraseña (ej: 'contrasena')
// ---------------------------------------------------------------
function togglePasswordLogin(inputId) {
  const input = document.getElementById(inputId);           // Obtener el campo de contraseña
  const toggleBtn = input.nextElementSibling;              // Botón toggle (siguiente elemento hermano)
  
  // Si la contraseña está oculta, mostrarla
  // Iconos: ◉ (mostrar cuando está oculta) y ◎ (ocultar cuando está visible)
  if (input.type === 'password') {
    input.type = 'text';                                    // Cambiar a texto visible
    toggleBtn.textContent = '◎';                            // Icono para ocultar contraseña (cuando está visible)
    toggleBtn.setAttribute('aria-label', 'Ocultar contraseña');
  } else {
    input.type = 'password';                                // Cambiar a contraseña oculta
    toggleBtn.textContent = '◉';                            // Icono para mostrar contraseña (cuando está oculta)
    toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: validarFormularioLogin
// DESCRIPCIÓN:
//   Valida que los campos del formulario de login estén completos
//   y que el correo tenga un formato válido antes de enviar.
//   Muestra mensajes de error si hay problemas.
// RETORNA:
//   boolean → true si el formulario es válido, false si hay errores
// ---------------------------------------------------------------
function validarFormularioLogin() {
  // Obtener valores de los campos y eliminar espacios en blanco
  const correo = document.getElementById('correo').value.trim();
  const contrasena = document.getElementById('contrasena').value.trim();
  const alerta = document.getElementById('alerta');

  // Limpiar mensajes de error anteriores
  alerta.textContent = '';
  alerta.style.display = 'none';
  alerta.className = 'alert';

  // Validar que el correo no esté vacío
  if (!correo) {
    mostrarError('Por favor ingrese su correo electrónico');
    return false;
  }

  // Validar formato de email con expresión regular
  // Formato: texto@texto.texto (ej: usuario@correo.com)
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(correo)) {
    mostrarError('Por favor ingrese un correo electrónico válido');
    return false;
  }

  // Validar que la contraseña no esté vacía
  if (!contrasena) {
    mostrarError('Por favor ingrese su contraseña');
    return false;
  }

  // Si todas las validaciones pasan, retornar true
  return true;
}

// ---------------------------------------------------------------
// FUNCIÓN: mostrarError
// DESCRIPCIÓN:
//   Muestra un mensaje de error en el contenedor de alertas.
//   Aplica estilos rojos para indicar que es un error.
// PARÁMETRO:
//   mensaje → Texto del mensaje de error a mostrar
// ---------------------------------------------------------------
function mostrarError(mensaje) {
  const alerta = document.getElementById('alerta');
  
  // Configurar el mensaje y estilos del error
  alerta.textContent = mensaje;
  alerta.style.display = 'block';                           // Mostrar el contenedor
  alerta.style.background = 'rgba(220,53,69,.12)';          // Fondo rojo claro
  alerta.style.color = '#dc3545';                           // Texto rojo
  alerta.style.border = '1px solid rgba(220,53,69,.35)';    // Borde rojo
  alerta.style.padding = '12px 14px';                       // Espaciado interno
  alerta.style.borderRadius = '12px';                       // Bordes redondeados
  alerta.style.marginTop = '12px';                          // Margen superior
  alerta.style.fontWeight = '600';                          // Texto en negrita
}

// ---------------------------------------------------------------
// EVENTO: Submit del formulario de login
// DESCRIPCIÓN:
//   Intercepta el envío del formulario cuando el usuario hace clic
//   en "Iniciar sesión". Valida los campos antes de enviar y
//   previene el envío si hay errores.
//   Si la validación es exitosa, el formulario se envía a login.php
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
  const formulario = document.getElementById('loginForm');

  // Verificar que el formulario existe en la página
  if (formulario) {
    // Escuchar el evento de envío del formulario
    formulario.addEventListener('submit', function(event) {
      // Validar el formulario antes de enviar
      if (!validarFormularioLogin()) {
        event.preventDefault(); // Cancelar el envío si hay errores
        return false;
      }

      // Si la validación es exitosa, el formulario se envía normalmente
      // El servidor (login.php) se encargará de validar las credenciales
      // y redirigir al usuario al panel correspondiente
    });
  }
});

