import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_tecnocel_v2",
  logging: false,
});

console.log(
  "🔄 Iniciando actualización de rutas de imágenes de comentarios en la base de datos..."
);

async function updateImagePaths() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida");

    // Consultar imágenes de comentarios con rutas antiguas
    const [results] = await sequelize.query(`
      SELECT id_imagen, ruta_imagen 
      FROM comentario_imagenes 
      WHERE ruta_imagen LIKE 'comments_img/%' 
      AND estado = 'activo'
    `);

    console.log(`📊 Encontradas ${results.length} imágenes con rutas antiguas`);

    if (results.length === 0) {
      console.log("ℹ️  No hay imágenes que necesiten actualización.");
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Actualizar cada ruta
    for (const row of results) {
      try {
        const oldPath = row.ruta_imagen;
        const fileName = oldPath.replace("comments_img/", "");
        const newPath = `img_comments/${fileName}`;

        // Actualizar en la base de datos
        await sequelize.query(
          `
          UPDATE comentario_imagenes 
          SET ruta_imagen = ? 
          WHERE id_imagen = ?
        `,
          {
            replacements: [newPath, row.id_imagen],
          }
        );

        console.log(`✅ Actualizado: ${oldPath} → ${newPath}`);
        updatedCount++;
      } catch (error) {
        console.error(
          `❌ Error actualizando imagen ${row.id_imagen}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log("\n📊 Resumen de actualización:");
    console.log(`   - Total de registros: ${results.length}`);
    console.log(`   - Actualizados exitosamente: ${updatedCount}`);
    console.log(`   - Errores: ${errorCount}`);

    // Verificar que no queden rutas antiguas
    const [remainingResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM comentario_imagenes 
      WHERE ruta_imagen LIKE 'comments_img/%' 
      AND estado = 'activo'
    `);

    const remainingCount = remainingResults[0].count;
    if (remainingCount > 0) {
      console.log(
        `⚠️  Aún quedan ${remainingCount} registros con rutas antiguas`
      );
    } else {
      console.log("✅ Todas las rutas han sido actualizadas correctamente");
    }
  } catch (error) {
    console.error("❌ Error durante la actualización:", error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log("🔌 Conexión a la base de datos cerrada");
  }
}

// Ejecutar la actualización
updateImagePaths()
  .then(() => {
    console.log("\n🎉 Actualización completada exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error.message);
    process.exit(1);
  });
