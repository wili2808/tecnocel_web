import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: "../.env" });

// Configuración de la base de datos
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "db_tecnocel_v4",
};

async function main() {
  let connection;

  try {
    console.log("🚀 ACTIVANDO OFERTAS AHORA");
    console.log("═".repeat(50));

    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Conectado a la base de datos");

    // Mostrar fecha actual del servidor
    const [currentTime] = await connection.execute(
      "SELECT NOW() as currentTime"
    );
    console.log(`📅 Fecha del servidor: ${currentTime[0].currentTime}`);

    // Activar todas las ofertas AHORA
    console.log("\n🔄 Activando ofertas...");

    // Black Friday - activa desde hace 1 hora hasta 7 días
    await connection.execute(`
      UPDATE tb_ofertas 
      SET fecha_inicio = DATE_SUB(NOW(), INTERVAL 1 HOUR), 
          fecha_fin = DATE_ADD(NOW(), INTERVAL 7 DAY)
      WHERE id_oferta = 1
    `);
    console.log("🔥 Black Friday 2025 - ACTIVA (7 días)");

    // Liquidación - activa desde hace 30 min hasta 30 días
    await connection.execute(`
      UPDATE tb_ofertas 
      SET fecha_inicio = DATE_SUB(NOW(), INTERVAL 30 MINUTE), 
          fecha_fin = DATE_ADD(NOW(), INTERVAL 30 DAY)
      WHERE id_oferta = 2
    `);
    console.log("🔥 Liquidación Smartphones - ACTIVA (30 días)");

    // Gaming - activa desde hace 15 min hasta 14 días
    await connection.execute(`
      UPDATE tb_ofertas 
      SET fecha_inicio = DATE_SUB(NOW(), INTERVAL 15 MINUTE), 
          fecha_fin = DATE_ADD(NOW(), INTERVAL 14 DAY)
      WHERE id_oferta = 3
    `);
    console.log("🔥 Descuento Gaming - ACTIVA (14 días)");

    // Verificar ofertas activas
    const [activasCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM tb_ofertas 
      WHERE fecha_inicio <= NOW() AND fecha_fin >= NOW() AND activo = 1
    `);

    console.log("\n═".repeat(50));
    console.log(`✅ OFERTAS ACTIVAS: ${activasCount[0].count}`);
    console.log("🌐 ¡Recarga la página de ofertas en el frontend!");
    console.log("═".repeat(50));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
