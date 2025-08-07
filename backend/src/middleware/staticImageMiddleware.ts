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
  imagesPath: string;
  defaultImage?: string;
  maxAge?: number;
  endpoint?: string;
}

class StaticImageMiddleware {
  private imagesPath: string;
  private defaultImage: string;
  private maxAge: number;
  private endpoint: string;

  constructor(options: ImageMiddlewareOptions) {
    this.imagesPath = options.imagesPath;
    this.defaultImage = options.defaultImage || 'placeholder.png';
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

    // ✅ Con la nueva estructura unificada, no permitir rutas con barras
    // Solo nombres de archivo simples para mayor seguridad
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

  public serveImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filename = req.params[0];
      
      logger.debug(`Solicitud de imagen recibida: ${filename}`, {
        originalUrl: req.originalUrl,
        method: req.method,
        headers: req.headers
      });

      if (!filename || !this.isValidFilename(filename)) {
        logger.warn(`Nombre de imagen inválido: ${filename}`);
        return this.serveDefaultImage(res);
      }

      // ✅ Con la nueva estructura unificada, todas las imágenes están en el mismo directorio
      const filePath = path.join(this.imagesPath, filename);
      
      logger.debug(`Buscando imagen en: ${filePath}`, {
        fileExists: this.fileExists(filePath)
      });

      if (!this.fileExists(filePath)) {
        logger.warn(`Imagen no encontrada: ${filePath}`);
        return this.serveDefaultImage(res);
      }

      this.sendImage(res, filePath, filename);

    } catch (error) {
      logger.error('Error al servir imagen:', error);
      this.serveDefaultImage(res);
    }
  };

  private serveDefaultImage(res: Response): void {
    const defaultPath = path.join(this.imagesPath, this.defaultImage);
    if (this.fileExists(defaultPath)) {
      this.sendImage(res, defaultPath, this.defaultImage);
    } else {
      res.status(404).json({ error: 'Imagen no encontrada' });
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
      // Validar directorio principal de imágenes
      if (!fs.existsSync(this.imagesPath)) {
        logger.error(`Directorio de imágenes no existe: ${this.imagesPath}`);
        return false;
      }

      const stats = fs.statSync(this.imagesPath);
      if (!stats.isDirectory()) {
        logger.error(`La ruta de imágenes no es un directorio: ${this.imagesPath}`);
        return false;
      }

      logger.info(`Directorio de imágenes configurado correctamente:`, {
        imagesPath: this.imagesPath
      });
      return true;
    } catch (error) {
      logger.error('Error al validar directorio de imágenes:', error);
      return false;
    }
  }
}

export default StaticImageMiddleware;