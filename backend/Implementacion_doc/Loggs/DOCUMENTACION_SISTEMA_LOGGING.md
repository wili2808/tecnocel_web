# 📝 Documentación del Sistema de Logging - TecnoCel Backend

## 📋 Descripción General

El sistema de logging está implementado utilizando Winston como biblioteca principal, con un enfoque en la simplicidad y claridad. Los logs están diseñados para ser fácilmente legibles y contener solo la información esencial necesaria para el seguimiento y depuración.

## 🎯 Características Principales

1. **Formato Limpio**:

   ```
   2025-08-10 01:28:31 | DELETE /cliente/93/producto/5 | Status: 200 | 14ms
   2025-08-10 01:28:31 | Producto removido de favoritos | {"clienteId": 93, "productoId": 5}
   ```

2. **Estructura Simple**:

   - `api.log`: Todas las peticiones HTTP y operaciones
   - `error.log`: Solo errores críticos del sistema

3. **Rotación Eficiente**:
   - Rotación semanal de archivos
   - Máximo 7 días de histórico
   - 10MB por archivo

## 🏗️ Arquitectura Actual

### Configuración Principal

```typescript
{
  level: process.env.LOG_LEVEL || 'info',
  maxFileSize: 5242880, // 5MB
  maxFiles: 5
}
```

### Características Implementadas

1. **Patrón Singleton**

   - Evita múltiples instancias del logger
   - Garantiza consistencia en la configuración

2. **Formato Personalizado**

   - Timestamp en formato YYYY-MM-DD HH:mm:ss
   - Nivel de log en mayúsculas
   - Stack trace para errores
   - Metadatos en formato JSON

3. **Sistema de Transports**

   - Archivo separado para errores (`error.log`)
   - Archivo combinado para todos los logs (`combined.log`)
   - Consola en modo desarrollo

4. **Rotación de Archivos**

   - Tamaño máximo por archivo: 5MB
   - Máximo 5 archivos de respaldo

5. **Middleware de Logging HTTP**
   - Registro de todas las peticiones API
   - Métricas de duración
   - Información del cliente
   - Nivel de log basado en código de estado

## 🔍 Análisis de la Implementación Actual

### Fortalezas

1. ✅ Implementación robusta del patrón Singleton
2. ✅ Buena separación de logs por nivel
3. ✅ Rotación de archivos implementada
4. ✅ Formato personalizado detallado
5. ✅ Middleware HTTP bien estructurado

### Áreas de Mejora

1. ❌ No hay categorización por módulos
2. ❌ Falta compresión de logs antiguos
3. ❌ No hay sistema de alertas
4. ❌ Falta correlación entre logs relacionados
5. ❌ No hay métricas de performance

## 🚀 Propuestas de Mejora

### 1. Categorización por Módulos

```typescript
const logger = createLogger("auth");
logger.info("Usuario autenticado", { userId: 123 });
```

### 2. Sistema de Correlación

```typescript
interface LogContext {
  correlationId: string;
  module: string;
  operation: string;
}
```

### 3. Compresión de Logs

- Implementar compresión gzip para archivos antiguos
- Mantener solo el último mes sin comprimir

### 4. Sistema de Alertas

- Integración con servicios de notificación
- Alertas por umbral de errores
- Monitoreo de performance

### 5. Métricas y Dashboard

- Contadores de errores por tipo
- Tiempos de respuesta promedio
- Uso de recursos

## 📦 Implementación Recomendada

### 1. Formato de Logs Simplificado

```typescript
// Configuración del formato para todos los logs
const customFormat = winston.format.printf(
  ({ timestamp, level, message, ...meta }) => {
    // Para requests de API
    if (meta.method && meta.path) {
      return `${timestamp} | ${meta.method} ${meta.path} | Status: ${meta.statusCode} | ${meta.duration}`;
    }

    // Para operaciones del sistema
    const metaStr = Object.keys(meta).length
      ? ` | ${JSON.stringify(meta)}`
      : "";
    return `${timestamp} | ${message}${metaStr}`;
  }
);

// Configuración del logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    customFormat
  ),
  transports: [
    new winston.transports.File({ filename: "logs/api.log" }),
    new winston.transports.Console(),
  ],
});
```

### 2. Ejemplos de Salida

```plaintext
// Log de API Request
2025-08-10 01:28:31 | DELETE /cliente/93/producto/5 | Status: 200 | 14ms

// Log de Operación
2025-08-10 01:28:31 | Producto removido de favoritos | {"clienteId": 93, "productoId": 5}
```

### 3. Configuración de Rotación

```typescript
const rotationConfig = {
  maxSize: "10MB",
  maxFiles: 7, // Una semana de logs
  datePattern: "YYYY-MM-DD",
};
```

## 🔧 Guía de Uso

1. **Inicialización**

```bash
# Crear estructura de directorios y archivos
npm run init:logs
```

2. **Logging de API**

````typescript
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${Date.now() - start}ms`
    });
  });

  next();
});

## 📊 Monitoreo y Mantenimiento

### Monitoreo Regular

- Revisar tamaño de archivos de log
- Monitorear tasa de errores
- Verificar performance de logging

### Mantenimiento

- Limpieza periódica de logs antiguos
- Verificación de rotación
- Actualización de configuraciones

## 🔐 Consideraciones de Seguridad

1. **Sanitización de Datos**

   - No logear información sensible
   - Sanitizar datos personales
   - Enmascarar tokens y credenciales

2. **Acceso a Logs**
   - Restringir acceso a archivos de log
   - Implementar auditoría de acceso
   - Encriptar logs sensibles

## 📚 Ejemplos de Uso

### Logging de Operaciones

```typescript
// Operación con cliente
logger.info("Producto removido de favoritos", {
  clienteId: 93,
  productoId: 5
});

// Error en operación
logger.error("Error al procesar pago", {
  clienteId: 93,
  error: "Timeout en conexión"
});

// Operación del sistema
logger.info("Servicio iniciado", {
  servicio: "OfertaController",
  estado: "disponible"
});
````

## ⚠️ Consideraciones Importantes

1. **Formato Consistente**

   - Mantener el mismo formato para todos los logs
   - Usar separadores `|` para mejor legibilidad
   - Incluir timestamp en formato uniforme

2. **Información Relevante**

   - Evitar información redundante
   - Limitar longitud de campos como userAgent
   - No incluir datos sensibles

3. **Mantenimiento**

   - Rotar logs semanalmente
   - Mantener solo 7 días de histórico
   - Revisar y limpiar logs regularmente

4. **Performance**
   - Logging asíncrono para no bloquear
   - Limitar tamaño de mensajes
   - Evitar logging excesivo

---

Esta documentación proporciona una visión completa del sistema de logging actual y las mejoras propuestas. Se recomienda implementar las mejoras de forma gradual, priorizando aquellas que ofrezcan mayor valor inmediato al proyecto.
