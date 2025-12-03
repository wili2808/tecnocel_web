# Guía Rápida - Generar Datos de Producción

## ✅ ¿Qué Hace el Script Mejorado?

El script **`generar_datos_produccion.js`** ahora es **COMPLETAMENTE AUTOSUFICIENTE**:

### 1. **Configura Categorías** 📁
- Crea/actualiza **11 categorías simplificadas** modernas
- Elimina la mezcla confusa de "CELULAR - SAMSUNG", "CELULAR - IPHONE"
- Usa categorías limpias: Smartphones, Laptops, Tablets, etc.

```javascript
Categorías que insertará:
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
```

### 2. **Configura Marcas** 🏷️
- Crea/actualiza **20 marcas** con logos y descripciones
- Incluye todas las marcas necesarias para los productos

```javascript
Marcas que insertará:
Apple, Samsung, Xiaomi, Motorola, Infinix, Honor, Realme,
JBL, Sony, Gamesir, PlayStation, Xbox, Nintendo,
HP, Asus, Dell, Lenovo, Acer, MSI, Razer
```

### 3. **Limpia Productos Antiguos** 🗑️
- Elimina SOLO productos, imágenes, características y ofertas
- **NO toca**: usuarios, clientes, ventas, carritos

### 4. **Inserta 75+ Productos Modernos** 📦
- Productos del mercado boliviano 2025
- Precios realistas en Bolivianos (Bs)
- Stock simulado
- Con campos `modelo` e `id_marca` incluidos

### 5. **Crea Imágenes** 🖼️
- Inserta nombres de 150+ imágenes
- **IMPORTANTE**: Los archivos físicos NO existen aún

### 6. **Agrega Características** ⚙️
- 600+ características técnicas
- Pantalla, RAM, Cámara, Batería, etc.

### 7. **Asigna Ofertas** 🎁
- 20 productos aleatorios con ofertas

---

## 🖼️ ¿Qué Onda con las Imágenes?

### El Problema
El script inserta **NOMBRES de imágenes** en la BD, pero los **archivos físicos NO existen**.

### 3 Soluciones

#### **Opción A: Generar Placeholders Automáticos** ⚡ (RECOMENDADO)

```bash
# Ejecutar el script de imágenes placeholder
node database/scripts/generar_imagenes_placeholder.js
```

**¿Qué hace?**
- Descarga automáticamente 150+ imágenes placeholder desde `placehold.co`
- Las guarda en `backend/uploads/productos/`
- Cada imagen tiene el nombre del producto
- Tamaño: 1200x1200 px
- Color azul TecnoCel (#0EA5E9)

**Ventajas:**
- ✅ Automático, 1 solo comando
- ✅ Nombres correctos
- ✅ Listo para testing inmediato
- ✅ Puede reemplazarse después

**Desventajas:**
- ⚠️ Son placeholders genéricos
- ⚠️ No son imágenes reales de productos

#### **Opción B: Comentar Sección de Imágenes** 🔧

Si no quieres imágenes por ahora:

**Editar:** `generar_datos_produccion.js` líneas ~1140-1160

```javascript
// COMENTAR ESTA SECCIÓN:
/*
if (producto.imagenes && producto.imagenes.length > 0) {
  for (let i = 0; i < producto.imagenes.length; i++) {
    // ... código de inserción de imágenes
  }
}
*/
```

**Ventajas:**
- ✅ No requiere archivos de imágenes
- ✅ Script se ejecuta más rápido

**Desventajas:**
- ❌ Productos sin imágenes en el frontend
- ❌ Experiencia incompleta

#### **Opción C: Descargar Imágenes Reales** 📸 (Para Producción)

Para una experiencia realista:

1. Descargar imágenes reales de:
   - Sitios oficiales (Apple, Samsung, etc.)
   - MercadoLibre Bolivia
   - Amazon (referencia)

2. Guardar en `backend/uploads/productos/` con los nombres exactos:
   ```
   iphone_16_pro_max_titanium_front.jpg
   s24_ultra_titanium_front.jpg
   xiaomi_14tpro_front.jpg
   ...
   ```

3. Formato recomendado:
   - JPG o PNG
   - 1200x1200 px (mínimo)
   - < 5MB por archivo

**Ventajas:**
- ✅ Experiencia realista
- ✅ Mejor presentación
- ✅ Listo para producción

**Desventajas:**
- ❌ Trabajo manual
- ❌ Tiempo de descarga/edición
- ❌ Posibles problemas de copyright

---

## 🚀 Pasos para Ejecutar

### 1. **Verificar Prerequisitos**

```bash
# Verificar que la BD existe
mysql -u root -p -e "SHOW DATABASES LIKE 'db_tecnocel%';"

# Verificar configuración
cat backend/.env | grep DB_
```

### 2. **Generar Imágenes Placeholder** (Opción A)

```bash
# Desde la raíz del proyecto
node database/scripts/generar_imagenes_placeholder.js
```

Salida esperada:
```
📥 Descargando 150 imágenes placeholder...
  ✓ iphone_16_pro_max_titanium_front.jpg
  ✓ iphone_16_pro_max_titanium_back.jpg
  ...
✅ Imágenes descargadas: 150
```

### 3. **Ejecutar Script Principal**

```bash
# Backup recomendado primero
mysqldump -u root -p db_tecnocel_v4 > database/backups/backup_$(date +%Y%m%d).sql

# Ejecutar script
node database/scripts/generar_datos_produccion.js
```

Salida esperada:
```
╔════════════════════════════════════════════════════════════╗
║  Script de Generación de Datos de Producción - TecnoCel  ║
╚════════════════════════════════════════════════════════════╝

🔌 Conectando a la base de datos...
✅ Conexión exitosa

📁 Configurando categorías...
  ✓ Smartphones
  ✓ Laptops
  ✓ Tablets
  ...
✅ Categorías configuradas

🏷️  Configurando marcas...
  ✓ Samsung
  ✓ Apple
  ✓ Xiaomi
  ...
✅ Marcas configuradas

🗑️  Limpiando productos existentes...
✅ Datos anteriores eliminados

📦 Insertando productos...
  ✓ 1. iPhone 16 Pro Max 256GB Titanio Natural
     └─ 2 imagen(es)
     └─ 12 característica(s)

  ✓ 2. Samsung Galaxy S24 Ultra 512GB
     └─ 3 imagen(es)
     └─ 12 característica(s)
  ...

✅ Total de productos insertados: 75

🎁 Asignando productos a ofertas...
✅ Ofertas asignadas exitosamente

📊 Estadísticas finales:
  Productos por categoría:
    - Smartphones: 26 productos (458 unidades)
    - Laptops: 8 productos (97 unidades)
    - Tablets: 5 productos (55 unidades)
    ...

  Total de imágenes: 150
  Total de características: 600
  Productos en oferta: 20

✅ ¡Datos de producción generados exitosamente!
```

### 4. **Verificar en API**

```bash
# Listar productos
curl http://localhost:3000/api/almacen/productos

# Ver un producto específico
curl http://localhost:3000/api/almacen/productos/1

# Debería incluir:
{
  "id_producto": 1,
  "nombre": "iPhone 16 Pro Max 256GB",
  "modelo": "iPhone 16 Pro Max",  ← ✅ Nuevo campo
  "id_marca": 2,                  ← ✅ Nuevo campo
  "marca": {                      ← ✅ Relación cargada
    "nombre_marca": "Apple",
    "logo_marca": "apple.png"
  },
  "Categoria": {
    "nombre_categoria": "Smartphones"  ← ✅ Categoría simplificada
  },
  "imagenes": [...],
  "caracteristicas": [...]
}
```

### 5. **Verificar en Frontend**

```bash
cd frontend
npm run dev
# Abrir http://localhost:5173
```

**Verifica que:**
- ✅ Se muestran productos
- ✅ Imágenes cargan (o placeholders)
- ✅ Marcas aparecen
- ✅ Filtros funcionan
- ✅ Búsqueda funciona

---

## ❓ FAQ

### ¿Por qué las categorías son diferentes?

**Antes:**
```
- CELULAR - SAMSUNG
- CELULAR - IPHONE
- CELULAR - XIAOMI
```
❌ Mezcla categoría con marca
❌ Redundante
❌ Difícil de filtrar

**Ahora:**
```
- Smartphones (categoría)
  - Samsung (marca)
  - Apple (marca)
  - Xiaomi (marca)
```
✅ Separación clara
✅ Flexible
✅ Fácil filtrar por categoría + marca

### ¿Puedo usar categorías antiguas?

Sí, pero tendrás que modificar el catálogo de productos manualmente para usar los IDs antiguos.

**NO recomendado** porque:
- Las categorías antiguas están mal estructuradas
- El script ya crea las nuevas simplificadas
- El análisis recomienda las nuevas

### ¿Qué pasa si ya tengo productos?

El script **ELIMINA** todos los productos existentes antes de insertar los nuevos.

**Haz backup primero:**
```bash
mysqldump -u root -p db_tecnocel_v4 > backup.sql
```

### ¿Puedo agregar más productos?

Sí, edita el array `catalogoProductos` en `generar_datos_produccion.js`:

```javascript
const catalogoProductos = {
  mi_categoria: [
    {
      codigo: 'CODIGO-UNICO',
      nombre: 'Mi Producto',
      modelo: 'Modelo X',
      // ... resto de campos
    }
  ]
};
```

### Las imágenes no cargan en el frontend

**Causas comunes:**
1. Los archivos no existen en `backend/uploads/productos/`
2. El servidor backend no está corriendo
3. Rutas incorrectas

**Solución:**
```bash
# Verificar que existen
ls backend/uploads/productos/

# Ejecutar script de placeholders si faltan
node database/scripts/generar_imagenes_placeholder.js

# Reiniciar backend
cd backend
npm run dev
```

---

## 📝 Resumen Ejecutivo

**El script mejorado:**
1. ✅ **Crea categorías simplificadas** (11 modernas)
2. ✅ **Crea marcas necesarias** (20 marcas)
3. ✅ **Limpia productos antiguos**
4. ✅ **Inserta 75+ productos** con modelo e id_marca
5. ✅ **Genera datos realistas** del mercado boliviano
6. ✅ **Es autosuficiente** - no requiere datos previos

**Para las imágenes:**
- **Opción rápida**: Ejecutar `generar_imagenes_placeholder.js`
- **Opción realista**: Descargar imágenes reales manualmente
- **Opción sin imágenes**: Comentar sección del script

---

**Fecha:** 2025-10-30
**Versión:** 2.0 (Mejorada con categorías, marcas e imágenes)
