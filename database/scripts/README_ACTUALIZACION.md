# Guía de Actualización de Base de Datos

Esta guía explica cómo ejecutar los scripts para actualizar la base de datos con categorías simplificadas, marcas corregidas y características de productos.

## 📋 Resumen de Cambios

### Problemas Identificados
1. **Categorías mezcladas con marcas**: 35+ categorías redundantes (ej: "CELULAR - SAMSUNG", "CELULAR - IPHONE") → 15 categorías simplificadas
2. **Productos sin marca**: 7 productos sin marca asignada
3. **Productos sin características**: Mayoría de productos sin especificaciones técnicas

### Solución Implementada
- ✅ **15 categorías simplificadas** (Smartphones, Laptops, Tablets, etc.)
- ✅ **Corrección de marcas** para productos sin marca o con marca incorrecta
- ✅ **Características técnicas** agregadas automáticamente según marca y modelo

---

## 🚀 Orden de Ejecución

### **IMPORTANTE**: Hacer backup antes de empezar

```bash
# Desde el directorio raíz del proyecto
mysqldump -u root -p db_tecnocel_v4 > database/backups/backup_antes_actualizacion_$(date +%Y%m%d).sql
```

---

### Script 1: Crear Categorías Simplificadas

**Archivo**: `1_crear_categorias_simplificadas.sql`

Este script crea las 15 categorías simplificadas:

1. Smartphones
2. Laptops
3. Tablets
4. Smartwatches
5. Auriculares
6. Parlantes
7. Consolas
8. Accesorios Gaming
9. Cargadores
10. Fundas y Protectores
11. Smart Bands
12. Power Banks
13. Drones
14. Cámaras
15. Accesorios Tablets

**Ejecutar**:
```bash
mysql -u root -p db_tecnocel_v4 < database/scripts/1_crear_categorias_simplificadas.sql
```

**Resultado esperado**:
```
✅ Categorías simplificadas creadas/actualizadas correctamente
Total categorías: 15
```

---

### Script 2: Actualizar Categorías de Productos

**Archivo**: `2_actualizar_categorias_productos.sql`

Este script actualiza TODOS los productos existentes (264) para usar las categorías simplificadas.

**Cambios principales**:
- Todos los "CELULAR - SAMSUNG", "CELULAR - IPHONE", etc. → **Smartphones (id: 1)**
- "NOTEBOOKS" + "MACBOOK" → **Laptops (id: 2)**
- "IPAD" + "TABLET-XIAOMI" + "TABLET-SAMSUNG" → **Tablets (id: 3)**
- "SMARTWATCH - APPLE WATCH" + "SMARTWATCH - GALAXY WATCH" → **Smartwatches (id: 4)**
- Etc.

**Ejecutar**:
```bash
mysql -u root -p db_tecnocel_v4 < database/scripts/2_actualizar_categorias_productos.sql
```

**Resultado esperado**:
```
✅ Smartphones actualizados: 196 productos
✅ Laptops actualizados: 7 productos
✅ Tablets actualizados: 10 productos
✅ Smartwatches actualizados: 11 productos
✅ Auriculares actualizados: 19 productos
... etc
```

---

### Script 3: Actualizar Marcas de Productos

**Archivo**: `3_actualizar_marcas_productos.sql`

Este script corrige productos sin marca o con marca incorrecta:

**Productos corregidos**:
- MacBook Air M3/M1 → Apple
- AirPods Pro → Apple
- Cargador Samsung → Samsung
- Notebook Victus → HP
- Auriculares IMIKI → Xiaomi (marca genérica común)
- Productos Realme → Realme

**Ejecutar**:
```bash
mysql -u root -p db_tecnocel_v4 < database/scripts/3_actualizar_marcas_productos.sql
```

**Resultado esperado**:
```
⚠️  PRODUCTOS SIN MARCA (ANTES): 7 productos
✅ PRODUCTOS ACTUALIZADOS
⚠️  PRODUCTOS AÚN SIN MARCA (DESPUÉS): 0 productos
```

---

### Script 4: Agregar Características a Smartphones

**Archivo**: `4_agregar_caracteristicas_smartphones.sql`

Este script agrega características técnicas estimadas a TODOS los smartphones basándose en:
- Marca del producto
- Modelo (extraído del nombre)
- Especificaciones típicas de cada modelo

**Características agregadas**:
- Pantalla (pulgadas)
- RAM (GB)
- Almacenamiento (GB)
- Cámara Principal (MP)
- Cámara Frontal (MP)
- Batería (mAh)
- Sistema Operativo (iOS/Android)
- Conectividad (4G/5G)

**NOTA**: ⚠️ Este script ELIMINA características existentes de smartphones y las regenera. Si tienes características personalizadas, coméntalas línea 24-27.

**Ejecutar**:
```bash
mysql -u root -p db_tecnocel_v4 < database/scripts/4_agregar_caracteristicas_smartphones.sql
```

**Resultado esperado**:
```
✅ CARACTERÍSTICAS DE SMARTPHONES AGREGADAS
Total smartphones: 196
Con características: 196
```

---

### Script 5: Agregar Características a Otros Productos

**Archivo**: `5_agregar_caracteristicas_otros_productos.sql`

Este script agrega características a:
- **Laptops**: Pantalla, RAM, Almacenamiento, Sistema Operativo
- **Tablets**: Pantalla, RAM, Almacenamiento, Sistema Operativo
- **Smartwatches**: Pantalla, Sistema Operativo, Batería
- **Auriculares**: Conectividad, Batería
- **Parlantes**: Conectividad, Batería
- **Consolas**: Almacenamiento, Conectividad
- **Joysticks**: Conectividad
- **Power Banks**: Batería
- **Accesorios Tablets**: Conectividad

**Ejecutar**:
```bash
mysql -u root -p db_tecnocel_v4 < database/scripts/5_agregar_caracteristicas_otros_productos.sql
```

**Resultado esperado**:
```
💻 Laptops: 7 productos actualizados
📱 Tablets: 10 productos actualizados
⌚ Smartwatches: 11 productos actualizados
... etc
✅ CARACTERÍSTICAS AGREGADAS A TODOS LOS PRODUCTOS
```

---

## 🔍 Verificación Post-Actualización

Después de ejecutar todos los scripts, verifica que todo esté correcto:

### 1. Verificar Categorías

```sql
SELECT
  c.nombre_categoria,
  COUNT(a.id_producto) as total_productos
FROM tb_categorias c
LEFT JOIN tb_almacen a ON c.id_categoria = a.id_categoria
WHERE c.id_categoria BETWEEN 1 AND 15
GROUP BY c.nombre_categoria
ORDER BY c.id_categoria;
```

**Esperado**:
- Smartphones: ~196 productos
- Laptops: ~7 productos
- Tablets: ~10 productos
- Etc.

### 2. Verificar Marcas

```sql
SELECT COUNT(*) as productos_sin_marca
FROM tb_almacen
WHERE id_marca IS NULL;
```

**Esperado**: `0` productos sin marca

### 3. Verificar Características

```sql
SELECT
  c.nombre_categoria,
  COUNT(DISTINCT a.id_producto) as total_productos,
  COUNT(DISTINCT pc.id_producto) as con_caracteristicas
FROM tb_categorias c
LEFT JOIN tb_almacen a ON c.id_categoria = a.id_categoria
LEFT JOIN tb_producto_caracteristicas pc ON a.id_producto = pc.id_producto
WHERE c.id_categoria BETWEEN 1 AND 15
GROUP BY c.nombre_categoria;
```

**Esperado**: Todos los productos deben tener características (excepto Fundas y Smart Bands que pueden estar vacíos).

---

## ⚠️ Notas Importantes

### Valores Aproximados

Las características agregadas son **estimaciones** basadas en:
- Especificaciones típicas de cada marca/modelo
- Información del nombre del producto
- Valores promedio del mercado

Para productos específicos, se recomienda revisar y ajustar manualmente las características usando el panel de administración.

### Productos sin Información Suficiente

Algunos productos pueden tener características genéricas si el nombre no contiene suficiente información. Revisa productos con nombres cortos o ambiguos.

### Categorías Antiguas

Las categorías antiguas (ID > 15) **NO se eliminan** para mantener integridad referencial. Solo se actualizan los productos para usar las nuevas categorías.

Si deseas eliminar las categorías antiguas vacías:

```sql
-- Verificar que estén vacías primero
SELECT id_categoria, nombre_categoria, COUNT(*) as productos
FROM tb_categorias c
LEFT JOIN tb_almacen a ON c.id_categoria = a.id_categoria
WHERE c.id_categoria > 15
GROUP BY c.id_categoria, c.nombre_categoria;

-- Solo eliminar si tienen 0 productos
DELETE FROM tb_categorias
WHERE id_categoria > 15
AND id_categoria NOT IN (SELECT DISTINCT id_categoria FROM tb_almacen);
```

---

## 🆘 Solución de Problemas

### Error: "Duplicate entry"

Si aparece este error al insertar características:
```sql
-- Limpiar características duplicadas
DELETE pc1 FROM tb_producto_caracteristicas pc1
INNER JOIN tb_producto_caracteristicas pc2
WHERE pc1.id_caracteristica > pc2.id_caracteristica
AND pc1.id_producto = pc2.id_producto
AND pc1.id_tipo = pc2.id_tipo;
```

### Restaurar Backup

Si algo sale mal, restaura el backup:
```bash
mysql -u root -p db_tecnocel_v4 < database/backups/backup_antes_actualizacion_YYYYMMDD.sql
```

---

## 📊 Estadísticas Esperadas

Después de ejecutar todos los scripts:

- ✅ **264 productos** actualizados
- ✅ **15 categorías** simplificadas
- ✅ **0 productos** sin marca
- ✅ **260+ productos** con características
- ✅ **1500+ características** agregadas

---

## 📞 Soporte

Si encuentras problemas durante la actualización, revisa:
1. Los logs de MySQL para errores específicos
2. La integridad de las relaciones (foreign keys)
3. Las características existentes antes de ejecutar los scripts

Para ajustes personalizados o problemas específicos, contacta al equipo de desarrollo.
