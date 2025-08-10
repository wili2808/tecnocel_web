# Optimización del Sistema de Logging

## 📝 Descripción General

Se ha implementado una mejora significativa en el sistema de logging para eliminar logs redundantes y proporcionar información más clara y consolidada. Los cambios se centran en evitar múltiples registros del mismo evento mientras se mantiene toda la información relevante en un formato más organizado.

## 🔄 Cambios Implementados

### 1. Middleware de Logging (`/backend/src/middleware/validateCarrito.ts`)

#### Mejoras en `logCarritoOperation`:

```typescript
export const logCarritoOperation = (operacion: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id_cliente = req.usuario?.id_cliente;
    const startTime = Date.now();

    const originalSend = res.json;
    res.json = function (data: any) {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;

      const logData = {
        operacion,
        cliente_id: id_cliente,
        status_code: res.statusCode,
        success,
        duration: `${duration}ms`,
        body:
          req.method === "POST" || req.method === "PUT" ? req.body : undefined,
        response_data: success ? undefined : data,
        user_agent: req.get("User-Agent"),
      };

      // Evitar logs duplicados
      if (!success && res.locals.errorLogged) {
        return originalSend.call(this, data);
      }

      // Mensaje descriptivo para operaciones exitosas
      let mensaje = `${req.method} ${req.path} | Operación: ${operacion}`;
      if (success && operacion === "agregar_item") {
        mensaje = `Producto agregado exitosamente al carrito | Cliente: ${id_cliente}`;
      }

      logger[logLevel](mensaje, logData);
      return originalSend.call(this, data);
    };
  };
};
```

#### Características principales:

- Registro unificado de operaciones
- Prevención de logs duplicados
- Mensajes descriptivos según el tipo de operación
- Inclusión de metadatos relevantes
- Manejo diferenciado de éxitos y errores

### 2. Controlador del Carrito (`/backend/src/controllers/CarritoController.ts`)

#### Eliminación de logs redundantes:

```typescript
// Antes
logger.info(
  `Item agregado exitosamente al carrito - Cliente: ${id_cliente}, Item ID: ${item.id_item}`
);

// Después
// El log de éxito se maneja en el middleware de logging
```

#### Se mantienen logs críticos:

- Logs de debug para desarrollo
- Logs de error con stack trace
- Logs de advertencia para situaciones específicas

### 3. Validación de Stock (`/backend/src/middleware/validateCarrito.ts`)

```typescript
if (cantidadTotal > producto.stock) {
  logger.warn("Intento de agregar más items que el stock disponible", {
    cliente_id: id_cliente,
    producto_id: id_producto,
    stock_disponible: producto.stock,
    cantidad_en_carrito: cantidadEnCarrito,
    cantidad_solicitada: cantidad,
    cantidad_total: cantidadTotal,
  });

  res.locals.errorLogged = true;

  return res.status(400).json({
    mensaje: `No es posible agregar ${
      cantidad || 1
    } unidad(es) más. Ya tienes ${cantidadEnCarrito} en el carrito y solo hay ${
      producto.stock
    } unidades disponibles.`,
    stock_disponible: producto.stock,
    cantidad_actual_en_carrito: cantidadEnCarrito,
    cantidad_solicitada: cantidad || 1,
    producto: {
      id: producto.id_producto,
      nombre: producto.nombre,
      precio: producto.precio_venta,
    },
  });
}
```

## 📋 Plan de Implementación en Otros Controladores

### 1. Controlador de Favoritos (`/backend/src/controllers/FavoritoController.ts`)

#### Cambios Necesarios:

- Eliminar logs redundantes en métodos `addFavorito` y `removeFavorito`
- Implementar middleware de logging específico para favoritos
- Consolidar mensajes de éxito/error

### 2. Controlador de Ofertas (`/backend/src/controllers/OfertaController.ts`)

#### Cambios Necesarios:

- Centralizar logs de asignación de productos a ofertas
- Mejorar mensajes de error en operaciones batch
- Implementar middleware de logging para ofertas

### 3. Controlador de Características (`/backend/src/controllers/CaracteristicaController.ts`)

#### Cambios Necesarios:

- Consolidar logs de operaciones CRUD
- Implementar middleware de logging para características
- Mejorar mensajes de validación

### 4. Middleware Global de Logging

Crear un nuevo middleware base que pueda ser extendido por otros controladores:

```typescript
// TODO: Crear en /backend/src/middleware/baseLogging.ts
export const createOperationLogger = (
  operacion: string,
  formatMessage?: (req: Request, success: boolean) => string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Implementar lógica base de logging
  };
};
```

## 🎯 Objetivos de la Optimización

1. **Claridad**:

   - Mensajes descriptivos y contextualizados
   - Información relevante agrupada
   - Formato consistente en todos los logs

2. **Eficiencia**:

   - Eliminación de redundancia
   - Reducción de ruido en los logs
   - Mejor uso del almacenamiento

3. **Debuggabilidad**:
   - Mantenimiento de información crítica
   - Trazabilidad de operaciones
   - Contexto completo en errores

## 📅 Cronograma de Implementación

1. **Fase 1 - Completada**:

   - ✅ Optimización del controlador de carrito
   - ✅ Implementación de middleware base
   - ✅ Mejora de mensajes de error

2. **Fase 2 - Próximos Pasos**:

   - ⏳ Controlador de Favoritos
   - ⏳ Controlador de Ofertas
   - ⏳ Pruebas de integración

3. **Fase 3 - Planificada**:
   - 📋 Controladores restantes
   - 📋 Documentación actualizada
   - 📋 Monitoreo y ajustes

## 🔍 Monitoreo y Mantenimiento

1. **Métricas a Seguir**:

   - Volumen de logs por operación
   - Tiempo de respuesta de operaciones
   - Tasa de errores y advertencias

2. **Mantenimiento**:
   - Revisión periódica de patrones de logging
   - Actualización de mensajes según feedback
   - Optimización continua del sistema

## 📚 Referencias

- [Documentación del Sistema de Logging](/backend/Implementacion_doc/DOCUMENTACION_SISTEMA_LOGGING.md)
- [API Backend](/backend/Implementacion_doc/DOCUMENTACION_BACKEND_API.md)
- [Plan de Mejoras](/backend/Implementacion_doc/PLAN_MEJORAS_BASE_DATOS.md)
