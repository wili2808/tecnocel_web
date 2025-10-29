# Sistema Híbrido de Precios de Oferta

**Fecha de implementación:** 2025-01-28
**Versión:** 2.0

## Descripción General

Este documento describe el sistema híbrido de precios de oferta implementado en TecnoCel Web. El sistema permite dos modos de operación:

1. **Cálculo Dinámico** (por defecto): El precio de oferta se calcula automáticamente basándose en el precio del producto y el descuento de la oferta.
2. **Precio Personalizado**: Se puede definir un precio específico para un producto en una oferta, independiente de la fórmula de descuento.

## Motivación

### Problema Original

El sistema anterior almacenaba el precio de oferta calculado en la base de datos (columna `precio_oferta` NOT NULL). Esto causaba:

- **Desincronización**: Si el precio del producto cambiaba, el precio de oferta quedaba desactualizado
- **Redundancia**: Se almacenaban datos derivados que podían calcularse
- **Mantenimiento complejo**: Requerían recalcular manualmente todos los precios de oferta al actualizar precios

### Solución Híbrida

El nuevo sistema:
- ✅ Calcula dinámicamente por defecto (sincronización automática)
- ✅ Permite precios personalizados cuando sea necesario (flexibilidad)
- ✅ Usa un flag `es_precio_personalizado` para distinguir entre modos
- ✅ Centraliza la lógica en un servicio reutilizable

## Arquitectura

### Cambios en Base de Datos

**Tabla `tb_productos_ofertas`:**

```sql
ALTER TABLE tb_productos_ofertas
  ADD COLUMN es_precio_personalizado BOOLEAN DEFAULT FALSE NOT NULL,
  MODIFY COLUMN precio_oferta DECIMAL(10,2) NULL;
```

**Campos:**
- `precio_oferta` (DECIMAL, NULL):
  - NULL = cálculo dinámico
  - Valor = precio personalizado
- `es_precio_personalizado` (BOOLEAN):
  - false = calcular dinámicamente (por defecto)
  - true = usar precio_oferta almacenado

### Modelo Sequelize

**`backend/src/models/ProductoOferta.ts`:**

```typescript
class ProductoOferta extends Model {
  declare precio_oferta: number | null;
  declare es_precio_personalizado: boolean;
}
```

### Servicio de Ofertas

**`backend/src/services/ofertaService.ts`**

Proporciona funciones centralizadas para:

#### 1. `calcularPrecioOferta()`
Calcula el precio de oferta usando lógica híbrida.

```typescript
const precioFinal = calcularPrecioOferta(
  1000,  // precio original
  {
    tipo_descuento: 'porcentaje',
    valor_descuento: 20
  },
  {
    precio_oferta: null,
    es_precio_personalizado: false
  }
);
// Retorna: 800 (calculado: 1000 * (1 - 20/100))
```

#### 2. `prepararDatosProductoOferta()`
Prepara datos para asignar productos a ofertas.

```typescript
// Sin precio personalizado (cálculo dinámico)
const datos = prepararDatosProductoOferta(1000, oferta);
// Retorna: { precio_oferta: null, es_precio_personalizado: false }

// Con precio personalizado
const datos = prepararDatosProductoOferta(1000, oferta, 750);
// Retorna: { precio_oferta: 750, es_precio_personalizado: true }
```

#### 3. `enriquecerProductoConOferta()`
Agrega campos calculados a un producto con oferta.

```typescript
const productoEnriquecido = enriquecerProductoConOferta(producto);
// Agrega: precio_original, precio_oferta, descuento_porcentaje, en_oferta
```

#### 4. `calcularPorcentajeDescuento()`
Calcula el porcentaje de descuento entre dos precios.

```typescript
const porcentaje = calcularPorcentajeDescuento(1000, 800);
// Retorna: "20.0"
```

## Uso en Controladores

### OfertaController

**Asignar productos a oferta:**

```typescript
// POST /api/ofertas/:id_oferta/productos
{
  "productos": [
    { "id_producto": 123 },                    // Cálculo dinámico
    { "id_producto": 124, "precio_oferta": 799 } // Precio personalizado
  ]
}
```

**Obtener productos en oferta:**

```typescript
// GET /api/ofertas/productos
// Retorna productos con precio_oferta calculado según lógica híbrida
```

### AlmacenController

Los productos obtenidos incluyen información de oferta en el campo `through`:

```typescript
{
  "ofertas": [{
    "ProductoOferta": {
      "precio_oferta": 750,              // null si es dinámico
      "es_precio_personalizado": true     // false si es dinámico
    },
    "tipo_descuento": "porcentaje",
    "valor_descuento": 25
  }]
}
```

### CarritoController

Actualizado para usar el servicio de ofertas. El cálculo de precios en el carrito respeta la lógica híbrida automáticamente.

## Flujo de Datos

### Escenario 1: Cálculo Dinámico (Defecto)

1. Admin crea oferta: 20% de descuento
2. Admin asigna producto sin especificar precio:
   ```json
   { "id_producto": 123 }
   ```
3. Sistema guarda:
   ```sql
   precio_oferta = NULL
   es_precio_personalizado = FALSE
   ```
4. Al consultar producto:
   - Precio original: Bs. 1000 (de `tb_almacen.precio_venta`)
   - Descuento: 20% (de `tb_ofertas.valor_descuento`)
   - **Precio final calculado: Bs. 800**

5. Si admin cambia precio a Bs. 1200:
   - **Precio final recalculado: Bs. 960** ✅ (automático)

### Escenario 2: Precio Personalizado

1. Admin crea oferta: 20% de descuento
2. Admin asigna producto con precio específico:
   ```json
   { "id_producto": 124, "precio_oferta": 750 }
   ```
3. Sistema guarda:
   ```sql
   precio_oferta = 750
   es_precio_personalizado = TRUE
   ```
4. Al consultar producto:
   - Precio original: Bs. 1000
   - **Precio final: Bs. 750** (precio personalizado, ignora fórmula)

5. Si admin cambia precio a Bs. 1200:
   - **Precio final sigue siendo: Bs. 750** (personalizado no cambia)

## Migración de Datos Existentes

La migración SQL marca todos los registros existentes como personalizados para preservar el comportamiento actual:

```sql
UPDATE tb_productos_ofertas
SET es_precio_personalizado = TRUE
WHERE precio_oferta IS NOT NULL;
```

**Recomendación:** Después de la migración, revisar ofertas activas y cambiar a cálculo dinámico donde sea apropiado:

```sql
UPDATE tb_productos_ofertas
SET
  precio_oferta = NULL,
  es_precio_personalizado = FALSE
WHERE id_oferta IN (
  SELECT id_oferta FROM tb_ofertas WHERE activo = TRUE
);
```

## Testing

### Casos de Prueba

#### 1. Crear Oferta y Asignar Productos (Dinámico)

```bash
# Crear oferta 20% descuento
POST /api/ofertas
{
  "nombre_oferta": "Black Friday 2025",
  "tipo_descuento": "porcentaje",
  "valor_descuento": 20,
  "fecha_inicio": "2025-11-25T00:00:00Z",
  "fecha_fin": "2025-11-30T23:59:59Z"
}

# Asignar productos (cálculo dinámico)
POST /api/ofertas/1/productos
{
  "productos": [
    { "id_producto": 10 },  // Precio venta: 1000 → Precio oferta: 800
    { "id_producto": 11 }   // Precio venta: 1500 → Precio oferta: 1200
  ]
}
```

#### 2. Asignar Producto con Precio Personalizado

```bash
POST /api/ofertas/1/productos
{
  "productos": [
    { "id_producto": 12, "precio_oferta": 999 }  // Precio específico
  ]
}
```

#### 3. Verificar Productos en Oferta

```bash
GET /api/ofertas/productos

# Respuesta:
{
  "success": true,
  "data": [
    {
      "id_producto": 10,
      "nombre": "Producto A",
      "precio_original": 1000,
      "precio_oferta": 800,          // Calculado (1000 * 0.8)
      "descuento_porcentaje": "20.0",
      "en_oferta": true
    },
    {
      "id_producto": 12,
      "nombre": "Producto C",
      "precio_original": 1200,
      "precio_oferta": 999,          // Personalizado
      "descuento_porcentaje": "16.8",
      "en_oferta": true
    }
  ]
}
```

#### 4. Actualizar Precio de Producto

```bash
# Actualizar precio del producto 10 de 1000 a 1500
PUT /api/almacen/productos/10
{
  "precio_venta": 1500
}

# Volver a consultar oferta
GET /api/ofertas/productos

# Producto 10 ahora muestra:
{
  "precio_original": 1500,
  "precio_oferta": 1200,  // ✅ Recalculado automáticamente (1500 * 0.8)
  "descuento_porcentaje": "20.0"
}
```

## Mejores Prácticas

### Cuándo Usar Cálculo Dinámico

✅ **Recomendado para:**
- Ofertas generales (ej: "20% en todos los smartphones")
- Productos con precios que varían frecuentemente
- Ofertas con muchos productos
- Descuentos basados en porcentaje o monto fijo consistente

### Cuándo Usar Precio Personalizado

✅ **Recomendado para:**
- Ofertas flash con precio específico (ej: "iPhone por Bs. 4999")
- Liquidaciones con precio especial
- Combos o bundles con precio fijo
- Precios psicológicos (ej: Bs. 99.99 en lugar de Bs. 100.32)

## Rollback

Si necesitas revertir la migración:

```sql
-- ADVERTENCIA: Esto eliminará el flag es_precio_personalizado
ALTER TABLE tb_productos_ofertas
  DROP COLUMN es_precio_personalizado,
  MODIFY COLUMN precio_oferta DECIMAL(10,2) NOT NULL;
```

## Archivos Modificados

### Backend

- ✅ `database/migrations/update_productos_ofertas_hibrido.sql`
- ✅ `backend/src/models/ProductoOferta.ts`
- ✅ `backend/src/services/ofertaService.ts` (nuevo)
- ✅ `backend/src/controllers/OfertaController.ts`
- ✅ `backend/src/controllers/AlmacenController.ts`
- ✅ `backend/src/controllers/CarritoController.ts`

### Frontend

No se requieren cambios en el frontend. Los campos `precio_oferta`, `descuento_porcentaje` y `en_oferta` siguen siendo calculados y enviados por el backend.

## Soporte

Para preguntas o problemas relacionados con el sistema híbrido de ofertas:

1. Revisar logs del backend en `backend/logs/`
2. Verificar estructura de tabla: `DESCRIBE tb_productos_ofertas;`
3. Consultar servicio de ofertas: `backend/src/services/ofertaService.ts`

---

**Documentado por:** Claude Code
**Última actualización:** 2025-01-28
