# Ejemplos de Uso de la API

> Colección de ejemplos prácticos para consumir la API de TecnoCel Web.

---

## Productos

```bash
# Listar productos
curl http://localhost:3000/api/almacen/productos

# Buscar productos por término
curl "http://localhost:3000/api/almacen/productos/buscar?termino=iphone"

# Filtrar y paginar
curl "http://localhost:3000/api/almacen/productos?categoria=telefonia&page=2&limit=12&sortBy=precio&order=asc"
```

## Marcas

```bash
# Listar marcas
curl http://localhost:3000/api/marcas
```

## Carrito (requiere token)

```bash
# Obtener carrito del usuario
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/carrito

# Agregar producto al carrito
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"id_producto": 123, "cantidad": 1}' \
  http://localhost:3000/api/carrito
```

## Comentarios (upload de imágenes)

```bash
# Crear comentario con imagen (form-data)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -F "comentario=Excelente producto" \
  -F "valoracion=5" \
  -F "imagen=@./mi-foto.jpg" \
  http://localhost:3000/api/comentarios
```

---

Última actualización: 9 de Octubre, 2025
