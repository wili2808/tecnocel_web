**[Documentación](../../README.md)** | **[Inicio](../../../README.md)**

---

# 🔒 Guía de Autenticación (API Backend)

> Guía práctica para integrar autenticación en la API: JWT para clientes y staff, verificación de roles y login con Google OAuth.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [JWT en la Plataforma](#jwt-en-la-plataforma)
  - [Estructura del Payload](#estructura-del-payload)
  - [Generación del Token](#generación-del-token)
  - [Headers Requeridos](#headers-requeridos)
- [Middlewares de Autenticación](#middlewares-de-autenticación)
  - [`verificarToken` (Usuarios internos)](#verificartoken-usuarios-internos)
  - [`verificarTokenCliente` (Clientes Web)](#verificartokencliente-clientes-web)
  - [`verificarRol` (Autorización por rol)](#verificarrol-autorización-por-rol)
- [Flujos de Autenticación](#flujos-de-autenticación)
  - [Registro de Cliente](#registro-de-cliente)
  - [Login de Cliente](#login-de-cliente)
  - [Verificación/Mantenimiento de Sesión](#verificaciónmantenimiento-de-sesión)
  - [Recuperación y Restablecimiento de Contraseña](#recuperación-y-restablecimiento-de-contraseña)
- [Login con Google OAuth](#login-con-google-oauth)
- [Protección de Rutas](#protección-de-rutas)
- [Variables de Entorno](#variables-de-entorno)
- [Buenas Prácticas](#buenas-prácticas)

---

## Visión General

El backend utiliza JWT para autenticar:

- **Clientes Web**: tokens generados en registro/login y verificados con `verificarTokenCliente`.
- **Usuarios internos (staff/admin)**: tokens verificados con `verificarToken` y autorización adicional por rol con `verificarRol`.
- **Google OAuth**: permite login social para clientes usando `access_token` de Google.

---

## JWT en la Plataforma

### Estructura del Payload

- Clientes: `{ id_cliente: number, email: string }`
- Usuarios internos: `{ id_usuario: number, email: string, id_rol: number }`

> Expiración por defecto: `7d`.

### Generación del Token

Ejemplo (registro/login de cliente) en `ClienteController`:

```ts
// Firma del token (exp: 7d)
const token = jwt.sign(
  { id_cliente: cliente.id_cliente, email: cliente.email_cliente },
  JWT_SECRET,
  { expiresIn: "7d" }
);
```

### Headers Requeridos

- `Authorization: Bearer <JWT>`

---

## Middlewares de Autenticación

Archivo: `backend/src/middleware/authMiddleware.ts`

### `verificarToken` (Usuarios internos)

- Lee `Authorization`.
- Verifica JWT con `JWT_SECRET`.
- Carga `req.usuario = { id_usuario, nombres, email, id_rol }`.

### `verificarTokenCliente` (Clientes Web)

- Verifica JWT y comprueba que el cliente esté habilitado y con email verificado.
- Establece `req.usuario = { id_cliente, nombre_cliente, email_cliente }`.

### `verificarRol` (Autorización por rol)

- Recibe arreglo de roles permitidos y valida contra `req.usuario.id_rol`.

---

## Flujos de Autenticación

### Registro de Cliente

Endpoint (POST): `/api/clientes/register`

```json
{
  "nombre_cliente": "Juan",
  "apellido_cliente": "Pérez",
  "email_cliente": "juan@example.com",
  "celular_cliente": "70000000",
  "nit_ci_cliente": "12345678",
  "contrasena": "MiPassword123"
}
```

Respuesta:

```json
{
  "mensaje": "Registro exitoso. ¡Bienvenido a TecnoCell!",
  "token": "<JWT>",
  "cliente": {
    "id_cliente": 1,
    "nombre_cliente": "Juan",
    "email_cliente": "juan@example.com"
  }
}
```

Curl:

```bash
curl -X POST http://localhost:3000/api/clientes/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_cliente":"Juan",
    "apellido_cliente":"Pérez",
    "email_cliente":"juan@example.com",
    "celular_cliente":"70000000",
    "nit_ci_cliente":"12345678",
    "contrasena":"MiPassword123"
  }'
```

### Login de Cliente

Endpoint (POST): `/api/clientes/login`

Body:

```json
{ "email_cliente": "juan@example.com", "contrasena": "MiPassword123" }
```

Respuesta:

```json
{
  "token": "<JWT>",
  "cliente": { "id_cliente": 1, "email_cliente": "juan@example.com" }
}
```

Curl:

```bash
curl -X POST http://localhost:3000/api/clientes/login \
  -H "Content-Type: application/json" \
  -d '{ "email_cliente":"juan@example.com", "contrasena":"MiPassword123" }'
```

### Verificación/Mantenimiento de Sesión

Endpoint (GET): `/api/clientes/verify-token`

```bash
curl http://localhost:3000/api/clientes/verify-token \
  -H "Authorization: Bearer <JWT>"
```

### Recuperación y Restablecimiento de Contraseña

- Solicitud (POST): `/api/clientes/forgot-password` con `{ "email_cliente": "..." }`
- Restablecer (POST): `/api/clientes/reset-password` con `{ "reset_token": "...", "nueva_contrasena": "..." }`

---

## Login con Google OAuth

Controlador: `GoogleAuthController.googleLogin`

- Recibe `access_token` emitido por Google en el frontend.
- Obtiene información del usuario desde `https://www.googleapis.com/oauth2/v2/userinfo`.
- Crea o vincula cliente por `google_id` o `email_cliente`.
- Genera JWT de cliente y actualiza `last_login`.

Endpoint (POST): `/api/clientes/google-login`

Body:

```json
{ "access_token": "ya29.a0Af..." }
```

Curl:

```bash
curl -X POST http://localhost:3000/api/clientes/google-login \
  -H "Content-Type: application/json" \
  -d '{ "access_token": "<ACCESS_TOKEN_DE_GOOGLE>" }'
```

---

## Protección de Rutas

Ejemplos de uso en Express:

```ts
import {
  verificarTokenCliente,
  verificarToken,
  verificarRol,
} from "../../backend/src/middleware/authMiddleware";

// Ruta de cliente autenticado
router.get("/cliente/perfil", verificarTokenCliente, handler);

// Ruta de administración (rol 1 = admin)
router.post(
  "/admin/productos",
  verificarToken,
  verificarRol([1]),
  crearProductoHandler
);
```

---

## Variables de Entorno

Configurar en `.env` del backend:

```bash
JWT_SECRET=una_clave_segura
GOOGLE_CLIENT_ID=tu_client_id_de_google
```

> En producción, usar secretos seguros y rotación periódica.

---

## Buenas Prácticas

- Usar `Authorization: Bearer <JWT>` en todas las solicitudes protegidas.
- Mantener expiración razonable (p. ej., 7 días) y refrescar durante actividad si es necesario.
- Revocar tokens al deshabilitar cuentas o detectar actividades sospechosas.
- Validar `email_verified` e `is_web_enabled` en clientes antes de dar acceso.
- Loggear intentos fallidos y exitosos con contexto (ya implementado vía `loggerService`).

---

**Última actualización**: 9 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado
**Relacionado con**:

- [API Reference](../README.md)
- [Endpoints de Clientes](../endpoints/clientes.md)
- [Servicio de Imágenes](../reference/IMAGES_SERVICE.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
