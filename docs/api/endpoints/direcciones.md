[← Volver al índice de ENDPOINTS](../ENDPOINTS.md)
# Direcciones API

**Base Path**: `/api/direcciones`

Gestión de direcciones de envío de clientes.

---

## Índice

- [Direcciones API](#direcciones-api)
  - [Índice](#índice)
  - [GET /direcciones/cliente/:id\_cliente](#get-direccionesclienteid_cliente)
  - [GET /direcciones/:id](#get-direccionesid)
  - [GET /direcciones/cliente/:id\_cliente/predeterminada](#get-direccionesclienteid_clientepredeterminada)
  - [POST /direcciones/cliente/:id\_cliente](#post-direccionesclienteid_cliente)
  - [PUT /direcciones/:id](#put-direccionesid)
  - [PATCH /direcciones/:id/predeterminada](#patch-direccionesidpredeterminada)
  - [DELETE /direcciones/:id](#delete-direccionesid)
  - [Notas Técnicas](#notas-técnicas)
    - [Estructura de Dirección](#estructura-de-dirección)
    - [Dirección Predeterminada](#dirección-predeterminada)
    - [Formato de Dirección Completa](#formato-de-dirección-completa)
    - [Validación Frontend](#validación-frontend)
    - [Uso en Carrito](#uso-en-carrito)
    - [Privacidad y Seguridad](#privacidad-y-seguridad)
    - [Casos de Uso](#casos-de-uso)
  - [Ver También](#ver-también)

 Todos los endpoints requieren autenticación

---

## GET /direcciones/cliente/:id_cliente

Obtener todas las direcciones de un cliente.

**Autenticación**: Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id_direccion": 5,
      "id_cliente": 10,
      "nombre_direccion": "Casa",
      "calle": "Av. Libertador",
      "numero": "1234",
      "piso": "5",
      "departamento": "B",
      "barrio": "Palermo",
      "ciudad": "Buenos Aires",
      "provincia": "Buenos Aires",
      "codigo_postal": "C1425",
      "pais": "Argentina",
      "referencia": "Edificio azul, portero eléctrico",
      "es_predeterminada": true,
      "es_facturacion": true,
      "telefono_contacto": "+54 11 1234-5678",
      "fyh_creacion": "2025-09-15T10:00:00Z",
      "fyh_actualizacion": "2025-09-15T10:00:00Z"
    },
    {
      "id_direccion": 6,
      "id_cliente": 10,
      "nombre_direccion": "Trabajo",
      "calle": "Av. Corrientes",
      "numero": "5678",
      "piso": null,
      "departamento": null,
      "barrio": "Centro",
      "ciudad": "Buenos Aires",
      "provincia": "Buenos Aires",
      "codigo_postal": "C1043",
      "pais": "Argentina",
      "referencia": "Al lado del teatro",
      "es_predeterminada": false,
      "es_facturacion": false,
      "telefono_contacto": "+54 11 9876-5432",
      "fyh_creacion": "2025-09-20T14:30:00Z",
      "fyh_actualizacion": "2025-09-20T14:30:00Z"
    }
  ],
  "count": 2
}
```

**Ordenamiento**:
1. Dirección predeterminada primero
2. Luego por fecha de creación DESC (más recientes primero)

**Validaciones**:
- El cliente debe existir
- Solo el cliente autenticado puede ver sus propias direcciones

**Errores**:
- `401`: No autorizado
- `404`: Cliente no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/direcciones/cliente/10" \
  -H "Authorization: Bearer {tu_token}"
```

---

## GET /direcciones/:id

Obtener información detallada de una dirección específica.

**Autenticación**: Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la dirección |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id_direccion": 5,
    "id_cliente": 10,
    "nombre_direccion": "Casa",
    "calle": "Av. Libertador",
    "numero": "1234",
    "piso": "5",
    "departamento": "B",
    "barrio": "Palermo",
    "ciudad": "Buenos Aires",
    "provincia": "Buenos Aires",
    "codigo_postal": "C1425",
    "pais": "Argentina",
    "referencia": "Edificio azul, portero eléctrico",
    "es_predeterminada": true,
    "es_facturacion": true,
    "telefono_contacto": "+54 11 1234-5678",
    "fyh_creacion": "2025-09-15T10:00:00Z",
    "fyh_actualizacion": "2025-09-15T10:00:00Z",
    "cliente": {
      "nombre_cliente": "Juan",
      "apellido_cliente": "Pérez"
    }
  }
}
```

**Errores**:
- `401`: No autorizado
- `404`: Dirección no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/direcciones/5" \
  -H "Authorization: Bearer {tu_token}"
```

---

## GET /direcciones/cliente/:id_cliente/predeterminada

Obtener la dirección predeterminada de un cliente.

**Autenticación**: Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id_direccion": 5,
    "id_cliente": 10,
    "nombre_direccion": "Casa",
    "calle": "Av. Libertador",
    "numero": "1234",
    "ciudad": "Buenos Aires",
    "provincia": "Buenos Aires",
    "es_predeterminada": true,
    "telefono_contacto": "+54 11 1234-5678"
  }
}
```

**Uso común**:
- Pre-seleccionar dirección en checkout
- Mostrar dirección principal en perfil de usuario

**Errores**:
- `401`: No autorizado
- `404`: No se encontró dirección predeterminada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X GET "http://localhost:3000/api/direcciones/cliente/10/predeterminada" \
  -H "Authorization: Bearer {tu_token}"
```

---

## POST /direcciones/cliente/:id_cliente

Crear una nueva dirección para un cliente.

**Autenticación**: Requerida (JWT Cliente)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_cliente` | number | ID del cliente |

**Body**:
```json
{
  "nombre_direccion": "Casa de Mamá",
  "calle": "San Martín",
  "numero": "456",
  "piso": "2",
  "departamento": "A",
  "barrio": "Centro",
  "ciudad": "Córdoba",
  "provincia": "Córdoba",
  "codigo_postal": "X5000",
  "pais": "Argentina",
  "referencia": "Casa con rejas verdes",
  "es_predeterminada": false,
  "es_facturacion": false,
  "telefono_contacto": "+54 351 123-4567"
}
```

**Campos**:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre_direccion` | string | Sí | Nombre identificador (ej: "Casa", "Trabajo") |
| `calle` | string | Sí | Nombre de la calle |
| `numero` | string | Sí | Número de calle |
| `piso` | string | No | Piso (para edificios) |
| `departamento` | string | No | Departamento/unidad |
| `barrio` | string | No | Barrio/zona |
| `ciudad` | string | Sí | Ciudad |
| `provincia` | string | Sí | Provincia/estado |
| `codigo_postal` | string | No | Código postal |
| `pais` | string | No | País (default: "Argentina") |
| `referencia` | string | No | Referencias para encontrar la dirección |
| `es_predeterminada` | boolean | No | Marcar como predeterminada (default: false) |
| `es_facturacion` | boolean | No | Usar para facturación (default: false) |
| `telefono_contacto` | string | No | Teléfono de contacto en esta dirección |

**Response 201**:
```json
{
  "success": true,
  "message": "Dirección creada exitosamente",
  "data": {
    "id_direccion": 7,
    "id_cliente": 10,
    "nombre_direccion": "Casa de Mamá",
    "calle": "San Martín",
    "numero": "456",
    "ciudad": "Córdoba",
    "provincia": "Córdoba",
    "es_predeterminada": false,
    "fyh_creacion": "2025-10-06T16:00:00Z"
  }
}
```

**Comportamiento**:
- Si `es_predeterminada = true`, automáticamente quita el flag de otras direcciones
- Los campos opcionales se guardan como `null` si no se proporcionan
- `pais` toma "Argentina" por defecto si no se especifica

**Errores**:
- `400`: Campos requeridos faltantes
- `401`: No autorizado
- `404`: Cliente no encontrado
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X POST "http://localhost:3000/api/direcciones/cliente/10" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_direccion": "Casa de Mamá",
    "calle": "San Martín",
    "numero": "456",
    "ciudad": "Córdoba",
    "provincia": "Córdoba",
    "es_predeterminada": true
  }'
```

---

## PUT /direcciones/:id

Actualizar una dirección existente.

**Autenticación**: Requerida (JWT Cliente - propietario de la dirección)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la dirección |

**Body** (todos los campos opcionales):
```json
{
  "nombre_direccion": "Nueva Casa",
  "calle": "Av. Libertador",
  "numero": "1234",
  "piso": "6",
  "es_predeterminada": true,
  "telefono_contacto": "+54 11 9999-8888"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Dirección actualizada exitosamente",
  "data": {
    "id_direccion": 5,
    "nombre_direccion": "Nueva Casa",
    "calle": "Av. Libertador",
    "numero": "1234",
    "piso": "6",
    "es_predeterminada": true,
    "telefono_contacto": "+54 11 9999-8888",
    "fyh_actualizacion": "2025-10-06T17:00:00Z"
  }
}
```

**Comportamiento**:
- Si se marca `es_predeterminada = true`, quita el flag de otras direcciones del cliente
- Solo actualiza los campos enviados

**Errores**:
- `401`: No autorizado
- `404`: Dirección no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PUT "http://localhost:3000/api/direcciones/5" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "piso": "6",
    "telefono_contacto": "+54 11 9999-8888"
  }'
```

---

## PATCH /direcciones/:id/predeterminada

Establecer una dirección como predeterminada.

**Autenticación**: Requerida (JWT Cliente - propietario de la dirección)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la dirección |

**Response 200**:
```json
{
  "success": true,
  "message": "Dirección establecida como predeterminada",
  "data": {
    "id_direccion": 6,
    "nombre_direccion": "Trabajo",
    "es_predeterminada": true,
    "fyh_actualizacion": "2025-10-06T17:30:00Z"
  }
}
```

**Comportamiento**:
- Quita automáticamente el flag `es_predeterminada` de otras direcciones del cliente
- Solo puede haber una dirección predeterminada por cliente

**Errores**:
- `401`: No autorizado
- `404`: Dirección no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X PATCH "http://localhost:3000/api/direcciones/6/predeterminada" \
  -H "Authorization: Bearer {tu_token}"
```

---

## DELETE /direcciones/:id

Eliminar una dirección.

**Autenticación**: Requerida (JWT Cliente - propietario de la dirección)

**URL Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la dirección |

**Response 200**:
```json
{
  "success": true,
  "message": "Dirección eliminada exitosamente"
}
```

**Comportamiento**:
- Hard delete: elimina permanentemente el registro
- Si era la dirección predeterminada, establece automáticamente otra como predeterminada (la más antigua)
- No se puede recuperar después de eliminar

**Errores**:
- `401`: No autorizado
- `404`: Dirección no encontrada
- `500`: Error del servidor

**Ejemplo curl**:
```bash
curl -X DELETE "http://localhost:3000/api/direcciones/7" \
  -H "Authorization: Bearer {tu_token}"
```

---

## Notas Técnicas

### Estructura de Dirección

**Campos obligatorios**:
- `nombre_direccion`: Identificador amigable
- `calle`: Nombre de la calle
- `numero`: Número de calle
- `ciudad`: Ciudad
- `provincia`: Provincia/estado

**Campos opcionales**:
- `piso`, `departamento`: Para edificios
- `barrio`: Zona/barrio
- `codigo_postal`: Código postal
- `pais`: País (default "Argentina")
- `referencia`: Indicaciones adicionales
- `telefono_contacto`: Teléfono en esa ubicación

**Flags booleanos**:
- `es_predeterminada`: Solo una por cliente
- `es_facturacion`: Puede usarse para facturación

### Dirección Predeterminada

**Reglas**:
- Solo puede haber una dirección predeterminada por cliente
- Al marcar una como predeterminada, las demás se desmarca automáticamente
- Si se elimina la predeterminada, otra se marca automáticamente (la más antigua)
- Útil para pre-seleccionar en checkout

### Formato de Dirección Completa

Para mostrar una dirección completa:
```javascript
const formatearDireccion = (dir) => {
  let direccion = `${dir.calle} ${dir.numero}`;
  if (dir.piso) direccion += `, Piso ${dir.piso}`;
  if (dir.departamento) direccion += ` ${dir.departamento}`;
  if (dir.barrio) direccion += `, ${dir.barrio}`;
  direccion += `, ${dir.ciudad}, ${dir.provincia}`;
  if (dir.codigo_postal) direccion += ` (${dir.codigo_postal})`;
  direccion += `, ${dir.pais}`;
  return direccion;
};

// Resultado: "Av. Libertador 1234, Piso 5 B, Palermo, Buenos Aires, Buenos Aires (C1425), Argentina"
```

### Validación Frontend

**Campos recomendados**:
```javascript
// Validaciones sugeridas
- nombre_direccion: 3-50 caracteres
- calle: 3-100 caracteres
- numero: 1-10 caracteres (puede incluir letras: "123 bis")
- ciudad: 2-50 caracteres
- provincia: 2-50 caracteres
- codigo_postal: Formato según país
- telefono_contacto: Formato internacional
```

### Uso en Carrito

Cuando el cliente confirma una compra:
```javascript
POST /api/carrito/confirmar-compra
{
  "metodo_pago": "tarjeta",
  "id_direccion": 5,  // Usa una de las direcciones guardadas
  "notas": "Llamar antes de entregar"
}
```

### Privacidad y Seguridad

- Solo el cliente puede ver sus propias direcciones
- Verificar que `id_cliente` del JWT coincida con `id_cliente` de la URL
- Las direcciones se eliminan si se elimina el cliente (CASCADE)

### Casos de Uso

**Checkout**:
1. Obtener dirección predeterminada
2. Pre-seleccionar en formulario
3. Permitir seleccionar otra o crear nueva

**Gestión de Direcciones**:
1. Listar todas las direcciones
2. Marcar una como predeterminada
3. Editar direcciones existentes
4. Eliminar direcciones no usadas

**Facturación**:
- `es_facturacion = true` indica que puede usarse para facturación fiscal
- Puede haber múltiples direcciones de facturación
- Útil para empresas con múltiples sucursales

---

## Ver También

- [Clientes API](./clientes.md) - Para autenticación y gestión de clientes
- [Carrito API](./carrito.md) - Para usar direcciones en compras
- [Volver al índice de API](../ENDPOINTS.md)

---

**Última actualización**: 6 de Octubre, 2025

---

[Volver arriba](#tabla-de-contenidos) | [Documentación](../../../docs/README.md) | [Inicio](../../../README.md)