import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interfaces para tipar los metadatos
interface LogMetadata {
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: string;
  userAgent?: string;
  [key: string]: any;
}

// Patron Singleton para evitar múltiples instancias
let loggerInstance: winston.Logger | null = null;

const createLogger = (): winston.Logger => {
  // Si ya existe una instancia, devolverla
  if (loggerInstance) {
    return loggerInstance;
  }
  
  // Formato personalizado para logs más limpios
  const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info: any) => {
      const { timestamp, level, message, stack, ...meta } = info;
      const metadata = meta as LogMetadata;
      // Para requests de API
      if (metadata.method && metadata.path) {
        return `${timestamp} | ${metadata.method} ${metadata.path} | Status: ${metadata.statusCode} | ${metadata.duration}`;
      }
      
      // Para logs normales
      let logMessage = `${timestamp} | ${message}`;
      
      // Agregar metadatos relevantes
      if (Object.keys(metadata).length > 0) {
        // Filtrar y limitar userAgent si existe
        if (metadata.userAgent) {
          metadata.userAgent = metadata.userAgent.substring(0, 50) + '...';
        }
        logMessage += ` | ${JSON.stringify(metadata)}`;
      }
      
      // Agregar stack trace para errores en nueva línea
      if (stack) {
        logMessage += `\n${stack}`;
      }
      
      return logMessage;
    })
  );

  // Configurar transports con rotación semanal
  const transports: winston.transport[] = [
    // Logs de error
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 7,
      format: customFormat,
      tailable: true
    }),
    // Logs de API y operaciones
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/api.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 7,
      format: customFormat,
      tailable: true
    })
  ];

  // Agregar transport Console solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          // Para requests de API en consola
          if (meta.method && meta.path) {
            return `${timestamp} ${level} | ${meta.method} ${meta.path} | Status: ${meta.statusCode} | ${meta.duration}`;
          }
          
          // Para logs normales en consola
          let logMessage = `${timestamp} ${level} | ${message}`;
          if (Object.keys(meta).length > 0) {
            // Omitir userAgent en consola para mayor claridad
            const { userAgent, ...relevantMeta } = meta;
            if (Object.keys(relevantMeta).length > 0) {
              logMessage += ` | ${JSON.stringify(relevantMeta)}`;
            }
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
