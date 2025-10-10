**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](README.md)** | **[Inicio](../README.md)**

---

# 🗄️ Modelos de Datos (Visión de Base de Datos)

> Descripción de entidades y relaciones a nivel de base de datos. Para detalles de implementación en Sequelize, ver `docs/api/reference/MODELS.md`.

---

## Tabla de Contenidos

- [Resumen](#resumen)
- [Entidades Principales](#entidades-principales)
- [Relaciones](#relaciones)
- [Notas de Integridad](#notas-de-integridad)
- [Migraciones y Evolución](#migraciones-y-evolución)
- [Consultas Comunes](#consultas-comunes)

---

## Resumen

El sistema modela un e-commerce con catálogo de productos, clientes y operaciones de venta. Las tablas y columnas están documentadas en detalle en `SCHEMA.md`. Este documento resume las entidades clave y cómo se relacionan.

---

## Entidades Principales

- `tb_almacen` — Productos (stock, precios, destacado, marca, categoría).
- `tb_categorias` — Jerarquía de categorías.
- `tb_marcas` — Marcas y metadatos.
- `tb_clientes` — Clientes web (estado `is_web_enabled`, `email_verified`).
- `tb_direcciones` — Direcciones de clientes.
- `tb_favoritos` — Relación cliente↔producto.
- `tb_tipos_caracteristicas` — Definición de atributos configurables.
- `tb_productos_caracteristicas` — Valores por producto (N:M con payload `valor`).
- `tb_ofertas` — Ofertas activas.
- `tb_productos_ofertas` — Join producto↔oferta con `precio_oferta`.
- `tb_productos_imagenes` — Imágenes por producto.
- `tb_carritos_web` y `tb_carritos_web_items` — Carrito de compras y sus ítems.
- `tb_usuarios`, `tb_roles` — Usuarios internos y sus roles.

---

## Relaciones

- Producto 1:N `tb_productos_imagenes`
- Producto N:M `tb_tipos_caracteristicas` vía `tb_productos_caracteristicas`
- Producto N:M `tb_ofertas` vía `tb_productos_ofertas`
- Cliente 1:N `tb_direcciones`
- Cliente N:M Producto vía `tb_favoritos`
- CarritoWeb 1:N `tb_carritos_web_items`
- Usuario N:1 `tb_roles`

Ver diagrama y claves foráneas en `docs/database/DIAGRAMS.md` y `SCHEMA.md`.

---

## Notas de Integridad

- Validar `email_verified` y `is_web_enabled` antes de conceder acceso de cliente.
- Mantener consistencia de stock en operaciones de carrito/venta.
- Borrar en cascada imágenes y características al eliminar producto (si aplica en capa de negocio).

---

## Migraciones y Evolución

- Las migraciones se encuentran en `database/migrations/`.
- Ejemplos relevantes:
  - `update_featured_products.sql` — Destacados y orden.
  - `create_comentarios_sistema.sql` — Comentarios e imágenes.

> Sugerido: documentar nuevas migraciones en `MIGRATIONS.md` (pendiente en el plan).

---

## Consultas Comunes

Consultar `docs/database/QUERIES.md` (pendiente) para patrones optimizados:

- Productos con ofertas vigentes.
- Búsqueda por texto en catálogo (`nombre`, `codigo`).
- Paginación por categoría y ordenamiento.

---

**Última actualización**: 9 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](README.md)** | **[Inicio](../README.md)**
