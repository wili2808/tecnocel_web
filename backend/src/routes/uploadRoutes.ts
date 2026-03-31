import express from 'express';
import UploadController from '../controllers/UploadController.js';
import { verificarTokenCliente, verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configurar multer para múltiples archivos
const upload = UploadController.getMulterConfig();

// Configurar multer para logo de marca
const uploadMarca = UploadController.getMarcaMulterConfig();

// Ruta para subir imágenes de comentarios
router.post('/comment-images',
  verificarTokenCliente, // Verificar que el usuario esté autenticado
  upload.array('imagenes', 5), // Máximo 5 imágenes
  UploadController.uploadCommentImages
);

// Ruta para subir imágenes de productos
router.post('/product-images',
  verificarToken,
  upload.array('imagenes', 10), // Máximo 10 imágenes
  UploadController.uploadProductImages
);

// Ruta para obtener información de directorios
router.get('/directories-info',
  UploadController.getDirectoriesInfo
);

// Ruta para subir logo de marca
router.post('/marca-logo/:id_marca',
  verificarToken,
  uploadMarca.single('logo'),
  UploadController.uploadMarcaLogo
);

export default router;
