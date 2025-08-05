import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Singleton pattern para evitar múltiples instancias
let loggerInstance: winston.Logger | null = null;

const createLogger = (): winston.Logger => {
  // Si ya existe una instancia, devolverla
  if (loggerInstance) {
    return loggerInstance;
  }

  // Configuración de formatos personalizados mejorada
  const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      // Agregar metadatos si existen
      if (Object.keys(meta).length > 0) {
        logMessage += ` | ${JSON.stringify(meta)}`;
      }
      
      // Agregar stack trace para errores
      if (stack) {
        logMessage += `\n${stack}`;
      }
      
      return logMessage;
    })
  );

  // Configurar transports según el entorno
  const transports: winston.transport[] = [
    // Logs de error en archivo separado
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: customFormat
    }),
    // Logs generales
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: customFormat
    })
  ];

  // Agregar transport Console solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let logMessage = `${timestamp} ${level}: ${message}`;
          if (Object.keys(meta).length > 0) {
            logMessage += ` | ${JSON.stringify(meta)}`;
          }
          return logMessage;
        })
      )
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