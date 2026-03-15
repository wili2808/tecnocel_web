import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import logger from '../services/loggerService.js';
import { config } from '../config/config.js';
import { ImageType } from '../services/imageService.js';
import {
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
  deleteCloudinaryByPublicId,
  extractCloudinaryPublicId,
} from '../services/cloudinaryService.js';

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
  private marcaImagesPath: string;
  private useCloudinary: boolean;

  constructor() {
    this.productImagesPath = config.images.productImagesPath;
    this.commentImagesPath = config.images.commentImagesPath;
    this.marcaImagesPath = config.images.marcaImagesPath;
    this.useCloudinary = config.images.useCloudinary;

    if (!this.useCloudinary) {
      this.ensureDirectoriesExist();
      logger.debug('[UPLOAD CONTROLLER] Modo FILESYSTEM: Directorios locales validados');
    } else if (!isCloudinaryConfigured()) {
      logger.error('[UPLOAD CONTROLLER] ❌ CRÍTICO: USE_CLOUDINARY=true pero faltan credenciales CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET');
    } else {
      logger.debug('[UPLOAD CONTROLLER] Modo CLOUDINARY: Credenciales válidas, listo para uploads');
    }
  }

  private ensureDirectoriesExist(): void {
    const directories = [this.productImagesPath, this.commentImagesPath, this.marcaImagesPath];

    directories.forEach(dir => {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          logger.info('Directorio de imágenes creado', { path: dir });
        }
      } catch (error) {
        logger.error('Error al crear directorio de imágenes:', error);
      }
    });
  }

  public getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten: ${allowedTypes.join(', ')}`));
        }
      }
    });
  }

  public getMarcaMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Tipo no permitido: ${file.mimetype}. Solo PNG, JPG, JPEG, WebP`));
        }
      }
    });
  }

  private async optimizeImageBuffer(file: UploadedFile): Promise<Buffer> {
    if (file.mimetype === 'image/gif') {
      return file.buffer;
    }

    return sharp(file.buffer)
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

  private async processMarcaLogo(file: UploadedFile, marcaNombre: string): Promise<string> {
    try {
      const sanitizedName = marcaNombre
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 20)
        .toLowerCase();

      const processedBuffer = await sharp(file.buffer)
        .resize(300, 300, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 8 })
        .toBuffer();

      if (this.useCloudinary) {
        const result = await uploadBufferToCloudinary(
          processedBuffer,
          config.images.cloudinary.marcaFolder,
          `marca_${sanitizedName}`,
          file.originalname,
        );
        return result.secureUrl;
      }

      const timestamp = Date.now();
      const uniqueId = uuidv4().split('-')[0];
      const fileName = `marca_${sanitizedName}_${timestamp}_${uniqueId}.png`;
      const filePath = path.join(this.marcaImagesPath, fileName);
      await fs.promises.writeFile(filePath, processedBuffer);
      return fileName;
    } catch (error) {
      logger.error('Error al procesar logo de marca:', error);
      throw new Error('Error al procesar el logo de marca');
    }
  }

  private async processCommentImage(file: UploadedFile): Promise<ProcessedImage> {
    try {
      const processedBuffer = await this.optimizeImageBuffer(file);

      if (this.useCloudinary) {
        const result = await uploadBufferToCloudinary(
          processedBuffer,
          config.images.cloudinary.commentFolder,
          'comment',
          file.originalname,
        );

        return {
          url_imagen: result.secureUrl,
          alt_text: 'Imagen del comentario'
        };
      }

      const fileExtension = path.extname(file.originalname).toLowerCase() || '.jpg';
      const uniqueId = uuidv4();
      const timestamp = Date.now();
      const fileName = `comment_${timestamp}_${uniqueId}${fileExtension}`;
      const filePath = path.join(this.commentImagesPath, fileName);

      await fs.promises.writeFile(filePath, processedBuffer);

      return {
        url_imagen: fileName,
        alt_text: 'Imagen del comentario'
      };
    } catch (error) {
      logger.error('Error al procesar imagen de comentario:', error);
      throw new Error('Error al procesar la imagen de comentario');
    }
  }

  private async processProductImage(file: UploadedFile, orden: number, productName?: string): Promise<ProcessedImage> {
    try {
      const processedBuffer = await this.optimizeImageBuffer(file);
      const sanitizedProductName = productName
        ? productName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
        : 'product';

      if (this.useCloudinary) {
        const result = await uploadBufferToCloudinary(
          processedBuffer,
          config.images.cloudinary.productFolder,
          sanitizedProductName,
          file.originalname,
        );

        return {
          url_imagen: result.secureUrl,
          alt_text: productName ? `Imagen de ${productName}` : 'Imagen del producto'
        };
      }

      const fileExtension = path.extname(file.originalname).toLowerCase() || '.jpg';
      const uniqueId = uuidv4();
      const timestamp = Date.now();
      const fileName = `${sanitizedProductName}_${timestamp}_${uniqueId}${fileExtension}`;
      const filePath = path.join(this.productImagesPath, fileName);

      await fs.promises.writeFile(filePath, processedBuffer);

      return {
        url_imagen: fileName,
        alt_text: productName ? `Imagen de ${productName}` : 'Imagen del producto'
      };
    } catch (error) {
      logger.error('Error al procesar imagen de producto:', error);
      throw new Error('Error al procesar la imagen de producto');
    }
  }

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

      const processedImages = await Promise.all(files.map((file) => this.processCommentImage(file)));

      if (this.useCloudinary) {
        logger.info('[UPLOAD] ✅ Imágenes de comentario subidas a CLOUDINARY', {
          cantidad: processedImages.length,
          destino: 'CDN Cloudinary',
          carpeta: config.images.cloudinary.commentFolder
        });
      } else {
        logger.info('[UPLOAD] ✅ Imágenes de comentario guardadas en FILESYSTEM LOCAL', {
          cantidad: processedImages.length,
          destino: this.commentImagesPath
        });
      }

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

      const processedImages = await Promise.all(
        files.map((file, index) => this.processProductImage(file, index, productName)),
      );

      if (this.useCloudinary) {
        logger.info('[UPLOAD] ✅ Imágenes de producto subidas a CLOUDINARY', {
          cantidad: processedImages.length,
          destino: 'CDN Cloudinary',
          carpeta: config.images.cloudinary.productFolder,
          producto: productName || 'sin nombre'
        });
      } else {
        logger.info('[UPLOAD] ✅ Imágenes de producto guardadas en FILESYSTEM LOCAL', {
          cantidad: processedImages.length,
          destino: this.productImagesPath,
          producto: productName || 'sin nombre'
        });
      }

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

  public deleteCommentImage = async (imagePath: string): Promise<boolean> => {
    try {
      if (this.useCloudinary) {
        const publicId = extractCloudinaryPublicId(imagePath);
        if (!publicId) return false;
        return await deleteCloudinaryByPublicId(publicId);
      }

      const fullPath = path.join(this.commentImagesPath, path.basename(imagePath));
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info('[UPLOAD] Imagen de comentario eliminada (FILESYSTEM)', { archivo: path.basename(imagePath) });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error al eliminar imagen de comentario:', error);
      return false;
    }
  };

  public deleteProductImage = async (imagePath: string): Promise<boolean> => {
    try {
      if (this.useCloudinary) {
        const publicId = extractCloudinaryPublicId(imagePath);
        if (!publicId) return false;
        return await deleteCloudinaryByPublicId(publicId);
      }

      const fullPath = path.join(this.productImagesPath, path.basename(imagePath));
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info('[UPLOAD] Imagen de producto eliminada (FILESYSTEM)', { archivo: path.basename(imagePath) });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error al eliminar imagen de producto:', error);
      return false;
    }
  };

  public uploadMarcaLogo = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file as UploadedFile | undefined;
      const { id_marca } = req.params;

      if (!file) {
        res.status(400).json({ success: false, error: 'No se proporcionó ningún archivo' });
        return;
      }

      const Marca = (await import('../models/Marca.js')).default;
      const marca = await Marca.findByPk(id_marca);

      if (!marca) {
        res.status(404).json({ success: false, error: 'Marca no encontrada' });
        return;
      }

      // Delete previous logo if exists
      if (marca.logo_marca) {
        if (this.useCloudinary) {
          const publicId = extractCloudinaryPublicId(marca.logo_marca);
          if (publicId) {
            await deleteCloudinaryByPublicId(publicId);
            logger.info('[UPLOAD] Logo anterior de marca eliminado (CLOUDINARY)', { publicId });
          }
        } else {
          const oldPath = path.join(this.marcaImagesPath, marca.logo_marca);
          if (fs.existsSync(oldPath)) {
            await fs.promises.unlink(oldPath);
            logger.info('[UPLOAD] Logo anterior de marca eliminado', { archivo: marca.logo_marca });
          }
        }
      }

      // Process and save new logo
      const fileName = await this.processMarcaLogo(file, marca.nombre_marca);

      // Update DB
      await marca.update({
        logo_marca: fileName,
        fyh_actualizacion: new Date()
      });

      // Generate URL
      const { getImageService, ImageType } = await import('../services/imageService.js');
      const imageService = getImageService();
      const url = imageService
        ? imageService.generateImageUrl(fileName, ImageType.BRAND)
        : fileName;

      logger.info('[UPLOAD] ✅ Logo de marca subido exitosamente', {
        marca_id: id_marca,
        nombre_marca: marca.nombre_marca,
        archivo: fileName,
        destino: this.useCloudinary ? 'CLOUDINARY' : 'FILESYSTEM'
      });

      res.status(200).json({
        success: true,
        data: { filename: fileName, url }
      });
    } catch (error) {
      logger.error('Error al subir logo de marca:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir el logo'
      });
    }
  };

  public cleanOrphanImages = async (): Promise<void> => {
    if (this.useCloudinary) {
      logger.info('[UPLOAD] Limpieza de imágenes huérfanas (CLOUDINARY)', {
        storage: 'cloudinary',
        nota: 'Se pueden eliminar por públic_id en dashboard de Cloudinary'
      });
    } else {
      logger.info('[UPLOAD] Limpieza de imágenes huérfanas (FILESYSTEM)', {
        storage: 'filesystem',
        productImagesPath: this.productImagesPath,
        commentImagesPath: this.commentImagesPath
      });
    }
  };

  public getDirectoriesInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      if (this.useCloudinary) {
        res.json({
          storage: 'cloudinary',
          directorios: {
            productos: config.images.cloudinary.productFolder,
            comentarios: config.images.cloudinary.commentFolder,
            marcas: config.images.cloudinary.marcaFolder
          },
          estadisticas: {
            imagenes_productos: null,
            imagenes_comentarios: null,
            imagenes_marcas: null,
            total: null
          }
        });
        return;
      }

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

      const marcaFiles = fs.existsSync(this.marcaImagesPath)
        ? fs.readdirSync(this.marcaImagesPath).filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        }).length
        : 0;

      res.json({
        storage: 'filesystem',
        directorios: {
          productos: this.productImagesPath,
          comentarios: this.commentImagesPath,
          marcas: this.marcaImagesPath
        },
        estadisticas: {
          imagenes_productos: productFiles,
          imagenes_comentarios: commentFiles,
          imagenes_marcas: marcaFiles,
          total: productFiles + commentFiles + marcaFiles
        }
      });
    } catch (error) {
      logger.error('Error al obtener información de directorios:', error);
      res.status(500).json({ error: 'Error al obtener información de directorios' });
    }
  };
}

export default new UploadController();
