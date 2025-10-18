**[Documentación](../../README.md)** | **[Inicio](../../../README.md)**

---

# Controladores del Backend (Referencia)

> Referencia técnica de los controladores Express. Incluye responsabilidades, dependencias clave y enlaces a documentación de endpoints.

---

## Tabla de Contenidos

- [Resumen](#resumen)
- [AlmacenController](#almacencontroller)
- [CaracteristicaController](#caracteristicacontroller)
- [CarritoController](#carritocontroller)
- [ClienteController](#clientecontroller)
- [ComentarioController](#comentariocontroller)
- [DireccionController](#direccioncontroller)
- [FavoritoController](#favoritocontroller)
- [GoogleAuthController](#googleauthcontroller)
- [MarcaController](#marcacontroller)
- [OfertaController](#ofertacontroller)
- [UploadController](#uploadcontroller)

---

## Resumen

Los controladores siguen un patrón REST y usan Sequelize para acceso a datos, `loggerService` para registro estructurado y, cuando aplica, `imageService` para URLs de imágenes. La autenticación y autorización se manejan con los middlewares `verificarToken`, `verificarTokenCliente` y `verificarRol`.

Enlaces útiles:

- [Índice de Endpoints](../ENDPOINTS.md)
- [Endpoints por módulo](../endpoints/)
- [Middleware de Autenticación](../reference/MIDDLEWARE.md)
- [Servicio de Imágenes](./IMAGES_SERVICE.md)

---

## AlmacenController

- **Responsabilidad**: Catálogo y productos del almacén (listar, detalle, crear, actualizar, eliminar, búsqueda, destacados, categorías).
- **Dependencias**: `Almacen`, `Categoria`, `Usuario`, `Marca`, `TipoCaracteristica`, `ProductoCaracteristica`, `Oferta`, `ProductoImagen`, `imageService`, `loggerService`.
- **Notas**:
  - Enriquecimiento de respuesta con URLs de imágenes vía `imageService`.
  - Inclusiones Sequelize para categorías, usuario creador, marca, características, ofertas activas e imágenes.
- **Endpoints**: ver `docs/api/endpoints/productos.md`.

---

## CaracteristicaController

- **Responsabilidad**: Gestión de características de productos y tipos de característica.
- **Dependencias**: `TipoCaracteristica`, `ProductoCaracteristica`, `loggerService`.
- **Endpoints**: ver `docs/api/endpoints/caracteristicas.md`.

---

## CarritoController

- **Responsabilidad**: Carrito de compras (crear carrito web, agregar/eliminar items, totales).
- **Dependencias**: `CarritoWeb`, `CarritoWebItems`, `Almacen`, `Oferta`, `ProductoImagen`, `loggerService`.
- **Auth**: `verificarTokenCliente` para operaciones del cliente.
- **Endpoints**: ver `docs/api/endpoints/carrito.md`.

---

## ClienteController

- **Responsabilidad**: Registro, login, verificación de email, recuperación/restablecimiento de contraseña y verificación de sesión.
- **Dependencias**: `Cliente`, `bcryptjs`, `jsonwebtoken`, `emailService`, `loggerService`.
- **Payload JWT**: `{ id_cliente, email }` con expiración `7d`.
- **Endpoints**: ver `docs/api/endpoints/clientes.md`.

---

## ComentarioController

- **Responsabilidad**: Comentarios de productos e imágenes asociadas.
- **Dependencias**: `Comentario`, `ComentarioImagen`, `Cliente`, `loggerService`.
- **Auth**: Clientes autenticados para crear/gestionar comentarios.
- **Endpoints**: ver `docs/api/endpoints/comentarios.md`.

---

## DireccionController

- **Responsabilidad**: Direcciones de envío de clientes.
- **Dependencias**: `Direccion`, `Cliente`, `loggerService`.
- **Auth**: `verificarTokenCliente`.
- **Endpoints**: ver `docs/api/endpoints/direcciones.md`.

---

## FavoritoController

- **Responsabilidad**: Lista de favoritos del cliente.
- **Dependencias**: `Favorito`, `Cliente`, `Almacen`, `loggerService`.
- **Auth**: `verificarTokenCliente`.
- **Endpoints**: ver `docs/api/endpoints/favoritos.md`.

---

## GoogleAuthController

- **Responsabilidad**: Login social con Google OAuth.
- **Flujo**:
  1. Recibe `access_token` de Google (frontend).
  2. Consulta `userinfo` de Google.
  3. Busca o crea `Cliente` y firma JWT.
  4. Actualiza `last_login` y retorna `{ token, cliente }`.
- **Dependencias**: `google-auth-library`, `fetch`, `Cliente`, `jsonwebtoken`, `sequelize.Op`, `loggerService`.
- **Endpoint**: `POST /api/clientes/google-login`.

---

## MarcaController

- **Responsabilidad**: Gestión de marcas (nombre, logo, descripción).
- **Dependencias**: `Marca`, `loggerService`.
- **Endpoints**: ver `docs/api/endpoints/marcas.md`.

---

## OfertaController

- **Responsabilidad**: Ofertas y precios promocionales de productos.
- **Dependencias**: `Oferta`, `ProductoOferta`, `Almacen`, `loggerService`.
- **Endpoints**: ver `docs/api/endpoints/ofertas.md`.

---

## UploadController

- **Responsabilidad**: Subida de imágenes (productos, comentarios) y validación.
- **Dependencias**: `imageService`, validaciones y almacenamiento.
- **Endpoints**: ver `docs/api/endpoints/upload.md`.

---

**Última actualización**: 9 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

**Relacionado con**:

- [Análisis de Rutas](./ROUTES_ANALYSIS.md)
- [Referencia de Modelos](./MODELS.md)
- [Middlewares](./MIDDLEWARE.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
