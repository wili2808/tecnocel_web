**[Documentación](../README.md)** | **[Inicio](../../README.md)**

---

# Modelos (Sequelize) - Referencia Técnica

> Listado de modelos de datos utilizados por la API, con resumen de responsabilidades y asociaciones clave.

---

## Tabla de Contenidos

- [Resumen](#resumen)
- [Listado de Modelos](#listado-de-modelos)
- [Asociaciones](#asociaciones)
- [Inicialización](#inicialización)
- [Recursos Relacionados](#recursos-relacionados)

---

## Resumen

Los modelos están definidos con Sequelize y se inicializan en `backend/src/models/index.ts`, donde también se importan las asociaciones desde `relaciones.ts`. El esquema físico y columnas están documentados en `docs/database/SCHEMA.md`.

---

## Listado de Modelos

> Total: 26 modelos de dominio (excluye `index.ts` y `relaciones.ts`).

- `Almacen` — Productos del catálogo (stock, precios, destacados).
- `Carrito` — Carritos (legacy/administración).
- `CarritoWeb` — Carrito de cliente web.
- `CarritoWebItems` — Ítems del carrito web.
- `Categoria` — Categorías del catálogo.
- `Cliente` — Clientes registrados para la web.
- `Comentario` — Comentarios de productos.
- `ComentarioImagen` — Imágenes asociadas a comentarios.
- `Compra` — Compras a proveedores.
- `DetalleCompra` — Detalles de compras.
- `DetalleDevolucion` — Detalles de devoluciones.
- `Devolucion` — Devoluciones de ventas.
- `Direccion` — Direcciones de envío.
- `Favorito` — Productos favoritos de clientes.
- `Marca` — Marcas de productos.
- `Oferta` — Ofertas vigentes.
- `Presupuesto` — Presupuestos emitidos.
- `PresupuestoDetalle` — Detalle de presupuestos.
- `ProductoCaracteristica` — Valores de características por producto.
- `ProductoImagen` — Imágenes de producto.
- `ProductoOferta` — Join de producto↔oferta.
- `Proveedor` — Proveedores.
- `Rol` — Roles de usuarios internos.
- `TipoCaracteristica` — Definición de características (tipo, unidad, opciones).
- `Usuario` — Usuarios internos (staff/admin).
- `Venta` — Ventas realizadas.

---

## Asociaciones

Archivo: `backend/src/models/relaciones.ts`

- Producto (`Almacen`) ↔ `Categoria`, `Marca`, `ProductoImagen` (1:N)
- Producto ↔ `TipoCaracteristica` vía `ProductoCaracteristica` (N:M con atributos: `valor`).
- Producto ↔ `Oferta` vía `ProductoOferta` (N:M con atributo: `precio_oferta`).
- Cliente ↔ `Direccion` (1:N)
- Cliente ↔ `Favorito` ↔ Producto (N:M)
- CarritoWeb ↔ CarritoWebItems (1:N) e Item ↔ Producto (N:1)
- Usuario ↔ Rol (N:1)

> Consultar `docs/database/SCHEMA.md` para claves foráneas y columnas.

---

## Inicialización

- `backend/src/models/index.ts` importa todos los modelos de dominio y, al final, `./relaciones.js` para registrar asociaciones.
- La conexión Sequelize se configura en `backend/src/config/database.ts`.

---

## Recursos Relacionados

- [Esquema de Base de Datos](../../database/SCHEMA.md)
- [Plan de Mejoras BD](../../database/IMPROVEMENTS_PLAN.md)
- [Análisis de Rutas](./ROUTES_ANALYSIS.md)
- [Controladores](./CONTROLLERS.md)

---

**Última actualización**: 9 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../README.md)** | **[Inicio](../../README.md)**
