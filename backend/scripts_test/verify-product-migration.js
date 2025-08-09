const { Sequelize } = require("sequelize");
require("dotenv").config();

async function verifyProductMigration() {
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

    // 1. Verificar conteo de registros
    const [almacenCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM tb_almacen"
    );
    const [baseCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM tb_productos_base"
    );
    const [inventarioCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM tb_inventario"
    );
    const [webCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM tb_productos_web"
    );

    console.log("\n📊 Verificación de Conteos:");
    console.log(`- Productos en Almacén Original: ${almacenCount[0].count}`);
    console.log(`- Productos Base: ${baseCount[0].count}`);
    console.log(`- Registros de Inventario: ${inventarioCount[0].count}`);
    console.log(`- Productos Web: ${webCount[0].count}`);

    if (almacenCount[0].count !== baseCount[0].count) {
      console.error(
        "❌ Error: Discrepancia en el número de productos migrados"
      );
    } else {
      console.log("✅ Conteos verificados correctamente");
    }

    // 2. Verificar integridad de datos
    const [sampleProduct] = await sequelize.query(`
      SELECT 
        a.id_producto,
        a.codigo as codigo_original,
        a.nombre as nombre_original,
        pb.codigo as codigo_nuevo,
        pb.nombre as nombre_nuevo,
        i.stock as stock_nuevo,
        pw.precio_venta_web as precio_web
      FROM tb_almacen a
      LEFT JOIN tb_productos_base pb ON a.codigo = pb.codigo
      LEFT JOIN tb_inventario i ON pb.id_producto_base = i.id_producto_base
      LEFT JOIN tb_productos_web pw ON pb.id_producto_base = pw.id_producto_base
      LIMIT 1;
    `);

    console.log("\n🔍 Muestra de Verificación de Datos:");
    console.log(sampleProduct[0]);

    // 3. Verificar integridad referencial
    const [orphanedInventory] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM tb_inventario i 
      LEFT JOIN tb_productos_base pb ON i.id_producto_base = pb.id_producto_base 
      WHERE pb.id_producto_base IS NULL
    `);

    const [orphanedWeb] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM tb_productos_web pw 
      LEFT JOIN tb_productos_base pb ON pw.id_producto_base = pb.id_producto_base 
      WHERE pb.id_producto_base IS NULL
    `);

    console.log("\n🔗 Verificación de Integridad Referencial:");
    console.log(
      `- Registros huérfanos en Inventario: ${orphanedInventory[0].count}`
    );
    console.log(`- Registros huérfanos en Web: ${orphanedWeb[0].count}`);

    if (orphanedInventory[0].count > 0 || orphanedWeb[0].count > 0) {
      console.error("❌ Error: Se encontraron registros huérfanos");
    } else {
      console.log("✅ Integridad referencial verificada");
    }

    // 4. Verificar tipos de datos
    const [invalidPrices] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM tb_inventario 
      WHERE precio_compra < 0 OR precio_venta_base < 0
    `);

    const [invalidStock] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM tb_inventario 
      WHERE stock < 0
    `);

    console.log("\n🔢 Verificación de Tipos de Datos:");
    console.log(`- Precios inválidos: ${invalidPrices[0].count}`);
    console.log(`- Stock inválido: ${invalidStock[0].count}`);

    if (invalidPrices[0].count > 0 || invalidStock[0].count > 0) {
      console.error("❌ Error: Se encontraron valores inválidos");
    } else {
      console.log("✅ Tipos de datos verificados");
    }

    // 5. Verificar imágenes
    const [imageStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_images,
        SUM(CASE WHEN tipo IS NULL THEN 1 ELSE 0 END) as missing_type,
        SUM(CASE WHEN dimensiones IS NULL THEN 1 ELSE 0 END) as missing_dimensions
      FROM tb_producto_imagenes
    `);

    console.log("\n📸 Verificación de Imágenes:");
    console.log(`- Total de imágenes: ${imageStats[0].total_images}`);
    console.log(`- Imágenes sin tipo: ${imageStats[0].missing_type}`);
    console.log(
      `- Imágenes sin dimensiones: ${imageStats[0].missing_dimensions}`
    );

    // 6. Resumen final
    console.log("\n📋 Resumen de Verificación:");
    const allValid =
      almacenCount[0].count === baseCount[0].count &&
      orphanedInventory[0].count === 0 &&
      orphanedWeb[0].count === 0 &&
      invalidPrices[0].count === 0 &&
      invalidStock[0].count === 0;

    if (allValid) {
      console.log("✅ Migración completada exitosamente");
      console.log("✅ Todos los datos verificados correctamente");
    } else {
      console.error("❌ Se encontraron problemas durante la verificación");
      console.log("⚠️ Revise los mensajes anteriores para más detalles");
    }
  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar la verificación
verifyProductMigration().catch(console.error);
