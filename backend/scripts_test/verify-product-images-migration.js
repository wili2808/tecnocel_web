import { Sequelize } from "sequelize";
import sequelize, { testConnection } from "./config/database.js";
import logger from "./config/logger.js";

async function verifyMigration() {
  // Verificar la conexión antes de proceder
  if (!(await testConnection())) {
    logger.error("No se pudo establecer conexión con la base de datos");
    process.exit(1);
  }

  try {
    logger.info("Iniciando verificación de la migración de imágenes");

    // 1. Verificar productos con imágenes en tb_almacen
    const productosConImagen = await sequelize.query(
      'SELECT COUNT(*) as total FROM tb_almacen WHERE imagen IS NOT NULL AND imagen != ""',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 2. Verificar imágenes principales en tb_producto_imagenes
    const imagenesPrincipales = await sequelize.query(
      "SELECT COUNT(*) as total FROM tb_producto_imagenes WHERE es_principal = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 3. Verificar productos sin imagen principal
    const productosSinPrincipal = await sequelize.query(
      `SELECT a.id_producto, a.nombre, a.imagen 
       FROM tb_almacen a 
       LEFT JOIN (
         SELECT id_producto 
         FROM tb_producto_imagenes 
         WHERE es_principal = true
       ) pi ON a.id_producto = pi.id_producto 
       WHERE a.imagen IS NOT NULL 
       AND a.imagen != "" 
       AND pi.id_producto IS NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 4. Verificar integridad de URLs
    // Verificación simplificada de URLs inválidas
    const imagenesInvalidas = await sequelize.query(
      `SELECT pi.id_imagen, pi.id_producto, pi.url_imagen, a.nombre
       FROM tb_producto_imagenes pi
       JOIN tb_almacen a ON pi.id_producto = a.id_producto
       WHERE pi.url_imagen IS NULL 
       OR pi.url_imagen = ""
       OR pi.url_imagen LIKE '%.%%.%'  -- Múltiples extensiones
       OR pi.url_imagen LIKE '%..%'    -- Doble punto
       OR pi.url_imagen LIKE '%//%'    -- Doble barra
       OR pi.url_imagen LIKE '% %'     -- Espacios en medio
       OR pi.url_imagen REGEXP '[<>:"|?*]'  -- Caracteres especiales no permitidos`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 5. Verificar duplicados
    const imagenesDuplicadas = await sequelize.query(
      `SELECT id_producto, url_imagen, COUNT(*) as total
       FROM tb_producto_imagenes
       GROUP BY id_producto, url_imagen
       HAVING COUNT(*) > 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Preparar reporte
    const reporte = {
      productos_con_imagen: productosConImagen[0].total,
      imagenes_principales: imagenesPrincipales[0].total,
      productos_sin_principal: productosSinPrincipal.length,
      imagenes_invalidas: imagenesInvalidas.length,
      imagenes_duplicadas: imagenesDuplicadas.length,
      detalles: {
        productos_sin_principal: productosSinPrincipal,
        imagenes_invalidas: imagenesInvalidas,
        imagenes_duplicadas: imagenesDuplicadas,
      },
    };

    // Evaluar resultado
    const migracionExitosa =
      reporte.productos_con_imagen === reporte.imagenes_principales &&
      reporte.productos_sin_principal === 0 &&
      reporte.imagenes_invalidas === 0 &&
      reporte.imagenes_duplicadas === 0;

    logger.info("Resultado de la verificación:", {
      ...reporte,
      migracion_exitosa: migracionExitosa,
    });

    return {
      success: migracionExitosa,
      reporte,
    };
  } catch (error) {
    logger.error("Error durante la verificación:", error);
    throw error;
  } finally {
    // Cerrar la conexión después de completar
    await sequelize.close();
  }
}

// Ejecutar la verificación
verifyMigration()
  .then((result) => {
    if (result.success) {
      logger.info("Verificación completada exitosamente");
    } else {
      logger.warn("Se encontraron problemas en la migración");
    }
    console.log(JSON.stringify(result.reporte, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    logger.error("Error en el script de verificación:", error);
    process.exit(1);
  });
