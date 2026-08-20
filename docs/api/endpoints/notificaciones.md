**[Endpoints](../ENDPOINTS.md)** | **[Documentación](../../README.md)**
---

# Endpoint: Notificaciones

Sistema de notificaciones in-app para clientes. Las notificaciones se disparan automáticamente en respuesta a eventos del sistema (respuestas de comentarios, confirmación de ventas, etc.).

**Base URL**: `/api/notificaciones`
**Autenticación**: Requerida (JWT Cliente)
**Métodos**: GET, PUT, DELETE

---

## Tabla de Contenidos

- [Listar Notificaciones](#listar-notificaciones)
- [Notificaciones No Leídas](#notificaciones-no-leídas)
- [Marcar Todas como Leídas](#marcar-todas-como-leídas)
- [Marcar Notificación como Leída](#marcar-notificación-como-leída)
- [Eliminar Notificación](#eliminar-notificación)
- [Tipos de Notificación](#tipos-de-notificación)

---

## Listar Notificaciones

Obtiene todas las notificaciones del cliente autenticado.

```http
GET /api/notificaciones
```

### Autenticación

- **Tipo**: JWT Cliente
- **Header**: `Authorization: Bearer {token}`

### Parámetros de Query (Opcionales)

| Parámetro | Tipo    | Descripción                      |
| --------- | ------- | -------------------------------- |
| `limit`   | number  | Límite de resultados (default: 20) |
| `offset`  | number  | Desplazamiento (default: 0)        |

### Respuesta (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id_notificacion": 1,
      "id_cliente": 5,
      "tipo": "respuesta_admin",
      "titulo": "Respuesta a tu comentario",
      "mensaje": "El administrador respondió: Gracias por tu pregunta...",
      "referencia_id": 15,
      "referencia_tipo": "comentario",
      "leida": false,
      "fyh_creacion": "2026-03-20T10:30:00Z"
    }
  ]
}
```

---

## Notificaciones No Leídas

Obtiene solo las notificaciones sin leer.

```http
GET /api/notificaciones/no-leidas
```

### Autenticación

- **Tipo**: JWT Cliente
- **Header**: `Authorization: Bearer {token}`

### Respuesta (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id_notificacion": 1,
      "tipo": "respuesta_admin",
      "titulo": "Respuesta a tu comentario",
      "mensaje": "El administrador respondió...",
      "leida": false,
      "fyh_creacion": "2026-03-20T10:30:00Z"
    }
  ],
  "count": 3
}
```

---

## Marcar Todas como Leídas

Marca todas las notificaciones del cliente como leídas.

```http
PUT /api/notificaciones/leer-todas
```

### Autenticación

- **Tipo**: JWT Cliente
- **Header**: `Authorization: Bearer {token}`

### Respuesta (200 OK)

```json
{
  "success": true,
  "message": "3 notificaciones marcadas como leídas"
}
```

---

## Marcar Notificación como Leída

Marca una notificación específica como leída.

```http
PUT /api/notificaciones/:id/leer
```

### Parámetros de Ruta

| Parámetro | Tipo   | Descripción          |
| --------- | ------ | -------------------- |
| `id`      | number | ID de la notificación |

### Autenticación

- **Tipo**: JWT Cliente
- **Header**: `Authorization: Bearer {token}`

### Respuesta (200 OK)

```json
{
  "success": true,
  "data": {
    "id_notificacion": 1,
    "leida": true
  }
}
```

---

## Eliminar Notificación

Elimina una notificación del cliente.

```http
DELETE /api/notificaciones/:id
```

### Parámetros de Ruta

| Parámetro | Tipo   | Descripción          |
| --------- | ------ | -------------------- |
| `id`      | number | ID de la notificación |

### Autenticación

- **Tipo**: JWT Cliente
- **Header**: `Authorization: Bearer {token}`

### Respuesta (200 OK)

```json
{
  "success": true,
  "message": "Notificación eliminada correctamente"
}
```

### Respuesta de Error (404 Not Found)

```json
{
  "error": "Notificación no encontrada"
}
```

---

## Tipos de Notificación

El campo `tipo` puede ser uno de los siguientes:

| Tipo                   | Disparo                                    | Destinatario      |
| ---------------------- | ------------------------------------------ | ----------------- |
| `respuesta_admin`      | Admin responde comentario del cliente      | Cliente comentario |
| `respuesta_cliente`    | Otro cliente responde comentario           | Cliente comentario |
| `comentario_moderado`  | Admin modera/cambia estado de comentario   | Cliente comentario |
| `venta_confirmada`     | Compra web confirmada y pagada             | Cliente comprador  |
| `venta_cancelada`      | Admin/gerente cancela venta del cliente    | Cliente vendedor   |

---

## Flujo Típico de Notificaciones

1. **Usuario compra** → `venta_confirmada`
2. **Usuario comenta en producto** → espera respuesta
3. **Admin responde el comentario** → `respuesta_admin`
4. **Admin modera el comentario** → `comentario_moderado`
5. **Admin cancela venta** → `venta_cancelada`

El frontend implementa polling cada 45 segundos para sincronizar notificaciones sin necesidad de WebSockets.

---

**Última actualización:** 20 de Marzo, 2026
