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

console.log("✅ Verificación final de imágenes de comentarios...\n");

async function verifyCommentsImagesFix() {
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
      LIMIT 5
    `);

    console.log(`📊 Imágenes encontradas: ${imagenes.length}\n`);

    if (imagenes.length > 0) {
      console.log("🔍 Verificación de rutas y URLs:");

      imagenes.forEach((imagen, index) => {
        console.log(`\n${index + 1}. ID: ${imagen.id_imagen}`);
        console.log(`   Nombre archivo: ${imagen.nombre_archivo}`);
        console.log(`   Ruta en BD: ${imagen.ruta_imagen}`);

        // Simular la lógica del middleware corregida
        const fileName = imagen.ruta_imagen.replace(
          /^(img_comments\/|comments_img\/|comments\/)/,
          ""
        );
        const filePath = path.join(COMMENTS_IMAGES_PATH, fileName);
        const fileExists = fs.existsSync(filePath);

        // Generar URL
        const imageUrl = `${BASE_URL}/api/images/${imagen.ruta_imagen}`;

        console.log(`   Archivo extraído: ${fileName}`);
        console.log(`   Ruta construida: ${filePath}`);
        console.log(`   Archivo existe: ${fileExists ? "✅" : "❌"}`);
        console.log(`   URL generada: ${imageUrl}`);

        if (fileExists) {
          console.log(`   ✅ LISTO PARA MOSTRAR EN FRONTEND`);
        } else {
          console.log(`   ❌ PROBLEMA: Archivo no encontrado`);
        }
      });
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

    // Resumen
    console.log("\n📋 Resumen:");
    const workingImages = imagenes.filter((imagen) => {
      const fileName = imagen.ruta_imagen.replace(
        /^(img_comments\/|comments_img\/|comments\/)/,
        ""
      );
      const filePath = path.join(COMMENTS_IMAGES_PATH, fileName);
      return fs.existsSync(filePath);
    });

    console.log(
      `   Imágenes funcionando: ${workingImages.length}/${imagenes.length}`
    );

    if (workingImages.length === imagenes.length) {
      console.log("   🎉 ¡TODAS LAS IMÁGENES ESTÁN FUNCIONANDO!");
    } else {
      console.log("   ⚠️  Algunas imágenes tienen problemas");
    }
  } catch (error) {
    console.error("❌ Error durante la verificación:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Conexión a BD cerrada");
  }
}

// Ejecutar verificación
verifyCommentsImagesFix()
  .then(() => {
    console.log("\n🎉 Verificación completada");
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error.message);
    process.exit(1);
  });
