const { Sequelize } = require("sequelize");
require("dotenv").config();

async function optimizeProductStructure() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: "mysql",
    }
  );

  try {
    await sequelize.authenticate();
    console.log("✅ Conexión establecida correctamente.");

    // 1. Crear nueva tabla de productos base
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tb_productos_base (
        id_producto_base INT PRIMARY KEY AUTO_INCREMENT,
        codigo VARCHAR(255) NOT NULL UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        modelo VARCHAR(255),
        descripcion_basica TEXT,
        descripcion_completa TEXT,
        id_categoria INT NOT NULL,
        id_marca INT,
        estado ENUM('activo', 'inactivo', 'descontinuado') DEFAULT 'activo',
        fyh_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fyh_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_categoria) REFERENCES tb_categorias(id_categoria),
        FOREIGN KEY (id_marca) REFERENCES tb_marcas(id_marca)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
    `);

    // 2. Crear tabla de inventario (gestión interna)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tb_inventario (
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
        fyh_ultima_salida DATETIME,
        FOREIGN KEY (id_producto_base) REFERENCES tb_productos_base(id_producto_base),
        FOREIGN KEY (id_usuario) REFERENCES tb_usuarios(id_usuario)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
    `);

    // 3. Crear tabla de productos web
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tb_productos_web (
        id_producto_web INT PRIMARY KEY AUTO_INCREMENT,
        id_producto_base INT NOT NULL,
        precio_venta_web DECIMAL(10,2) NOT NULL,
        destacado BOOLEAN DEFAULT FALSE,
        visible_web BOOLEAN DEFAULT TRUE,
        meta_titulo VARCHAR(255),
        meta_descripcion TEXT,
        palabras_clave VARCHAR(255),
        url_amigable VARCHAR(255),
        FOREIGN KEY (id_producto_base) REFERENCES tb_productos_base(id_producto_base)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
    `);

    // 4. Optimizar tabla de imágenes
    await sequelize.query(`
      ALTER TABLE tb_producto_imagenes 
      ADD COLUMN tipo ENUM('principal', 'galeria', 'thumbnail') DEFAULT 'galeria' AFTER es_principal,
      ADD COLUMN dimensiones VARCHAR(20) AFTER tipo,
      ADD COLUMN peso_kb INT AFTER dimensiones,
      ADD COLUMN formato VARCHAR(10) AFTER peso_kb;
    `);

    // 5. Migrar datos existentes
    await sequelize.query(`
      INSERT INTO tb_productos_base (
        codigo, nombre, modelo, descripcion_basica, 
        id_categoria, id_marca, fyh_creacion, fyh_actualizacion
      )
      SELECT 
        codigo, nombre, modelo, descripcion,
        id_categoria, id_marca, fyh_creacion, fyh_actualizacion
      FROM tb_almacen;
    `);

    await sequelize.query(`
      INSERT INTO tb_inventario (
        id_producto_base, stock, stock_minimo, stock_maximo,
        precio_compra, precio_venta_base, id_usuario
      )
      SELECT 
        id_producto, stock, stock_minimo, stock_maximo,
        CAST(precio_compra AS DECIMAL(10,2)),
        CAST(precio_venta AS DECIMAL(10,2)),
        id_usuario
      FROM tb_almacen;
    `);

    await sequelize.query(`
      INSERT INTO tb_productos_web (
        id_producto_base, precio_venta_web, visible_web
      )
      SELECT 
        id_producto,
        CAST(precio_venta AS DECIMAL(10,2)),
        TRUE
      FROM tb_almacen;
    `);

    // 6. Crear índices para optimización
    await sequelize.query(`
      CREATE INDEX idx_producto_base_codigo ON tb_productos_base(codigo);
      CREATE INDEX idx_producto_base_nombre ON tb_productos_base(nombre);
      CREATE INDEX idx_inventario_stock ON tb_inventario(stock);
      CREATE INDEX idx_productos_web_visible ON tb_productos_web(visible_web);
    `);

    console.log("✅ Optimización completada exitosamente");
  } catch (error) {
    console.error("❌ Error durante la optimización:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar la optimización
optimizeProductStructure().catch(console.error);
