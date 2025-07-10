import dotenv from 'dotenv';
dotenv.config();
export const config = {
    database: {
        name: process.env.DB_NAME || 'db_tecnocel_v1',
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
    }
};
//# sourceMappingURL=config.js.map