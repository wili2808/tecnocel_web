import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import logger from '../services/loggerService.js';
import { config } from '../config/config.js';
import { ImageType } from '../services/imageService.js';

/**
 * Archivo subido por Multer extendido con buffer
 */
interface UploadedFile extends Express.Multer.File {
  buffer: Buffer;
}

/**
 * Imagen procesada lista para almacenar en BD
 */
interface ProcessedImage {
  url_imagen: string;
  alt_text: string;
}

/**
 * Controlador para gestión de subida y procesamiento de imágenes
 *
 * Maneja todo el ciclo de vida de imágenes en el sistema:
 * - Subida de imágenes de productos y comentarios con Multer
 * - Validación de tipos de archivo y tamaños (max 10MB, 5-10 archivos)
 * - Procesamiento y optimización con Sharp (redimensionar, comprimir)
 * - Almacenamiento en sistema de archivos con nombres únicos (UUID + timestamp)
 * - Eliminación de archivos físicos
 * - Estadísticas de uso de almacenamiento
 *
 * Tipos de archivo permitidos: JPEG, JPG, PNG, WebP, GIF
 * Las imágenes se optimizan a máximo 1200x1200px (excepto GIFs animados).
 *
 * @class UploadController
 */
class UploadController {
  private productImagesPath: string;
  private commentImagesPath: string;

  constructor() {
    this.productImagesPath = config.images.productImagesPath;
    this.commentImagesPath = config.images.commentImagesPath;
    this.ensureDirectoriesExist();
  }

  /**
   * Asegura que los directorios de imágenes existen
   *
   * Crea los directorios de productos y comentarios si no existen.
   * Se ejecuta automáticamente en el constructor.
   *
   * @private
   */
  private ensureDirectoriesExist(): void {
    const directories = [this.productImagesPath, this.commentImagesPath];
    
    directories.forEach(dir => {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          logger.info('Directorio de imágenes creado', {
            path: dir
          });
        }
      } catch (error) {
        logger.error('Error al crear directorio de imágenes:', error);
      }
    });
  }

  /**
   * Obtiene configuración de Multer para subida de archivos
   *
   * Configura Multer para almacenamiento en memoria (no guarda directo a disco)
   * con validaciones de:
   * - Tamaño máximo: 10MB por archivo
   * - Cantidad máxima: 5 archivos
   * - Tipos permitidos: image/jpeg, image/jpg, image/png, image/webp, image/gif
   *
   * @public
   * @returns Instancia configurada de Multer
   */
  public getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
        files: 5 // Máximo 5 archivos
      },
      fileFilter: (req, file, cb) => {
        // Tipos de archivo permitidos
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten: ${allowedTypes.join(', ')}`));
        }
      }
    });
  }

  /**
   * Procesa y guarda una imagen de comentario
   *
   * Procesa el archivo con Sharp para optimización:
   * - Genera nombre único: comment_{timestamp}_{uuid}.{ext}
   * - GIFs: mantiene sin procesar para preservar animación
   * - Otros: redimensiona a max 1200x1200px, comprime a JPEG 85% calidad
   * - Guarda en directorio de comentarios
   *
   * @private
   * @param file - Archivo subido por Multer
   * @returns Promise con {url_imagen, alt_text}
   * @throws Error si falla el procesamiento
   */
  private async processCommentImage(file: UploadedFile): Promise<ProcessedImage> {
    try {
      // Generar nombre único para comentario
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const uniqueId = uuidv4();
      const timestamp = Date.now();
      const fileName = `comment_${timestamp}_${uniqueId}${fileExtension}`;
      const filePath = path.join(this.commentImagesPath, fileName);

      // Procesar imagen con sharp para optimización
      let processedBuffer: Buffer;
      
      if (file.mimetype === 'image/gif') {
        // Para GIFs, no procesar para mantener animación
        processedBuffer = file.buffer;
      } else {
        // Para otras imágenes, optimizar
        processedBuffer = await sharp(file.buffer)
          .resize(1200, 1200, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 85, 
            progressive: true 
          })
          .toBuffer();
      }

      // Guardar archivo procesado
      await fs.promises.writeFile(filePath, processedBuffer);

      // Obtener información del archivo
      const stats = await fs.promises.stat(filePath);

      return {
        url_imagen: fileName,
        alt_text: `Imagen del comentario`
      };

    } catch (error) {
      logger.error('Error al procesar imagen de comentario:', error);
      throw new Error('Error al procesar la imagen de comentario');
    }
  }

  /**
   * Procesa y guarda una imagen de producto
   *
   * Procesa el archivo con Sharp para optimización:
   * - Genera nombre único: {productName}_{timestamp}_{uuid}.{ext}
   * - GIFs: mantiene sin procesar para preservar animación
   * - Otros: redimensiona a max 1200x1200px, comprime a JPEG 85% calidad
   * - Guarda en directorio de productos
   *
   * @private
   * @param file - Archivo subido por Multer
   * @param orden - Orden de la imagen en el set
   * @param productName - Nombre del producto para el nombre del archivo (opcional)
   * @returns Promise con {url_imagen, alt_text}
   * @throws Error si falla el procesamiento
   */
  private async processProductImage(file: UploadedFile, orden: number, productName?: string): Promise<ProcessedImage> {
    try {
      // Generar nombre único para producto
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const uniqueId = uuidv4();
      const timestamp = Date.now();
      const sanitizedProductName = productName ? productName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : 'product';
      const fileName = `${sanitizedProductName}_${timestamp}_${uniqueId}${fileExtension}`;
      const filePath = path.join(this.productImagesPath, fileName);

      // Procesar imagen con sharp para optimización
      let processedBuffer: Buffer;
      
      if (file.mimetype === 'image/gif') {
        // Para GIFs, no procesar para mantener animación
        processedBuffer = file.buffer;
      } else {
        // Para otras imágenes, optimizar
        processedBuffer = await sharp(file.buffer)
          .resize(1200, 1200, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 85, 
            progressive: true 
          })
          .toBuffer();
      }

      // Guardar archivo procesado
      await fs.promises.writeFile(filePath, processedBuffer);

      // Obtener información del archivo
      const stats = await fs.promises.stat(filePath);

      return {
        url_imagen: fileName,
        alt_text: productName ? `Imagen de ${productName}` : `Imagen del producto`
      };

    } catch (error) {
      logger.error('Error al procesar imagen de producto:', error);
      throw new Error('Error al procesar la imagen de producto');
    }
  }

  /**
   * Endpoint para subir múltiples imágenes de comentarios
   *
   * Endpoint protegido que permite subir hasta 5 imágenes para un comentario.
   * Procesa las imágenes en paralelo y retorna los nombres de archivo generados.
   *
   * @public
   * @param req - Express Request con req.files (array de archivos de Multer)
   * @param res - Express Response object
   * @returns 200 con { mensaje, datos: { imagenes, tipo } }
   * @returns 400 si no se proporcionan archivos o hay demasiados
   * @returns 500 si ocurre error en el procesamiento
   *
   * @example
   * POST /api/upload/comment-images
   * Content-Type: multipart/form-data
   * Body: files[] = [imagen1.jpg, imagen2.png]
   * Response: {
   *   mensaje: "Imágenes de comentario subidas exitosamente",
   *   datos: {
   *     imagenes: [
   *       { url_imagen: "comment_1234567890_uuid.jpg", alt_text: "Imagen del comentario" }
   *     ],
   *     tipo: "comment"
   *   }
   * }
   */
  public uploadCommentImages = async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as UploadedFile[];

      if (!files || files.length === 0) {
        res.status(400).json({
          mensaje: 'No se proporcionaron archivos',
          error: 'Debe subir al menos una imagen'
        });
        return;
      }

      if (files.length > 5) {
        res.status(400).json({
          mensaje: 'Demasiadas imágenes',
          error: 'Máximo 5 imágenes por comentario'
        });
        return;
      }

      // Procesar todas las imágenes en paralelo
      const processPromises = files.map((file) => 
        this.processCommentImage(file)
      );

      const processedImages = await Promise.all(processPromises);

      logger.info('Imágenes de comentario subidas exitosamente', {
        cantidad: processedImages.length,
        directorio: this.commentImagesPath
      });

      res.status(200).json({
        mensaje: 'Imágenes de comentario subidas exitosamente',
        datos: {
          imagenes: processedImages,
          tipo: ImageType.COMMENT
        }
      });

    } catch (error) {
      logger.error('Error al subir imágenes de comentario:', error);

      res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'No se pudieron subir las imágenes'
      });
    }
  };

  /**
   * Endpoint para subir múltiples imágenes de productos
   *
   * Endpoint protegido que permite subir hasta 10 imágenes para un producto.
   * Procesa las imágenes en paralelo y retorna los nombres de archivo generados.
   * Opcionalmente acepta productName para nombres de archivo más descriptivos.
   *
   * @public
   * @param req - Express Request con req.files y req.body.productName o req.query.productName
   * @param res - Express Response object
   * @returns 200 con { mensaje, datos: { imagenes, tipo } }
   * @returns 400 si no se proporcionan archivos o hay demasiados
   * @returns 500 si ocurre error en el procesamiento
   *
   * @example
   * POST /api/upload/product-images?productName=iPhone13
   * Content-Type: multipart/form-data
   * Body: files[] = [frontal.jpg, trasera.jpg]
   * Response: {
   *   mensaje: "Imágenes de producto subidas exitosamente",
   *   datos: {
   *     imagenes: [
   *       { url_imagen: "iPhone13_1234567890_uuid.jpg", alt_text: "Imagen de iPhone13" }
   *     ],
   *     tipo: "product"
   *   }
   * }
   */
  public uploadProductImages = async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as UploadedFile[];
      const productName = req.body.productName || req.query.productName as string;

      if (!files || files.length === 0) {
        res.status(400).json({
          mensaje: 'No se proporcionaron archivos',
          error: 'Debe subir al menos una imagen'
        });
        return;
      }

      if (files.length > 10) {
        res.status(400).json({
          mensaje: 'Demasiadas imágenes',
          error: 'Máximo 10 imágenes por producto'
        });
        return;
      }

      // Procesar todas las imágenes en paralelo
      const processPromises = files.map((file, index) => 
        this.processProductImage(file, index, productName)
      );

      const processedImages = await Promise.all(processPromises);

      logger.info('Imágenes de producto subidas exitosamente', {
        cantidad: processedImages.length,
        directorio: this.productImagesPath,
        productName
      });

      res.status(200).json({
        mensaje: 'Imágenes de producto subidas exitosamente',
        datos: {
          imagenes: processedImages,
          tipo: ImageType.PRODUCT
        }
      });

    } catch (error) {
      logger.error('Error al subir imágenes de producto:', error);

      res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'No se pudieron subir las imágenes'
      });
    }
  };

  /**
   * Elimina físicamente una imagen de comentario del servidor
   *
   * Método público que elimina el archivo físico de una imagen de comentario.
   * Se utiliza cuando se elimina un comentario o una imagen específica.
   *
   * @public
   * @param imagePath - Nombre del archivo (solo basename, no ruta completa)
   * @returns Promise<boolean> true si se eliminó exitosamente, false si no existe o falla
   *
   * @example
   * await deleteCommentImage("comment_1234567890_uuid.jpg");
   */
  public deleteCommentImage = async (imagePath: string): Promise<boolean> => {
    try {
      const fullPath = path.join(this.commentImagesPath, path.basename(imagePath));
      
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info('Imagen de comentario eliminada', {
          path: imagePath,
          directorio: this.commentImagesPath
        });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error al eliminar imagen de comentario:', error);
      return false;
    }
  };

  /**
   * Elimina físicamente una imagen de producto del servidor
   *
   * Método público que elimina el archivo físico de una imagen de producto.
   * Se utiliza cuando se elimina un producto o se actualizan sus imágenes.
   *
   * @public
   * @param imagePath - Nombre del archivo (solo basename, no ruta completa)
   * @returns Promise<boolean> true si se eliminó exitosamente, false si no existe o falla
   *
   * @example
   * await deleteProductImage("iPhone13_1234567890_uuid.jpg");
   */
  public deleteProductImage = async (imagePath: string): Promise<boolean> => {
    try {
      const fullPath = path.join(this.productImagesPath, path.basename(imagePath));
      
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info('Imagen de producto eliminada', {
          path: imagePath,
          directorio: this.productImagesPath
        });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error al eliminar imagen de producto:', error);
      return false;
    }
  };

  /**
   * Limpia imágenes huérfanas del sistema de archivos
   *
   * Función placeholder para implementación futura de limpieza de imágenes
   * que no tienen registros asociados en la base de datos.
   *
   * @public
   * @returns Promise<void>
   */
  public cleanOrphanImages = async (): Promise<void> => {
    try {
      logger.info('Función de limpieza de imágenes huérfanas disponible', {
        productImagesPath: this.productImagesPath,
        commentImagesPath: this.commentImagesPath
      });
    } catch (error) {
      logger.error('Error en limpieza de imágenes huérfanas:', error);
    }
  };

  /**
   * Obtiene información y estadísticas de directorios de imágenes
   *
   * Endpoint que retorna rutas de directorios y estadísticas de uso:
   * - Rutas completas de directorios
   * - Cantidad de imágenes de productos
   * - Cantidad de imágenes de comentarios
   * - Total de imágenes
   *
   * @public
   * @param req - Express Request object
   * @param res - Express Response object
   * @returns 200 con { directorios, estadisticas }
   * @returns 500 si ocurre error al leer directorios
   *
   * @example
   * GET /api/upload/directories-info
   * Response: {
   *   directorios: {
   *     productos: "/path/to/productos",
   *     comentarios: "/path/to/comentarios"
   *   },
   *   estadisticas: {
   *     imagenes_productos: 145,
   *     imagenes_comentarios: 78,
   *     total: 223
   *   }
   * }
   */
  public getDirectoriesInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const productFiles = fs.existsSync(this.productImagesPath) 
        ? fs.readdirSync(this.productImagesPath).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
          }).length 
        : 0;

      const commentFiles = fs.existsSync(this.commentImagesPath) 
        ? fs.readdirSync(this.commentImagesPath).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
          }).length 
        : 0;

      res.json({
        directorios: {
          productos: this.productImagesPath,
          comentarios: this.commentImagesPath
        },
        estadisticas: {
          imagenes_productos: productFiles,
          imagenes_comentarios: commentFiles,
          total: productFiles + commentFiles
        }
      });
    } catch (error) {
      logger.error('Error al obtener información de directorios:', error);
      res.status(500).json({ error: 'Error al obtener información de directorios' });
    }
  };
}

export default new UploadController();