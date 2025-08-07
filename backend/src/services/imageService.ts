import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';
import ProductoImagen from '../models/ProductoImagen.js';

interface ImageServiceConfig {
  baseUrl: string;
  imagesPath: string;
  defaultImage: string;
  endpoint: string;
}

interface ImageInfo {
  nombre: string | null;
  url: string;
  existe: boolean;
  es_defecto: boolean;
  es_principal?: boolean;
  alt_text?: string | null;
  orden?: number;
  ruta_completa?: string;
}

class ImageService {
  private config: ImageServiceConfig;

  constructor(config: ImageServiceConfig) {
    this.config = config;
  }

  /**
   * Genera una URL completa para una imagen
   */
  public generateImageUrl(imageName: string | null): string {
    if (!imageName || imageName.trim() === '') {
      return this.getDefaultImageUrl();
    }

    if (!this.isValidImageName(imageName)) {
      logger.warn(`Nombre de imagen inválido detectado: ${imageName}`);
      return this.getDefaultImageUrl();
    }

    return `${this.config.baseUrl}:${process.env.PORT || 3000}/api/images/${imageName}`;
  }

  /**
   * Genera URL de imagen por defecto
   */
  private getDefaultImageUrl(): string {
    return `${this.config.baseUrl}:${process.env.PORT || 3000}/api/images/${this.config.defaultImage}`;
  }

  /**
   * Valida que el nombre de la imagen sea seguro
   */
  private isValidImageName(imageName: string): boolean {
    if (imageName.includes('..')) {
      return false;
    }

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.avif', '.bmp', '.tiff', '.tif'];
    const extension = path.extname(imageName).toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      return false;
    }

    const dangerousChars = /[\x00-\x1f\x7f<>:"|*\?]/;
    if (dangerousChars.test(imageName)) {
      return false;
    }

    // ✅ Simplificar validación - solo nombres de archivo sin rutas
    // Ya no necesitamos validar rutas porque solo guardamos nombres de archivo
    if (imageName.includes('/') || imageName.includes('\\')) {
      logger.warn(`Nombre de imagen contiene caracteres de ruta no permitidos: ${imageName}`);
      return false;
    }

    return true;
  }

  /**
   * Verifica si un archivo de imagen existe físicamente
   */
  public imageExists(imageName: string): boolean {
    if (!imageName || !this.isValidImageName(imageName)) {
      return false;
    }

    try {
      const filePath = path.join(this.config.imagesPath, imageName);
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (error) {
      logger.error(`Error al verificar existencia de imagen ${imageName}:`, error);
      return false;
    }
  }

  /**
   * Transforma un producto agregando las URLs de imágenes
   */
  public async transformProductWithImageUrls(producto: any): Promise<any> {
    try {
      // Convertir el producto a objeto plano
      const productData = producto.toJSON ? producto.toJSON() : producto;

      // Obtener todas las imágenes del producto
      const imagenes = await ProductoImagen.findAll({
        where: { id_producto: productData.id_producto },
        order: [['es_principal', 'DESC'], ['orden', 'ASC']]
      });

      // Transformar imágenes con estructura consistente
      const imagenesTransformadas = imagenes.map(imagen => ({
        url: this.generateImageUrl(imagen.url_imagen),
        alt_text: imagen.alt_text,
        es_principal: imagen.es_principal,
        orden: imagen.orden
      }));

      // Encontrar la imagen principal
      const imagenPrincipal = imagenes.find(img => img.es_principal);
      
      // Si no hay imagen principal, usar la primera imagen disponible
      const imagenDefault = imagenPrincipal || imagenes[0];
      
      return {
        ...productData,
        imagen_url: imagenDefault ? this.generateImageUrl(imagenDefault.url_imagen) : this.getDefaultImageUrl(),
        imagen_disponible: imagenes.length > 0,
        imagenes: imagenesTransformadas,
        imagen_principal_url: imagenPrincipal ? this.generateImageUrl(imagenPrincipal.url_imagen) : null
      };
    } catch (error) {
      logger.error('Error al transformar producto con imágenes:', {
        productId: producto.id_producto || 'unknown',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      return producto.toJSON ? producto.toJSON() : producto;
    }
  }

  /**
   * Transforma una lista de productos agregando URLs de imágenes
   */
  public async transformProductsWithImageUrls(productos: any[]): Promise<any[]> {
    const transformedProducts = await Promise.all(
      productos.map(producto => this.transformProductWithImageUrls(producto))
    );
    return transformedProducts;
  }

  /**
   * Transforma un comentario agregando las URLs de imágenes
   */
  public async transformCommentWithImageUrls(comentario: any): Promise<any> {
    try {
      // Convertir el comentario a objeto plano
      const commentData = comentario.toJSON ? comentario.toJSON() : comentario;

      // Importar el modelo ComentarioImagen dinámicamente para evitar dependencias circulares
      const { default: ComentarioImagen } = await import('../models/ComentarioImagen.js');

      // Obtener todas las imágenes del comentario
      const imagenes = await ComentarioImagen.findAll({
        where: { 
          id_comentario: commentData.id_comentario
        },
        order: [['es_principal', 'DESC'], ['orden', 'ASC']]
      });

      // Transformar imágenes con estructura consistente
      const imagenesTransformadas = imagenes.map(imagen => ({
        url: this.generateImageUrl(imagen.url_imagen),
        alt_text: imagen.alt_text,
        es_principal: imagen.es_principal,
        orden: imagen.orden
      }));

      return {
        ...commentData,
        imagenes: imagenesTransformadas,
        tiene_imagenes: imagenes.length > 0,
        cantidad_imagenes: imagenes.length
      };
    } catch (error) {
      logger.error('Error al transformar comentario con imágenes:', {
        commentId: comentario.id_comentario || 'unknown',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      return comentario.toJSON ? comentario.toJSON() : comentario;
    }
  }

  /**
   * Transforma una lista de comentarios agregando URLs de imágenes
   */
  public async transformCommentsWithImageUrls(comentarios: any[]): Promise<any[]> {
    const transformedComments = await Promise.all(
      comentarios.map(comentario => this.transformCommentWithImageUrls(comentario))
    );
    return transformedComments;
  }

  /**
   * Obtiene información detallada de una imagen
   */
  public async getImageInfo(imageName: string | null, productId?: number): Promise<ImageInfo> {
    const existe = imageName ? this.imageExists(imageName) : false;
    const esDefecto = !imageName || !existe;
    const url = this.generateImageUrl(imageName);

    const info: ImageInfo = {
      nombre: imageName,
      url: url,
      existe: existe,
      es_defecto: esDefecto
    };

    if (productId && imageName) {
      try {
        const imagen = await ProductoImagen.findOne({
          where: {
            id_producto: productId,
            url_imagen: imageName
          }
        });

        if (imagen) {
          info.es_principal = imagen.es_principal;
          info.alt_text = imagen.alt_text;
          info.orden = imagen.orden;
        }
      } catch (error) {
        logger.error(`Error al obtener información adicional de imagen para producto ${productId}:`, error);
      }
    }

    if (process.env.NODE_ENV === 'development' && imageName && existe) {
      info.ruta_completa = path.join(this.config.imagesPath, imageName);
    }

    return info;
  }

  /**
   * Valida la configuración del servicio
   */
  public validateConfiguration(): boolean {
    try {
      if (!fs.existsSync(this.config.imagesPath)) {
        logger.error(`Directorio de imágenes no existe: ${this.config.imagesPath}`);
        return false;
      }

      const defaultImagePath = path.join(this.config.imagesPath, this.config.defaultImage);
      if (!fs.existsSync(defaultImagePath)) {
        logger.warn(`Imagen por defecto no encontrada: ${defaultImagePath}`);
      }

      logger.info('Configuración del servicio de imágenes validada correctamente');
      return true;
    } catch (error) {
      logger.error('Error al validar configuración del servicio de imágenes:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas del servicio de imágenes
   */
  public async getImageStats(): Promise<{
    total_imagenes: number;
    imagenes_por_extension: { [key: string]: number };
    tamaño_total_mb: number;
    imagenes_por_producto: number;
  }> {
    try {
      const files = fs.readdirSync(this.config.imagesPath);
      const imageFiles = files.filter(file => this.isValidImageName(file));
      
      const stats = {
        total_imagenes: imageFiles.length,
        imagenes_por_extension: {} as { [key: string]: number },
        tamaño_total_mb: 0,
        imagenes_por_producto: 0
      };

      let totalSize = 0;

      for (const file of imageFiles) {
        const ext = path.extname(file).toLowerCase();
        stats.imagenes_por_extension[ext] = (stats.imagenes_por_extension[ext] || 0) + 1;
        
        try {
          const filePath = path.join(this.config.imagesPath, file);
          const fileStats = fs.statSync(filePath);
          totalSize += fileStats.size;
        } catch (error) {
          logger.debug(`Error al obtener tamaño de ${file}:`, error);
        }
      }

      stats.tamaño_total_mb = Math.round((totalSize / (1024 * 1024)) * 100) / 100;

      // Obtener promedio de imágenes por producto
      const totalProductos = await ProductoImagen.count({
        distinct: true,
        col: 'id_producto'
      });

      const totalImagenes = await ProductoImagen.count();
      
      stats.imagenes_por_producto = totalProductos > 0 
        ? Math.round((totalImagenes / totalProductos) * 100) / 100 
        : 0;

      return stats;
    } catch (error) {
      logger.error('Error al obtener estadísticas de imágenes:', error);
      throw error;
    }
  }

  /**
   * Establece una imagen como principal para un producto
   */
  public async setMainImage(productId: number, imageId: number): Promise<boolean> {
    try {
      // Verificar que la imagen existe y pertenece al producto
      const imagen = await ProductoImagen.findOne({
        where: {
          id_imagen: imageId,
          id_producto: productId
        }
      });

      if (!imagen) {
        logger.warn(`Imagen ${imageId} no encontrada para producto ${productId}`);
        return false;
      }

      // Desactivar todas las imágenes principales del producto
      await ProductoImagen.update(
        { es_principal: false },
        { where: { id_producto: productId } }
      );

      // Activar la imagen especificada como principal
      await ProductoImagen.update(
        { es_principal: true },
        { where: { id_imagen: imageId } }
      );

      logger.info(`Imagen ${imageId} establecida como principal para producto ${productId}`);
      return true;
    } catch (error) {
      logger.error('Error al establecer imagen principal:', error);
      return false;
    }
  }

  /**
   * Reordena las imágenes de un producto
   */
  public async reorderImages(productId: number, imageOrder: number[]): Promise<boolean> {
    try {
      // Verificar que todas las imágenes pertenecen al producto
      const imagenes = await ProductoImagen.findAll({
        where: { id_producto: productId }
      });

      if (imagenes.length !== imageOrder.length) {
        logger.warn(`Número de imágenes no coincide con el orden proporcionado para producto ${productId}`);
        return false;
      }

      // Actualizar el orden de cada imagen
      for (let i = 0; i < imageOrder.length; i++) {
        await ProductoImagen.update(
          { orden: i },
          { where: { id_imagen: imageOrder[i] } }
        );
      }

      logger.info(`Orden de imágenes actualizado para producto ${productId}`);
      return true;
    } catch (error) {
      logger.error('Error al reordenar imágenes:', error);
      return false;
    }
  }

  /**
   * Elimina una imagen de producto
   */
  public async deleteProductImage(imageId: number): Promise<boolean> {
    try {
      const imagen = await ProductoImagen.findByPk(imageId);
      if (!imagen) {
        logger.warn(`Imagen ${imageId} no encontrada`);
        return false;
      }

      // Eliminar archivo físico si existe
      const filePath = path.join(this.config.imagesPath, imagen.url_imagen);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Archivo físico eliminado: ${filePath}`);
      }

      // Eliminar registro de la base de datos
      await imagen.destroy();

      logger.info(`Imagen ${imageId} eliminada exitosamente`);
      return true;
    } catch (error) {
      logger.error('Error al eliminar imagen de producto:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las imágenes de un producto
   */
  public async getProductImages(productId: number): Promise<ImageInfo[]> {
    try {
      const imagenes = await ProductoImagen.findAll({
        where: { id_producto: productId },
        order: [['es_principal', 'DESC'], ['orden', 'ASC']]
      });

      return imagenes.map(imagen => ({
        nombre: imagen.url_imagen,
        url: this.generateImageUrl(imagen.url_imagen),
        existe: this.imageExists(imagen.url_imagen),
        es_defecto: false,
        es_principal: imagen.es_principal,
        alt_text: imagen.alt_text,
        orden: imagen.orden
      }));
    } catch (error) {
      logger.error(`Error al obtener imágenes del producto ${productId}:`, error);
      return [];
    }
  }

  /**
   * Valida que solo haya una imagen principal por producto
   */
  public async validateMainImage(productId: number, newMainImageId?: number): Promise<boolean> {
    try {
      const mainImages = await ProductoImagen.count({
        where: { 
          id_producto: productId, 
          es_principal: true 
        }
      });
      
      if (newMainImageId) {
        // Si se está estableciendo una nueva imagen principal, permitir hasta 1
        return mainImages <= 1;
      }
      
      // Debe haber exactamente una imagen principal
      return mainImages === 1;
    } catch (error) {
      logger.error('Error al validar imagen principal:', error);
      return false;
    }
  }

  /**
   * Limpia imágenes huérfanas (sin producto asociado)
   */
  public async cleanOrphanImages(): Promise<number> {
    try {
      const allFiles = fs.readdirSync(this.config.imagesPath);
      const imageFiles = allFiles.filter(file => this.isValidImageName(file));
      
      let deletedCount = 0;

      for (const file of imageFiles) {
        // Verificar si el archivo está referenciado en la base de datos
        const existsInDB = await ProductoImagen.findOne({
          where: { url_imagen: file }
        });

        if (!existsInDB) {
          const filePath = path.join(this.config.imagesPath, file);
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`Imagen huérfana eliminada: ${file}`);
        }
      }

      logger.info(`Limpieza completada. ${deletedCount} imágenes huérfanas eliminadas`);
      return deletedCount;
    } catch (error) {
      logger.error('Error en limpieza de imágenes huérfanas:', error);
      return 0;
    }
  }

  /**
   * Obtiene la imagen principal de un producto
   */
  public async getMainImage(productId: number): Promise<ImageInfo | null> {
    try {
      const imagenPrincipal = await ProductoImagen.findOne({
        where: { 
          id_producto: productId,
          es_principal: true
        }
      });

      if (!imagenPrincipal) {
        // Si no hay imagen principal, buscar la primera imagen disponible
        const primeraImagen = await ProductoImagen.findOne({
          where: { id_producto: productId },
          order: [['orden', 'ASC']]
        });

        if (!primeraImagen) {
          return null;
        }

        return {
          nombre: primeraImagen.url_imagen,
          url: this.generateImageUrl(primeraImagen.url_imagen),
          existe: this.imageExists(primeraImagen.url_imagen),
          es_defecto: false,
          es_principal: false,
          alt_text: primeraImagen.alt_text,
          orden: primeraImagen.orden,
          ruta_completa: path.join(this.config.imagesPath, primeraImagen.url_imagen)
        };
      }

      return {
        nombre: imagenPrincipal.url_imagen,
        url: this.generateImageUrl(imagenPrincipal.url_imagen),
        existe: this.imageExists(imagenPrincipal.url_imagen),
        es_defecto: false,
        es_principal: true,
        alt_text: imagenPrincipal.alt_text,
        orden: imagenPrincipal.orden,
        ruta_completa: path.join(this.config.imagesPath, imagenPrincipal.url_imagen)
      };
    } catch (error) {
      logger.error('Error al obtener imagen principal:', {
        productId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      return null;
    }
  }
}

// Crear instancia singleton del servicio
let imageServiceInstance: ImageService | null = null;

/**
 * Inicializa el servicio de imágenes con la configuración proporcionada
 */
export function initializeImageService(config: ImageServiceConfig): ImageService {
  imageServiceInstance = new ImageService(config);
  
  if (!imageServiceInstance.validateConfiguration()) {
    logger.warn('El servicio de imágenes se inicializó con configuración incompleta');
  }
  
  return imageServiceInstance;
}

/**
 * Obtiene la instancia actual del servicio de imágenes
 */
export function getImageService(): ImageService | null {
  return imageServiceInstance;
}

export default ImageService;