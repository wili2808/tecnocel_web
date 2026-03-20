**[Endpoints](../ENDPOINTS.md)** | **[Documentación](../../README.md)**

---

# Endpoint: Envíos (Admin)

Gestión administrativa de envíos y rastreo. Permite a administradores y gerentes consultar y actualizar el estado de los envíos.

**Base URL**: `/api/envios`
**Autenticación**: Requerida (Admin/Gerente) 🔒
**Métodos**: GET, PATCH

---

## Tabla de Contenidos

- [Listar Envíos](#listar-envíos)
- [Obtener Detalle de Envío](#obtener-detalle-de-envío)
- [Actualizar Estado](#actualizar-estado)
- [Estados Disponibles](#estados-disponibles)

---

## Listar Envíos

Obtiene la lista de todos los envíos del sistema. Solo accesible por administradores.

```http
GET /api/envios/admin
```

### Autenticación

- **Tipo**: JWT Admin (Admin o Gerente)
- **Header**: `Authorization: Bearer {token}`

### Parámetros de Query (Opcionales)

| Parámetro  | Tipo   | Descripción                          |
| ---------- | ------ | ------------------------------------ |
| `limit`    | number | Límite de resultados (default: 20)   |
| `offset`   | number | Desplazamiento (default: 0)          |
| `estado`   | string | Filtrar por estado (pendiente, enviado, entregado, cancelado) |
| `buscar`   | string | Buscar por número de tracking o cliente |

### Respuesta (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id_envio": 1,
      "id_venta": 42,
      "numero_tracking": "AR123456789",
      "estado": "enviado",
      "transportista": "OCA",
      "direccion_destino": {
        "id_direccion": 5,
        "destinatario": "Juan Pérez",
        "calle": "Av. Libertador 1234",
        "ciudad": "Buenos Aires",
        "provincia": "CABA",
        "codigo_postal": "1001",
        "pais": "Argentina"
      },
      "costo_envio": 250.00,
      "moneda": "ARS",
      "fecha_envio": "2026-03-18T14:30:00Z",
      "fecha_entrega_estimada": "2026-03-22T18:00:00Z",
      "fecha_entrega_actual": null,
      "notas": "Dejar en portería si no hay respuesta",
      "fyh_creacion": "2026-03-16T10:00:00Z",
      "fyh_actualizacion": "2026-03-18T14:30:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

## Obtener Detalle de Envío

Obtiene la información completa de un envío específico.

```http
GET /api/envios/admin/:id
```

### Parámetros de Ruta

| Parámetro | Tipo   | Descripción    |
| --------- | ------ | -------------- |
| `id`      | number | ID del envío   |

### Autenticación

- **Tipo**: JWT Admin
- **Header**: `Authorization: Bearer {token}`

### Respuesta (200 OK)

```json
{
  "success": true,
  "data": {
    "id_envio": 1,
    "id_venta": 42,
    "numero_tracking": "AR123456789",
    "estado": "enviado",
    "transportista": "OCA",
    "direccion_destino": {
      "id_direccion": 5,
      "destinatario": "Juan Pérez",
      "calle": "Av. Libertador 1234",
      "ciudad": "Buenos Aires",
      "provincia": "CABA",
      "codigo_postal": "1001",
      "pais": "Argentina",
      "referencia": "Departamento A - 2do piso"
    },
    "costo_envio": 250.00,
    "moneda": "ARS",
    "peso_aproximado_kg": 2.5,
    "fecha_envio": "2026-03-18T14:30:00Z",
    "fecha_entrega_estimada": "2026-03-22T18:00:00Z",
    "fecha_entrega_actual": null,
    "notas": "Dejar en portería si no hay respuesta",
    "venta": {
      "id_venta": 42,
      "numero_venta": "V-2026-042",
      "cliente": {
        "id_cliente": 5,
        "nombre": "Juan",
        "apellido": "Pérez",
        "email": "juan@example.com",
        "celular": "+5491123456789"
      },
      "total": 15450.00,
      "moneda": "ARS"
    },
    "historial_estados": [
      {
        "estado": "pendiente",
        "fecha": "2026-03-16T10:00:00Z"
      },
      {
        "estado": "enviado",
        "fecha": "2026-03-18T14:30:00Z",
        "observaciones": "Entregado al transportista"
      }
    ],
    "fyh_creacion": "2026-03-16T10:00:00Z",
    "fyh_actualizacion": "2026-03-18T14:30:00Z"
  }
}
```

### Respuesta de Error (404 Not Found)

```json
{
  "error": "Envío no encontrado"
}
```

---

## Actualizar Estado

Actualiza el estado de un envío (ej: marcar como entregado, cancelado).

```http
PATCH /api/envios/admin/:id/estado
```

### Parámetros de Ruta

| Parámetro | Tipo   | Descripción    |
| --------- | ------ | -------------- |
| `id`      | number | ID del envío   |

### Cuerpo (Body)

```json
{
  "estado": "entregado",
  "fecha_entrega_actual": "2026-03-21T16:45:00Z",
  "observaciones": "Entregado en persona"
}
```

### Parámetros del Cuerpo

| Parámetro                | Tipo   | Obligatorio | Descripción                           |
| ----------------------- | ------ | ----------- | ------------------------------------- |
| `estado`                 | string | Sí          | Nuevo estado (ver [Estados Disponibles](#estados-disponibles)) |
| `fecha_entrega_actual`   | string | No          | ISO date de entrega (si aplica)        |
| `observaciones`          | string | No          | Notas adicionales sobre el cambio      |

### Autenticación

- **Tipo**: JWT Admin
- **Header**: `Authorization: Bearer {token}`

### Respuesta (200 OK)

```json
{
  "success": true,
  "message": "Estado del envío actualizado correctamente",
  "data": {
    "id_envio": 1,
    "estado": "entregado",
    "fecha_entrega_actual": "2026-03-21T16:45:00Z",
    "observaciones": "Entregado en persona",
    "fyh_actualizacion": "2026-03-21T16:45:00Z"
  }
}
```

### Errores Comunes

#### 404 Not Found
```json
{
  "error": "Envío no encontrado"
}
```

#### 400 Bad Request (Estado Inválido)
```json
{
  "error": "Estado inválido. Estados permitidos: pendiente, enviado, entregado, cancelado"
}
```

---

## Estados Disponibles

| Estado      | Descripción                                    | Permite Cambiar a |
| ----------- | ---------------------------------------------- | ------------------ |
| `pendiente` | Envío registrado, aguardando envío            | enviado, cancelado  |
| `enviado`   | Entregado al transportista, en tránsito       | entregado, cancelado |
| `entregado` | Entregado al cliente                           | cancelado          |
| `cancelado` | Envío cancelado (sin enviar o rechazado)      | -                  |

### Flujo Típico

```
pendiente → enviado → entregado
            ↓
         cancelado
```

---

## Transportistas Soportados

| Código | Nombre        | País          |
| ------ | ------------- | ------------- |
| `oca`  | OCA           | Argentina     |
| `via`  | VIA Cargo     | Argentina     |
| `andreani` | Andreani | Argentina     |
| `correo` | Correo Arg.  | Argentina     |

---

## Notas Importantes

- El costo de envío se define durante la creación de la venta
- El número de tracking se asigna cuando el estado cambia a `enviado`
- Los cambios de estado quedan registrados en `historial_estados`
- Solo Admin y Gerente pueden actualizar envíos
- Las fechas se usan en formato ISO 8601 (UTC)

---

**Última actualización:** 20 de Marzo, 2026
