import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import logger from '../services/loggerService.js';
import { config } from '../config/config.js';
import { ImageType } from '../services/imageService.js';

// Interfaces
interface UploadedFile extends Express.Multer.File {
  buffer: Buffer;
}

interface ProcessedImage {
  url_imagen: string;
  alt_text: string;
}

class UploadController {
  private productImagesPath: string;
  private commentImagesPath: string;

  constructor() {
    this.productImagesPath = config.images.productImagesPath;
    this.commentImagesPath = config.images.commentImagesPath;
    this.ensureDirectoriesExist();
  }

  // Asegurar que los directorios existen
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

  // Configuración de multer para memoria (no guardamos directo a disco)
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

  // Procesar y guardar imagen de comentario
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

  // Procesar y guardar imagen de producto
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

  // Endpoint para subir múltiples imágenes de comentarios
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

  // Endpoint para subir múltiples imágenes de productos
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

  // Eliminar imagen de comentario
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

  // Eliminar imagen de producto
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

  // Limpiar imágenes huérfanas
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

  // Obtener información de directorios
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