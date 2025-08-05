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
  '.jfif': 'image/jpeg', // JFIF es una variante de JPEG
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff'
};

interface ImageMiddlewareOptions {
  imagesPath: string;
  commentsImagesPath?: string; // Nueva ruta específica para comentarios
  defaultImage?: string;
  maxAge?: number; // Cache duration in seconds
}

class StaticImageMiddleware {
  private imagesPath: string;
  private commentsImagesPath: string;
  private defaultImage: string;
  private maxAge: number;

  constructor(options: ImageMiddlewareOptions) {
    this.imagesPath = options.imagesPath;
    this.commentsImagesPath = options.commentsImagesPath || path.join(process.cwd(), '../htdocs/tecnocel');
    this.defaultImage = options.defaultImage || 'default-product.png';
    this.maxAge = options.maxAge || 86400; // 24 hours default
  }

  // Validar nombre de archivo por seguridad (versión mejorada para rutas de comentarios)
  private isValidFilename(filename: string): boolean {
    // Verificar que el nombre no esté vacío
    if (!filename || filename.trim().length === 0) {
      return false;
    }

    // Prevenir path traversal attacks (PRINCIPAL RIESGO DE SEGURIDAD)
    if (filename.includes('..')) {
      return false;
    }

    // Prevenir caracteres de control peligrosos
    if (filename.includes('\0') || filename.length > 500) {
      return false;
    }

    // Validar extensión (PRINCIPAL VALIDACIÓN)
    const ext = path.extname(filename).toLowerCase();
    if (!ext || !ALLOWED_IMAGE_TYPES.includes(ext)) {
      return false;
    }

    // VALIDACIÓN MEJORADA: Permitir rutas de comentarios pero prevenir caracteres peligrosos
    // Permitir: guiones, puntos, espacios, números, caracteres alfanuméricos, barras normales
    const dangerousChars = /[\x00-\x1f\x7f<>:"|*\?]/;
    if (dangerousChars.test(filename)) {
      return false;
    }

    // Validar que las rutas sean seguras (solo permitir rutas de comentarios)
    const safePaths = ['img_comments/', 'comments_img/', 'comments/'];
    const hasValidPath = safePaths.some(safePath => filename.startsWith(safePath));
    
    // Si no tiene una ruta válida, debe ser un archivo directo (sin barras)
    if (!hasValidPath && (filename.includes('/') || filename.includes('\\'))) {
      return false;
    }

    // Si llegamos aquí, el archivo es seguro
    return true;
  }

  // Obtener tipo MIME del archivo
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
  }

  // Verificar si el archivo existe
  private fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (error) {
      return false;
    }
  }

  // Middleware principal para servir imágenes
  public serveImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filename = req.params[0]; // Usar req.params[0] para capturar todo después de /api/images/
      
      logger.info(`🔍 MIDDLEWARE EJECUTÁNDOSE - Solicitud de imagen recibida: ${filename}`, {
        originalUrl: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        params: req.params
      });

      // Validar nombre de archivo
      if (!filename || !this.isValidFilename(filename)) {
        const ext = filename ? path.extname(filename).toLowerCase() : 'sin extensión';
        logger.warn(`Nombre de imagen inválido detectado: ${filename}`, {
          extension: ext,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        res.status(400).json({ 
          error: 'Nombre de archivo inválido',
          message: 'El archivo solicitado no es válido o no está permitido'
        });
        return;
      }

      // Construir ruta completa del archivo
      let filePath: string;
      if (filename.startsWith('img_comments/') || filename.startsWith('comments_img/') || filename.startsWith('comments/')) {
        // Para comentarios, extraer solo el nombre del archivo (sin el prefijo)
        const fileName = filename.replace(/^(img_comments\/|comments_img\/|comments\/)/, '');
        filePath = path.join(this.commentsImagesPath, fileName);
        logger.info(`🔍 DEBUG - Ruta de comentario construida: ${filePath} (archivo: ${fileName})`);
        logger.info(`🔍 DEBUG - commentsImagesPath: ${this.commentsImagesPath}`);
        logger.info(`🔍 DEBUG - fileName extraído: ${fileName}`);
      } else {
        // Para otros archivos, usar el directorio normal (XAMPP)
        filePath = path.join(this.imagesPath, filename);
        logger.debug(`Ruta de imagen normal construida: ${filePath}`);
      }
      
      // Verificar si el archivo existe
      if (!this.fileExists(filePath)) {
        logger.warn(`Imagen no encontrada: ${filename}`, {
          filePath: filePath,
          exists: fs.existsSync(filePath),
          isFile: fs.existsSync(filePath) ? fs.statSync(filePath).isFile() : false,
          directory: path.dirname(filePath),
          directoryExists: fs.existsSync(path.dirname(filePath))
        });
        
        // Intentar servir imagen por defecto
        const defaultPath = path.join(this.imagesPath, this.defaultImage);
        if (this.fileExists(defaultPath)) {
          logger.debug(`Sirviendo imagen por defecto: ${this.defaultImage}`);
          this.sendImage(res, defaultPath, this.defaultImage);
          return;
        } else {
          res.status(404).json({ 
            error: 'Imagen no encontrada',
            message: 'La imagen solicitada no existe',
            requestedFile: filename,
            constructedPath: filePath
          });
          return;
        }
      }

      // Servir la imagen
      logger.debug(`Sirviendo imagen: ${filename}`);
      this.sendImage(res, filePath, filename);

    } catch (error) {
      logger.error('Error al servir imagen:', {
        filename: req.params[0],
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo procesar la solicitud de imagen'
      });
    }
  };

  // Enviar archivo de imagen con headers apropiados
  private sendImage(res: Response, filePath: string, filename: string): void {
    const mimeType = this.getMimeType(filename);
    
    // Configurar headers de cache y tipo de contenido
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': `public, max-age=${this.maxAge}`,
      'ETag': `"${filename}-${Date.now()}"`,
      'X-Content-Type-Options': 'nosniff'
    });

    // Enviar archivo
    res.sendFile(filePath, (err) => {
      if (err) {
        logger.error(`Error al enviar archivo ${filename}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Error al enviar imagen',
            message: 'No se pudo enviar la imagen solicitada'
          });
        }
      } else {
        logger.debug(`Imagen enviada exitosamente: ${filename}`);
      }
    });
  }

  // Middleware para validar que el directorio de imágenes existe
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

      // Validar directorio de comentarios
      if (!fs.existsSync(this.commentsImagesPath)) {
        logger.error(`Directorio de imágenes de comentarios no existe: ${this.commentsImagesPath}`);
        return false;
      }

      const commentsStats = fs.statSync(this.commentsImagesPath);
      if (!commentsStats.isDirectory()) {
        logger.error(`La ruta de comentarios no es un directorio: ${this.commentsImagesPath}`);
        return false;
      }

      logger.info(`Directorio de imágenes configurado correctamente: ${this.imagesPath}`);
      logger.info(`Directorio de comentarios configurado correctamente: ${this.commentsImagesPath}`);
      return true;
    } catch (error) {
      logger.error('Error al validar directorio de imágenes:', error);
      return false;
    }
  }
}

export default StaticImageMiddleware; 