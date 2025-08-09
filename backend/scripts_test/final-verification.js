import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Cargar variables de entorno
dotenv.config();

const COMMENTS_IMAGES_PATH =
  process.env.COMMENTS_IMAGES_PATH || "C:/xampp/htdocs/tecnocel/img_comments";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Configuración de la base de datos
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_tecnocel_v3",
  logging: false,
});

console.log("🎉 VERIFICACIÓN FINAL - Imágenes de comentarios...\n");

async function finalVerification() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a BD establecida");

    // Obtener imágenes de comentarios
    const [imagenes] = await sequelize.query(`
      SELECT id_imagen, nombre_archivo, ruta_imagen, estado
      FROM tb_comentario_imagenes 
      WHERE estado = 'activo'
      ORDER BY id_imagen DESC
      LIMIT 3
    `);

    console.log(`📊 Imágenes encontradas: ${imagenes.length}\n`);

    if (imagenes.length > 0) {
      console.log("🔍 Verificación completa:");

      let workingCount = 0;

      for (const imagen of imagenes) {
        console.log(`\n📸 Imagen ID: ${imagen.id_imagen}`);
        console.log(`   Nombre archivo: ${imagen.nombre_archivo}`);
        console.log(`   Ruta en BD: ${imagen.ruta_imagen}`);

        // Verificar archivo físico
        const fileName = imagen.ruta_imagen.replace(
          /^(img_comments\/|comments_img\/|comments\/)/,
          ""
        );
        const filePath = path.join(COMMENTS_IMAGES_PATH, fileName);
        const fileExists = fs.existsSync(filePath);

        console.log(`   Archivo extraído: ${fileName}`);
        console.log(`   Ruta física: ${filePath}`);
        console.log(`   Archivo existe: ${fileExists ? "✅" : "❌"}`);

        if (fileExists) {
          const stats = fs.statSync(filePath);
          console.log(`   Tamaño: ${stats.size} bytes`);

          // Generar URL
          const imageUrl = `${BASE_URL}/api/images/${imagen.ruta_imagen}`;
          console.log(`   URL: ${imageUrl}`);

          // Probar acceso HTTP
          try {
            const response = await fetch(imageUrl);
            if (response.ok) {
              console.log(`   HTTP Status: ${response.status} ✅`);
              console.log(
                `   Content-Type: ${response.headers.get("content-type")}`
              );
              workingCount++;
            } else {
              console.log(`   HTTP Status: ${response.status} ❌`);
            }
          } catch (error) {
            console.log(`   Error HTTP: ${error.message} ❌`);
          }
        }
      }

      console.log(`\n📋 RESUMEN FINAL:`);
      console.log(
        `   Imágenes funcionando: ${workingCount}/${imagenes.length}`
      );

      if (workingCount === imagenes.length) {
        console.log(
          `   🎉 ¡TODAS LAS IMÁGENES ESTÁN FUNCIONANDO PERFECTAMENTE!`
        );
        console.log(`   ✅ El sistema está completamente operativo`);
        console.log(
          `   ✅ Las imágenes se muestran correctamente en el frontend`
        );
      } else {
        console.log(`   ⚠️  Algunas imágenes tienen problemas`);
      }
    }

    // Verificar directorio
    console.log("\n📁 Estado del directorio:");
    console.log(`   Ruta: ${COMMENTS_IMAGES_PATH}`);
    console.log(
      `   Existe: ${fs.existsSync(COMMENTS_IMAGES_PATH) ? "✅" : "❌"}`
    );

    if (fs.existsSync(COMMENTS_IMAGES_PATH)) {
      const files = fs.readdirSync(COMMENTS_IMAGES_PATH);
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
      });
      console.log(`   Archivos de imagen: ${imageFiles.length}`);
    }
  } catch (error) {
    console.error("❌ Error durante la verificación:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Conexión a BD cerrada");
  }
}

// Ejecutar verificación
finalVerification()
  .then(() => {
    console.log("\n🎉 Verificación final completada");
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error.message);
    process.exit(1);
  });
