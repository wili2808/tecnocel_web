import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_tecnocel_v4",
  logging: false,
});

async function debugProductImages() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida");

    // Verificar productos en oferta
    const [productosEnOferta] = await sequelize.query(`
      SELECT DISTINCT a.id_producto, a.nombre, a.imagen
      FROM tb_almacen a
      INNER JOIN tb_productos_ofertas po ON a.id_producto = po.id_producto
      INNER JOIN tb_ofertas o ON po.id_oferta = o.id_oferta
      WHERE o.activo = 1 
      AND o.fecha_inicio <= NOW() 
      AND o.fecha_fin >= NOW()
      LIMIT 5
    `);

    console.log("\n📦 Productos en oferta:");
    console.log(productosEnOferta);

    // Verificar imágenes de productos
    for (const producto of productosEnOferta) {
      console.log(
        `\n🔍 Verificando imágenes para producto ${producto.id_producto} (${producto.nombre}):`
      );

      const [imagenes] = await sequelize.query(
        `
        SELECT * FROM tb_producto_imagenes 
        WHERE id_producto = ? 
        ORDER BY es_principal DESC, orden ASC
      `,
        {
          replacements: [producto.id_producto],
        }
      );

      console.log("   Imágenes encontradas:", imagenes.length);
      if (imagenes.length > 0) {
        console.log("   Primera imagen:", imagenes[0]);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sequelize.close();
  }
}

debugProductImages();
