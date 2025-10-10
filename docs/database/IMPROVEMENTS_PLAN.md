# Plan de Mejoras para la Base de Datos - TecnoCell Web

## Análisis de la Situación Actual

### Estructura Actual de la Base de Datos

La base de datos actual cuenta con las siguientes tablas principales:

- `tb_almacen` - Productos del inventario
- `tb_categorias` - Categorías de productos
- `tb_clientes` - Información de clientes
- `tb_carritosweb` y `tb_carritoweb_items` - Carrito de compras web
- `tb_ventas` y `tb_carrito` - Sistema de ventas
- Otras tablas de soporte (usuarios, roles, etc.)

### Limitaciones Identificadas

1. **Características de productos**: Los productos solo tienen descripción de texto libre, sin características estructuradas
2. **Ofertas**: No existe sistema de ofertas/descuentos
3. **Favoritos**: No hay funcionalidad de lista de deseos
4. **Marcas**: Las marcas están incluidas en el nombre del producto, no normalizadas
5. **Direcciones**: No hay sistema de direcciones para envíos
6. **Imágenes**: Solo una imagen por producto

## Plan de Mejoras Propuesto

### 1. Sistema de Características de Productos

#### 1.1 Nueva Tabla: `tb_marcas`

```sql
CREATE TABLE `tb_marcas` (
  `id_marca` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_marca` varchar(100) NOT NULL,
  `logo_marca` text DEFAULT NULL,
  `descripcion_marca` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id_marca`),
  UNIQUE KEY `nombre_marca_unique` (`nombre_marca`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

**Datos iniciales sugeridos**:

- Samsung, Apple, Xiaomi, Motorola, Infinix, Honor, Realme
- JBL, Sony, Gamesir
- HP, Asus, Acer, Dell
- PlayStation, Xbox, Nintendo
- DJI, GoPro

#### 1.2 Nueva Tabla: `tb_tipos_caracteristicas`

```sql
CREATE TABLE `tb_tipos_caracteristicas` (
  `id_tipo` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_tipo` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo_dato` enum('texto','numero','booleano','seleccion') DEFAULT 'texto',
  `unidad_medida` varchar(20) DEFAULT NULL,
  `opciones_seleccion` json DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id_tipo`),
  UNIQUE KEY `nombre_tipo_unique` (`nombre_tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

**Ejemplos de tipos de características**:

- Pantalla (número, pulgadas)
- RAM (número, GB)
- Almacenamiento (número, GB)
- Cámara principal (número, MP)
- Batería (número, mAh)
- Sistema operativo (selección: Android, iOS, Windows)
- Conectividad (selección múltiple: 4G, 5G, WiFi, Bluetooth)
- Color (texto)

#### 1.3 Nueva Tabla: `tb_producto_caracteristicas`

```sql
CREATE TABLE `tb_producto_caracteristicas` (
  `id_caracteristica` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL,
  `id_tipo` int(11) NOT NULL,
  `valor` text NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id_caracteristica`),
  UNIQUE KEY `producto_tipo_unique` (`id_producto`, `id_tipo`),
  FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE,
  FOREIGN KEY (`id_tipo`) REFERENCES `tb_tipos_caracteristicas` (`id_tipo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

#### 1.4 Modificación de `tb_almacen`

```sql
ALTER TABLE `tb_almacen`
ADD COLUMN `id_marca` int(11) DEFAULT NULL AFTER `id_categoria`,
ADD COLUMN `modelo` varchar(255) DEFAULT NULL AFTER `nombre`,
ADD FOREIGN KEY (`id_marca`) REFERENCES `tb_marcas` (`id_marca`);
```

### 2. Sistema de Ofertas

#### 2.1 Nueva Tabla: `tb_ofertas`

```sql
CREATE TABLE `tb_ofertas` (
  `id_oferta` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_oferta` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo_descuento` enum('porcentaje','monto_fijo') NOT NULL,
  `valor_descuento` decimal(10,2) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `precio_minimo` decimal(10,2) DEFAULT NULL,
  `precio_maximo` decimal(10,2) DEFAULT NULL,
  `limite_uso` int(11) DEFAULT NULL,
  `uso_actual` int(11) DEFAULT 0,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id_oferta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

#### 2.2 Nueva Tabla: `tb_productos_ofertas`

```sql
CREATE TABLE `tb_productos_ofertas` (
  `id_producto_oferta` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL,
  `id_oferta` int(11) NOT NULL,
  `precio_oferta` decimal(10,2) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  PRIMARY KEY (`id_producto_oferta`),
  UNIQUE KEY `producto_oferta_unique` (`id_producto`, `id_oferta`),
  FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE,
  FOREIGN KEY (`id_oferta`) REFERENCES `tb_ofertas` (`id_oferta`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 3. Sistema de Favoritos

#### 3.1 Nueva Tabla: `tb_favoritos`

```sql
CREATE TABLE `tb_favoritos` (
  `id_favorito` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  PRIMARY KEY (`id_favorito`),
  UNIQUE KEY `cliente_producto_unique` (`id_cliente`, `id_producto`),
  FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`) ON DELETE CASCADE,
  FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 4. Sistema de Direcciones

#### 4.1 Nueva Tabla: `tb_direcciones`

```sql
CREATE TABLE `tb_direcciones` (
  `id_direccion` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `nombre_direccion` varchar(100) NOT NULL,
  `calle` varchar(255) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `piso` varchar(10) DEFAULT NULL,
  `departamento` varchar(10) DEFAULT NULL,
  `barrio` varchar(100) DEFAULT NULL,
  `ciudad` varchar(100) NOT NULL,
  `provincia` varchar(100) NOT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `pais` varchar(100) DEFAULT 'Argentina',
  `referencia` text DEFAULT NULL,
  `es_predeterminada` tinyint(1) DEFAULT 0,
  `es_facturacion` tinyint(1) DEFAULT 0,
  `telefono_contacto` varchar(50) DEFAULT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id_direccion`),
  FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 5. Sistema de Imágenes Múltiples

#### 5.1 Nueva Tabla: `tb_producto_imagenes`

```sql
CREATE TABLE `tb_producto_imagenes` (
  `id_imagen` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL,
  `url_imagen` text NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `es_principal` tinyint(1) DEFAULT 0,
  `orden` int(11) DEFAULT 0,
  `fyh_creacion` datetime NOT NULL,
  PRIMARY KEY (`id_imagen`),
  FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## Implementación de Modelos Backend

### 1. Modelo Marca

```typescript
// backend/src/models/Marca.ts
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Marca extends Model {
  declare id_marca: number;
  declare nombre_marca: string;
  declare logo_marca: string | null;
  declare descripcion_marca: string | null;
  declare activo: boolean;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Marca.init(
  {
    id_marca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_marca: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    logo_marca: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descripcion_marca: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    fyh_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fyh_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Marca",
    tableName: "tb_marcas",
    timestamps: false,
  }
);

export default Marca;
```

### 2. Modelo TipoCaracteristica

```typescript
// backend/src/models/TipoCaracteristica.ts
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class TipoCaracteristica extends Model {
  declare id_tipo: number;
  declare nombre_tipo: string;
  declare descripcion: string | null;
  declare tipo_dato: "texto" | "numero" | "booleano" | "seleccion";
  declare unidad_medida: string | null;
  declare opciones_seleccion: string[] | null;
  declare activo: boolean;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

TipoCaracteristica.init(
  {
    id_tipo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_tipo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tipo_dato: {
      type: DataTypes.ENUM("texto", "numero", "booleano", "seleccion"),
      defaultValue: "texto",
    },
    unidad_medida: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    opciones_seleccion: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    fyh_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fyh_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "TipoCaracteristica",
    tableName: "tb_tipos_caracteristicas",
    timestamps: false,
  }
);

export default TipoCaracteristica;
```

### 3. Modelo ProductoCaracteristica

```typescript
// backend/src/models/ProductoCaracteristica.ts
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class ProductoCaracteristica extends Model {
  declare id_caracteristica: number;
  declare id_producto: number;
  declare id_tipo: number;
  declare valor: string;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

ProductoCaracteristica.init(
  {
    id_caracteristica: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tb_almacen",
        key: "id_producto",
      },
    },
    id_tipo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tb_tipos_caracteristicas",
        key: "id_tipo",
      },
    },
    valor: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fyh_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fyh_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ProductoCaracteristica",
    tableName: "tb_producto_caracteristicas",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["id_producto", "id_tipo"],
      },
    ],
  }
);

export default ProductoCaracteristica;
```

### 4. Modelo Oferta

```typescript
// backend/src/models/Oferta.ts
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Oferta extends Model {
  declare id_oferta: number;
  declare nombre_oferta: string;
  declare descripcion: string | null;
  declare tipo_descuento: "porcentaje" | "monto_fijo";
  declare valor_descuento: number;
  declare fecha_inicio: Date;
  declare fecha_fin: Date;
  declare activo: boolean;
  declare precio_minimo: number | null;
  declare precio_maximo: number | null;
  declare limite_uso: number | null;
  declare uso_actual: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Oferta.init(
  {
    id_oferta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_oferta: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tipo_descuento: {
      type: DataTypes.ENUM("porcentaje", "monto_fijo"),
      allowNull: false,
    },
    valor_descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    precio_minimo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    precio_maximo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    limite_uso: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uso_actual: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    fyh_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fyh_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Oferta",
    tableName: "tb_ofertas",
    timestamps: false,
  }
);

export default Oferta;
```

### 5. Modelo Favorito

```typescript
// backend/src/models/Favorito.ts
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Favorito extends Model {
  declare id_favorito: number;
  declare id_cliente: number;
  declare id_producto: number;
  declare fyh_creacion: Date;
}

Favorito.init(
  {
    id_favorito: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tb_clientes",
        key: "id_cliente",
      },
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tb_almacen",
        key: "id_producto",
      },
    },
    fyh_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Favorito",
    tableName: "tb_favoritos",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["id_cliente", "id_producto"],
      },
    ],
  }
);

export default Favorito;
```

### 6. Modelo Direccion

```typescript
// backend/src/models/Direccion.ts
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Direccion extends Model {
  declare id_direccion: number;
  declare id_cliente: number;
  declare nombre_direccion: string;
  declare calle: string;
  declare numero: string;
  declare piso: string | null;
  declare departamento: string | null;
  declare barrio: string | null;
  declare ciudad: string;
  declare provincia: string;
  declare codigo_postal: string | null;
  declare pais: string;
  declare referencia: string | null;
  declare es_predeterminada: boolean;
  declare es_facturacion: boolean;
  declare telefono_contacto: string | null;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Direccion.init(
  {
    id_direccion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tb_clientes",
        key: "id_cliente",
      },
    },
    nombre_direccion: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    calle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    piso: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    departamento: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    barrio: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    provincia: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    codigo_postal: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pais: {
      type: DataTypes.STRING(100),
      defaultValue: "Argentina",
    },
    referencia: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    es_predeterminada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    es_facturacion: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    telefono_contacto: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fyh_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fyh_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Direccion",
    tableName: "tb_direcciones",
    timestamps: false,
  }
);

export default Direccion;
```

## Relaciones Entre Modelos

### Actualización del archivo relaciones.ts

```typescript
// backend/src/models/relaciones.ts
import Almacen from "./Almacen.js";
import Categoria from "./Categoria.js";
import Cliente from "./Cliente.js";
import Marca from "./Marca.js";
import TipoCaracteristica from "./TipoCaracteristica.js";
import ProductoCaracteristica from "./ProductoCaracteristica.js";
import Oferta from "./Oferta.js";
import ProductoOferta from "./ProductoOferta.js";
import Favorito from "./Favorito.js";
import Direccion from "./Direccion.js";
import ProductoImagen from "./ProductoImagen.js";

// Relaciones existentes
Almacen.belongsTo(Categoria, { foreignKey: "id_categoria" });
Categoria.hasMany(Almacen, { foreignKey: "id_categoria" });

// Nuevas relaciones para Marcas
Almacen.belongsTo(Marca, { foreignKey: "id_marca" });
Marca.hasMany(Almacen, { foreignKey: "id_marca" });

// Relaciones para Características
Almacen.belongsToMany(TipoCaracteristica, {
  through: ProductoCaracteristica,
  foreignKey: "id_producto",
  otherKey: "id_tipo",
  as: "caracteristicas",
});

TipoCaracteristica.belongsToMany(Almacen, {
  through: ProductoCaracteristica,
  foreignKey: "id_tipo",
  otherKey: "id_producto",
  as: "productos",
});

ProductoCaracteristica.belongsTo(Almacen, { foreignKey: "id_producto" });
ProductoCaracteristica.belongsTo(TipoCaracteristica, { foreignKey: "id_tipo" });

// Relaciones para Ofertas
Almacen.belongsToMany(Oferta, {
  through: ProductoOferta,
  foreignKey: "id_producto",
  otherKey: "id_oferta",
  as: "ofertas",
});

Oferta.belongsToMany(Almacen, {
  through: ProductoOferta,
  foreignKey: "id_oferta",
  otherKey: "id_producto",
  as: "productos",
});

// Relaciones para Favoritos
Cliente.belongsToMany(Almacen, {
  through: Favorito,
  foreignKey: "id_cliente",
  otherKey: "id_producto",
  as: "favoritos",
});

Almacen.belongsToMany(Cliente, {
  through: Favorito,
  foreignKey: "id_producto",
  otherKey: "id_cliente",
  as: "clientesFavoritos",
});

// Relaciones para Direcciones
Cliente.hasMany(Direccion, { foreignKey: "id_cliente", as: "direcciones" });
Direccion.belongsTo(Cliente, { foreignKey: "id_cliente" });

// Relaciones para Imágenes
Almacen.hasMany(ProductoImagen, { foreignKey: "id_producto", as: "imagenes" });
ProductoImagen.belongsTo(Almacen, { foreignKey: "id_producto" });
```

## Implementación Frontend

### 1. Tipos TypeScript Actualizados

```typescript
// frontend/src/types/product.ts (actualizado)
export interface Marca {
  id_marca: number;
  nombre_marca: string;
  logo_marca?: string | null;
  descripcion_marca?: string | null;
}

export interface TipoCaracteristica {
  id_tipo: number;
  nombre_tipo: string;
  descripcion?: string | null;
  tipo_dato: "texto" | "numero" | "booleano" | "seleccion";
  unidad_medida?: string | null;
  opciones_seleccion?: string[] | null;
}

export interface ProductoCaracteristica {
  id_caracteristica: number;
  id_tipo: number;
  valor: string;
  TipoCaracteristica: TipoCaracteristica;
}

export interface Oferta {
  id_oferta: number;
  nombre_oferta: string;
  descripcion?: string | null;
  tipo_descuento: "porcentaje" | "monto_fijo";
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  precio_oferta?: number;
}

export interface Product {
  id_producto: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  stock: number;
  stock_minimo: number | null;
  stock_maximo: number | null;
  precio_compra: string;
  precio_venta: string;
  fecha_ingreso: string;
  imagen: string | null;
  imagen_url?: string | null;
  imagen_disponible?: boolean;
  id_usuario: number;
  id_categoria: number;
  id_marca?: number | null;
  modelo?: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;

  // Relaciones
  Categoria?: Category;
  Marca?: Marca;
  caracteristicas?: ProductoCaracteristica[];
  ofertas?: Oferta[];
  imagenes?: ProductoImagen[];

  // Campos calculados
  precio_final?: number;
  descuento_porcentaje?: number;
  en_oferta?: boolean;
  es_favorito?: boolean;
}

export interface Direccion {
  id_direccion: number;
  id_cliente: number;
  nombre_direccion: string;
  calle: string;
  numero: string;
  piso?: string | null;
  departamento?: string | null;
  barrio?: string | null;
  ciudad: string;
  provincia: string;
  codigo_postal?: string | null;
  pais: string;
  referencia?: string | null;
  es_predeterminada: boolean;
  es_facturacion: boolean;
  telefono_contacto?: string | null;
}
```

### 2. Nuevos Filtros de Producto

```typescript
// frontend/src/hooks/useProductFilters.ts (actualizado)
export interface ProductUIFilters {
  search: string;
  selectedDropdownCategory: string;
  selectedBrand: string;
  priceRange: [number, number];
  characteristics: { [key: string]: string };
  onlyOffers: boolean;
  onlyStock: boolean;
  order: string;
}
```

## APIs Requeridas

### 1. APIs para Características

```typescript
// GET /api/marcas
// GET /api/tipos-caracteristicas
// GET /api/productos/:id/caracteristicas
// POST /api/productos/:id/caracteristicas
// PUT /api/productos/:id/caracteristicas/:idCaracteristica
// DELETE /api/productos/:id/caracteristicas/:idCaracteristica
```

### 2. APIs para Ofertas

```typescript
// GET /api/ofertas
// GET /api/productos/ofertas
// POST /api/ofertas
// PUT /api/ofertas/:id
// DELETE /api/ofertas/:id
```

### 3. APIs para Favoritos

```typescript
// GET /api/clientes/:id/favoritos
// POST /api/clientes/:id/favoritos
// DELETE /api/clientes/:id/favoritos/:idProducto
```

### 4. APIs para Direcciones

```typescript
// GET /api/clientes/:id/direcciones
// POST /api/clientes/:id/direcciones
// PUT /api/direcciones/:id
// DELETE /api/direcciones/:id
// PUT /api/direcciones/:id/predeterminada
```

## Fases de Implementación

### Fase 1: Estructura Base (Semana 1-2)

1. Crear las nuevas tablas en la base de datos
2. Implementar los modelos Sequelize
3. Establecer las relaciones entre modelos
4. Migrar datos existentes (extraer marcas de nombres de productos)

### Fase 2: Características de Productos (Semana 3-4)

1. Implementar APIs de características
2. Crear interfaz de administración para tipos de características
3. Implementar sistema de carga masiva de características
4. Actualizar frontend para mostrar características

### Fase 3: Sistema de Ofertas (Semana 5-6)

1. Implementar APIs de ofertas
2. Crear interfaz de administración de ofertas
3. Actualizar frontend para mostrar productos en oferta
4. Implementar filtros de ofertas

### Fase 4: Favoritos y Direcciones (Semana 7-8)

1. Implementar APIs de favoritos
2. Implementar APIs de direcciones
3. Crear interfaces de usuario para favoritos
4. Crear formularios de direcciones
5. Integrar con proceso de compra

### Fase 5: Mejoras y Optimizaciones (Semana 9-10)

1. Implementar imágenes múltiples
2. Optimizar consultas de base de datos
3. Implementar caché para consultas frecuentes
4. Testing integral del sistema
5. Documentación de APIs

## Consideraciones Técnicas

### Performance

- Índices en campos de búsqueda frecuente
- Paginación en APIs de productos
- Caché de características por categoría
- Lazy loading de imágenes adicionales

### Seguridad

- Validación de entrada en todas las APIs
- Autorización para operaciones de favoritos y direcciones
- Sanitización de datos de características

### Mantenimiento

- Scripts de migración de datos
- Respaldos antes de cambios estructurales
- Logs de cambios en características
- Versionado de APIs

### SEO y UX

- URLs amigables para filtros por marca
- Meta tags con características del producto
- Breadcrumbs con marca y categoría
- Filtros persistentes en navegación

## Beneficios Esperados

1. **Mejor experiencia de usuario**: Filtros avanzados, comparación de productos, lista de deseos
2. **Mayor conversión**: Ofertas personalizadas, información detallada de productos
3. **Gestión mejorada**: Administración centralizada de características y ofertas
4. **Escalabilidad**: Sistema modular que permite agregar nuevas características
5. **Análisis**: Datos estructurados para reportes y análisis de ventas

## Conclusión

Este plan proporciona una estructura sólida y escalable para mejorar significativamente la funcionalidad del sistema de productos de TecnoCell Web. La implementación por fases permite un desarrollo ordenado y testing continuo, minimizando riesgos y asegurando la estabilidad del sistema durante el proceso de mejora.

---

[← Volver al índice de database](./README.md)

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../README.md)** | **[🏠 Inicio](../../README.md)**
