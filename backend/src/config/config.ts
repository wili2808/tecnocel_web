import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Configuración de rutas de imágenes
const IMAGES_BASE_PATH = process.env.IMAGES_BASE_PATH || 'C:/xampp/htdocs/tecnocel';
const PRODUCT_IMAGES_PATH = process.env.PRODUCT_IMAGES_PATH || path.join(IMAGES_BASE_PATH, 'products');
const COMMENT_IMAGES_PATH = process.env.COMMENT_IMAGES_PATH || path.join(IMAGES_BASE_PATH, 'comments');

export const config = {
  database: {
    name: process.env.DB_NAME || 'db_tecnocel_v4',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql'
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_clave_secreta_aqui',
    expiresIn: '24h'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFileSize: 5242880, // 5MB
    maxFiles: 5
  },
  images: {
    // Configuración general
    baseUrl: process.env.BASE_URL || 'http://localhost',
    endpoint: process.env.IMAGES_ENDPOINT || '',
    
    // Rutas de directorios
    basePath: IMAGES_BASE_PATH,
    productImagesPath: PRODUCT_IMAGES_PATH,
    commentImagesPath: COMMENT_IMAGES_PATH,
    
    // Imágenes por defecto
    defaultProductImage: process.env.DEFAULT_PRODUCT_IMAGE || 'default-product.png',
    defaultCommentImage: process.env.DEFAULT_COMMENT_IMAGE || 'default-comment.png'
  }
};