<?php
// ================================================================
// ARCHIVO: panel_docente.php
// DESCRIPCIÓN:
//   Panel del docente. Permite gestionar notas, consultar cursos,
//   estudiantes, horarios y gestionar el perfil del docente.
// ================================================================

// ------------------------------------------------
// 1. Iniciar la sesión
// ------------------------------------------------
session_start();

// Verificar que el usuario esté autenticado y sea docente
if (!isset($_SESSION['id_usuario']) || $_SESSION['id_rol'] != 2) {
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

// Obtener el ID del docente desde la sesión
$id_usuario = $_SESSION['id_usuario'];

// Obtener el ID del docente (id_docente) desde la tabla docentes
$sql_docente = "SELECT id_docente FROM docentes WHERE id_usuario = $id_usuario";
$resultado_docente = mysqli_query($conexion, $sql_docente);
if ($resultado_docente && mysqli_num_rows($resultado_docente) > 0) {
    $fila_docente = mysqli_fetch_assoc($resultado_docente);
    $id_docente = $fila_docente['id_docente'];
} else {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'No se encontró el perfil del docente'
    ]);
    exit;
}

// ------------------------------------------------
// 3. PROCESAR PETICIONES GET
// ------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    
    $accion = $_GET['accion'] ?? '';
    
    // ---------------------------------------------------------------
    // ENDPOINT: OBTENER PERFIL DEL DOCENTE
    // DESCRIPCIÓN:
    //   Devuelve los datos del perfil del docente actual.
    // ---------------------------------------------------------------
    if ($accion === "obtener_perfil") {
        header('Content-Type: application/json; charset=utf-8');
        
        $sql = "SELECT COALESCE(d.nombre_completo, u.nombre_usuario) AS nombre, 
                       u.nombre_usuario, u.correo, u.id_rol, d.telefono, d.tipo_documento, 
                       d.numero_documento, d.profile_image, d.nombre_completo
                FROM usuarios u
                INNER JOIN docentes d ON u.id_usuario = d.id_usuario
                WHERE u.id_usuario = $id_usuario AND u.id_rol = 2";
        
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
                $sql_update_nombre = "UPDATE docentes SET nombre_completo = '$nombre_completo' WHERE id_usuario = $id_usuario";
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
    // ENDPOINT: CURSOS DEL DOCENTE
    // DESCRIPCIÓN:
    //   Devuelve la lista de cursos asignados al docente con información
    //   de número de estudiantes y promedio.
    // ---------------------------------------------------------------
    if ($accion === "cursos_docente") {
        header('Content-Type: application/json; charset=utf-8');
        
        $periodo_id = intval($_GET['periodo_id'] ?? 0);
        
        // Obtener cursos del docente
        $sql_cursos = "SELECT DISTINCT c.id_curso, c.nombre_curso, c.descripcion, m.nombre_materia AS materia,
                       (SELECT COUNT(*) FROM estudiante_curso ec WHERE ec.id_curso = c.id_curso) AS numero_estudiantes
                FROM cursos c
                INNER JOIN docente_curso dc ON c.id_curso = dc.curso_id
                LEFT JOIN materias m ON dc.materia_id = m.id_materia
                WHERE dc.docente_id = $id_docente
                ORDER BY c.nombre_curso";
        
        $resultado_cursos = mysqli_query($conexion, $sql_cursos);
        
        if ($resultado_cursos) {
            $cursos = [];
            while ($fila = mysqli_fetch_assoc($resultado_cursos)) {
                $curso_id = $fila['id_curso'];
                
                // Calcular promedio de notas finales (promedio ponderado) de todos los estudiantes del curso
                // Filtrar por período si se especifica
                $sql_promedio = "SELECT e.id_estudiante,
                                 SUM(na.nota * na.porcentaje) / NULLIF(SUM(na.porcentaje), 0) AS nota_final
                          FROM estudiantes e
                          INNER JOIN estudiante_curso ec ON e.id_estudiante = ec.id_estudiante
                          INNER JOIN notas_actividades na ON e.id_estudiante = na.estudiante_id
                          INNER JOIN actividades a ON na.actividad_id = a.id_actividad
                          WHERE ec.id_curso = $curso_id AND a.curso_id = $curso_id";
                
                // Filtrar por período (obligatorio)
                if ($periodo_id > 0) {
                    $sql_promedio .= " AND a.periodo_id = $periodo_id";
                } else {
                    // Si no hay período, no calcular promedio
                    $promedio_curso = 0;
                    $cursos[] = [
                        'id_curso' => $curso_id,
                        'nombre_curso' => $fila['nombre_curso'],
                        'descripcion' => $fila['descripcion'] ?? '',
                        'materia' => $fila['materia'] ?? '',
                        'numero_estudiantes' => $fila['numero_estudiantes'] ?? 0,
                        'promedio' => '0.00'
                    ];
                    continue;
                }
                
                $sql_promedio .= " GROUP BY e.id_estudiante
                          HAVING nota_final IS NOT NULL";
                
                $resultado_promedio = mysqli_query($conexion, $sql_promedio);
                $notas_finales = [];
                
                if ($resultado_promedio) {
                    while ($nota_final = mysqli_fetch_assoc($resultado_promedio)) {
                        if ($nota_final['nota_final'] !== null) {
                            $notas_finales[] = floatval($nota_final['nota_final']);
                        }
                    }
                }
                
                // Calcular promedio de todas las notas finales
                $promedio_curso = 0;
                if (count($notas_finales) > 0) {
                    $promedio_curso = array_sum($notas_finales) / count($notas_finales);
                }
                
                $cursos[] = [
                    'id_curso' => $curso_id,
                    'nombre_curso' => $fila['nombre_curso'],
                    'descripcion' => $fila['descripcion'] ?? '',
                    'materia' => $fila['materia'] ?? '',
                    'numero_estudiantes' => $fila['numero_estudiantes'] ?? 0,
                    'promedio' => number_format($promedio_curso, 2)
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
    // ENDPOINT: ESTUDIANTES DEL DOCENTE
    // DESCRIPCIÓN:
    //   Devuelve la lista de estudiantes de los cursos del docente,
    //   con promedio y estado calculado. Opcionalmente filtra por curso.
    //   NOTA: El endpoint también puede ser llamado como "estudiantes_curso"
    //   para mantener compatibilidad con el código existente.
    // ---------------------------------------------------------------
    if ($accion === "estudiantes_docente" || $accion === "estudiantes_curso") {
        header('Content-Type: application/json; charset=utf-8');
        
        $curso_id = intval($_GET['curso_id'] ?? 0);
        
        // Construir la consulta base - calcular promedio por estudiante y curso
        $sql = "SELECT DISTINCT e.id_estudiante, u.nombre_usuario AS nombre, 
                       e.numero_documento, c.nombre_curso, c.id_curso,
                       COALESCE((
                           SELECT AVG(na2.nota) 
                           FROM notas_actividades na2
                           INNER JOIN actividades a2 ON na2.actividad_id = a2.id_actividad
                           WHERE na2.estudiante_id = e.id_estudiante 
                           AND a2.curso_id = c.id_curso
                       ), 0) AS promedio
                FROM estudiantes e
                INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                INNER JOIN estudiante_curso ec ON e.id_estudiante = ec.id_estudiante
                INNER JOIN cursos c ON ec.id_curso = c.id_curso
                INNER JOIN docente_curso dc ON c.id_curso = dc.curso_id
                WHERE dc.docente_id = $id_docente";
        
        if ($curso_id > 0) {
            $sql .= " AND c.id_curso = $curso_id";
        }
        
        $sql .= " ORDER BY c.nombre_curso, u.nombre_usuario";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $estudiantes = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
                $promedio = floatval($fila['promedio']);
                $estudiantes[] = [
                    'id_estudiante' => (int)$fila['id_estudiante'],
                    'nombre' => $fila['nombre'],
                    'numero_documento' => $fila['numero_documento'] ?? '—',
                    'nombre_curso' => $fila['nombre_curso'],
                    'promedio' => $promedio
                ];
            }
            
            echo json_encode([
                'success' => true,
                'estudiantes' => $estudiantes
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener los estudiantes: ' . mysqli_error($conexion),
                'estudiantes' => []
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
    // ENDPOINT: ACTIVIDADES DE UN CURSO
    // DESCRIPCIÓN:
    //   Devuelve la lista de actividades de un curso, opcionalmente
    //   filtradas por periodo.
    // ---------------------------------------------------------------
    if ($accion === "actividades_curso") {
        header('Content-Type: application/json; charset=utf-8');
        
        $curso_id = intval($_GET['curso_id'] ?? 0);
        $periodo_id = intval($_GET['periodo_id'] ?? 0);
        
        if (!$curso_id) {
            echo json_encode([
                'success' => false,
                'message' => 'ID de curso no válido',
                'actividades' => []
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $sql = "SELECT id_actividad, nombre, descripcion, porcentaje, periodo_id, fecha_creacion
                FROM actividades
                WHERE curso_id = $curso_id AND docente_id = $id_docente";
        
        // Filtrar estrictamente por período: solo actividades del período seleccionado
        if ($periodo_id > 0) {
            $sql .= " AND periodo_id = $periodo_id";
        } else {
            // Si no se selecciona período, mostrar solo actividades sin período asignado
            $sql .= " AND periodo_id IS NULL";
        }
        
        $sql .= " ORDER BY fecha_creacion";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $actividades = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
                // Formatear fecha de creación
                $fecha_creacion = '';
                if (!empty($fila['fecha_creacion'])) {
                    $fecha_obj = new DateTime($fila['fecha_creacion']);
                    $fecha_creacion = $fecha_obj->format('d/m/Y');
                }
                
                $actividades[] = [
                    'id_actividad' => $fila['id_actividad'],
                    'nombre' => $fila['nombre'],
                    'descripcion' => $fila['descripcion'] ?? '',
                    'porcentaje' => $fila['porcentaje'],
                    'periodo_id' => $fila['periodo_id'],
                    'fecha_creacion' => $fecha_creacion
                ];
            }
            
            echo json_encode([
                'success' => true,
                'actividades' => $actividades
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener las actividades',
                'actividades' => []
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: PORCENTAJE TOTAL DE ACTIVIDADES
    // DESCRIPCIÓN:
    //   Devuelve la suma de porcentajes de todas las actividades
    //   de un curso y periodo para validar que no exceda 100%.
    // ---------------------------------------------------------------
    if ($accion === "porcentaje_total") {
        header('Content-Type: application/json; charset=utf-8');
        
        $curso_id = intval($_GET['curso_id'] ?? 0);
        $periodo_id = intval($_GET['periodo_id'] ?? 0);
        
        if (!$curso_id) {
            echo json_encode([
                'success' => false,
                'message' => 'ID de curso no válido',
                'porcentaje_total' => 0
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $sql = "SELECT COALESCE(SUM(porcentaje), 0) AS porcentaje_total
                FROM actividades
                WHERE curso_id = $curso_id AND docente_id = $id_docente";
        
        // Filtrar estrictamente por período
        if ($periodo_id > 0) {
            $sql .= " AND periodo_id = $periodo_id";
        } else {
            // Si no se selecciona período, calcular solo actividades sin período asignado
            $sql .= " AND periodo_id IS NULL";
        }
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $fila = mysqli_fetch_assoc($resultado);
            $porcentaje_total = floatval($fila['porcentaje_total'] ?? 0);
            
            echo json_encode([
                'success' => true,
                'porcentaje_total' => $porcentaje_total
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener el porcentaje total',
                'porcentaje_total' => 0
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: NOTAS DE ESTUDIANTES
    // DESCRIPCIÓN:
    //   Devuelve las notas de los estudiantes para las actividades
    //   especificadas.
    // ---------------------------------------------------------------
    if ($accion === "notas_estudiantes") {
        header('Content-Type: application/json; charset=utf-8');
        
        $actividad_ids = $_GET['actividad_ids'] ?? '';
        
        if (empty($actividad_ids)) {
            echo json_encode([
                'success' => true,
                'notas' => []
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $actividad_ids = array_map('intval', explode(',', $actividad_ids));
        $actividad_ids = array_filter($actividad_ids);
        
        if (empty($actividad_ids)) {
            echo json_encode([
                'success' => true,
                'notas' => []
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $ids_str = implode(',', $actividad_ids);
        
        $sql = "SELECT estudiante_id, actividad_id, nota, porcentaje, fecha_registro
                FROM notas_actividades
                WHERE actividad_id IN ($ids_str)";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $notas = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
                $notas[] = [
                    'estudiante_id' => $fila['estudiante_id'],
                    'actividad_id' => $fila['actividad_id'],
                    'nota' => $fila['nota'],
                    'porcentaje' => $fila['porcentaje'] ?? 0,
                    'fecha_registro' => $fila['fecha_registro']
                ];
            }
            
            echo json_encode([
                'success' => true,
                'notas' => $notas
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener las notas',
                'notas' => []
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: HORARIO DEL DOCENTE
    // DESCRIPCIÓN:
    //   Devuelve el horario del docente con días, horas, cursos y salones.
    // ---------------------------------------------------------------
    if ($accion === "horario_docente") {
        header('Content-Type: application/json; charset=utf-8');
        
        $sql = "SELECT h.id_horario, h.dia_semana, h.hora_inicio, h.hora_fin, 
                       h.salon, c.nombre_curso
                FROM horarios h
                INNER JOIN cursos c ON h.curso_id = c.id_curso
                WHERE h.docente_id = $id_docente
                ORDER BY h.dia_semana, h.hora_inicio";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            $horarios = [];
            while ($fila = mysqli_fetch_assoc($resultado)) {
                $horarios[] = [
                    'id_horario' => $fila['id_horario'],
                    'dia_semana' => $fila['dia_semana'],
                    'hora_inicio' => $fila['hora_inicio'],
                    'hora_fin' => $fila['hora_fin'],
                    'salon' => $fila['salon'] ?? '—',
                    'nombre_curso' => $fila['nombre_curso']
                ];
            }
            
            echo json_encode([
                'success' => true,
                'horarios' => $horarios
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener el horario',
                'horarios' => []
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
    // ENDPOINT: ACTUALIZAR PERFIL DEL DOCENTE
    // DESCRIPCIÓN:
    //   Actualiza la información personal del docente.
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
        // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR PERFIL DOCENTE
        // MÉTODO: SQL UPDATE mediante mysqli_query()
        // DESCRIPCIÓN: Actualiza los datos del docente en las tablas 'usuarios' y 'docentes'
        // --------------------------------------------------------
        // Actualizar tabla usuarios
        $sql_usuario = "UPDATE usuarios SET nombre_usuario = '$nombre', correo = '$correo' WHERE id_usuario = $id_usuario";
        $resultado_usuario = mysqli_query($conexion, $sql_usuario);
        
        // Actualizar tabla docentes (incluyendo nombre_completo)
        $sql_docente = "UPDATE docentes SET nombre_completo = '$nombre', telefono = '$telefono', tipo_documento = '$tipo_documento', numero_documento = '$numero_documento' WHERE id_usuario = $id_usuario";
        $resultado_docente = mysqli_query($conexion, $sql_docente);
        
        if ($resultado_usuario && $resultado_docente) {
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
    // ENDPOINT: ACTUALIZAR CONTRASEÑA DEL DOCENTE
    // DESCRIPCIÓN:
    //   Actualiza la contraseña del docente validando la contraseña actual.
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
        
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR CONTRASEÑA
        // MÉTODO: SQL UPDATE mediante mysqli_query()
        // DESCRIPCIÓN: Actualiza la contraseña del docente en la tabla 'usuarios'
        // --------------------------------------------------------
        // Actualizar contraseña
        $password_nueva_md5 = md5($password_nueva);
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
    // ENDPOINT: SUBIR FOTO DE PERFIL DEL DOCENTE
    // DESCRIPCIÓN:
    //   Sube una imagen de perfil del docente y actualiza la ruta en la BD.
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
            // DESCRIPCIÓN: Actualiza la ruta de la foto de perfil en la tabla 'docentes'
            // NOTA: Guardamos la ruta relativa sin '/' al inicio para mantener consistencia
            // --------------------------------------------------------
            $ruta_bd = $ruta_archivo;
            $sql_update = "UPDATE docentes SET profile_image = '$ruta_bd' WHERE id_usuario = $id_usuario";
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
    // ENDPOINT: CREAR ACTIVIDAD
    // DESCRIPCIÓN:
    //   Crea una nueva actividad académica para un curso.
    // ---------------------------------------------------------------
    if ($accion === "crear_actividad") {
        $curso_id = intval($_POST['curso_id'] ?? 0);
        $periodo_id = intval($_POST['periodo_id'] ?? 0);
        $nombre = mysqli_real_escape_string($conexion, $_POST['nombre'] ?? '');
        $descripcion = mysqli_real_escape_string($conexion, $_POST['descripcion'] ?? '');
        $porcentaje = floatval($_POST['porcentaje'] ?? 0);
        
        if (!$curso_id || empty($nombre) || $porcentaje <= 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Datos incompletos o inválidos'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        if ($porcentaje > 100) {
            echo json_encode([
                'success' => false,
                'message' => 'El porcentaje no puede ser mayor a 100'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $periodo_sql = $periodo_id > 0 ? $periodo_id : 'NULL';
        
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: CREAR ACTIVIDAD
        // MÉTODO: SQL INSERT mediante mysqli_query()
        // DESCRIPCIÓN: Inserta una nueva actividad académica en la tabla 'actividades'
        // --------------------------------------------------------
        $sql = "INSERT INTO actividades (curso_id, docente_id, nombre, descripcion, porcentaje, periodo_id)
                VALUES ($curso_id, $id_docente, '$nombre', '$descripcion', $porcentaje, $periodo_sql)";
        
        // Ejecutar consulta SQL INSERT
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado) {
            echo json_encode([
                'success' => true,
                'message' => 'Actividad creada correctamente'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear la actividad: ' . mysqli_error($conexion)
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: GUARDAR NOTAS
    // DESCRIPCIÓN:
    //   Guarda o actualiza las notas de los estudiantes para las actividades
    //   y también actualiza los porcentajes de las actividades si se modificaron.
    // ---------------------------------------------------------------
    if ($accion === "guardar_notas") {
        $notas_json = $_POST['notas'] ?? '[]';
        $notas = json_decode($notas_json, true);
        
        if (!is_array($notas) || empty($notas)) {
            echo json_encode([
                'success' => false,
                'message' => 'No hay cambios para guardar'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $notas_guardadas = 0;
        $notas_actualizadas = 0;
        $errores = [];
        
        // Guardar/actualizar notas con sus porcentajes
        if (is_array($notas) && !empty($notas)) {
            foreach ($notas as $nota) {
                $estudiante_id = intval($nota['estudiante_id'] ?? 0);
                $actividad_id = intval($nota['actividad_id'] ?? 0);
                $nota_valor = floatval($nota['nota'] ?? 0);
                $porcentaje_valor = floatval($nota['porcentaje'] ?? 0);
                
                if ($estudiante_id <= 0 || $actividad_id <= 0 || $nota_valor < 0 || $nota_valor > 50) {
                    $errores[] = "Nota inválida para estudiante $estudiante_id y actividad $actividad_id";
                    continue;
                }
                
                if ($porcentaje_valor < 0 || $porcentaje_valor > 100) {
                    $errores[] = "Porcentaje inválido para estudiante $estudiante_id y actividad $actividad_id";
                    continue;
                }
                
                // Verificar que la actividad pertenece al docente
                $sql_check_actividad = "SELECT id_actividad FROM actividades 
                                        WHERE id_actividad = $actividad_id AND docente_id = $id_docente";
                $resultado_check_actividad = mysqli_query($conexion, $sql_check_actividad);
                if (!$resultado_check_actividad || mysqli_num_rows($resultado_check_actividad) == 0) {
                    $errores[] = "No tiene permisos para modificar la actividad $actividad_id";
                    continue;
                }
                
                // Verificar si la nota ya existe
                $sql_check = "SELECT id_nota FROM notas_actividades 
                              WHERE estudiante_id = $estudiante_id AND actividad_id = $actividad_id";
                $resultado_check = mysqli_query($conexion, $sql_check);
                
                if ($resultado_check && mysqli_num_rows($resultado_check) > 0) {
                    // --------------------------------------------------------
                    // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR NOTA
                    // MÉTODO: SQL UPDATE mediante mysqli_query()
                    // DESCRIPCIÓN: Actualiza una nota existente en la tabla 'notas_actividades'
                    // --------------------------------------------------------
                    $sql_update = "UPDATE notas_actividades SET nota = $nota_valor, porcentaje = $porcentaje_valor, fecha_registro = NOW()
                                   WHERE estudiante_id = $estudiante_id AND actividad_id = $actividad_id";
                    $resultado_update = mysqli_query($conexion, $sql_update);
                    
                    if ($resultado_update) {
                        $notas_actualizadas++;
                    } else {
                        $errores[] = "Error al actualizar nota: " . mysqli_error($conexion);
                    }
                } else {
                    // --------------------------------------------------------
                    // MODIFICACIÓN EN BASE DE DATOS: INSERTAR NOTA
                    // MÉTODO: SQL INSERT mediante mysqli_query()
                    // DESCRIPCIÓN: Inserta una nueva nota en la tabla 'notas_actividades'
                    // --------------------------------------------------------
                    $sql_insert = "INSERT INTO notas_actividades (actividad_id, estudiante_id, nota, porcentaje, fecha_registro)
                                   VALUES ($actividad_id, $estudiante_id, $nota_valor, $porcentaje_valor, NOW())";
                    $resultado_insert = mysqli_query($conexion, $sql_insert);
                    
                    if ($resultado_insert) {
                        $notas_guardadas++;
                    } else {
                        $errores[] = "Error al guardar nota: " . mysqli_error($conexion);
                    }
                }
            }
        }
        
        if (empty($errores)) {
            $mensaje = [];
            if ($notas_guardadas > 0 || $notas_actualizadas > 0) {
                $mensaje[] = "Se guardaron $notas_guardadas notas nuevas y se actualizaron $notas_actualizadas notas";
            }
            if (empty($mensaje)) {
                $mensaje[] = "No hay cambios para guardar";
            }
            echo json_encode([
                'success' => true,
                'message' => implode('. ', $mensaje)
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Algunos cambios no se pudieron guardar: ' . implode(', ', $errores)
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
    
    // ---------------------------------------------------------------
    // ENDPOINT: CREAR COMUNICADO
    // DESCRIPCIÓN:
    //   Crea un nuevo comunicado publicado por el docente.
    // ---------------------------------------------------------------
    if ($accion === "crear_comunicado") {
        $titulo = mysqli_real_escape_string($conexion, $_POST['titulo'] ?? '');
        $contenido = mysqli_real_escape_string($conexion, $_POST['contenido'] ?? '');
        
        if (empty($titulo) || empty($contenido)) {
            echo json_encode([
                'success' => false,
                'message' => 'Todos los campos son obligatorios'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $autor_tipo = 'Docente';
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: CREAR COMUNICADO
        // MÉTODO: SQL INSERT mediante mysqli_query()
        // DESCRIPCIÓN: Inserta un nuevo comunicado en la tabla 'comunicados'
        // --------------------------------------------------------
        $sql = "INSERT INTO comunicados (autor_id, autor_tipo, titulo, contenido) 
                VALUES ($id_usuario, '$autor_tipo', '$titulo', '$contenido')";
        
        // Ejecutar consulta SQL INSERT
        if (mysqli_query($conexion, $sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Comunicado publicado correctamente'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al publicar el comunicado: ' . mysqli_error($conexion)
            ]);
        }
        
        mysqli_close($conexion);
        exit;
    }
}

// ---------------------------------------------------------------
// ENDPOINT: LISTAR COMUNICADOS (GET)
// DESCRIPCIÓN:
//   Devuelve la lista de comunicados publicados.
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['accion']) && $_GET['accion'] === "listar_comunicados") {
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
    $comunicados = [];
    
    if ($resultado) {
        while ($fila = mysqli_fetch_assoc($resultado)) {
            $comunicados[] = [
                'id_comunicado' => (int)$fila['id_comunicado'],
                'fecha_publicacion' => $fila['fecha_publicacion'],
                'titulo' => $fila['titulo'],
                'contenido' => $fila['contenido'],
                'autor_tipo' => $fila['autor_tipo'],
                'nombre_autor' => $fila['nombre_autor'] ?? '—',
                'cargo_autor' => $fila['cargo_autor'] ?? '—'
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'comunicados' => $comunicados
    ], JSON_UNESCAPED_UNICODE);
    
    mysqli_close($conexion);
    exit;
}

mysqli_close($conexion);
?>
