/**
 * Configuración y conexión a la base de datos MySQL
 * Este archivo maneja la conexión a la base de datos y la inicialización de datos básicos
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración de la conexión a la base de datos MySQL
 * Se utilizan variables de entorno con valores por defecto
 */
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'tecnocel_db_v2',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql',
  // Configuración de logging para desarrollo
  logging: (msg) => {
    if (process.env.NODE_ENV === 'development') {
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
      logger.info('Iniciando creación de datos de ejemplo...');
      
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

      logger.info('Datos de ejemplo creados exitosamente');
    } else {
      logger.info('Datos de ejemplo ya existen en la base de datos');
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
    logger.info('Conexión a la base de datos establecida correctamente');
    
    // Sincronizar modelos con la base de datos
    await sequelize.sync();
    logger.info('Modelos sincronizados con la base de datos');
    
    // Crear datos iniciales si es necesario
    await createInitialData();
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

export default sequelize;
