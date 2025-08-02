// Script para verificar la estructura de la tabla de clientes
// Ejecutar con: node check-database-structure.js

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tecnocel_db_v2",
  port: process.env.DB_PORT || 3306,
  logging: false,
});

async function checkDatabaseStructure() {
  try {
    console.log("🔍 Verificando estructura de la base de datos...");

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida");

    // Verificar si la tabla existe
    const [results] = await sequelize.query("SHOW TABLES LIKE 'tb_clientes'");
    if (results.length === 0) {
      console.error("❌ La tabla tb_clientes no existe");
      return;
    }
    console.log("✅ La tabla tb_clientes existe");

    // Verificar la estructura de la tabla
    const [columns] = await sequelize.query("DESCRIBE tb_clientes");
    console.log("📋 Estructura de la tabla tb_clientes:");

    const columnNames = columns.map((col) => col.Field);
    console.log("Columnas encontradas:", columnNames);

    // Verificar si google_id existe
    const hasGoogleId = columnNames.includes("google_id");
    if (hasGoogleId) {
      console.log("✅ La columna google_id existe");

      // Verificar el tipo de dato
      const googleIdColumn = columns.find((col) => col.Field === "google_id");
      console.log("📊 Tipo de dato de google_id:", googleIdColumn.Type);
      console.log(
        "📊 ¿Permite NULL?",
        googleIdColumn.Null === "YES" ? "Sí" : "No"
      );
      console.log("📊 ¿Es único?", googleIdColumn.Key === "UNI" ? "Sí" : "No");
    } else {
      console.log("❌ La columna google_id NO existe");
      console.log("💡 Ejecuta el script de migración:");
      console.log("   USE tecnocel_db_v2;");
      console.log(
        "   ALTER TABLE tb_clientes ADD COLUMN google_id VARCHAR(255) NULL;"
      );
      console.log(
        "   ALTER TABLE tb_clientes ADD UNIQUE INDEX idx_google_id (google_id);"
      );
    }

    // Verificar algunos registros existentes
    const [clients] = await sequelize.query(
      "SELECT id_cliente, email_cliente, google_id FROM tb_clientes LIMIT 5"
    );
    console.log("📊 Registros de ejemplo:");
    clients.forEach((client) => {
      console.log(
        `   ID: ${client.id_cliente}, Email: ${
          client.email_cliente
        }, Google ID: ${client.google_id || "NULL"}`
      );
    });
  } catch (error) {
    console.error("❌ Error al verificar la base de datos:", error.message);
  } finally {
    await sequelize.close();
    console.log("🔌 Conexión cerrada");
  }
}

checkDatabaseStructure();
