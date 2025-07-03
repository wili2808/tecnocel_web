import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import almacenRoutes from './routes/almacenRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import { initDatabase } from './config/database.js';
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

// Configurar servicio de imágenes
const IMAGES_PATH = process.env.IMAGES_PATH || path.join(process.cwd(), '../htdocs');
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const DEFAULT_IMAGE = process.env.DEFAULT_IMAGE || 'default-product.png';

logger.info(`Configurando servicio de imágenes con ruta: ${IMAGES_PATH}`);

// Configurar middleware de imágenes estáticas
const imageMiddleware = new StaticImageMiddleware({
  imagesPath: IMAGES_PATH,
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
app.get('/api/images/:filename', imageMiddleware.serveImage);

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

// Manejo de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error no manejado:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicializar base de datos y servidor
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;