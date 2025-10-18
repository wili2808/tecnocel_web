# 🧪 Guía Rápida: Testing de Endpoints

## 📚 Resumen Ejecutivo

**Endpoints Públicos** ✅ = No necesitan token (ej: ver productos)
**Endpoints Privados** 🔒 = Necesitan token JWT (ej: crear productos)

---

## 🚀 Prueba Rápida del Endpoint `createProduct`

### Opción 1: Script Automatizado (Recomendado)

```bash
# Desde el directorio raíz del proyecto
cd backend
node scripts/test-create-product.js
```

Este script automáticamente:
1. Hace login (o registra un nuevo usuario)
2. Obtiene el token JWT
3. Crea un producto de prueba
4. Muestra el resultado

---

### Opción 2: Paso a Paso Manual

#### 1️⃣ Obtener Token (Login)

```bash
curl -X POST http://localhost:3000/api/clientes/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_cliente": "cliente@example.com",
    "contrasena": "password123"
  }'
```

**O registrarse primero:**

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
  "mensaje": "Registro exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cliente": { ... }
}
```

#### 2️⃣ Copiar el Token

Del response anterior, copia el valor de `"token"`.

#### 3️⃣ Crear Producto con el Token

```bash
# ⚠️ REEMPLAZA "TU_TOKEN_AQUI" con el token que copiaste
curl -X POST http://localhost:3000/api/almacen/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "codigo": "IPHONE15",
    "nombre": "iPhone 15 Pro",
    "descripcion": "Último modelo de Apple",
    "precio_venta": 1299.99,
    "stock": 50,
    "id_categoria": 1,
    "id_marca": 1,
    "id_usuario": 1,
    "imagenes": [
      {
        "url_imagen": "iphone15.jpg",
        "alt_text": "iPhone 15 Pro"
      }
    ]
  }'
```

---

## 🔍 Cómo Funciona la Autenticación

### Sistema de Rutas en `almacenRoutes.ts`

```typescript
// ✅ PÚBLICO - Cualquiera puede acceder
router.get('/productos', ...)
router.get('/productos/:id', ...)
router.get('/productos/destacados', ...)

// 🔒 MIDDLEWARE - Todo lo siguiente necesita token
router.use(verificarToken);

// 🔒 PRIVADO - Necesita token JWT
router.post('/productos', ...)      // Crear
router.put('/productos/:id', ...)   // Actualizar
router.delete('/productos/:id', ...) // Eliminar
```

### El Middleware `verificarToken`

```typescript
// 1. Extrae el token del header
const token = req.headers.authorization?.split(' ')[1];

// 2. Verifica que sea válido
jwt.verify(token, JWT_SECRET);

// 3. Busca el usuario en la BD
const usuario = await Usuario.findByPk(...);

// 4. Permite continuar si todo OK
next();
```

---

## 📋 Formato del Header Authorization

**Formato correcto:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR9.eyJpZF91c3VhcmlvIjoxfQ.abc123
```

**Componentes:**
- Palabra `Bearer` (con mayúscula B)
- Un espacio
- El token JWT completo

**❌ Errores comunes:**
```
Authorization: eyJhbG...  (falta "Bearer ")
Authorization: bearer eyJ...  (minúscula)
Authorization: Bearer eyJ...  (espacio extra al final del token)
```

---

## 🎯 Tipos de Token

Tu proyecto tiene **2 tipos** de autenticación:

| Tipo | Tabla | Endpoint Login | Uso |
|------|-------|----------------|-----|
| **Usuario/Admin** | `Usuario` | `POST /api/usuarios/login` | Crear productos, administración |
| **Cliente** | `Cliente` | `POST /api/clientes/login` | Carrito, favoritos, compras |

### ¿Cuál usar para `createProduct`?

El endpoint `POST /api/almacen/productos` usa `verificarToken`, que busca en la tabla `Usuario`.

**Necesitas token de admin/usuario**, NO de cliente.

---

## 🛠️ Tools Recomendadas

### 1. Thunder Client (VSCode Extension)
- Integrado en VSCode
- Guarda automáticamente tokens
- Fácil de usar

### 2. Postman
- Más completo
- Environments para guardar tokens
- Documentación automática

### 3. cURL (Terminal)
- Rápido para tests simples
- Scripts automatizables
- Ya incluido en tu sistema

---

## ❓ Troubleshooting

### Error 401: "Token no proporcionado"
✅ **Solución:** Agrega el header `Authorization: Bearer TOKEN`

### Error 401: "Token inválido"
✅ **Solución:** El token expiró (7 días) o es incorrecto. Haz login de nuevo.

### Error 403: "Acceso no autorizado"
✅ **Solución:** Estás usando token de cliente, necesitas token de usuario/admin.

### Error 404: "Usuario no encontrado"
✅ **Solución:** El usuario del token fue eliminado. Crea uno nuevo.

### Error 500: "Error al crear producto"
✅ **Solución:** Verifica que `id_categoria`, `id_marca`, `id_usuario` existan en la BD.

---

## 📖 Documentación Completa

Para más detalles, consulta:
- [📄 Guía Completa de Autenticación](docs/guides/AUTHENTICATION_TESTING.md)
- [📄 Endpoints de Productos](docs/api/endpoints/productos.md)
- [📄 Referencia de Middleware](docs/api/reference/MIDDLEWARE.md)

---

## ✅ Checklist Rápido

Antes de probar un endpoint privado:

- [ ] Backend corriendo (`npm run dev` en `backend/`)
- [ ] Hice login y obtuve el token
- [ ] Copié el token completo
- [ ] Incluí header `Authorization: Bearer TOKEN`
- [ ] El token no expiró (< 7 días)
- [ ] Uso el tipo correcto de token (Usuario vs Cliente)

---

**Última actualización:** Octubre 2025
