import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: "../.env" });

// Configuración de la base de datos
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "db_tecnocel_v4",
};

// Ofertas de ejemplo
const OFERTAS_ESPECIALES = [
  {
    nombre_oferta: "Black Friday 2025",
    descripcion:
      "Descuentos especiales por Black Friday en smartphones y tablets",
    tipo_descuento: "porcentaje",
    valor_descuento: 25.0,
    fecha_inicio: "2025-11-29 00:00:00",
    fecha_fin: "2025-11-29 23:59:59",
    activo: 1,
    uso_actual: 0,
    uso_maximo: 100,
  },
  {
    nombre_oferta: "Cyber Monday 2025",
    descripcion: "Ofertas especiales de Cyber Monday en accesorios y notebooks",
    tipo_descuento: "porcentaje",
    valor_descuento: 20.0,
    fecha_inicio: "2025-12-02 00:00:00",
    fecha_fin: "2025-12-02 23:59:59",
    activo: 1,
    uso_actual: 0,
    uso_maximo: 150,
  },
  {
    nombre_oferta: "Liquidación Enero",
    descripcion: "Liquidación de inventario con grandes descuentos",
    tipo_descuento: "porcentaje",
    valor_descuento: 30.0,
    fecha_inicio: "2025-01-15 00:00:00",
    fecha_fin: "2025-01-31 23:59:59",
    activo: 1,
    uso_actual: 0,
    uso_maximo: 200,
  },
  {
    nombre_oferta: "San Valentín Tech",
    descripcion: "Ofertas especiales para San Valentín en tecnología",
    tipo_descuento: "monto_fijo",
    valor_descuento: 50.0,
    fecha_inicio: "2025-02-10 00:00:00",
    fecha_fin: "2025-02-14 23:59:59",
    activo: 1,
    uso_actual: 0,
    uso_maximo: 75,
  },
  {
    nombre_oferta: "Día del Padre Tech",
    descripcion: "Descuentos especiales para el Día del Padre",
    tipo_descuento: "porcentaje",
    valor_descuento: 15.0,
    fecha_inicio: "2025-06-15 00:00:00",
    fecha_fin: "2025-06-21 23:59:59",
    activo: 1,
    uso_actual: 0,
    uso_maximo: 100,
  },
  {
    nombre_oferta: "Back to School",
    descripcion: "Ofertas para estudiantes en notebooks y tablets",
    tipo_descuento: "porcentaje",
    valor_descuento: 18.0,
    fecha_inicio: "2025-02-15 00:00:00",
    fecha_fin: "2025-03-15 23:59:59",
    activo: 1,
    uso_actual: 0,
    uso_maximo: 120,
  },
];

// Mapeo de productos por categorías para asignar ofertas relevantes
const PRODUCTOS_OFERTAS = [
  // Black Friday - Smartphones Samsung
  { nombre_oferta: "Black Friday 2025", productos: [5, 30, 31, 32, 33] },

  // Cyber Monday - Accesorios y Notebooks (IDs aproximados basados en la estructura)
  { nombre_oferta: "Cyber Monday 2025", productos: [10, 15, 20, 25, 35] },

  // Liquidación Enero - Productos variados
  { nombre_oferta: "Liquidación Enero", productos: [5, 10, 15, 20, 25, 30] },

  // San Valentín - Productos premium
  { nombre_oferta: "San Valentín Tech", productos: [31, 32] },

  // Día del Padre - Notebooks y tablets
  { nombre_oferta: "Día del Padre Tech", productos: [15, 20, 25] },

  // Back to School - Estudiantes
  { nombre_oferta: "Back to School", productos: [5, 15, 25, 30] },
];

async function conectarBaseDatos() {
  try {
    console.log("🔄 Conectando a la base de datos...");
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Conexión establecida exitosamente");
    return connection;
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error.message);
    throw error;
  }
}

async function verificarTablas(connection) {
  try {
    console.log("🔍 Verificando existencia de tablas...");

    const [ofertas] = await connection.execute(
      "SELECT COUNT(*) as count FROM tb_ofertas"
    );
    const [productosOfertas] = await connection.execute(
      "SELECT COUNT(*) as count FROM tb_productos_ofertas"
    );

    console.log(`📊 Ofertas existentes: ${ofertas[0].count}`);
    console.log(
      `📊 Productos en ofertas existentes: ${productosOfertas[0].count}`
    );

    return true;
  } catch (error) {
    console.error("❌ Error al verificar tablas:", error.message);
    return false;
  }
}

async function insertarOfertas(connection) {
  try {
    console.log("🔄 Insertando ofertas de ejemplo...");

    for (const oferta of OFERTAS_ESPECIALES) {
      try {
        const [result] = await connection.execute(
          `INSERT INTO tb_ofertas (
            nombre_oferta, descripcion, tipo_descuento, valor_descuento,
            fecha_inicio, fecha_fin, activo, uso_actual, uso_maximo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            descripcion = VALUES(descripcion),
            tipo_descuento = VALUES(tipo_descuento),
            valor_descuento = VALUES(valor_descuento),
            fecha_inicio = VALUES(fecha_inicio),
            fecha_fin = VALUES(fecha_fin),
            activo = VALUES(activo),
            uso_maximo = VALUES(uso_maximo)`,
          [
            oferta.nombre_oferta,
            oferta.descripcion,
            oferta.tipo_descuento,
            oferta.valor_descuento,
            oferta.fecha_inicio,
            oferta.fecha_fin,
            oferta.activo,
            oferta.uso_actual,
            oferta.uso_maximo,
          ]
        );

        console.log(
          `✅ Oferta insertada/actualizada: ${oferta.nombre_oferta} (ID: ${
            result.insertId || "existente"
          })`
        );
      } catch (error) {
        console.error(
          `❌ Error insertando oferta ${oferta.nombre_oferta}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("❌ Error general insertando ofertas:", error.message);
  }
}

async function obtenerIdOfertas(connection) {
  try {
    console.log("🔍 Obteniendo IDs de ofertas...");

    const [ofertas] = await connection.execute(
      "SELECT id_oferta, nombre_oferta FROM tb_ofertas WHERE activo = 1"
    );

    const mapaOfertas = {};
    ofertas.forEach((oferta) => {
      mapaOfertas[oferta.nombre_oferta] = oferta.id_oferta;
    });

    console.log(`📋 Ofertas disponibles: ${Object.keys(mapaOfertas).length}`);
    return mapaOfertas;
  } catch (error) {
    console.error("❌ Error obteniendo IDs de ofertas:", error.message);
    return {};
  }
}

async function verificarProductosExisten(connection, productos) {
  try {
    const productosString = productos.join(",");
    const [result] = await connection.execute(
      `SELECT id_producto FROM tb_almacen WHERE id_producto IN (${productosString})`
    );

    return result.map((row) => row.id_producto);
  } catch (error) {
    console.error("❌ Error verificando productos:", error.message);
    return [];
  }
}

async function calcularPrecioOferta(
  connection,
  idProducto,
  tipoDescuento,
  valorDescuento
) {
  try {
    const [result] = await connection.execute(
      "SELECT precio_venta FROM tb_almacen WHERE id_producto = ?",
      [idProducto]
    );

    if (result.length === 0) return null;

    const precioVenta = parseFloat(result[0].precio_venta);
    let precioOferta;

    if (tipoDescuento === "porcentaje") {
      precioOferta = precioVenta * (1 - valorDescuento / 100);
    } else {
      precioOferta = Math.max(0, precioVenta - valorDescuento);
    }

    return Math.round(precioOferta * 100) / 100; // Redondear a 2 decimales
  } catch (error) {
    console.error(
      `❌ Error calculando precio de oferta para producto ${idProducto}:`,
      error.message
    );
    return null;
  }
}

async function asignarProductosAOfertas(connection, mapaOfertas) {
  try {
    console.log("🔄 Asignando productos a ofertas...");

    for (const asignacion of PRODUCTOS_OFERTAS) {
      const idOferta = mapaOfertas[asignacion.nombre_oferta];

      if (!idOferta) {
        console.log(`⚠️ Oferta no encontrada: ${asignacion.nombre_oferta}`);
        continue;
      }

      // Verificar qué productos existen
      const productosExistentes = await verificarProductosExisten(
        connection,
        asignacion.productos
      );

      if (productosExistentes.length === 0) {
        console.log(
          `⚠️ No se encontraron productos para la oferta: ${asignacion.nombre_oferta}`
        );
        continue;
      }

      // Obtener datos de la oferta
      const [ofertaData] = await connection.execute(
        "SELECT tipo_descuento, valor_descuento FROM tb_ofertas WHERE id_oferta = ?",
        [idOferta]
      );

      if (ofertaData.length === 0) continue;

      const { tipo_descuento, valor_descuento } = ofertaData[0];

      for (const idProducto of productosExistentes) {
        try {
          // Calcular precio de oferta
          const precioOferta = await calcularPrecioOferta(
            connection,
            idProducto,
            tipo_descuento,
            valor_descuento
          );

          if (precioOferta === null) {
            console.log(
              `⚠️ No se pudo calcular precio de oferta para producto ${idProducto}`
            );
            continue;
          }

          // Insertar relación producto-oferta
          await connection.execute(
            `INSERT INTO tb_productos_ofertas (id_producto, id_oferta, precio_oferta)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE precio_oferta = VALUES(precio_oferta)`,
            [idProducto, idOferta, precioOferta]
          );

          console.log(
            `✅ Producto ${idProducto} asignado a oferta "${asignacion.nombre_oferta}" con precio $${precioOferta}`
          );
        } catch (error) {
          console.error(
            `❌ Error asignando producto ${idProducto} a oferta ${asignacion.nombre_oferta}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "❌ Error general asignando productos a ofertas:",
      error.message
    );
  }
}

async function mostrarResumen(connection) {
  try {
    console.log("\n📊 RESUMEN DE OFERTAS CREADAS:");
    console.log("═".repeat(60));

    const [ofertas] = await connection.execute(`
      SELECT 
        o.nombre_oferta,
        o.tipo_descuento,
        o.valor_descuento,
        o.fecha_inicio,
        o.fecha_fin,
        COUNT(po.id_producto) as productos_count
      FROM tb_ofertas o
      LEFT JOIN tb_productos_ofertas po ON o.id_oferta = po.id_oferta
      WHERE o.activo = 1
      GROUP BY o.id_oferta
      ORDER BY o.nombre_oferta
    `);

    ofertas.forEach((oferta) => {
      const descuento =
        oferta.tipo_descuento === "porcentaje"
          ? `${oferta.valor_descuento}%`
          : `$${oferta.valor_descuento}`;

      const fechaInicio = new Date(oferta.fecha_inicio).toLocaleDateString(
        "es-AR"
      );
      const fechaFin = new Date(oferta.fecha_fin).toLocaleDateString("es-AR");

      console.log(`\n🏷️  ${oferta.nombre_oferta}`);
      console.log(`   💰 Descuento: ${descuento}`);
      console.log(`   📅 Período: ${fechaInicio} - ${fechaFin}`);
      console.log(`   📦 Productos: ${oferta.productos_count}`);
    });

    const [totales] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT o.id_oferta) as total_ofertas,
        COUNT(DISTINCT po.id_producto) as productos_en_oferta
      FROM tb_ofertas o
      LEFT JOIN tb_productos_ofertas po ON o.id_oferta = po.id_oferta
      WHERE o.activo = 1
    `);

    console.log("\n═".repeat(60));
    console.log(`📋 Total ofertas activas: ${totales[0].total_ofertas}`);
    console.log(
      `🛍️  Total productos en ofertas: ${totales[0].productos_en_oferta}`
    );
    console.log("═".repeat(60));
  } catch (error) {
    console.error("❌ Error mostrando resumen:", error.message);
  }
}

async function main() {
  let connection;

  try {
    console.log("🚀 INICIANDO CREACIÓN DE OFERTAS DE EJEMPLO");
    console.log("═".repeat(60));

    // Conectar a la base de datos
    connection = await conectarBaseDatos();

    // Verificar tablas
    const tablasOk = await verificarTablas(connection);
    if (!tablasOk) {
      throw new Error("Las tablas necesarias no existen");
    }

    // Insertar ofertas
    await insertarOfertas(connection);

    // Obtener IDs de ofertas
    const mapaOfertas = await obtenerIdOfertas(connection);

    // Asignar productos a ofertas
    await asignarProductosAOfertas(connection, mapaOfertas);

    // Mostrar resumen
    await mostrarResumen(connection);

    console.log("\n✅ ¡Ofertas de ejemplo creadas exitosamente!");
  } catch (error) {
    console.error("\n❌ Error durante la ejecución:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Conexión cerrada");
    }
  }
}

// Ejecutar el script
main();
