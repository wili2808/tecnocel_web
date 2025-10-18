# Guía de Autenticación y Testing de Endpoints

> Aprende cómo funcionan los endpoints públicos vs privados y cómo probarlos

---

## 📋 Índice

- [¿Cómo funciona la autenticación?](#cómo-funciona-la-autenticación)
- [Tipos de Endpoints](#tipos-de-endpoints)
- [Sistema de Middleware](#sistema-de-middleware)
- [Cómo obtener un Token JWT](#cómo-obtener-un-token-jwt)
- [Probando Endpoints Privados](#probando-endpoints-privados)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Troubleshooting](#troubleshooting)

---

## 🔐 ¿Cómo funciona la autenticación?

TecnoCel Web usa **JSON Web Tokens (JWT)** para autenticación. El flujo es:

```
1. Usuario/Cliente hace login → Envía credenciales
2. Backend valida credenciales → Genera JWT
3. Cliente guarda el token → Lo incluye en siguientes peticiones
4. Backend verifica token → Permite o deniega acceso
```

### Estructura del Token JWT

Un token JWT tiene 3 partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoxLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

- **Header** (rojo): Algoritmo y tipo
- **Payload** (verde): Datos del usuario
- **Signature** (azul): Firma de seguridad

---

## 📊 Tipos de Endpoints

### 1. Endpoints Públicos ✅ (No requieren token)

**Ejemplo: Obtener productos**
```bash
GET /api/almacen/productos
```

Estos endpoints NO necesitan autenticación porque:
- Cualquiera puede ver el catálogo
- Son operaciones de lectura seguras
- No modifican datos sensibles

### 2. Endpoints Privados 🔒 (Requieren token)

**Ejemplo: Crear producto**
```bash
POST /api/almacen/productos
```

Estos endpoints SÍ necesitan autenticación porque:
- Modifican datos importantes
- Solo personal autorizado debe acceder
- Requieren auditoría de quién hizo qué

---

## ⚙️ Sistema de Middleware

En tu proyecto, la protección se define en las **rutas**:

### Archivo: `backend/src/routes/almacenRoutes.ts`

```typescript
// 👇 Rutas PÚBLICAS (antes de verificarToken)
router.get('/productos', almacenController.getProducts);
router.get('/productos/:id', almacenController.getProductById);
router.get('/productos/destacados', almacenController.getFeaturedProducts);

// 🔒 MIDDLEWARE DE AUTENTICACIÓN - Todo lo que esté después requiere token
router.use(verificarToken);

// 👇 Rutas PRIVADAS (después de verificarToken)
router.post('/productos', almacenController.createProduct);
router.put('/productos/:id', almacenController.updateProduct);
router.delete('/productos/:id', almacenController.deleteProduct);
```

### ¿Cómo funciona `verificarToken`?

El middleware hace esto:

1. **Extrae el token** del header `Authorization`
2. **Verifica** que el token sea válido y no esté expirado
3. **Busca el usuario** en la base de datos
4. **Agrega los datos del usuario** a `req.usuario`
5. **Permite continuar** si todo está correcto
6. **Bloquea la petición** si algo falla

### Código del middleware:

```typescript
export const verificarToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extraer token del header: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    // 2. Verificar y decodificar el token
    const decodificado = jwt.verify(token, JWT_SECRET);

    // 3. Buscar usuario en la BD
    const usuario = await Usuario.findByPk(decodificado.id_usuario);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // 4. Agregar usuario al request
    req.usuario = usuario;

    // 5. Permitir continuar
    next();
  } catch (error) {
    // 6. Bloquear si hay error
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
};
```

---

## 🎫 Cómo obtener un Token JWT

Hay **2 formas** de autenticarse en tu proyecto:

### Opción 1: Login como Usuario/Admin

Para endpoints que requieren `verificarToken` (administradores):

**Endpoint:** `POST /api/usuarios/login`

```bash
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tecnocel.com",
    "contrasena": "admin123"
  }'
```

**Response:**
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoxLCJlbWFpbCI6ImFkbWluQHRlY25vY2VsLmNvbSIsImlkX3JvbCI6MSwiaWF0IjoxNzE2MjM5MDIyLCJleHAiOjE3MTY4NDM4MjJ9.abc123",
  "usuario": {
    "id_usuario": 1,
    "nombres": "Admin",
    "email": "admin@tecnocel.com",
    "id_rol": 1
  }
}
```

### Opción 2: Login como Cliente

Para endpoints que requieren `verificarTokenCliente` (clientes normales):

**Endpoint:** `POST /api/clientes/login`

```bash
curl -X POST http://localhost:3000/api/clientes/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_cliente": "cliente@example.com",
    "contrasena": "password123"
  }'
```

**O primero registrarse:**

```bash
curl -X POST http://localhost:3000/api/clientes/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_cliente": "Juan",
    "apellido_cliente": "Pérez",
    "email_cliente": "juan@example.com",
    "celular_cliente": "70123456",
    "nit_ci_cliente": "1234567",
    "contrasena": "MiPassword123"
  }'
```

**Response:**
```json
{
  "mensaje": "Registro exitoso. ¡Bienvenido a TecnoCell!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cliente": {
    "id_cliente": 5,
    "nombre_cliente": "Juan",
    "email_cliente": "juan@example.com"
  }
}
```

---

## 🧪 Probando Endpoints Privados

### Método 1: Con cURL

#### 1. Obtén el token
```bash
curl -X POST http://localhost:3000/api/clientes/login \
  -H "Content-Type: application/json" \
  -d '{"email_cliente":"cliente@example.com","contrasena":"password123"}'
```

#### 2. Copia el token del response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Usa el token en el header Authorization

```bash
curl -X POST http://localhost:3000/api/almacen/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "codigo": "PROD-999",
    "nombre": "iPhone 15 Pro",
    "descripcion": "Nuevo iPhone",
    "precio_venta": 1299.99,
    "stock": 10,
    "id_categoria": 1,
    "id_marca": 1,
    "id_usuario": 1
  }'
```

**⚠️ IMPORTANTE:** El header debe ser:
```
Authorization: Bearer TU_TOKEN_AQUI
```
Con **"Bearer "** al inicio (con espacio después).

---

### Método 2: Con Postman

#### Configuración paso a paso:

1. **Obtén el token:**
   - **Method:** POST
   - **URL:** `http://localhost:3000/api/clientes/login`
   - **Body → raw → JSON:**
     ```json
     {
       "email_cliente": "cliente@example.com",
       "contrasena": "password123"
     }
     ```
   - **Send** → Copia el token del response

2. **Usa el token:**
   - **Method:** POST
   - **URL:** `http://localhost:3000/api/almacen/productos`
   - **Headers:**
     - Key: `Authorization`
     - Value: `Bearer TU_TOKEN_COPIADO`
   - **Body → raw → JSON:**
     ```json
     {
       "codigo": "PROD-999",
       "nombre": "iPhone 15 Pro",
       "precio_venta": 1299.99,
       "stock": 10,
       "id_categoria": 1,
       "id_marca": 1,
       "id_usuario": 1
     }
     ```

#### Tip: Variables en Postman

Puedes guardar el token automáticamente:

1. En la request de login, ve a **Tests** y agrega:
```javascript
const response = pm.response.json();
pm.environment.set("auth_token", response.token);
```

2. En requests protegidos, usa:
```
Authorization: Bearer {{auth_token}}
```

---

### Método 3: Con Thunder Client (VSCode Extension)

1. **Instala Thunder Client** en VSCode
2. **Nueva Request:**
   - Method: POST
   - URL: `http://localhost:3000/api/clientes/login`
   - Body:
     ```json
     {
       "email_cliente": "cliente@example.com",
       "contrasena": "password123"
     }
     ```
3. **Guardar token:** Thunder Client puede auto-guardar el token
4. **Request protegido:**
   - Auth → Bearer Token → Pega el token

---

## 📝 Ejemplos Prácticos

### Ejemplo 1: Crear un Producto (Requiere Usuario/Admin)

```bash
# 1. Login como admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tecnocel.com","contrasena":"admin123"}' \
  | jq -r '.token')

# 2. Crear producto
curl -X POST http://localhost:3000/api/almacen/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "codigo": "IPHONE15",
    "nombre": "iPhone 15 Pro Max",
    "descripcion": "Último modelo de Apple",
    "precio_venta": 1399.99,
    "stock": 25,
    "id_categoria": 1,
    "id_marca": 1,
    "id_usuario": 1,
    "es_destacado": true,
    "imagenes": [
      {
        "url_imagen": "iphone15.jpg",
        "alt_text": "iPhone 15 Pro Max"
      }
    ]
  }'
```

### Ejemplo 2: Agregar al Carrito (Requiere Cliente)

```bash
# 1. Login como cliente
TOKEN=$(curl -s -X POST http://localhost:3000/api/clientes/login \
  -H "Content-Type: application/json" \
  -d '{"email_cliente":"juan@example.com","contrasena":"password123"}' \
  | jq -r '.token')

# 2. Agregar producto al carrito
curl -X POST http://localhost:3000/api/carrito/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id_producto": 1,
    "cantidad": 2
  }'
```

### Ejemplo 3: Ver Carrito (Requiere Cliente)

```bash
curl -X GET http://localhost:3000/api/carrito \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Troubleshooting

### Error 401: "Token no proporcionado"

**Causa:** Falta el header `Authorization`

**Solución:**
```bash
# ❌ Mal
curl -X POST http://localhost:3000/api/almacen/productos

# ✅ Bien
curl -X POST http://localhost:3000/api/almacen/productos \
  -H "Authorization: Bearer TU_TOKEN"
```

---

### Error 401: "Token inválido"

**Causas posibles:**
1. Token expirado (7 días de validez)
2. Token corrupto o incompleto
3. JWT_SECRET cambió en el servidor

**Solución:**
- Obtén un nuevo token haciendo login nuevamente

---

### Error 403: "Acceso no autorizado"

**Causa:** Token válido pero sin permisos suficientes

**Ejemplo:**
- Intentas crear producto con token de **cliente** (necesitas token de **admin**)

**Solución:**
- Usa el tipo correcto de token para el endpoint

---

### Error 404: "Usuario no encontrado"

**Causa:** Token válido pero el usuario fue eliminado de la BD

**Solución:**
- Registra/crea el usuario nuevamente

---

## 📊 Resumen de Tokens

| Middleware | Tabla | Endpoint Login | Uso |
|-----------|-------|----------------|-----|
| `verificarToken` | `Usuario` | `POST /api/usuarios/login` | Admin, crear productos, gestión |
| `verificarTokenCliente` | `Cliente` | `POST /api/clientes/login` | Carrito, favoritos, compras |

---

## 🎯 Checklist para Probar Endpoints Privados

- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Tengo credenciales de login válidas
- [ ] Hice POST a `/login` y obtuve el token
- [ ] Copié el token completo (sin espacios al inicio/final)
- [ ] Incluí header `Authorization: Bearer TOKEN`
- [ ] El token no está expirado (< 7 días)
- [ ] Estoy usando el tipo correcto de token (Usuario vs Cliente)

---

**Última actualización:** Octubre 2025
**Autor:** Documentación TecnoCel Web

**Enlaces relacionados:**
- [Documentación de Endpoints](../api/ENDPOINTS.md)
- [Guía de Middleware](../api/reference/MIDDLEWARE.md)
- [Endpoints de Clientes](../api/endpoints/clientes.md)
