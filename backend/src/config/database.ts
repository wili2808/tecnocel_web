/**
 * Configuración y conexión a la base de datos MySQL
 * Este archivo maneja la conexión a la base de datos y la inicialización de datos básicos
 */

import { Sequelize } from 'sequelize';
import fs from 'fs';
import logger from '../services/loggerService.js';
import { config } from './config.js';

/**
 * Configuración de la conexión a la base de datos MySQL
 * Utiliza la configuración centralizada del archivo config.ts
 */
const sslEnabled = process.env.DB_SSL === 'true';
const sslCaPath = process.env.DB_SSL_CA_PATH;
const sslCa = sslCaPath && fs.existsSync(sslCaPath)
  ? fs.readFileSync(sslCaPath, 'utf-8')
  : undefined;

if (sslEnabled && sslCaPath && !fs.existsSync(sslCaPath)) {
  logger.warn('DB_SSL_CA_PATH definido pero archivo no encontrado. Se intentara SSL sin CA custom.', {
    sslCaPath
  });
}

const sequelize = new Sequelize({
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  host: config.database.host,
  port: config.database.port,
  dialect: 'mysql' as const,
  
  /*
  // Configuración de logging para desarrollo
  logging: (msg) => {
    if (config.server.env === 'development' && process.env.SEQUELIZE_DEBUG === 'true') {
      logger.debug(`[Sequelize] ${msg}`);
    }
  },
  */
  // Configuración SSL para Aiven
  dialectOptions: {
    ssl: sslEnabled ? {
      rejectUnauthorized: true,
      ca: sslCa
    } : undefined
  },
  logging: (msg) => {
    if (config.server.env === 'development' && process.env.SEQUELIZE_DEBUG === 'true') {
      logger.debug(`[Sequelize] ${msg}`);
    }
  },



  // Configuración del pool de conexiones
  pool: {
    max: 5,        // Máximo número de conexiones
    min: 0,        // Mínimo número de conexiones
    acquire: 30000, // Tiempo máximo para adquirir una conexión
    idle: 10000    // Tiempo máximo que una conexión puede estar inactiva
  }
});

/**
 * Función para crear datos iniciales en la base de datos
 * Se ejecuta solo si la base de datos está vacía
 */
const createInitialData = async () => {
  try {
    const { Categoria, Almacen } = sequelize.models;
    const categoriaCount = await Categoria.count();
    if (categoriaCount === 0) {
      logger.info('Creando datos de ejemplo en la base de datos');
      
      // Crear categorías principales del sistema
      const celulares = await Categoria.create({
        nombre_categoria: 'Celulares',
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      const accesorios = await Categoria.create({
        nombre_categoria: 'Accesorios',
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      const repuestos = await Categoria.create({
        nombre_categoria: 'Repuestos',
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      // Crear productos de ejemplo para cada categoría (sin id_usuario)
      await Almacen.bulkCreate([
        {
          codigo: 'CEL001',
          nombre: 'iPhone 13',
          descripcion: 'iPhone 13 128GB Negro',
          stock: 10,
          stock_minimo: 2,
          stock_maximo: 20,
          precio_compra: '800',
          precio_venta: '1000',
          fecha_ingreso: new Date(),
          imagen: null,
          id_categoria: celulares.getDataValue('id_categoria'),
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
        },
        {
          codigo: 'ACC001',
          nombre: 'Cargador USB-C',
          descripcion: 'Cargador rápido USB-C 20W',
          stock: 50,
          stock_minimo: 10,
          stock_maximo: 100,
          precio_compra: '15',
          precio_venta: '25',
          fecha_ingreso: new Date(),
          imagen: null,
          id_categoria: accesorios.getDataValue('id_categoria'),
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
        }
      ]);

      logger.info('Datos de ejemplo creados exitosamente', {
        categorias: 3,
        productos: 2
      });
    } else {
      logger.info('Datos de ejemplo ya existen en la base de datos', {
        categorias_existentes: categoriaCount
      });
    }
  } catch (error) {
    logger.error('Error al crear datos de ejemplo:', error);
  }
};

/**
 * Función para inicializar la conexión a la base de datos
 * - Establece la conexión
 * - Sincroniza los modelos
 * - Crea datos iniciales si es necesario
 */
export const initDatabase = async () => {
  try {
    // Verificar la conexión a la base de datos
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida correctamente', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name
    });

    // NOTA: No sincronizamos modelos porque la base de datos ya fue importada desde SQL
    // await sequelize.sync();
    // logger.info('Modelos sincronizados con la base de datos');

    // NOTA: No creamos datos iniciales porque ya existen en la BD importada
    // await createInitialData();

    logger.info('Base de datos lista para usar (esquema ya importado)');
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

export default sequelize;

