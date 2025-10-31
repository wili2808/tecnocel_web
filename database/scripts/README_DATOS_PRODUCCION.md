# Guía de Implementación - Datos de Producción TecnoCel

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [Prerequisitos](#prerequisitos)
3. [Corrección CRÍTICA del Modelo](#corrección-crítica-del-modelo)
4. [Preparación de Imágenes](#preparación-de-imágenes)
5. [Ejecución del Script](#ejecución-del-script)
6. [Verificación](#verificación)
7. [Solución de Problemas](#solución-de-problemas)

---

## Resumen

Este directorio contiene el script de generación de datos de producción para TecnoCel con **75+ productos electrónicos modernos** basados en el mercado boliviano 2025.

**Productos incluidos:**
- 📱 Smartphones (iPhone, Samsung, Xiaomi, Motorola, Infinix)
- 💻 Laptops (Gaming, Profesionales, MacBooks)
- 📲 Tablets (iPad, Samsung Galaxy Tab)
- 🎧 Audio (Auriculares, Parlantes)
- 🎮 Gaming (Consolas, Joysticks)
- ⌚ Wearables (Smartwatches, Smart Bands)
- 🔌 Accesorios (Cargadores, Fundas)

**Características:**
- ✅ Precios realistas del mercado boliviano (Bs)
- ✅ Stock simulado realista
- ✅ Características técnicas completas
- ✅ Múltiples imágenes por producto
- ✅ Productos destacados configurados
- ✅ Ofertas asignadas automáticamente

---

## Prerequisitos

### 1. Base de Datos

```bash
# Verificar que la base de datos existe
mysql -u root -p -e "SHOW DATABASES LIKE 'db_tecnocel_v%';"

# Si no existe, crear con el esquema más reciente
mysql -u root -p < database/backups/db_tecnocel_v5.sql
```

### 2. Usuario Administrador

El script asume que existe un usuario con `id_usuario = 1`.

```sql
-- Verificar
SELECT * FROM tb_usuarios WHERE id_usuario = 1;

-- Si no existe, crear usuario admin
INSERT INTO tb_usuarios (nombres_usuario, celular_usuario, email_usuario, password_usuario, id_rol, fyh_creacion, fyh_actualizacion)
VALUES ('Admin', '70000000', 'admin@tecnocel.com', '$2a$10$hashedpassword', 1, NOW(), NOW());
```

### 3. Categorías y Marcas

```sql
-- Verificar categorías
SELECT * FROM tb_categorias;

-- Verificar marcas
SELECT * FROM tb_marcas;

-- El script asume que estas tablas ya tienen datos
-- Si están vacías, restaurar desde db_tecnocel_v5.sql
```

### 4. Tipos de Características

```sql
-- Verificar tipos de características
SELECT * FROM tb_tipos_caracteristicas;

-- Deben existir los IDs del 1 al 15 mínimo
```

### 5. Variables de Entorno

```bash
# Verificar archivo backend/.env
cd backend
cat .env

# Debe contener:
# DB_NAME=db_tecnocel_v4  (o v5)
# DB_USER=root
# DB_PASSWORD=tu_contraseña
# DB_HOST=localhost
```

---

## Corrección CRÍTICA del Modelo

⚠️ **PASO OBLIGATORIO** - Debe realizarse ANTES de ejecutar el script.

### Problema Detectado

El modelo TypeScript `Almacen.ts` NO incluye los campos `modelo` e `id_marca` que SÍ existen en la base de datos.

### Solución

**Editar:** [backend/src/models/Almacen.ts](../../backend/src/models/Almacen.ts)

#### Paso 1: Agregar declaraciones de campos

```typescript
class Almacen extends Model {
  declare id_producto: number;
  declare codigo: string;
  declare nombre: string;
  declare descripcion: string | null;
  declare stock: number;
  declare stock_minimo: number | null;
  declare stock_maximo: number | null;
  declare precio_compra: string;
  declare precio_venta: string;
  declare fecha_ingreso: Date;
  declare id_usuario: number;
  declare id_categoria: number;

  // ✅ AGREGAR ESTOS DOS CAMPOS:
  declare modelo: string | null;
  declare id_marca: number | null;

  declare es_destacado: boolean;
  declare orden_destacado: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;

  // Declarar asociaciones
  declare imagenes?: any[];
  declare ofertas?: any[];
  declare caracteristicas?: any[];
}
```

#### Paso 2: Agregar en `Almacen.init()`

Ubicar la sección de `Almacen.init()` y agregar los campos después de `id_categoria`:

```typescript
Almacen.init({
  // ... campos existentes ...

  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_categorias',
      key: 'id_categoria'
    }
  },

  // ✅ AGREGAR ESTE CAMPO:
  modelo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  // ✅ AGREGAR ESTE CAMPO:
  id_marca: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_marcas',
      key: 'id_marca'
    }
  },

  es_destacado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },

  // ... resto de campos ...
}, {
  sequelize,
  modelName: 'Almacen',
  tableName: 'tb_almacen',
  timestamps: false
});
```

#### Paso 3: Verificar relación con Marca

**Archivo:** [backend/src/models/relaciones.ts](../../backend/src/models/relaciones.ts)

Verificar que estas líneas existen (líneas 35-37):

```typescript
// Nuevas relaciones para Marcas
Almacen.belongsTo(Marca, { foreignKey: 'id_marca', as: 'marca' });
Marca.hasMany(Almacen, { foreignKey: 'id_marca', as: 'productos' });
```

✅ Esta relación ya está definida correctamente.

#### Paso 4: Reconstruir TypeScript

```bash
cd backend
npm run build
```

#### Paso 5: Reiniciar servidor

```bash
npm run dev
```

### Verificación

```bash
# Probar endpoint
curl http://localhost:3000/api/almacen/productos/1

# Debe incluir los campos:
# "modelo": "...",
# "id_marca": 2,
# "marca": { "nombre_marca": "Apple", ... }
```

---

## Preparación de Imágenes

### Opción 1: Usar Placeholders (Recomendado para Testing)

El script ya incluye nombres de imágenes. Para testing rápido, crear imágenes placeholder:

```bash
# Crear directorio si no existe
mkdir -p backend/uploads/productos

# Crear imagen placeholder de 1200x1200
# Usar cualquier herramienta de edición de imágenes o descargar placeholders de:
# https://placehold.co/1200x1200/png
# https://via.placeholder.com/1200x1200
```

### Opción 2: Usar Imágenes Reales (Producción)

Para producción, descargar imágenes reales de productos:

**Fuentes recomendadas:**
- Sitios oficiales de fabricantes
- MercadoLibre Bolivia
- Amazon (para referencias)

**Nomenclatura de archivos:**

```
iphone_16_pro_max_titanium_front.jpg
iphone_16_pro_max_titanium_back.jpg
s24_ultra_titanium_front.jpg
xiaomi_14tpro_front.jpg
rog_strix_g16.jpg
...
```

**Especificaciones:**
- Formato: JPG, PNG o WebP
- Resolución recomendada: 1200x1200 píxeles
- Peso máximo: 5MB por imagen
- El backend las optimizará automáticamente a 800x800

**Script de descarga automática (opcional):**

```bash
# TODO: Crear script de descarga de imágenes desde APIs
# Por ahora, descargar manualmente
```

### Opción 3: Modificar Script para Saltear Imágenes

Si no tienes imágenes aún:

**Editar:** `generar_datos_produccion.js`

Comentar la sección de inserción de imágenes (líneas ~650-670):

```javascript
// Insertar imágenes
/* COMENTAR ESTA SECCIÓN TEMPORALMENTE
if (producto.imagenes && producto.imagenes.length > 0) {
  for (let i = 0; i < producto.imagenes.length; i++) {
    // ...
  }
}
*/
```

---

## Ejecución del Script

### Paso 1: Instalar Dependencias

```bash
cd backend
npm install mysql2 dotenv
```

### Paso 2: Verificar Conexión

```bash
# Probar conexión a MySQL
mysql -u root -p -e "SELECT DATABASE();"
```

### Paso 3: Backup de Seguridad (Recomendado)

```bash
# Crear backup antes de ejecutar el script
mysqldump -u root -p db_tecnocel_v4 > database/backups/backup_pre_datos_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 4: Ejecutar Script

```bash
# Desde la raíz del proyecto
node database/scripts/generar_datos_produccion.js
```

**Salida esperada:**

```
╔════════════════════════════════════════════════════════════╗
║  Script de Generación de Datos de Producción - TecnoCel  ║
╚════════════════════════════════════════════════════════════╝

🔌 Conectando a la base de datos...
✅ Conexión exitosa

🗑️  Limpiando datos existentes...
✅ Datos anteriores eliminados

📦 Insertando productos...

  ✓ 1. iPhone 16 Pro Max 256GB Titanio Natural
     └─ 2 imagen(es)
     └─ 12 característica(s)

  ✓ 2. Samsung Galaxy S24 Ultra 512GB Titanio Gris
     └─ 3 imagen(es)
     └─ 12 característica(s)

  ...

✅ Total de productos insertados: 75

🎁 Asignando productos a ofertas...
  ✓ Producto 1 → Oferta "Black Friday 2025"
  ✓ Producto 5 → Oferta "Liquidación Smartphones"
  ...

✅ Ofertas asignadas exitosamente

📊 Estadísticas finales:

  Productos por categoría:
    - CELULAR - IPHONE NUEVO: 3 productos (35 unidades)
    - CELULAR - SAMSUNG: 5 productos (58 unidades)
    - CELULAR - XIAOMI: 5 productos (175 unidades)
    - NOTEBOOKS: 8 productos (97 unidades)
    ...

  Total de imágenes: 150
  Total de características: 600
  Productos en oferta: 20

✅ ¡Datos de producción generados exitosamente!

🔌 Conexión cerrada

🎉 Proceso completado exitosamente
```

---

## Verificación

### 1. Verificar en Base de Datos

```sql
-- Contar productos
SELECT COUNT(*) as total_productos FROM tb_almacen;
-- Esperado: 75+

-- Ver productos con marcas
SELECT
  a.nombre,
  a.modelo,
  m.nombre_marca,
  a.precio_venta,
  a.stock
FROM tb_almacen a
LEFT JOIN tb_marcas m ON a.id_marca = m.id_marca
ORDER BY a.id_producto
LIMIT 10;

-- Ver productos destacados
SELECT nombre, orden_destacado
FROM tb_almacen
WHERE es_destacado = 1
ORDER BY orden_destacado;

-- Verificar imágenes
SELECT
  a.nombre,
  COUNT(pi.id_imagen) as cantidad_imagenes
FROM tb_almacen a
LEFT JOIN tb_producto_imagenes pi ON a.id_producto = pi.id_producto
GROUP BY a.id_producto
LIMIT 10;

-- Verificar características
SELECT
  a.nombre,
  tc.nombre_tipo,
  pc.valor,
  tc.unidad_medida
FROM tb_producto_caracteristicas pc
JOIN tb_almacen a ON pc.id_producto = a.id_producto
JOIN tb_tipos_caracteristicas tc ON pc.id_tipo = tc.id_tipo
WHERE a.id_producto = 1;
```

### 2. Verificar en API

```bash
# Listar todos los productos
curl http://localhost:3000/api/almacen/productos

# Ver producto específico con relaciones
curl http://localhost:3000/api/almacen/productos/1

# Ver productos destacados
curl http://localhost:3000/api/almacen/productos/destacados

# Ver productos en oferta
curl http://localhost:3000/api/ofertas/productos

# Buscar productos
curl "http://localhost:3000/api/almacen/productos/buscar?termino=iphone"

# Filtrar por categoría
curl http://localhost:3000/api/almacen/productos/categoria/2
```

### 3. Verificar en Frontend

```bash
# Iniciar frontend
cd frontend
npm run dev

# Abrir navegador
# http://localhost:5173

# Verificar:
# - Productos se muestran correctamente
# - Imágenes cargan (o placeholder si no hay imágenes)
# - Filtros funcionan
# - Búsqueda funciona
# - Productos destacados aparecen
# - Ofertas se muestran con descuentos
```

---

## Solución de Problemas

### Error: "Cannot find module 'mysql2'"

```bash
cd backend
npm install mysql2
```

### Error: "ER_ACCESS_DENIED_ERROR"

Verificar credenciales en `backend/.env`:

```bash
DB_USER=root
DB_PASSWORD=tu_contraseña_correcta
DB_HOST=localhost
```

### Error: "ER_BAD_DB_ERROR: Unknown database"

Crear la base de datos:

```bash
mysql -u root -p < database/backups/db_tecnocel_v5.sql
```

### Error: "Column 'modelo' not found in Almacen model"

No se aplicó la corrección del modelo TypeScript. Ver sección [Corrección CRÍTICA del Modelo](#corrección-crítica-del-modelo).

### Error: "Foreign key constraint fails (id_categoria)"

Las categorías no existen. Restaurar desde backup:

```sql
-- Insertar categorías desde db_tecnocel_v5.sql
-- O ejecutar manualmente los INSERTs de categorías
```

### Error: "Foreign key constraint fails (id_marca)"

Las marcas no existen. Restaurar desde backup o insertar:

```sql
INSERT INTO tb_marcas (nombre_marca, activo, fyh_creacion, fyh_actualizacion)
VALUES
('Samsung', 1, NOW(), NOW()),
('Apple', 1, NOW(), NOW()),
('Xiaomi', 1, NOW(), NOW()),
-- ... etc
```

### Error: "Duplicate entry for key 'codigo'"

Ya existen productos con esos códigos. El script primero limpia la tabla, pero si falla:

```sql
-- Limpiar manualmente
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM tb_producto_caracteristicas;
DELETE FROM tb_productos_ofertas;
DELETE FROM tb_producto_imagenes;
DELETE FROM tb_almacen;
SET FOREIGN_KEY_CHECKS = 1;
```

### No aparecen imágenes en el frontend

1. Verificar que existen en `backend/uploads/productos/`
2. Verificar que el servidor backend está sirviendo archivos estáticos
3. Usar imágenes placeholder temporalmente
4. Verificar en consola del navegador errores 404

### Productos no muestran marca

1. Verificar que se aplicó la corrección del modelo TypeScript
2. Reiniciar servidor backend después de cambios
3. Verificar que la relación está cargando:

```javascript
// En AlmacenController.ts
include: [
  { model: Categoria, attributes: ['nombre_categoria'] },
  { model: Marca, as: 'marca', attributes: ['nombre_marca', 'logo_marca'] }, // ✅
  // ...
]
```

---

## Personalización del Script

### Agregar Más Productos

Editar `catalogoProductos` en `generar_datos_produccion.js`:

```javascript
const catalogoProductos = {
  // ... categorías existentes ...

  mi_nueva_categoria: [
    {
      codigo: 'CODIGO-UNICO',
      nombre: 'Nombre del Producto',
      modelo: 'Modelo',
      descripcion: 'Descripción detallada',
      precio_compra: '1000',
      precio_venta: '1200',
      stock: 20,
      stock_minimo: 5,
      stock_maximo: 50,
      id_categoria: 1,
      id_marca: 2,
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['imagen1.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.5' },
        // ...
      ]
    }
  ]
};
```

### Modificar Rangos de Stock

```javascript
// Línea ~30
stock: producto.stock,              // Del catálogo
stock_minimo: producto.stock_minimo || Math.floor(producto.stock * 0.2),
stock_maximo: producto.stock_maximo || Math.floor(producto.stock * 2),
```

### Cambiar Fechas de Ingreso

```javascript
// Línea ~25
const fechaBase = new Date('2024-12-01');  // Cambiar fecha inicial
const fechaActual = new Date();            // Hasta hoy
```

---

## Siguientes Pasos

Después de generar los datos:

1. ✅ **Descargar/crear imágenes reales** de productos
2. ✅ **Crear ofertas adicionales** personalizadas
3. ✅ **Agregar comentarios/reseñas** de productos populares
4. ✅ **Configurar productos destacados** según estrategia de marketing
5. ✅ **Ajustar stock** basado en rotación real
6. ✅ **Implementar refinamientos opcionales** del esquema (ver [ANALISIS_BD_PRODUCCION.md](../ANALISIS_BD_PRODUCCION.md))

---

## Recursos Adicionales

- 📄 [Análisis Completo de BD](../ANALISIS_BD_PRODUCCION.md)
- 📄 [Migración del Modelo](../migrations/CRITICAL_fix_almacen_model.sql)
- 📄 [Documentación de API](../../docs/api/ENDPOINTS.md)
- 📄 [Esquema de BD](../../docs/database/SCHEMA.md)

---

## Soporte

Si encuentras problemas no documentados aquí:

1. Revisar logs del servidor backend
2. Verificar permisos de base de datos
3. Consultar documentación en `/docs`
4. Crear issue en el repositorio

---

**Versión:** 1.0
**Fecha:** 2025-10-30
**Autor:** Claude Code
