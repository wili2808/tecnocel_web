import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import almacenRoutes from './routes/almacenRoutes.js';
import { initDatabase } from './config/database.js';
import logger from './utils/logger.js';
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

// Configurar puerto
const PORT = process.env.PORT || 3000;

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API de MacWil Web funcionando correctamente' });
});

// Rutas de almacén
app.use('/api/almacen', almacenRoutes);

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