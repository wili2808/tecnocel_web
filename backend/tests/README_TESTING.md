# Guía de Testing de Endpoints con REST Client

## 📋 Contenido
1. [Sistema de Autenticación](#sistema-de-autenticación)
2. [Cómo Obtener el Token](#cómo-obtener-el-token)
3. [Configuración de REST Client](#configuración-de-rest-client)
4. [Tipos de Usuarios](#tipos-de-usuarios)
5. [Testing de AlmacenController](#testing-de-almacencontroller)

---

## 🔐 Sistema de Autenticación

TecnoCel Web tiene **2 sistemas de autenticación separados**:

### 1. Usuarios del Sistema (Admin/Empleados)
- **Tabla**: `tb_usuarios`
- **Modelo**: `Usuario`
- **Login**: `POST /api/usuarios/login`
- **Middleware**: `verificarToken`
- **Body de Login**:
  ```json
  {
    "email": "admin@tecnocel.com",
    "contrasena": "admin123"
  }
  ```
- **Token incluye**:
  - `id_usuario`
  - `email`
  - `id_rol` (1=Admin, 2=Empleado)
- **Uso**: Gestionar productos, ventas, inventario, administración

### 2. Clientes (Usuarios de la Tienda Web)
- **Tabla**: `tb_clientes`
- **Modelo**: `Cliente`
- **Login**: `POST /api/clientes/login`
- **Middleware**: `verificarTokenCliente`
- **Body de Login**:
  ```json
  {
    "email": "cliente@ejemplo.com",
    "password": "password123"
  }
  ```
- **Token incluye**:
  - `id_cliente`
  - `email_cliente`
  - `nombre_cliente`
- **Uso**: Carrito, compras, favoritos, perfil de cliente

---

## 🎯 ¿Qué Token Necesito?

### Para gestionar productos (AlmacenController)
✅ **Necesitas**: Token de **USUARIO** (admin/empleado)
❌ **NO funciona**: Token de cliente

**Rutas protegidas de AlmacenController** que requieren token de usuario:
```
POST   /api/almacen/productos          - Crear producto
PUT    /api/almacen/productos/:id      - Actualizar producto
PATCH  /api/almacen/productos/:id/stock - Actualizar stock
DELETE /api/almacen/productos/:id      - Eliminar producto
```

**Rutas públicas** (no requieren token):
```
GET /api/almacen/productos
GET /api/almacen/productos/:id
GET /api/almacen/productos/buscar
GET /api/almacen/productos/categoria/:id
GET /api/almacen/productos/destacados
GET /api/almacen/categorias
GET /api/almacen/diagnostico
```

---

## 🔑 Cómo Obtener el Token

### Método 1: Manual (Copiar y Pegar)

#### Paso 1: Hacer Login
Abre `backend/tests/almacen-test.http` y busca la sección "AUTENTICACIÓN - USUARIOS DEL SISTEMA" (línea 44):

```http
### Login de Usuario (Admin/Empleado)
# @name loginUsuario
POST http://localhost:3000/api/usuarios/login
Content-Type: application/json

{
  "email": "admin@tecnocel.com",
  "contrasena": "admin123"
}
```

Haz clic en **"Send Request"** que aparece encima del POST.

#### Paso 2: Copiar el Token
La respuesta se verá así:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoxLCJlbWFpbCI6ImFkbWluQHRlY25vY2VsLmNvbSIsImlkX3JvbCI6MSwiaWF0IjoxNzMwMDAwMDAwLCJleHAiOjE3MzAwODY0MDB9.abc123def456",
  "usuario": {
    "id_usuario": 1,
    "nombres": "Administrador",
    "email": "admin@tecnocel.com",
    "id_rol": 1
  }
}
```

**Copia** todo el valor de `"token"` (la cadena larga que empieza con `eyJ...`)

#### Paso 3: Pegar el Token
Ve a la línea 9 del archivo `almacen-test.http` y reemplaza:
```http
@token = YOUR_TOKEN_HERE
```

Por:
```http
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Paso 4: Usar el Token
Ahora puedes usar cualquier endpoint protegido. Ejemplo:
```http
### Crear producto
POST {{baseUrl}}/productos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "iPhone 15",
  "precio_venta": 999
}
```

---

### Método 2: Automático (Token Dinámico)

REST Client puede capturar automáticamente el token de la respuesta del login.

#### Paso 1: Comenta la línea manual (línea 9)
```http
# @token = YOUR_TOKEN_HERE
```

#### Paso 2: Descomenta la línea automática (línea 12)
```http
@token = {{loginUsuario.response.body.token}}
```

#### Paso 3: Ejecuta el Login
Ejecuta la petición de login (línea 45) **PRIMERO** antes de cualquier endpoint protegido.

#### Paso 4: Los Siguientes Requests Usarán el Token Automáticamente
Ahora todas las peticiones que usen `{{token}}` usarán el token de la respuesta del login.

**Ventaja**: No necesitas copiar y pegar manualmente
**Desventaja**: Debes ejecutar el login cada vez que abras el archivo

---

## 👥 Tipos de Usuarios y Roles

### Roles en tb_usuarios (id_rol)
| ID | Rol      | Permisos                                    |
|----|----------|---------------------------------------------|
| 1  | Admin    | Acceso total: CRUD productos, usuarios, etc |
| 2  | Empleado | Acceso limitado: Ver productos, ventas      |

### Verificar tu rol
```http
### Obtener mi información
GET http://localhost:3000/api/usuarios/me
Authorization: Bearer {{token}}
```

Respuesta:
```json
{
  "id_usuario": 1,
  "nombres": "Administrador",
  "email": "admin@tecnocel.com",
  "id_rol": 1  // <-- Tu rol
}
```

---

## 🧪 Testing de AlmacenController

### Flujo de Testing Completo

#### 1. Iniciar el servidor backend
```bash
cd backend
npm run dev
```

#### 2. Obtener token (ejecutar login)
```http
POST http://localhost:3000/api/usuarios/login
Content-Type: application/json

{
  "email": "admin@tecnocel.com",
  "contrasena": "admin123"
}
```

#### 3. Probar endpoint público (sin token)
```http
GET http://localhost:3000/api/almacen/productos
```

Debe funcionar sin autorización.

#### 4. Probar endpoint protegido (con token)
```http
POST http://localhost:3000/api/almacen/productos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "Producto de Prueba",
  "codigo": "TEST001",
  "precio_compra": 100,
  "precio_venta": 150,
  "stock": 10,
  "id_categoria": 1,
  "id_marca": 1
}
```

Si el token es válido: ✅ **200 OK** + producto creado
Si el token es inválido: ❌ **401 Unauthorized**
Si eres cliente en vez de usuario: ❌ **401 Unauthorized**

---

## 🛠️ Configuración de REST Client

### Usar Entornos (Development/Production)

Archivo: `rest-client.env.json` (raíz del proyecto)

```json
{
  "development": {
    "baseUrl": "http://localhost:3000/api",
    "almacenUrl": "http://localhost:3000/api/almacen",
    "usuarioUrl": "http://localhost:3000/api/usuarios",
    "token": "REEMPLAZA_CON_TU_TOKEN"
  },
  "production": {
    "baseUrl": "https://api.tecnocel.com/api",
    "almacenUrl": "https://api.tecnocel.com/api/almacen",
    "usuarioUrl": "https://api.tecnocel.com/api/usuarios",
    "token": "TOKEN_DE_PRODUCCION"
  }
}
```

#### Cambiar de entorno:
1. `Ctrl+Shift+P`
2. Escribe: "Rest Client: Switch Environment"
3. Selecciona: `development` o `production`

---

## 🐛 Solución de Problemas

### Error 401: Token inválido
**Causa**: Token expirado, incorrecto o no proporcionado
**Solución**: Obtén un nuevo token haciendo login nuevamente

### Error 403: Acceso no autorizado
**Causa**: Estás usando un token de cliente en vez de usuario
**Solución**: Usa el login de usuarios (`/api/usuarios/login`)

### Error 404: Usuario no encontrado
**Causa**: El usuario del token fue eliminado de la base de datos
**Solución**: Crea un nuevo usuario o usa uno existente

### El endpoint de búsqueda no funciona
**Causa**: Orden incorrecto de rutas (ya corregido)
**Solución**: Las rutas específicas deben ir antes de rutas dinámicas con `:id`

### "Token no proporcionado"
**Causa**: Falta el header Authorization
**Solución**: Verifica que tengas:
```http
Authorization: Bearer {{token}}
```

---

## 📚 Recursos Adicionales

### Documentación del Proyecto
- Endpoints completos: `docs/api/ENDPOINTS.md`
- Esquema de BD: `docs/database/SCHEMA.md`
- Guía de inicio: `docs/guides/GETTING_STARTED.md`

### Archivos de Test
- AlmacenController: `backend/tests/almacen-test.http`
- Configuración de entornos: `rest-client.env.json`

### Extensión REST Client
- [REST Client en VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- Atajos de teclado:
  - `Ctrl+Alt+R`: Enviar request
  - `Ctrl+Alt+C`: Cancelar request

---

## 💡 Tips

1. **Guarda tu token**: Los tokens expiran en 24h (cliente) o 8h (admin)
2. **Usa variables**: Facilita cambiar entre entornos
3. **Ejecuta login primero**: Siempre antes de endpoints protegidos
4. **Revisa los logs**: El backend muestra logs detallados en consola
5. **Verifica tu rol**: No todos los usuarios tienen los mismos permisos

---

## 📝 Ejemplo Completo de Flujo

```http
### 1. Login de usuario admin
# @name loginUsuario
POST http://localhost:3000/api/usuarios/login
Content-Type: application/json

{
  "email": "admin@tecnocel.com",
  "contrasena": "admin123"
}

### 2. Crear producto con el token obtenido
POST http://localhost:3000/api/almacen/productos
Authorization: Bearer {{loginUsuario.response.body.token}}
Content-Type: application/json

{
  "nombre": "Samsung Galaxy S24",
  "codigo": "SGS24",
  "descripcion": "Último modelo de Samsung",
  "precio_compra": 700,
  "precio_venta": 899,
  "stock": 15,
  "id_categoria": 1,
  "id_marca": 2
}

### 3. Verificar que se creó
GET http://localhost:3000/api/almacen/productos

### 4. Actualizar el producto creado
PUT http://localhost:3000/api/almacen/productos/1
Authorization: Bearer {{loginUsuario.response.body.token}}
Content-Type: application/json

{
  "precio_venta": 849,
  "stock": 20
}
```

---

**¿Preguntas?** Revisa la documentación completa en `docs/` o consulta el código fuente en:
- `backend/src/controllers/AlmacenController.ts`
- `backend/src/middleware/authMiddleware.ts`
- `backend/src/routes/almacenRoutes.ts`
