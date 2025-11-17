<?php
// ================================================================
// ARCHIVO: panel_estudiante.php
// DESCRIPCIÓN:
//   Panel del estudiante. Permite consultar notas, horarios,
//   comunicados y gestionar el perfil del estudiante.
// ================================================================

// ------------------------------------------------
// 1. Iniciar la sesión
// ------------------------------------------------
session_start();

// Verificar que el usuario esté autenticado y sea estudiante
if (!isset($_SESSION['id_usuario']) || $_SESSION['id_rol'] != 3) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'No tiene permisos para acceder a esta sección'
    ]);
    exit;
}

// ------------------------------------------------
// 2. Incluir la conexión con la base de datos
// ------------------------------------------------
include("conexion.php");

// ------------------------------------------------
// CONFIGURAR UTF-8 PARA EVITAR PROBLEMAS DE TILDES
// ------------------------------------------------
mysqli_set_charset($conexion, "utf8");

// Obtener el ID del estudiante desde la sesión
$id_usuario = $_SESSION['id_usuario'];

// Obtener el ID del estudiante (id_estudiante) desde la tabla estudiantes
$sql_estudiante = "SELECT id_estudiante FROM estudiantes WHERE id_usuario = $id_usuario";
$resultado_estudiante = mysqli_query($conexion, $sql_estudiante);
if ($resultado_estudiante && mysqli_num_rows($resultado_estudiante) > 0) {
    $fila_estudiante = mysqli_fetch_assoc($resultado_estudiante);
    $id_estudiante = $fila_estudiante['id_estudiante'];
} else {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'No se encontró el perfil del estudiante'
    ]);
    exit;
}

// ------------------------------------------------
// 3. PROCESAR PETICIONES GET
// ------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    
    $accion = $_GET['accion'] ?? '';
    
    // ---------------------------------------------------------------
    // ENDPOINT: OBTENER PERFIL DEL ESTUDIANTE
    // DESCRIPCIÓN:
    //   Devuelve los datos del perfil del estudiante actual.
    // ---------------------------------------------------------------
    if ($accion === "obtener_perfil") {
        header('Content-Type: application/json; charset=utf-8');
        
        $sql = "SELECT COALESCE(e.nombre_completo, u.nombre_usuario) AS nombre, 
                       u.nombre_usuario, u.correo, u.id_rol, e.telefono, 
                       e.tipo_documento, e.numero_documento, e.profile_image, e.nombre_completo
                FROM usuarios u
                INNER JOIN estudiantes e ON u.id_usuario = e.id_usuario
                WHERE u.id_usuario = $id_usuario AND u.id_rol = 3";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado && mysqli_num_rows($resultado) > 0) {
            $fila = mysqli_fetch_assoc($resultado);
            
            $imageUrl = '';
            if (!empty($fila['profile_image'])) {
                $imageUrl = $fila['profile_image'];
            }
            
            // Si nombre_completo está vacío, actualizamos con nombre_usuario
            $nombre_completo = $fila['nombre_completo'] ?? '';
            if (empty($nombre_completo)) {
                $nombre_completo = $fila['nombre_usuario'];
                // Actualizar en la base de datos
                $sql_update_nombre = "UPDATE estudiantes SET nombre_completo = '$nombre_completo' WHERE id_usuario = $id_usuario";
                mysqli_query($conexion, $sql_update_nombre);
            }
            
            echo json_encode([
                'success' => true,
                'nombre' => $fila['nombre'] ?? $fila['nombre_usuario'],
                'correo' => $fila['correo'],
                'telefono' => $fila['telefono'] ?? '',
                'tipo_documento' => $fila['tipo_documento'] ?? '',
                'numero_documento' => $fila['numero_documento'] ?? '',
                'profile_image' => $imageUrl
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No se encontraron datos del perfil'
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: CURSOS DEL ESTUDIANTE
    // DESCRIPCIÓN:
    //   Devuelve la lista de cursos en los que está inscrito el estudiante.
    // ---------------------------------------------------------------
    if ($accion === "cursos_estudiante") {
        header('Content-Type: application/json; charset=utf-8');
        
        $sql = "SELECT c.id_curso, c.nombre_curso, c.descripcion
                FROM cursos c
                INNER JOIN estudiante_curso ec ON c.id_curso = ec.id_curso
                WHERE ec.id_estudiante = $id_estudiante
                ORDER BY c.nombre_curso";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $cursos = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
                $cursos[] = [
                    'id_curso' => $fila['id_curso'],
                    'nombre_curso' => $fila['nombre_curso'],
                    'descripcion' => $fila['descripcion'] ?? ''
                ];
            }
            
            echo json_encode([
                'success' => true,
                'cursos' => $cursos
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener los cursos',
                'cursos' => []
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: MATERIAS DEL ESTUDIANTE
    // DESCRIPCIÓN:
    //   Devuelve la lista de materias de los cursos en los que está inscrito el estudiante.
    //   Usa tanto docente_curso como docente_materia para obtener las materias.
    // ---------------------------------------------------------------
    if ($accion === "materias_estudiante") {
        header('Content-Type: application/json; charset=utf-8');
        
        // Obtener las materias únicas de los cursos en los que está inscrito el estudiante
        // usando tanto docente_curso como docente_materia
        $sql = "SELECT DISTINCT m.id_materia, m.nombre_materia
                FROM materias m
                INNER JOIN (
                    SELECT dc.materia_id AS id_materia
                    FROM docente_curso dc
                    INNER JOIN estudiante_curso ec ON dc.curso_id = ec.id_curso
                    WHERE ec.id_estudiante = $id_estudiante
                    AND dc.materia_id IS NOT NULL
                    
                    UNION
                    
                    SELECT dm.id_materia
                    FROM docente_materia dm
                    INNER JOIN estudiante_curso ec ON dm.id_curso = ec.id_curso
                    WHERE ec.id_estudiante = $id_estudiante
                ) AS materias_estudiante ON m.id_materia = materias_estudiante.id_materia
                ORDER BY m.nombre_materia";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $materias = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
                $materias[] = [
                    'id_materia' => $fila['id_materia'],
                    'nombre_materia' => $fila['nombre_materia']
                ];
            }
            
            echo json_encode([
                'success' => true,
                'materias' => $materias
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener las materias: ' . mysqli_error($conexion),
                'materias' => []
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: LISTAR PERIODOS
    // DESCRIPCIÓN:
    //   Devuelve la lista de periodos académicos disponibles.
    // ---------------------------------------------------------------
    if ($accion === "listar_periodos") {
        header('Content-Type: application/json; charset=utf-8');
        
        $sql = "SELECT id_periodo, nombre, fecha_inicio, fecha_fin
                FROM periodos
                ORDER BY fecha_inicio DESC";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $periodos = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
                $periodos[] = [
                    'id_periodo' => $fila['id_periodo'],
                    'nombre' => $fila['nombre'],
                    'fecha_inicio' => $fila['fecha_inicio'] ?? '',
                    'fecha_fin' => $fila['fecha_fin'] ?? ''
                ];
            }
            
            echo json_encode([
                'success' => true,
                'periodos' => $periodos
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener los periodos',
                'periodos' => []
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: NOTAS DEL ESTUDIANTE
    // DESCRIPCIÓN:
    //   Devuelve las notas del estudiante para una materia específica y período.
    //   También devuelve la información del profesor de esa materia (foto, nombre, correo).
    // ---------------------------------------------------------------
    if ($accion === "notas_estudiante") {
        header('Content-Type: application/json; charset=utf-8');
        
        $materia_id = intval($_GET['materia_id'] ?? 0);
        $periodo_id = intval($_GET['periodo_id'] ?? 0);
        
        if (!$materia_id) {
            echo json_encode([
                'success' => false,
                'message' => 'ID de materia no válido',
                'notas' => [],
                'profesor' => null
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        if (!$periodo_id) {
            echo json_encode([
                'success' => false,
                'message' => 'Debe seleccionar un período académico',
                'notas' => [],
                'profesor' => null
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        // Verificar que el estudiante esté inscrito en algún curso que tenga esta materia
        // usando tanto docente_curso como docente_materia
        $sql_check = "SELECT ec.id_estudiante 
                      FROM estudiante_curso ec
                      LEFT JOIN docente_curso dc ON ec.id_curso = dc.curso_id AND dc.materia_id = $materia_id
                      LEFT JOIN docente_materia dm ON ec.id_curso = dm.id_curso AND dm.id_materia = $materia_id
                      WHERE ec.id_estudiante = $id_estudiante 
                      AND (dc.materia_id = $materia_id OR dm.id_materia = $materia_id)";
        $resultado_check = mysqli_query($conexion, $sql_check);
        
        if (!$resultado_check || mysqli_num_rows($resultado_check) == 0) {
            echo json_encode([
                'success' => false,
                'message' => 'No está inscrito en ningún curso con esta materia',
                'notas' => [],
                'profesor' => null
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        // Obtener notas del estudiante para la materia filtradas por período
        // Las actividades deben pertenecer a cursos que tengan la materia asignada
        // Usa tanto docente_curso como docente_materia
        $sql = "SELECT DISTINCT a.nombre AS nombre_actividad, na.porcentaje, na.nota, na.fecha_registro
                FROM notas_actividades na
                INNER JOIN actividades a ON na.actividad_id = a.id_actividad
                INNER JOIN estudiante_curso ec ON a.curso_id = ec.id_curso
                LEFT JOIN docente_curso dc ON a.curso_id = dc.curso_id AND a.docente_id = dc.docente_id
                LEFT JOIN docente_materia dm ON a.curso_id = dm.id_curso AND a.docente_id = dm.id_docente
                WHERE na.estudiante_id = $id_estudiante 
                AND ec.id_estudiante = $id_estudiante
                AND a.periodo_id = $periodo_id
                AND (dc.materia_id = $materia_id OR dm.id_materia = $materia_id)
                ORDER BY na.fecha_registro ASC";
        
        $resultado = mysqli_query($conexion, $sql);
        
        $notas = [];
        if ($resultado) {
            while ($fila = mysqli_fetch_assoc($resultado)) {
                $notas[] = [
                    'nombre_actividad' => $fila['nombre_actividad'],
                    'porcentaje' => $fila['porcentaje'] ?? 0,
                    'nota' => $fila['nota'],
                    'fecha_registro' => $fila['fecha_registro']
                ];
            }
        }
        
        // Obtener información del profesor de la materia (foto, nombre, correo)
        // Usa tanto docente_curso como docente_materia
        $sql_profesor = "SELECT DISTINCT d.nombre_completo AS nombre, d.profile_image AS foto, u.correo
                         FROM docentes d
                         INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
                         INNER JOIN (
                             SELECT dc.docente_id
                             FROM docente_curso dc
                             INNER JOIN estudiante_curso ec ON dc.curso_id = ec.id_curso
                             WHERE ec.id_estudiante = $id_estudiante
                             AND dc.materia_id = $materia_id
                             
                             UNION
                             
                             SELECT dm.id_docente AS docente_id
                             FROM docente_materia dm
                             INNER JOIN estudiante_curso ec ON dm.id_curso = ec.id_curso
                             WHERE ec.id_estudiante = $id_estudiante
                             AND dm.id_materia = $materia_id
                         ) AS profesores_materia ON d.id_docente = profesores_materia.docente_id
                         LIMIT 1";
        
        $resultado_profesor = mysqli_query($conexion, $sql_profesor);
        $profesor = null;
        
        if ($resultado_profesor && mysqli_num_rows($resultado_profesor) > 0) {
            $fila_profesor = mysqli_fetch_assoc($resultado_profesor);
            $profesor = [
                'nombre' => $fila_profesor['nombre'] ?? '—',
                'foto' => $fila_profesor['foto'] ?? '',
                'correo' => $fila_profesor['correo'] ?? '—'
            ];
        }
        
        echo json_encode([
            'success' => true,
            'notas' => $notas,
            'profesor' => $profesor
        ], JSON_UNESCAPED_UNICODE);
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: HORARIO DEL ESTUDIANTE
    // DESCRIPCIÓN:
    //   Devuelve el horario del estudiante basado en los cursos en los que está inscrito.
    //   El horario se obtiene de la tabla horarios que relaciona docente con curso.
    //   La materia se obtiene de docente_materia que relaciona docente, materia y curso.
    // ---------------------------------------------------------------
    if ($accion === "horario_estudiante") {
        header('Content-Type: application/json; charset=utf-8');
        
        // Obtener horarios del estudiante:
        // 1. El estudiante está en cursos (estudiante_curso)
        // 2. Esos cursos tienen horarios (horarios con curso_id)
        // 3. Esos horarios tienen un docente (horarios.docente_id)
        // 4. Ese docente dicta una materia en ese curso (docente_curso o docente_materia)
        $sql = "SELECT DISTINCT h.dia_semana, h.hora_inicio, h.hora_fin, 
                       COALESCE(m1.nombre_materia, m2.nombre_materia, 'Sin materia asignada') AS nombre_materia, h.salon
                FROM horarios h
                INNER JOIN cursos c ON h.curso_id = c.id_curso
                INNER JOIN estudiante_curso ec ON c.id_curso = ec.id_curso
                LEFT JOIN docente_curso dc ON h.curso_id = dc.curso_id AND h.docente_id = dc.docente_id
                LEFT JOIN materias m1 ON dc.materia_id = m1.id_materia
                LEFT JOIN docente_materia dm ON h.curso_id = dm.id_curso AND h.docente_id = dm.id_docente
                LEFT JOIN materias m2 ON dm.id_materia = m2.id_materia
                WHERE ec.id_estudiante = $id_estudiante
                ORDER BY h.dia_semana, h.hora_inicio";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $horarios = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
                $horarios[] = [
                    'dia_semana' => $fila['dia_semana'],
                    'hora_inicio' => $fila['hora_inicio'],
                    'hora_fin' => $fila['hora_fin'],
                    'salon' => $fila['salon'] ?? '—',
                    'nombre_materia' => $fila['nombre_materia'] ?? '—'
                ];
            }
            
            echo json_encode([
                'success' => true,
                'horarios' => $horarios
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener el horario: ' . mysqli_error($conexion),
                'horarios' => []
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: LISTAR COMUNICADOS
    // DESCRIPCIÓN:
    //   Devuelve la lista de comunicados publicados por administradores
    //   y docentes, ordenados por fecha de publicación.
    // ---------------------------------------------------------------
    if ($accion === "listar_comunicados") {
        header('Content-Type: application/json; charset=utf-8');
        
    // Consulta que obtiene comunicados con nombre completo y cargo del autor
    // NOTA: Para docentes y estudiantes, el cargo se muestra como el rol (Docente/Estudiante)
    // ya que no tienen campo cargo en sus tablas. Solo administradores tienen cargo.
    $sql = "SELECT c.id_comunicado, c.fecha_publicacion, c.titulo, c.contenido, c.autor_tipo,
                   COALESCE(a.nombre_completo, d.nombre_completo, e.nombre_completo, u.nombre_usuario) AS nombre_autor,
                   CASE 
                     WHEN a.cargo IS NOT NULL THEN a.cargo
                     WHEN u.id_rol = 2 THEN 'Docente'
                     WHEN u.id_rol = 3 THEN 'Estudiante'
                     ELSE c.autor_tipo
                   END AS cargo_autor
            FROM comunicados c
            LEFT JOIN usuarios u ON c.autor_id = u.id_usuario
            LEFT JOIN administradores a ON u.id_usuario = a.id_usuario AND u.id_rol = 1
            LEFT JOIN docentes d ON u.id_usuario = d.id_usuario AND u.id_rol = 2
            LEFT JOIN estudiantes e ON u.id_usuario = e.id_usuario AND u.id_rol = 3
            ORDER BY c.fecha_publicacion DESC";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $comunicados = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
            $comunicados[] = [
                'id_comunicado' => $fila['id_comunicado'],
                'fecha_publicacion' => $fila['fecha_publicacion'],
                'titulo' => $fila['titulo'],
                'contenido' => $fila['contenido'],
                'autor_tipo' => $fila['autor_tipo'],
                'nombre_autor' => $fila['nombre_autor'] ?? '—',
                'cargo_autor' => $fila['cargo_autor'] ?? '—'
            ];
            }
            
            echo json_encode([
                'success' => true,
                'comunicados' => $comunicados
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener los comunicados',
                'comunicados' => []
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
}

// ------------------------------------------------
// 4. PROCESAR PETICIONES POST
// ------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $accion = $_POST['accion'] ?? '';
    header('Content-Type: application/json; charset=utf-8');
    
    // ---------------------------------------------------------------
    // ENDPOINT: ACTUALIZAR PERFIL DEL ESTUDIANTE
    // DESCRIPCIÓN:
    //   Actualiza la información personal del estudiante.
    // ---------------------------------------------------------------
    if ($accion === "actualizar_perfil") {
        $nombre = mysqli_real_escape_string($conexion, $_POST['nombre'] ?? '');
        $correo = mysqli_real_escape_string($conexion, $_POST['correo'] ?? '');
        $telefono = mysqli_real_escape_string($conexion, $_POST['telefono'] ?? '');
        $tipo_documento = mysqli_real_escape_string($conexion, $_POST['tipo_documento'] ?? '');
        $numero_documento = mysqli_real_escape_string($conexion, $_POST['numero_documento'] ?? '');
        
        if (empty($nombre) || empty($correo)) {
            echo json_encode([
                'success' => false,
                'message' => 'El nombre y el correo son obligatorios'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            echo json_encode([
                'success' => false,
                'message' => 'El formato del correo no es válido'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        if (!empty($numero_documento) && !preg_match('/^[0-9]+$/', $numero_documento)) {
            echo json_encode([
                'success' => false,
                'message' => 'El número de documento solo debe contener números'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        // Verificar si el correo ya existe en otro usuario
        $sql_check = "SELECT id_usuario FROM usuarios WHERE correo = '$correo' AND id_usuario != $id_usuario";
        $resultado_check = mysqli_query($conexion, $sql_check);
        if ($resultado_check && mysqli_num_rows($resultado_check) > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'El correo ya está registrado por otro usuario'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR PERFIL ESTUDIANTE
        // MÉTODO: SQL UPDATE mediante mysqli_query()
        // DESCRIPCIÓN: Actualiza los datos del estudiante en las tablas 'usuarios' y 'estudiantes'
        // --------------------------------------------------------
        // Actualizar tabla usuarios
        $sql_usuario = "UPDATE usuarios SET nombre_usuario = '$nombre', correo = '$correo' WHERE id_usuario = $id_usuario";
        $resultado_usuario = mysqli_query($conexion, $sql_usuario);
        
        // Actualizar tabla estudiantes (incluyendo nombre_completo, sin dirección)
        $sql_estudiante = "UPDATE estudiantes SET nombre_completo = '$nombre', telefono = '$telefono', 
                          tipo_documento = '$tipo_documento', numero_documento = '$numero_documento' 
                          WHERE id_usuario = $id_usuario";
        $resultado_estudiante = mysqli_query($conexion, $sql_estudiante);
        
        if ($resultado_usuario && $resultado_estudiante) {
            echo json_encode([
                'success' => true,
                'message' => 'Perfil actualizado correctamente'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar el perfil: ' . mysqli_error($conexion)
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: ACTUALIZAR CONTRASEÑA DEL ESTUDIANTE
    // DESCRIPCIÓN:
    //   Actualiza la contraseña del estudiante validando la contraseña actual.
    // ---------------------------------------------------------------
    if ($accion === "actualizar_password") {
        $password_actual = $_POST['password_actual'] ?? '';
        $password_nueva = $_POST['password_nueva'] ?? '';
        
        if (empty($password_actual) || empty($password_nueva)) {
            echo json_encode([
                'success' => false,
                'message' => 'Debe ingresar la contraseña actual y la nueva contraseña'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        if (strlen($password_nueva) < 6) {
            echo json_encode([
                'success' => false,
                'message' => 'La nueva contraseña debe tener al menos 6 caracteres'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        // Verificar contraseña actual
        $password_actual_md5 = md5($password_actual);
        $sql_check = "SELECT id_usuario FROM usuarios WHERE id_usuario = $id_usuario AND password = '$password_actual_md5'";
        $resultado_check = mysqli_query($conexion, $sql_check);
        
        if (!$resultado_check || mysqli_num_rows($resultado_check) == 0) {
            echo json_encode([
                'success' => false,
                'message' => 'La contraseña actual es incorrecta'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        // Actualizar contraseña
        $password_nueva_md5 = md5($password_nueva);
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR CONTRASEÑA
        // MÉTODO: SQL UPDATE mediante mysqli_query()
        // DESCRIPCIÓN: Actualiza la contraseña del estudiante en la tabla 'usuarios'
        // --------------------------------------------------------
        $sql_update = "UPDATE usuarios SET password = '$password_nueva_md5' WHERE id_usuario = $id_usuario";
        $resultado_update = mysqli_query($conexion, $sql_update);
        
        if ($resultado_update) {
            echo json_encode([
                'success' => true,
                'message' => 'Contraseña actualizada correctamente'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar la contraseña: ' . mysqli_error($conexion)
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: SUBIR FOTO DE PERFIL DEL ESTUDIANTE
    // DESCRIPCIÓN:
    //   Sube una imagen de perfil del estudiante y actualiza la ruta en la BD.
    // ---------------------------------------------------------------
    if ($accion === "subir_foto_perfil") {
        if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al subir el archivo'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $archivo = $_FILES['foto'];
        $tipo_permitido = ['image/jpeg', 'image/jpg', 'image/png'];
        $tamanio_maximo = 2 * 1024 * 1024; // 2MB
        
        if (!in_array($archivo['type'], $tipo_permitido)) {
            echo json_encode([
                'success' => false,
                'message' => 'Solo se permiten archivos JPG, JPEG o PNG'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        if ($archivo['size'] > $tamanio_maximo) {
            echo json_encode([
                'success' => false,
                'message' => 'La imagen no debe superar los 2MB'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        // Crear directorio si no existe
        $directorio = 'fotos_de_perfil';
        if (!is_dir($directorio)) {
            mkdir($directorio, 0777, true);
        }
        
        // Generar nombre único para el archivo
        $extension = pathinfo($archivo['name'], PATHINFO_EXTENSION);
        $nombre_archivo = time() . '_' . $id_usuario . '_' . rand(1000, 9999) . '.' . $extension;
        $ruta_archivo = $directorio . '/' . $nombre_archivo;
        
        // Mover el archivo
        if (move_uploaded_file($archivo['tmp_name'], $ruta_archivo)) {
            // --------------------------------------------------------
            // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR FOTO DE PERFIL
            // MÉTODO: SQL UPDATE mediante mysqli_query()
            // DESCRIPCIÓN: Actualiza la ruta de la foto de perfil en la tabla 'estudiantes'
            // NOTA: Guardamos la ruta relativa sin '/' al inicio para mantener consistencia
            // --------------------------------------------------------
            $ruta_bd = $ruta_archivo;
            $sql_update = "UPDATE estudiantes SET profile_image = '$ruta_bd' WHERE id_usuario = $id_usuario";
            $resultado_update = mysqli_query($conexion, $sql_update);
            
            if ($resultado_update) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Foto de perfil actualizada correctamente',
                    'imageUrl' => $ruta_bd
                ]);
            } else {
                // Si falla la actualización en BD, eliminar el archivo
                unlink($ruta_archivo);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al actualizar la base de datos: ' . mysqli_error($conexion)
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al mover el archivo'
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: GENERAR REPORTE PDF
    // DESCRIPCIÓN:
    //   Genera un reporte PDF con todas las materias del estudiante
    //   y sus notas definitivas para el periodo académico seleccionado.
    //   El PDF incluye el nombre de la institución, el nombre del
    //   estudiante y una tabla con materias y notas definitivas.
    //   Las materias se obtienen desde estudiante_curso y docente_curso.
    //   Las notas se calculan usando la misma lógica que el docente:
    //   SUM(na.nota * na.porcentaje) / NULLIF(SUM(na.porcentaje), 0)
    //   El reporte se guarda en la tabla reportes.
    // ---------------------------------------------------------------
    if ($accion === "generar_reporte_pdf") {
        // Establecer header HTML antes de cualquier salida
        header('Content-Type: text/html; charset=utf-8');
        
        // Obtener el periodo_id desde GET
        $periodo_id = intval($_GET['periodo_id'] ?? 0);
        
        if (!$periodo_id) {
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body><h1>Error</h1><p>Debe seleccionar un período académico</p></body></html>';
            mysqli_close($conexion);
            exit;
        }
        
        // Obtener información del periodo
        $sql_periodo = "SELECT nombre, fecha_inicio, fecha_fin FROM periodos WHERE id_periodo = $periodo_id";
        $resultado_periodo = mysqli_query($conexion, $sql_periodo);
        
        if (!$resultado_periodo || mysqli_num_rows($resultado_periodo) == 0) {
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body><h1>Error</h1><p>El período académico seleccionado no existe</p></body></html>';
            mysqli_close($conexion);
            exit;
        }
        
        $periodo = mysqli_fetch_assoc($resultado_periodo);
        $nombre_periodo = $periodo['nombre'] ?? 'Periodo';
        
        // Obtener información del estudiante
        $sql_estudiante = "SELECT e.nombre_completo, u.nombre_usuario
                          FROM estudiantes e
                          INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                          WHERE e.id_usuario = $id_usuario";
        $resultado_estudiante = mysqli_query($conexion, $sql_estudiante);
        
        if (!$resultado_estudiante || mysqli_num_rows($resultado_estudiante) == 0) {
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body><h1>Error</h1><p>No se pudo obtener la información del estudiante</p></body></html>';
            mysqli_close($conexion);
            exit;
        }
        
        $estudiante = mysqli_fetch_assoc($resultado_estudiante);
        $nombre_estudiante = $estudiante['nombre_completo'] ?? $estudiante['nombre_usuario'] ?? 'Estudiante';
        
        // Obtener las materias del estudiante desde estudiante_curso y docente_curso
        // Esta es la misma lógica que se usa en materias_estudiante
        $sql_materias = "SELECT DISTINCT m.id_materia, m.nombre_materia
                        FROM materias m
                        INNER JOIN (
                            SELECT dc.materia_id AS id_materia
                            FROM docente_curso dc
                            INNER JOIN estudiante_curso ec ON dc.curso_id = ec.id_curso
                            WHERE ec.id_estudiante = $id_estudiante
                            AND dc.materia_id IS NOT NULL
                            
                            UNION
                            
                            SELECT dm.id_materia
                            FROM docente_materia dm
                            INNER JOIN estudiante_curso ec ON dm.id_curso = ec.id_curso
                            WHERE ec.id_estudiante = $id_estudiante
                        ) AS materias_estudiante ON m.id_materia = materias_estudiante.id_materia
                        ORDER BY m.nombre_materia";
        
        $resultado_materias = mysqli_query($conexion, $sql_materias);
        $materias_notas = [];
        
        if ($resultado_materias) {
            while ($fila_materia = mysqli_fetch_assoc($resultado_materias)) {
                $materia_id = intval($fila_materia['id_materia']);
                $nombre_materia = $fila_materia['nombre_materia'];
                
                // Calcular nota definitiva para esta materia en el periodo seleccionado
                // Usar la misma lógica que el docente: promedio ponderado
                // SUM(na.nota * na.porcentaje) / NULLIF(SUM(na.porcentaje), 0)
                // Las actividades deben pertenecer a cursos donde el estudiante está inscrito
                // y donde la materia está asignada (docente_curso o docente_materia)
                $sql_nota_definitiva = "SELECT 
                                        SUM(na.nota * na.porcentaje) / NULLIF(SUM(na.porcentaje), 0) AS nota_definitiva
                                       FROM notas_actividades na
                                       INNER JOIN actividades a ON na.actividad_id = a.id_actividad
                                       INNER JOIN estudiante_curso ec ON a.curso_id = ec.id_curso
                                       LEFT JOIN docente_curso dc ON a.curso_id = dc.curso_id AND a.docente_id = dc.docente_id
                                       LEFT JOIN docente_materia dm ON a.curso_id = dm.id_curso AND a.docente_id = dm.id_docente
                                       WHERE na.estudiante_id = $id_estudiante
                                       AND ec.id_estudiante = $id_estudiante
                                       AND a.periodo_id = $periodo_id
                                       AND (dc.materia_id = $materia_id OR dm.id_materia = $materia_id)";
                
                $resultado_nota = mysqli_query($conexion, $sql_nota_definitiva);
                $nota_definitiva = 0;
                
                if ($resultado_nota && mysqli_num_rows($resultado_nota) > 0) {
                    $fila_nota = mysqli_fetch_assoc($resultado_nota);
                    $nota_definitiva = $fila_nota['nota_definitiva'] ?? 0;
                }
                
                // Solo agregar la materia si tiene nota o si queremos mostrarla igual
                $materias_notas[] = [
                    'nombre_materia' => $nombre_materia,
                    'nota_definitiva' => round($nota_definitiva, 2)
                ];
            }
        }
        
        // Nombre de la institución (puede configurarse)
        $nombre_institucion = "INSTITUCIÓN EDUCATIVA CLASSSCORE";
        
        // Guardar el reporte en la tabla reportes
        $titulo_reporte = "Reporte de Notas - " . mysqli_real_escape_string($conexion, $nombre_estudiante) . " - " . mysqli_real_escape_string($conexion, $nombre_periodo);
        $descripcion_reporte = "Reporte de notas definitivas del estudiante " . mysqli_real_escape_string($conexion, $nombre_estudiante) . " para el período " . mysqli_real_escape_string($conexion, $nombre_periodo);
        
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: CREAR REPORTE
        // MÉTODO: SQL INSERT mediante mysqli_query()
        // DESCRIPCIÓN: Inserta un nuevo reporte en la tabla 'reportes'
        // --------------------------------------------------------
        $sql_insert_reporte = "INSERT INTO reportes (titulo, descripcion, fecha_reporte, id_usuario) 
                               VALUES ('$titulo_reporte', '$descripcion_reporte', CURDATE(), $id_usuario)";
        mysqli_query($conexion, $sql_insert_reporte);
        
        // Generar HTML para el PDF
        $hay_materias = count($materias_notas) > 0;
        
        echo '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Notas - ' . htmlspecialchars($nombre_estudiante) . '</title>
    <style>
        @media print {
            @page {
                margin: 2cm;
                size: letter;
            }
            body {
                margin: 0;
                padding: 0;
            }
        }
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #042A2B;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #042A2B;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header h2 {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 18px;
            font-weight: normal;
        }
        .info-estudiante {
            margin-bottom: 30px;
        }
        .info-estudiante p {
            margin: 5px 0;
            font-size: 14px;
        }
        .info-estudiante strong {
            color: #042A2B;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 30px;
            font-size: 14px;
        }
        th {
            background-color: #042A2B;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #021A1B;
        }
        th:last-child {
            text-align: center;
        }
        td {
            padding: 10px 12px;
            border: 1px solid #ddd;
        }
        td:last-child {
            text-align: center;
            font-weight: 600;
            color: #042A2B;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .nota-definitiva {
            font-weight: 600;
            color: #042A2B;
        }
        .nota-vacia {
            color: #999;
            text-align: center;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .fecha-generacion {
            text-align: right;
            margin-bottom: 20px;
            font-size: 12px;
            color: #666;
        }
        .btn-imprimir {
            background-color: #042A2B;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin: 20px auto;
            display: block;
            transition: background-color 0.3s ease;
        }
        .btn-imprimir:hover {
            background-color: #021A1B;
        }
        .instrucciones {
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
        @media print {
            .btn-imprimir, .instrucciones {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="instrucciones">
        <strong>Instrucciones:</strong> Para guardar como PDF, presione <strong>Ctrl+P</strong> (Windows/Linux) o <strong>Cmd+P</strong> (Mac) y seleccione "Guardar como PDF" como destino de impresión.
        <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    </div>
    
    <div class="fecha-generacion">Fecha de generación: ' . date('d/m/Y H:i:s') . '</div>
    
    <div class="header">
        <h1>' . htmlspecialchars($nombre_institucion) . '</h1>
        <h2>Reporte de Notas Académicas</h2>
    </div>
    
    <div class="info-estudiante">
        <p><strong>Estudiante:</strong> ' . htmlspecialchars($nombre_estudiante) . '</p>
        <p><strong>Período Académico:</strong> ' . htmlspecialchars($nombre_periodo) . '</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Materia</th>
                <th>Nota Definitiva</th>
            </tr>
        </thead>
        <tbody>';
        
        if ($hay_materias) {
            foreach ($materias_notas as $materia) {
                $nota = $materia['nota_definitiva'];
                echo '<tr>
                    <td>' . htmlspecialchars($materia['nombre_materia']) . '</td>';
                
                if ($nota > 0) {
                    echo '<td class="nota-definitiva">' . number_format($nota, 2) . '</td>';
                } else {
                    echo '<td class="nota-vacia">—</td>';
                }
                
                echo '</tr>';
            }
        } else {
            echo '<tr>
                <td colspan="2" style="text-align: center; color: #999; padding: 30px;">
                    No hay materias registradas para este estudiante en el período seleccionado. 
                    Verifique que el estudiante esté inscrito en un curso y que el curso tenga materias asignadas.
                </td>
            </tr>';
        }
        
        echo '</tbody>
    </table>
    
    <div class="footer">
        <p>Este documento fue generado automáticamente por el sistema ClassScore</p>
        <p>Para consultas, contacte a la institución educativa</p>
    </div>
</body>
</html>';
        
        mysqli_close($conexion);
        exit;
    }
}

mysqli_close($conexion);
?>
