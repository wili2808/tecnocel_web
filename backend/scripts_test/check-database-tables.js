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

console.log("🔍 Verificando tablas de la base de datos...\n");

async function checkDatabaseTables() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a BD establecida");

    // Obtener todas las tablas
    const [results] = await sequelize.query(`
      SHOW TABLES
    `);

    console.log(`📊 Tablas encontradas: ${results.length}`);
    console.log("Lista de tablas:");
    results.forEach((row, index) => {
      const tableName = Object.values(row)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });

    // Buscar tablas relacionadas con comentarios
    console.log("\n🔍 Buscando tablas relacionadas con comentarios...");
    const commentTables = results.filter((row) => {
      const tableName = Object.values(row)[0];
      return (
        tableName.toLowerCase().includes("comentario") ||
        tableName.toLowerCase().includes("comment") ||
        tableName.toLowerCase().includes("imagen")
      );
    });

    if (commentTables.length > 0) {
      console.log("Tablas relacionadas encontradas:");
      commentTables.forEach((row, index) => {
        const tableName = Object.values(row)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    } else {
      console.log("❌ No se encontraron tablas relacionadas con comentarios");
    }

    // Verificar estructura de una tabla específica si existe
    const targetTable = "comentario_imagenes";
    console.log(`\n🔍 Verificando estructura de la tabla '${targetTable}'...`);

    try {
      const [columns] = await sequelize.query(`
        DESCRIBE ${targetTable}
      `);

      console.log(`✅ Tabla '${targetTable}' existe`);
      console.log("Estructura:");
      columns.forEach((column, index) => {
        console.log(
          `   ${index + 1}. ${column.Field} - ${column.Type} - ${
            column.Null === "YES" ? "NULL" : "NOT NULL"
          }`
        );
      });
    } catch (error) {
      console.log(`❌ Tabla '${targetTable}' no existe`);
      console.log(`   Error: ${error.message}`);
    }
  } catch (error) {
    console.error("❌ Error durante la verificación:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Conexión a BD cerrada");
  }
}

// Ejecutar verificación
checkDatabaseTables()
  .then(() => {
    console.log("\n🎉 Verificación completada");
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error.message);
    process.exit(1);
  });
