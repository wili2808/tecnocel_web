import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import logger from '../utils/logger.js';
import { config } from '../config/config.js';

// Interfaces
interface UploadedFile extends Express.Multer.File {
  buffer: Buffer;
}

interface ProcessedImage {
  url_imagen: string;
  alt_text: string;
  es_principal: boolean;
  orden: number;
}

class UploadController {
  private imagesPath: string;

  constructor() {
    this.imagesPath = config.images.imagesPath;
    this.ensureDirectoryExists();
  }

  // Asegurar que el directorio existe
  private ensureDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.imagesPath)) {
        fs.mkdirSync(this.imagesPath, { recursive: true });
        logger.info('Directorio de imágenes creado', {
          path: this.imagesPath
        });
      }
    } catch (error) {
      logger.error('Error al crear directorio de imágenes:', error);
    }
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

  // Procesar y guardar imagen
  private async processImage(file: UploadedFile, orden: number): Promise<ProcessedImage> {
    try {
      // Generar nombre único
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const uniqueId = uuidv4();
      const timestamp = Date.now();
      const fileName = `comment_${timestamp}_${uniqueId}${fileExtension}`;
      const filePath = path.join(this.imagesPath, fileName);

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
        alt_text: `Imagen ${orden + 1} del comentario`,
        es_principal: orden === 0, // La primera imagen es la principal
        orden: orden + 1
      };

    } catch (error) {
      logger.error('Error al procesar imagen:', error);
      throw new Error('Error al procesar la imagen');
    }
  }

  // Endpoint para subir múltiples imágenes
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
      const processPromises = files.map((file, index) => 
        this.processImage(file, index)
      );

      const processedImages = await Promise.all(processPromises);

      logger.info('Imágenes de comentario subidas exitosamente', {
        cantidad: processedImages.length
      });

      res.status(200).json({
        mensaje: 'Imágenes subidas exitosamente',
        datos: {
          imagenes: processedImages
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

  // Eliminar imagen (cuando se elimina un comentario)
  public deleteCommentImage = async (imagePath: string): Promise<boolean> => {
    try {
      const fullPath = path.join(this.imagesPath, path.basename(imagePath));
      
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info('Imagen de comentario eliminada', {
          path: imagePath
        });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error al eliminar imagen de comentario:', error);
      return false;
    }
  };

  // Limpiar imágenes huérfanas (sin comentario asociado)
  public cleanOrphanImages = async (): Promise<void> => {
    try {
      // Esta función se puede llamar periódicamente para limpiar imágenes sin comentarios
      // Por ahora, solo loggear que la funcionalidad está disponible
      logger.info('Función de limpieza de imágenes huérfanas disponible');
    } catch (error) {
      logger.error('Error en limpieza de imágenes huérfanas:', error);
    }
  };
}

export default new UploadController();