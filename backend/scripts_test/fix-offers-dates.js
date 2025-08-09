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

async function conectarBaseDatos() {
  try {
    console.log("🔄 Conectando a la base de datos...");
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Conexión establecida exitosamente");
    return connection;
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error.message);
    throw error;
  }
}

async function actualizarFechasOfertas(connection) {
  try {
    console.log("🔄 Actualizando fechas de ofertas...");

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Actualizar Black Friday para que esté activa ahora
    await connection.execute(
      `UPDATE tb_ofertas 
       SET fecha_inicio = ?, fecha_fin = ?, fyh_actualizacion = NOW()
       WHERE id_oferta = 1`,
      [
        now.toISOString().slice(0, 19).replace("T", " "),
        nextWeek.toISOString().slice(0, 19).replace("T", " "),
      ]
    );
    console.log("✅ Black Friday 2025 actualizada: ACTIVA por 7 días");

    // Actualizar Liquidación Smartphones para que esté activa desde mañana
    await connection.execute(
      `UPDATE tb_ofertas 
       SET fecha_inicio = ?, fecha_fin = ?, fyh_actualizacion = NOW()
       WHERE id_oferta = 2`,
      [
        tomorrow.toISOString().slice(0, 19).replace("T", " "),
        nextMonth.toISOString().slice(0, 19).replace("T", " "),
      ]
    );
    console.log(
      "✅ Liquidación Smartphones actualizada: ACTIVA desde mañana por 1 mes"
    );

    // Actualizar Descuento Gaming para que esté activa ahora
    const inTwoWeeks = new Date(now);
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

    await connection.execute(
      `UPDATE tb_ofertas 
       SET fecha_inicio = ?, fecha_fin = ?, fyh_actualizacion = NOW()
       WHERE id_oferta = 3`,
      [
        now.toISOString().slice(0, 19).replace("T", " "),
        inTwoWeeks.toISOString().slice(0, 19).replace("T", " "),
      ]
    );
    console.log("✅ Descuento Gaming actualizado: ACTIVA por 2 semanas");
  } catch (error) {
    console.error("❌ Error actualizando fechas:", error.message);
  }
}

async function mostrarOfertasActualizadas(connection) {
  try {
    console.log("\n📊 OFERTAS DESPUÉS DE LA ACTUALIZACIÓN:");
    console.log("═".repeat(60));

    const [ofertas] = await connection.execute(`
      SELECT 
        id_oferta,
        nombre_oferta,
        tipo_descuento,
        valor_descuento,
        fecha_inicio,
        fecha_fin,
        activo,
        (fecha_inicio <= NOW() AND fecha_fin >= NOW() AND activo = 1) as esta_activa
      FROM tb_ofertas
      ORDER BY id_oferta
    `);

    ofertas.forEach((oferta) => {
      const descuento =
        oferta.tipo_descuento === "porcentaje"
          ? `${oferta.valor_descuento}%`
          : `$${oferta.valor_descuento}`;

      const fechaInicio = new Date(oferta.fecha_inicio).toLocaleString("es-AR");
      const fechaFin = new Date(oferta.fecha_fin).toLocaleString("es-AR");
      const estado = oferta.esta_activa
        ? "🔥 ACTIVA"
        : "⏰ Programada/Expirada";

      console.log(`\n🏷️  ${oferta.nombre_oferta}`);
      console.log(`   💰 Descuento: ${descuento}`);
      console.log(`   📅 Inicio: ${fechaInicio}`);
      console.log(`   📅 Fin: ${fechaFin}`);
      console.log(`   📍 Estado: ${estado}`);
    });

    const [activasCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM tb_ofertas 
      WHERE fecha_inicio <= NOW() AND fecha_fin >= NOW() AND activo = 1
    `);

    console.log("\n═".repeat(60));
    console.log(`🔥 Total ofertas activas ahora: ${activasCount[0].count}`);
    console.log("═".repeat(60));
  } catch (error) {
    console.error("❌ Error mostrando ofertas:", error.message);
  }
}

async function main() {
  let connection;

  try {
    console.log("🚀 ACTUALIZANDO FECHAS DE OFERTAS");
    console.log("═".repeat(60));

    // Conectar a la base de datos
    connection = await conectarBaseDatos();

    // Actualizar fechas
    await actualizarFechasOfertas(connection);

    // Mostrar resultado
    await mostrarOfertasActualizadas(connection);

    console.log("\n✅ ¡Fechas de ofertas actualizadas exitosamente!");
    console.log("🌐 Ahora puedes recargar la página de ofertas en el frontend");
  } catch (error) {
    console.error("\n❌ Error durante la ejecución:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Conexión cerrada");
    }
  }
}

// Ejecutar el script
main();
