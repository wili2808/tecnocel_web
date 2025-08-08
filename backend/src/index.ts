import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import almacenRoutes from './routes/almacenRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import carritoRoutes from './routes/carritoRoutes.js';
import comentarioRoutes from './routes/comentarioRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
// Nuevas rutas
import marcaRoutes from './routes/marcaRoutes.js';
import caracteristicaRoutes from './routes/caracteristicaRoutes.js';
import ofertaRoutes from './routes/ofertaRoutes.js';
import favoritoRoutes from './routes/favoritoRoutes.js';
import direccionRoutes from './routes/direccionRoutes.js';
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
const { 
  basePath, 
  productImagesPath, 
  commentImagesPath, 
  baseUrl, 
  endpoint, 
  defaultProductImage, 
  defaultCommentImage 
} = config.images;

logger.info('Inicializando servicio de imágenes', {
  basePath,
  productImagesPath,
  commentImagesPath,
  baseUrl,
  endpoint
});

// Configurar middleware de imágenes estáticas
const imageMiddleware = new StaticImageMiddleware({
  basePath,
  productImagesPath,
  commentImagesPath,
  defaultProductImage,
  defaultCommentImage,
  maxAge: 86400, // 24 horas de cache
  endpoint
});

// Validar que los directorios de imágenes existen antes de inicializar el servicio
let imageServiceInitialized = false;
if (imageMiddleware.validateImagesDirectory()) {
  // Inicializar servicio de imágenes solo si los directorios son válidos
  const imageService = initializeImageService({
    baseUrl,
    basePath,
    productImagesPath,
    commentImagesPath,
    defaultProductImage,
    defaultCommentImage,
    endpoint
  });
  imageServiceInitialized = true;
  logger.info('Servicio de imágenes inicializado exitosamente');
} else {
  logger.warn('Los directorios de imágenes no están disponibles. El servicio de imágenes no se inicializará.');
}

// Configurar puerto
const PORT = process.env.PORT || 3000;

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API de TecnoCel Web funcionando correctamente' });
});

// Rutas para servir imágenes estáticas
app.get('/api/images/*', imageMiddleware.serveProductImage);
app.get('/api/comment-images/*', imageMiddleware.serveCommentImage);

// Ruta de diagnóstico para verificar el estado del servicio de imágenes
app.get('/api/images-status', (req: Request, res: Response) => {
  const directoriesInfo = imageMiddleware.getDirectoriesInfo();
  
  res.json({
    service_initialized: imageServiceInitialized,
    directories: directoriesInfo,
    base_url: baseUrl,
    endpoint: endpoint,
    default_product_image: defaultProductImage,
    default_comment_image: defaultCommentImage
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

// Nuevas rutas
app.use('/api/marcas', marcaRoutes);
app.use('/api/caracteristicas', caracteristicaRoutes);
app.use('/api/ofertas', ofertaRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/direcciones', direccionRoutes);

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