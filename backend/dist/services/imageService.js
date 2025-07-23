import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';
class ImageService {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Genera una URL completa para una imagen
     * @param imageName - Nombre del archivo de imagen almacenado en la base de datos
     * @returns URL completa de la imagen o URL de imagen por defecto
     */
    generateImageUrl(imageName) {
        // Si no hay imagen, devolver imagen por defecto
        if (!imageName || imageName.trim() === '') {
            return this.getDefaultImageUrl();
        }
        // Validar que el nombre de la imagen sea seguro
        if (!this.isValidImageName(imageName)) {
            logger.warn(`Nombre de imagen inválido detectado: ${imageName}`);
            return this.getDefaultImageUrl();
        }
        // Generar URL completa
        const imageUrl = `${this.config.baseUrl}${this.config.endpoint}/${imageName}`;
        logger.debug(`URL de imagen generada: ${imageUrl} para archivo: ${imageName}`);
        return imageUrl;
    }
    /**
     * Genera URL de imagen por defecto
     * @returns URL de la imagen por defecto
     */
    getDefaultImageUrl() {
        return `${this.config.baseUrl}${this.config.endpoint}/${this.config.defaultImage}`;
    }
    /**
     * Valida que el nombre de la imagen sea seguro
     * @param imageName - Nombre del archivo a validar
     * @returns true si es válido, false en caso contrario
     */
    isValidImageName(imageName) {
        // Verificar que no contenga caracteres peligrosos para path traversal
        if (imageName.includes('..') || imageName.includes('/') || imageName.includes('\\')) {
            return false;
        }
        // Verificar que tenga una extensión válida
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.avif', '.bmp', '.tiff', '.tif'];
        const extension = path.extname(imageName).toLowerCase();
        if (!validExtensions.includes(extension)) {
            return false;
        }
        // Validación más permisiva: solo rechazar caracteres realmente peligrosos
        // Permitir guiones, puntos, espacios, números y caracteres alfanuméricos
        const dangerousChars = /[\x00-\x1f\x7f<>:"|*\?]/;
        if (dangerousChars.test(imageName)) {
            return false;
        }
        return true;
    }
    /**
     * Verifica si un archivo de imagen existe físicamente
     * @param imageName - Nombre del archivo de imagen
     * @returns true si existe, false en caso contrario
     */
    imageExists(imageName) {
        if (!imageName || !this.isValidImageName(imageName)) {
            return false;
        }
        try {
            const filePath = path.join(this.config.imagesPath, imageName);
            return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
        }
        catch (error) {
            logger.error(`Error al verificar existencia de imagen ${imageName}:`, error);
            return false;
        }
    }
    /**
     * Transforma un objeto producto agregando la URL de imagen
     * @param producto - Objeto producto del modelo Almacen
     * @returns Producto con campo imagen_url agregado
     */
    transformProductWithImageUrl(producto) {
        try {
            const imageName = producto.imagen;
            const imageUrl = this.generateImageUrl(imageName);
            // Convertir el producto a objeto plano
            const productData = producto.toJSON ? producto.toJSON() : producto;
            return {
                ...productData,
                imagen_url: imageUrl,
                imagen_disponible: !!imageName // Solo verificar si existe el nombre, no el archivo físico
            };
        }
        catch (error) {
            logger.error('Error al transformar producto con imagen:', {
                productId: producto.id_producto || 'unknown',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            // Fallback: devolver el producto original
            return producto.toJSON ? producto.toJSON() : producto;
        }
    }
    /**
     * Transforma una lista de productos agregando URLs de imágenes
     * @param productos - Array de productos
     * @returns Array de productos con URLs de imágenes
     */
    transformProductsWithImageUrls(productos) {
        return productos.map(producto => this.transformProductWithImageUrl(producto));
    }
    /**
     * Obtiene información detallada de una imagen
     * @param imageName - Nombre del archivo de imagen
     * @returns Información de la imagen
     */
    getImageInfo(imageName) {
        const existe = imageName ? this.imageExists(imageName) : false;
        const esDefecto = !imageName || !existe;
        const url = this.generateImageUrl(imageName);
        const info = {
            nombre: imageName,
            url: url,
            existe: existe,
            es_defecto: esDefecto
        };
        // Solo agregar ruta completa en desarrollo para debugging
        if (process.env.NODE_ENV === 'development' && imageName && existe) {
            info.ruta_completa = path.join(this.config.imagesPath, imageName);
        }
        return info;
    }
    /**
     * Valida la configuración del servicio
     * @returns true si la configuración es válida
     */
    validateConfiguration() {
        try {
            // Verificar que el directorio de imágenes existe
            if (!fs.existsSync(this.config.imagesPath)) {
                logger.error(`Directorio de imágenes no existe: ${this.config.imagesPath}`);
                return false;
            }
            // Verificar que la imagen por defecto existe
            const defaultImagePath = path.join(this.config.imagesPath, this.config.defaultImage);
            if (!fs.existsSync(defaultImagePath)) {
                logger.warn(`Imagen por defecto no encontrada: ${defaultImagePath}`);
                // No es crítico, solo advertencia
            }
            logger.info('Configuración del servicio de imágenes validada correctamente');
            return true;
        }
        catch (error) {
            logger.error('Error al validar configuración del servicio de imágenes:', error);
            return false;
        }
    }
    /**
     * Obtiene estadísticas del servicio de imágenes
     * @returns Estadísticas del directorio de imágenes
     */
    async getImageStats() {
        try {
            const files = fs.readdirSync(this.config.imagesPath);
            const imageFiles = files.filter(file => this.isValidImageName(file));
            const stats = {
                total_imagenes: imageFiles.length,
                imagenes_por_extension: {},
                tamaño_total_mb: 0
            };
            let totalSize = 0;
            for (const file of imageFiles) {
                const ext = path.extname(file).toLowerCase();
                stats.imagenes_por_extension[ext] = (stats.imagenes_por_extension[ext] || 0) + 1;
                try {
                    const filePath = path.join(this.config.imagesPath, file);
                    const fileStats = fs.statSync(filePath);
                    totalSize += fileStats.size;
                }
                catch (error) {
                    logger.debug(`Error al obtener tamaño de ${file}:`, error);
                }
            }
            stats.tamaño_total_mb = Math.round((totalSize / (1024 * 1024)) * 100) / 100;
            return stats;
        }
        catch (error) {
            logger.error('Error al obtener estadísticas de imágenes:', error);
            throw error;
        }
    }
}
// Crear instancia singleton del servicio
let imageServiceInstance = null;
/**
 * Inicializa el servicio de imágenes con la configuración proporcionada
 * @param config - Configuración del servicio
 * @returns Instancia del servicio de imágenes
 */
export function initializeImageService(config) {
    imageServiceInstance = new ImageService(config);
    // Validar configuración al inicializar
    if (!imageServiceInstance.validateConfiguration()) {
        logger.warn('El servicio de imágenes se inicializó con configuración incompleta');
    }
    return imageServiceInstance;
}
/**
 * Obtiene la instancia actual del servicio de imágenes
 * @returns Instancia del servicio o null si no ha sido inicializado
 */
export function getImageService() {
    return imageServiceInstance;
}
export default ImageService;
//# sourceMappingURL=imageService.js.map