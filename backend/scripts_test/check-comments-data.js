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
  database: process.env.DB_NAME || "db_tecnocel_v3",
  logging: false,
});

console.log("🔍 Verificando datos de comentarios...\n");

async function checkCommentsData() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a BD establecida");

    // Verificar comentarios
    console.log("1️⃣ Verificando tabla de comentarios...");
    const [comentarios] = await sequelize.query(`
      SELECT id_comentario, id_producto, comentario, estado, fyh_creacion
      FROM tb_comentarios_productos 
      WHERE estado = 'activo'
      ORDER BY id_comentario DESC
      LIMIT 5
    `);

    console.log(`   Comentarios encontrados: ${comentarios.length}`);
    if (comentarios.length > 0) {
      comentarios.forEach((comentario, index) => {
        console.log(
          `   ${index + 1}. ID: ${comentario.id_comentario}, Producto: ${
            comentario.id_producto
          }, Estado: ${comentario.estado}`
        );
      });
    }

    // Verificar imágenes de comentarios
    console.log("\n2️⃣ Verificando tabla de imágenes de comentarios...");
    const [imagenes] = await sequelize.query(`
      SELECT id_imagen, id_comentario, nombre_archivo, ruta_imagen, estado
      FROM tb_comentario_imagenes 
      WHERE estado = 'activo'
      ORDER BY id_imagen DESC
      LIMIT 10
    `);

    console.log(`   Imágenes encontradas: ${imagenes.length}`);
    if (imagenes.length > 0) {
      imagenes.forEach((imagen, index) => {
        console.log(
          `   ${index + 1}. ID: ${imagen.id_imagen}, Comentario: ${
            imagen.id_comentario
          }, Ruta: ${imagen.ruta_imagen}, Archivo: ${imagen.nombre_archivo}`
        );
      });
    }

    // Verificar comentarios con imágenes
    console.log("\n3️⃣ Verificando comentarios con imágenes...");
    const [comentariosConImagenes] = await sequelize.query(`
      SELECT c.id_comentario, c.id_producto, c.comentario, COUNT(ci.id_imagen) as num_imagenes
      FROM tb_comentarios_productos c
      LEFT JOIN tb_comentario_imagenes ci ON c.id_comentario = ci.id_comentario AND ci.estado = 'activo'
      WHERE c.estado = 'activo'
      GROUP BY c.id_comentario
      HAVING num_imagenes > 0
      ORDER BY c.id_comentario DESC
      LIMIT 5
    `);

    console.log(
      `   Comentarios con imágenes: ${comentariosConImagenes.length}`
    );
    if (comentariosConImagenes.length > 0) {
      comentariosConImagenes.forEach((comentario, index) => {
        console.log(
          `   ${index + 1}. ID: ${comentario.id_comentario}, Producto: ${
            comentario.id_producto
          }, Imágenes: ${comentario.num_imagenes}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error durante la verificación:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Conexión a BD cerrada");
  }
}

// Ejecutar verificación
checkCommentsData()
  .then(() => {
    console.log("\n🎉 Verificación completada");
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error.message);
    process.exit(1);
  });
