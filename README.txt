================================================================================
                    SISTEMA ACADÉMICO CLASSCORE
                    Manual de Instalación y Ejecución
================================================================================

📋 DESCRIPCIÓN DEL PROYECTO
--------------------------------------------------------------------------------
ClassScore es un sistema académico web desarrollado en PHP que permite gestionar
estudiantes, docentes, materias, cursos, calificaciones, horarios y comunicados.
El sistema está diseñado para funcionar en servidores que solo permiten métodos
HTTP GET y POST (como InfinityFree).

🎯 CARACTERÍSTICAS PRINCIPALES
--------------------------------------------------------------------------------
✓ Gestión de usuarios (Administradores, Docentes, Estudiantes)
✓ Gestión de cursos y materias
✓ Registro de calificaciones y actividades académicas
✓ Sistema de periodos académicos
✓ Gestión de horarios de clases
✓ Sistema de comunicados institucionales
✓ Perfiles de usuario con fotos
✓ Interfaz responsive y moderna

📦 REQUISITOS DEL SISTEMA
--------------------------------------------------------------------------------
Para ejecutar el proyecto localmente necesitas:

1. XAMPP (versión 7.4 o superior)
   - Incluye Apache (servidor web)
   - Incluye MySQL (base de datos)
   - Incluye PHP (lenguaje de programación)
   - Descarga: https://www.apachefriends.org/

2. Navegador web moderno
   - Google Chrome (recomendado)
   - Mozilla Firefox
   - Microsoft Edge
   - Safari

3. Editor de código (opcional)
   - Visual Studio Code
   - Sublime Text
   - Notepad++

🚀 INSTALACIÓN PASO A PASO
--------------------------------------------------------------------------------

PASO 1: INSTALAR XAMPP
--------------------------------------------------------------------------------
1. Descarga XAMPP desde https://www.apachefriends.org/
2. Ejecuta el instalador y sigue las instrucciones
3. Durante la instalación, selecciona:
   - Apache
   - MySQL
   - PHP
   - phpMyAdmin (opcional pero recomendado)
4. Completa la instalación

PASO 2: COPIAR EL PROYECTO
--------------------------------------------------------------------------------
1. Copia la carpeta "classScore" completa
2. Pégala en la carpeta htdocs de XAMPP:
   
   Windows:
   C:\xampp\htdocs\classScore
   
   Linux:
   /opt/lampp/htdocs/classScore
   
   macOS:
   /Applications/XAMPP/htdocs/classScore

PASO 3: INICIAR SERVICIOS DE XAMPP
--------------------------------------------------------------------------------
1. Abre el Panel de Control de XAMPP
2. Inicia Apache (clic en "Start")
3. Inicia MySQL (clic en "Start")
4. Verifica que ambos servicios estén en verde (running)

PASO 4: CREAR LA BASE DE DATOS
--------------------------------------------------------------------------------
OPCIÓN A: Usando phpMyAdmin (Recomendado)
------------------------------------------
1. Abre tu navegador y ve a: http://localhost/phpmyadmin
2. Haz clic en la pestaña "SQL"
3. Abre el archivo: Base_de_Datos/BD.txt
4. Copia TODO el contenido del archivo
5. Pégalo en el área de texto de phpMyAdmin
6. Haz clic en "Continuar" o presiona F5
7. Verifica que se haya creado la base de datos "classscore"

OPCIÓN B: Usando línea de comandos MySQL
------------------------------------------
1. Abre la terminal/consola
2. Navega a la carpeta del proyecto:
   cd C:\xampp\htdocs\classScore\Base_de_Datos
3. Ejecuta MySQL:
   mysql -u root -p < BD.txt
   (Si no tiene contraseña, presiona Enter)
4. O conecta a MySQL y ejecuta el script manualmente:
   mysql -u root -p
   source C:/xampp/htdocs/classScore/Base_de_Datos/BD.txt

PASO 5: CONFIGURAR LA CONEXIÓN A LA BASE DE DATOS
--------------------------------------------------------------------------------
1. Abre el archivo: conexion.php
2. Si usas XAMPP local, modifica las siguientes líneas:

   Para desarrollo local (XAMPP):
   ------------------------------
   $servidor = "localhost";           // o "127.0.0.1"
   $usuario = "root";                  // Usuario por defecto de XAMPP
   $clave = "";                        // Contraseña vacía por defecto en XAMPP
   $base_datos = "classscore";        // Nombre de la base de datos
   $puerto = 3306;                    // Puerto por defecto de MySQL

   Para producción (InfinityFree):
   --------------------------------
   $servidor = "sql103.infinityfree.com";
   $usuario = "if0_40385120";
   $clave = "Tl4Ho3kW0H5r";
   $base_datos = "if0_40385120_classscore";
   $puerto = 3306;

3. Guarda el archivo

PASO 6: VERIFICAR PERMISOS DE CARPETAS
--------------------------------------------------------------------------------
Asegúrate de que las siguientes carpetas tengan permisos de escritura:

- fotos_de_perfil/     (para subir fotos de perfil)
- imagenes_de_pagina/   (para imágenes del sistema)

En Windows generalmente no hay problemas, pero en Linux/macOS:
chmod 755 fotos_de_perfil
chmod 755 imagenes_de_pagina

PASO 7: ACCEDER AL SISTEMA
--------------------------------------------------------------------------------
1. Abre tu navegador web
2. Ve a la siguiente dirección:
   http://localhost/classScore/index.html
   
   O si está en una subcarpeta:
   http://localhost/classScore/

3. Deberías ver la página de inicio de sesión

🔐 CREDENCIALES INICIALES
--------------------------------------------------------------------------------
Usuario Administrador Principal:
---------------------------------
Correo: admin@classscore.com
Contraseña: 1234

NOTA: Este usuario tiene todos los permisos y puede:
- Crear nuevos usuarios (administradores, docentes, estudiantes)
- Gestionar cursos y materias
- Ver todos los usuarios del sistema
- Crear comunicados
- Gestionar horarios

⚠️ IMPORTANTE: Cambia esta contraseña después del primer acceso.

📁 ESTRUCTURA DEL PROYECTO
--------------------------------------------------------------------------------
classScore/
│
├── index.html              # Página de inicio de sesión
├── login.php               # Procesamiento del login
├── login.js                # Lógica JavaScript del login
│
├── panelAdmin.html         # Interfaz del panel de administrador
├── panel_admin.php         # Lógica PHP del panel de administrador
├── admin.js                # Lógica JavaScript del panel de administrador
│
├── panelDocente.html       # Interfaz del panel de docente
├── panel_docente.php       # Lógica PHP del panel de docente
├── docente.js              # Lógica JavaScript del panel de docente
│
├── panelEstudiante.html    # Interfaz del panel de estudiante
├── panel_estudiante.php    # Lógica PHP del panel de estudiante
├── estudiante.js          # Lógica JavaScript del panel de estudiante
│
├── conexion.php            # Configuración de conexión a la base de datos
├── classscore.css          # Estilos CSS del sistema
│
├── fotos_de_perfil/        # Carpeta para fotos de perfil de usuarios
├── imagenes_de_pagina/     # Carpeta para imágenes del sistema
│
└── Base_de_Datos/
    └── BD.txt              # Script SQL para crear la base de datos

🔧 CONFIGURACIÓN ADICIONAL
--------------------------------------------------------------------------------

CONFIGURAR PHP (si es necesario)
---------------------------------
Si encuentras errores relacionados con:
- Subida de archivos
- Tamaño de archivos
- Tiempo de ejecución

Edita el archivo: C:\xampp\php\php.ini

Busca y modifica estas líneas:
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
memory_limit = 256M

Luego reinicia Apache en XAMPP.

CONFIGURAR MYSQL (si es necesario)
-----------------------------------
Si MySQL no inicia:
1. Verifica que el puerto 3306 no esté en uso
2. Revisa los logs de error en XAMPP
3. Reinstala XAMPP si es necesario

🌐 DESPLIEGUE EN PRODUCCIÓN (InfinityFree)
--------------------------------------------------------------------------------
Si deseas subir el proyecto a InfinityFree:

1. Crea una cuenta en https://infinityfree.net
2. Crea una base de datos MySQL en el panel de control
3. Importa el script BD.txt en la base de datos
4. Modifica conexion.php con los datos de InfinityFree
5. Sube todos los archivos vía FTP al directorio public_html
6. Asegúrate de que las carpetas tengan permisos 755
7. Accede a tu dominio: http://tudominio.xo.je

NOTA: InfinityFree bloquea métodos HTTP como DELETE, PUT, PATCH.
El sistema está configurado para usar solo GET y POST.

🐛 SOLUCIÓN DE PROBLEMAS COMUNES
--------------------------------------------------------------------------------

PROBLEMA: "Error de conexión a la base de datos"
SOLUCIÓN:
- Verifica que MySQL esté iniciado en XAMPP
- Revisa los datos en conexion.php
- Asegúrate de que la base de datos "classscore" exista

PROBLEMA: "Página en blanco"
SOLUCIÓN:
- Revisa los logs de error de Apache (XAMPP)
- Verifica que PHP esté habilitado
- Revisa la consola del navegador (F12)

PROBLEMA: "No se pueden subir fotos de perfil"
SOLUCIÓN:
- Verifica permisos de la carpeta fotos_de_perfil
- Revisa configuración de upload_max_filesize en php.ini
- Asegúrate de que la carpeta exista

PROBLEMA: "Error 404 - Página no encontrada"
SOLUCIÓN:
- Verifica que Apache esté iniciado
- Revisa la ruta en el navegador
- Asegúrate de que los archivos estén en htdocs/classScore

PROBLEMA: "Error al iniciar sesión"
SOLUCIÓN:
- Verifica las credenciales (admin@classscore.com / 1234)
- Revisa que la base de datos tenga los datos iniciales
- Verifica la conexión a la base de datos

📝 NOTAS IMPORTANTES
--------------------------------------------------------------------------------
1. El sistema usa solo métodos HTTP GET y POST (no DELETE, PUT, PATCH)
2. Las contraseñas se almacenan con MD5 (considera actualizar a bcrypt)
3. El usuario administrador principal (id_usuario = 1) no puede eliminarse
4. Los estudiantes solo pueden estar inscritos en un curso a la vez
5. El sistema está optimizado para hosting gratuito como InfinityFree

🔒 SEGURIDAD
--------------------------------------------------------------------------------
RECOMENDACIONES:
- Cambia la contraseña del administrador después de la instalación
- No expongas el archivo conexion.php públicamente
- Usa HTTPS en producción
- Realiza backups regulares de la base de datos
- Actualiza las contraseñas periódicamente

📞 SOPORTE
--------------------------------------------------------------------------------
Si encuentras problemas:
1. Revisa los logs de error de Apache y MySQL
2. Verifica la consola del navegador (F12)
3. Revisa que todos los archivos estén en su lugar
4. Asegúrate de que la base de datos esté correctamente creada

================================================================================
                    ¡Sistema listo para usar!
================================================================================

Versión: 1.0
Última actualización: 2025

