import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';
// Tipos de archivos de imagen permitidos
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.avif', '.bmp', '.tiff', '.tif'];
// Tipos MIME para cada extensión
const MIME_TYPES = {
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
class StaticImageMiddleware {
    imagesPath;
    defaultImage;
    maxAge;
    constructor(options) {
        this.imagesPath = options.imagesPath;
        this.defaultImage = options.defaultImage || 'default-product.png';
        this.maxAge = options.maxAge || 86400; // 24 hours default
    }
    // Validar nombre de archivo por seguridad (versión simplificada y permisiva)
    isValidFilename(filename) {
        // Verificar que el nombre no esté vacío
        if (!filename || filename.trim().length === 0) {
            return false;
        }
        // Prevenir path traversal attacks (PRINCIPAL RIESGO DE SEGURIDAD)
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return false;
        }
        // Prevenir caracteres de control peligrosos
        if (filename.includes('\0') || filename.length > 255) {
            return false;
        }
        // Validar extensión (PRINCIPAL VALIDACIÓN)
        const ext = path.extname(filename).toLowerCase();
        if (!ext || !ALLOWED_IMAGE_TYPES.includes(ext)) {
            return false;
        }
        // VALIDACIÓN SIMPLIFICADA: Solo rechazar caracteres realmente problemáticos
        // Permitir casi todo excepto caracteres de control y separadores de path
        const dangerousChars = /[\x00-\x1f\x7f<>:"|?*]/;
        if (dangerousChars.test(filename)) {
            return false;
        }
        // Si llegamos aquí, el archivo es seguro
        return true;
    }
    // Obtener tipo MIME del archivo
    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        return MIME_TYPES[ext] || 'application/octet-stream';
    }
    // Verificar si el archivo existe
    fileExists(filePath) {
        try {
            return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
        }
        catch (error) {
            return false;
        }
    }
    // Middleware principal para servir imágenes
    serveImage = async (req, res, next) => {
        try {
            const { filename } = req.params;
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
            const filePath = path.join(this.imagesPath, filename);
            // Verificar si el archivo existe
            if (!this.fileExists(filePath)) {
                logger.debug(`Imagen no encontrada: ${filename}, sirviendo imagen por defecto`);
                // Intentar servir imagen por defecto
                const defaultPath = path.join(this.imagesPath, this.defaultImage);
                if (this.fileExists(defaultPath)) {
                    this.sendImage(res, defaultPath, this.defaultImage);
                    return;
                }
                else {
                    res.status(404).json({
                        error: 'Imagen no encontrada',
                        message: 'La imagen solicitada no existe'
                    });
                    return;
                }
            }
            // Servir la imagen
            logger.debug(`Sirviendo imagen: ${filename}`);
            this.sendImage(res, filePath, filename);
        }
        catch (error) {
            logger.error('Error al servir imagen:', {
                filename: req.params.filename,
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
    sendImage(res, filePath, filename) {
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
            }
            else {
                logger.debug(`Imagen enviada exitosamente: ${filename}`);
            }
        });
    }
    // Middleware para validar que el directorio de imágenes existe
    validateImagesDirectory() {
        try {
            if (!fs.existsSync(this.imagesPath)) {
                logger.error(`Directorio de imágenes no existe: ${this.imagesPath}`);
                return false;
            }
            const stats = fs.statSync(this.imagesPath);
            if (!stats.isDirectory()) {
                logger.error(`La ruta de imágenes no es un directorio: ${this.imagesPath}`);
                return false;
            }
            logger.info(`Directorio de imágenes configurado correctamente: ${this.imagesPath}`);
            return true;
        }
        catch (error) {
            logger.error('Error al validar directorio de imágenes:', error);
            return false;
        }
    }
}
export default StaticImageMiddleware;
//# sourceMappingURL=staticImageMiddleware.js.map