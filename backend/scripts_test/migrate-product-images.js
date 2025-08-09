import { Sequelize } from "sequelize";
import sequelize, { testConnection } from "./config/database.js";
import logger from "./config/logger.js";

async function migrateProductImages() {
  // Verificar la conexión antes de proceder
  if (!(await testConnection())) {
    logger.error("No se pudo establecer conexión con la base de datos");
    process.exit(1);
  }

  const transaction = await sequelize.transaction();

  try {
    logger.info("Iniciando migración de imágenes de productos");

    // 1. Obtener todos los productos con imágenes
    const productos = await sequelize.query(
      'SELECT id_producto, nombre, imagen FROM tb_almacen WHERE imagen IS NOT NULL AND imagen != ""',
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );

    logger.info(
      `Se encontraron ${productos.length} productos con imágenes para migrar`
    );

    // 2. Migrar cada imagen a la nueva tabla
    for (const producto of productos) {
      const { id_producto, nombre, imagen } = producto;

      // Verificar si ya existe una imagen principal para este producto
      const imagenExistente = await sequelize.query(
        "SELECT id_imagen FROM tb_producto_imagenes WHERE id_producto = ? AND es_principal = true",
        {
          replacements: [id_producto],
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (imagenExistente.length === 0) {
        // Insertar la imagen en la nueva tabla
        await sequelize.query(
          `INSERT INTO tb_producto_imagenes 
           (id_producto, url_imagen, alt_text, es_principal, orden, fyh_creacion)
           VALUES (?, ?, ?, true, 1, NOW())`,
          {
            replacements: [
              id_producto,
              imagen,
              `Imagen principal de ${nombre}`,
            ],
            type: Sequelize.QueryTypes.INSERT,
            transaction,
          }
        );

        logger.debug(
          `Migrada imagen principal para producto ID: ${id_producto}`
        );
      } else {
        logger.debug(`Producto ID: ${id_producto} ya tiene imagen principal`);
      }
    }

    // 3. Verificar la migración
    const imagenesNuevas = await sequelize.query(
      "SELECT COUNT(*) as total FROM tb_producto_imagenes",
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );

    logger.info(`Total de imágenes migradas: ${imagenesNuevas[0].total}`);

    // 4. Commit de la transacción
    await transaction.commit();
    logger.info("Migración completada exitosamente");

    return {
      success: true,
      totalProductos: productos.length,
      totalImagenes: imagenesNuevas[0].total,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Error durante la migración:", error);
    throw error;
  } finally {
    // Cerrar la conexión después de completar
    await sequelize.close();
  }
}

// Ejecutar la migración
migrateProductImages()
  .then((result) => {
    logger.info("Resultado de la migración:", result);
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Error en el script de migración:", error);
    process.exit(1);
  });
