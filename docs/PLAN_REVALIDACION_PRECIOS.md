# 📋 Plan de Implementación: Revalidación de Precios en Carrito

**Fecha de creación:** 2025-10-28
**Fecha de finalización:** 2025-10-29
**Estado:** ✅ **COMPLETADO**
**Prioridad:** 🔥 CRÍTICA
**Tiempo estimado:** 2-3 días
**Tiempo real:** 1.5 días

---

## 🎯 Objetivo

Implementar un sistema completo de revalidación de precios que detecte cuando los precios de productos en el carrito han cambiado (semanas después), notifique al usuario y actualice los precios correctamente antes de cobrar.

---

## 🚨 Problema Actual (Resumen)

```
T0: Cliente agrega iPhone a $799 (con oferta 20%)
T2: (2 semanas) Precio sube a $879 (oferta actualizada)
T3: Cliente regresa y compra
T4: Sistema cobra: $799 (precio viejo) ❌
    Tienda pierde: $80 por unidad 💸
```

**Ver análisis completo en:** `docs/ANALISIS_PROBLEMA_PRECIOS_CARRITO.md`

---

## 💡 Lecciones Aprendidas Durante la Implementación

Durante el desarrollo de esta funcionalidad, se identificaron y resolvieron varios desafíos importantes:

### 1. **Actualización Automática de BD**
**Problema inicial:** El plan original contemplaba mostrar cambios al usuario, pero no actualizar la BD automáticamente. Esto causaba que el cambio se mostrara repetidamente en cada carga.

**Solución implementada:** Al detectar un cambio de precio en `transformarItemsCarrito()`, el sistema actualiza automáticamente los registros de `tb_carritoweb_items`. El usuario ve el cambio UNA sola vez, y las cargas subsecuentes ya no muestran diferencia.

### 2. **Visualización de Precios en Frontend**
**Problema identificado:** Mostrar solo una alerta modal no era suficiente. El usuario necesitaba ver los precios actualizados directamente en las tarjetas de productos y en el resumen.

**Solución implementada:**
- Badge "Precio actualizado" en tarjetas
- Comparación visual inline: "Antes: X → Ahora: Y (+Z%)"
- Indicador de ajuste en el resumen del carrito
- Totales siempre calculados con precios actuales

### 3. **Sincronización de Totales**
**Problema identificado:** Había ambigüedad entre "total guardado" y "total actual" en el resumen.

**Solución implementada:** El `total_carrito` en la BD se actualiza automáticamente con el precio actual cuando hay cambios. El frontend siempre muestra el total correcto que el usuario pagará.

### 4. **Manejo de Ofertas Híbridas**
**Desafío:** El sistema soporta tanto descuentos por porcentaje como precios fijos de oferta. La revalidación debía manejar ambos casos.

**Solución:** La función `calcularPrecioActualCompleto()` maneja correctamente ambos tipos de descuento y selecciona la mejor oferta disponible.

---

## 📊 Plan de Implementación

### Estructura del Plan

```
FASE 1: Preparación (Base de Datos y Modelos)
├─ 1.1 Extender tabla CarritoWebItems
├─ 1.2 Crear migración SQL
└─ 1.3 Actualizar modelo Sequelize

FASE 2: Backend - Lógica de Revalidación
├─ 2.1 Función calcularPrecioActual()
├─ 2.2 Modificar transformarItemsCarrito()
├─ 2.3 Modificar obtenerCarrito()
└─ 2.4 Modificar confirmarCompra()

FASE 3: Frontend - Detección y Notificación
├─ 3.1 Actualizar tipos TypeScript
├─ 3.2 Modificar CarritoContext
├─ 3.3 Crear componente de alerta
└─ 3.4 Modal de confirmación de cambios

FASE 4: Testing y Validación
├─ 4.1 Tests unitarios backend
├─ 4.2 Tests unitarios frontend
├─ 4.3 Tests E2E
└─ 4.4 Tests manuales

FASE 5: Documentación y Deploy
├─ 5.1 Documentación técnica
├─ 5.2 Guía de usuario
└─ 5.3 Deploy gradual
```

---

## 🔧 FASE 1: Preparación (Base de Datos y Modelos)

### 1.1 Extender Tabla `tb_carritoweb_items`

**Objetivo:** Guardar información completa de precios para auditoría.

**Nuevas columnas (nomenclatura clara sin ambigüedades):**

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `precio_base_original` | DECIMAL(10,2) NOT NULL | Precio de catálogo SIN descuento al agregar | 999.99 |
| `precio_con_oferta_original` | DECIMAL(10,2) NULL | Precio CON oferta al agregar (NULL si no había) | 799.99 |
| `descuento_porcentaje_original` | DECIMAL(5,2) NULL | % de descuento aplicado originalmente | 20.00 |
| `id_oferta_aplicada` | INT NULL | FK a oferta usada | 5 |
| `precio_es_manual` | BOOLEAN NOT NULL | TRUE si fue precio personalizado | false |
| `fyh_precio_validado` | DATETIME NOT NULL | Última vez que se validó el precio | 2025-10-15 14:30 |
| `precio_ha_cambiado` | BOOLEAN NOT NULL | TRUE si precio cambió desde captura | false |

**Nomenclatura:**
- Sufijo `_original` indica valores **históricos** (snapshot al agregar)
- Campo `precio_unitario` (existente) mantiene el precio **actual**
- `fyh_precio_validado` vs `fyh_creacion` distingue validación de creación

**Justificación:**
- **Auditoría:** Saber exactamente qué precio se cobró
- **Comparación:** Detectar cambios de precio (original vs actual)
- **Legal:** Cumplimiento normativo (registro de transacciones)
- **Analytics:** Análisis de comportamiento de precios
- **Claridad:** Sin ambigüedad entre campos históricos y actuales

---

### 1.2 Migración SQL

**Archivo:** `database/migrations/20251028_agregar_auditoria_precios_carrito_v3.sql`

```sql
-- ============================================================================
-- MIGRACIÓN: Agregar auditoría de precios a CarritoWebItems
-- VERSION 3 - Nomenclatura clara sin ambigüedades
-- Fecha: 2025-10-28
-- Descripción: Agrega campos para rastrear precios y detectar cambios
-- ============================================================================

USE db_tecnocel_v4;

-- Agregar nuevas columnas (inicialmente NULL para facilitar migración)
ALTER TABLE tb_carritoweb_items
ADD COLUMN precio_base_original DECIMAL(10,2) NULL
  COMMENT 'Precio de catalogo SIN descuento al momento de agregar al carrito',
ADD COLUMN precio_con_oferta_original DECIMAL(10,2) NULL
  COMMENT 'Precio CON oferta aplicada al momento de agregar',
ADD COLUMN descuento_porcentaje_original DECIMAL(5,2) NULL
  COMMENT 'Porcentaje de descuento que se aplico originalmente',
ADD COLUMN id_oferta_aplicada INT NULL
  COMMENT 'FK a la oferta que se uso',
ADD COLUMN precio_es_manual BOOLEAN NULL
  COMMENT 'TRUE si fue un precio personalizado manualmente',
ADD COLUMN fyh_precio_validado DATETIME NULL
  COMMENT 'Ultima vez que se valido el precio',
ADD COLUMN precio_ha_cambiado BOOLEAN NULL
  COMMENT 'TRUE si el precio actual difiere del original';

-- Migrar datos existentes
UPDATE tb_carritoweb_items
SET
  precio_base_original = precio_unitario,
  precio_con_oferta_original = precio_unitario,
  precio_es_manual = FALSE,
  fyh_precio_validado = fyh_creacion,
  precio_ha_cambiado = FALSE
WHERE precio_base_original IS NULL;

-- Aplicar constraints NOT NULL
ALTER TABLE tb_carritoweb_items
MODIFY COLUMN precio_base_original DECIMAL(10,2) NOT NULL,
MODIFY COLUMN precio_es_manual BOOLEAN NOT NULL DEFAULT FALSE,
MODIFY COLUMN fyh_precio_validado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN precio_ha_cambiado BOOLEAN NOT NULL DEFAULT FALSE;

-- Agregar foreign key
ALTER TABLE tb_carritoweb_items
ADD CONSTRAINT fk_carritoweb_items_oferta
FOREIGN KEY (id_oferta_aplicada) REFERENCES tb_ofertas(id_oferta)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Crear índices
CREATE INDEX idx_carritoweb_items_oferta ON tb_carritoweb_items(id_oferta_aplicada);
CREATE INDEX idx_carritoweb_items_fyh_validado ON tb_carritoweb_items(fyh_precio_validado);
CREATE INDEX idx_carritoweb_items_ha_cambiado ON tb_carritoweb_items(precio_ha_cambiado);

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- ALTER TABLE tb_carritoweb_items
-- DROP FOREIGN KEY fk_carritoweb_items_oferta,
-- DROP INDEX idx_carritoweb_items_oferta,
-- DROP INDEX idx_carritoweb_items_fyh_validado,
-- DROP INDEX idx_carritoweb_items_ha_cambiado,
-- DROP COLUMN precio_base_original,
-- DROP COLUMN precio_con_oferta_original,
-- DROP COLUMN descuento_porcentaje_original,
-- DROP COLUMN id_oferta_aplicada,
-- DROP COLUMN precio_es_manual,
-- DROP COLUMN fyh_precio_validado,
-- DROP COLUMN precio_ha_cambiado;

-- ============================================================================
-- VALIDACIÓN
-- ============================================================================
-- Verificar que las columnas se agregaron correctamente
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_tecnocel_v4'
  AND TABLE_NAME = 'tb_carritoweb_items'
  AND COLUMN_NAME IN (
    'precio_original',
    'precio_oferta_aplicado',
    'descuento_porcentaje',
    'id_oferta_aplicada',
    'es_precio_personalizado',
    'fyh_precio_capturado',
    'precio_cambio'
  );
```

**Ejecución:**
```bash
cd backend/database/migrations
mysql -u root -p db_tecnocel_v4 < YYYYMMDDHHMMSS_agregar_auditoria_precios_carrito.sql
```

---

### 1.3 Actualizar Modelo Sequelize

**Archivo:** `backend/src/models/CarritoWebItems.ts`

```typescript
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class CarritoWebItems extends Model {
  declare id_item: number;
  declare id_carrito: number;
  declare id_producto: number;
  declare cantidad: number;
  declare precio_unitario: number;
  declare subtotal: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;

  // ✅ NUEVOS CAMPOS (Fase 1 - Revalidación de Precios)
  // Snapshot histórico de precios al momento de agregar al carrito
  declare precio_base_original: number;
  declare precio_con_oferta_original: number | null;
  declare descuento_porcentaje_original: number | null;
  declare id_oferta_aplicada: number | null;
  declare precio_es_manual: boolean;
  declare fyh_precio_validado: Date;
  declare precio_ha_cambiado: boolean;

  // Relaciones
  declare producto?: any;
}

CarritoWebItems.init({
  id_item: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_carrito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_carritosweb',
      key: 'id_carrito'
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  // ✅ NUEVOS CAMPOS - Snapshot histórico
  precio_base_original: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
    comment: 'Precio de catalogo SIN descuento al agregar'
  },
  precio_con_oferta_original: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Precio CON oferta al agregar (NULL si no había)'
  },
  descuento_porcentaje_original: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0, max: 100 },
    comment: 'Porcentaje de descuento aplicado originalmente'
  },
  id_oferta_aplicada: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_ofertas',
      key: 'id_oferta'
    },
    comment: 'FK a la oferta que se uso'
  },
  precio_es_manual: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'TRUE si fue precio personalizado manualmente'
  },
  fyh_precio_validado: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Ultima vez que se valido el precio'
  },
  precio_ha_cambiado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'TRUE si el precio actual difiere del original'
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'tb_carritoweb_items',
  timestamps: false
});

export default CarritoWebItems;
```

---

## 🔧 FASE 2: Backend - Lógica de Revalidación

### 2.1 Función Helper: `calcularPrecioActual()`

**Archivo:** `backend/src/controllers/CarritoController.ts`

**Agregar función estática nueva:**

```typescript
/**
 * Calcula el precio actual de un producto con ofertas vigentes
 * Retorna precio_original, precio_final, descuento, oferta aplicada, etc.
 *
 * @param producto - Producto de Almacen con ofertas incluidas
 * @returns Objeto con información completa de precios
 */
static async calcularPrecioActualCompleto(producto: any): Promise<{
  precio_original: number;
  precio_oferta: number | null;
  precio_final: number;
  descuento_porcentaje: number;
  en_oferta: boolean;
  id_oferta_aplicada: number | null;
  nombre_oferta: string | null;
}> {
  const precio_original = parseFloat(producto.precio_venta);
  const ofertas = producto.ofertas || [];

  if (ofertas.length === 0) {
    return {
      precio_original,
      precio_oferta: null,
      precio_final: precio_original,
      descuento_porcentaje: 0,
      en_oferta: false,
      id_oferta_aplicada: null,
      nombre_oferta: null
    };
  }

  // Buscar la mejor oferta (mayor descuento)
  let mejorOferta = null;
  let mejorPrecioFinal = precio_original;

  for (const oferta of ofertas) {
    const { precio_oferta, precio_final } =
      CarritoController.calcularPrecioConOferta(producto, [oferta]);

    if (precio_final < mejorPrecioFinal) {
      mejorPrecioFinal = precio_final;
      mejorOferta = oferta;
    }
  }

  if (!mejorOferta) {
    return {
      precio_original,
      precio_oferta: null,
      precio_final: precio_original,
      descuento_porcentaje: 0,
      en_oferta: false,
      id_oferta_aplicada: null,
      nombre_oferta: null
    };
  }

  const descuento_porcentaje = calcularPorcentajeDescuento(
    precio_original,
    mejorPrecioFinal
  );

  return {
    precio_original,
    precio_oferta: mejorPrecioFinal,
    precio_final: mejorPrecioFinal,
    descuento_porcentaje,
    en_oferta: true,
    id_oferta_aplicada: mejorOferta.id_oferta,
    nombre_oferta: mejorOferta.nombre_oferta
  };
}
```

---

### 2.2 Modificar `agregarItem()` para Guardar Precios Completos

**Archivo:** `backend/src/controllers/CarritoController.ts`

**Modificar líneas ~474-550:**

```typescript
static async agregarItem(req: Request, res: Response) {
  try {
    const { id_producto, cantidad } = req.body;
    const id_cliente = req.usuario?.id_cliente;

    // ... validaciones de datos ...

    // Buscar producto con ofertas
    const producto = await Almacen.findByPk(id_producto, {
      include: [
        {
          model: Oferta,
          as: 'ofertas',
          where: {
            activo: true,
            fecha_inicio: { [Op.lte]: new Date() },
            fecha_fin: { [Op.gte]: new Date() }
          },
          required: false,
          through: {
            attributes: ['precio_oferta', 'es_precio_personalizado']
          }
        }
      ]
    });

    // ... validación de stock ...

    // ✅ CALCULAR PRECIOS COMPLETOS (nuevo)
    const preciosActuales = await CarritoController.calcularPrecioActualCompleto(producto);

    const precio_unitario = preciosActuales.precio_final;
    const subtotal = precio_unitario * cantidad;

    // Buscar item existente
    const itemExistente = await CarritoWebItems.findOne({
      where: { id_carrito: carrito.id_carrito, id_producto }
    });

    if (itemExistente) {
      // Actualizar cantidad existente
      const nuevaCantidad = itemExistente.cantidad + cantidad;
      const nuevoSubtotal = precio_unitario * nuevaCantidad;

      // Verificar stock
      if (producto.stock < nuevaCantidad) {
        return res.status(400).json({
          mensaje: 'Stock insuficiente para la cantidad total',
          stock_disponible: producto.stock,
          cantidad_actual_en_carrito: itemExistente.cantidad
        });
      }

      item = await itemExistente.update({
        cantidad: nuevaCantidad,
        precio_unitario,  // Actualizar con precio actual
        subtotal: nuevoSubtotal,
        // ✅ ACTUALIZAR CAMPOS NUEVOS
        precio_original: preciosActuales.precio_original,
        precio_oferta_aplicado: preciosActuales.precio_oferta,
        descuento_porcentaje: preciosActuales.descuento_porcentaje,
        id_oferta_aplicada: preciosActuales.id_oferta_aplicada,
        es_precio_personalizado: false,
        fyh_precio_capturado: new Date(),
        precio_cambio: false,  // Resetear flag
        fyh_actualizacion: new Date()
      });
    } else {
      // Crear nuevo item
      item = await CarritoWebItems.create({
        id_carrito: carrito.id_carrito,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal,
        // ✅ GUARDAR CAMPOS NUEVOS
        precio_original: preciosActuales.precio_original,
        precio_oferta_aplicado: preciosActuales.precio_oferta,
        descuento_porcentaje: preciosActuales.descuento_porcentaje,
        id_oferta_aplicada: preciosActuales.id_oferta_aplicada,
        es_precio_personalizado: false,
        fyh_precio_capturado: new Date(),
        precio_cambio: false,
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });
    }

    // Recalcular total del carrito
    const nuevoTotal = await carrito.calcularTotal();
    await carrito.update({
      total_carrito: nuevoTotal,
      fyh_actualizacion: new Date()
    });

    // Retornar item completo
    // ...
  } catch (error) {
    logger.error('Error al agregar item:', error);
    res.status(500).json({ mensaje: 'Error al agregar item al carrito', error });
  }
}
```

---

### 2.3 Modificar `transformarItemsCarrito()` para Revalidar Precios

**Archivo:** `backend/src/controllers/CarritoController.ts`

**Modificar función existente:**

```typescript
static async transformarItemsCarrito(items: any[] | undefined): Promise<any[]> {
  if (!items || items.length === 0) {
    return [];
  }

  return await Promise.all(items.map(async item => {
    const producto = item.producto as any;
    const ofertas = producto?.ofertas || [];

    const productoTransformado = await CarritoController.transformarProductoConImagenes(
      producto,
      ofertas
    );

    // ✅ VALIDACIÓN DE STOCK (ya implementado en Fase 1)
    const stock_disponible = producto?.stock || 0;
    const cantidad_solicitada = item.cantidad;
    const tiene_stock = stock_disponible >= cantidad_solicitada;
    const sugerencia_cantidad = tiene_stock ? null : (stock_disponible > 0 ? stock_disponible : null);

    // ✅ REVALIDACIÓN DE PRECIOS (NUEVO)
    const preciosActuales = await CarritoController.calcularPrecioActualCompleto(producto);

    // Comparar precio guardado vs precio actual
    const precio_guardado = parseFloat(item.precio_unitario.toString());
    const precio_actual = preciosActuales.precio_final;
    const diferencia_precio = precio_actual - precio_guardado;
    const porcentaje_cambio = (diferencia_precio / precio_guardado) * 100;

    // Flag de cambio significativo (> 1%)
    const precio_cambio_significativo = Math.abs(porcentaje_cambio) > 1;

    // Calcular subtotales
    const subtotal_guardado = parseFloat(item.subtotal.toString());
    const subtotal_actual = precio_actual * cantidad_solicitada;

    return {
      ...item.toJSON(),
      producto: productoTransformado,
      // Información de stock (Fase 1)
      stock_disponible,
      tiene_stock,
      sugerencia_cantidad,
      cantidad_faltante: tiene_stock ? 0 : (cantidad_solicitada - stock_disponible),
      // ✅ INFORMACIÓN DE PRECIOS (Fase 2)
      precio_guardado,
      precio_actual,
      diferencia_precio,
      porcentaje_cambio,
      precio_cambio: precio_cambio_significativo,
      subtotal_guardado,
      subtotal_actual,
      // Información de oferta guardada
      oferta_guardada: {
        id_oferta: item.id_oferta_aplicada,
        descuento_porcentaje: item.descuento_porcentaje,
        precio_oferta: item.precio_oferta_aplicado
      },
      // Información de oferta actual
      oferta_actual: {
        id_oferta: preciosActuales.id_oferta_aplicada,
        nombre_oferta: preciosActuales.nombre_oferta,
        descuento_porcentaje: preciosActuales.descuento_porcentaje,
        precio_oferta: preciosActuales.precio_oferta
      }
    };
  }));
}
```

---

### 2.4 Modificar `obtenerCarrito()` para Detectar Cambios de Precio

**Archivo:** `backend/src/controllers/CarritoController.ts`

**Modificar función existente (~línea 366):**

```typescript
static async obtenerCarrito(req: Request, res: Response) {
  try {
    const id_cliente = req.usuario?.id_cliente;

    // ... buscar carrito ...

    // Transformar items con validación de stock y precios
    const itemsTransformados = await CarritoController.transformarItemsCarrito(carrito.items);

    // ✅ VERIFICAR si hay items sin stock (Fase 1)
    const itemsSinStock = itemsTransformados.filter(item => !item.tiene_stock);
    const tiene_items_sin_stock = itemsSinStock.length > 0;

    // ✅ VERIFICAR si hay items con precio cambiado (Fase 2)
    const itemsConPrecioCambiado = itemsTransformados.filter(item => item.precio_cambio);
    const tiene_cambios_precio = itemsConPrecioCambiado.length > 0;

    // Calcular totales
    const totalConPreciosGuardados = itemsTransformados.reduce(
      (sum, item) => sum + item.subtotal_guardado,
      0
    );

    const totalConPreciosActuales = itemsTransformados.reduce(
      (sum, item) => sum + item.subtotal_actual,
      0
    );

    const diferencia_total = totalConPreciosActuales - totalConPreciosGuardados;

    // Construir respuesta del carrito
    const carritoResponse = {
      id_carrito: carrito.id_carrito,
      id_cliente: carrito.id_cliente,
      estado: carrito.estado,
      items: itemsTransformados,
      total_carrito: totalConPreciosGuardados,  // Total guardado (por compatibilidad)
      total_actual: totalConPreciosActuales,     // ✅ Total actualizado
      diferencia_total,                          // ✅ Diferencia en totales
      cantidad_items: itemsTransformados.length,
      cargando: false,
      error: null,
      // Información de stock (Fase 1)
      tiene_items_sin_stock,
      items_sin_stock: itemsSinStock.map(item => ({
        id_item: item.id_item,
        id_producto: item.id_producto,
        nombre_producto: item.producto?.nombre,
        cantidad_solicitada: item.cantidad,
        stock_disponible: item.stock_disponible,
        sugerencia_cantidad: item.sugerencia_cantidad
      })),
      // ✅ INFORMACIÓN DE PRECIOS (Fase 2)
      tiene_cambios_precio,
      items_con_cambio_precio: itemsConPrecioCambiado.map(item => ({
        id_item: item.id_item,
        id_producto: item.id_producto,
        nombre_producto: item.producto?.nombre,
        precio_guardado: item.precio_guardado,
        precio_actual: item.precio_actual,
        diferencia_precio: item.diferencia_precio,
        porcentaje_cambio: item.porcentaje_cambio,
        subtotal_guardado: item.subtotal_guardado,
        subtotal_actual: item.subtotal_actual
      }))
    };

    logger.info('Carrito obtenido exitosamente', {
      operacion: 'obtener_carrito',
      cliente_id: id_cliente,
      cantidad_items: itemsTransformados.length,
      total_guardado: totalConPreciosGuardados,
      total_actual: totalConPreciosActuales,
      diferencia_total,
      tiene_items_sin_stock,
      tiene_cambios_precio,
      items_con_cambio_precio_count: itemsConPrecioCambiado.length,
      success: true
    });

    return res.json({ carrito: carritoResponse });

  } catch (error) {
    logger.error('Error al obtener carrito:', error);
    return res.status(500).json({ mensaje: 'Error al obtener el carrito', error });
  }
}
```

---

### 2.5 Modificar `confirmarCompra()` para Validación Final

**Archivo:** `backend/src/controllers/CarritoController.ts`

**Modificar función existente (~línea 1010):**

```typescript
static async confirmarCompra(req: Request, res: Response) {
  try {
    const { observaciones, moneda = 'BOB', aceptar_cambio_precio = false } = req.body;
    const id_cliente = req.usuario?.id_cliente;

    // ... buscar carrito ...

    if (!carrito || !carrito.items || carrito.items.length === 0) {
      return res.status(400).json({ mensaje: 'No hay productos en el carrito' });
    }

    // Verificar stock (ya implementado)
    for (const item of carrito.items) {
      if (item.producto!.stock < item.cantidad) {
        return res.status(400).json({
          mensaje: `Stock insuficiente para ${item.producto!.nombre}`,
          producto: item.producto!.nombre,
          stock_disponible: item.producto!.stock,
          cantidad_solicitada: item.cantidad
        });
      }
    }

    // ✅ REVALIDAR PRECIOS ANTES DE CONFIRMAR (NUEVO)
    const itemsConPreciosActuales = await Promise.all(
      carrito.items.map(async (item) => {
        const productoActual = await Almacen.findByPk(item.id_producto, {
          include: [
            {
              model: Oferta,
              as: 'ofertas',
              where: {
                activo: true,
                fecha_inicio: { [Op.lte]: new Date() },
                fecha_fin: { [Op.gte]: new Date() }
              },
              required: false
            }
          ]
        });

        const preciosActuales = await CarritoController.calcularPrecioActualCompleto(productoActual);

        return {
          item,
          precio_guardado: parseFloat(item.precio_unitario.toString()),
          precio_actual: preciosActuales.precio_final,
          diferencia: preciosActuales.precio_final - parseFloat(item.precio_unitario.toString()),
          cambio_significativo: Math.abs(
            ((preciosActuales.precio_final - parseFloat(item.precio_unitario.toString())) / parseFloat(item.precio_unitario.toString())) * 100
          ) > 1  // Cambio > 1%
        };
      })
    );

    // Detectar items con cambios de precio significativos
    const itemsConCambio = itemsConPreciosActuales.filter(i => i.cambio_significativo);

    if (itemsConCambio.length > 0 && !aceptar_cambio_precio) {
      // ✅ RECHAZAR COMPRA SI HAY CAMBIOS Y NO SE ACEPTARON
      const detallesCambios = itemsConCambio.map(i => ({
        id_item: i.item.id_item,
        nombre_producto: i.item.producto?.nombre,
        precio_anterior: i.precio_guardado,
        precio_nuevo: i.precio_actual,
        diferencia: i.diferencia,
        porcentaje_cambio: ((i.diferencia / i.precio_guardado) * 100).toFixed(2)
      }));

      logger.warn('Compra rechazada por cambio de precios', {
        cliente_id: id_cliente,
        items_con_cambio: detallesCambios
      });

      return res.status(400).json({
        codigo: 'PRECIOS_CAMBIARON',
        mensaje: 'Los precios de algunos productos han cambiado. Por favor, revisa tu carrito y confirma nuevamente.',
        items_con_cambio: detallesCambios,
        requiere_confirmacion: true
      });
    }

    // ✅ ACTUALIZAR ITEMS CON PRECIOS ACTUALES
    for (const itemConPrecio of itemsConPreciosActuales) {
      if (itemConPrecio.cambio_significativo) {
        await CarritoWebItems.update({
          precio_unitario: itemConPrecio.precio_actual,
          subtotal: itemConPrecio.precio_actual * itemConPrecio.item.cantidad,
          precio_cambio: true,
          fyh_actualizacion: new Date()
        }, {
          where: { id_item: itemConPrecio.item.id_item }
        });
      }
    }

    // Recalcular total con precios actuales
    const totalActualizado = itemsConPreciosActuales.reduce(
      (sum, i) => sum + (i.precio_actual * i.item.cantidad),
      0
    );

    // Generar número de venta
    const ultimaVenta = await Venta.findOne({
      order: [['nro_venta', 'DESC']]
    });
    const nroVenta = ultimaVenta ? ultimaVenta.nro_venta + 1 : 1;

    // ✅ CREAR VENTA CON TOTAL ACTUALIZADO
    const venta = await Venta.create({
      nro_venta: nroVenta,
      id_cliente,
      id_carrito: carrito.id_carrito,
      total_pagado: totalActualizado,  // ← Precio ACTUAL validado
      observaciones,
      moneda,
      fyh_creacion: new Date(),
      fyh_actualizacion: new Date()
    });

    // Actualizar stock de productos
    for (const item of carrito.items) {
      await Almacen.update(
        {
          stock: item.producto!.stock - item.cantidad,
          fyh_actualizacion: new Date()
        },
        { where: { id_producto: item.id_producto } }
      );
    }

    // Marcar carrito como completado
    await carrito.update({
      estado: 'completado',
      fyh_actualizacion: new Date()
    });

    logger.info('Compra confirmada exitosamente', {
      operacion: 'confirmar_compra',
      cliente_id: id_cliente,
      id_venta: venta.id_venta,
      nro_venta: venta.nro_venta,
      total_pagado: totalActualizado,
      items_con_cambio_precio: itemsConCambio.length,
      success: true
    });

    return res.json({
      mensaje: 'Compra realizada exitosamente',
      venta: {
        id_venta: venta.id_venta,
        nro_venta: venta.nro_venta,
        total_pagado: venta.total_pagado,
        fyh_creacion: venta.fyh_creacion
      },
      carrito_id: carrito.id_carrito
    });

  } catch (error) {
    logger.error('Error al confirmar compra:', error);
    return res.status(500).json({ mensaje: 'Error al confirmar la compra', error });
  }
}
```

---

## 🔧 FASE 3: Frontend - Detección y Notificación

### 3.1 Actualizar Tipos TypeScript

**Archivo:** `frontend/src/types/carrito.ts`

```typescript
/**
 * Información de cambio de precio de un item
 */
export interface CambioPrecio {
  id_item: number;
  id_producto: number;
  nombre_producto: string;
  precio_guardado: number;
  precio_actual: number;
  diferencia_precio: number;
  porcentaje_cambio: number;
  subtotal_guardado: number;
  subtotal_actual: number;
}

/**
 * Información de oferta aplicada
 */
export interface OfertaAplicada {
  id_oferta: number | null;
  nombre_oferta?: string | null;
  descuento_porcentaje: number | null;
  precio_oferta: number | null;
}

/**
 * Item completo del carrito con validación de stock y precios
 */
export interface ItemCarritoCompleto {
  id_item: number;
  id_carrito: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  producto?: Product;

  // Validación de stock (Fase 1)
  stock_disponible?: number;
  tiene_stock?: boolean;
  sugerencia_cantidad?: number | null;
  cantidad_faltante?: number;

  // ✅ VALIDACIÓN DE PRECIOS (Fase 2)
  precio_guardado?: number;
  precio_actual?: number;
  diferencia_precio?: number;
  porcentaje_cambio?: number;
  precio_cambio?: boolean;
  subtotal_guardado?: number;
  subtotal_actual?: number;
  oferta_guardada?: OfertaAplicada;
  oferta_actual?: OfertaAplicada;
}

/**
 * Estado del carrito en la aplicación
 */
export interface EstadoCarrito {
  id_carrito: number | null;
  estado: 'activo' | 'completado' | 'abandonado';
  items: ItemCarritoCompleto[];
  total_carrito: number;
  cantidad_items: number;
  cargando: boolean;
  error: string | null;

  // Validación de stock (Fase 1)
  tiene_items_sin_stock?: boolean;
  items_sin_stock?: ItemSinStock[];

  // ✅ VALIDACIÓN DE PRECIOS (Fase 2)
  total_actual?: number;
  diferencia_total?: number;
  tiene_cambios_precio?: boolean;
  items_con_cambio_precio?: CambioPrecio[];
}
```

---

### 3.2 Modificar CarritoContext

**Archivo:** `frontend/src/contexts/CarritoContext.tsx`

**Modificar `obtenerCarrito()`:**

```typescript
const obtenerCarrito = useCallback(async () => {
  if (!isAuthenticated) {
    dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
    return;
  }

  try {
    dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
    dispatch({ type: 'ESTABLECER_ERROR', payload: null });

    const carrito = await obtenerCarritoService();

    // Validar stock (Fase 1)
    if (carrito.tiene_items_sin_stock && carrito.items_sin_stock && carrito.items_sin_stock.length > 0) {
      // ... notificación de stock (ya implementado) ...
    }

    // ✅ VALIDAR PRECIOS (Fase 2)
    if (carrito.tiene_cambios_precio && carrito.items_con_cambio_precio && carrito.items_con_cambio_precio.length > 0) {
      const itemsConCambio = carrito.items_con_cambio_precio;
      const count = itemsConCambio.length;

      // Determinar si son aumentos o disminuciones
      const aumentos = itemsConCambio.filter(i => i.diferencia_precio > 0);
      const disminuciones = itemsConCambio.filter(i => i.diferencia_precio < 0);

      let mensaje = '';
      if (aumentos.length > 0 && disminuciones.length === 0) {
        mensaje = count === 1
          ? `El precio de "${itemsConCambio[0].nombre_producto}" aumentó.`
          : `Los precios de ${count} productos aumentaron.`;
      } else if (disminuciones.length > 0 && aumentos.length === 0) {
        mensaje = count === 1
          ? `El precio de "${itemsConCambio[0].nombre_producto}" bajó.`
          : `Los precios de ${count} productos bajaron.`;
      } else {
        mensaje = `Los precios de ${count} productos cambiaron.`;
      }

      // Agregar información del total
      if (carrito.diferencia_total) {
        const diferenciaAbs = Math.abs(carrito.diferencia_total);
        mensaje += carrito.diferencia_total > 0
          ? ` Total aumentó en ${diferenciaAbs.toFixed(2)} BOB.`
          : ` Total disminuyó en ${diferenciaAbs.toFixed(2)} BOB.`;
      }

      // Tipo de notificación según el cambio
      const tipoNotificacion = carrito.diferencia_total && carrito.diferencia_total > 0 ? 'warning' : 'info';

      showNotification(
        mensaje,
        tipoNotificacion,
        10000  // 10 segundos para leer
      );

      console.warn('Items con precio cambiado:', itemsConCambio);
    }

    dispatch({ type: 'INICIALIZAR_CARRITO', payload: carrito });
  } catch (error: any) {
    console.error('Error al obtener carrito:', error);
    dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
    dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
  } finally {
    dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
  }
}, [isAuthenticated, obtenerCarritoService, showNotification]);
```

**Modificar `confirmarCompra()`:**

```typescript
const confirmarCompra = useCallback(async (datos: DatosCompra): Promise<VentaConfirmada | null> => {
  if (!isAuthenticated || !estado.id_carrito) {
    dispatch({ type: 'ESTABLECER_ERROR', payload: 'No hay carrito activo' });
    return null;
  }

  try {
    dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
    dispatch({ type: 'ESTABLECER_ERROR', payload: null });

    // ✅ VERIFICAR SI HAY CAMBIOS DE PRECIO
    if (estado.tiene_cambios_precio && !datos.aceptar_cambio_precio) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Debes aceptar los cambios de precio antes de continuar' });
      return null;
    }

    const resultado = await confirmarCompraService({
      ...datos,
      aceptar_cambio_precio: datos.aceptar_cambio_precio || false
    });

    // Si la compra fue exitosa, vaciar carrito
    dispatch({ type: 'VACIAR_CARRITO' });

    return resultado;
  } catch (error: any) {
    console.error('Error al confirmar compra:', error);

    // ✅ MANEJAR ERROR DE CAMBIO DE PRECIO
    if (error.response?.data?.codigo === 'PRECIOS_CAMBIARON') {
      dispatch({
        type: 'ESTABLECER_ERROR',
        payload: error.response.data.mensaje
      });

      // Re-obtener carrito para actualizar precios
      await obtenerCarrito();

      return null;
    }

    dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
    return null;
  } finally {
    dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
  }
}, [isAuthenticated, estado.id_carrito, estado.tiene_cambios_precio, confirmarCompraService, obtenerCarrito]);
```

---

### 3.3 Crear Componente de Alerta de Cambio de Precio

**Archivo:** `frontend/src/components/cart/PriceChangeAlert/PriceChangeAlert.tsx`

```typescript
import React from 'react';
import type { CambioPrecio } from '../../../types/carrito';
import styles from './PriceChangeAlert.module.css';

interface PriceChangeAlertProps {
  itemsConCambio: CambioPrecio[];
  diferencia_total: number;
  onAceptar: () => void;
  onCancelar?: () => void;
}

export const PriceChangeAlert: React.FC<PriceChangeAlertProps> = ({
  itemsConCambio,
  diferencia_total,
  onAceptar,
  onCancelar
}) => {
  const esAumento = diferencia_total > 0;

  return (
    <div className={styles.alert}>
      <div className={styles.header}>
        <span className={styles.icon}>{esAumento ? '⚠️' : 'ℹ️'}</span>
        <h3 className={styles.title}>
          {esAumento ? 'Los precios aumentaron' : 'Los precios cambiaron'}
        </h3>
      </div>

      <div className={styles.content}>
        <p className={styles.message}>
          Algunos productos en tu carrito cambiaron de precio desde que los agregaste:
        </p>

        <ul className={styles.itemList}>
          {itemsConCambio.map(item => (
            <li key={item.id_item} className={styles.item}>
              <span className={styles.itemName}>{item.nombre_producto}</span>
              <div className={styles.priceChange}>
                <span className={styles.oldPrice}>
                  {item.precio_guardado.toFixed(2)} BOB
                </span>
                <span className={styles.arrow}>→</span>
                <span className={item.diferencia_precio > 0 ? styles.newPriceUp : styles.newPriceDown}>
                  {item.precio_actual.toFixed(2)} BOB
                  <span className={styles.percentage}>
                    ({item.porcentaje_cambio > 0 ? '+' : ''}{item.porcentaje_cambio.toFixed(1)}%)
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.totalChange}>
          <span className={styles.totalLabel}>Diferencia en total:</span>
          <span className={esAumento ? styles.totalUp : styles.totalDown}>
            {esAumento ? '+' : ''}{diferencia_total.toFixed(2)} BOB
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        {onCancelar && (
          <button onClick={onCancelar} className={styles.btnCancel}>
            Cancelar
          </button>
        )}
        <button onClick={onAceptar} className={styles.btnAccept}>
          Aceptar y continuar
        </button>
      </div>
    </div>
  );
};
```

**Estilos:** `frontend/src/components/cart/PriceChangeAlert/PriceChangeAlert.module.css`

```css
.alert {
  background: var(--surface-primary);
  border: 2px solid var(--warning-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 600px;
  margin: var(--spacing-lg) auto;
}

.header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.icon {
  font-size: var(--font-size-2xl);
}

.title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.content {
  margin-bottom: var(--spacing-lg);
}

.message {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.itemList {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-lg) 0;
}

.item {
  padding: var(--spacing-md);
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
}

.itemName {
  display: block;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.priceChange {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.oldPrice {
  color: var(--text-tertiary);
  text-decoration: line-through;
}

.arrow {
  color: var(--text-secondary);
}

.newPriceUp {
  color: var(--error-text);
  font-weight: var(--font-weight-semibold);
}

.newPriceDown {
  color: var(--success-text);
  font-weight: var(--font-weight-semibold);
}

.percentage {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.totalChange {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--surface-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.totalLabel {
  color: var(--text-secondary);
}

.totalUp {
  color: var(--error-text);
  font-size: var(--font-size-lg);
}

.totalDown {
  color: var(--success-text);
  font-size: var(--font-size-lg);
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

.btnCancel {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
}

.btnCancel:hover {
  background: var(--surface-secondary);
}

.btnAccept {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all 0.2s ease;
}

.btnAccept:hover {
  background: var(--primary-dark);
}
```

---

### 3.4 Integrar en Página de Checkout

**Archivo:** `frontend/src/pages/Checkout/Checkout.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useCarrito } from '../../contexts/CarritoContext';
import { PriceChangeAlert } from '../../components/cart/PriceChangeAlert/PriceChangeAlert';

export const Checkout: React.FC = () => {
  const { estado, confirmarCompra } = useCarrito();
  const [aceptoCambios, setAceptoCambios] = useState(false);

  // Resetear aceptación si cambian los precios
  useEffect(() => {
    if (estado.tiene_cambios_precio) {
      setAceptoCambios(false);
    }
  }, [estado.tiene_cambios_precio]);

  const handleConfirmarCompra = async () => {
    if (estado.tiene_cambios_precio && !aceptoCambios) {
      alert('Debes aceptar los cambios de precio antes de continuar');
      return;
    }

    await confirmarCompra({
      aceptar_cambio_precio: aceptoCambios,
      // ... otros datos
    });
  };

  return (
    <div>
      {/* Alerta de cambio de precio */}
      {estado.tiene_cambios_precio && estado.items_con_cambio_precio && !aceptoCambios && (
        <PriceChangeAlert
          itemsConCambio={estado.items_con_cambio_precio}
          diferencia_total={estado.diferencia_total || 0}
          onAceptar={() => setAceptoCambios(true)}
          onCancelar={() => {
            // Volver al carrito
            window.history.back();
          }}
        />
      )}

      {/* Resumen de compra */}
      <div>
        <h2>Total a pagar:</h2>
        <p className={estado.tiene_cambios_precio ? 'price-changed' : ''}>
          {estado.total_actual?.toFixed(2) || estado.total_carrito.toFixed(2)} BOB
        </p>
        {estado.tiene_cambios_precio && (
          <p className="old-price">
            Anterior: {estado.total_carrito.toFixed(2)} BOB
          </p>
        )}
      </div>

      <button
        onClick={handleConfirmarCompra}
        disabled={estado.tiene_cambios_precio && !aceptoCambios}
      >
        Confirmar Compra
      </button>
    </div>
  );
};
```

---

## 🧪 FASE 4: Testing y Validación

### 4.1 Tests Unitarios Backend

**Archivo:** `backend/tests/unit/CarritoController.test.ts`

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CarritoController } from '../../src/controllers/CarritoController';

describe('CarritoController - Revalidación de Precios', () => {
  describe('calcularPrecioActualCompleto', () => {
    it('debe calcular precio sin oferta correctamente', async () => {
      const producto = {
        precio_venta: '999.99',
        ofertas: []
      };

      const resultado = await CarritoController.calcularPrecioActualCompleto(producto);

      expect(resultado.precio_original).toBe(999.99);
      expect(resultado.precio_oferta).toBeNull();
      expect(resultado.precio_final).toBe(999.99);
      expect(resultado.en_oferta).toBe(false);
    });

    it('debe calcular precio con oferta activa', async () => {
      const producto = {
        precio_venta: '999.99',
        ofertas: [{
          id_oferta: 1,
          nombre_oferta: 'Descuento 20%',
          tipo_descuento: 'porcentaje',
          valor_descuento: 20
        }]
      };

      const resultado = await CarritoController.calcularPrecioActualCompleto(producto);

      expect(resultado.precio_original).toBe(999.99);
      expect(resultado.precio_oferta).toBe(799.99);
      expect(resultado.en_oferta).toBe(true);
      expect(resultado.id_oferta_aplicada).toBe(1);
    });
  });

  describe('confirmarCompra - Validación de precios', () => {
    it('debe rechazar compra si precio cambió y no se aceptó', async () => {
      // Mock de carrito con precio viejo
      const carritoMock = {
        items: [{
          id_item: 1,
          id_producto: 10,
          cantidad: 2,
          precio_unitario: 799.99,  // Precio viejo
          producto: {
            nombre: 'iPhone 13 Pro',
            stock: 10
          }
        }]
      };

      // Precio actual es diferente
      const precioActualMock = {
        precio_final: 879.99  // Precio nuevo
      };

      // ... test ...
    });
  });
});
```

---

### 4.2 Tests E2E

**Archivo:** `tests/e2e/carrito-precio-cambio.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Carrito - Cambio de Precio', () => {
  test('debe mostrar alerta cuando precio cambió', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 2. Agregar producto al carrito
    await page.goto('/producto/10');
    await page.click('button:has-text("Agregar al carrito")');

    // 3. Simular cambio de precio en backend (via API)
    await page.request.put('/api/almacen/productos/10', {
      data: { precio_venta: 1099.99 }
    });

    // 4. Volver a abrir carrito
    await page.click('a[href="/carrito"]');

    // 5. Verificar que aparece notificación
    await expect(page.locator('.notification')).toContainText('precio');

    // 6. Verificar que se muestra alerta de cambio
    await expect(page.locator('.price-change-alert')).toBeVisible();
  });
});
```

---

## 📚 FASE 5: Documentación y Deploy

### 5.1 Documentación Técnica

- ✅ Este documento
- Actualizar `docs/api/ENDPOINTS.md` con nuevos campos
- Actualizar `docs/database/SCHEMA.md` con nuevas columnas
- Crear `docs/GUIA_REVALIDACION_PRECIOS.md` para equipo

---

### 5.2 Guía de Usuario

Crear documento para usuarios sobre:
- Qué pasa si los precios cambian
- Cómo aceptar cambios de precio
- Qué significa cada notificación

---

### 5.3 Deploy Gradual

**Estrategia recomendada:**

1. **Semana 1:** Deploy de Fase 1 (BD y modelos)
   - Ejecutar migración
   - Monitorear logs
   - Sin cambios visibles para usuarios

2. **Semana 2:** Deploy de Fase 2 (Backend)
   - Activar revalidación
   - Monitorear performance
   - Verificar que no hay errores

3. **Semana 3:** Deploy de Fase 3 (Frontend)
   - Activar notificaciones
   - Monitorear feedback de usuarios
   - Ajustar mensajes según necesidad

---

## ⏱️ Estimación de Tiempo

| Fase | Tarea | Tiempo | Responsable |
|------|-------|--------|-------------|
| 1 | Migración BD | 2 horas | Backend Dev |
| 1 | Actualizar modelos | 1 hora | Backend Dev |
| 2 | calcularPrecioActualCompleto | 2 horas | Backend Dev |
| 2 | Modificar agregarItem | 2 horas | Backend Dev |
| 2 | Modificar transformarItemsCarrito | 3 horas | Backend Dev |
| 2 | Modificar obtenerCarrito | 2 horas | Backend Dev |
| 2 | Modificar confirmarCompra | 3 horas | Backend Dev |
| 3 | Actualizar tipos TS | 1 hora | Frontend Dev |
| 3 | Modificar CarritoContext | 3 horas | Frontend Dev |
| 3 | Componente PriceChangeAlert | 4 horas | Frontend Dev |
| 3 | Integrar en Checkout | 2 horas | Frontend Dev |
| 4 | Tests backend | 4 horas | QA/Dev |
| 4 | Tests frontend | 3 horas | QA/Dev |
| 4 | Tests E2E | 3 horas | QA/Dev |
| 5 | Documentación | 3 horas | Tech Writer/Dev |
| **TOTAL** | | **38 horas** | **~5 días** |

---

## 📋 Checklist de Implementación

### Base de Datos
- [x] Crear migración SQL
- [x] Ejecutar en ambiente de desarrollo
- [x] Verificar columnas agregadas
- [x] Probar rollback
- [ ] Ejecutar en staging
- [ ] Ejecutar en producción

### Backend
- [x] Actualizar modelo CarritoWebItems
- [x] Implementar calcularPrecioActualCompleto()
- [x] Modificar agregarItem()
- [x] Modificar transformarItemsCarrito()
- [x] Modificar obtenerCarrito()
- [x] Modificar confirmarCompra()
- [x] Agregar logs relevantes
- [x] **MEJORA ADICIONAL:** Actualización automática de precios en BD al cargar carrito
- [ ] Tests unitarios (pendiente)

### Frontend
- [x] Actualizar tipos TypeScript
- [x] Modificar CarritoContext
- [x] Crear PriceChangeAlert component
- [x] Integrar en CartSummary (modificado del plan original)
- [x] Agregar estilos CSS responsive
- [x] Modificar CartItemCard para mostrar cambios de precio visualmente
- [x] Modificar CartSummary para usar totales actuales
- [ ] Tests unitarios (pendiente)
- [ ] Tests E2E (pendiente)

### Documentación
- [x] Actualizar este documento (PLAN_REVALIDACION_PRECIOS.md)
- [ ] Actualizar docs/api/ENDPOINTS.md
- [ ] Actualizar docs/database/SCHEMA.md
- [ ] Crear guía de usuario
- [ ] Actualizar CHANGELOG.md

### Deploy
- [ ] Code review
- [ ] Merge a develop
- [ ] Deploy a staging
- [ ] Pruebas en staging
- [ ] Deploy a producción
- [ ] Monitoreo post-deploy
- [ ] Comunicar cambios al equipo

---

## 🎯 Resultado Esperado

**ANTES de implementar:**
```
Cliente agrega iPhone a $799
↓ (2 semanas) Precio sube a $879
↓ Cliente compra
✗ Se cobra $799 (pierde $80)
```

**DESPUÉS de implementar:**
```
Cliente agrega iPhone a $799
↓ (2 semanas) Precio sube a $879
↓ Cliente abre carrito
✓ Notificación: "El precio de iPhone 13 Pro aumentó"
✓ Alerta detallada: "$799 → $879 (+10%)"
✓ Cliente acepta cambio
↓ Cliente compra
✓ Se cobra $879 (precio correcto)
✓ Registro en BD de qué precio se cobró
```

---

## 🎉 Resumen de Implementación

### ✅ Lo que se implementó exitosamente:

#### **FASE 1: Base de Datos** - COMPLETADA
- ✅ Migración SQL ejecutada (`20251028_agregar_auditoria_precios_carrito_v3.sql`)
- ✅ 7 nuevos campos agregados a `tb_carritoweb_items`
- ✅ Modelo Sequelize actualizado con validaciones
- ✅ Foreign keys e índices creados

#### **FASE 2: Backend** - COMPLETADA
- ✅ Función `calcularPrecioActualCompleto()` implementada
- ✅ `agregarItem()` modificado para guardar snapshot de precios
- ✅ `transformarItemsCarrito()` modificado para revalidar precios
- ✅ `obtenerCarrito()` modificado para detectar cambios
- ✅ `confirmarCompra()` modificado para validación final
- ✅ **MEJORA ADICIONAL:** Actualización automática de BD al detectar cambios

#### **FASE 3: Frontend** - COMPLETADA
- ✅ Tipos TypeScript actualizados (`CambioPrecio`, `OfertaAplicada`)
- ✅ `CarritoContext` modificado con notificaciones inteligentes
- ✅ Componente `PriceChangeAlert` creado con modal de confirmación
- ✅ Integración en `CartSummary` para manejo de cambios
- ✅ **MEJORA ADICIONAL:** Visualización inline en `CartItemCard`
- ✅ **MEJORA ADICIONAL:** Indicador de ajuste en resumen del carrito
- ✅ Estilos CSS responsive completos

### 🚀 Mejoras Adicionales Implementadas

**Más allá del plan original, se agregaron:**

1. **Actualización Automática de Base de Datos:**
   - Al detectar cambio de precio, el sistema actualiza automáticamente los registros en `tb_carritoweb_items`
   - El usuario ve el cambio UNA SOLA VEZ (en la primera carga)
   - Evita notificaciones repetidas en cargas subsecuentes
   - Mantiene la BD sincronizada sin intervención del usuario

2. **Visualización Inline de Cambios:**
   - Badge "Precio actualizado" en tarjetas de productos
   - Comparación visual: "Antes: X → Ahora: Y (+Z%)"
   - Colores semánticos: rojo para aumentos, verde para disminuciones
   - Subtotales calculados con precios actuales

3. **Indicador en Resumen:**
   - Línea "Ajuste de precio" en el resumen del carrito
   - Muestra diferencia total con iconos de tendencia
   - Total siempre refleja precios actuales

### 🔄 Flujo Completo Implementado

```
1. Usuario agrega producto al carrito
   └─ Precio guardado: 425 BOB
   └─ Snapshot completo guardado en BD

2. Precio del producto cambia a 500 BOB
   └─ Sistema NO modifica el carrito automáticamente

3. Usuario carga el carrito (Primera vez después del cambio)
   ├─ Backend detecta diferencia: 425 → 500
   ├─ Backend actualiza AUTOMÁTICAMENTE la BD:
   │  ├─ precio_unitario: 500
   │  ├─ subtotal: recalculado
   │  └─ fyh_precio_validado: NOW()
   ├─ Frontend recibe información del cambio
   ├─ Notificación toast: "El precio aumentó"
   ├─ Badge en tarjeta: "Precio actualizado"
   ├─ Comparación visual: "425 → 500 (+17.6%)"
   └─ Ajuste en resumen: "+75 BOB"

4. Usuario recarga el carrito (Segunda vez)
   ├─ BD ya tiene precio actualizado: 500
   ├─ Precio actual sigue siendo: 500
   ├─ NO hay diferencia
   └─ NO se muestra ningún cambio

5. Usuario intenta comprar
   ├─ Backend revalida precios una última vez
   ├─ Si hay cambios NO aceptados → rechaza compra
   ├─ Si cambios fueron aceptados → procesa con precio actual
   └─ Venta registrada con total correcto
```

### 📊 Archivos Modificados/Creados

**Backend:**
- `backend/src/models/CarritoWebItems.ts` - Modelo extendido
- `backend/src/controllers/CarritoController.ts` - Lógica completa
- `database/migrations/20251028_agregar_auditoria_precios_carrito_v3.sql` - Migración

**Frontend:**
- `frontend/src/types/carrito.ts` - Tipos extendidos
- `frontend/src/contexts/CarritoContext.tsx` - Manejo de estado
- `frontend/src/components/cart/PriceChangeAlert/` - Nuevo componente
  - `PriceChangeAlert.tsx`
  - `PriceChangeAlert.module.css`
- `frontend/src/components/cart/CartItemCard/` - Modificado
  - `CartItemCard.tsx` - Visualización inline
  - `CartItemCard.module.css` - Estilos nuevos
- `frontend/src/components/cart/CartSummary/` - Modificado
  - `CartSummary.tsx` - Integración y totales
  - `CartSummary.module.css` - Estilos overlay

### ⚠️ Notas Importantes

1. **Primer cambio vs cambios subsecuentes:**
   - El cambio se muestra visualmente solo la primera vez
   - La BD se actualiza automáticamente
   - Cargas posteriores ya no muestran diferencia

2. **Validación en confirmar compra:**
   - Siempre revalida precios antes de procesar
   - Requiere aceptación explícita si hubo cambios
   - Rechaza compra si no se aceptaron cambios

3. **Manejo de ofertas:**
   - Soporta cambios de oferta (nueva, expirada, modificada)
   - Guarda snapshot de oferta original
   - Compara oferta guardada vs oferta actual

### 📈 Próximos Pasos (Pendientes)

- [ ] Tests unitarios backend
- [ ] Tests unitarios frontend
- [ ] Tests E2E con Playwright
- [ ] Actualizar documentación de API
- [ ] Actualizar schema de BD
- [ ] Code review
- [ ] Deploy a staging
- [ ] Deploy a producción

---

**Desarrollado por:** Claude Code
**Solicitado por:** WiLi
**Fecha inicio:** 2025-10-28
**Fecha fin:** 2025-10-29
**Prioridad:** 🔥 CRÍTICA
**Estimación original:** 38 horas (~5 días)
**Tiempo real:** ~12 horas (1.5 días)
**Estado:** ✅ **FUNCIONANDO EN DESARROLLO**
