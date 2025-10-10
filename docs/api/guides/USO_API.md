# Guía de Uso de la API

> Cómo consumir la API de TecnoCel Web: autenticación, headers, paginación, filtros y buenas prácticas.

---

## Base URL

```
http://localhost:3000/api
```

## Autenticación

- Token JWT en el header `Authorization: Bearer <token>`.
- Registro y login retornan token. Ver `AUTHENTICATION.md`.

## Headers recomendados

- `Content-Type: application/json`
- `Accept: application/json`

## Paginación y filtros

- Paginación estándar: `?page=1&limit=10`
- Orden: `?sortBy=precio&order=asc`
- Búsquedas: `?termino=iphone`

## Formatos de respuesta

- Éxito y error: ver `docs/api/README.md#formato-de-respuestas`.

## Ejemplos rápidos (curl)

```bash
# Lista de productos, página 1, 12 por página
curl "http://localhost:3000/api/almacen/productos?page=1&limit=12"

# Con token (carrito)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/carrito
```

## Buenas prácticas

- Reutiliza una instancia HTTP (Axios) con interceptores para el token.
- Maneja 401/403 para refrescar sesión o redirigir a login.
- Respeta límites de `limit` para no cargar en exceso el backend.

---

Última actualización: 9 de Octubre, 2025
