# 📊 Diagramas ER - Base de Datos TecnoCel Web

**Base de datos**: `db_tecnocel_v4`
**Motor**: MariaDB 10.4.27 / MySQL 8.0+
**Total de tablas**: 28

---

## 📋 Índice de Diagramas

1. [Diagrama ER General - Vista Completa](#diagrama-er-general---vista-completa)
2. [Sistema de Productos](#diagrama-sistema-de-productos)
3. [Sistema de Clientes y Carrito Web](#diagrama-sistema-de-clientes-y-carrito-web)
4. [Sistema de Compras y Ventas](#diagrama-sistema-de-compras-y-ventas)
5. [Sistema de Usuarios Admin](#diagrama-sistema-de-usuarios-admin)

---

## Diagrama ER General - Vista Completa

Este diagrama muestra todas las relaciones entre las 28 tablas del sistema.

```mermaid
erDiagram
    %% PRODUCTOS Y CATÁLOGO
    tb_almacen ||--o{ tb_producto_imagenes : "tiene"
    tb_almacen ||--o{ tb_producto_caracteristicas : "tiene"
    tb_almacen ||--o{ tb_productos_ofertas : "tiene"
    tb_almacen }o--|| tb_categorias : "pertenece a"
    tb_almacen }o--|| tb_marcas : "pertenece a"
    tb_almacen }o--|| tb_usuarios : "registrado por"

    %% CARACTERÍSTICAS
    tb_producto_caracteristicas }o--|| tb_tipos_caracteristicas : "tipo"

    %% OFERTAS
    tb_productos_ofertas }o--|| tb_ofertas : "aplica"

    %% CLIENTES Y AUTENTICACIÓN
    tb_clientes ||--o{ tb_carritosweb : "tiene"
    tb_clientes ||--o{ tb_direcciones : "tiene"
    tb_clientes ||--o{ tb_favoritos : "tiene"
    tb_clientes ||--o{ tb_comentarios_productos : "escribe"
    tb_clientes ||--o{ tb_ventas : "compra"
    tb_clientes ||--o{ tb_presupuestos : "solicita"

    %% CARRITO WEB
    tb_carritosweb ||--o{ tb_carritoweb_items : "contiene"
    tb_carritoweb_items }o--|| tb_almacen : "producto"

    %% FAVORITOS
    tb_favoritos }o--|| tb_almacen : "producto"

    %% COMENTARIOS
    tb_comentarios_productos }o--|| tb_almacen : "producto"
    tb_comentarios_productos ||--o{ tb_comentario_imagenes : "tiene"
    tb_comentarios_productos }o--o| tb_usuarios : "respondido por"

    %% COMPRAS Y PROVEEDORES
    tb_compras }o--|| tb_proveedores : "de"
    tb_compras }o--|| tb_usuarios : "registrado por"
    tb_compras ||--o{ tb_detalle_compras : "contiene"
    tb_detalle_compras }o--|| tb_almacen : "producto"

    %% PRESUPUESTOS
    tb_presupuestos ||--o{ tb_presupuesto_detalles : "contiene"
    tb_presupuesto_detalles }o--|| tb_almacen : "producto"

    %% VENTAS Y DEVOLUCIONES
    tb_ventas ||--o{ tb_devoluciones : "puede tener"
    tb_devoluciones ||--o{ tb_detalle_devoluciones : "contiene"
    tb_detalle_devoluciones }o--|| tb_almacen : "producto"

    %% USUARIOS ADMIN
    tb_usuarios }o--|| tb_roles : "tiene rol"

    %% CARRITO POS (LEGACY)
    tb_carrito }o--|| tb_almacen : "producto"

    %% NOTIFICACIONES
    tb_notificaciones }o--|| tb_clientes : "para"

    %% ENVÍOS
    tb_envios }o--|| tb_ventas : "de venta"
    tb_envios }o--|| tb_direcciones : "entrega en"
```

**Leyenda de Cardinalidad**:
- `||--o{` : Uno a muchos (1:N)
- `}o--||` : Muchos a uno (N:1)
- `}o--o{` : Muchos a muchos (N:M)
- `}o--o|` : Muchos a uno opcional

---

## Diagrama: Sistema de Productos

Sistema completo de gestión de productos con catálogo, imágenes, características y ofertas.

```mermaid
erDiagram
    tb_almacen {
        int id_producto PK
        varchar codigo
        varchar nombre
        text descripcion
        int stock
        varchar precio_venta
        int id_categoria FK
        int id_marca FK
        int id_usuario FK
        tinyint es_destacado
    }

    tb_categorias {
        int id_categoria PK
        varchar nombre_categoria
    }

    tb_marcas {
        int id_marca PK
        varchar nombre_marca
        varchar logo_url
        tinyint activo
    }

    tb_producto_imagenes {
        int id_imagen PK
        int id_producto FK
        text url_imagen
        varchar alt_text
        tinyint es_principal
        int orden
    }

    tb_producto_caracteristicas {
        int id_producto_caracteristica PK
        int id_producto FK
        int id_tipo_caracteristica FK
        text valor
    }

    tb_tipos_caracteristicas {
        int id_tipo PK
        varchar nombre_tipo
        varchar unidad_medida
        enum tipo_dato
    }

    tb_ofertas {
        int id_oferta PK
        varchar nombre_oferta
        enum tipo_descuento
        decimal valor_descuento
        datetime fecha_inicio
        datetime fecha_fin
        tinyint activo
    }

    tb_productos_ofertas {
        int id_producto_oferta PK
        int id_producto FK
        int id_oferta FK
        decimal precio_oferta
    }

    tb_almacen }o--|| tb_categorias : "pertenece a"
    tb_almacen }o--|| tb_marcas : "de marca"
    tb_almacen ||--o{ tb_producto_imagenes : "tiene imágenes"
    tb_almacen ||--o{ tb_producto_caracteristicas : "tiene specs"
    tb_almacen ||--o{ tb_productos_ofertas : "tiene ofertas"
    tb_producto_caracteristicas }o--|| tb_tipos_caracteristicas : "tipo"
    tb_productos_ofertas }o--|| tb_ofertas : "aplica oferta"
```

**Tablas involucradas**: 8
- `tb_almacen` (principal)
- `tb_categorias`, `tb_marcas` (catálogos)
- `tb_producto_imagenes` (multimedia)
- `tb_producto_caracteristicas`, `tb_tipos_caracteristicas` (especificaciones técnicas)
- `tb_ofertas`, `tb_productos_ofertas` (descuentos y promociones)

**Relaciones clave**:
- Un producto pertenece a una categoría y marca
- Un producto puede tener múltiples imágenes (1:N)
- Un producto puede tener múltiples características (1:N)
- Un producto puede tener múltiples ofertas (N:M vía tb_productos_ofertas)

---

## Diagrama: Sistema de Clientes y Carrito Web

Sistema de clientes con autenticación, carrito de compras, favoritos y comentarios.

```mermaid
erDiagram
    tb_clientes {
        int id_cliente PK
        varchar nombre_cliente
        varchar apellido_cliente
        varchar email_cliente UK
        varchar password_hash
        varchar google_id UK
        tinyint is_web_enabled
        datetime last_login
        tinyint email_verified
    }

    tb_direcciones {
        int id_direccion PK
        int id_cliente FK
        enum tipo_direccion
        varchar nombre_destinatario
        text direccion
        varchar ciudad
        tinyint es_principal
    }

    tb_carritosweb {
        int id_carrito PK
        int id_cliente FK
        enum estado
        decimal total_carrito
        datetime fyh_abandono
    }

    tb_carritoweb_items {
        int id_item PK
        int id_carrito FK
        int id_producto FK
        int cantidad
        decimal precio_unitario
        decimal subtotal
    }

    tb_favoritos {
        int id_favorito PK
        int id_cliente FK
        int id_producto FK
    }

    tb_comentarios_productos {
        int id_comentario PK
        int id_producto FK
        int id_cliente FK
        text comentario
        tinyint calificacion
        enum estado
        text respuesta_admin
    }

    tb_comentario_imagenes {
        int id_imagen PK
        int id_comentario FK
        text url_imagen
    }

    tb_almacen {
        int id_producto PK
        varchar nombre
        varchar precio_venta
    }

    tb_clientes ||--o{ tb_direcciones : "tiene direcciones"
    tb_clientes ||--o{ tb_carritosweb : "tiene carritos"
    tb_clientes ||--o{ tb_favoritos : "marca favoritos"
    tb_clientes ||--o{ tb_comentarios_productos : "escribe comentarios"
    tb_carritosweb ||--o{ tb_carritoweb_items : "contiene items"
    tb_carritoweb_items }o--|| tb_almacen : "producto"
    tb_favoritos }o--|| tb_almacen : "producto favorito"
    tb_comentarios_productos }o--|| tb_almacen : "sobre producto"
    tb_comentarios_productos ||--o{ tb_comentario_imagenes : "tiene imágenes"
```

**Tablas involucradas**: 8
- `tb_clientes` (principal)
- `tb_direcciones` (envío y facturación)
- `tb_carritosweb`, `tb_carritoweb_items` (carrito de compras)
- `tb_favoritos` (lista de deseos)
- `tb_comentarios_productos`, `tb_comentario_imagenes` (reseñas)
- `tb_almacen` (referencia a productos)

**Flujos principales**:
1. **Registro/Login**: Cliente se registra con email/password o Google OAuth
2. **Exploración**: Cliente navega productos y marca favoritos
3. **Compra**: Cliente agrega productos al carrito
4. **Envío**: Cliente selecciona dirección de entrega
5. **Post-compra**: Cliente deja comentarios y calificaciones

**Estados del carrito**:
- `activo`: En uso
- `completado`: Compra finalizada
- `abandonado`: Para remarketing

---

## Diagrama: Sistema de Compras y Ventas

Sistema completo de transacciones comerciales: compras a proveedores, ventas, presupuestos y devoluciones.

```mermaid
erDiagram
    tb_proveedores {
        int id_proveedor PK
        varchar nombre_proveedor
        varchar empresa
        varchar email
    }

    tb_compras {
        int id_compra PK
        int nro_compra
        date fecha_compra
        int id_proveedor FK
        int id_usuario FK
        varchar precio_total
    }

    tb_detalle_compras {
        int id_detalle_compra PK
        int nro_compra
        int id_producto FK
        int cantidad
        varchar precio_compra
    }

    tb_ventas {
        int id_venta PK
        int nro_venta
        int id_cliente FK
        varchar total_pagado
    }

    tb_presupuestos {
        int id_presupuesto PK
        int nro_presupuesto
        int id_cliente FK
        enum estado
        varchar total_presupuesto
    }

    tb_presupuesto_detalles {
        int id_detalle_presupuesto PK
        int id_presupuesto FK
        int id_producto FK
        int cantidad
        decimal precio_unitario
    }

    tb_devoluciones {
        int id_devolucion PK
        int nro_devolucion
        int id_venta FK
        text motivo
        enum estado
    }

    tb_detalle_devoluciones {
        int id_detalle_devolucion PK
        int id_devolucion FK
        int id_producto FK
        int cantidad
    }

    tb_almacen {
        int id_producto PK
        varchar nombre
    }

    tb_clientes {
        int id_cliente PK
        varchar nombre_cliente
    }

    tb_usuarios {
        int id_usuario PK
        varchar nombres
    }

    tb_proveedores ||--o{ tb_compras : "vende a"
    tb_usuarios ||--o{ tb_compras : "registra"
    tb_compras ||--o{ tb_detalle_compras : "detalle"
    tb_detalle_compras }o--|| tb_almacen : "producto"

    tb_clientes ||--o{ tb_ventas : "compra"
    tb_ventas ||--o{ tb_devoluciones : "puede devolver"
    tb_devoluciones ||--o{ tb_detalle_devoluciones : "detalle"
    tb_detalle_devoluciones }o--|| tb_almacen : "producto"

    tb_clientes ||--o{ tb_presupuestos : "solicita"
    tb_presupuestos ||--o{ tb_presupuesto_detalles : "detalle"
    tb_presupuesto_detalles }o--|| tb_almacen : "producto"
```

**Tablas involucradas**: 12

**Subsistema de Compras** (4 tablas):
- `tb_proveedores` - Proveedores
- `tb_compras` - Órdenes de compra
- `tb_detalle_compras` - Items comprados
- Relación con `tb_usuarios` (quien registra)

**Subsistema de Ventas** (2 tablas):
- `tb_ventas` - Ventas realizadas
- Relación con `tb_clientes`

**Subsistema de Presupuestos** (2 tablas):
- `tb_presupuestos` - Cotizaciones
- `tb_presupuesto_detalles` - Items cotizados
- Estados: pendiente, aprobado, rechazado

**Subsistema de Devoluciones** (2 tablas):
- `tb_devoluciones` - Registro de devoluciones
- `tb_detalle_devoluciones` - Items devueltos
- Estados: pendiente, aprobado, rechazado

**Flujos de negocio**:
1. **Compra**: Proveedor → Compra → Detalle → Actualiza stock
2. **Venta**: Cliente → Venta → Reduce stock
3. **Presupuesto**: Cliente solicita → Admin cotiza → Aprueba/Rechaza
4. **Devolución**: Cliente devuelve → Admin aprueba → Restaura stock

---

## Diagrama: Sistema de Usuarios Admin

Sistema de administración con roles y permisos.

```mermaid
erDiagram
    tb_usuarios {
        int id_usuario PK
        varchar nombres
        varchar email UK
        text password_user
        varchar token
        int id_rol FK
    }

    tb_roles {
        int id_rol PK
        varchar nombre_rol
    }

    tb_almacen {
        int id_producto PK
        int id_usuario FK
    }

    tb_compras {
        int id_compra PK
        int id_usuario FK
    }

    tb_comentarios_productos {
        int id_comentario PK
        int id_admin_respuesta FK
        text respuesta_admin
    }

    tb_usuarios }o--|| tb_roles : "tiene rol"
    tb_usuarios ||--o{ tb_almacen : "registra productos"
    tb_usuarios ||--o{ tb_compras : "registra compras"
    tb_usuarios ||--o{ tb_comentarios_productos : "responde comentarios"
```

**Tablas involucradas**: 5
- `tb_usuarios` - Administradores del sistema
- `tb_roles` - Roles (Administrador, Vendedor, Almacenero)
- Relaciones con productos, compras y comentarios

**Diferencia con tb_clientes**:
- `tb_usuarios`: Administradores del sistema backend/POS
- `tb_clientes`: Clientes de la tienda web

**Roles típicos**:
- **Administrador**: Acceso total
- **Vendedor**: Solo ventas
- **Almacenero**: Solo inventario

**Acciones de usuarios admin**:
1. Registrar productos en el almacén
2. Registrar compras a proveedores
3. Responder comentarios de clientes
4. Gestionar el sistema punto de venta

---

## 📚 Convenciones de Diagramas

### Tipos de Datos Comunes

| Tipo | Descripción |
|------|-------------|
| `int` | Entero, usualmente IDs |
| `varchar(n)` | Cadena de texto variable |
| `text` | Texto largo |
| `decimal(m,n)` | Número decimal (precios) |
| `datetime` | Fecha y hora |
| `date` | Solo fecha |
| `enum` | Lista de valores permitidos |
| `tinyint(1)` | Booleano (0 o 1) |

### Tipos de Claves

| Abreviación | Significado |
|-------------|-------------|
| `PK` | Primary Key (Clave Primaria) |
| `FK` | Foreign Key (Clave Foránea) |
| `UK` | Unique Key (Clave Única) |

### Cardinalidad de Relaciones

| Símbolo | Significado | Ejemplo |
|---------|-------------|---------|
| `||--o{` | Uno a Muchos (1:N) | Un cliente tiene muchos carritos |
| `}o--||` | Muchos a Uno (N:1) | Muchos productos pertenecen a una marca |
| `}o--o{` | Muchos a Muchos (N:M) | Productos y ofertas (vía tabla intermedia) |
| `}o--o|` | Muchos a Uno Opcional | Comentario puede tener respuesta admin |

---

## 🔍 Cómo Usar Estos Diagramas

### En Desarrollo

**Consultar relaciones**:
- Al hacer JOIN en SQL, verifica las FK en estos diagramas
- Al crear nuevas features, revisa qué tablas están relacionadas

**Diseñar nuevas funcionalidades**:
- Identifica qué tablas necesitas modificar/crear
- Verifica el impacto en tablas relacionadas

### En Documentación

**Para nuevos desarrolladores**:
- Primero revisa el diagrama general
- Luego profundiza en el subsistema específico
- Consulta [SCHEMA.md](./SCHEMA.md) para detalles de columnas

**Para diseño de features**:
- Usa estos diagramas en documentos de diseño
- Referencia específica: "Ver Diagrama de Clientes en DIAGRAMS.md"

---

## 📖 Recursos Relacionados

- [SCHEMA.md](./SCHEMA.md) - Documentación completa del esquema con todas las columnas
- [IMPROVEMENTS_PLAN.md](./IMPROVEMENTS_PLAN.md) - Plan de mejoras de la BD
- [README.md](./README.md) - Índice de documentación de database

---

**Última actualización**: 7 de Octubre, 2025
**Versión de la BD**: 4.0
**Formato**: Mermaid ERD (Entity Relationship Diagram)

[← Volver al índice de database](./README.md) | [← Volver a SCHEMA.md](./SCHEMA.md)

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../README.md)** | **[🏠 Inicio](../../README.md)**
