/**
 * Script para implementar las mejoras de base de datos del plan de mejoras
 * Incluye: marcas, características, ofertas, favoritos, direcciones e imágenes múltiples
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_tecnocel_v4",
  charset: "utf8mb4",
};

// Función para obtener fecha actual formateada
const getCurrentDateTime = () => {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
};

// Scripts SQL para crear las nuevas tablas
const CREATE_TABLES_SQL = [
  // 1. Tabla de marcas
  `CREATE TABLE IF NOT EXISTS \`tb_marcas\` (
    \`id_marca\` int(11) NOT NULL AUTO_INCREMENT,
    \`nombre_marca\` varchar(100) NOT NULL,
    \`logo_marca\` text DEFAULT NULL,
    \`descripcion_marca\` text DEFAULT NULL,
    \`activo\` tinyint(1) DEFAULT 1,
    \`fyh_creacion\` datetime NOT NULL,
    \`fyh_actualizacion\` datetime NOT NULL,
    PRIMARY KEY (\`id_marca\`),
    UNIQUE KEY \`nombre_marca_unique\` (\`nombre_marca\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  // 2. Tabla de tipos de características
  `CREATE TABLE IF NOT EXISTS \`tb_tipos_caracteristicas\` (
    \`id_tipo\` int(11) NOT NULL AUTO_INCREMENT,
    \`nombre_tipo\` varchar(100) NOT NULL,
    \`descripcion\` text DEFAULT NULL,
    \`tipo_dato\` enum('texto','numero','booleano','seleccion') DEFAULT 'texto',
    \`unidad_medida\` varchar(20) DEFAULT NULL,
    \`opciones_seleccion\` json DEFAULT NULL,
    \`activo\` tinyint(1) DEFAULT 1,
    \`fyh_creacion\` datetime NOT NULL,
    \`fyh_actualizacion\` datetime NOT NULL,
    PRIMARY KEY (\`id_tipo\`),
    UNIQUE KEY \`nombre_tipo_unique\` (\`nombre_tipo\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  // 3. Tabla de características de productos
  `CREATE TABLE IF NOT EXISTS \`tb_producto_caracteristicas\` (
    \`id_caracteristica\` int(11) NOT NULL AUTO_INCREMENT,
    \`id_producto\` int(11) NOT NULL,
    \`id_tipo\` int(11) NOT NULL,
    \`valor\` text NOT NULL,
    \`fyh_creacion\` datetime NOT NULL,
    \`fyh_actualizacion\` datetime NOT NULL,
    PRIMARY KEY (\`id_caracteristica\`),
    UNIQUE KEY \`producto_tipo_unique\` (\`id_producto\`, \`id_tipo\`),
    KEY \`idx_producto\` (\`id_producto\`),
    KEY \`idx_tipo\` (\`id_tipo\`),
    FOREIGN KEY (\`id_producto\`) REFERENCES \`tb_almacen\` (\`id_producto\`) ON DELETE CASCADE,
    FOREIGN KEY (\`id_tipo\`) REFERENCES \`tb_tipos_caracteristicas\` (\`id_tipo\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  // 4. Tabla de ofertas
  `CREATE TABLE IF NOT EXISTS \`tb_ofertas\` (
    \`id_oferta\` int(11) NOT NULL AUTO_INCREMENT,
    \`nombre_oferta\` varchar(255) NOT NULL,
    \`descripcion\` text DEFAULT NULL,
    \`tipo_descuento\` enum('porcentaje','monto_fijo') NOT NULL,
    \`valor_descuento\` decimal(10,2) NOT NULL,
    \`fecha_inicio\` datetime NOT NULL,
    \`fecha_fin\` datetime NOT NULL,
    \`activo\` tinyint(1) DEFAULT 1,
    \`precio_minimo\` decimal(10,2) DEFAULT NULL,
    \`precio_maximo\` decimal(10,2) DEFAULT NULL,
    \`limite_uso\` int(11) DEFAULT NULL,
    \`uso_actual\` int(11) DEFAULT 0,
    \`fyh_creacion\` datetime NOT NULL,
    \`fyh_actualizacion\` datetime NOT NULL,
    PRIMARY KEY (\`id_oferta\`),
    KEY \`idx_fechas\` (\`fecha_inicio\`, \`fecha_fin\`),
    KEY \`idx_activo\` (\`activo\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  // 5. Tabla de productos en ofertas
  `CREATE TABLE IF NOT EXISTS \`tb_productos_ofertas\` (
    \`id_producto_oferta\` int(11) NOT NULL AUTO_INCREMENT,
    \`id_producto\` int(11) NOT NULL,
    \`id_oferta\` int(11) NOT NULL,
    \`precio_oferta\` decimal(10,2) NOT NULL,
    \`fyh_creacion\` datetime NOT NULL,
    PRIMARY KEY (\`id_producto_oferta\`),
    UNIQUE KEY \`producto_oferta_unique\` (\`id_producto\`, \`id_oferta\`),
    KEY \`idx_producto\` (\`id_producto\`),
    KEY \`idx_oferta\` (\`id_oferta\`),
    FOREIGN KEY (\`id_producto\`) REFERENCES \`tb_almacen\` (\`id_producto\`) ON DELETE CASCADE,
    FOREIGN KEY (\`id_oferta\`) REFERENCES \`tb_ofertas\` (\`id_oferta\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  // 6. Tabla de favoritos
  `CREATE TABLE IF NOT EXISTS \`tb_favoritos\` (
    \`id_favorito\` int(11) NOT NULL AUTO_INCREMENT,
    \`id_cliente\` int(11) NOT NULL,
    \`id_producto\` int(11) NOT NULL,
    \`fyh_creacion\` datetime NOT NULL,
    PRIMARY KEY (\`id_favorito\`),
    UNIQUE KEY \`cliente_producto_unique\` (\`id_cliente\`, \`id_producto\`),
    KEY \`idx_cliente\` (\`id_cliente\`),
    KEY \`idx_producto\` (\`id_producto\`),
    FOREIGN KEY (\`id_cliente\`) REFERENCES \`tb_clientes\` (\`id_cliente\`) ON DELETE CASCADE,
    FOREIGN KEY (\`id_producto\`) REFERENCES \`tb_almacen\` (\`id_producto\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  // 7. Tabla de direcciones
  `CREATE TABLE IF NOT EXISTS \`tb_direcciones\` (
    \`id_direccion\` int(11) NOT NULL AUTO_INCREMENT,
    \`id_cliente\` int(11) NOT NULL,
    \`nombre_direccion\` varchar(100) NOT NULL,
    \`calle\` varchar(255) NOT NULL,
    \`numero\` varchar(20) NOT NULL,
    \`piso\` varchar(10) DEFAULT NULL,
    \`departamento\` varchar(10) DEFAULT NULL,
    \`barrio\` varchar(100) DEFAULT NULL,
    \`ciudad\` varchar(100) NOT NULL,
    \`provincia\` varchar(100) NOT NULL,
    \`codigo_postal\` varchar(20) DEFAULT NULL,
    \`pais\` varchar(100) DEFAULT 'Argentina',
    \`referencia\` text DEFAULT NULL,
    \`es_predeterminada\` tinyint(1) DEFAULT 0,
    \`es_facturacion\` tinyint(1) DEFAULT 0,
    \`telefono_contacto\` varchar(50) DEFAULT NULL,
    \`fyh_creacion\` datetime NOT NULL,
    \`fyh_actualizacion\` datetime NOT NULL,
    PRIMARY KEY (\`id_direccion\`),
    KEY \`idx_cliente\` (\`id_cliente\`),
    KEY \`idx_predeterminada\` (\`es_predeterminada\`),
    FOREIGN KEY (\`id_cliente\`) REFERENCES \`tb_clientes\` (\`id_cliente\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,

  // 8. Tabla de imágenes de productos
  `CREATE TABLE IF NOT EXISTS \`tb_producto_imagenes\` (
    \`id_imagen\` int(11) NOT NULL AUTO_INCREMENT,
    \`id_producto\` int(11) NOT NULL,
    \`url_imagen\` text NOT NULL,
    \`alt_text\` varchar(255) DEFAULT NULL,
    \`es_principal\` tinyint(1) DEFAULT 0,
    \`orden\` int(11) DEFAULT 0,
    \`fyh_creacion\` datetime NOT NULL,
    PRIMARY KEY (\`id_imagen\`),
    KEY \`idx_producto\` (\`id_producto\`),
    KEY \`idx_principal\` (\`es_principal\`),
    KEY \`idx_orden\` (\`orden\`),
    FOREIGN KEY (\`id_producto\`) REFERENCES \`tb_almacen\` (\`id_producto\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,
];

// Scripts para modificar tabla existente
const ALTER_TABLE_SQL = [
  // Agregar columnas a tb_almacen
  `ALTER TABLE \`tb_almacen\` 
   ADD COLUMN IF NOT EXISTS \`id_marca\` int(11) DEFAULT NULL AFTER \`id_categoria\`,
   ADD COLUMN IF NOT EXISTS \`modelo\` varchar(255) DEFAULT NULL AFTER \`nombre\`;`,

  // Agregar foreign key para marca (después de insertar marcas)
  `ALTER TABLE \`tb_almacen\` 
   ADD CONSTRAINT \`fk_almacen_marca\` 
   FOREIGN KEY (\`id_marca\`) REFERENCES \`tb_marcas\` (\`id_marca\`) 
   ON UPDATE CASCADE ON DELETE SET NULL;`,
];

// Datos de ejemplo para marcas
const MARCAS_DATA = [
  // Smartphones
  {
    nombre_marca: "Samsung",
    descripcion_marca: "Marca líder en smartphones y tecnología",
    activo: 1,
  },
  {
    nombre_marca: "Apple",
    descripcion_marca: "iPhone, iPad, MacBook y productos premium",
    activo: 1,
  },
  {
    nombre_marca: "Xiaomi",
    descripcion_marca: "Smartphones con excelente relación precio-calidad",
    activo: 1,
  },
  {
    nombre_marca: "Motorola",
    descripcion_marca: "Smartphones duraderos y confiables",
    activo: 1,
  },
  {
    nombre_marca: "Infinix",
    descripcion_marca: "Smartphones accesibles con buenas prestaciones",
    activo: 1,
  },
  {
    nombre_marca: "Honor",
    descripcion_marca: "Smartphones elegantes y potentes",
    activo: 1,
  },
  {
    nombre_marca: "Realme",
    descripcion_marca: "Smartphones jóvenes e innovadores",
    activo: 1,
  },

  // Audio
  {
    nombre_marca: "JBL",
    descripcion_marca: "Altavoces y auriculares de alta calidad",
    activo: 1,
  },
  {
    nombre_marca: "Sony",
    descripcion_marca: "Audio profesional y consumer",
    activo: 1,
  },

  // Gaming
  {
    nombre_marca: "Gamesir",
    descripcion_marca: "Controles y accesorios gaming",
    activo: 1,
  },
  {
    nombre_marca: "PlayStation",
    descripcion_marca: "Consolas y juegos Sony",
    activo: 1,
  },
  {
    nombre_marca: "Xbox",
    descripcion_marca: "Consolas y juegos Microsoft",
    activo: 1,
  },
  {
    nombre_marca: "Nintendo",
    descripcion_marca: "Consolas portátiles y juegos",
    activo: 1,
  },

  // Laptops
  {
    nombre_marca: "HP",
    descripcion_marca: "Computadoras y laptops empresariales",
    activo: 1,
  },
  {
    nombre_marca: "Asus",
    descripcion_marca: "Laptops gaming y profesionales",
    activo: 1,
  },
  {
    nombre_marca: "Acer",
    descripcion_marca: "Computadoras accesibles y funcionales",
    activo: 1,
  },
  {
    nombre_marca: "Dell",
    descripcion_marca: "Laptops empresariales y workstations",
    activo: 1,
  },

  // Otros
  {
    nombre_marca: "DJI",
    descripcion_marca: "Drones y tecnología de vuelo",
    activo: 1,
  },
  {
    nombre_marca: "GoPro",
    descripcion_marca: "Cámaras de acción y deportes",
    activo: 1,
  },
];

// Datos de ejemplo para tipos de características
const TIPOS_CARACTERISTICAS_DATA = [
  {
    nombre_tipo: "Pantalla",
    descripcion: "Tamaño de pantalla",
    tipo_dato: "numero",
    unidad_medida: "pulgadas",
    activo: 1,
  },
  {
    nombre_tipo: "RAM",
    descripcion: "Memoria RAM",
    tipo_dato: "numero",
    unidad_medida: "GB",
    activo: 1,
  },
  {
    nombre_tipo: "Almacenamiento",
    descripcion: "Capacidad de almacenamiento",
    tipo_dato: "numero",
    unidad_medida: "GB",
    activo: 1,
  },
  {
    nombre_tipo: "Cámara Principal",
    descripcion: "Resolución cámara principal",
    tipo_dato: "numero",
    unidad_medida: "MP",
    activo: 1,
  },
  {
    nombre_tipo: "Cámara Frontal",
    descripcion: "Resolución cámara frontal",
    tipo_dato: "numero",
    unidad_medida: "MP",
    activo: 1,
  },
  {
    nombre_tipo: "Batería",
    descripcion: "Capacidad de batería",
    tipo_dato: "numero",
    unidad_medida: "mAh",
    activo: 1,
  },
  {
    nombre_tipo: "Sistema Operativo",
    descripcion: "Sistema operativo",
    tipo_dato: "seleccion",
    opciones_seleccion: ["Android", "iOS", "Windows", "macOS"],
    activo: 1,
  },
  {
    nombre_tipo: "Conectividad",
    descripcion: "Tipo de conectividad",
    tipo_dato: "seleccion",
    opciones_seleccion: ["4G", "5G", "WiFi 6", "Bluetooth 5.0"],
    activo: 1,
  },
  {
    nombre_tipo: "Color",
    descripcion: "Color del producto",
    tipo_dato: "texto",
    activo: 1,
  },
  {
    nombre_tipo: "Procesador",
    descripcion: "Modelo del procesador",
    tipo_dato: "texto",
    activo: 1,
  },
  {
    nombre_tipo: "Tarjeta Gráfica",
    descripcion: "Tarjeta gráfica",
    tipo_dato: "texto",
    activo: 1,
  },
  {
    nombre_tipo: "Peso",
    descripcion: "Peso del dispositivo",
    tipo_dato: "numero",
    unidad_medida: "g",
    activo: 1,
  },
  {
    nombre_tipo: "Resistencia",
    descripcion: "Resistencia al agua/polvo",
    tipo_dato: "texto",
    activo: 1,
  },
  {
    nombre_tipo: "Carga Rápida",
    descripcion: "Soporte de carga rápida",
    tipo_dato: "booleano",
    activo: 1,
  },
  {
    nombre_tipo: "Carga Inalámbrica",
    descripcion: "Soporte de carga inalámbrica",
    tipo_dato: "booleano",
    activo: 1,
  },
];

// Datos de ejemplo para ofertas
const OFERTAS_DATA = [
  {
    nombre_oferta: "Black Friday 2025",
    descripcion: "Descuentos especiales por Black Friday",
    tipo_descuento: "porcentaje",
    valor_descuento: 20.0,
    fecha_inicio: "2025-11-29 00:00:00",
    fecha_fin: "2025-11-29 23:59:59",
    activo: 1,
    uso_actual: 0,
  },
  {
    nombre_oferta: "Liquidación Smartphones",
    descripcion: "Liquidación de smartphones seleccionados",
    tipo_descuento: "porcentaje",
    valor_descuento: 15.0,
    fecha_inicio: "2025-02-01 00:00:00",
    fecha_fin: "2025-02-28 23:59:59",
    activo: 1,
    uso_actual: 0,
  },
  {
    nombre_oferta: "Descuento Gaming",
    descripcion: "Descuento en productos gaming",
    tipo_descuento: "monto_fijo",
    valor_descuento: 50.0,
    fecha_inicio: "2025-02-01 00:00:00",
    fecha_fin: "2025-03-31 23:59:59",
    activo: 1,
    uso_actual: 0,
  },
];

async function executeSQL(connection, sql, description) {
  try {
    console.log(`Ejecutando: ${description}`);
    await connection.execute(sql);
    console.log(`✅ Completado: ${description}`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    throw error;
  }
}

async function insertData(connection, table, data, description) {
  try {
    console.log(`Insertando datos: ${description}`);
    const now = getCurrentDateTime();

    for (const item of data) {
      const columns = Object.keys(item).join(", ");
      const values = Object.values(item);
      const placeholders = values.map(() => "?").join(", ");

      const sql = `INSERT IGNORE INTO ${table} (${columns}, fyh_creacion, fyh_actualizacion) VALUES (${placeholders}, ?, ?)`;
      await connection.execute(sql, [...values, now, now]);
    }

    console.log(
      `✅ Datos insertados: ${description} (${data.length} registros)`
    );
  } catch (error) {
    console.error(`❌ Error insertando ${description}:`, error.message);
    throw error;
  }
}

async function migrateBrands(connection) {
  try {
    console.log("Iniciando migración de marcas desde nombres de productos...");

    // Obtener productos existentes
    const [products] = await connection.execute(
      "SELECT id_producto, nombre FROM tb_almacen WHERE id_marca IS NULL"
    );

    const brandMappings = {
      Samsung: ["Samsung", "SAMSUNG", "Galaxy"],
      Apple: ["iPhone", "iPad", "Apple", "MacBook", "Iphone", "Ipad"],
      Xiaomi: ["Xiaomi", "Redmi", "POCO", "Poco", "XIAOMI"],
      Motorola: ["Motorola", "Moto"],
      Infinix: ["Infinix", "INFINIX"],
      Honor: ["Honor", "HONOR"],
      Realme: ["Realme", "REALME"],
      JBL: ["JBL"],
      Sony: ["Sony", "SONY"],
      Gamesir: ["Gamesir", "GameSir"],
      PlayStation: ["PlayStation", "PS5", "Play 5"],
      Xbox: ["Xbox", "XBOX"],
      Nintendo: ["Nintendo", "NINTENDO"],
      HP: ["HP"],
      Asus: ["Asus", "ASUS"],
      Acer: ["Acer", "ACER"],
      Dell: ["Dell", "DELL"],
      DJI: ["DJI"],
      GoPro: ["GoPro", "GOPRO"],
    };

    // Obtener IDs de marcas
    const [brands] = await connection.execute(
      "SELECT id_marca, nombre_marca FROM tb_marcas"
    );
    const brandIdMap = {};
    brands.forEach((brand) => {
      brandIdMap[brand.nombre_marca] = brand.id_marca;
    });

    let updatedCount = 0;

    for (const product of products) {
      let foundBrandId = null;

      // Buscar marca en el nombre del producto
      for (const [brandName, keywords] of Object.entries(brandMappings)) {
        for (const keyword of keywords) {
          if (product.nombre.includes(keyword)) {
            foundBrandId = brandIdMap[brandName];
            break;
          }
        }
        if (foundBrandId) break;
      }

      // Actualizar producto con marca encontrada
      if (foundBrandId) {
        await connection.execute(
          "UPDATE tb_almacen SET id_marca = ? WHERE id_producto = ?",
          [foundBrandId, product.id_producto]
        );
        updatedCount++;
      }
    }

    console.log(
      `✅ Migración completada: ${updatedCount} productos actualizados con marcas`
    );
  } catch (error) {
    console.error("❌ Error en migración de marcas:", error.message);
    throw error;
  }
}

async function addSampleCharacteristics(connection) {
  try {
    console.log("Agregando características de ejemplo a productos...");

    // Obtener algunos productos Samsung para agregar características
    const [samsungProducts] = await connection.execute(`
      SELECT a.id_producto, a.nombre 
      FROM tb_almacen a 
      JOIN tb_marcas m ON a.id_marca = m.id_marca 
      WHERE m.nombre_marca = 'Samsung' 
      LIMIT 5
    `);

    // Obtener IDs de tipos de características
    const [types] = await connection.execute(
      "SELECT id_tipo, nombre_tipo FROM tb_tipos_caracteristicas"
    );
    const typeMap = {};
    types.forEach((type) => {
      typeMap[type.nombre_tipo] = type.id_tipo;
    });

    const now = getCurrentDateTime();

    for (const product of samsungProducts) {
      // Agregar características comunes para smartphones Samsung
      const characteristics = [
        { id_tipo: typeMap["Pantalla"], valor: "6.5" },
        { id_tipo: typeMap["RAM"], valor: "8" },
        { id_tipo: typeMap["Almacenamiento"], valor: "256" },
        { id_tipo: typeMap["Sistema Operativo"], valor: "Android" },
        { id_tipo: typeMap["Conectividad"], valor: "5G" },
        { id_tipo: typeMap["Carga Rápida"], valor: "1" },
      ];

      for (const char of characteristics) {
        if (char.id_tipo) {
          try {
            await connection.execute(
              `
              INSERT IGNORE INTO tb_producto_caracteristicas 
              (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion) 
              VALUES (?, ?, ?, ?, ?)
            `,
              [product.id_producto, char.id_tipo, char.valor, now, now]
            );
          } catch (err) {
            // Ignorar errores de duplicados
          }
        }
      }
    }

    console.log(
      `✅ Características agregadas a ${samsungProducts.length} productos Samsung`
    );
  } catch (error) {
    console.error("❌ Error agregando características:", error.message);
    throw error;
  }
}

async function main() {
  let connection;

  try {
    console.log("🚀 Iniciando implementación de mejoras de base de datos...\n");

    // Conectar a la base de datos
    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Conexión a base de datos establecida\n");

    // 1. Crear nuevas tablas
    console.log("📋 PASO 1: Creando nuevas tablas...");
    for (let i = 0; i < CREATE_TABLES_SQL.length; i++) {
      await executeSQL(connection, CREATE_TABLES_SQL[i], `Tabla ${i + 1}/8`);
    }
    console.log("✅ Todas las tablas creadas exitosamente\n");

    // 2. Insertar datos de ejemplo
    console.log("📋 PASO 2: Insertando datos de ejemplo...");

    // Insertar marcas
    await insertData(connection, "tb_marcas", MARCAS_DATA, "Marcas");

    // Insertar tipos de características
    const tiposData = TIPOS_CARACTERISTICAS_DATA.map((tipo) => ({
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion,
      tipo_dato: tipo.tipo_dato,
      unidad_medida: tipo.unidad_medida || null,
      opciones_seleccion: tipo.opciones_seleccion
        ? JSON.stringify(tipo.opciones_seleccion)
        : null,
      activo: tipo.activo,
    }));
    await insertData(
      connection,
      "tb_tipos_caracteristicas",
      tiposData,
      "Tipos de características"
    );

    // Insertar ofertas
    await insertData(connection, "tb_ofertas", OFERTAS_DATA, "Ofertas");

    console.log("✅ Todos los datos de ejemplo insertados\n");

    // 3. Modificar tabla existente
    console.log("📋 PASO 3: Modificando tabla tb_almacen...");
    await executeSQL(
      connection,
      ALTER_TABLE_SQL[0],
      "Agregando columnas id_marca y modelo"
    );
    console.log("✅ Tabla tb_almacen modificada\n");

    // 4. Migrar marcas existentes
    console.log("📋 PASO 4: Migrando marcas de productos existentes...");
    await migrateBrands(connection);
    console.log("✅ Migración de marcas completada\n");

    // 5. Agregar foreign key
    console.log("📋 PASO 5: Agregando foreign key para marcas...");
    try {
      await executeSQL(connection, ALTER_TABLE_SQL[1], "Foreign key id_marca");
    } catch (error) {
      if (error.message.includes("Duplicate key name")) {
        console.log("⚠️  Foreign key ya existe, continuando...");
      } else {
        throw error;
      }
    }
    console.log("✅ Foreign key agregada\n");

    // 6. Agregar características de ejemplo
    console.log("📋 PASO 6: Agregando características de ejemplo...");
    await addSampleCharacteristics(connection);
    console.log("✅ Características de ejemplo agregadas\n");

    // 7. Verificar implementación
    console.log("📋 PASO 7: Verificando implementación...");

    const [tablesCount] = await connection.execute(
      `
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name IN (
        'tb_marcas', 'tb_tipos_caracteristicas', 'tb_producto_caracteristicas',
        'tb_ofertas', 'tb_productos_ofertas', 'tb_favoritos', 
        'tb_direcciones', 'tb_producto_imagenes'
      )
    `,
      [DB_CONFIG.database]
    );

    const [marcasCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM tb_marcas"
    );
    const [tiposCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM tb_tipos_caracteristicas"
    );
    const [ofertasCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM tb_ofertas"
    );
    const [productosConMarca] = await connection.execute(
      "SELECT COUNT(*) as count FROM tb_almacen WHERE id_marca IS NOT NULL"
    );

    console.log("\n📊 RESUMEN DE IMPLEMENTACIÓN:");
    console.log(`   • Nuevas tablas creadas: ${tablesCount[0].count}/8`);
    console.log(`   • Marcas insertadas: ${marcasCount[0].count}`);
    console.log(`   • Tipos de características: ${tiposCount[0].count}`);
    console.log(`   • Ofertas creadas: ${ofertasCount[0].count}`);
    console.log(
      `   • Productos con marca asignada: ${productosConMarca[0].count}`
    );

    console.log("\n🎉 ¡Implementación de mejoras completada exitosamente!");
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Implementar modelos en el backend");
    console.log("   2. Crear APIs para las nuevas funcionalidades");
    console.log("   3. Actualizar frontend con nuevos componentes");
  } catch (error) {
    console.error("\n❌ Error durante la implementación:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Conexión cerrada");
    }
  }
}

// Ejecutar script
main();
