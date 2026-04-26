import { Router } from 'express';
import UploadController from '../controllers/UploadController.js';
import { verificarTokenCliente, verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Configurar multer para múltiples archivos
const upload = UploadController.getMulterConfig();

// Configurar multer para logo de marca
const uploadMarca = UploadController.getMarcaMulterConfig();

// Ruta para subir imágenes de comentarios
/**
 * @swagger
 * /uploads/comment-images:
 *   post:
 *     summary: Subir imágenes para comentario
 *     tags: [Uploads]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Imágenes subidas
 */
router.post('/comment-images',
  verificarTokenCliente, // Verificar que el usuario esté autenticado
  upload.array('imagenes', 5), // Máximo 5 imágenes
  UploadController.uploadCommentImages
);

// Ruta para subir imágenes de productos
/**
 * @swagger
 * /uploads/product-images:
 *   post:
 *     summary: Subir imágenes para producto
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Imágenes subidas
 */
router.post('/product-images',
  verificarToken,
  upload.array('imagenes', 10), // Máximo 10 imágenes
  UploadController.uploadProductImages
);

// Ruta para obtener información de directorios
/**
 * @swagger
 * /uploads/directories-info:
 *   get:
 *     summary: Obtener información de directorios
 *     tags: [Uploads]
 *     responses:
 *       200:
 *         description: Información de directorios
 */
router.get('/directories-info',
  UploadController.getDirectoriesInfo
);

// Ruta para subir logo de marca
/**
 * @swagger
 * /uploads/marca-logo/{id_marca}:
 *   post:
 *     summary: Subir logo para marca
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_marca
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logo subido
 */
router.post('/marca-logo/:id_marca',
  verificarToken,
  uploadMarca.single('logo'),
  UploadController.uploadMarcaLogo
);

export default router;
