/**
 * @file Middleware para servir imágenes estáticas con validación y seguridad
 *
 * Proporciona middleware especializado para servir imágenes de productos y comentarios
 * con características de seguridad y optimización:
 * - Validación estricta de nombres de archivo (previene path traversal)
 * - Soporte para múltiples formatos de imagen
 * - Imágenes por defecto cuando no se encuentra el archivo
 * - Headers de caché HTTP configurables
 * - Content-Type correcto según extensión
 * - Logging detallado de accesos
 * - Protección contra inyección de rutas maliciosas
 *
 * Formatos soportados: JPG, JPEG, PNG, WebP, GIF, JFIF, AVIF, BMP, TIFF
 *
 * @module staticImageMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import logger from '../services/loggerService.js';

/**
 * Extensiones de archivo de imagen permitidas
 * @constant
 * @private
 */
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.avif', '.bmp', '.tiff', '.tif'];

/**
 * Mapeo de extensiones a tipos MIME correctos
 * @constant
 * @private
 */
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

/**
 * Opciones de configuración para el middleware de imágenes
 *
 * @interface ImageMiddlewareOptions
 * @property {string} basePath - Ruta base del directorio de imágenes
 * @property {string} productImagesPath - Ruta del directorio de imágenes de productos
 * @property {string} commentImagesPath - Ruta del directorio de imágenes de comentarios
 * @property {string} [defaultProductImage] - Imagen por defecto para productos (default: 'default-product.png')
 * @property {string} [defaultCommentImage] - Imagen por defecto para comentarios (default: 'default-comment.png')
 * @property {number} [maxAge] - Tiempo de caché en segundos (default: 86400 = 24 horas)
 * @property {string} [endpoint] - Endpoint base para servir imágenes (default: '/images')
 */
interface ImageMiddlewareOptions {
  basePath: string;
  productImagesPath: string;
  commentImagesPath: string;
  defaultProductImage?: string;
  defaultCommentImage?: string;
  maxAge?: number;
  endpoint?: string;
  marcaImagesPath: string;
  defaultMarcaImage?: string;
}

/**
 * Middleware para servir imágenes estáticas de productos y comentarios
 *
 * Clase que proporciona métodos middleware para Express que sirven archivos
 * de imagen con validación de seguridad, caché y manejo de errores.
 *
 * @class StaticImageMiddleware
 *
 * @example
 * const imageMiddleware = new StaticImageMiddleware({
 *   basePath: path.join(__dirname, '../uploads'),
 *   productImagesPath: path.join(__dirname, '../uploads/productos'),
 *   commentImagesPath: path.join(__dirname, '../uploads/comentarios'),
 *   maxAge: 86400  // 24 horas de caché
 * });
 *
 * // Usar en rutas Express
 * app.get('/uploads/productos/*', imageMiddleware.serveProductImage);
 * app.get('/uploads/comentarios/*', imageMiddleware.serveCommentImage);
 */
class StaticImageMiddleware {
  private basePath: string;
  private productImagesPath: string;
  private commentImagesPath: string;
  private defaultProductImage: string;
  private defaultCommentImage: string;
  private maxAge: number;
  private endpoint: string;
  private marcaImagesPath: string;
  private defaultMarcaImage: string;

  constructor(options: ImageMiddlewareOptions) {
    this.basePath = options.basePath;
    this.productImagesPath = options.productImagesPath;
    this.commentImagesPath = options.commentImagesPath;
    this.defaultProductImage = options.defaultProductImage || 'default-product.png';
    this.defaultCommentImage = options.defaultCommentImage || 'default-comment.png';
    this.maxAge = options.maxAge || 86400;
    this.endpoint = options.endpoint || '/images';
    this.marcaImagesPath = options.marcaImagesPath;
    this.defaultMarcaImage = options.defaultMarcaImage || 'default-marca.png';
  }

  /**
   * Valida que un nombre de archivo sea seguro y válido
   *
   * Previene ataques de path traversal y verifica que:
   * - No esté vacío
   * - No contenga '..' (path traversal)
   * - No contenga caracteres de control peligrosos
   * - Tenga extensión de imagen permitida
   * - No contenga caracteres especiales peligrosos
   * - Sea solo nombre de archivo sin rutas
   *
   * @private
   * @param filename - Nombre del archivo a validar
   * @returns true si el nombre es válido y seguro
   */
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

  /**
   * Obtiene el tipo MIME correcto según la extensión del archivo
   *
   * @private
   * @param filename - Nombre del archivo con extensión
   * @returns Tipo MIME correspondiente o 'application/octet-stream' si no se reconoce
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
  }

  /**
   * Verifica si un archivo existe en el sistema de archivos
   *
   * @private
   * @param filePath - Ruta completa del archivo
   * @returns true si el archivo existe y es un archivo regular
   */
  private fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * Middleware para servir imágenes de productos
   *
   * Sirve archivos de imagen del directorio de productos con validación y fallback.
   * Si la imagen no existe, sirve la imagen por defecto de productos.
   *
   * Características:
   * - Validación de seguridad del nombre de archivo
   * - Headers de caché configurables
   * - Content-Type correcto según extensión
   * - Fallback a imagen por defecto
   * - Logging de accesos y errores
   *
   * @public
   * @async
   * @param req - Express Request con params[0] = nombre del archivo
   * @param res - Express Response object
   * @param next - Express NextFunction
   * @returns void - Envía el archivo directamente a la respuesta
   *
   * @example
   * app.get('/uploads/productos/*', imageMiddleware.serveProductImage);
   * // GET /uploads/productos/iphone_13_1234.jpg
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
   * Middleware para servir imágenes de comentarios
   *
   * Similar a serveProductImage pero para imágenes adjuntas a comentarios.
   * Sirve archivos del directorio de comentarios con validación y fallback.
   *
   * @public
   * @async
   * @param req - Express Request con params[0] = nombre del archivo
   * @param res - Express Response object
   * @param next - Express NextFunction
   * @returns void - Envía el archivo directamente a la respuesta
   *
   * @example
   * app.get('/uploads/comentarios/*', imageMiddleware.serveCommentImage);
   * // GET /uploads/comentarios/comment_1234_uuid.jpg
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

  public serveMarcaImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filename = req.params[0];

      logger.debug(`Solicitud de logo de marca recibida: ${filename}`, {
        originalUrl: req.originalUrl,
        method: req.method
      });

      if (!filename || !this.isValidFilename(filename)) {
        logger.warn(`Nombre de logo de marca inválido: ${filename}`);
        return this.serveDefaultMarcaImage(res);
      }

      const filePath = path.join(this.marcaImagesPath, filename);

      if (!this.fileExists(filePath)) {
        logger.warn(`Logo de marca no encontrado: ${filePath}`);
        return this.serveDefaultMarcaImage(res);
      }

      this.sendImage(res, filePath, filename);

    } catch (error) {
      logger.error('Error al servir logo de marca:', error);
      this.serveDefaultMarcaImage(res);
    }
  };

  /**
   * Método legacy para compatibilidad (sirve imágenes de productos)
   */
  public serveImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return this.serveProductImage(req, res, next);
  };

  /**
   * Sirve la imagen por defecto para productos cuando no se encuentra la solicitada
   *
   * Método helper privado que intenta servir la imagen por defecto configurada
   * para productos. Si la imagen por defecto tampoco existe, retorna un error 404.
   *
   * @private
   * @param res - Express Response object
   * @returns void - Envía la imagen por defecto o un error 404
   *
   * @example
   * // Uso interno cuando una imagen de producto no se encuentra
   * if (!this.fileExists(filePath)) {
   *   return this.serveDefaultProductImage(res);
   * }
   */
  private serveDefaultProductImage(res: Response): void {
    const defaultPath = path.join(this.productImagesPath, this.defaultProductImage);
    if (this.fileExists(defaultPath)) {
      this.sendImage(res, defaultPath, this.defaultProductImage);
    } else {
      res.status(404).json({ error: 'Imagen de producto no encontrada' });
    }
  }

  /**
   * Sirve la imagen por defecto para comentarios cuando no se encuentra la solicitada
   *
   * Similar a serveDefaultProductImage pero para imágenes de comentarios.
   * Intenta servir la imagen por defecto configurada para comentarios.
   *
   * @private
   * @param res - Express Response object
   * @returns void - Envía la imagen por defecto o un error 404
   *
   * @example
   * // Uso interno cuando una imagen de comentario no se encuentra
   * if (!this.fileExists(filePath)) {
   *   return this.serveDefaultCommentImage(res);
   * }
   */
  private serveDefaultCommentImage(res: Response): void {
    const defaultPath = path.join(this.commentImagesPath, this.defaultCommentImage);
    if (this.fileExists(defaultPath)) {
      this.sendImage(res, defaultPath, this.defaultCommentImage);
    } else {
      res.status(404).json({ error: 'Imagen de comentario no encontrada' });
    }
  }

  private serveDefaultMarcaImage(res: Response): void {
    const defaultPath = path.join(this.marcaImagesPath, this.defaultMarcaImage);
    if (this.fileExists(defaultPath)) {
      this.sendImage(res, defaultPath, this.defaultMarcaImage);
    } else {
      res.status(404).json({ error: 'Logo de marca no encontrado' });
    }
  }

  /**
   * Envía un archivo de imagen con headers HTTP apropiados
   *
   * Método helper central que configura los headers de respuesta y envía
   * el archivo de imagen usando Express sendFile(). Configura:
   * - Content-Type correcto según la extensión del archivo
   * - Cache-Control para optimización (public, max-age configurable)
   * - ETag para validación de caché
   * - X-Content-Type-Options para seguridad
   *
   * @private
   * @param res - Express Response object
   * @param filePath - Ruta absoluta del archivo de imagen en el sistema
   * @param filename - Nombre del archivo (usado para determinar MIME type)
   * @returns void - Envía el archivo directamente a la respuesta
   *
   * @example
   * // Uso interno después de validar que el archivo existe
   * const filePath = path.join(this.productImagesPath, 'iphone_13.jpg');
   * this.sendImage(res, filePath, 'iphone_13.jpg');
   * // Respuesta con headers:
   * // Content-Type: image/jpeg
   * // Cache-Control: public, max-age=86400
   * // ETag: "iphone_13.jpg-1234567890"
   * // X-Content-Type-Options: nosniff
   */
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

  /**
   * Valida que todos los directorios de imágenes existan y sean accesibles
   *
   * Método de utilidad que verifica la existencia y validez de los directorios
   * configurados para almacenar imágenes. Debe llamarse durante la inicialización
   * de la aplicación para asegurar que el middleware puede funcionar correctamente.
   *
   * Valida:
   * - Directorio base de uploads
   * - Directorio de imágenes de productos
   * - Directorio de imágenes de comentarios
   *
   * Para cada directorio verifica:
   * - Que exista en el sistema de archivos
   * - Que sea efectivamente un directorio (no un archivo)
   *
   * @public
   * @returns true si todos los directorios son válidos, false si hay algún problema
   *
   * @example
   * // En la inicialización del servidor
   * const imageMiddleware = new StaticImageMiddleware({...});
   * if (!imageMiddleware.validateImagesDirectory()) {
   *   console.error('Error: Directorios de imágenes no configurados correctamente');
   *   process.exit(1);
   * }
   *
   * @example
   * // Resultado exitoso en logs:
   * // INFO: Directorios de imágenes configurados correctamente:
   * //   basePath: /app/uploads
   * //   productImagesPath: /app/uploads/productos
   * //   commentImagesPath: /app/uploads/comentarios
   */
  public validateImagesDirectory(): boolean {
    try {
      // Validar directorios de imágenes
      const directories = [
        this.basePath,
        this.productImagesPath,
        this.commentImagesPath,
        this.marcaImagesPath
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

      logger.debug(`Directorios de imágenes configurados correctamente:`, {
        basePath: this.basePath,
        productImagesPath: this.productImagesPath,
        commentImagesPath: this.commentImagesPath,
        marcaImagesPath: this.marcaImagesPath
      });
      return true;
    } catch (error) {
      logger.error('Error al validar directorios de imágenes:', error);
      return false;
    }
  }

  /**
   * Obtiene información y estadísticas de los directorios de imágenes
   *
   * Proporciona información detallada sobre la configuración de directorios
   * y cuenta el número de archivos de imagen válidos en cada directorio.
   * Útil para monitoreo, debugging y endpoints de estado/salud del sistema.
   *
   * Cuenta solo archivos con extensiones válidas (JPG, JPEG, PNG, WebP, etc.)
   * según la constante ALLOWED_IMAGE_TYPES.
   *
   * @public
   * @returns Objeto con información de directorios y conteos de imágenes
   *
   * @example
   * // En un endpoint de estado del sistema
   * app.get('/api/system/images-info', (req, res) => {
   *   const info = imageMiddleware.getDirectoriesInfo();
   *   res.json(info);
   * });
   *
   * @example
   * // Ejemplo de respuesta:
   * {
   *   basePath: "/app/uploads",
   *   productImagesPath: "/app/uploads/productos",
   *   commentImagesPath: "/app/uploads/comentarios",
   *   productImagesCount: 142,
   *   commentImagesCount: 38
   * }
   */
  public getDirectoriesInfo(): {
    basePath: string;
    productImagesPath: string;
    commentImagesPath: string;
    marcaImagesPath: string;
    productImagesCount: number;
    commentImagesCount: number;
    marcaImagesCount: number;
  } {
    let productImagesCount = 0;
    let commentImagesCount = 0;
    let marcaImagesCount = 0;

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

      if (fs.existsSync(this.marcaImagesPath)) {
        const marcaFiles = fs.readdirSync(this.marcaImagesPath);
        marcaImagesCount = marcaFiles.filter(file => {
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
      marcaImagesPath: this.marcaImagesPath,
      productImagesCount,
      commentImagesCount,
      marcaImagesCount
    };
  }
}

export default StaticImageMiddleware;