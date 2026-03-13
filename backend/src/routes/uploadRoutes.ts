import express from 'express';
import UploadController from '../controllers/UploadController.js';
import { verificarTokenCliente, verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

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
  upload.array('imagenes', 10), // Máximo 10 imágenes
  UploadController.uploadProductImages
);

// Ruta para obtener información de directorios
router.get('/directories-info',
  UploadController.getDirectoriesInfo
);

// Ruta para subir logo de marca (solo admin)
router.post('/marca-logo/:id_marca',
  verificarToken,
  verificarRol([ROLES.ADMIN]),
  uploadMarca.single('logo'),
  UploadController.uploadMarcaLogo
);

export default router;