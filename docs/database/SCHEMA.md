<!-- markdownlint-disable -->
<!-- prettier-ignore -->
# 📋 Esquema de Base de Datos

> Documentación completa del esquema de base de datos con 26 tablas.

**Última actualización**: 7 de Octubre, 2025
**Versión de la BD**: 4.0
**Base de datos**: `db_tecnocel_v4`
**Motor**: MariaDB 10.4.27 / MySQL 8.0+
**Charset**: utf8mb4 / utf8
**Collation**: utf8mb4_general_ci / utf8_spanish_ci
**Total de tablas**: 26

---

## Tabla de Contenidos

- [Índice de Tablas](#índice-de-tablas)
  - [Sistema de Productos y Ventas](#sistema-de-productos-y-ventas)
  - [Sistema de Clientes y Autenticación](#sistema-de-clientes-y-autenticación)
  - [Sistema de Carrito y Compras](#sistema-de-carrito-y-compras)
  - [Sistema de Ofertas y Favoritos](#sistema-de-ofertas-y-favoritos)
  - [Sistema de Comentarios](#sistema-de-comentarios)
  - [Sistema de Compras y Proveedores](#sistema-de-compras-y-proveedores)
  - [Sistema de Presupuestos](#sistema-de-presupuestos)
  - [Sistema de Devoluciones](#sistema-de-devoluciones)
  - [Sistema de Usuarios y Roles](#sistema-de-usuarios-y-roles)
- [Tablas Principales](#tablas-principales)
  - [tb_almacen](#tb_almacen)
  - [tb_clientes](#tb_clientes)
  - [tb_carritosweb](#tb_carritosweb)
  - [tb_carritoweb_items](#tb_carritoweb_items)
  - [tb_producto_imagenes](#tb_producto_imagenes)
  - [tb_marcas](#tb_marcas)
  - [tb_categorias](#tb_categorias)
  - [tb_ofertas](#tb_ofertas)
  - [tb_productos_ofertas](#tb_productos_ofertas)
  - [tb_favoritos](#tb_favoritos)
  - [tb_comentarios_productos](#tb_comentarios_productos)
  - [tb_comentario_imagenes](#tb_comentario_imagenes)
  - [tb_direcciones](#tb_direcciones)
  - [tb_producto_caracteristicas](#tb_producto_caracteristicas)
  - [tb_tipos_caracteristicas](#tb_tipos_caracteristicas)
- [Tablas del Sistema de Compras](#tablas-del-sistema-de-compras)
  - [tb_compras](#tb_compras)
  - [tb_detalle_compras](#tb_detalle_compras)
  - [tb_proveedores](#tb_proveedores)
- [Tablas del Sistema de Ventas y Presupuestos](#tablas-del-sistema-de-ventas-y-presupuestos)
  - [tb_ventas](#tb_ventas)
  - [tb_presupuestos](#tb_presupuestos)
  - [tb_presupuesto_detalles](#tb_presupuesto_detalles)
- [Tablas del Sistema de Devoluciones](#tablas-del-sistema-de-devoluciones)
  - [tb_devoluciones](#tb_devoluciones)
  - [tb_detalle_devoluciones](#tb_detalle_devoluciones)
- [Tablas del Sistema Administrativo](#tablas-del-sistema-administrativo)
  - [tb_usuarios](#tb_usuarios)
  - [tb_roles](#tb_roles)
  - [tb_carrito](#tb_carrito)
- [Diagrama de Relaciones (Resumen)](#diagrama-de-relaciones-resumen)
- [Índices y Constraints](#índices-y-constraints)
- [Estadísticas de la Base de Datos](#estadísticas-de-la-base-de-datos)
- [Migraciones Recientes](#migraciones-recientes)
- [Diagramas de Relaciones](#diagramas-de-relaciones)
- [Backup y Restauración](#backup-y-restauración)
- [Recursos Adicionales](#recursos-adicionales)

---

## Índice de Tablas

### Sistema de Productos y Ventas
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_almacen](#tb_almacen) | Productos del almacén/catálogo | Productos, stock, precios |
| [tb_producto_imagenes](#tb_producto_imagenes) | Imágenes de productos | URLs de imágenes |
| [tb_producto_caracteristicas](#tb_producto_caracteristicas) | Características de productos | Especificaciones técnicas |
| [tb_marcas](#tb_marcas) | Marcas de productos | Samsung, Apple, Xiaomi, etc. |
| [tb_categorias](#tb_categorias) | Categorías de productos | Celulares, Consolas, etc. |
| [tb_tipos_caracteristicas](#tb_tipos_caracteristicas) | Tipos de características | Pantalla, Cámara, Memoria, etc. |

### Sistema de Clientes y Autenticación
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_clientes](#tb_clientes) | Clientes de la tienda web | Datos personales, autenticación |
| [tb_direcciones](#tb_direcciones) | Direcciones de envío | Direcciones de clientes |

### Sistema de Carrito y Compras
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_carritosweb](#tb_carritosweb) | Carritos de compra web | Carritos activos/completados |
| [tb_carritoweb_items](#tb_carritoweb_items) | Items del carrito web | Productos en carrito |
| [tb_carrito](#tb_carrito) | Carrito punto de venta (legacy) | Sistema antiguo |
| [tb_ventas](#tb_ventas) | Ventas realizadas | Registro de ventas |

### Sistema de Ofertas y Favoritos
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_ofertas](#tb_ofertas) | Ofertas y descuentos | Ofertas activas |
| [tb_productos_ofertas](#tb_productos_ofertas) | Productos con ofertas | Relación producto-oferta |
| [tb_favoritos](#tb_favoritos) | Productos favoritos | Lista de deseos |

### Sistema de Comentarios
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_comentarios_productos](#tb_comentarios_productos) | Comentarios y reseñas | Comentarios de clientes |
| [tb_comentario_imagenes](#tb_comentario_imagenes) | Imágenes de comentarios | Fotos en reseñas |

### Sistema de Compras y Proveedores
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_compras](#tb_compras) | Compras a proveedores | Órdenes de compra |
| [tb_detalle_compras](#tb_detalle_compras) | Detalle de compras | Items comprados |
| [tb_proveedores](#tb_proveedores) | Proveedores | Datos de proveedores |

### Sistema de Presupuestos
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_presupuestos](#tb_presupuestos) | Presupuestos generados | Cotizaciones |
| [tb_presupuesto_detalles](#tb_presupuesto_detalles) | Detalle de presupuestos | Items cotizados |

### Sistema de Devoluciones
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_devoluciones](#tb_devoluciones) | Devoluciones | Registro de devoluciones |
| [tb_detalle_devoluciones](#tb_detalle_devoluciones) | Detalle de devoluciones | Items devueltos |

### Sistema de Usuarios y Roles
| Tabla | Descripción | Registros Clave |
|-------|-------------|-----------------|
| [tb_usuarios](#tb_usuarios) | Usuarios del sistema admin | Administradores |
| [tb_roles](#tb_roles) | Roles de usuarios | Permisos y roles |

---

## Tablas Principales

### tb_almacen

**Descripción**: Tabla principal que almacena todos los productos del catálogo/almacén.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_producto` | INT(11) | NO | AUTO_INCREMENT | ID único del producto (PK) |
| `codigo` | VARCHAR(255) | NO | - | Código de barras/SKU del producto |
| `nombre` | VARCHAR(255) | NO | - | Nombre del producto |
| `modelo` | VARCHAR(255) | YES | NULL | Modelo del producto |
| `descripcion` | TEXT | YES | NULL | Descripción detallada del producto |
| `stock` | INT(11) | NO | - | Cantidad en stock actual |
| `stock_minimo` | INT(11) | YES | NULL | Stock mínimo recomendado |
| `stock_maximo` | INT(11) | YES | NULL | Stock máximo recomendado |
| `precio_compra` | VARCHAR(255) | NO | - | Precio de compra del producto |
| `precio_venta` | VARCHAR(255) | NO | - | Precio de venta al público |
| `fecha_ingreso` | DATE | NO | - | Fecha de ingreso al inventario |
| `id_usuario` | INT(11) | NO | - | Usuario que registró el producto (FK → tb_usuarios) |
| `id_categoria` | INT(11) | NO | - | Categoría del producto (FK → tb_categorias) |
| `id_marca` | INT(11) | YES | NULL | Marca del producto (FK → tb_marcas) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación del registro |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |
| `es_destacado` | TINYINT(1) | YES | 0 | Indica si el producto es destacado (0=No, 1=Sí) |
| `orden_destacado` | INT(11) | YES | 0 | Orden de visualización en destacados |

**Relaciones**:
- `id_usuario` → `tb_usuarios.id_usuario` (N:1)
- `id_categoria` → `tb_categorias.id_categoria` (N:1)
- `id_marca` → `tb_marcas.id_marca` (N:1, opcional)

**Relaciones inversas**:
- ← `tb_producto_imagenes` (1:N) - Imágenes del producto
- ← `tb_producto_caracteristicas` (1:N) - Características técnicas
- ← `tb_productos_ofertas` (1:N) - Ofertas aplicadas
- ← `tb_comentarios_productos` (1:N) - Comentarios y reseñas
- ← `tb_favoritos` (1:N) - Marcado como favorito
- ← `tb_carritoweb_items` (1:N) - Items en carritos
- ← `tb_carrito` (1:N) - Items en carrito POS
- ← `tb_detalle_compras` (1:N) - Compras a proveedores

**Índices**:
- PRIMARY KEY: `id_producto`
- FOREIGN KEY: `id_usuario`, `id_categoria`, `id_marca`

---

### tb_clientes

**Descripción**: Almacena información de los clientes de la tienda web, incluyendo autenticación y datos personales.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_cliente` | INT(11) | NO | AUTO_INCREMENT | ID único del cliente (PK) |
| `nombre_cliente` | VARCHAR(255) | NO | - | Nombre del cliente |
| `apellido_cliente` | VARCHAR(255) | NO | '' | Apellido del cliente |
| `nit_ci_cliente` | VARCHAR(255) | NO | - | NIT o CI del cliente |
| `celular_cliente` | VARCHAR(50) | NO | - | Número de celular |
| `email_cliente` | VARCHAR(255) | NO | - | Email del cliente (UNIQUE) |
| `password_hash` | VARCHAR(255) | YES | NULL | Hash de la contraseña (bcrypt) |
| `is_web_enabled` | TINYINT(1) | NO | 0 | Habilitado para web (0=No, 1=Sí) |
| `last_login` | DATETIME | YES | NULL | Fecha de último inicio de sesión |
| `email_verified` | TINYINT(1) | NO | 0 | Email verificado (0=No, 1=Sí) |
| `verification_token` | VARCHAR(255) | YES | NULL | Token de verificación de email |
| `reset_token` | VARCHAR(255) | YES | NULL | Token para resetear contraseña |
| `reset_token_expires` | DATETIME | YES | NULL | Expiración del token de reset |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |
| `google_id` | VARCHAR(255) | YES | NULL | ID de Google OAuth 2.0 (UNIQUE) |

**Relaciones inversas**:
- ← `tb_carritosweb` (1:N) - Carritos del cliente
- ← `tb_direcciones` (1:N) - Direcciones de envío
- ← `tb_favoritos` (1:N) - Productos favoritos
- ← `tb_comentarios_productos` (1:N) - Comentarios realizados

**Índices**:
- PRIMARY KEY: `id_cliente`
- UNIQUE: `email_cliente`, `google_id`

**Características de Seguridad**:
- Contraseñas hasheadas con bcrypt
- Autenticación JWT (7 días de expiración)
- Google OAuth 2.0 integrado
- Sistema de verificación de email
- Reset de contraseña con token temporal

---

### tb_carritosweb

**Descripción**: Carritos de compra de los clientes en la tienda web.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_carrito` | INT(11) | NO | AUTO_INCREMENT | ID único del carrito (PK) |
| `id_cliente` | INT(11) | NO | - | Cliente propietario del carrito (FK → tb_clientes) |
| `estado` | ENUM | YES | 'activo' | Estado del carrito (activo, completado, abandonado) |
| `total_carrito` | DECIMAL(10,2) | YES | 0.00 | Total calculado del carrito |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |
| `fyh_abandono` | DATETIME | YES | NULL | Fecha de abandono del carrito |

**Relaciones**:
- `id_cliente` → `tb_clientes.id_cliente` (N:1)

**Relaciones inversas**:
- ← `tb_carritoweb_items` (1:N) - Items del carrito

**Índices**:
- PRIMARY KEY: `id_carrito`
- FOREIGN KEY: `id_cliente`
- INDEX: `estado` (para filtrar carritos activos/abandonados)

**Estados del Carrito**:
- `activo`: Carrito en uso actualmente
- `completado`: Compra finalizada
- `abandonado`: Carrito abandonado (para remarketing)

---

### tb_carritoweb_items

**Descripción**: Items individuales dentro de cada carrito de compra web.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_item` | INT(11) | NO | AUTO_INCREMENT | ID único del item (PK) |
| `id_carrito` | INT(11) | NO | - | Carrito al que pertenece (FK → tb_carritosweb) |
| `id_producto` | INT(11) | NO | - | Producto agregado (FK → tb_almacen) |
| `cantidad` | INT(11) | NO | - | Cantidad de unidades |
| `precio_unitario` | DECIMAL(10,2) | NO | - | Precio unitario al momento de agregar |
| `subtotal` | DECIMAL(10,2) | NO | - | Subtotal (cantidad × precio_unitario) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_carrito` → `tb_carritosweb.id_carrito` (N:1)
- `id_producto` → `tb_almacen.id_producto` (N:1)

**Índices**:
- PRIMARY KEY: `id_item`
- FOREIGN KEY: `id_carrito`, `id_producto`
- UNIQUE: `(id_carrito, id_producto)` - Un producto solo puede estar una vez por carrito

**Lógica de Negocio**:
- El `precio_unitario` se congela al agregar al carrito (protección contra cambios de precio)
- El `subtotal` se calcula automáticamente: `cantidad × precio_unitario`
- Si el producto tiene oferta activa, el precio ya incluye el descuento

---

### tb_producto_imagenes

**Descripción**: Almacena las URLs de las imágenes asociadas a cada producto.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_imagen` | INT(11) | NO | AUTO_INCREMENT | ID único de la imagen (PK) |
| `id_producto` | INT(11) | NO | - | Producto al que pertenece (FK → tb_almacen) |
| `url_imagen` | TEXT | NO | - | URL/path de la imagen |
| `alt_text` | VARCHAR(255) | YES | NULL | Texto alternativo para accesibilidad |
| `es_principal` | TINYINT(1) | YES | 0 | Indica si es la imagen principal (0=No, 1=Sí) |
| `orden` | INT(11) | YES | 0 | Orden de visualización |
| `fyh_creacion` | DATETIME | NO | CURRENT_TIMESTAMP | Fecha y hora de creación |

**Relaciones**:
- `id_producto` → `tb_almacen.id_producto` (N:1)

**Índices**:
- PRIMARY KEY: `id_imagen`
- FOREIGN KEY: `id_producto`
- INDEX: `es_principal` (para consultas rápidas de imagen principal)

**Procesamiento de Imágenes**:
- Formato permitido: JPEG, PNG, WEBP, GIF
- Tamaño máximo: 10MB por imagen
- Redimensionamiento automático: Máximo 1200x1200px
- Optimización: Calidad 85% JPEG progresivo
- Ruta de almacenamiento: `backend/uploads/productos/`

---

### tb_marcas

**Descripción**: Catálogo de marcas de productos.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_marca` | INT(11) | NO | AUTO_INCREMENT | ID único de la marca (PK) |
| `nombre_marca` | VARCHAR(255) | NO | - | Nombre de la marca |
| `logo_url` | VARCHAR(255) | YES | NULL | URL del logo de la marca |
| `activo` | TINYINT(1) | NO | 1 | Marca activa (0=No, 1=Sí) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones inversas**:
- ← `tb_almacen` (1:N) - Productos de la marca

**Índices**:
- PRIMARY KEY: `id_marca`

**Ejemplos de Marcas**:
- Samsung (ID: 1)
- Apple (ID: 2)
- Xiaomi (ID: 3)
- Motorola (ID: 4)
- PlayStation (ID: 11)
- Xbox (ID: 12)

---

### tb_categorias

**Descripción**: Catálogo de categorías de productos.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_categoria` | INT(11) | NO | AUTO_INCREMENT | ID único de la categoría (PK) |
| `nombre_categoria` | VARCHAR(255) | NO | - | Nombre de la categoría |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones inversas**:
- ← `tb_almacen` (1:N) - Productos de la categoría

**Índices**:
- PRIMARY KEY: `id_categoria`

**Ejemplos de Categorías**:
- Celulares Samsung
- Celulares iPhone
- Celulares Xiaomi
- Consolas de Videojuegos
- Accesorios

---

### tb_ofertas

**Descripción**: Ofertas y descuentos aplicables a productos.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_oferta` | INT(11) | NO | AUTO_INCREMENT | ID único de la oferta (PK) |
| `nombre_oferta` | VARCHAR(255) | NO | - | Nombre descriptivo de la oferta |
| `descripcion_oferta` | TEXT | YES | NULL | Descripción detallada |
| `tipo_descuento` | ENUM | NO | - | Tipo (porcentaje, monto_fijo) |
| `valor_descuento` | DECIMAL(10,2) | NO | - | Valor del descuento |
| `fecha_inicio` | DATETIME | NO | - | Fecha de inicio de la oferta |
| `fecha_fin` | DATETIME | NO | - | Fecha de fin de la oferta |
| `activo` | TINYINT(1) | NO | 1 | Oferta activa (0=No, 1=Sí) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones inversas**:
- ← `tb_productos_ofertas` (1:N) - Productos con esta oferta

**Índices**:
- PRIMARY KEY: `id_oferta`
- INDEX: `activo`, `fecha_inicio`, `fecha_fin`

**Tipos de Descuento**:
- `porcentaje`: Descuento en % (ej: 15% de descuento)
- `monto_fijo`: Descuento fijo (ej: $50 de descuento)

**Validación de Ofertas**:
- Una oferta está activa si:
  - `activo = 1`
  - `fecha_inicio <= NOW() <= fecha_fin`

---

### tb_productos_ofertas

**Descripción**: Tabla relacional que vincula productos con ofertas.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_producto_oferta` | INT(11) | NO | AUTO_INCREMENT | ID único de la relación (PK) |
| `id_producto` | INT(11) | NO | - | Producto (FK → tb_almacen) |
| `id_oferta` | INT(11) | NO | - | Oferta aplicada (FK → tb_ofertas) |
| `precio_oferta` | DECIMAL(10,2) | NO | - | Precio final con oferta aplicada |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |

**Relaciones**:
- `id_producto` → `tb_almacen.id_producto` (N:1)
- `id_oferta` → `tb_ofertas.id_oferta` (N:1)

**Índices**:
- PRIMARY KEY: `id_producto_oferta`
- FOREIGN KEY: `id_producto`, `id_oferta`
- UNIQUE: `(id_producto, id_oferta)` - Un producto no puede tener la misma oferta duplicada

**Cálculo de Precio con Oferta**:
```javascript
if (tipo_descuento === 'porcentaje') {
  precio_oferta = precio_venta * (1 - valor_descuento / 100);
} else if (tipo_descuento === 'monto_fijo') {
  precio_oferta = precio_venta - valor_descuento;
}
```

---

### tb_favoritos

**Descripción**: Lista de productos favoritos de cada cliente.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_favorito` | INT(11) | NO | AUTO_INCREMENT | ID único del favorito (PK) |
| `id_cliente` | INT(11) | NO | - | Cliente (FK → tb_clientes) |
| `id_producto` | INT(11) | NO | - | Producto favorito (FK → tb_almacen) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |

**Relaciones**:
- `id_cliente` → `tb_clientes.id_cliente` (N:1)
- `id_producto` → `tb_almacen.id_producto` (N:1)

**Índices**:
- PRIMARY KEY: `id_favorito`
- FOREIGN KEY: `id_cliente`, `id_producto`
- UNIQUE: `(id_cliente, id_producto)` - Un cliente no puede marcar el mismo producto dos veces

**Funcionalidad Toggle**:
- Si existe el favorito → Se elimina (unfavorite)
- Si no existe → Se crea (favorite)

---

### tb_comentarios_productos

**Descripción**: Comentarios, reseñas y calificaciones de productos por clientes.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_comentario` | INT(11) | NO | AUTO_INCREMENT | ID único del comentario (PK) |
| `id_producto` | INT(11) | NO | - | Producto comentado (FK → tb_almacen) |
| `id_cliente` | INT(11) | NO | - | Cliente que comenta (FK → tb_clientes) |
| `comentario` | TEXT | NO | - | Texto del comentario |
| `calificacion` | TINYINT(4) | YES | NULL | Calificación 1-5 estrellas |
| `es_verificado` | TINYINT(1) | NO | 0 | Compra verificada (0=No, 1=Sí) |
| `estado` | ENUM | NO | 'activo' | Estado (activo, oculto, eliminado) |
| `respuesta_admin` | TEXT | YES | NULL | Respuesta del administrador |
| `fecha_respuesta_admin` | DATETIME | YES | NULL | Fecha de respuesta del admin |
| `id_admin_respuesta` | INT(11) | YES | NULL | Admin que respondió (FK → tb_usuarios) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_producto` → `tb_almacen.id_producto` (N:1)
- `id_cliente` → `tb_clientes.id_cliente` (N:1)
- `id_admin_respuesta` → `tb_usuarios.id_usuario` (N:1, opcional)

**Relaciones inversas**:
- ← `tb_comentario_imagenes` (1:N) - Imágenes del comentario

**Índices**:
- PRIMARY KEY: `id_comentario`
- FOREIGN KEY: `id_producto`, `id_cliente`, `id_admin_respuesta`
- INDEX: `estado`, `calificacion`

**Estados**:
- `activo`: Visible públicamente
- `oculto`: No visible (moderación)
- `eliminado`: Eliminado soft delete

**Sistema de Calificación**:
- Rango: 1-5 estrellas
- NULL si no se califica (solo comentario de texto)

---

### tb_comentario_imagenes

**Descripción**: Imágenes adjuntas a comentarios de productos (ej: fotos del producto recibido).

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_imagen` | INT(11) | NO | AUTO_INCREMENT | ID único de la imagen (PK) |
| `id_comentario` | INT(11) | NO | - | Comentario al que pertenece (FK → tb_comentarios_productos) |
| `url_imagen` | TEXT | NO | - | URL/path de la imagen |
| `alt_text` | VARCHAR(255) | YES | NULL | Texto alternativo |
| `fyh_creacion` | DATETIME | NO | CURRENT_TIMESTAMP | Fecha y hora de creación |

**Relaciones**:
- `id_comentario` → `tb_comentarios_productos.id_comentario` (N:1)

**Índices**:
- PRIMARY KEY: `id_imagen`
- FOREIGN KEY: `id_comentario`

**Restricciones**:
- Máximo 5 imágenes por comentario
- Formatos: JPEG, PNG, WEBP
- Tamaño máximo: 5MB por imagen

---

### tb_direcciones

**Descripción**: Direcciones de envío de los clientes.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_direccion` | INT(11) | NO | AUTO_INCREMENT | ID único de la dirección (PK) |
| `id_cliente` | INT(11) | NO | - | Cliente propietario (FK → tb_clientes) |
| `tipo_direccion` | ENUM | NO | 'envio' | Tipo (envio, facturacion) |
| `nombre_destinatario` | VARCHAR(255) | NO | - | Nombre del destinatario |
| `telefono` | VARCHAR(50) | NO | - | Teléfono de contacto |
| `direccion` | TEXT | NO | - | Dirección completa |
| `ciudad` | VARCHAR(100) | NO | - | Ciudad |
| `departamento` | VARCHAR(100) | YES | NULL | Departamento/Estado |
| `codigo_postal` | VARCHAR(20) | YES | NULL | Código postal |
| `referencias` | TEXT | YES | NULL | Referencias adicionales |
| `es_principal` | TINYINT(1) | NO | 0 | Dirección principal (0=No, 1=Sí) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_cliente` → `tb_clientes.id_cliente` (N:1)

**Índices**:
- PRIMARY KEY: `id_direccion`
- FOREIGN KEY: `id_cliente`
- INDEX: `es_principal`

**Tipos de Dirección**:
- `envio`: Dirección de envío de productos
- `facturacion`: Dirección para facturación

**Lógica de Dirección Principal**:
- Solo puede haber una dirección principal por cliente y tipo
- Al marcar una como principal, las demás del mismo tipo se marcan como secundarias

---

### tb_producto_caracteristicas

**Descripción**: Características técnicas de cada producto (ej: pantalla, cámara, memoria).

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_producto_caracteristica` | INT(11) | NO | AUTO_INCREMENT | ID único (PK) |
| `id_producto` | INT(11) | NO | - | Producto (FK → tb_almacen) |
| `id_tipo_caracteristica` | INT(11) | NO | - | Tipo de característica (FK → tb_tipos_caracteristicas) |
| `valor` | TEXT | NO | - | Valor de la característica |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_producto` → `tb_almacen.id_producto` (N:1)
- `id_tipo_caracteristica` → `tb_tipos_caracteristicas.id_tipo` (N:1)

**Índices**:
- PRIMARY KEY: `id_producto_caracteristica`
- FOREIGN KEY: `id_producto`, `id_tipo_caracteristica`
- UNIQUE: `(id_producto, id_tipo_caracteristica)` - Un producto no puede tener la misma característica duplicada

**Ejemplos**:
- Producto: iPhone 16, Tipo: Pantalla, Valor: "6.1 pulgadas OLED"
- Producto: iPhone 16, Tipo: Cámara, Valor: "48MP principal + 12MP ultra ancha"
- Producto: iPhone 16, Tipo: Memoria RAM, Valor: "8GB"

---

### tb_tipos_caracteristicas

**Descripción**: Catálogo de tipos de características técnicas.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_tipo` | INT(11) | NO | AUTO_INCREMENT | ID único del tipo (PK) |
| `nombre_tipo` | VARCHAR(255) | NO | - | Nombre del tipo de característica |
| `descripcion` | TEXT | YES | NULL | Descripción del tipo |
| `unidad_medida` | VARCHAR(50) | YES | NULL | Unidad de medida (ej: GB, pulgadas, MP) |
| `tipo_dato` | ENUM | NO | 'texto' | Tipo de dato (texto, numero, seleccion, booleano) |
| `activo` | TINYINT(1) | NO | 1 | Tipo activo (0=No, 1=Sí) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones inversas**:
- ← `tb_producto_caracteristicas` (1:N) - Características de productos

**Índices**:
- PRIMARY KEY: `id_tipo`

**Tipos de Dato**:
- `texto`: Valor libre de texto
- `numero`: Valor numérico
- `seleccion`: Lista de opciones predefinidas
- `booleano`: Sí/No

**Ejemplos de Tipos**:
- Pantalla (texto, unidad: pulgadas)
- Cámara (texto, unidad: MP)
- Memoria RAM (numero, unidad: GB)
- Almacenamiento (numero, unidad: GB)
- Sistema Operativo (texto)
- Batería (numero, unidad: mAh)

---

## Tablas del Sistema de Compras

### tb_compras

**Descripción**: Registro de compras realizadas a proveedores.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_compra` | INT(11) | NO | AUTO_INCREMENT | ID único de la compra (PK) |
| `nro_compra` | INT(11) | NO | - | Número de compra |
| `fecha_compra` | DATE | NO | - | Fecha de la compra |
| `id_proveedor` | INT(11) | NO | - | Proveedor (FK → tb_proveedores) |
| `comprobante` | VARCHAR(255) | NO | - | Número de comprobante/factura |
| `id_usuario` | INT(11) | NO | - | Usuario que registró (FK → tb_usuarios) |
| `precio_total` | VARCHAR(50) | NO | - | Precio total de la compra |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_proveedor` → `tb_proveedores.id_proveedor` (N:1)
- `id_usuario` → `tb_usuarios.id_usuario` (N:1)

**Relaciones inversas**:
- ← `tb_detalle_compras` (1:N) - Detalle de productos comprados

**Índices**:
- PRIMARY KEY: `id_compra`
- FOREIGN KEY: `id_proveedor`, `id_usuario`

---

### tb_detalle_compras

**Descripción**: Detalle de productos incluidos en cada compra.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_detalle_compra` | INT(11) | NO | AUTO_INCREMENT | ID único del detalle (PK) |
| `nro_compra` | INT(11) | NO | - | Número de compra |
| `id_producto` | INT(11) | NO | - | Producto comprado (FK → tb_almacen) |
| `cantidad` | INT(11) | NO | - | Cantidad comprada |
| `precio_compra` | VARCHAR(50) | NO | - | Precio de compra unitario |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_producto` → `tb_almacen.id_producto` (N:1)

**Índices**:
- PRIMARY KEY: `id_detalle_compra`
- FOREIGN KEY: `id_producto`

---

### tb_proveedores

**Descripción**: Catálogo de proveedores.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_proveedor` | INT(11) | NO | AUTO_INCREMENT | ID único del proveedor (PK) |
| `nombre_proveedor` | VARCHAR(255) | NO | - | Nombre del proveedor |
| `celular` | VARCHAR(50) | NO | - | Teléfono de contacto |
| `telefono` | VARCHAR(50) | YES | NULL | Teléfono fijo |
| `empresa` | VARCHAR(255) | NO | - | Nombre de la empresa |
| `email` | VARCHAR(255) | YES | NULL | Email del proveedor |
| `direccion` | VARCHAR(255) | NO | - | Dirección |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones inversas**:
- ← `tb_compras` (1:N) - Compras al proveedor

**Índices**:
- PRIMARY KEY: `id_proveedor`

---

## Tablas del Sistema de Ventas y Presupuestos

### tb_ventas

**Descripción**: Registro de ventas realizadas (punto de venta).

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_venta` | INT(11) | NO | AUTO_INCREMENT | ID único de la venta (PK) |
| `nro_venta` | INT(11) | NO | - | Número de venta |
| `id_cliente` | INT(11) | NO | - | Cliente (FK → tb_clientes) |
| `total_pagado` | VARCHAR(255) | NO | - | Total pagado |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_cliente` → `tb_clientes.id_cliente` (N:1)

**Índices**:
- PRIMARY KEY: `id_venta`
- FOREIGN KEY: `id_cliente`

---

### tb_presupuestos

**Descripción**: Presupuestos/cotizaciones generadas para clientes.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_presupuesto` | INT(11) | NO | AUTO_INCREMENT | ID único del presupuesto (PK) |
| `nro_presupuesto` | INT(11) | NO | - | Número de presupuesto |
| `fecha_presupuesto` | DATE | NO | - | Fecha del presupuesto |
| `id_cliente` | INT(11) | NO | - | Cliente (FK → tb_clientes) |
| `total_presupuesto` | VARCHAR(50) | NO | - | Total del presupuesto |
| `estado` | ENUM | NO | 'pendiente' | Estado (pendiente, aprobado, rechazado) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_cliente` → `tb_clientes.id_cliente` (N:1)

**Relaciones inversas**:
- ← `tb_presupuesto_detalles` (1:N) - Detalle de productos cotizados

**Índices**:
- PRIMARY KEY: `id_presupuesto`
- FOREIGN KEY: `id_cliente`

---

### tb_presupuesto_detalles

**Descripción**: Detalle de productos incluidos en cada presupuesto.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_detalle_presupuesto` | INT(11) | NO | AUTO_INCREMENT | ID único del detalle (PK) |
| `id_presupuesto` | INT(11) | NO | - | Presupuesto (FK → tb_presupuestos) |
| `id_producto` | INT(11) | NO | - | Producto cotizado (FK → tb_almacen) |
| `cantidad` | INT(11) | NO | - | Cantidad cotizada |
| `precio_unitario` | DECIMAL(10,2) | NO | - | Precio unitario |
| `subtotal` | DECIMAL(10,2) | NO | - | Subtotal (cantidad × precio) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |

**Relaciones**:
- `id_presupuesto` → `tb_presupuestos.id_presupuesto` (N:1)
- `id_producto` → `tb_almacen.id_producto` (N:1)

**Índices**:
- PRIMARY KEY: `id_detalle_presupuesto`
- FOREIGN KEY: `id_presupuesto`, `id_producto`

---

## Tablas del Sistema de Devoluciones

### tb_devoluciones

**Descripción**: Registro de devoluciones de productos.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_devolucion` | INT(11) | NO | AUTO_INCREMENT | ID único de la devolución (PK) |
| `nro_devolucion` | INT(11) | NO | - | Número de devolución |
| `fecha_devolucion` | DATE | NO | - | Fecha de la devolución |
| `id_venta` | INT(11) | YES | NULL | Venta relacionada (FK → tb_ventas) |
| `motivo` | TEXT | YES | NULL | Motivo de la devolución |
| `total_devolucion` | DECIMAL(10,2) | NO | - | Total devuelto |
| `estado` | ENUM | NO | 'pendiente' | Estado (pendiente, aprobado, rechazado) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_venta` → `tb_ventas.id_venta` (N:1, opcional)

**Relaciones inversas**:
- ← `tb_detalle_devoluciones` (1:N) - Detalle de productos devueltos

**Índices**:
- PRIMARY KEY: `id_devolucion`
- FOREIGN KEY: `id_venta`

---

### tb_detalle_devoluciones

**Descripción**: Detalle de productos incluidos en cada devolución.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_detalle_devolucion` | INT(11) | NO | AUTO_INCREMENT | ID único del detalle (PK) |
| `id_devolucion` | INT(11) | NO | - | Devolución (FK → tb_devoluciones) |
| `id_producto` | INT(11) | NO | - | Producto devuelto (FK → tb_almacen) |
| `cantidad` | INT(11) | NO | - | Cantidad devuelta |
| `precio_unitario` | DECIMAL(10,2) | NO | - | Precio unitario |
| `subtotal` | DECIMAL(10,2) | NO | - | Subtotal devuelto |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |

**Relaciones**:
- `id_devolucion` → `tb_devoluciones.id_devolucion` (N:1)
- `id_producto` → `tb_almacen.id_producto` (N:1)

**Índices**:
- PRIMARY KEY: `id_detalle_devolucion`
- FOREIGN KEY: `id_devolucion`, `id_producto`

---

## Tablas del Sistema Administrativo

### tb_usuarios

**Descripción**: Usuarios administradores del sistema.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_usuario` | INT(11) | NO | AUTO_INCREMENT | ID único del usuario (PK) |
| `nombres` | VARCHAR(255) | NO | - | Nombres del usuario |
| `email` | VARCHAR(255) | NO | - | Email del usuario (UNIQUE) |
| `password_user` | TEXT | NO | - | Hash de la contraseña |
| `token` | VARCHAR(100) | NO | - | Token de autenticación |
| `id_rol` | INT(11) | NO | - | Rol del usuario (FK → tb_roles) |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_rol` → `tb_roles.id_rol` (N:1)

**Relaciones inversas**:
- ← `tb_almacen` (1:N) - Productos registrados por el usuario
- ← `tb_compras` (1:N) - Compras registradas
- ← `tb_comentarios_productos` (1:N) - Respuestas admin a comentarios

**Índices**:
- PRIMARY KEY: `id_usuario`
- UNIQUE: `email`
- FOREIGN KEY: `id_rol`

**Diferencia con tb_clientes**:
- `tb_usuarios`: Administradores del sistema (backend/punto de venta)
- `tb_clientes`: Clientes de la tienda web (frontend)

---

### tb_roles

**Descripción**: Roles y permisos de usuarios administradores.

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_rol` | INT(11) | NO | AUTO_INCREMENT | ID único del rol (PK) |
| `nombre_rol` | VARCHAR(255) | NO | - | Nombre del rol |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones inversas**:
- ← `tb_usuarios` (1:N) - Usuarios con este rol

**Índices**:
- PRIMARY KEY: `id_rol`

**Ejemplos de Roles**:
- Administrador (acceso total)
- Vendedor (solo ventas)
- Almacenero (solo inventario)

---

### tb_carrito

**Descripción**: Carrito del punto de venta (sistema legacy).

**Columnas**:

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| `id_carrito` | INT(11) | NO | AUTO_INCREMENT | ID único del carrito (PK) |
| `nro_venta` | INT(11) | NO | - | Número de venta |
| `id_producto` | INT(11) | NO | - | Producto (FK → tb_almacen) |
| `cantidad` | INT(11) | NO | - | Cantidad |
| `fyh_creacion` | DATETIME | NO | - | Fecha y hora de creación |
| `fyh_actualizacion` | DATETIME | NO | - | Fecha y hora de última actualización |

**Relaciones**:
- `id_producto` → `tb_almacen.id_producto` (N:1)

**Índices**:
- PRIMARY KEY: `id_carrito`
- FOREIGN KEY: `id_producto`

**Nota**: Este es el carrito del sistema antiguo de punto de venta. El carrito web usa `tb_carritosweb` y `tb_carritoweb_items`.

---

## Diagrama de Relaciones (Resumen)

### Flujo Principal de Datos

```
PRODUCTOS
├── tb_almacen (productos)
│   ├── → tb_categorias (categoría)
│   ├── → tb_marcas (marca)
│   ├── → tb_usuarios (registrado por)
│   ├── ← tb_producto_imagenes (imágenes)
│   ├── ← tb_producto_caracteristicas (especificaciones)
│   │   └── → tb_tipos_caracteristicas (tipos de specs)
│   └── ← tb_productos_ofertas (ofertas aplicadas)
│       └── → tb_ofertas (oferta)

CLIENTES Y CARRITO WEB
├── tb_clientes (clientes web)
│   ├── ← tb_carritosweb (carritos)
│   │   └── ← tb_carritoweb_items (items)
│   │       └── → tb_almacen (producto)
│   ├── ← tb_direcciones (direcciones)
│   ├── ← tb_favoritos (favoritos)
│   │   └── → tb_almacen (producto)
│   └── ← tb_comentarios_productos (comentarios)
│       ├── → tb_almacen (producto)
│       └── ← tb_comentario_imagenes (imágenes)

COMPRAS Y PROVEEDORES
├── tb_proveedores (proveedores)
│   └── ← tb_compras (compras)
│       ├── → tb_usuarios (registrado por)
│       └── ← tb_detalle_compras (detalle)
│           └── → tb_almacen (producto)

VENTAS Y PRESUPUESTOS
├── tb_ventas (ventas POS)
│   ├── → tb_clientes (cliente)
│   └── ← tb_devoluciones (devoluciones)
│       └── ← tb_detalle_devoluciones (detalle)
│           └── → tb_almacen (producto)
└── tb_presupuestos (cotizaciones)
    ├── → tb_clientes (cliente)
    └── ← tb_presupuesto_detalles (detalle)
        └── → tb_almacen (producto)

USUARIOS ADMIN
└── tb_usuarios (administradores)
    └── → tb_roles (rol)
```

---

## Índices y Constraints

### Primary Keys (PKs)
Todas las tablas tienen un `id_*` como PRIMARY KEY con AUTO_INCREMENT.

### Foreign Keys (FKs)
Las relaciones principales son:
- **Productos**: `id_categoria`, `id_marca`, `id_usuario`
- **Clientes**: Ninguna FK (tabla raíz)
- **Carrito**: `id_cliente`, `id_producto`
- **Compras**: `id_proveedor`, `id_usuario`
- **Comentarios**: `id_producto`, `id_cliente`

### Unique Constraints
- `tb_clientes.email_cliente` (UNIQUE)
- `tb_clientes.google_id` (UNIQUE)
- `tb_usuarios.email` (UNIQUE)
- `(id_carrito, id_producto)` en `tb_carritoweb_items`
- `(id_cliente, id_producto)` en `tb_favoritos`
- `(id_producto, id_oferta)` en `tb_productos_ofertas`
- `(id_producto, id_tipo_caracteristica)` en `tb_producto_caracteristicas`

---

## Estadísticas de la Base de Datos

| Métrica | Valor |
|---------|-------|
| **Total de tablas** | 26 |
| **Tablas de catálogo** | 6 (almacen, categorías, marcas, ofertas, tipos_caracteristicas, roles) |
| **Tablas relacionales** | 10 (producto_imagenes, producto_caracteristicas, productos_ofertas, carritoweb_items, etc.) |
| **Tablas de transacciones** | 6 (carritosweb, compras, ventas, presupuestos, devoluciones, comentarios) |
| **Tablas de usuarios** | 2 (clientes, usuarios) |
| **Tablas de detalle** | 4 (detalle_compras, detalle_devoluciones, presupuesto_detalles, carritoweb_items) |

---

## Migraciones Recientes

### Versión 4 (Actual)
- ✅ Sistema de carritos web completamente implementado
- ✅ Google OAuth 2.0 integrado en `tb_clientes`
- ✅ Sistema de comentarios con imágenes
- ✅ Productos destacados con orden personalizado
- ✅ Direcciones de envío con tipo y dirección principal
- ✅ Características de productos tipadas

### Pendientes de Optimización
- ⏳ Cambiar `precio_compra` y `precio_venta` de VARCHAR a DECIMAL
- ⏳ Agregar índices FULLTEXT en campos de búsqueda
- ⏳ Implementar soft delete en más tablas
- ⏳ Agregar timestamps automáticos (CURRENT_TIMESTAMP ON UPDATE)

Para más detalles, ver [IMPROVEMENTS_PLAN.md](./IMPROVEMENTS_PLAN.md)

---

## Diagramas de Relaciones

Para visualizar las relaciones entre todas las tablas del sistema, consulta:

### ✅ [DIAGRAMS.md](./DIAGRAMS.md) - Diagramas ER Completos

El archivo contiene 5 diagramas detallados en formato Mermaid:

1. **Diagrama ER General** - Vista completa de las 26 tablas y sus relaciones
2. **Sistema de Productos** - Catálogo, imágenes, características y ofertas
3. **Sistema de Clientes y Carrito Web** - Clientes, carritos, favoritos y comentarios
4. **Sistema de Compras y Ventas** - Proveedores, ventas, presupuestos y devoluciones
5. **Sistema de Usuarios Admin** - Administradores y roles

**Ventajas**:
- Visualización automática en GitHub y VSCode
- Se versionan con Git (código, no imágenes)
- Fáciles de actualizar

---

## Backup y Restauración

### Crear Backup
```bash
mysqldump -u root -p db_tecnocel_v4 > database/backups/db_tecnocel_v4_$(date +%Y%m%d).sql
```

### Restaurar Backup
```bash
mysql -u root -p db_tecnocel_v4 < database/backups/db_tecnocel_v4.sql
```

### Backup Solo Estructura (sin datos)
```bash
mysqldump -u root -p --no-data db_tecnocel_v4 > schema_only.sql
```

---

## Recursos Adicionales

- [DIAGRAMS.md](./DIAGRAMS.md) - 5 Diagramas ER completos en Mermaid
- [IMPROVEMENTS_PLAN.md](./IMPROVEMENTS_PLAN.md) - Plan de mejoras de la BD
- [Documentación de API](../api/README.md)
- [README Database](./README.md)

---

[Volver arriba](#-esquema-de-base-de-datos) | [Base de Datos](README.md) | [Documentación](../README.md) | [Inicio](../../README.md)
