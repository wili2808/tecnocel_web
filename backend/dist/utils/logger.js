import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Singleton pattern para evitar múltiples instancias
let loggerInstance = null;
const createLogger = () => {
    // Si ya existe una instancia, devolverla
    if (loggerInstance) {
        return loggerInstance;
    }
    // Configuración de formatos personalizados
    const customFormat = winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }));
    // Configurar transports según el entorno
    const transports = [
        // Logs de error en archivo separado
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Logs generales
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ];
    // Agregar transport Console solo en desarrollo (solo para esta instancia)
    if (process.env.NODE_ENV !== 'production') {
        transports.push(new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), customFormat)
        }));
    }
    // Crear la instancia del logger
    loggerInstance = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: customFormat,
        transports: transports,
        // Prevenir la propagación a loggers padre
        exitOnError: false
    });
    return loggerInstance;
};
// Exportar la instancia singleton
const logger = createLogger();
export default logger;
//# sourceMappingURL=logger.js.map