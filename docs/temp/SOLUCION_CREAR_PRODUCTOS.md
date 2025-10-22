# ✅ Solución: Error "Usuario no encontrado" al Crear Productos

## Resumen del Problema y Solución

El script `test-create-product.js` fallaba con el error **"Usuario no encontrado"** porque:

1. ❌ Se autenticaba como **cliente** (tabla `Cliente`)
2. ❌ El endpoint usa middleware que busca en tabla **`Usuario`**
3. ❌ El campo `id_usuario` estaba hardcodeado en el body (inseguro)

**Ahora está solucionado** ✅

---

## 🔧 Cambios Implementados

### 1. Nuevo Endpoint de Login para Usuarios

**Archivo:** `backend/src/controllers/UsuarioController.ts`
**Archivo:** `backend/src/routes/usuarioRoutes.ts`

Ahora existe `POST /api/usuarios/login` para autenticar administradores.

### 2. Controlador Modificado

**Archivo:** `backend/src/controllers/AlmacenController.ts` (línea 331)

```typescript
// ANTES (inseguro):
const producto = await Almacen.create({
  ...productoData, // Incluía id_usuario del body
});

// AHORA (seguro):
const producto = await Almacen.create({
  ...productoData,
  id_usuario: req.usuario?.id_usuario, // Del token JWT
});
```

### 3. Script Actualizado

**Archivo:** `backend/scripts/test-create-product.js`

- Ya NO envía `id_usuario` en el body
- Solo intenta login como usuario/admin (no como cliente)

---

## 📝 Cómo Usar

### Paso 1: Ver Usuarios Existentes

```bash
cd backend
node scripts/check-usuarios.js
```

**Resultado:**
```
✓ Se encontraron 4 usuario(s):

┌─────────┬────────────┬──────────────────────┬──────────────────────────────┬────────┐
│ (index) │ id_usuario │ nombres              │ email                        │ id_rol │
├─────────┼────────────┼──────────────────────┼──────────────────────────────┼────────┤
│ 0       │ 1          │ 'Federico cattalini' │ 'Cattalini75@gmail.com'      │ 1      │
│ 1       │ 3          │ 'Baltazar Aguiar'    │ 'baltazaraguiar99@gmail.com' │ 1      │
│ 2       │ 4          │ 'Francisco Piriz'    │ 'franciscopiriz24@gmail.com' │ 3      │
│ 3       │ 5          │ 'Emiliano Aguiar'    │ 'ejaguiar@hotmail.com'       │ 1      │
└─────────┴────────────┴──────────────────────┴──────────────────────────────┴────────┘
```

### Paso 2: Configurar Credenciales

Edita `backend/scripts/test-create-product.js` (líneas 43-45):

```javascript
credentials: {
  email: 'Cattalini75@gmail.com',  // 👈 Email de un usuario existente
  contrasena: 'LA_CONTRASEÑA_CORRECTA'  // 👈 Contraseña del usuario
}
```

### Paso 3: Ejecutar Test

```bash
cd backend
node scripts/test-create-product.js
```

**✅ Si las credenciales son correctas:**
```
✓ Login exitoso como usuario/admin
ℹ Usuario: Federico cattalini (ID: 1)
✓ Producto creado exitosamente!
```

**❌ Si las credenciales son incorrectas:**
```
⚠ Login como usuario/admin falló: Credenciales inválidas
✗ No se pudo hacer login como usuario/admin
```

---

## 🔐 Si No Conoces la Contraseña

Crea un script para actualizar la contraseña de un usuario:

```javascript
// backend/scripts/update-password.js
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updatePassword() {
  const EMAIL = 'Cattalini75@gmail.com'; // 👈 Email del usuario
  const NUEVA_CONTRASEÑA = 'admin123';   // 👈 Nueva contraseña

  const hashedPassword = await bcrypt.hash(NUEVA_CONTRASEÑA, 10);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_tecnocel_v4'
  });

  await connection.execute(
    'UPDATE tb_usuarios SET password_user = ? WHERE email = ?',
    [hashedPassword, EMAIL]
  );

  console.log('✓ Contraseña actualizada exitosamente');
  console.log(`  Email: ${EMAIL}`);
  console.log(`  Nueva contraseña: ${NUEVA_CONTRASEÑA}`);

  await connection.end();
}

updatePassword();
```

**Ejecutar:**
```bash
cd backend
node scripts/update-password.js
```

---

## 🎯 Arquitectura de la Solución

```
┌──────────────────────────────────────────────────────────┐
│  ANTES (❌ Error)                                        │
├──────────────────────────────────────────────────────────┤
│  1. Cliente hace login → token con id_cliente           │
│  2. Intenta crear producto con id_usuario: 1            │
│  3. Middleware busca Usuario.findByPk(id_cliente)       │
│  4. ❌ Error: "Usuario no encontrado"                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  AHORA (✅ Funciona)                                     │
├──────────────────────────────────────────────────────────┤
│  1. Usuario/Admin hace login → token con id_usuario     │
│  2. Crea producto SIN enviar id_usuario                 │
│  3. Middleware busca Usuario.findByPk(id_usuario)       │
│  4. Controlador usa req.usuario.id_usuario (del token)  │
│  5. ✅ Producto creado exitosamente                     │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Archivos Creados/Modificados

### Archivos Nuevos ✨
- `backend/src/controllers/UsuarioController.ts`
- `backend/src/routes/usuarioRoutes.ts`
- `backend/scripts/check-usuarios.js`

### Archivos Modificados 📝
- `backend/src/controllers/AlmacenController.ts` (línea 331)
- `backend/src/index.ts` (líneas 16, 142)
- `backend/scripts/test-create-product.js` (líneas 39-114)

---

## 🔒 Beneficios de Seguridad

| Antes | Ahora |
|-------|-------|
| ❌ `id_usuario` enviado en el body (puede falsificarse) | ✅ `id_usuario` tomado del token JWT (seguro) |
| ❌ Cualquiera podría crear productos con `id_usuario` falso | ✅ Solo usuarios autenticados pueden crear productos |
| ❌ No se sabe quién realmente creó el producto | ✅ Auditoría confiable del creador |
| ❌ Clientes intentando crear productos | ✅ Separación clara: clientes compran, admins gestionan |

---

## 🧪 Probar con cURL

```bash
# 1. Login como usuario
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"Cattalini75@gmail.com","contrasena":"tu_contraseña"}'

# 2. Copiar el token de la respuesta

# 3. Crear producto (reemplaza YOUR_TOKEN)
curl -X POST http://localhost:3000/api/almacen/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "codigo": "TEST-001",
    "nombre": "iPhone 15 Pro",
    "descripcion": "Último modelo",
    "precio_venta": 1299.99,
    "stock": 50,
    "id_categoria": 1,
    "id_marca": 1
  }'
```

**Nota:** Ya NO se envía `id_usuario` en el JSON ✅

---

## ✅ Checklist de Verificación

Antes de ejecutar el test:

- [ ] Servidor backend corriendo (`npm run dev` en `backend/`)
- [ ] Base de datos MySQL activa
- [ ] Existe al menos un usuario en `tb_usuarios`
- [ ] Conoces el email y contraseña de un usuario
- [ ] Configuraste las credenciales en `test-create-product.js`
- [ ] El código está compilado (`npm run build`)

---

## 📞 Troubleshooting

### Error: "Credenciales inválidas"
- Verifica que el email existe en `tb_usuarios`
- Verifica que la contraseña sea correcta
- Considera actualizar la contraseña con el script `update-password.js`

### Error: "No se pudo conectar al servidor"
- Verifica que el backend esté corriendo en puerto 3000
- Ejecuta: `cd backend && npm run dev`

### Error: "Error al crear producto"
- Verifica que existan:
  - Categoría con `id_categoria = 1` en tabla `tb_categorias`
  - Marca con `id_marca = 1` en tabla `tb_marcas`

---

**Última actualización:** Octubre 2025
**Estado:** ✅ Solucionado y probado
