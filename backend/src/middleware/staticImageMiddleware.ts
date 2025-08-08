import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

// Tipos de archivos de imagen permitidos
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.avif', '.bmp', '.tiff', '.tif'];

// Tipos MIME para cada extensión
const MIME_TYPES: { [key: string]: string } = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.jfif': 'image/jpeg',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff'
};

interface ImageMiddlewareOptions {
  basePath: string;
  productImagesPath: string;
  commentImagesPath: string;
  defaultProductImage?: string;
  defaultCommentImage?: string;
  maxAge?: number;
  endpoint?: string;
}

class StaticImageMiddleware {
  private basePath: string;
  private productImagesPath: string;
  private commentImagesPath: string;
  private defaultProductImage: string;
  private defaultCommentImage: string;
  private maxAge: number;
  private endpoint: string;

  constructor(options: ImageMiddlewareOptions) {
    this.basePath = options.basePath;
    this.productImagesPath = options.productImagesPath;
    this.commentImagesPath = options.commentImagesPath;
    this.defaultProductImage = options.defaultProductImage || 'default-product.png';
    this.defaultCommentImage = options.defaultCommentImage || 'default-comment.png';
    this.maxAge = options.maxAge || 86400;
    this.endpoint = options.endpoint || '/images';
  }

  private isValidFilename(filename: string): boolean {
    // Verificar que el nombre no esté vacío
    if (!filename || filename.trim().length === 0) {
      return false;
    }

    // Prevenir path traversal attacks
    if (filename.includes('..')) {
      return false;
    }

    // Prevenir caracteres de control peligrosos
    if (filename.includes('\0') || filename.length > 500) {
      return false;
    }

    // Validar extensión
    const ext = path.extname(filename).toLowerCase();
    if (!ext || !ALLOWED_IMAGE_TYPES.includes(ext)) {
      return false;
    }

    // Validar caracteres permitidos
    const dangerousChars = /[\x00-\x1f\x7f<>:"|*\?]/;
    if (dangerousChars.test(filename)) {
      return false;
    }

    // Solo nombres de archivo sin rutas
    if (filename.includes('/') || filename.includes('\\')) {
      logger.warn(`Nombre de imagen contiene caracteres de ruta no permitidos: ${filename}`);
      return false;
    }

    return true;
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
  }

  private fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * Sirve imágenes de productos
   */
  public serveProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filename = req.params[0];
      
      logger.debug(`Solicitud de imagen de producto recibida: ${filename}`, {
        originalUrl: req.originalUrl,
        method: req.method
      });

      if (!filename || !this.isValidFilename(filename)) {
        logger.warn(`Nombre de imagen de producto inválido: ${filename}`);
        return this.serveDefaultProductImage(res);
      }

      const filePath = path.join(this.productImagesPath, filename);
      
      logger.debug(`Buscando imagen de producto en: ${filePath}`, {
        fileExists: this.fileExists(filePath)
      });

      if (!this.fileExists(filePath)) {
        logger.warn(`Imagen de producto no encontrada: ${filePath}`);
        return this.serveDefaultProductImage(res);
      }

      this.sendImage(res, filePath, filename);

    } catch (error) {
      logger.error('Error al servir imagen de producto:', error);
      this.serveDefaultProductImage(res);
    }
  };

  /**
   * Sirve imágenes de comentarios
   */
  public serveCommentImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filename = req.params[0];
      
      logger.debug(`Solicitud de imagen de comentario recibida: ${filename}`, {
        originalUrl: req.originalUrl,
        method: req.method
      });

      if (!filename || !this.isValidFilename(filename)) {
        logger.warn(`Nombre de imagen de comentario inválido: ${filename}`);
        return this.serveDefaultCommentImage(res);
      }

      const filePath = path.join(this.commentImagesPath, filename);
      
      logger.debug(`Buscando imagen de comentario en: ${filePath}`, {
        fileExists: this.fileExists(filePath)
      });

      if (!this.fileExists(filePath)) {
        logger.warn(`Imagen de comentario no encontrada: ${filePath}`);
        return this.serveDefaultCommentImage(res);
      }

      this.sendImage(res, filePath, filename);

    } catch (error) {
      logger.error('Error al servir imagen de comentario:', error);
      this.serveDefaultCommentImage(res);
    }
  };

  /**
   * Método legacy para compatibilidad (sirve imágenes de productos)
   */
  public serveImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return this.serveProductImage(req, res, next);
  };

  private serveDefaultProductImage(res: Response): void {
    const defaultPath = path.join(this.productImagesPath, this.defaultProductImage);
    if (this.fileExists(defaultPath)) {
      this.sendImage(res, defaultPath, this.defaultProductImage);
    } else {
      res.status(404).json({ error: 'Imagen de producto no encontrada' });
    }
  }

  private serveDefaultCommentImage(res: Response): void {
    const defaultPath = path.join(this.commentImagesPath, this.defaultCommentImage);
    if (this.fileExists(defaultPath)) {
      this.sendImage(res, defaultPath, this.defaultCommentImage);
    } else {
      res.status(404).json({ error: 'Imagen de comentario no encontrada' });
    }
  }

  private sendImage(res: Response, filePath: string, filename: string): void {
    const mimeType = this.getMimeType(filename);
    
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': `public, max-age=${this.maxAge}`,
      'ETag': `"${filename}-${Date.now()}"`,
      'X-Content-Type-Options': 'nosniff'
    });

    res.sendFile(filePath, (err) => {
      if (err) {
        logger.error(`Error al enviar archivo ${filename}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error al enviar imagen' });
        }
      }
    });
  }

  public validateImagesDirectory(): boolean {
    try {
      // Validar directorios de imágenes
      const directories = [
        this.basePath,
        this.productImagesPath,
        this.commentImagesPath
      ];

      for (const dir of directories) {
        if (!fs.existsSync(dir)) {
          logger.error(`Directorio de imágenes no existe: ${dir}`);
          return false;
        }

        const stats = fs.statSync(dir);
        if (!stats.isDirectory()) {
          logger.error(`La ruta de imágenes no es un directorio: ${dir}`);
          return false;
        }
      }

      logger.info(`Directorios de imágenes configurados correctamente:`, {
        basePath: this.basePath,
        productImagesPath: this.productImagesPath,
        commentImagesPath: this.commentImagesPath
      });
      return true;
    } catch (error) {
      logger.error('Error al validar directorios de imágenes:', error);
      return false;
    }
  }

  /**
   * Obtiene información de los directorios de imágenes
   */
  public getDirectoriesInfo(): {
    basePath: string;
    productImagesPath: string;
    commentImagesPath: string;
    productImagesCount: number;
    commentImagesCount: number;
  } {
    let productImagesCount = 0;
    let commentImagesCount = 0;

    try {
      if (fs.existsSync(this.productImagesPath)) {
        const productFiles = fs.readdirSync(this.productImagesPath);
        productImagesCount = productFiles.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ALLOWED_IMAGE_TYPES.includes(ext);
        }).length;
      }

      if (fs.existsSync(this.commentImagesPath)) {
        const commentFiles = fs.readdirSync(this.commentImagesPath);
        commentImagesCount = commentFiles.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ALLOWED_IMAGE_TYPES.includes(ext);
        }).length;
      }
    } catch (error) {
      logger.error('Error al contar imágenes:', error);
    }

    return {
      basePath: this.basePath,
      productImagesPath: this.productImagesPath,
      commentImagesPath: this.commentImagesPath,
      productImagesCount,
      commentImagesCount
    };
  }
}

export default StaticImageMiddleware;