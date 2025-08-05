import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import almacenRoutes from './routes/almacenRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import carritoRoutes from './routes/carritoRoutes.js';
import comentarioRoutes from './routes/comentarioRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { initDatabase } from './config/database.js';
import { config } from './config/config.js';
import logger from './utils/logger.js';
import { initializeImageService } from './services/imageService.js';
import StaticImageMiddleware from './middleware/staticImageMiddleware.js';
import './models/index.js';

// Configurar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Configurar middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging de requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log al final de la request
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, `API Request`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent')?.substring(0, 100),
      ip: req.ip || req.connection.remoteAddress
    });
  });
  
  next();
});

// Configurar servicio de imágenes usando la configuración centralizada
const IMAGES_PATH = config.images.imagesPath;
const COMMENTS_IMAGES_PATH = config.images.commentsImagesPath;
const BASE_URL = config.images.baseUrl;
const DEFAULT_IMAGE = config.images.defaultImage;

logger.info('Inicializando servicio de imágenes', {
  imagesPath: IMAGES_PATH,
  commentsImagesPath: COMMENTS_IMAGES_PATH,
  baseUrl: BASE_URL
});

// Configurar middleware de imágenes estáticas
const imageMiddleware = new StaticImageMiddleware({
  imagesPath: IMAGES_PATH,
  commentsImagesPath: COMMENTS_IMAGES_PATH,
  defaultImage: DEFAULT_IMAGE,
  maxAge: 86400 // 24 horas de cache
});

// Validar que el directorio de imágenes existe antes de inicializar el servicio
let imageServiceInitialized = false;
if (imageMiddleware.validateImagesDirectory()) {
  // Inicializar servicio de imágenes solo si el directorio es válido
  const imageService = initializeImageService({
    baseUrl: BASE_URL,
    imagesPath: IMAGES_PATH,
    defaultImage: DEFAULT_IMAGE,
    endpoint: '/api/images'
  });
  imageServiceInitialized = true;
  logger.info('Servicio de imágenes inicializado exitosamente');
} else {
  logger.warn('El directorio de imágenes no está disponible. El servicio de imágenes no se inicializará.');
}

// Configurar puerto
const PORT = process.env.PORT || 3000;

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API de MacWil Web funcionando correctamente' });
});

// Ruta para servir imágenes estáticas
app.get('/api/images/*', imageMiddleware.serveImage);

// Ruta de diagnóstico para verificar el estado del servicio de imágenes
app.get('/api/images-status', (req: Request, res: Response) => {
  res.json({
    service_initialized: imageServiceInitialized,
    images_path: IMAGES_PATH,
    directory_exists: imageMiddleware.validateImagesDirectory(),
    base_url: BASE_URL,
    default_image: DEFAULT_IMAGE
  });
});

// Rutas de almacén
app.use('/api/almacen', almacenRoutes);

// Rutas de clientes
app.use('/api/clientes', clienteRoutes);

// Rutas de carrito
app.use('/api/carrito', carritoRoutes);

// Rutas de comentarios
app.use('/api/comentarios', comentarioRoutes);

// Rutas de uploads
app.use('/api/upload', uploadRoutes);

// Manejo de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error no manejado en la aplicación', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicializar base de datos y servidor
const startServer = async () => {
  try {
    logger.info('Iniciando servidor...', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    });
    
    await initDatabase();
    
    app.listen(PORT, () => {
      logger.info('Servidor iniciado exitosamente', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    logger.error('Error crítico al iniciar el servidor', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
};

startServer();

export default app;