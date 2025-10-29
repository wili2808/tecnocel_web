# Guía: Cambiar Productos de Oferta

**Fecha:** 2025-01-28
**Problema:** Al cambiar manualmente productos de oferta en la base de datos, el indicador de descuento no se actualiza

---

## ⚠️ **Problema Identificado**

Cuando cambias manualmente el `id_oferta` de un producto en la tabla `tb_productos_ofertas`, el campo `precio_oferta` guardado se queda **desactualizado** y el frontend muestra el porcentaje de descuento incorrecto.

### **Ejemplo del Problema:**

```sql
-- Estado inicial
id_producto: 5
id_oferta: 1 (20% descuento)
precio_venta: 1000 Bs
precio_oferta: 800 Bs (calculado)
es_precio_personalizado: 0

-- Cambias manualmente a oferta 2 (30% descuento)
UPDATE tb_productos_ofertas SET id_oferta = 2 WHERE id_producto = 5;

-- ❌ RESULTADO INCORRECTO:
-- precio_oferta sigue siendo 800 Bs (debería ser 700 Bs)
-- Frontend muestra: 20% de descuento (incorrecto)
-- Debería mostrar: 30% de descuento
```

---

## ✅ **Solución 1: Usar Endpoints del Backend (RECOMENDADO)**

### **Paso 1: Remover producto de oferta actual**

```bash
DELETE FROM tb_productos_ofertas
WHERE id_producto = 5 AND id_oferta = 1;
```

### **Paso 2: Asignar a nueva oferta usando API**

```bash
POST http://localhost:3000/api/ofertas/2/productos
Content-Type: application/json

{
  "productos": [
    { "id_producto": 5 }  // Sin precio_oferta → cálculo dinámico
  ]
}
```

**Ventajas:**
- ✅ El backend calcula automáticamente el precio correcto
- ✅ Se asigna correctamente `es_precio_personalizado = false`
- ✅ El sistema funciona como está diseñado

---

## ✅ **Solución 2: Forzar Recálculo Dinámico en SQL**

Si **debes** cambiar manualmente en SQL, haz lo siguiente:

### **Opción A: Cambiar a Cálculo Dinámico**

```sql
-- Cambiar oferta Y forzar recálculo dinámico
UPDATE tb_productos_ofertas
SET
  id_oferta = 2,                    -- Nueva oferta
  precio_oferta = NULL,              -- NULL = calcular dinámicamente
  es_precio_personalizado = 0        -- No es personalizado
WHERE id_producto = 5;
```

### **Opción B: Calcular Manualmente el Precio**

Si prefieres guardarlo calculado (no recomendado):

```sql
-- Para PORCENTAJE (ejemplo: 20%)
UPDATE tb_productos_ofertas po
INNER JOIN tb_almacen a ON po.id_producto = a.id_producto
INNER JOIN tb_ofertas o ON po.id_oferta = o.id_oferta
SET
  po.precio_oferta = a.precio_venta * (1 - o.valor_descuento / 100),
  po.es_precio_personalizado = 0
WHERE po.id_producto = 5
  AND o.tipo_descuento = 'porcentaje';

-- Para MONTO_FIJO (ejemplo: Bs. 50)
UPDATE tb_productos_ofertas po
INNER JOIN tb_almacen a ON po.id_producto = a.id_producto
INNER JOIN tb_ofertas o ON po.id_oferta = o.id_oferta
SET
  po.precio_oferta = a.precio_venta - o.valor_descuento,
  po.es_precio_personalizado = 0
WHERE po.id_producto = 5
  AND o.tipo_descuento = 'monto_fijo';
```

---

## 🔧 **Solución 3: Recalcular Todos los Precios Dinámicos**

Si tienes muchos productos con precios desactualizados:

```sql
-- Forzar NULL en todos los productos no personalizados
UPDATE tb_productos_ofertas
SET precio_oferta = NULL
WHERE es_precio_personalizado = 0;
```

**Resultado:**
- ✅ Todos los productos con `es_precio_personalizado = 0` se calcularán dinámicamente
- ✅ El backend calculará el precio correcto en cada petición
- ✅ Los indicadores de descuento se mostrarán correctamente

---

## 📊 **Verificar Precios Después del Cambio**

### **Query de Verificación:**

```sql
SELECT
    po.id_producto,
    a.nombre,
    a.precio_venta,
    po.precio_oferta,
    o.tipo_descuento,
    o.valor_descuento,
    po.es_precio_personalizado,
    CASE
        WHEN po.es_precio_personalizado = 1 THEN 'PERSONALIZADO'
        WHEN po.precio_oferta IS NULL THEN 'DINÁMICO (NULL)'
        ELSE 'DINÁMICO (GUARDADO)'
    END as modo,
    -- Calcular precio esperado
    CASE
        WHEN o.tipo_descuento = 'porcentaje' THEN a.precio_venta * (1 - o.valor_descuento / 100)
        WHEN o.tipo_descuento = 'monto_fijo' THEN a.precio_venta - o.valor_descuento
    END as precio_esperado,
    -- Verificar si coincide
    CASE
        WHEN po.es_precio_personalizado = 1 THEN '✅ Personalizado OK'
        WHEN po.precio_oferta IS NULL THEN '✅ Dinámico (recalcula)'
        WHEN po.precio_oferta = CASE
            WHEN o.tipo_descuento = 'porcentaje' THEN a.precio_venta * (1 - o.valor_descuento / 100)
            WHEN o.tipo_descuento = 'monto_fijo' THEN a.precio_venta - o.valor_descuento
        END THEN '✅ Correcto'
        ELSE '❌ DESACTUALIZADO'
    END as estado
FROM tb_productos_ofertas po
INNER JOIN tb_almacen a ON po.id_producto = a.id_producto
INNER JOIN tb_ofertas o ON po.id_oferta = o.id_oferta;
```

---

## 🎯 **Mejores Prácticas**

### **DO ✅ (Hacer):**

1. **Usar endpoints del backend** para asignar productos a ofertas
2. **Poner `precio_oferta = NULL`** para productos no personalizados
3. **Mantener `es_precio_personalizado = 0`** para cálculo dinámico
4. **Verificar cambios** con el query de verificación

### **DON'T ❌ (No Hacer):**

1. **No cambiar solo `id_oferta`** sin actualizar `precio_oferta`
2. **No guardar precios calculados** si no son personalizados
3. **No mezclar precios guardados con `es_precio_personalizado = 0`**
4. **No asumir que el precio guardado es correcto**

---

## 🔄 **Flujo Correcto del Sistema**

### **Cálculo Dinámico (Recomendado):**

```
Base de Datos:
├── precio_oferta: NULL
└── es_precio_personalizado: 0

↓

Backend (ofertaService.calcularPrecioOferta):
├── Lee precio_venta del producto
├── Lee tipo_descuento y valor_descuento de la oferta
└── Calcula: precio_final = precio_venta × (1 - descuento/100)

↓

Frontend (ProductCard):
└── Muestra indicador con porcentaje correcto
```

### **Precio Personalizado:**

```
Base de Datos:
├── precio_oferta: 750
└── es_precio_personalizado: 1

↓

Backend (ofertaService.calcularPrecioOferta):
└── Retorna: 750 (ignora fórmula de descuento)

↓

Frontend (ProductCard):
└── Muestra indicador con porcentaje basado en precio fijo
```

---

## 🆘 **Troubleshooting**

### **Problema: Indicador muestra porcentaje incorrecto**

**Causa:** `precio_oferta` desactualizado

**Solución:**
```sql
UPDATE tb_productos_ofertas
SET precio_oferta = NULL
WHERE es_precio_personalizado = 0 AND id_producto = <ID_PRODUCTO>;
```

### **Problema: Precio no cambia al actualizar oferta**

**Causa:** `es_precio_personalizado = 1`

**Solución:**
```sql
-- Solo si quieres cambiar a dinámico
UPDATE tb_productos_ofertas
SET
    precio_oferta = NULL,
    es_precio_personalizado = 0
WHERE id_producto = <ID_PRODUCTO>;
```

### **Problema: Frontend muestra precio antiguo**

**Causa:** Cache del navegador o contexto global

**Solución:**
1. Refrescar página (F5)
2. Limpiar cache del navegador (Ctrl+Shift+R)
3. Verificar que el backend esté retornando datos correctos

---

## 📝 **Comandos Útiles**

### **Ver todos los productos en oferta:**
```sql
SELECT
    po.id_producto,
    a.nombre,
    o.nombre_oferta,
    a.precio_venta,
    po.precio_oferta,
    po.es_precio_personalizado
FROM tb_productos_ofertas po
INNER JOIN tb_almacen a ON po.id_producto = a.id_producto
INNER JOIN tb_ofertas o ON po.id_oferta = o.id_oferta;
```

### **Resetear todos a dinámico:**
```sql
UPDATE tb_productos_ofertas
SET
    precio_oferta = NULL,
    es_precio_personalizado = 0;
```

### **Marcar todos como personalizados:**
```sql
UPDATE tb_productos_ofertas
SET es_precio_personalizado = 1
WHERE precio_oferta IS NOT NULL;
```

---

**Última actualización:** 2025-01-28
**Autor:** Sistema TecnoCel Web
