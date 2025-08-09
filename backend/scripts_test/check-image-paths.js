import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Cargar variables de entorno
dotenv.config();

const COMMENTS_IMAGES_PATH =
  process.env.COMMENTS_IMAGES_PATH || "C:/xampp/htdocs/tecnocel/img_comments";

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

console.log("🔍 Verificando rutas de imágenes...\n");

async function checkImagePaths() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a BD establecida");

    // Obtener todas las imágenes
    const [imagenes] = await sequelize.query(`
      SELECT id_imagen, nombre_archivo, ruta_imagen, estado
      FROM tb_comentario_imagenes 
      WHERE estado = 'activo'
      ORDER BY id_imagen DESC
    `);

    console.log(`📊 Imágenes encontradas: ${imagenes.length}\n`);

    if (imagenes.length > 0) {
      console.log("🔍 Análisis de rutas:");

      imagenes.forEach((imagen, index) => {
        console.log(`\n${index + 1}. ID: ${imagen.id_imagen}`);
        console.log(`   Nombre archivo: ${imagen.nombre_archivo}`);
        console.log(`   Ruta en BD: ${imagen.ruta_imagen}`);

        // Verificar diferentes combinaciones de rutas
        const rutas = [
          // Ruta actual (incorrecta)
          path.join(COMMENTS_IMAGES_PATH, imagen.ruta_imagen),
          // Ruta corregida (solo el nombre del archivo)
          path.join(COMMENTS_IMAGES_PATH, imagen.nombre_archivo),
          // Ruta con prefijo img_comments
          path.join(
            COMMENTS_IMAGES_PATH,
            `img_comments/${imagen.nombre_archivo}`
          ),
          // Ruta con prefijo comments_img
          path.join(
            COMMENTS_IMAGES_PATH,
            `comments_img/${imagen.nombre_archivo}`
          ),
        ];

        console.log("   Verificando rutas:");
        rutas.forEach((ruta, rutaIndex) => {
          const existe = fs.existsSync(ruta);
          console.log(`     ${rutaIndex + 1}. ${existe ? "✅" : "❌"} ${ruta}`);
        });
      });
    }

    // Verificar archivos en el directorio
    console.log("\n📁 Archivos en el directorio de imágenes:");
    if (fs.existsSync(COMMENTS_IMAGES_PATH)) {
      const files = fs.readdirSync(COMMENTS_IMAGES_PATH);
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
      });

      console.log(`   Total de archivos: ${imageFiles.length}`);
      if (imageFiles.length > 0) {
        console.log("   Lista de archivos:");
        imageFiles.forEach((file, index) => {
          console.log(`     ${index + 1}. ${file}`);
        });
      }
    }
  } catch (error) {
    console.error("❌ Error durante la verificación:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Conexión a BD cerrada");
  }
}

// Ejecutar verificación
checkImagePaths()
  .then(() => {
    console.log("\n🎉 Verificación completada");
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error.message);
    process.exit(1);
  });
