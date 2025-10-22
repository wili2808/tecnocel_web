# Scripts del Backend

> Scripts de utilidad para desarrollo, testing, gestión de usuarios y mantenimiento de la base de datos.

---

## Tabla de Contenidos

- [Scripts de Testing](#scripts-de-testing)
- [Scripts de Gestión de Usuarios](#scripts-de-gestión-de-usuarios)
- [Scripts de Verificación](#scripts-de-verificación)
- [Scripts Legacy](#scripts-legacy)
- [Usuario de Prueba](#usuario-de-prueba)
- [Guía de Uso](#guía-de-uso)

---

## Scripts de Testing

### test-create-product.js ⭐ NUEVO

**Descripción**: Prueba automatizada completa del endpoint `POST /api/almacen/productos`

**Uso**:
```bash
node scripts/test-create-product.js
```

**Características**:
- ✅ Login automático como usuario administrador
- ✅ Creación de producto con datos completos
- ✅ Validación de respuesta del servidor
- ✅ Logs detallados con colores
- ✅ Reporte de éxito/error

**Configuración**: Editar líneas 43-45 con credenciales válidas

**Credenciales preconfiguradas**:
- Email: `admin@tecnocel.com`
- Contraseña: `admin123`

---

## Scripts de Gestión de Usuarios

### create-user.js ⭐ NUEVO

**Descripción**: Crear usuarios administradores o vendedores con contraseñas hasheadas

**Uso**:
```bash
# 1. Editar líneas 36-41 con datos del usuario
# 2. Ejecutar:
node scripts/create-user.js
```

**Características**:
- ✅ Hash de contraseña con bcrypt (10 rounds)
- ✅ Validación de email duplicado
- ✅ Selección de rol (ADMINISTRADOR o VENDEDOR)
- ✅ Muestra credenciales al finalizar
- ✅ Lista todos los usuarios después de crear

**Roles disponibles**:
- `1` = ADMINISTRADOR
- `3` = VENDEDOR

---

## Scripts de Verificación

### check-usuarios.js ⭐ NUEVO

**Descripción**: Listar todos los usuarios en `tb_usuarios`

**Uso**:
```bash
node scripts/check-usuarios.js
```

**Salida**: Tabla con `id_usuario`, `nombres`, `email` y `id_rol`

---

### check-roles.js ⭐ NUEVO

**Descripción**: Mostrar roles disponibles en el sistema

**Uso**:
```bash
node scripts/check-roles.js
```

**Utilidad**: Identificar IDs de roles válidos para `create-user.js`

---

### check-categorias-marcas.js ⭐ NUEVO

**Descripción**: Listar categorías y marcas disponibles para productos

**Uso**:
```bash
node scripts/check-categorias-marcas.js
```

**Utilidad**: Obtener IDs válidos para tests de productos

---

### check-almacen-structure.js ⭐ NUEVO

**Descripción**: Mostrar estructura completa de la tabla `tb_almacen`

**Uso**:
```bash
node scripts/check-almacen-structure.js
```

**Utilidad**: Identificar campos obligatorios y tipos de datos

---

## Scripts Legacy

### ejemplos-api-productos.js

**Descripción**: Ejemplos de uso de la API de productos con diferentes casos de uso.

**Uso**:
```bash
node scripts/ejemplos-api-productos.js
```

**Características**:
- Ejemplos de GET, POST, PUT, DELETE
- Casos de uso comunes
- Validación de responses

---

### test-product-creation.js

**Descripción**: Script de prueba para creación de productos en la base de datos.

**Uso**:
```bash
node scripts/test-product-creation.js
```

**Características**:
- Crea productos de prueba
- Valida la estructura de datos
- Verifica relaciones

---

### implement-database-improvements.js

**Descripción**: Script de referencia con mejoras implementadas en la base de datos.

**Nota**: Este script YA FUE EJECUTADO. Se mantiene como referencia histórica.

**Características**:
- Creación de tablas de marcas, características, ofertas
- Migración de datos existentes
- Índices y optimizaciones

---

---

## Usuario de Prueba

### Credenciales Preconfiguradas

```
Email:      admin@tecnocel.com
Contraseña: admin123
Rol:        ADMINISTRADOR (ID: 1)
ID Usuario: 6
Estado:     ACTIVO
```

Estas credenciales están configuradas en:
- `test-create-product.js`
- Documentación de API
- Ejemplos de cURL

---

## Guía de Uso

### Primer Uso

```bash
# 1. Verificar usuarios existentes
node scripts/check-usuarios.js

# 2. Si no existe usuario de prueba, crearlo
node scripts/create-user.js

# 3. Verificar categorías y marcas
node scripts/check-categorias-marcas.js

# 4. Ejecutar test
node scripts/test-create-product.js
```

### Testing Regular

```bash
node scripts/test-create-product.js
```

---

## Configuración

Los scripts utilizan la configuración en `config/`:

- **database.js**: Conexión a MySQL
- **logger.js**: Sistema de logging

Todos los scripts requieren:
- Variables de entorno en `.env`
- Ejecutarse desde la raíz del backend
- MySQL corriendo y accesible

---

**Última actualización**: 22 de Octubre, 2025
**Versión**: 2.0
**Estado**: Actualizado con nuevos scripts de testing

**Documentos relacionados**:
- [Informe de Testing](../../docs/testing/INFORME_TESTING_CREATE_PRODUCT.md)
- [Solución Crear Productos](../../docs/temp/SOLUCION_CREAR_PRODUCTOS.md)

---

**[Backend](../README.md)** | **[Inicio](../../README.md)**
