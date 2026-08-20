[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Clientes / Autenticación API

**Base Path**: `/api/clientes`

Gestión de autenticación y cuentas de clientes.

---

## Índice

- [Clientes / Autenticación API](#clientes--autenticación-api)
  - [Índice](#índice)
  - [POST /clientes/register](#post-clientesregister)
  - [POST /clientes/login](#post-clienteslogin)
  - [POST /clientes/google-login](#post-clientesgoogle-login)
  - [GET /clientes/verify-token](#get-clientesverify-token)
  - [GET /clientes/perfil](#get-clientesperfil)
  - [PUT /clientes/perfil](#put-clientesperfil)
  - [PUT /clientes/cambiar-contrasena](#put-clientescambiar-contrasena)
  - [GET /clientes/verify-email](#get-clientesverify-email)
  - [POST /clientes/forgot-password](#post-clientesforgot-password)
  - [POST /clientes/reset-password](#post-clientesreset-password)
  - [Notas Técnicas](#notas-técnicas)
    - [JWT Tokens](#jwt-tokens)
    - [Seguridad de Contraseñas](#seguridad-de-contraseñas)
    - [Verificación de Email](#verificación-de-email)
    - [Reset de Contraseña](#reset-de-contraseña)
    - [Estados de Cliente](#estados-de-cliente)
    - [Google OAuth 2.0](#google-oauth-20)
  - [Ver También](#ver-también)

 = Requiere autenticación

---

## POST /clientes/register

Registrar un nuevo cliente con login automático.

**Autenticación**: No requerida

**Body**:
```json
{
  "nombre_cliente": "Juan",
  "apellido_cliente": "Pérez",
  "email_cliente": "juan.perez@example.com",
  "celular_cliente": "70123456",
  "nit_ci_cliente": "1234567",
  "contrasena": "MiPassword123!"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre_cliente` | string | Sí | Nombre del cliente |
| `apellido_cliente` | string | Sí | Apellido del cliente |
| `email_cliente` | string | Sí | Email único (se valida duplicados) |
| `celular_cliente` | string | Sí | Número de celular |
| `nit_ci_cliente` | string | Sí | NIT o CI del cliente |
| `contrasena` | string | Sí | Contraseña (min 8 caracteres) |

**Response 201**:
```json
{
  "mensaje": "Registro exitoso. ¡Bienvenido a TecnoCell!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cliente": {
    "id_cliente": 15,
    "nombre_cliente": "Juan",
    "apellido_cliente": "Pérez",
    "email_cliente": "juan.perez@example.com",
    "celular_cliente": "70123456",
    "nit_ci_cliente": "1234567"
  }
}
```

**Comportamiento**:
- El email se marca como verificado automáticamente
- Se genera un JWT inmediatamente para login automático
- Token válido por 7 días
- Se actualiza `last_login` al registrar

**Errores**:
- `400`: Campos obligatorios faltantes
- `409`: El correo ya está registrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/clientes/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_cliente": "Juan",
    "apellido_cliente": "Pérez",
    "email_cliente": "juan.perez@example.com",
    "celular_cliente": "70123456",
    "nit_ci_cliente": "1234567",
    "contrasena": "MiPassword123!"
  }'
```

---

## POST /clientes/login

Iniciar sesión con email y contraseña.

**Autenticación**: No requerida

**Body**:
```json
{
  "email_cliente": "juan.perez@example.com",
  "contrasena": "MiPassword123!"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email_cliente` | string | Sí | Email del cliente |
| `contrasena` | string | Sí | Contraseña del cliente |

**Response 200**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cliente": {
    "id_cliente": 15,
    "nombre_cliente": "Juan",
    "apellido_cliente": "Pérez",
    "email_cliente": "juan.perez@example.com"
  }
}
```

**Comportamiento**:
- Valida email y contraseña
- Solo permite login a clientes con `is_web_enabled = true`
- Genera JWT válido por 7 días
- Actualiza `last_login`

**Errores**:
- `400`: Email o contraseña faltantes
- `401`: Contraseña incorrecta
- `403`: Contraseña no establecida (usuarios de Google sin contraseña)
- `404`: Cliente no encontrado o no habilitado para web
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/clientes/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email_cliente": "juan.perez@example.com",
    "contrasena": "MiPassword123!"
  }'
```

---

## POST /clientes/google-login

Iniciar sesión con cuenta de Google OAuth 2.0.

**Autenticación**: No requerida

**Body**:
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImRhM...",
  "clientId": "123456789-abc.apps.googleusercontent.com"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `credential` | string | Sí | Token JWT de Google |
| `clientId` | string | Sí | Client ID de Google OAuth |

**Response 200**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cliente": {
    "id_cliente": 16,
    "nombre_cliente": "María",
    "apellido_cliente": "García",
    "email_cliente": "maria.garcia@gmail.com"
  }
}
```

**Comportamiento**:
- Verifica el credential de Google
- Si el usuario no existe, lo crea automáticamente
- Si el usuario existe, actualiza su información
- Genera JWT válido por 7 días
- No requiere verificación de email (Google ya lo verificó)

**Errores**:
- `400`: Credential o clientId faltantes
- `401`: Token de Google inválido
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/clientes/google-login" \
  -H "Content-Type: application/json" \
  -d '{
    "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImRhM...",
    "clientId": "123456789-abc.apps.googleusercontent.com"
  }'
```

---

## GET /clientes/verify-token

Verificar si el token JWT sigue siendo válido (para mantener sesión).

**Autenticación**: Requerida (JWT Cliente)

**Response 200**:
```json
{
  "cliente": {
    "id_cliente": 15,
    "nombre_cliente": "Juan",
    "apellido_cliente": "Pérez",
    "email_cliente": "juan.perez@example.com",
    "celular_cliente": "70123456",
    "nit_ci_cliente": "1234567"
  }
}
```

**Comportamiento**:
- Valida que el token JWT sea válido
- Verifica que el cliente siga activo (`is_web_enabled = true`)
- Verifica que el email esté verificado
- Retorna datos actualizados del cliente

**Errores**:
- `401`: Token inválido o expirado
- `403`: Cliente deshabilitado o email no verificado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/clientes/verify-token" \
  -H "Authorization: Bearer {tu_token}"
```

---

## GET /clientes/perfil

Obtener perfil completo del cliente autenticado.

**Autenticación**: Requerida (JWT Cliente)

**Response 200**:
```json
{
  "id_cliente": 15,
  "nombre_cliente": "Juan",
  "apellido_cliente": "Pérez",
  "email_cliente": "juan.perez@example.com",
  "celular_cliente": "70123456",
  "nit_ci_cliente": "1234567",
  "is_google_account": false,
  "email_verified": true,
  "fyh_creacion": "2025-01-15T10:30:00.000Z",
  "last_login": "2025-10-22T14:20:00.000Z"
}
```

**Campos retornados**:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_cliente` | number | ID único del cliente |
| `nombre_cliente` | string | Nombre del cliente |
| `apellido_cliente` | string | Apellido del cliente |
| `email_cliente` | string | Email del cliente |
| `celular_cliente` | string \| null | Número de celular |
| `nit_ci_cliente` | string \| null | NIT o CI |
| `is_google_account` | boolean | Si es cuenta de Google OAuth |
| `email_verified` | boolean | Si el email está verificado |
| `fyh_creacion` | string | Fecha de creación de cuenta |
| `last_login` | string \| null | Último inicio de sesión |

**Comportamiento**:
- Retorna datos completos del perfil
- Incluye información de cuenta (tipo, fechas)
- Solo accesible por el cliente autenticado

**Errores**:
- `401`: Token inválido o expirado
- `404`: Cliente no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/clientes/perfil" \
  -H "Authorization: Bearer {tu_token}"
```

---

## PUT /clientes/perfil

Actualizar datos personales del cliente autenticado.

**Autenticación**: Requerida (JWT Cliente)

**Body**:
```json
{
  "nombre_cliente": "Juan Carlos",
  "apellido_cliente": "Pérez López",
  "celular_cliente": "70987654",
  "nit_ci_cliente": "7654321"
}
```

**Campos actualizables**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre_cliente` | string | Sí | Nombre del cliente (2-50 caracteres) |
| `apellido_cliente` | string | Sí | Apellido del cliente (2-50 caracteres) |
| `celular_cliente` | string | No | Celular (8-15 dígitos numéricos) |
| `nit_ci_cliente` | string | No | NIT o CI (5-20 caracteres) |

**Response 200**:
```json
{
  "mensaje": "Perfil actualizado correctamente",
  "cliente": {
    "id_cliente": 15,
    "nombre_cliente": "Juan Carlos",
    "apellido_cliente": "Pérez López",
    "email_cliente": "juan.perez@example.com",
    "celular_cliente": "70987654",
    "nit_ci_cliente": "7654321"
  }
}
```

**Comportamiento**:
- Solo actualiza campos permitidos (no email ni contraseña)
- Valida formato de celular (solo números)
- Trim automático de espacios
- Solo el cliente autenticado puede actualizar su propio perfil

**Errores**:
- `400`: Validación fallida (campos requeridos, formato inválido)
- `401`: Token inválido o expirado
- `404`: Cliente no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/clientes/perfil" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_cliente": "Juan Carlos",
    "apellido_cliente": "Pérez López",
    "celular_cliente": "70987654",
    "nit_ci_cliente": "7654321"
  }'
```

---

## PUT /clientes/cambiar-contrasena

Cambiar contraseña del cliente autenticado (solo para cuentas normales, no Google).

**Autenticación**: Requerida (JWT Cliente)

**Body**:
```json
{
  "contrasenaActual": "MiPassword123!",
  "nuevaContrasena": "NuevaPassword456!"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `contrasenaActual` | string | Sí | Contraseña actual del cliente |
| `nuevaContrasena` | string | Sí | Nueva contraseña (min 8 caracteres) |

**Response 200**:
```json
{
  "mensaje": "Contraseña actualizada correctamente"
}
```

**Comportamiento**:
- Valida que la contraseña actual sea correcta
- Solo permite cambio en cuentas normales (no Google OAuth)
- Hashea la nueva contraseña con bcrypt
- Requiere que el cliente tenga contraseña establecida

**Errores**:
- `400`: Campos faltantes o validación fallida
- `401`: Token inválido, contraseña actual incorrecta
- `403`: No permitido para cuentas de Google OAuth o sin contraseña
- `404`: Cliente no encontrado
- `500`: Error del servidor

**Mensajes de error específicos**:
- `"No puedes cambiar la contraseña de una cuenta de Google"`: Cuenta OAuth
- `"No tienes una contraseña establecida"`: Cuenta sin contraseña
- `"La contraseña actual es incorrecta"`: Contraseña actual no coincide
- `"La nueva contraseña debe tener al menos 8 caracteres"`: Validación de longitud

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/clientes/cambiar-contrasena" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "contrasenaActual": "MiPassword123!",
    "nuevaContrasena": "NuevaPassword456!"
  }'
```

---

## GET /clientes/verify-email

Verificar email del cliente mediante token (legacy - actualmente no se usa).

**Autenticación**: No requerida

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `token` | string | Sí | Token de verificación enviado por email |

**Response 200**:
```json
{
  "mensaje": "Email verificado correctamente. Ya puedes iniciar sesión."
}
```

**Comportamiento**:
- Marca `email_verified = true`
- Habilita `is_web_enabled = true`
- Elimina el `verification_token`

**Errores**:
- `400`: Token no proporcionado o inválido
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/clientes/verify-email?token=abc-123-def-456"
```

**Nota**: Este endpoint existe por compatibilidad pero actualmente los nuevos registros se verifican automáticamente.

---

## POST /clientes/forgot-password

Solicitar restablecimiento de contraseña (envía email con token).

**Autenticación**: No requerida

**Body**:
```json
{
  "email_cliente": "juan.perez@example.com"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email_cliente` | string | Sí | Email del cliente |

**Response 200**:
```json
{
  "mensaje": "Se ha enviado un correo para restablecer la contraseña"
}
```

**Comportamiento**:
- Genera un `reset_token` UUID único
- Establece `reset_token_expires` a 1 hora desde ahora
- Envía email con enlace de restablecimiento
- El token expira después de 1 hora

**Errores**:
- `400`: Email no proporcionado
- `404`: Cliente no encontrado
- `500`: Error del servidor o al enviar email

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/clientes/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email_cliente": "juan.perez@example.com"
  }'
```

---

## POST /clientes/reset-password

Restablecer contraseña con token de recuperación.

**Autenticación**: No requerida

**Body**:
```json
{
  "reset_token": "abc-123-def-456",
  "nueva_contrasena": "NuevaPassword456!"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reset_token` | string | Sí | Token recibido por email |
| `nueva_contrasena` | string | Sí | Nueva contraseña (min 8 caracteres) |

**Response 200**:
```json
{
  "mensaje": "Contraseña restablecida correctamente. Ya puedes iniciar sesión."
}
```

**Comportamiento**:
- Valida que el token exista y no haya expirado
- Hashea la nueva contraseña con bcrypt (10 rounds)
- Elimina el `reset_token` y `reset_token_expires`
- Habilita `is_web_enabled = true`

**Errores**:
- `400`: Datos incompletos o token inválido/expirado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/clientes/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "reset_token": "abc-123-def-456",
    "nueva_contrasena": "NuevaPassword456!"
  }'
```

---

## Notas Técnicas

### JWT Tokens
- **Algoritmo**: HS256 (HMAC-SHA256)
- **Expiración**: 7 días
- **Payload**: `{ id_cliente, email }`
- **Secret**: Configurado en variable de entorno `JWT_SECRET`

### Seguridad de Contraseñas
- **Hashing**: bcrypt con 10 salt rounds
- **Validación**: Mínimo 8 caracteres (configurado en middleware)
- **Almacenamiento**: Solo se guarda el hash, nunca la contraseña en texto plano

### Verificación de Email
- **Registro actual**: Verificación automática (email_verified = true)
- **Google OAuth**: No requiere verificación adicional
- **Token de verificación**: UUID v4 (legacy, no se usa en nuevos registros)

### Reset de Contraseña
- **Token**: UUID v4 único
- **Expiración**: 1 hora
- **Formato email**: HTML con enlace al frontend
- **Una vez usado**: El token se elimina inmediatamente

### Estados de Cliente
- **is_web_enabled**: Permite login en la aplicación web
- **email_verified**: Email confirmado (requerido para ciertas operaciones)
- **last_login**: Se actualiza en cada login exitoso

### Google OAuth 2.0
- Utiliza Google Sign-In (One Tap)
- Verifica el credential JWT con la librería de Google
- Crea clientes automáticamente si no existen
- No requiere contraseña (pueden establecer una después si desean)

---

## Ver También

- [Direcciones API](./direcciones.md) - Para gestionar direcciones de envío
- [Carrito API](./carrito.md) - Para operaciones de carrito (requiere autenticación)
- [Favoritos API](./favoritos.md) - Para gestionar productos favoritos
- [Volver al índice de API](../ENDPOINTS.md)

---

**Última actualización**: 22 de Octubre, 2025

---

[Volver arriba](#tabla-de-contenidos) | [Documentación](../../../docs/README.md) | [Inicio](../../../README.md)