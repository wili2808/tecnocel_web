import { Router } from 'express';
import UploadController from '../controllers/UploadController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';

const router = Router();

// Configurar multer para uploads
const upload = UploadController.getMulterConfig();

// Rutas para uploads de imágenes de comentarios
router.post('/comment-images', 
  verificarTokenCliente, 
  upload.array('imagenes', 5), // Máximo 5 imágenes con campo 'imagenes'
  UploadController.uploadCommentImages
);

export default router;