# Configuración del Backend

## Variables de Entorno

Este proyecto utiliza variables de entorno para configurar diferentes aspectos del sistema. Para configurar el proyecto:

1. Copia el archivo `env.example` a `.env`:

   ```bash
   cp env.example .env
   ```

2. Edita el archivo `.env` con tus valores específicos.

## Variables Requeridas

### Base de Datos

- `DB_NAME`: Nombre de la base de datos (default: `db_tecnocel_v3`)
- `DB_USER`: Usuario de la base de datos (default: `root`)
- `DB_PASSWORD`: Contraseña de la base de datos
- `DB_HOST`: Host de la base de datos (default: `localhost`)
- `DB_PORT`: Puerto de la base de datos (default: `3306`)

### Servidor

- `PORT`: Puerto del servidor (default: `3000`)
- `NODE_ENV`: Entorno de ejecución (default: `development`)

### JWT

- `JWT_SECRET`: Clave secreta para JWT (¡OBLIGATORIO cambiar en producción!)

### Logging

- `LOG_LEVEL`: Nivel de logging (default: `info`)
- `SEQUELIZE_DEBUG`: Habilitar debug de Sequelize (default: `false`)

### Imágenes

- `IMAGES_PATH`: Ruta para imágenes de productos
- `COMMENTS_IMAGES_PATH`: Ruta para imágenes de comentarios
- `BASE_URL`: URL base del servidor
- `DEFAULT_IMAGE`: Imagen por defecto

### Email

- `EMAIL_HOST`: Servidor SMTP
- `EMAIL_PORT`: Puerto SMTP
- `EMAIL_USER`: Usuario de email
- `EMAIL_PASS`: Contraseña de email
- `EMAIL_FROM`: Email remitente

### Frontend

- `FRONTEND_URL`: URL del frontend

### Google

- `GOOGLE_CLIENT_ID`: ID de cliente de Google OAuth

## Problemas Corregidos

### 1. Inconsistencia en nombres de base de datos

- **Antes**: `config.ts` usaba `db_tecnocel_v3`, `database.ts` usaba `tecnocel_db_v2`
- **Después**: Ambos archivos usan consistentemente `tecnocel_db_v3`

### 2. Duplicación de configuración

- **Antes**: Tanto `config.ts` como `database.ts` configuraban la base de datos
- **Después**: `database.ts` usa la configuración centralizada de `config.ts`

### 3. Configuración de imágenes inconsistente

- **Antes**: Diferentes rutas en `config.ts` y `UploadController.ts`
- **Después**: `UploadController.ts` usa la configuración centralizada

## Recomendaciones de Seguridad

1. **Nunca** uses valores por defecto en producción
2. **Cambia** `JWT_SECRET` por una clave segura y única
3. **Usa** contraseñas fuertes para la base de datos
4. **Configura** correctamente las rutas de imágenes
5. **Verifica** que las variables de email estén configuradas correctamente

## Verificación

Para verificar que la configuración es correcta:

1. Ejecuta el servidor en modo desarrollo
2. Revisa los logs para confirmar que la conexión a la base de datos es exitosa
3. Verifica que las rutas de imágenes se crean correctamente
4. Prueba la funcionalidad de subida de imágenes
