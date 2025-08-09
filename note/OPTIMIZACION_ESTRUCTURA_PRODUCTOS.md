# 📦 Optimización de la Estructura de Productos

## 🎯 Objetivo

Optimizar la estructura de datos de productos para:

1. Separar claramente la gestión interna del catálogo web
2. Mejorar el rendimiento y la organización de datos
3. Facilitar el mantenimiento y escalabilidad

## 🏗️ Nueva Estructura

### 1. Productos Base (`tb_productos_base`)

Tabla central que contiene la información básica y común del producto:

```sql
CREATE TABLE tb_productos_base (
  id_producto_base INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  modelo VARCHAR(255),
  descripcion_basica TEXT,
  descripcion_completa TEXT,
  id_categoria INT NOT NULL,
  id_marca INT,
  estado ENUM('activo', 'inactivo', 'descontinuado'),
  fyh_creacion DATETIME,
  fyh_actualizacion DATETIME
);
```

### 2. Inventario (`tb_inventario`)

Gestión interna del stock y precios:

```sql
CREATE TABLE tb_inventario (
  id_inventario INT PRIMARY KEY AUTO_INCREMENT,
  id_producto_base INT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT,
  stock_maximo INT,
  precio_compra DECIMAL(10,2) NOT NULL,
  precio_venta_base DECIMAL(10,2) NOT NULL,
  ubicacion VARCHAR(100),
  notas_internas TEXT,
  id_usuario INT NOT NULL,
  fyh_ultimo_ingreso DATETIME,
  fyh_ultima_salida DATETIME
);
```

### 3. Productos Web (`tb_productos_web`)

Información específica para la tienda online:

```sql
CREATE TABLE tb_productos_web (
  id_producto_web INT PRIMARY KEY AUTO_INCREMENT,
  id_producto_base INT NOT NULL,
  precio_venta_web DECIMAL(10,2) NOT NULL,
  destacado BOOLEAN DEFAULT FALSE,
  visible_web BOOLEAN DEFAULT TRUE,
  meta_titulo VARCHAR(255),
  meta_descripcion TEXT,
  palabras_clave VARCHAR(255),
  url_amigable VARCHAR(255)
);
```

### 4. Mejoras en Imágenes (`tb_producto_imagenes`)

Optimización de la gestión de imágenes:

```sql
ALTER TABLE tb_producto_imagenes
ADD COLUMN tipo ENUM('principal', 'galeria', 'thumbnail'),
ADD COLUMN dimensiones VARCHAR(20),
ADD COLUMN peso_kb INT,
ADD COLUMN formato VARCHAR(10);
```

## 🔄 Cambios Principales

1. **Separación de Responsabilidades**

   - Información básica del producto
   - Gestión de inventario
   - Presentación web
   - Gestión de imágenes mejorada

2. **Mejoras en Tipos de Datos**

   - Uso de DECIMAL para precios
   - ENUMs para estados y tipos
   - Campos específicos para SEO

3. **Optimización de Rendimiento**
   - Índices estratégicos
   - Normalización mejorada
   - Campos específicos por contexto

## 📊 Beneficios

### Para Gestión Interna

- ✅ Control detallado de inventario
- ✅ Seguimiento de movimientos
- ✅ Notas y ubicaciones físicas
- ✅ Historial de cambios

### Para Tienda Web

- ✅ Precios independientes
- ✅ SEO optimizado
- ✅ Control de visibilidad
- ✅ Productos destacados

### Técnicos

- ✅ Mejor rendimiento en consultas
- ✅ Mantenimiento simplificado
- ✅ Escalabilidad mejorada
- ✅ Integridad referencial

## 🔧 Implementación

### Pasos de Migración

1. **Preparación**

   ```bash
   # Respaldar base de datos
   mysqldump -u root -p tecnocel > backup_pre_optimizacion.sql
   ```

2. **Ejecutar Script**

   ```bash
   node scripts_test/optimize-product-structure.js
   ```

3. **Verificación**
   ```bash
   # Verificar integridad de datos
   node scripts_test/verify-product-migration.js
   ```

### Consideraciones

1. **Tiempo de Inactividad**

   - Programar migración en horario de bajo tráfico
   - Tiempo estimado: 15-30 minutos

2. **Respaldo**

   - Backup completo antes de migración
   - Script de rollback disponible

3. **Validación**
   - Verificar integridad de datos
   - Probar funcionalidad web
   - Revisar gestión interna

## 🔍 Monitoreo Post-Implementación

### Métricas a Observar

1. **Rendimiento**

   - Tiempo de respuesta de consultas
   - Uso de memoria/CPU
   - Tamaño de la base de datos

2. **Integridad**

   - Consistencia de datos
   - Relaciones entre tablas
   - Backups automáticos

3. **Funcionalidad**
   - Sistema de gestión
   - Tienda web
   - API endpoints

## 📝 Tareas Pendientes

- [ ] Actualizar APIs para nueva estructura
- [ ] Modificar frontend para nuevos campos
- [ ] Actualizar documentación de API
- [ ] Capacitar al personal en nuevos campos
- [ ] Configurar monitoreo

## 🆘 Soporte y Rollback

### Procedimiento de Rollback

```sql
-- Restaurar backup
mysql -u root -p tecnocel < backup_pre_optimizacion.sql
```

### Contactos de Soporte

- Soporte Técnico: [equipo técnico]
- Base de Datos: [DBA]
- Desarrollo Web: [equipo web]

## 🔜 Próximos Pasos

1. Optimización de consultas frecuentes
2. Implementación de caché
3. Mejoras en el sistema de imágenes
4. Automatización de backups

---

## ✅ Conclusión

La nueva estructura proporciona una base sólida para:

- Mejor organización de datos
- Mayor rendimiento
- Facilidad de mantenimiento
- Escalabilidad futura

Mantener esta documentación actualizada con cambios futuros.
