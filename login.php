<?php
// ================================================================
// ARCHIVO: login.php
// DESCRIPCIÓN:
//   Valida las credenciales del usuario y lo redirige al panel
//   correspondiente según su rol (Administrador, Docente o Estudiante).
//   Los datos se validan contra la base de datos.
// ================================================================

// Iniciar sesión para almacenar datos del usuario
session_start();

// Incluir archivo de conexión a la base de datos
include("conexion.php");

// Solo procesar si el formulario fue enviado mediante POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Obtener datos del formulario
    $correo = $_POST['correo'];                    // Correo del usuario
    $contrasena = md5($_POST['contrasena']);       // Contraseña encriptada con MD5
    
    // NOTA: MD5 no es seguro para producción, pero es adecuado para proyectos académicos

    // Consultar usuario en la base de datos
    $consulta = "SELECT * FROM usuarios WHERE correo = '$correo' AND password = '$contrasena'";
    $resultado = mysqli_query($conexion, $consulta);

    // Verificar errores en la consulta
    if (!$resultado) {
        die("Error en la consulta SQL: " . mysqli_error($conexion));
    }

    // Si se encontró exactamente un usuario (credenciales correctas)
    if (mysqli_num_rows($resultado) == 1) {
        $usuario = mysqli_fetch_assoc($resultado); // Obtener datos del usuario

        // Guardar información en la sesión
        $_SESSION['id_usuario'] = $usuario['id_usuario'];
        $_SESSION['nombre'] = $usuario['nombre_usuario'];
        $_SESSION['id_rol'] = $usuario['id_rol'];

        // Redirigir según el rol del usuario
        switch ($usuario['id_rol']) {
            case 1: // Administrador
                header("Location: panelAdmin.html");
                break;

            case 2: // Docente
                header("Location: panelDocente.html");
                break;

            case 3: // Estudiante
                header("Location: panelEstudiante.html");
                break;

            default: // Rol no reconocido
                echo "<script>alert('Rol no reconocido'); window.location='index.html';</script>";
        }

        exit(); // Terminar ejecución después de redirigir

    } else {
        // Credenciales incorrectas
        echo "<script>
                alert('Correo o contraseña incorrectos');
                window.location='index.html';
              </script>";
    }
}
?>
