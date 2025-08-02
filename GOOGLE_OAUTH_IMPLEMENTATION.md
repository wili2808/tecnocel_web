# Implementación de Autenticación con Google OAuth

## 📋 Resumen de la Implementación

Se ha implementado la autenticación con Google OAuth en el proyecto Tecnocel Web, permitiendo a los usuarios iniciar sesión y registrarse usando sus cuentas de Google.

## 🔧 Cambios Realizados

### Backend

1. **Dependencias agregadas:**

   - `google-auth-library`
   - `passport`
   - `passport-google-oauth20`
   - `@types/passport`
   - `@types/passport-google-oauth20`

2. **Archivos modificados/creados:**
   - `backend/src/models/Cliente.ts` - Agregado campo `google_id`
   - `backend/src/controllers/GoogleAuthController.ts` - Nuevo controlador
   - `backend/src/routes/clienteRoutes.ts` - Nueva ruta `/google-login`

### Frontend

1. **Dependencias agregadas:**

   - `@react-oauth/google`
   - `google-auth-library`

2. **Archivos modificados:**
   - `frontend/src/App.tsx` - Agregado `GoogleOAuthProvider`
   - `frontend/src/contexts/AuthContext.tsx` - Implementado `googleLogin`

## 🚀 Configuración Requerida

### 1. Google Cloud Console

1. **Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)**
2. **Habilitar Google+ API:**
   - APIs & Services > Library
   - Buscar "Google+ API" y habilitar
3. **Crear credenciales OAuth 2.0:**
   - APIs & Services > Credentials
   - Create Credentials > OAuth 2.0 Client IDs
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:5173` (desarrollo)
     - `https://tu-dominio.com` (producción)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback` (desarrollo)
     - `https://tu-dominio.com/auth/google/callback` (producción)

### 2. Variables de Entorno

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu_google_client_id_aqui
```

#### Backend (.env)

```env
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
FRONTEND_URL=http://localhost:5173
```

### 3. Base de Datos

Ejecutar el script de migración:

```sql
-- Ejecutar en MySQL
USE tecnocel_db_v2;
ALTER TABLE tb_clientes
ADD COLUMN google_id VARCHAR(255) NULL,
ADD UNIQUE INDEX idx_google_id (google_id);
```

## 🔄 Flujo de Autenticación

1. **Usuario hace clic en "Continuar con Google"**
2. **Google OAuth abre ventana de autenticación**
3. **Usuario autoriza la aplicación**
4. **Google devuelve access_token al frontend**
5. **Frontend envía token al backend (`/clientes/google-login`)**
6. **Backend usa access_token para obtener información del usuario**
7. **Backend busca/crea usuario en base de datos**
8. **Backend genera JWT y lo devuelve**
9. **Frontend almacena JWT y actualiza estado de autenticación**

## 🛡️ Seguridad

- ✅ **Validación de tokens en backend**
- ✅ **Verificación con Google API**
- ✅ **JWT para sesiones**
- ✅ **Manejo seguro de errores**
- ✅ **Logging de eventos de autenticación**

## 💰 Costos

- **Gratis hasta 100,000 solicitudes/mes**
- **$0.50 por cada 1,000 solicitudes adicionales**
- **Para uso normal, completamente gratuito**

## 🧪 Testing

### Probar la implementación:

1. **Configurar variables de entorno**
2. **Ejecutar migración de base de datos**
3. **Iniciar backend:** `npm run dev`
4. **Iniciar frontend:** `npm run dev`
5. **Ir a `/login` o `/register`**
6. **Hacer clic en "Continuar con Google"**

## 🔧 Troubleshooting

### Error: "Wrong number of segments in token"

**Problema:** El error indica que se está intentando verificar un access token como si fuera un ID token.

**Solución:** La implementación actualizada usa el access token correctamente para obtener información del usuario desde la API de Google.

### Error: "Google OAuth Client ID not configured"

- Verificar que `VITE_GOOGLE_CLIENT_ID` esté configurado
- Verificar que el Client ID sea válido en Google Cloud Console

### Error: "Token inválido"

- Verificar que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` coincidan
- Verificar que las URLs autorizadas incluyan tu dominio

### Error: "Campo google_id no existe"

- Ejecutar el script de migración de base de datos
- Verificar que la tabla `tb_clientes` tenga la columna `google_id`

## 📝 Notas Importantes

- Los usuarios creados con Google tienen `email_verified: true`
- Los campos `nit_ci_cliente` y `celular_cliente` se llenan con valores temporales
- El sistema permite vincular cuentas existentes con Google ID
- La autenticación es compatible con el sistema JWT existente
- **IMPORTANTE:** Se usa el access token para obtener información del usuario, no el ID token

## 🔄 Diferencias entre Access Token e ID Token

### Access Token

- Se usa para acceder a APIs de Google
- Se envía en el header `Authorization: Bearer <token>`
- Se usa para obtener información del usuario desde `/oauth2/v2/userinfo`

### ID Token

- Contiene información del usuario codificada
- Se verifica localmente con la clave pública de Google
- No se usa en esta implementación

## 🚀 Próximos Pasos

1. **Configurar variables de entorno en producción**
2. **Actualizar URLs autorizadas en Google Cloud Console**
3. **Probar en entorno de desarrollo**
4. **Desplegar a producción**
5. **Monitorear logs de autenticación**
