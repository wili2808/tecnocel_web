import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import logger from "./logger.js";

// Configurar dotenv para cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Intentar cargar .env desde diferentes ubicaciones
const envPaths = [
  join(__dirname, "../.env"),
  join(__dirname, "../../.env"),
  join(__dirname, "../../../.env"),
];

let envLoaded = false;
for (const path of envPaths) {
  const result = dotenv.config({ path });
  if (result.error === undefined) {
    envLoaded = true;
    logger.debug(`Variables de entorno cargadas desde: ${path}`);
    break;
  }
}

if (!envLoaded) {
  logger.warn("No se encontró archivo .env, usando configuración por defecto");
}

// Configuración de la base de datos con valores por defecto
const dbConfig = {
  name: process.env.DB_NAME || "tecnocel_db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  host: process.env.DB_HOST || "localhost",
  dialect: "mysql",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// Crear instancia de Sequelize
const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
  }
);

// Verificar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info("Conexión a la base de datos establecida correctamente");
    return true;
  } catch (error) {
    logger.error("Error al conectar con la base de datos:", error);
    return false;
  }
}

export { testConnection };
export default sequelize;
