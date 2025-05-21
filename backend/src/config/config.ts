import dotenv from 'dotenv';

dotenv.config();

export const config = {
  database: {
    name: process.env.DB_NAME || 'macwil_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '6186365074',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres'
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
  }
};