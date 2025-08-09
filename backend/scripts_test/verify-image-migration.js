/**
 * Script para verificar la migración de imágenes de tb_almacen a tb_producto_imagenes
 * Este script valida que todos los datos se migraron correctamente
 */

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar variables de entorno
dotenv.config({ path: path.join(__dirname, "../.env") });

// Configuración de la base de datos
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_tecnocel_v3",
  logging: false,
});

async function verifyImageMigration() {
  try {
    console.log("🔍 Verificando migración de imágenes...\n");

    // 1. Verificar productos con campo imagen en tb_almacen
    const [productosConImagen] = await sequelize.query(`
      SELECT id_producto, nombre, imagen 
      FROM tb_almacen 
      WHERE imagen IS NOT NULL AND imagen != ''
    `);

    console.log(
      `📊 Productos con campo 'imagen' en tb_almacen: ${productosConImagen.length}`
    );

    // 2. Verificar imágenes en tb_producto_imagenes
    const [imagenesEnTabla] = await sequelize.query(`
      SELECT COUNT(*) as total_imagenes,
             COUNT(DISTINCT id_producto) as productos_con_imagenes
      FROM tb_producto_imagenes
    `);

    console.log(
      `📊 Total de imágenes en tb_producto_imagenes: ${imagenesEnTabla[0].total_imagenes}`
    );
    console.log(
      `📊 Productos con imágenes: ${imagenesEnTabla[0].productos_con_imagenes}`
    );

    // 3. Verificar imágenes principales
    const [imagenesPrincipales] = await sequelize.query(`
      SELECT COUNT(*) as total_principales
      FROM tb_producto_imagenes 
      WHERE es_principal = 1
    `);

    console.log(
      `📊 Imágenes marcadas como principales: ${imagenesPrincipales[0].total_principales}`
    );

    // 4. Verificar productos sin imágenes
    const [productosSinImagen] = await sequelize.query(`
      SELECT COUNT(*) as total_sin_imagen
      FROM tb_almacen a
      LEFT JOIN tb_producto_imagenes pi ON a.id_producto = pi.id_producto
      WHERE pi.id_imagen IS NULL
    `);

    console.log(
      `📊 Productos sin imágenes: ${productosSinImagen[0].total_sin_imagen}`
    );

    // 5. Verificar consistencia de datos
    console.log("\n🔍 Verificando consistencia de datos...");

    // Productos que tienen campo imagen pero no tienen registros en tb_producto_imagenes
    const [inconsistencias] = await sequelize.query(`
      SELECT a.id_producto, a.nombre, a.imagen
      FROM tb_almacen a
      LEFT JOIN tb_producto_imagenes pi ON a.id_producto = pi.id_producto
      WHERE a.imagen IS NOT NULL AND a.imagen != '' AND pi.id_imagen IS NULL
    `);

    if (inconsistencias.length > 0) {
      console.log(
        `⚠️  INCONSISTENCIA: ${inconsistencias.length} productos tienen campo 'imagen' pero no registros en tb_producto_imagenes:`
      );
      inconsistencias.forEach((p) => {
        console.log(
          `   - ID: ${p.id_producto}, Nombre: ${p.nombre}, Imagen: ${p.imagen}`
        );
      });
    } else {
      console.log(
        "✅ Todos los productos con campo imagen tienen registros en tb_producto_imagenes"
      );
    }

    // 6. Verificar productos con múltiples imágenes principales
    const [multiplesPrincipales] = await sequelize.query(`
      SELECT id_producto, COUNT(*) as total_principales
      FROM tb_producto_imagenes 
      WHERE es_principal = 1
      GROUP BY id_producto
      HAVING COUNT(*) > 1
    `);

    if (multiplesPrincipales.length > 0) {
      console.log(
        `⚠️  ADVERTENCIA: ${multiplesPrincipales.length} productos tienen múltiples imágenes principales:`
      );
      multiplesPrincipales.forEach((p) => {
        console.log(
          `   - Producto ID: ${p.id_producto}, Imágenes principales: ${p.total_principales}`
        );
      });
    } else {
      console.log("✅ Todos los productos tienen máximo una imagen principal");
    }

    // 7. Verificar orden de imágenes
    const [ordenInconsistente] = await sequelize.query(`
      SELECT id_producto, COUNT(*) as total_imagenes,
             COUNT(DISTINCT orden) as ordenes_unicos
      FROM tb_producto_imagenes
      GROUP BY id_producto
      HAVING total_imagenes != ordenes_unicos
    `);

    if (ordenInconsistente.length > 0) {
      console.log(
        `⚠️  ADVERTENCIA: ${ordenInconsistente.length} productos tienen orden de imágenes inconsistente`
      );
    } else {
      console.log("✅ Orden de imágenes consistente en todos los productos");
    }

    // 8. Resumen final
    console.log("\n📋 RESUMEN DE LA MIGRACIÓN:");
    console.log(
      `   - Productos con campo imagen: ${productosConImagen.length}`
    );
    console.log(`   - Imágenes migradas: ${imagenesEnTabla[0].total_imagenes}`);
    console.log(
      `   - Productos con imágenes: ${imagenesEnTabla[0].productos_con_imagenes}`
    );
    console.log(
      `   - Imágenes principales: ${imagenesPrincipales[0].total_principales}`
    );
    console.log(
      `   - Productos sin imágenes: ${productosSinImagen[0].total_sin_imagen}`
    );

    if (
      inconsistencias.length === 0 &&
      multiplesPrincipales.length === 0 &&
      ordenInconsistente.length === 0
    ) {
      console.log("\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE");
      console.log(
        '   Puedes proceder a eliminar el campo "imagen" de tb_almacen'
      );
    } else {
      console.log("\n⚠️  MIGRACIÓN CON ADVERTENCIAS");
      console.log(
        '   Revisa las inconsistencias antes de eliminar el campo "imagen"'
      );
    }
  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar verificación
verifyImageMigration();
