<?php
// ================================================================
// ARCHIVO: conexion.php
// DESCRIPCIÓN:
//   Establece la conexión con la base de datos MySQL en InfinityFree.
//   Este archivo debe ser incluido en todos los archivos PHP
//   que necesiten acceder a la base de datos.
// ================================================================

// Configuración de la base de datos (datos de InfinityFree)
$servidor = "sql103.infinityfree.com";  // Host de la base de datos
$usuario = "if0_40385120";              // Usuario MySQL
$clave = "Tl4Ho3kW0H5r";                // Contraseña MySQL
$base_datos = "if0_40385120_classscore"; // Nombre de la base de datos
$puerto = 3306;                         // Puerto predeterminado de MySQL

// Crear conexión a la base de datos
$conexion = mysqli_connect($servidor, $usuario, $clave, $base_datos, $puerto);

// Verificar si la conexión fue exitosa
if (!$conexion) {
    die("❌ Error de conexión: " . mysqli_connect_error());
} else {
    // echo "✅ Conexión exitosa a la base de datos";
}
?>
