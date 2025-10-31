# Análisis Profundo de Base de Datos para Producción - TecnoCel

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual del Esquema](#estado-actual-del-esquema)
3. [Inconsistencias Críticas Detectadas](#inconsistencias-críticas-detectadas)
4. [Refinamientos Recomendados](#refinamientos-recomendados)
5. [Estrategia de Datos Realistas](#estrategia-de-datos-realistas)
6. [Catálogo de Productos Modernos](#catálogo-de-productos-modernos)
7. [Plan de Implementación](#plan-de-implementación)

---

## Resumen Ejecutivo

### Hallazgos Principales

**Estado Actual:**
- ✅ Esquema bien estructurado con relaciones correctas
- ✅ Sistema de características dinámicas flexible
- ✅ Sistema de ofertas híbrido implementado
- ✅ Soporte para múltiples imágenes por producto
- ⚠️ Modelo TypeScript desincronizado con BD
- ⚠️ Campos de precio almacenados como VARCHAR
- ⚠️ Datos de ejemplo desactualizados
- ❌ Falta campo `id_marca` en modelo TypeScript
- ❌ Falta campo `modelo` en modelo TypeScript

**Impacto de Inconsistencias:**
- **CRÍTICO**: El modelo `Almacen.ts` NO incluye campos que SÍ existen en BD
- **ALTO**: Los controladores actuales no pueden trabajar con marcas ni modelos
- **MEDIO**: Datos de ejemplo no representan productos electrónicos actuales

---

## Estado Actual del Esquema

### Tabla Principal: `tb_almacen`

**Esquema en Base de Datos (SQL):**
```sql
CREATE TABLE `tb_almacen` (
  `id_producto` INT PRIMARY KEY AUTO_INCREMENT,
  `codigo` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `modelo` VARCHAR(255) NULL,                    -- ❌ FALTA EN MODELO TS
  `descripcion` TEXT NULL,
  `stock` INT NOT NULL,
  `stock_minimo` INT NULL,
  `stock_maximo` INT NULL,
  `precio_compra` VARCHAR(255) NOT NULL,
  `precio_venta` VARCHAR(255) NOT NULL,
  `fecha_ingreso` DATE NOT NULL,
  `id_usuario` INT NOT NULL,
  `id_categoria` INT NOT NULL,
  `id_marca` INT NULL,                          -- ❌ FALTA EN MODELO TS
  `es_destacado` TINYINT(1) DEFAULT 0,
  `orden_destacado` INT DEFAULT 0,
  `fyh_creacion` DATETIME NOT NULL,
  `fyh_actualizacion` DATETIME NOT NULL,
  FOREIGN KEY (`id_categoria`) REFERENCES `tb_categorias`(`id_categoria`),
  FOREIGN KEY (`id_marca`) REFERENCES `tb_marcas`(`id_marca`),
  FOREIGN KEY (`id_usuario`) REFERENCES `tb_usuarios`(`id_usuario`)
);
```

**Modelo TypeScript Actual (`Almacen.ts`):**
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
  // ❌ FALTA: declare modelo: string | null;
  // ❌ FALTA: declare id_marca: number | null;
  declare es_destacado: boolean;
  declare orden_destacado: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}
```

### Entidades Relacionadas

#### 1. Categorías (`tb_categorias`)

**Categorías Actuales en BD:**
```
1  - CELULAR - SAMSUNG
2  - CELULAR - IPHONE NUEVO
3  - CELULAR - IPHONE USADO
4  - CONSOLA
8  - SMARTWATCH - GALAXY WATCH
12 - MACBOOK
14 - IPAD
15 - CELULAR - MOTOROLA
16 - CELULAR - INFINIX
17 - NOTEBOOKS
18 - SMARTWATCH - APPLE WATCH
19 - AURICULAR - AIRPODS
20 - AURICULAR - JBL
21 - FUNDA CELULAR
22 - CELULAR - XIAOMI
23 - PARLANTE/BOCINA
24 - AURICULAR - SAMSUNG
25 - AURICULAR - OTROS
26 - SMARTBAND
27 - CARGADOR - APPLE
28 - CARGADOR - OTROS
29 - JOYSTICK - PLAY STATION
30 - CONSOLAS
31 - JOYSTICK - XBOX
```

**Problemas Detectados:**
- ⚠️ Mezcla de categoría con marca ("CELULAR - SAMSUNG", "CELULAR - IPHONE")
- ⚠️ Categorías duplicadas ("CONSOLA" y "CONSOLAS")
- ⚠️ Categorías muy específicas que deberían ser filtros
- ⚠️ IDs no secuenciales (saltos grandes)

#### 2. Marcas (`tb_marcas`)

**Marcas Actuales:**
```
1  - Samsung
2  - Apple
3  - Xiaomi
4  - Motorola
5  - Infinix
6  - Honor
7  - Realme
8  - JBL
9  - Sony
10 - Gamesir
11 - PlayStation
12 - Xbox
13 - Nintendo
14 - HP
15 - Asus
16 - Dell
17 - Lenovo
18 - Acer
19 - MSI
20 - Razer
```

**Estado:** ✅ Bien estructuradas y actualizadas

#### 3. Tipos de Características (`tb_tipos_caracteristicas`)

**Tipos Definidos:**
```
1  - Pantalla (numero, pulgadas)
2  - RAM (numero, GB)
3  - Almacenamiento (numero, GB)
4  - Cámara Principal (numero, MP)
5  - Cámara Frontal (numero, MP)
6  - Batería (numero, mAh)
7  - Sistema Operativo (seleccion: Android, iOS, Windows, macOS)
8  - Conectividad (seleccion: 4G, 5G, WiFi 6, Bluetooth 5.0)
9  - Color (texto)
10 - Procesador (texto)
11 - Tarjeta Gráfica (texto)
12 - Peso (numero, g)
13 - Resistencia (texto)
14 - Carga Rápida (booleano)
15 - Carga Inalámbrica (booleano)
```

**Estado:** ✅ Sistema flexible y extensible

#### 4. Ofertas (`tb_ofertas`)

**Ofertas Existentes:**
```
1 - Black Friday 2025 (20% desc, vigente hasta 2025-10-31)
2 - Liquidación Smartphones (15% desc, vigente hasta 2025-10-31)
3 - Descuento Gaming (50 Bs desc, vigente hasta 2025-10-31)
```

**Estado:** ✅ Sistema híbrido funcional

---

## Inconsistencias Críticas Detectadas

### 1. CRÍTICO: Modelo TypeScript Incompleto

**Ubicación:** `backend/src/models/Almacen.ts`

**Problema:**
```typescript
// El modelo TypeScript NO define:
declare modelo: string | null;      // ❌ FALTA
declare id_marca: number | null;    // ❌ FALTA

// Pero la BD SÍ tiene estos campos
-- tb_almacen
`modelo` VARCHAR(255) NULL,
`id_marca` INT NULL,
```

**Impacto:**
- ❌ Los controladores no pueden acceder a `producto.modelo` ni `producto.id_marca`
- ❌ TypeScript no detecta errores al usar estos campos
- ❌ La relación con `Marca` está definida en `relaciones.ts` pero el FK no está en el modelo
- ❌ Inconsistencia entre código y BD

**Solución Requerida:**
```typescript
// Agregar a Almacen.ts:
declare modelo: string | null;
declare id_marca: number | null;

// Agregar en Almacen.init():
modelo: {
  type: DataTypes.STRING(255),
  allowNull: true
},
id_marca: {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: {
    model: 'tb_marcas',
    key: 'id_marca'
  }
}
```

### 2. ALTO: Tipo de Dato Incorrecto para Precios

**Problema:**
```sql
`precio_compra` VARCHAR(255) NOT NULL,
`precio_venta` VARCHAR(255) NOT NULL,
```

**Problemas:**
- ⚠️ No permite operaciones matemáticas directas en BD
- ⚠️ Requiere conversión constante en queries
- ⚠️ Puede almacenar valores no numéricos
- ⚠️ Ocupa más espacio que DECIMAL

**Solución Recomendada:**
```sql
`precio_compra` DECIMAL(10,2) NOT NULL,
`precio_venta` DECIMAL(10,2) NOT NULL,
```

**Migración Necesaria:**
```sql
ALTER TABLE tb_almacen
  MODIFY COLUMN precio_compra DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN precio_venta DECIMAL(10,2) NOT NULL;

-- Actualizar modelo TypeScript:
declare precio_compra: number;
declare precio_venta: number;

// En Almacen.init():
precio_compra: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false
},
precio_venta: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false
}
```

### 3. MEDIO: Categorías Mal Estructuradas

**Problema:**
```
CELULAR - SAMSUNG    ← Mezcla categoría + marca
CELULAR - IPHONE     ← Redundante, marca ya existe
CELULAR - MOTOROLA   ← Redundante
```

**Solución:**
- Simplificar categorías a tipos de producto
- Usar relación con `tb_marcas` para filtrar
- Permitir combinación flexible (Categoría + Marca)

**Categorías Recomendadas:**
```
1  - Smartphones
2  - Tablets
3  - Laptops
4  - Smartwatches
5  - Auriculares
6  - Parlantes
7  - Consolas
8  - Accesorios Gaming
9  - Cargadores
10 - Fundas y Protectores
11 - Smart Bands
```

---

## Refinamientos Recomendados

### 1. Mejoras al Esquema de Productos

#### A. Agregar Índices para Rendimiento

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_almacen_nombre ON tb_almacen(nombre);
CREATE INDEX idx_almacen_codigo ON tb_almacen(codigo);

-- Filtros frecuentes
CREATE INDEX idx_almacen_categoria ON tb_almacen(id_categoria);
CREATE INDEX idx_almacen_marca ON tb_almacen(id_marca);
CREATE INDEX idx_almacen_destacado ON tb_almacen(es_destacado, orden_destacado);

-- Ordenamiento por fecha
CREATE INDEX idx_almacen_fecha_ingreso ON tb_almacen(fecha_ingreso DESC);

-- Búsqueda de texto completo
CREATE FULLTEXT INDEX idx_almacen_busqueda ON tb_almacen(nombre, descripcion);
```

#### B. Agregar Campos Útiles

```sql
-- Campo para gestión de inventario
ALTER TABLE tb_almacen
  ADD COLUMN estado ENUM('disponible', 'agotado', 'descontinuado') DEFAULT 'disponible' AFTER stock_maximo,
  ADD COLUMN sku VARCHAR(100) UNIQUE AFTER codigo,
  ADD COLUMN peso DECIMAL(8,2) COMMENT 'Peso en gramos' AFTER descripcion,
  ADD COLUMN dimensiones VARCHAR(50) COMMENT 'Alto x Ancho x Profundo en cm' AFTER peso;

-- Campos de metadatos
ALTER TABLE tb_almacen
  ADD COLUMN vistas INT DEFAULT 0 COMMENT 'Contador de vistas del producto',
  ADD COLUMN ventas_totales INT DEFAULT 0 COMMENT 'Cantidad total vendida',
  ADD COLUMN calificacion_promedio DECIMAL(2,1) DEFAULT 0.0 COMMENT 'Promedio de calificaciones';
```

#### C. Agregar Constraints de Validación

```sql
-- Asegurar valores positivos
ALTER TABLE tb_almacen
  ADD CONSTRAINT chk_stock CHECK (stock >= 0),
  ADD CONSTRAINT chk_precio_compra CHECK (precio_compra >= 0),
  ADD CONSTRAINT chk_precio_venta CHECK (precio_venta >= 0),
  ADD CONSTRAINT chk_precio_venta_mayor CHECK (precio_venta >= precio_compra);
```

### 2. Mejoras al Sistema de Imágenes

#### A. Agregar Tipos de Imagen

```sql
ALTER TABLE tb_producto_imagenes
  ADD COLUMN tipo_imagen ENUM('producto', 'empaque', 'uso', 'detalle') DEFAULT 'producto' AFTER alt_text,
  ADD COLUMN ancho INT COMMENT 'Ancho en píxeles' AFTER orden,
  ADD COLUMN alto INT COMMENT 'Alto en píxeles' AFTER ancho,
  ADD COLUMN tamano INT COMMENT 'Tamaño en bytes' AFTER alto;
```

### 3. Mejoras al Sistema de Características

#### A. Agregar Validación de Valores

```sql
-- Tabla para validar valores según tipo
CREATE TABLE tb_validaciones_caracteristicas (
  id_validacion INT PRIMARY KEY AUTO_INCREMENT,
  id_tipo INT NOT NULL,
  regla_validacion VARCHAR(255),
  mensaje_error TEXT,
  fyh_creacion DATETIME NOT NULL,
  FOREIGN KEY (id_tipo) REFERENCES tb_tipos_caracteristicas(id_tipo)
);
```

### 4. Mejoras a Ofertas

#### A. Agregar Segmentación

```sql
ALTER TABLE tb_ofertas
  ADD COLUMN aplica_categorias JSON COMMENT 'Array de IDs de categorías' AFTER valor_descuento,
  ADD COLUMN aplica_marcas JSON COMMENT 'Array de IDs de marcas' AFTER aplica_categorias,
  ADD COLUMN requiere_codigo TINYINT(1) DEFAULT 0 AFTER limite_uso,
  ADD COLUMN codigo_promocion VARCHAR(50) UNIQUE AFTER requiere_codigo;
```

### 5. Nueva Tabla: Historial de Precios

```sql
CREATE TABLE tb_historial_precios (
  id_historial INT PRIMARY KEY AUTO_INCREMENT,
  id_producto INT NOT NULL,
  precio_compra_anterior DECIMAL(10,2),
  precio_venta_anterior DECIMAL(10,2),
  precio_compra_nuevo DECIMAL(10,2) NOT NULL,
  precio_venta_nuevo DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(255),
  id_usuario INT NOT NULL COMMENT 'Usuario que hizo el cambio',
  fyh_cambio DATETIME NOT NULL,
  FOREIGN KEY (id_producto) REFERENCES tb_almacen(id_producto) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES tb_usuarios(id_usuario),
  INDEX idx_producto_fecha (id_producto, fyh_cambio DESC)
);
```

---

## Estrategia de Datos Realistas

### Metodología

Para generar datos de producción realistas para una tienda de productos electrónicos, se recomienda:

#### 1. **Investigación de Mercado Real**

**Fuentes de Datos:**
- Precios actuales de MercadoLibre Bolivia
- Catálogos de importadores locales
- Especificaciones oficiales de fabricantes
- Reviews de usuarios reales

**Categorías Prioritarias:**
```
1. Smartphones (40% del inventario)
   - Gama alta: iPhone, Samsung Galaxy S/Z
   - Gama media: Xiaomi, Motorola, Samsung A
   - Gama baja: Infinix, Realme, Honor

2. Laptops (20% del inventario)
   - Gaming: Asus ROG, MSI, Acer Predator
   - Profesional: HP, Dell, Lenovo ThinkPad
   - Ultrabooks: MacBook, Dell XPS

3. Accesorios (25% del inventario)
   - Audio: Auriculares, parlantes
   - Gaming: Joysticks, consolas
   - Wearables: Smartwatches, smartbands

4. Tablets (10% del inventario)
   - iPad, Samsung Galaxy Tab

5. Otros (5% del inventario)
   - Cargadores, fundas, cables
```

#### 2. **Rangos de Precios Realistas (Bs - Bolivia)**

```javascript
const rangosPrecios = {
  smartphones: {
    gamaAlta: { min: 5000, max: 15000 },      // iPhone 15 Pro, S24 Ultra
    gamaMedia: { min: 1500, max: 5000 },      // Xiaomi, Motorola Edge
    gamaBaja: { min: 600, max: 1500 }         // Infinix, Realme básicos
  },
  laptops: {
    gaming: { min: 7000, max: 20000 },        // ROG, MSI, Predator
    profesional: { min: 4000, max: 12000 },   // ThinkPad, Dell Latitude
    basica: { min: 2500, max: 4000 }          // HP, Acer básicos
  },
  tablets: {
    premium: { min: 3000, max: 8000 },        // iPad Pro, Air
    media: { min: 1500, max: 3000 }           // iPad base, Galaxy Tab
  },
  audio: {
    auriculares: { min: 150, max: 2500 },     // JBL, Sony, AirPods
    parlantes: { min: 200, max: 3000 }        // JBL, Sony, Bose
  },
  gaming: {
    consolas: { min: 2500, max: 7000 },       // PS5, Xbox Series, Switch
    joysticks: { min: 300, max: 800 }         // DualSense, Xbox Elite
  },
  accesorios: {
    cargadores: { min: 50, max: 300 },
    fundas: { min: 30, max: 200 },
    smartwatches: { min: 800, max: 5000 }
  }
};
```

#### 3. **Stock Realista**

```javascript
const stockConfig = {
  alta_rotacion: { min: 15, max: 50 },     // Smartphones populares
  media_rotacion: { min: 5, max: 15 },     // Laptops, tablets
  baja_rotacion: { min: 1, max: 5 },       // Gaming, premium
  accesorios: { min: 20, max: 100 }        // Fundas, cargadores
};
```

#### 4. **Margen de Ganancia**

```javascript
const margenGanancia = {
  smartphones: 0.15,        // 15% sobre costo
  laptops: 0.12,           // 12% sobre costo
  tablets: 0.18,           // 18% sobre costo
  accesorios: 0.40,        // 40% sobre costo (mayor margen)
  audio: 0.25,             // 25% sobre costo
  gaming: 0.20             // 20% sobre costo
};
```

---

## Catálogo de Productos Modernos

### Smartphones - Gama Alta (2025)

#### iPhone (Apple)
```
1. iPhone 16 Pro Max 256GB
   - Precio: 12,500 Bs
   - Características: 6.9", A18 Pro, 48MP, 4685mAh, iOS 18, 5G, Titanio
   - Stock: 8
   - Categoría: Smartphones, Marca: Apple

2. iPhone 16 Pro 128GB
   - Precio: 10,500 Bs
   - Características: 6.3", A18 Pro, 48MP, 3582mAh, iOS 18, 5G
   - Stock: 12

3. iPhone 16 256GB
   - Precio: 8,900 Bs
   - Características: 6.1", A18, 48MP, 3561mAh, iOS 18, 5G
   - Stock: 15

4. iPhone 15 Pro 256GB (Reacondicionado)
   - Precio: 8,200 Bs
   - Stock: 6

5. iPhone 14 128GB (Nuevo)
   - Precio: 5,500 Bs
   - Stock: 20
```

#### Samsung Galaxy (Samsung)
```
6. Samsung Galaxy S24 Ultra 512GB
   - Precio: 11,800 Bs
   - Características: 6.8", Snapdragon 8 Gen 3, 200MP, 5000mAh, Android 14, 5G, S Pen
   - Stock: 10

7. Samsung Galaxy S24+ 256GB
   - Precio: 8,500 Bs
   - Características: 6.7", Snapdragon 8 Gen 3, 50MP, 4900mAh, Android 14, 5G
   - Stock: 15

8. Samsung Galaxy S24 128GB
   - Precio: 6,800 Bs
   - Características: 6.2", Snapdragon 8 Gen 3, 50MP, 4000mAh, Android 14, 5G
   - Stock: 18

9. Samsung Galaxy Z Fold 6 512GB
   - Precio: 15,500 Bs
   - Características: 7.6" plegable, Snapdragon 8 Gen 3, 50MP, 4400mAh, Android 14
   - Stock: 4

10. Samsung Galaxy Z Flip 6 256GB
    - Precio: 9,200 Bs
    - Características: 6.7" plegable, Snapdragon 8 Gen 3, 50MP, 4000mAh, Android 14
    - Stock: 8
```

### Smartphones - Gama Media

#### Xiaomi
```
11. Xiaomi 14T Pro 512GB
    - Precio: 4,800 Bs
    - Características: 6.67", Dimensity 9300+, 50MP, 5000mAh, Android 14, 5G
    - Stock: 25

12. Xiaomi 14 256GB
    - Precio: 4,200 Bs
    - Características: 6.36", Snapdragon 8 Gen 3, 50MP, 4610mAh, Android 14, 5G
    - Stock: 30

13. Xiaomi Redmi Note 13 Pro 256GB
    - Precio: 2,300 Bs
    - Características: 6.67", Snapdragon 7s Gen 2, 200MP, 5100mAh, Android 13, 5G
    - Stock: 40

14. Xiaomi Redmi Note 13 128GB
    - Precio: 1,500 Bs
    - Características: 6.67", Snapdragon 685, 108MP, 5000mAh, Android 13, 4G
    - Stock: 45

15. Xiaomi Poco X6 Pro 256GB
    - Precio: 2,800 Bs
    - Características: 6.67", Dimensity 8300 Ultra, 64MP, 5000mAh, Android 14, 5G
    - Stock: 35
```

#### Motorola
```
16. Motorola Edge 50 Pro 512GB
    - Precio: 3,900 Bs
    - Características: 6.7", Snapdragon 7 Gen 3, 50MP, 4500mAh, Android 14, 5G
    - Stock: 20

17. Motorola Edge 50 Fusion 256GB
    - Precio: 2,600 Bs
    - Características: 6.67", Snapdragon 7s Gen 2, 50MP, 5000mAh, Android 14, 5G
    - Stock: 28

18. Motorola Moto G84 256GB
    - Precio: 1,800 Bs
    - Características: 6.5", Snapdragon 695, 50MP, 5000mAh, Android 13, 5G
    - Stock: 35

19. Motorola Moto G54 128GB
    - Precio: 1,200 Bs
    - Características: 6.5", Dimensity 7020, 50MP, 5000mAh, Android 13, 5G
    - Stock: 40
```

### Smartphones - Gama Baja

#### Infinix
```
20. Infinix Note 40 Pro 256GB
    - Precio: 1,400 Bs
    - Características: 6.78", Dimensity 7020, 108MP, 5000mAh, Android 14, 5G
    - Stock: 30

21. Infinix Hot 40 Pro 128GB
    - Precio: 900 Bs
    - Características: 6.78", Helio G99, 108MP, 5000mAh, Android 13, 4G
    - Stock: 50

22. Infinix Smart 8 64GB
    - Precio: 600 Bs
    - Características: 6.6", Unisoc T606, 13MP, 5000mAh, Android 13 Go, 4G
    - Stock: 45
```

### Laptops - Gaming

#### Asus ROG
```
23. Asus ROG Strix G16 (2024)
    - Precio: 14,500 Bs
    - Características: 16" FHD 165Hz, i7-14650HX, RTX 4060 8GB, 16GB RAM, 1TB SSD
    - Stock: 5

24. Asus ROG Zephyrus G14 (2024)
    - Precio: 16,800 Bs
    - Características: 14" QHD+ 120Hz, Ryzen 9 8945HS, RTX 4060 8GB, 32GB RAM, 1TB SSD
    - Stock: 3

25. Asus TUF Gaming A15 (2024)
    - Precio: 8,500 Bs
    - Características: 15.6" FHD 144Hz, Ryzen 7 7735HS, RTX 4050 6GB, 16GB RAM, 512GB SSD
    - Stock: 12
```

#### MSI
```
26. MSI Katana 15 B13V
    - Precio: 9,200 Bs
    - Características: 15.6" FHD 144Hz, i7-13620H, RTX 4060 8GB, 16GB RAM, 1TB SSD
    - Stock: 10

27. MSI Cyborg 15 A12V
    - Precio: 7,500 Bs
    - Características: 15.6" FHD 144Hz, i5-12450H, RTX 4050 6GB, 16GB RAM, 512GB SSD
    - Stock: 15
```

### Laptops - Profesionales

#### MacBook (Apple)
```
28. MacBook Pro 16" M3 Pro
    - Precio: 19,500 Bs
    - Características: 16" Liquid Retina XDR, M3 Pro 12-core, 18GB RAM, 512GB SSD
    - Stock: 4

29. MacBook Pro 14" M3
    - Precio: 14,200 Bs
    - Características: 14" Liquid Retina XDR, M3 8-core, 8GB RAM, 512GB SSD
    - Stock: 6

30. MacBook Air 15" M3
    - Precio: 11,800 Bs
    - Características: 15.3" Liquid Retina, M3 8-core, 8GB RAM, 512GB SSD
    - Stock: 8

31. MacBook Air 13" M2
    - Precio: 8,900 Bs
    - Características: 13.6" Liquid Retina, M2 8-core, 8GB RAM, 256GB SSD
    - Stock: 12
```

#### HP / Dell / Lenovo
```
32. HP Pavilion Plus 14
    - Precio: 5,800 Bs
    - Características: 14" 2.8K OLED, i7-13700H, Iris Xe, 16GB RAM, 512GB SSD
    - Stock: 10

33. Dell XPS 13 Plus
    - Precio: 10,500 Bs
    - Características: 13.4" FHD+, i7-1360P, Iris Xe, 16GB RAM, 512GB SSD
    - Stock: 5

34. Lenovo ThinkPad X1 Carbon Gen 12
    - Precio: 12,200 Bs
    - Características: 14" WUXGA, i7-155U, Iris Xe, 16GB RAM, 512GB SSD
    - Stock: 6

35. Lenovo IdeaPad 3 15
    - Precio: 3,500 Bs
    - Características: 15.6" FHD, Ryzen 5 7530U, Radeon, 8GB RAM, 512GB SSD
    - Stock: 25
```

### Tablets

#### iPad (Apple)
```
36. iPad Pro 13" M4 256GB
    - Precio: 8,500 Bs
    - Características: 13" OLED, M4, 8GB RAM, iPadOS 18, WiFi + Cellular
    - Stock: 5

37. iPad Air 11" M2 128GB
    - Precio: 5,200 Bs
    - Características: 11" Liquid Retina, M2, 8GB RAM, iPadOS 18
    - Stock: 10

38. iPad 10.9" 64GB
    - Precio: 2,800 Bs
    - Características: 10.9" Liquid Retina, A14 Bionic, iPadOS 18
    - Stock: 18
```

#### Samsung Galaxy Tab
```
39. Samsung Galaxy Tab S9 Ultra 512GB
    - Precio: 7,800 Bs
    - Características: 14.6" AMOLED, Snapdragon 8 Gen 2, 12GB RAM, S Pen
    - Stock: 4

40. Samsung Galaxy Tab S9 FE+ 128GB
    - Precio: 3,200 Bs
    - Características: 12.4" LCD, Exynos 1380, 8GB RAM, S Pen
    - Stock: 15
```

### Audio - Auriculares

#### Apple AirPods
```
41. Apple AirPods Pro 2 (USB-C)
    - Precio: 1,800 Bs
    - Características: ANC, Audio Espacial, H2 chip, 30h batería
    - Stock: 25

42. Apple AirPods 3
    - Precio: 1,200 Bs
    - Características: Audio Espacial, 30h batería, resistente agua
    - Stock: 30
```

#### JBL
```
43. JBL Tune 770NC
    - Precio: 650 Bs
    - Características: ANC, Bluetooth 5.3, 70h batería
    - Stock: 40

44. JBL Quantum 910P
    - Precio: 1,900 Bs
    - Características: Gaming, ANC, Audio Espacial, Wireless
    - Stock: 15
```

#### Sony
```
45. Sony WH-1000XM5
    - Precio: 2,500 Bs
    - Características: Premium ANC, LDAC, 30h batería, AI Upscaling
    - Stock: 12

46. Sony WF-1000XM5
    - Precio: 2,200 Bs
    - Características: True Wireless, Premium ANC, LDAC, 24h batería
    - Stock: 18
```

### Audio - Parlantes

#### JBL
```
47. JBL Charge 5
    - Precio: 980 Bs
    - Características: 40W, IP67, 20h batería, powerbank
    - Stock: 35

48. JBL Flip 6
    - Precio: 720 Bs
    - Características: 30W, IP67, 12h batería
    - Stock: 45

49. JBL PartyBox 310
    - Precio: 3,500 Bs
    - Características: 240W, Luces LED, TWS, Karaoke, 18h batería
    - Stock: 8
```

### Gaming - Consolas

```
50. PlayStation 5 Slim Digital Edition
    - Precio: 4,200 Bs
    - Características: 1TB SSD, Ray Tracing, 4K 120fps
    - Stock: 12

51. PlayStation 5 Slim Disc Edition
    - Precio: 4,800 Bs
    - Características: 1TB SSD, Lector UHD, Ray Tracing, 4K 120fps
    - Stock: 10

52. Xbox Series X
    - Precio: 5,200 Bs
    - Características: 1TB SSD, 12 TFLOPS, 4K 120fps, Ray Tracing
    - Stock: 8

53. Xbox Series S
    - Precio: 2,800 Bs
    - Características: 512GB SSD, 4 TFLOPS, 1440p 120fps
    - Stock: 18

54. Nintendo Switch OLED
    - Precio: 2,900 Bs
    - Características: 7" OLED, 64GB, Dock mejorado
    - Stock: 20

55. Nintendo Switch Lite
    - Precio: 1,700 Bs
    - Características: Solo portátil, 5.5" LCD, 32GB
    - Stock: 25
```

### Gaming - Joysticks

```
56. PlayStation 5 DualSense
    - Precio: 580 Bs
    - Características: Haptic Feedback, Adaptive Triggers, USB-C
    - Stock: 40

57. PlayStation 5 DualSense Edge
    - Precio: 1,400 Bs
    - Características: Pro controller, Personalizable, Sticks intercambiables
    - Stock: 12

58. Xbox Series X|S Controller
    - Precio: 480 Bs
    - Características: Bluetooth, USB-C, Share button
    - Stock: 45

59. Xbox Elite Series 2
    - Precio: 1,300 Bs
    - Características: Pro controller, Ajustable, 40h batería
    - Stock: 10
```

### Wearables - Smartwatches

#### Apple Watch
```
60. Apple Watch Series 10 GPS 46mm
    - Precio: 3,500 Bs
    - Características: Always-On Retina, S10 chip, watchOS 11
    - Stock: 15

61. Apple Watch SE 2 GPS 44mm
    - Precio: 2,200 Bs
    - Características: Retina, S8 chip, watchOS 11
    - Stock: 25
```

#### Samsung Galaxy Watch
```
62. Samsung Galaxy Watch 7 44mm
    - Precio: 2,800 Bs
    - Características: AMOLED, Exynos W1000, Wear OS 5, GPS
    - Stock: 20

63. Samsung Galaxy Watch 6 Classic 47mm
    - Precio: 3,200 Bs
    - Características: AMOLED, Bisel giratorio, Wear OS 4
    - Stock: 12
```

### Wearables - Smart Bands

```
64. Xiaomi Smart Band 8 Pro
    - Precio: 480 Bs
    - Características: 1.74" AMOLED, GPS, 14 días batería
    - Stock: 60

65. Xiaomi Smart Band 8
    - Precio: 280 Bs
    - Características: 1.62" AMOLED, 16 días batería
    - Stock: 80

66. Huawei Band 9
    - Precio: 320 Bs
    - Características: 1.47" AMOLED, 14 días batería, SpO2
    - Stock: 55
```

### Accesorios - Cargadores

```
67. Cargador Apple MagSafe 15W
    - Precio: 280 Bs
    - Stock: 50

68. Cargador Apple USB-C 20W
    - Precio: 150 Bs
    - Stock: 80

69. Cargador Anker 736 Nano II 100W GaN
    - Precio: 420 Bs
    - Características: 3 puertos (2 USB-C + 1 USB-A), GaN, PD 3.0
    - Stock: 35

70. Cargador Xiaomi 67W Turbo
    - Precio: 180 Bs
    - Stock: 60

71. Cable Apple USB-C a Lightning 1m
    - Precio: 120 Bs
    - Stock: 100
```

### Accesorios - Fundas

```
72. Funda Silicona iPhone 16 Pro Max
    - Precio: 80 Bs
    - Stock: 120

73. Funda Transparente con MagSafe iPhone 16 Pro
    - Precio: 95 Bs
    - Stock: 100

74. Funda Samsung S24 Ultra con S Pen holder
    - Precio: 75 Bs
    - Stock: 90

75. Mica Cristal Templado iPhone 16 Pro Max
    - Precio: 45 Bs
    - Stock: 150
```

---

## Plan de Implementación

### Fase 1: Corrección de Inconsistencias (CRÍTICO)

**Duración:** 1-2 días

**Tareas:**

1. **Actualizar Modelo TypeScript `Almacen.ts`**
   - ✅ Agregar campo `modelo`
   - ✅ Agregar campo `id_marca`
   - ✅ Actualizar interfaces TypeScript relacionadas

2. **Verificar Relaciones**
   - ✅ Confirmar que relación `Almacen` ↔ `Marca` funciona correctamente
   - ✅ Actualizar controladores para incluir marcas en queries

3. **Pruebas**
   - Crear producto con marca
   - Consultar producto con marca
   - Actualizar marca de producto

### Fase 2: Refinamiento del Esquema (OPCIONAL)

**Duración:** 2-3 días

**Tareas:**

1. **Migrar Precios a DECIMAL**
   - Crear script de migración
   - Actualizar modelos TypeScript
   - Actualizar controladores

2. **Reorganizar Categorías**
   - Crear categorías simplificadas
   - Migrar productos existentes
   - Eliminar categorías redundantes

3. **Agregar Índices de Rendimiento**
   - Ejecutar scripts de índices
   - Medir mejoras en queries

4. **Agregar Campos Adicionales (opcional)**
   - SKU, estado, peso, dimensiones
   - Metadatos (vistas, ventas, calificación)

### Fase 3: Generación de Datos Realistas

**Duración:** 3-5 días

**Tareas:**

1. **Preparar Imágenes de Productos**
   - Descargar/crear imágenes de alta calidad
   - Redimensionar a 1200x1200
   - Nombrar según convención
   - Ubicar en `backend/uploads/productos/`

2. **Ejecutar Script de Datos**
   - Ejecutar script de generación
   - Verificar integridad de datos
   - Validar relaciones

3. **Agregar Características a Productos**
   - Ejecutar script de características
   - Validar coherencia

4. **Crear Ofertas Actuales**
   - Definir ofertas vigentes
   - Asignar productos

### Fase 4: Validación y Testing

**Duración:** 1-2 días

**Tareas:**

1. **Testing Backend**
   - Probar todos los endpoints
   - Validar queries de búsqueda
   - Verificar rendimiento

2. **Testing Frontend**
   - Navegar por categorías
   - Buscar productos
   - Ver detalles

3. **Optimización**
   - Analizar queries lentas
   - Agregar índices faltantes
   - Optimizar imágenes

---

## Próximos Pasos Recomendados

### Inmediato (Hoy)

1. ✅ **Corregir modelo `Almacen.ts`** - Agregar campos faltantes
2. ✅ **Crear script de generación de datos** - Basado en catálogo anterior
3. ✅ **Preparar imágenes de productos** - Descargar y organizar

### Corto Plazo (Esta Semana)

4. Evaluar migración de precios a DECIMAL
5. Reorganizar categorías
6. Ejecutar script de datos
7. Validar integridad

### Mediano Plazo (Próximas 2 Semanas)

8. Agregar campos adicionales (SKU, estado, metadatos)
9. Implementar historial de precios
10. Optimizar rendimiento con índices
11. Generar más datos variados

---

## Conclusión

El proyecto TecnoCel tiene una base de datos bien estructurada con un sistema moderno de características dinámicas, ofertas híbridas y soporte para múltiples imágenes. Sin embargo, presenta **inconsistencias críticas** entre el código TypeScript y el esquema SQL que deben corregirse de inmediato.

Con las correcciones propuestas y la implementación de datos realistas basados en productos electrónicos actuales del mercado boliviano, el proyecto estará listo para producción con un catálogo moderno y profesional.

### Prioridades:

1. 🔴 **CRÍTICO**: Corregir modelo TypeScript
2. 🟡 **IMPORTANTE**: Reorganizar categorías
3. 🟢 **RECOMENDADO**: Migrar precios a DECIMAL
4. 🔵 **OPCIONAL**: Agregar campos adicionales

---

**Documento generado:** 2025-10-30
**Autor:** Claude Code
**Versión:** 1.0
