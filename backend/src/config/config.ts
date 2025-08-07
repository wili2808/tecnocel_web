import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const XAMPP_BASE = process.env.IMAGES_PATH || 'C:/xampp/htdocs/tecnocel';

export const config = {
  database: {
    name: process.env.DB_NAME || 'db_tecnocel_v3',
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
    imagesPath: XAMPP_BASE,
    baseUrl: process.env.BASE_URL || 'http://localhost',
    endpoint: process.env.IMAGES_ENDPOINT || '',
    defaultImage: process.env.DEFAULT_IMAGE || 'default-product.png'
  }
};