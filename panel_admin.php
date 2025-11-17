<?php
// ================================================================
// ARCHIVO: panel_admin.php
// DESCRIPCIÓN: Panel del administrador. Permite registrar nuevos usuarios
//              y consultar la lista de usuarios registrados.
// ================================================================

// ------------------------------------------------
// 1. Iniciar la sesión
// ------------------------------------------------
session_start(); 

// ------------------------------------------------
// 2. Incluir la conexión con la base de datos
// ------------------------------------------------
include("conexion.php"); 

// ------------------------------------------------
// CONFIGURAR UTF-8 PARA EVITAR PROBLEMAS DE TILDES
// ------------------------------------------------
mysqli_set_charset($conexion, "utf8");

// ------------------------------------------------
// 3. PROCESAR PETICIONES GET (verificar acciones primero)
// DESCRIPCIÓN:
//   Este proyecto solo utiliza métodos HTTP GET y POST debido a
//   limitaciones del hosting InfinityFree que bloquea métodos como
//   DELETE, PUT, PATCH. Todas las operaciones se realizan mediante
//   estos dos métodos con parámetros de acción en la URL (GET) o
//   en el body (POST).
// ------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    
    // Verificamos si hay una acción específica en los parámetros GET
    $accion = $_GET['accion'] ?? '';
    
    // ---------------------------------------------------------------
    // ENDPOINT: OBTENER PERFIL DEL ADMINISTRADOR
    // DESCRIPCIÓN:
    //   Devuelve los datos del perfil del administrador actual
    //   (obtenido de la sesión).
    // ---------------------------------------------------------------
    if ($accion === "obtener_perfil") {
        header('Content-Type: application/json; charset=utf-8');
        
        // Obtenemos el ID del usuario de la sesión
        $id_usuario = $_SESSION['id_usuario'] ?? null;
        
        if (!$id_usuario) {
            echo json_encode([
                'success' => false,
                'message' => 'No hay sesión activa'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        // Consultamos los datos del administrador (verificando que el usuario sea administrador)
        // NOTA: Usamos COALESCE para obtener nombre_completo de administradores o nombre_usuario como fallback
        // Actualizamos nombre_completo en la tabla administradores si está vacío
        $sql = "SELECT COALESCE(a.nombre_completo, u.nombre_usuario) AS nombre, 
                       u.nombre_usuario, u.correo, u.id_rol, a.telefono, a.tipo_documento, 
                       a.numero_documento, a.profile_image, a.cargo, a.nombre_completo
                FROM usuarios u
                INNER JOIN administradores a ON u.id_usuario = a.id_usuario
                WHERE u.id_usuario = $id_usuario AND u.id_rol = 1";
        
        $resultado = mysqli_query($conexion, $sql);
        
        if ($resultado && mysqli_num_rows($resultado) > 0) {
            $fila = mysqli_fetch_assoc($resultado);
            
            // Construimos la URL completa de la imagen
            $imageUrl = '';
            if (!empty($fila['profile_image'])) {
                $imageUrl = $fila['profile_image'];
            }
            
            // Si nombre_completo está vacío, actualizamos con nombre_usuario
            $nombre_completo = $fila['nombre_completo'] ?? '';
            if (empty($nombre_completo)) {
                $nombre_completo = $fila['nombre_usuario'];
                // Actualizar en la base de datos
                $sql_update_nombre = "UPDATE administradores SET nombre_completo = '$nombre_completo' WHERE id_usuario = $id_usuario";
                mysqli_query($conexion, $sql_update_nombre);
            }
            
            echo json_encode([
                'success' => true,
                'nombre' => $fila['nombre'] ?? $fila['nombre_usuario'], // Usamos nombre_completo si existe, sino nombre_usuario
                'correo' => $fila['correo'],
                'telefono' => $fila['telefono'] ?? '',
                'cargo' => $fila['cargo'] ?? '',
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
    // ENDPOINT: LISTAR USUARIOS
    // DESCRIPCIÓN:
    //   Devuelve todos los usuarios del sistema con su información
    //   completa (nombre, correo, rol, tipo y número de documento).
    //   Para docentes, incluye la materia asignada.
    //   Para estudiantes, incluye el salón (curso) asignado si tiene uno.
    //   Si un estudiante no tiene cursos asignados, el campo salón queda vacío.
    // ---------------------------------------------------------------
    if ($accion === "listar_usuarios" || empty($accion)) {
        header('Content-Type: application/json; charset=utf-8');

        // Consulta que obtiene usuarios con información de documento según su rol
        // Usa nombre_completo si existe, sino nombre_usuario
        // Incluye id_estudiante para poder obtener los cursos asignados
        $sql = "SELECT u.id_usuario, 
                       COALESCE(a.nombre_completo, d.nombre_completo, e.nombre_completo, u.nombre_usuario) AS nombre_usuario,
                       u.correo, u.id_rol,
                       d.materia AS id_materia, m.nombre_materia,
                       COALESCE(a.tipo_documento, d.tipo_documento, e.tipo_documento) AS tipo_documento,
                       COALESCE(a.numero_documento, d.numero_documento, e.numero_documento) AS numero_documento,
                       e.id_estudiante
                FROM usuarios u
                LEFT JOIN administradores a ON u.id_usuario = a.id_usuario
                LEFT JOIN docentes d ON u.id_usuario = d.id_usuario
                LEFT JOIN estudiantes e ON u.id_usuario = e.id_usuario
                LEFT JOIN materias m ON d.materia = m.id_materia
                ORDER BY u.id_usuario";

        $resultado = mysqli_query($conexion, $sql);

        if ($resultado && mysqli_num_rows($resultado) > 0) {
            $usuarios = [];

            while ($fila = mysqli_fetch_assoc($resultado)) {
                // Convertir el id_rol en texto legible
                switch ($fila['id_rol']) {
                    case 1: $rol = "Administrador"; break;
                    case 2: $rol = "Docente"; break;
                    case 3: $rol = "Estudiante"; break;
                    default: $rol = "Desconocido";
                }

                // Determinar qué mostrar en la columna "Salón / Materias"
                $salon_materias = "—";
                
                if ($rol === "Docente") {
                    // Para docentes: mostrar la materia asignada
                    if (!empty($fila['nombre_materia'])) {
                        $salon_materias = $fila['nombre_materia'];
                    }
                } elseif ($rol === "Estudiante" && !empty($fila['id_estudiante'])) {
                    // Para estudiantes: obtener los cursos (salones) asignados
                    $id_estudiante = intval($fila['id_estudiante']);
                    
                    // Obtener los cursos asignados al estudiante
                    $sql_cursos = "SELECT c.nombre_curso 
                                   FROM cursos c
                                   INNER JOIN estudiante_curso ec ON c.id_curso = ec.id_curso
                                   WHERE ec.id_estudiante = $id_estudiante
                                   ORDER BY c.nombre_curso
                                   LIMIT 1";
                    
                    $resultado_cursos = mysqli_query($conexion, $sql_cursos);
                    
                    if ($resultado_cursos && mysqli_num_rows($resultado_cursos) > 0) {
                        $curso_fila = mysqli_fetch_assoc($resultado_cursos);
                        $salon_materias = $curso_fila['nombre_curso'];
                        
                        // Si el estudiante tiene más de un curso, agregar "+X más"
                        $sql_count = "SELECT COUNT(*) as total 
                                      FROM estudiante_curso 
                                      WHERE id_estudiante = $id_estudiante";
                        $resultado_count = mysqli_query($conexion, $sql_count);
                        
                        if ($resultado_count) {
                            $count_fila = mysqli_fetch_assoc($resultado_count);
                            $total_cursos = intval($count_fila['total']);
                            
                            if ($total_cursos > 1) {
                                $salon_materias .= " (+" . ($total_cursos - 1) . " más)";
                            }
                        }
                    } else {
                        // Estudiante sin cursos asignados - campo vacío
                        $salon_materias = "";
                    }
                }

                // Agregar los datos al array que será enviado como JSON
                $usuarios[] = [
                    "id" => $fila['id_usuario'],
                    "nombre" => $fila['nombre_usuario'],
                    "correo" => $fila['correo'],
                    "rol" => $rol,
                    "tipo_documento" => $fila['tipo_documento'] ?? "—",
                    "numero_documento" => $fila['numero_documento'] ?? "—",
                    "salon_materias" => $salon_materias
                ];
            }

            echo json_encode($usuarios, JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([]);
        }

        mysqli_close($conexion);
        exit;
    }
    
    // Si hay una acción específica de cursos o estudiantes, estos endpoints se procesan más abajo
    if ($accion === "listar_cursos" || $accion === "estudiantes_curso" || $accion === "listar_estudiantes" || 
        $accion === "horarios_docentes" || $accion === "horarios_curso" || $accion === "listar_docentes" || $accion === "listar_comunicados") {
        // Estos endpoints se procesan más abajo en el código
        // No hacemos nada aquí
    }
}

// ------------------------------------------------
// 4. PROCESAR PETICIONES POST (crear usuario o curso)
// DESCRIPCIÓN:
//   Procesa todas las peticiones POST del panel de administrador.
//   Las acciones se identifican mediante el parámetro 'accion' en $_POST.
//   Este método se usa para operaciones que modifican datos (crear, actualizar,
//   eliminar) ya que el hosting InfinityFree bloquea métodos HTTP como DELETE.
// ------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Acción enviada desde el formulario o fetch()
    $accion = $_POST['accion'] ?? '';

    // =======================================================
    // 4.1 CREAR USUARIO
    // DESCRIPCIÓN:
    //   Crea un nuevo usuario en el sistema con validaciones
    //   de tipo y número de documento. Valida que el número de
    //   documento contenga solo números y que no esté duplicado.
    // =======================================================
    if ($accion === "crear_usuario") {

        // Capturamos los datos del formulario
        $nombre = mysqli_real_escape_string($conexion, $_POST['nombre'] ?? '');
        $correo = mysqli_real_escape_string($conexion, $_POST['correo'] ?? '');
        $password = $_POST['password'] ?? '';
        $rol = $_POST['rol'] ?? '';
        $tipo_documento = mysqli_real_escape_string($conexion, $_POST['tipo_documento'] ?? '');
        $numero_documento = mysqli_real_escape_string($conexion, $_POST['numero_documento'] ?? '');
        $materia = $_POST['materia'] ?? null; // Solo si el rol es docente

        // Validación básica de campos vacíos
        if (empty($nombre) || empty($correo) || empty($password) || empty($rol) || empty($tipo_documento) || empty($numero_documento)) {
            echo "⚠️ Todos los campos son obligatorios.";
            exit;
        }

        // Validar formato de email
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            echo "❌ El formato del correo electrónico no es válido.";
            exit;
        }

        // Validar que el número de documento contenga solo números
        if (!preg_match('/^[0-9]+$/', $numero_documento)) {
            echo "❌ El número de documento solo debe contener números.";
            exit;
        }

        // Verificar si el número de documento ya existe
        $sql_check_doc = "SELECT COUNT(*) as total FROM (
            SELECT numero_documento FROM administradores WHERE numero_documento = '$numero_documento'
            UNION ALL
            SELECT numero_documento FROM docentes WHERE numero_documento = '$numero_documento'
            UNION ALL
            SELECT numero_documento FROM estudiantes WHERE numero_documento = '$numero_documento'
        ) AS todos_documentos";
        
        $result_check = mysqli_query($conexion, $sql_check_doc);
        $row_check = mysqli_fetch_assoc($result_check);
        
        if ($row_check['total'] > 0) {
            echo "❌ El número de documento ya está registrado en el sistema.";
            exit;
        }

        // Verificar si el correo ya existe
        $sql_check_email = "SELECT COUNT(*) as total FROM usuarios WHERE correo = '$correo'";
        $result_check_email = mysqli_query($conexion, $sql_check_email);
        $row_check_email = mysqli_fetch_assoc($result_check_email);
        
        if ($row_check_email['total'] > 0) {
            echo "❌ El correo electrónico ya está registrado en el sistema.";
            exit;
        }

        // Encriptar contraseña (por seguridad)
        $password_segura = md5($password);

        // Convertimos el rol en ID numérico (según tabla 'roles')
        $id_rol = 0;
        switch (strtolower($rol)) {
            case 'administrador': $id_rol = 1; break;
            case 'docente': $id_rol = 2; break;
            case 'estudiante': $id_rol = 3; break;
            default:
                echo "❌ Rol no válido.";
                exit;
        }

        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: INSERTAR USUARIO
        // MÉTODO: SQL INSERT mediante mysqli_query()
        // DESCRIPCIÓN: Inserta el nuevo usuario en la tabla principal 'usuarios'
        // --------------------------------------------------------
        $sql_usuario = "INSERT INTO usuarios (nombre_usuario, password, correo, id_rol) 
                        VALUES ('$nombre', '$password_segura', '$correo', '$id_rol')";

        // Ejecutar consulta SQL INSERT
        if (mysqli_query($conexion, $sql_usuario)) {

            // Obtenemos el ID autogenerado por la base de datos
            $id_usuario = mysqli_insert_id($conexion);

            // --------------------------------------------------------
            // MODIFICACIÓN EN BASE DE DATOS: INSERTAR EN TABLA ESPECÍFICA
            // MÉTODO: SQL INSERT mediante mysqli_query()
            // DESCRIPCIÓN: Inserta el registro en la tabla correspondiente
            //              según el rol (administradores, docentes o estudiantes)
            // --------------------------------------------------------
            switch ($id_rol) {

                case 1: // ADMINISTRADOR
                    // Guardamos nombre_completo al crear el administrador
                    $sql_extra = "INSERT INTO administradores (id_usuario, nombre_completo, tipo_documento, numero_documento)
                                  VALUES ('$id_usuario', '$nombre', '$tipo_documento', '$numero_documento')";
                    break;

                case 2: // DOCENTE
                    if (empty($materia)) {
                        echo "⚠️ Debe seleccionar una materia para el docente.";
                        exit;
                    }
                    // Guardamos nombre_completo al crear el docente
                    $sql_extra = "INSERT INTO docentes (id_usuario, nombre_completo, materia, tipo_documento, numero_documento)
                                  VALUES ('$id_usuario', '$nombre', '$materia', '$tipo_documento', '$numero_documento')";
                    break;

                case 3: // ESTUDIANTE
                    // Guardamos nombre_completo al crear el estudiante
                    $sql_extra = "INSERT INTO estudiantes (id_usuario, nombre_completo, tipo_documento, numero_documento)
                                  VALUES ('$id_usuario', '$nombre', '$tipo_documento', '$numero_documento')";
                    break;
            }

            // Ejecutar consulta SQL INSERT en la tabla específica del rol
            if (mysqli_query($conexion, $sql_extra)) {
                echo "✅ Usuario creado correctamente y registrado como $rol.";
            } else {
                echo "⚠️ Usuario creado, pero ocurrió un error al insertar en la tabla de $rol: " . mysqli_error($conexion);
            }

        } else {
            echo "❌ Error al crear el usuario: " . mysqli_error($conexion);
        }

        mysqli_close($conexion);
        exit;
    }

    // =======================================================
    // 4.2 CREAR CURSO
    // =======================================================
    if ($accion === "crear_curso") {

        // Capturamos los datos del curso
        $nombre_curso = $_POST['nombre_curso'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';

        // Validamos los campos
        if (empty($nombre_curso) || empty($descripcion)) {
            echo "⚠️ Todos los campos son obligatorios.";
            exit;
        }

        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: INSERTAR CURSO
        // MÉTODO: SQL INSERT mediante mysqli_query()
        // DESCRIPCIÓN: Inserta un nuevo curso en la tabla 'cursos'
        // --------------------------------------------------------
        $sql_curso = "INSERT INTO cursos (nombre_curso, descripcion) 
                      VALUES ('$nombre_curso', '$descripcion')";

        // Ejecutar consulta SQL INSERT
        if (mysqli_query($conexion, $sql_curso)) {
            echo "✅ Curso '$nombre_curso' registrado correctamente.";
        } else {
            echo "❌ Error al crear el curso: " . mysqli_error($conexion);
        }

        mysqli_close($conexion);
        exit;
    }

    // =======================================================
    // 4.3 ACTUALIZAR PERFIL DEL ADMINISTRADOR
    // DESCRIPCIÓN:
    //   Actualiza los datos del perfil del administrador actual.
    //   Valida que el número de documento contenga solo números
    //   y que el correo tenga formato válido.
    // =======================================================
    if ($accion === "actualizar_perfil") {
        header('Content-Type: application/json; charset=utf-8');
        
        // Obtenemos el ID del usuario de la sesión
        $id_usuario = $_SESSION['id_usuario'] ?? null;
        
        if (!$id_usuario) {
            echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
            mysqli_close($conexion);
            exit;
        }
        
        // Capturamos los datos del formulario
        $nombre = mysqli_real_escape_string($conexion, $_POST['nombre'] ?? '');
        $correo = mysqli_real_escape_string($conexion, $_POST['correo'] ?? '');
        $telefono = mysqli_real_escape_string($conexion, $_POST['telefono'] ?? '');
        $cargo = mysqli_real_escape_string($conexion, $_POST['cargo'] ?? '');
        $tipo_documento = mysqli_real_escape_string($conexion, $_POST['tipo_documento'] ?? '');
        $numero_documento = mysqli_real_escape_string($conexion, $_POST['numero_documento'] ?? '');
        
        // Validaciones
        if (empty($nombre) || empty($correo)) {
            echo json_encode(['success' => false, 'message' => 'El nombre y el correo son obligatorios']);
            mysqli_close($conexion);
            exit;
        }
        
        // Validar formato de email
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'El formato del correo electrónico no es válido']);
            mysqli_close($conexion);
            exit;
        }
        
        // Validar que el número de documento contenga solo números (si se proporciona)
        if (!empty($numero_documento) && !preg_match('/^[0-9]+$/', $numero_documento)) {
            echo json_encode(['success' => false, 'message' => 'El número de documento solo debe contener números']);
            mysqli_close($conexion);
            exit;
        }
        
        // Actualizar en la tabla usuarios
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR USUARIO
        // MÉTODO: SQL UPDATE mediante mysqli_query()
        // DESCRIPCIÓN: Actualiza los datos del usuario en la tabla 'usuarios'
        // --------------------------------------------------------
        $sql_update_usuario = "UPDATE usuarios SET nombre_usuario = '$nombre', correo = '$correo' WHERE id_usuario = $id_usuario";

        // Ejecutar consulta SQL UPDATE
        if (!mysqli_query($conexion, $sql_update_usuario)) {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el usuario: ' . mysqli_error($conexion)]);
            mysqli_close($conexion);
            exit;
        }
        
        // Actualizar en la tabla administradores (incluyendo nombre_completo)
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR ADMINISTRADOR
        // MÉTODO: SQL UPDATE mediante mysqli_query()
        // DESCRIPCIÓN: Actualiza los datos del administrador en la tabla 'administradores'
        // --------------------------------------------------------
        $sql_update_admin = "UPDATE administradores SET nombre_completo = '$nombre', telefono = '$telefono', cargo = '$cargo', tipo_documento = '$tipo_documento', numero_documento = '$numero_documento' WHERE id_usuario = $id_usuario";

        // Ejecutar consulta SQL UPDATE
        if (mysqli_query($conexion, $sql_update_admin)) {
            echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el perfil: ' . mysqli_error($conexion)]);
        }
        
        mysqli_close($conexion);
        exit;
    }

    // =======================================================
    // 4.4 ACTUALIZAR CONTRASEÑA DEL ADMINISTRADOR
    // DESCRIPCIÓN:
    //   Actualiza la contraseña del administrador actual.
    //   Verifica que la contraseña actual sea correcta antes
    //   de permitir el cambio.
    // =======================================================
    if ($accion === "actualizar_password") {
        header('Content-Type: application/json; charset=utf-8');
        
        $id_usuario = $_SESSION['id_usuario'] ?? null;
        
        if (!$id_usuario) {
            echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
            mysqli_close($conexion);
            exit;
        }
        
        $password_actual = $_POST['password_actual'] ?? '';
        $password_nueva = $_POST['password_nueva'] ?? '';
        
        if (empty($password_actual) || empty($password_nueva)) {
            echo json_encode(['success' => false, 'message' => 'Debe completar todos los campos']);
            mysqli_close($conexion);
            exit;
        }
        
        if (strlen($password_nueva) < 6) {
            echo json_encode(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 6 caracteres']);
            mysqli_close($conexion);
            exit;
        }
        
        // Verificar que la contraseña actual sea correcta
        $password_actual_md5 = md5($password_actual);
        $sql_check = "SELECT password FROM usuarios WHERE id_usuario = $id_usuario AND password = '$password_actual_md5'";
        $result_check = mysqli_query($conexion, $sql_check);
        
        if (mysqli_num_rows($result_check) === 0) {
            echo json_encode(['success' => false, 'message' => 'La contraseña actual no es correcta']);
            mysqli_close($conexion);
            exit;
        }
        
        // Actualizar la contraseña
        $password_nueva_md5 = md5($password_nueva);
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR CONTRASEÑA
        // MÉTODO: SQL UPDATE mediante mysqli_query()
        // DESCRIPCIÓN: Actualiza la contraseña del usuario en la tabla 'usuarios'
        // --------------------------------------------------------
        $sql_update = "UPDATE usuarios SET password = '$password_nueva_md5' WHERE id_usuario = $id_usuario";

        // Ejecutar consulta SQL UPDATE
        if (mysqli_query($conexion, $sql_update)) {
            echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña: ' . mysqli_error($conexion)]);
        }
        
        mysqli_close($conexion);
        exit;
    }

    // =======================================================
    // 4.5 SUBIR FOTO DE PERFIL
    // DESCRIPCIÓN:
    //   Sube una foto de perfil para el administrador actual.
    //   Valida el tipo de archivo (solo jpg, jpeg, png) y el
    //   tamaño (máximo 2MB). Guarda la imagen en la carpeta
    //   fotos_de_perfil/ y actualiza la ruta en la base de datos.
    // =======================================================
    if ($accion === "subir_foto_perfil") {
        header('Content-Type: application/json; charset=utf-8');
        
        $id_usuario = $_SESSION['id_usuario'] ?? null;
        
        if (!$id_usuario) {
            echo json_encode(['success' => false, 'message' => 'No hay sesión activa']);
            exit;
        }
        
        if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'Error al subir el archivo']);
            exit;
        }
        
        $file = $_FILES['foto'];
        
        // Validar tipo de archivo
        $tipos_permitidos = ['image/jpeg', 'image/jpg', 'image/png'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mime_type, $tipos_permitidos)) {
            echo json_encode(['success' => false, 'message' => 'Solo se permiten archivos JPG, JPEG o PNG']);
            exit;
        }
        
        // Validar tamaño (máximo 2MB)
        $tamanio_maximo = 2 * 1024 * 1024;
        if ($file['size'] > $tamanio_maximo) {
            echo json_encode(['success' => false, 'message' => 'La imagen no debe superar los 2MB']);
            exit;
        }
        
        // Crear directorio si no existe
        $directorio = 'fotos_de_perfil/';
        if (!file_exists($directorio)) {
            mkdir($directorio, 0777, true);
        }
        
        // Generar nombre único para el archivo
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $nombre_archivo = time() . '_' . $id_usuario . '_' . uniqid() . '.' . $extension;
        $ruta_completa = $directorio . $nombre_archivo;
        
        // Mover el archivo al directorio
        if (move_uploaded_file($file['tmp_name'], $ruta_completa)) {
            // Actualizar la ruta en la base de datos
            $ruta_relativa = $ruta_completa;
            // --------------------------------------------------------
            // MODIFICACIÓN EN BASE DE DATOS: ACTUALIZAR FOTO DE PERFIL
            // MÉTODO: SQL UPDATE mediante mysqli_query()
            // DESCRIPCIÓN: Actualiza la ruta de la foto de perfil en la tabla 'administradores'
            // --------------------------------------------------------
            $sql_update = "UPDATE administradores SET profile_image = '$ruta_relativa' WHERE id_usuario = $id_usuario";

            // Ejecutar consulta SQL UPDATE
            if (mysqli_query($conexion, $sql_update)) {
                echo json_encode(['success' => true, 'message' => 'Foto de perfil actualizada correctamente', 'imageUrl' => $ruta_relativa]);
            } else {
                unlink($ruta_completa);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar la base de datos: ' . mysqli_error($conexion)]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al guardar el archivo']);
        }
        
        mysqli_close($conexion);
        exit;
    }

    // =======================================================
    // 4.6 MATRICULAR ESTUDIANTES EN UN CURSO
    // DESCRIPCIÓN:
    //   Matricula estudiantes en un curso específico.
    //   Registra las inscripciones en la tabla estudiante_curso.
    // =======================================================
    if ($accion === "matricular_estudiantes") {
        header('Content-Type: application/json; charset=utf-8');
        
        $curso_id = intval($_POST['curso_id'] ?? 0);
        $estudiantes_json = $_POST['estudiantes_ids'] ?? '[]';
        $estudiantes_ids = json_decode($estudiantes_json, true);
        
        if (!$curso_id || empty($estudiantes_ids) || !is_array($estudiantes_ids)) {
            echo json_encode([
                'success' => false,
                'message' => 'Datos inválidos'
            ]);
            mysqli_close($conexion);
            exit;
        }
        
        $matriculados = 0;
        $errores = [];
        
        foreach ($estudiantes_ids as $estudiante_id) {
            $estudiante_id = intval($estudiante_id);
            
            // Verificar si ya está matriculado en este curso
            $sql_check_curso = "SELECT id_estudiante FROM estudiante_curso 
                                WHERE id_estudiante = $estudiante_id AND id_curso = $curso_id";
            $resultado_check_curso = mysqli_query($conexion, $sql_check_curso);
            
            if ($resultado_check_curso && mysqli_num_rows($resultado_check_curso) > 0) {
                continue; // Ya está matriculado en este curso, continuar con el siguiente
            }
            
            // Verificar si el estudiante ya está inscrito en OTRO curso
            $sql_check_otro_curso = "SELECT ec.id_curso, c.nombre_curso 
                                     FROM estudiante_curso ec
                                     INNER JOIN cursos c ON ec.id_curso = c.id_curso
                                     WHERE ec.id_estudiante = $estudiante_id";
            $resultado_check_otro = mysqli_query($conexion, $sql_check_otro_curso);
            
            if ($resultado_check_otro && mysqli_num_rows($resultado_check_otro) > 0) {
                $fila_curso = mysqli_fetch_assoc($resultado_check_otro);
                $nombre_curso_existente = $fila_curso['nombre_curso'] ?? 'otro curso';
                $errores[] = "El estudiante ya está inscrito en el curso: $nombre_curso_existente. Un estudiante solo puede estar inscrito en un curso.";
                continue; // No puede estar en más de un curso
            }
            
            // --------------------------------------------------------
            // MODIFICACIÓN EN BASE DE DATOS: MATRICULAR ESTUDIANTE
            // MÉTODO: SQL INSERT mediante mysqli_query()
            // DESCRIPCIÓN: Inserta la relación estudiante-curso en la tabla 'estudiante_curso'
            // --------------------------------------------------------
            $sql_insert = "INSERT INTO estudiante_curso (id_estudiante, id_curso) 
                           VALUES ($estudiante_id, $curso_id)";

            // Ejecutar consulta SQL INSERT
            if (mysqli_query($conexion, $sql_insert)) {
                $matriculados++;
            } else {
                $errores[] = "Error al matricular estudiante $estudiante_id: " . mysqli_error($conexion);
            }
        }
        
        if (empty($errores)) {
            echo json_encode([
                'success' => true,
                'message' => "Se matricularon $matriculados estudiante(s) correctamente"
            ]);
        } else {
            // Si hay errores pero también se matricularon algunos estudiantes
            if ($matriculados > 0) {
                echo json_encode([
                    'success' => false,
                    'message' => "Se matricularon $matriculados estudiante(s), pero algunos no se pudieron matricular: " . implode(' | ', $errores)
                ]);
            } else {
                // Si no se matricularon ninguno
                echo json_encode([
                    'success' => false,
                    'message' => 'No se pudo matricular ningún estudiante: ' . implode(' | ', $errores)
                ]);
            }
        }
        
        mysqli_close($conexion);
        exit;
    }
}


// ---------------------------------------------------------------
// 4.7 ELIMINAR USUARIOS SELECCIONADOS (POST)
// DESCRIPCIÓN:
//   Endpoint que elimina usuarios de la base de datos mediante
//   petición POST (no DELETE) debido a limitaciones del hosting
//   InfinityFree que bloquea métodos HTTP como DELETE, PUT, PATCH.
//
//   FLUJO DE EJECUCIÓN:
//   1. Verifica que la petición sea POST con accion="borrar"
//   2. Obtiene y decodifica el JSON de IDs desde $_POST['ids']
//   3. Valida que se recibieron IDs válidos
//   4. Filtra el administrador principal (id_usuario = 1) para protegerlo
//   5. Construye consulta SQL DELETE con los IDs restantes
//   6. Ejecuta la consulta SQL para eliminar los usuarios
//   7. Retorna mensaje de éxito o error
//
//   MÉTODO HTTP: POST (requerido por limitaciones del hosting)
//   PARÁMETROS RECIBIDOS:
//     - accion: "borrar" (identifica esta acción)
//     - ids: JSON string con array de IDs [id1, id2, ...]
//
//   SEGURIDAD:
//     - Protege el administrador principal (id_usuario = 1)
//     - Sanitiza IDs convirtiéndolos a enteros (intval)
//     - Valida que los IDs sean un array válido
//
//   SQL EJECUTADO:
//     DELETE FROM usuarios WHERE id_usuario IN (id1, id2, id3, ...)
//     Esta consulta elimina todos los usuarios cuyos IDs estén en la lista.
//     NOTA: Por las relaciones de claves foráneas, si hay registros
//     relacionados en otras tablas, podría fallar o requerir eliminación
//     en cascada según la configuración de la base de datos.
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['accion']) && $_POST['accion'] === "borrar") {
    // Establecer tipo de contenido como texto plano (no JSON)
    header('Content-Type: text/plain; charset=utf-8');
    
    // Paso 1: Obtener y decodificar el JSON de IDs desde el POST
    // El cliente envía los IDs como JSON string en $_POST['ids']
    $ids_json = $_POST['ids'] ?? '[]';
    $ids = json_decode($ids_json, true);
    
    // Paso 2: Validar que se recibieron IDs válidos
    if (empty($ids) || !is_array($ids)) {
        echo "⚠️ No se recibieron usuarios para eliminar.";
        mysqli_close($conexion);
        exit;
    }

    // Paso 3: Filtrar el ID del administrador principal (id_usuario = 1)
    // Esta es una protección adicional en el servidor para evitar que
    // se elimine accidentalmente el administrador principal, que es
    // indispensable para el funcionamiento del sistema
    $ids = array_filter($ids, function($id) {
        return intval($id) !== 1;  // Excluir el ID 1 (administrador principal)
    });

    // Paso 4: Verificar si después de filtrar quedan IDs para eliminar
    // Si no quedan IDs, significa que solo se intentó eliminar al admin
    if (empty($ids)) {
        echo "⚠️ No se puede eliminar el perfil del administrador principal. Este perfil es indispensable para el sistema.";
        mysqli_close($conexion);
        exit;
    }

    // Paso 5: Construir la lista de IDs para la consulta SQL
    // Convertimos todos los IDs a enteros para prevenir inyección SQL
    // y los unimos con comas para usar en la cláusula IN
    $idLista = implode(",", array_map('intval', $ids));
    
    // Paso 6: Construir y ejecutar la consulta SQL DELETE
    // --------------------------------------------------------
    // MODIFICACIÓN EN BASE DE DATOS: ELIMINAR USUARIOS
    // MÉTODO: SQL DELETE mediante mysqli_query()
    // DESCRIPCIÓN: Elimina los usuarios seleccionados de la tabla 'usuarios'
    //              usando la cláusula IN con los IDs proporcionados
    // NOTA: Si hay claves foráneas, podría requerir eliminación en cascada
    // --------------------------------------------------------
    $sql = "DELETE FROM usuarios WHERE id_usuario IN ($idLista)";

    // Paso 7: Ejecutar la consulta SQL DELETE y retornar resultado
    if (mysqli_query($conexion, $sql)) {
        echo "🗑️ Usuarios eliminados correctamente.";
    } else {
        // Si hay error, mostrar el mensaje de error de MySQL
        echo "❌ Error al eliminar usuarios: " . mysqli_error($conexion);
    }
    
    // Cerrar conexión y terminar ejecución
    mysqli_close($conexion);
    exit;
}


// ---------------------------------------------------------------
// NOTA: La función crear_curso ya está implementada arriba en la
//       sección 4.2 (línea 289). Esta sección duplicada ha sido
//       eliminada para evitar conflictos y mantener el código
//       organizado en un solo lugar.
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// 7. LISTAR CURSOS CON CANTIDAD DE ESTUDIANTES (PETICIÓN GET)
// DESCRIPCIÓN:
//   Endpoint que devuelve todos los cursos registrados junto con
//   la cantidad de estudiantes que pertenecen a cada curso.
//   Se ejecuta cuando se hace una petición GET con el parámetro
//   accion=listar_cursos (ej: panel_admin.php?accion=listar_cursos)
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['accion']) && $_GET['accion'] === "listar_cursos") {

    // Establecemos el tipo de contenido de la respuesta como JSON con codificación UTF-8
    // Esto permite que el navegador interprete correctamente caracteres especiales (tildes, ñ, etc.)
    header('Content-Type: application/json; charset=utf-8');
    
    // Consulta SQL que obtiene los cursos con la cantidad de estudiantes asociados
    // LEFT JOIN: Incluye todos los cursos, incluso si no tienen estudiantes (mostrarán 0)
    // COUNT(): Cuenta cuántos estudiantes están asociados a cada curso
    // GROUP BY: Agrupa los resultados por curso para que COUNT funcione correctamente
    // ORDER BY: Ordena los cursos alfabéticamente por nombre
    // NOTA: El campo en la base de datos se llama 'descripcion' (no 'descripcion_curso')
    $sql = "SELECT c.id_curso, 
                   c.nombre_curso, 
                   c.descripcion AS descripcion_curso,
                   COUNT(ec.id_estudiante) AS cantidad_estudiantes
            FROM cursos c
            LEFT JOIN estudiante_curso ec ON c.id_curso = ec.id_curso
            GROUP BY c.id_curso, c.nombre_curso, c.descripcion
            ORDER BY c.nombre_curso ASC";
    
    // Ejecutamos la consulta SQL en la base de datos
    $resultado = mysqli_query($conexion, $sql);

    // Inicializamos un array vacío donde almacenaremos los cursos
    $cursos = [];
    
    // Verificamos que la consulta se haya ejecutado correctamente
    if ($resultado) {
        // Recorremos cada fila del resultado de la consulta
        while ($fila = mysqli_fetch_assoc($resultado)) {
            // Convertimos los valores a los tipos correctos y los agregamos al array
            // (int): Convierte a entero para asegurar que sean números
            // ??: Operador null coalescing, usa '' si descripcion_curso es null
            $cursos[] = [
                'id_curso' => (int)$fila['id_curso'],                    // ID numérico del curso
                'nombre_curso' => $fila['nombre_curso'],                 // Nombre del curso (ej: "702")
                'descripcion_curso' => $fila['descripcion_curso'] ?? '', // Descripción del curso
                'cantidad_estudiantes' => (int)$fila['cantidad_estudiantes'] // Cantidad de estudiantes
            ];
        }
    }

    // Convertimos el array PHP a formato JSON y lo enviamos como respuesta
    // JSON_UNESCAPED_UNICODE: Permite que caracteres especiales se muestren correctamente
    echo json_encode($cursos, JSON_UNESCAPED_UNICODE);
    
    // Cerramos la conexión con la base de datos para liberar recursos
    mysqli_close($conexion);
    
    // Terminamos la ejecución del script (importante para evitar que se ejecute código adicional)
    exit;
}

// ---------------------------------------------------------------
// 8. OBTENER ESTUDIANTES DE UN CURSO ESPECÍFICO (PETICIÓN GET)
// DESCRIPCIÓN:
//   Endpoint que devuelve la lista de estudiantes que pertenecen
//   a un curso específico. Los estudiantes vienen ordenados
//   alfabéticamente por nombre.
//   Se ejecuta cuando se hace una petición GET con los parámetros:
//   accion=estudiantes_curso&id_curso=X
//   (ej: panel_admin.php?accion=estudiantes_curso&id_curso=1)
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['accion']) && $_GET['accion'] === "estudiantes_curso" && isset($_GET['id_curso'])) {

    // Establecemos el tipo de contenido de la respuesta como JSON con codificación UTF-8
    header('Content-Type: application/json; charset=utf-8');
    
    // Sanitizamos el ID del curso para prevenir inyección SQL
    // intval(): Convierte el valor a entero, eliminando cualquier carácter no numérico
    // Esto es una medida de seguridad básica (en producción usar prepared statements)
    $id_curso = intval($_GET['id_curso']);
    
    // Consulta SQL que obtiene los estudiantes de un curso específico
    // estudiante_curso (ec): Tabla intermedia que relaciona estudiantes con cursos
    // estudiantes (e): Tabla que contiene los datos de los estudiantes
    // usuarios (u): Tabla que contiene el nombre del usuario (nombre_usuario)
    // INNER JOIN: Solo incluye estudiantes que tienen relación con el curso
    // WHERE: Filtra por el ID del curso especificado
    // ORDER BY: Ordena los resultados alfabéticamente por nombre de usuario
    // Consulta que obtiene estudiantes del curso usando nombre_completo si existe
    // Incluye tipo_documento y numero_documento para mostrar en la tabla
    $sql = "SELECT u.id_usuario,
                   COALESCE(e.nombre_completo, u.nombre_usuario) AS nombre_usuario,
                   e.id_estudiante,
                   e.tipo_documento,
                   e.numero_documento
            FROM estudiante_curso ec
            INNER JOIN estudiantes e ON ec.id_estudiante = e.id_estudiante
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE ec.id_curso = $id_curso
            ORDER BY COALESCE(e.nombre_completo, u.nombre_usuario) ASC";
    
    // Ejecutamos la consulta SQL en la base de datos
    $resultado = mysqli_query($conexion, $sql);

    // Inicializamos un array vacío donde almacenaremos los estudiantes
    $estudiantes = [];
    
    // Verificamos que la consulta se haya ejecutado correctamente
    if ($resultado) {
        // Recorremos cada fila del resultado de la consulta
        while ($fila = mysqli_fetch_assoc($resultado)) {
            // Convertimos los valores a los tipos correctos y los agregamos al array
            // (int): Convierte a entero para asegurar que sean números
            $estudiantes[] = [
                'id_usuario' => (int)$fila['id_usuario'],      // ID del usuario en la tabla usuarios
                'id_estudiante' => (int)$fila['id_estudiante'], // ID del estudiante en la tabla estudiantes
                'nombre' => $fila['nombre_usuario'],            // Nombre completo del estudiante
                'tipo_documento' => $fila['tipo_documento'] ?? '—',  // Tipo de documento
                'numero_documento' => $fila['numero_documento'] ?? '—' // Número de documento
            ];
        }
    }

    // Convertimos el array PHP a formato JSON y lo enviamos como respuesta
    // JSON_UNESCAPED_UNICODE: Permite que caracteres especiales se muestren correctamente
    echo json_encode($estudiantes, JSON_UNESCAPED_UNICODE);
    
    // Cerramos la conexión con la base de datos para liberar recursos
    mysqli_close($conexion);
    
    // Terminamos la ejecución del script
    exit;
}

// ---------------------------------------------------------------
// 9. LISTAR TODOS LOS ESTUDIANTES (PETICIÓN GET)
// DESCRIPCIÓN:
//   Endpoint que devuelve todos los estudiantes disponibles
//   para matricular en cursos.
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['accion']) && $_GET['accion'] === "listar_estudiantes") {
    header('Content-Type: application/json; charset=utf-8');
    
    // Obtener el ID del curso si se proporciona para filtrar estudiantes ya matriculados
    $curso_id = intval($_GET['curso_id'] ?? 0);
    
    // Consulta que obtiene estudiantes usando nombre_completo si existe, sino nombre_usuario
    // Incluye tipo_documento y numero_documento para mostrar en la tabla de matrícula
    // EXCLUYE estudiantes que ya están inscritos en CUALQUIER curso (un estudiante solo puede estar en un curso)
    $sql = "SELECT e.id_estudiante, 
                   COALESCE(e.nombre_completo, u.nombre_usuario) AS nombre_completo, 
                   u.correo, 
                   e.tipo_documento,
                   e.numero_documento
            FROM estudiantes e
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE u.id_rol = 3
            AND e.id_estudiante NOT IN (
                SELECT ec.id_estudiante 
                FROM estudiante_curso ec
            )";
    
    $sql .= " ORDER BY COALESCE(e.nombre_completo, u.nombre_usuario) ASC";
    
    $resultado = mysqli_query($conexion, $sql);
    $estudiantes = [];
    
    if (!$resultado) {
        // Si hay error en la consulta, devolver mensaje de error
        echo json_encode([
            'success' => false,
            'message' => 'Error en la consulta: ' . mysqli_error($conexion),
            'estudiantes' => []
        ], JSON_UNESCAPED_UNICODE);
        mysqli_close($conexion);
        exit;
    }
    
    // Si la consulta fue exitosa, procesar los resultados
    while ($fila = mysqli_fetch_assoc($resultado)) {
        $estudiantes[] = [
            'id_estudiante' => (int)$fila['id_estudiante'],
            'nombre_completo' => $fila['nombre_completo'] ?? '',
            'nombre' => $fila['nombre_completo'] ?? '', // Mantener compatibilidad
            'correo' => $fila['correo'] ?? '',
            'tipo_documento' => $fila['tipo_documento'] ?? '',
            'numero_documento' => $fila['numero_documento'] ?? ''
        ];
    }
    
    // Devolver los estudiantes (puede ser un array vacío si no hay estudiantes)
    echo json_encode([
        'success' => true,
        'estudiantes' => $estudiantes
    ], JSON_UNESCAPED_UNICODE);
    
    mysqli_close($conexion);
    exit;
}

// ---------------------------------------------------------------
// NOTA: El endpoint de matricular_estudiantes ahora está dentro del
//       bloque POST principal (sección 4.6) para asegurar que se
//       procese correctamente. Este bloque duplicado ha sido eliminado.
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// 11. LISTAR HORARIOS DE DOCENTES (PETICIÓN GET)
// DESCRIPCIÓN:
//   Endpoint que devuelve los horarios de los docentes.
//   Puede filtrar por docente específico si se proporciona docente_id.
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['accion']) && $_GET['accion'] === "horarios_docentes") {
    header('Content-Type: application/json; charset=utf-8');
    
    $docente_id = intval($_GET['docente_id'] ?? 0);
    
    // Consulta que obtiene horarios usando nombre_completo del docente si existe
    $sql = "SELECT h.id_horario, h.dia_semana, h.hora_inicio, h.hora_fin, 
                   h.salon, c.nombre_curso, 
                   COALESCE(d.nombre_completo, u.nombre_usuario) AS nombre_docente
            FROM horarios h
            INNER JOIN cursos c ON h.curso_id = c.id_curso
            INNER JOIN docentes d ON h.docente_id = d.id_docente
            INNER JOIN usuarios u ON d.id_usuario = u.id_usuario";
    
    if ($docente_id > 0) {
        $sql .= " WHERE h.docente_id = $docente_id";
    }
    
    $sql .= " ORDER BY h.dia_semana, h.hora_inicio";
    
    $resultado = mysqli_query($conexion, $sql);
    $horarios = [];
    
    if ($resultado) {
        while ($fila = mysqli_fetch_assoc($resultado)) {
            $horarios[] = [
                'id_horario' => (int)$fila['id_horario'],
                'dia_semana' => (int)$fila['dia_semana'],
                'hora_inicio' => $fila['hora_inicio'],
                'hora_fin' => $fila['hora_fin'],
                'salon' => $fila['salon'] ?? '—',
                'nombre_curso' => $fila['nombre_curso'],
                'nombre_docente' => $fila['nombre_docente']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'horarios' => $horarios
    ], JSON_UNESCAPED_UNICODE);
    
    mysqli_close($conexion);
    exit;
}

// ---------------------------------------------------------------
// 11.2 LISTAR HORARIOS POR CURSO (PETICIÓN GET)
// DESCRIPCIÓN:
//   Endpoint que devuelve los horarios de un curso específico.
//   Muestra: Materia, Profesor, Día, Hora inicio, Hora fin.
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['accion']) && $_GET['accion'] === "horarios_curso") {
    header('Content-Type: application/json; charset=utf-8');
    
    $curso_id = intval($_GET['curso_id'] ?? 0);
    
    if (!$curso_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Debe proporcionar un ID de curso',
            'horarios' => []
        ], JSON_UNESCAPED_UNICODE);
        mysqli_close($conexion);
        exit;
    }
    
    // Consulta que obtiene horarios de un curso con información de materia y profesor
    // La materia está en la tabla docentes (campo materia que referencia a materias.id_materia)
    $sql = "SELECT h.id_horario, h.dia_semana, h.hora_inicio, h.hora_fin,
                   COALESCE(d.nombre_completo, u.nombre_usuario) AS nombre_docente,
                   m.nombre_materia
            FROM horarios h
            INNER JOIN docentes d ON h.docente_id = d.id_docente
            INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
            LEFT JOIN materias m ON d.materia = m.id_materia
            WHERE h.curso_id = $curso_id
            ORDER BY h.dia_semana, h.hora_inicio";
    
    $resultado = mysqli_query($conexion, $sql);
    $horarios = [];
    
    if ($resultado) {
        while ($fila = mysqli_fetch_assoc($resultado)) {
            $horarios[] = [
                'id_horario' => (int)$fila['id_horario'],
                'dia_semana' => (int)$fila['dia_semana'],
                'hora_inicio' => $fila['hora_inicio'],
                'hora_fin' => $fila['hora_fin'],
                'nombre_docente' => $fila['nombre_docente'] ?? '—',
                'nombre_materia' => $fila['nombre_materia'] ?? '—'
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'horarios' => $horarios
    ], JSON_UNESCAPED_UNICODE);
    
    mysqli_close($conexion);
    exit;
}

// ---------------------------------------------------------------
// 12. LISTAR DOCENTES (PETICIÓN GET)
// DESCRIPCIÓN:
//   Endpoint que devuelve la lista de todos los docentes
//   para usar en filtros.
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET['accion']) && $_GET['accion'] === "listar_docentes") {
    header('Content-Type: application/json; charset=utf-8');
    
    // Consulta que obtiene docentes usando nombre_completo si existe, sino nombre_usuario
    $sql = "SELECT d.id_docente, 
                   COALESCE(d.nombre_completo, u.nombre_usuario) AS nombre
            FROM docentes d
            INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
            ORDER BY COALESCE(d.nombre_completo, u.nombre_usuario) ASC";
    
    $resultado = mysqli_query($conexion, $sql);
    $docentes = [];
    
    if ($resultado) {
        while ($fila = mysqli_fetch_assoc($resultado)) {
            $docentes[] = [
                'id_docente' => (int)$fila['id_docente'],
                'nombre' => $fila['nombre']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'docentes' => $docentes
    ], JSON_UNESCAPED_UNICODE);
    
    mysqli_close($conexion);
    exit;
}

// ---------------------------------------------------------------
// 13. GESTIÓN DE COMUNICADOS (LISTAR Y CREAR)
// DESCRIPCIÓN:
//   Endpoints para listar y crear comunicados.
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

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['accion']) && $_POST['accion'] === "crear_comunicado") {
    header('Content-Type: application/json; charset=utf-8');
    
    $id_usuario = $_SESSION['id_usuario'] ?? null;
    $autor_tipo = $_SESSION['id_rol'] == 1 ? 'Administrador' : 'Docente';
    $titulo = mysqli_real_escape_string($conexion, $_POST['titulo'] ?? '');
    $contenido = mysqli_real_escape_string($conexion, $_POST['contenido'] ?? '');
    
    if (!$id_usuario || empty($titulo) || empty($contenido)) {
        echo json_encode([
            'success' => false,
            'message' => 'Todos los campos son obligatorios'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
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

// ---------------------------------------------------------------
// 14. VINCULAR DOCENTE A CURSO (PETICIÓN POST)
// DESCRIPCIÓN:
//   Endpoint que vincula un docente a un curso específico.
//   Permite asignar docentes a cursos para que puedan gestionar
//   las notas y actividades de ese curso.
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['accion']) && $_POST['accion'] === "vincular_docente_curso") {
    header('Content-Type: application/json; charset=utf-8');
    
    $docente_id = intval($_POST['docente_id'] ?? 0);
    $curso_id = intval($_POST['curso_id'] ?? 0);
    $materia_id = intval($_POST['materia_id'] ?? 0);
    
    if (!$docente_id || !$curso_id) {
        echo json_encode([
            'success' => false,
            'message' => 'Debe seleccionar un docente y un curso'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
    // Verificar si ya está vinculado
    $sql_check = "SELECT id_docente_curso FROM docente_curso 
                  WHERE docente_id = $docente_id AND curso_id = $curso_id";
    $resultado_check = mysqli_query($conexion, $sql_check);
    
    if ($resultado_check && mysqli_num_rows($resultado_check) > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'El docente ya está vinculado a este curso'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
    // Vincular el docente al curso
    $materia_sql = $materia_id > 0 ? $materia_id : 'NULL';
    // --------------------------------------------------------
    // MODIFICACIÓN EN BASE DE DATOS: VINCULAR DOCENTE A CURSO
    // MÉTODO: SQL INSERT mediante mysqli_query()
    // DESCRIPCIÓN: Inserta la relación docente-curso-materia en la tabla 'docente_curso'
    // --------------------------------------------------------
    $sql = "INSERT INTO docente_curso (docente_id, curso_id, materia_id) 
            VALUES ($docente_id, $curso_id, $materia_sql)";

    // Ejecutar consulta SQL INSERT
    if (mysqli_query($conexion, $sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'Docente vinculado al curso correctamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al vincular el docente: ' . mysqli_error($conexion)
        ]);
    }
    
    mysqli_close($conexion);
    exit;
}

// ---------------------------------------------------------------
// 15. GESTIÓN DE HORARIOS (CREAR HORARIO)
// DESCRIPCIÓN:
//   Endpoint para crear horarios de docentes.
// ---------------------------------------------------------------
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['accion']) && $_POST['accion'] === "crear_horario") {
    header('Content-Type: application/json; charset=utf-8');
    
    $docente_id = intval($_POST['docente_id'] ?? 0);
    $curso_id = intval($_POST['curso_id'] ?? 0);
    $dia_semana = intval($_POST['dia_semana'] ?? 0);
    $hora_inicio = mysqli_real_escape_string($conexion, $_POST['hora_inicio'] ?? '');
    $hora_fin = mysqli_real_escape_string($conexion, $_POST['hora_fin'] ?? '');
    $salon = mysqli_real_escape_string($conexion, $_POST['salon'] ?? '');
    
    // Validación de campos obligatorios
    if (!$docente_id || !$curso_id || !$dia_semana || !$hora_inicio || !$hora_fin) {
        echo json_encode([
            'success' => false,
            'message' => 'Todos los campos obligatorios deben ser completados'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
    // Validación del día de la semana
    if ($dia_semana < 1 || $dia_semana > 7) {
        echo json_encode([
            'success' => false,
            'message' => 'El día de la semana debe estar entre 1 y 7'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
    // Validar formato de hora (debe ser HH:MM:SS o HH:MM)
    if (!preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9](:00)?$/', $hora_inicio) || 
        !preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9](:00)?$/', $hora_fin)) {
        echo json_encode([
            'success' => false,
            'message' => 'El formato de hora no es válido (debe ser HH:MM)'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
    // Asegurar formato HH:MM:SS para la base de datos
    if (strlen($hora_inicio) == 5) {
        $hora_inicio .= ':00';
    }
    if (strlen($hora_fin) == 5) {
        $hora_fin .= ':00';
    }
    
    // Validar que la hora de inicio sea menor que la hora de fin
    if (strtotime($hora_inicio) >= strtotime($hora_fin)) {
        echo json_encode([
            'success' => false,
            'message' => 'La hora de inicio debe ser menor que la hora de fin'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
    // Validar superposición de horarios para el mismo docente en el mismo día
    $sql_check_docente = "SELECT id_horario FROM horarios 
                   WHERE docente_id = $docente_id 
                   AND dia_semana = $dia_semana
                   AND (
                       (hora_inicio <= '$hora_inicio' AND hora_fin > '$hora_inicio') OR
                       (hora_inicio < '$hora_fin' AND hora_fin >= '$hora_fin') OR
                       (hora_inicio >= '$hora_inicio' AND hora_fin <= '$hora_fin')
                   )";
    
    $resultado_check_docente = mysqli_query($conexion, $sql_check_docente);
    
    if ($resultado_check_docente && mysqli_num_rows($resultado_check_docente) > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'El docente ya tiene un horario asignado en este día que se superpone con el horario seleccionado'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
    // Validar que el curso no tenga dos clases en las mismas horas del mismo día
    // Un curso solo puede tener una clase a la vez, no puede tener dos clases simultáneas
    $sql_check_curso = "SELECT id_horario FROM horarios 
                       WHERE curso_id = $curso_id 
                       AND dia_semana = $dia_semana
                       AND (
                           (hora_inicio <= '$hora_inicio' AND hora_fin > '$hora_inicio') OR
                           (hora_inicio < '$hora_fin' AND hora_fin >= '$hora_fin') OR
                           (hora_inicio >= '$hora_inicio' AND hora_fin <= '$hora_fin')
                       )";
    
    $resultado_check_curso = mysqli_query($conexion, $sql_check_curso);
    
    if ($resultado_check_curso && mysqli_num_rows($resultado_check_curso) > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'El curso ya tiene una clase asignada en este día y horario. Un curso no puede tener dos clases simultáneas.'
        ]);
        mysqli_close($conexion);
        exit;
    }
    
    // Verificar si el docente ya está asignado al curso en docente_curso
    $sql_check_docente_curso = "SELECT id_docente_curso FROM docente_curso 
                                WHERE docente_id = $docente_id AND curso_id = $curso_id";
    $resultado_check_dc = mysqli_query($conexion, $sql_check_docente_curso);
    
    // Si no existe la relación, crearla
    if (!$resultado_check_dc || mysqli_num_rows($resultado_check_dc) == 0) {
        // Obtener materia_id del docente si existe
        $sql_materia = "SELECT materia FROM docentes WHERE id_docente = $docente_id";
        $resultado_materia = mysqli_query($conexion, $sql_materia);
        $materia_id = 'NULL';
        if ($resultado_materia && mysqli_num_rows($resultado_materia) > 0) {
            $fila_materia = mysqli_fetch_assoc($resultado_materia);
            if (!empty($fila_materia['materia'])) {
                $materia_id = intval($fila_materia['materia']);
            }
        }
        
        // --------------------------------------------------------
        // MODIFICACIÓN EN BASE DE DATOS: CREAR HORARIO
        // MÉTODO: SQL INSERT mediante mysqli_query()
        // DESCRIPCIÓN: Inserta un nuevo horario en la tabla 'horarios'
        // --------------------------------------------------------
        $sql_insert_dc = "INSERT INTO docente_curso (docente_id, curso_id, materia_id) 
                          VALUES ($docente_id, $curso_id, $materia_id)";

        // Ejecutar consulta SQL INSERT
        if (!mysqli_query($conexion, $sql_insert_dc)) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al asignar el docente al curso: ' . mysqli_error($conexion)
            ]);
            mysqli_close($conexion);
            exit;
        }
    }
    
    // Insertar el nuevo horario
    // --------------------------------------------------------
    // MODIFICACIÓN EN BASE DE DATOS: CREAR HORARIO
    // MÉTODO: SQL INSERT mediante mysqli_query()
    // DESCRIPCIÓN: Inserta un nuevo horario de clase en la tabla 'horarios'
    // --------------------------------------------------------
    $sql = "INSERT INTO horarios (docente_id, curso_id, dia_semana, hora_inicio, hora_fin, salon) 
            VALUES ($docente_id, $curso_id, $dia_semana, '$hora_inicio', '$hora_fin', '$salon')";

    // Ejecutar consulta SQL INSERT
    if (mysqli_query($conexion, $sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'Horario creado correctamente y docente asignado al curso'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear el horario: ' . mysqli_error($conexion)
        ]);
    }
    
    mysqli_close($conexion);
    exit;
}

// ------------------------------------------------
// 15. Cerrar la conexión si no hay envío de datos
// ------------------------------------------------
mysqli_close($conexion); 
?>
