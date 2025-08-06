# Configuración de Variables de Entorno - Frontend

## 📋 Variables Requeridas

El frontend necesita las siguientes variables de entorno para funcionar correctamente:

### 1. `VITE_API_URL`

- **Descripción**: URL base de la API del backend
- **Valor por defecto**: `http://localhost:3000/api`
- **Ejemplo desarrollo**: `http://localhost:3000/api`
- **Ejemplo producción**: `https://api.tudominio.com/api`

### 2. `VITE_GOOGLE_CLIENT_ID`

- **Descripción**: ID de cliente de Google OAuth para autenticación
- **Valor por defecto**: `''` (string vacío)
- **Cómo obtenerlo**:
  1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  2. Crea un proyecto o selecciona uno existente
  3. Habilita la API de Google+
  4. Crea credenciales OAuth 2.0
  5. Copia el Client ID

## 🚀 Configuración Rápida

1. **Copia el archivo de ejemplo**:

   ```bash
   cp env.example .env
   ```

2. **Edita el archivo `.env`** con tus valores:

   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_GOOGLE_CLIENT_ID=tu-google-client-id-aqui
   ```

3. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
