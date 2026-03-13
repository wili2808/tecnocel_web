import path from 'path';
import fs from 'fs';
import logger from './loggerService.js';
import ProductoImagen from '../models/ProductoImagen.js';
import sequelize from '../config/database.js';

// Tipos de imagen soportados
export enum ImageType {
  PRODUCT = 'product',
  COMMENT = 'comment',
  BRAND = 'brand'
}

interface ImageServiceConfig {
  baseUrl: string;
  basePath: string;
  productImagesPath: string;
  commentImagesPath: string;
  defaultProductImage: string;
  defaultCommentImage: string;
  endpoint: string;
  useCloudinary?: boolean;
  marcaImagesPath: string;
  defaultMarcaImage: string;
}

interface ImageInfo {
  nombre: string | null;
  url: string;
  existe: boolean;
  es_defecto: boolean;
  alt_text?: string | null;
  ruta_completa?: string;
  tipo?: ImageType;
}

class ImageService {
  private config: ImageServiceConfig;

  constructor(config: ImageServiceConfig) {
    this.config = config;
    this.ensureDirectoriesExist();
  }

  /**
   * Asegura que los directorios de imágenes existan
   */
  private ensureDirectoriesExist(): void {
    if (this.config.useCloudinary) {
      return;
    }

    const directories = [
      this.config.basePath,
      this.config.productImagesPath,
      this.config.commentImagesPath,
      this.config.marcaImagesPath
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
          logger.info(`Directorio creado: ${dir}`);
        } catch (error) {
          logger.error(`Error al crear directorio ${dir}:`, error);
        }
      }
    });
  }

  /**
   * Obtiene la ruta del directorio según el tipo de imagen
   */
  private getImagesPath(imageType: ImageType): string {
    switch (imageType) {
      case ImageType.PRODUCT:
        return this.config.productImagesPath;
      case ImageType.COMMENT:
        return this.config.commentImagesPath;
      case ImageType.BRAND:
        return this.config.marcaImagesPath;
      default:
        return this.config.basePath;
    }
  }

  /**
   * Obtiene la imagen por defecto según el tipo
   */
  private getDefaultImage(imageType: ImageType): string {
    switch (imageType) {
      case ImageType.PRODUCT:
        return this.config.defaultProductImage;
      case ImageType.COMMENT:
        return this.config.defaultCommentImage;
      case ImageType.BRAND:
        return this.config.defaultMarcaImage;
      default:
        return this.config.defaultProductImage;
    }
  }

  /**
   * Genera una URL completa para una imagen según su tipo
   */
  public generateImageUrl(imageName: string | null, imageType: ImageType = ImageType.PRODUCT): string {
    if (!imageName || imageName.trim() === '') {
      return this.getDefaultImageUrl(imageType);
    }

    if (/^https?:\/\//i.test(imageName)) {
      return imageName;
    }

    if (!this.isValidImageName(imageName)) {
      logger.warn(`Nombre de imagen inválido detectado: ${imageName}`);
      return this.getDefaultImageUrl(imageType);
    }

    const endpoint = imageType === ImageType.BRAND
      ? 'marca-images'
      : imageType === ImageType.COMMENT
      ? 'comment-images'
      : 'images';
    return `${this.config.baseUrl}:${process.env.PORT || 3000}/api/${endpoint}/${imageName}`;
  }

  /**
   * Genera URL de imagen por defecto según el tipo
   */
  private getDefaultImageUrl(imageType: ImageType): string {
    const defaultImage = this.getDefaultImage(imageType);
    if (/^https?:\/\//i.test(defaultImage)) {
      return defaultImage;
    }
    const endpoint = imageType === ImageType.BRAND
      ? 'marca-images'
      : imageType === ImageType.COMMENT
      ? 'comment-images'
      : 'images';
    return `${this.config.baseUrl}:${process.env.PORT || 3000}/api/${endpoint}/${defaultImage}`;
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

    // Solo nombres de archivo sin rutas
    if (imageName.includes('/') || imageName.includes('\\')) {
      logger.warn(`Nombre de imagen contiene caracteres de ruta no permitidos: ${imageName}`);
      return false;
    }

    return true;
  }

  /**
   * Verifica si un archivo de imagen existe físicamente
   */
  public imageExists(imageName: string, imageType: ImageType = ImageType.PRODUCT): boolean {
    if (!imageName) {
      return false;
    }

    if (/^https?:\/\//i.test(imageName)) {
      return true;
    }

    if (!this.isValidImageName(imageName)) {
      return false;
    }

    try {
      const imagesPath = this.getImagesPath(imageType);
      const filePath = path.join(imagesPath, imageName);
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
      const productData = producto.toJSON ? producto.toJSON() : producto;

      // Obtener todas las imágenes del producto
      const imagenes = await ProductoImagen.findAll({
        where: { 
          id_producto: productData.id_producto
        },
        order: [['es_principal', 'DESC'], ['orden', 'ASC']]
      });

      // Transformar imágenes con estructura consistente
      const imagenesTransformadas = imagenes.map(imagen => ({
        url: this.generateImageUrl(imagen.url_imagen, ImageType.PRODUCT),
        url_imagen: imagen.url_imagen,
        alt_text: imagen.alt_text,
        es_principal: imagen.es_principal,
        orden: imagen.orden,
        tipo: ImageType.PRODUCT
      }));

      return {
        ...productData,
        imagenes: imagenesTransformadas,
        imagen_url: imagenesTransformadas.length > 0 ? imagenesTransformadas[0].url : this.getDefaultImageUrl(ImageType.PRODUCT),
        tiene_imagenes: imagenes.length > 0,
        cantidad_imagenes: imagenes.length,
        imagen_disponible: imagenes.length > 0
      };
    } catch (error) {
      logger.error('Error al transformar producto con imágenes:', {
        productId: producto.id_producto || 'unknown',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      return {
        ...(producto.toJSON ? producto.toJSON() : producto),
        imagen_url: this.getDefaultImageUrl(ImageType.PRODUCT),
        imagenes: [],
        tiene_imagenes: false,
        cantidad_imagenes: 0,
        imagen_disponible: false
      };
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
      const commentData = comentario.toJSON ? comentario.toJSON() : comentario;

      // Importar el modelo ComentarioImagen dinámicamente
      const { default: ComentarioImagen } = await import('../models/ComentarioImagen.js');

      // Obtener todas las imágenes del comentario
      const imagenes = await ComentarioImagen.findAll({
        where: { 
          id_comentario: commentData.id_comentario
        },
        order: [['fyh_creacion', 'ASC']]
      });

      // Transformar imágenes con estructura consistente
      const imagenesTransformadas = imagenes.map(imagen => ({
        id_imagen: imagen.id_imagen,
        imagen_url: this.generateImageUrl(imagen.url_imagen, ImageType.COMMENT),
        alt_text: imagen.alt_text,
        tipo: ImageType.COMMENT
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
  public async getImageInfo(imageName: string | null, imageType: ImageType = ImageType.PRODUCT, productId?: number): Promise<ImageInfo> {
    const existe = imageName ? this.imageExists(imageName, imageType) : false;
    const esDefecto = !imageName || !existe;
    const url = this.generateImageUrl(imageName, imageType);

    const info: ImageInfo = {
      nombre: imageName,
      url: url,
      existe: existe,
      es_defecto: esDefecto,
      tipo: imageType
    };

    if (productId && imageName && imageType === ImageType.PRODUCT) {
      try {
        const imagen = await ProductoImagen.findOne({
          where: {
            id_producto: productId,
            url_imagen: imageName
          }
        });

        if (imagen) {
          info.alt_text = imagen.alt_text;
        }
      } catch (error) {
        logger.error(`Error al obtener información adicional de imagen para producto ${productId}:`, error);
      }
    }

    if (process.env.NODE_ENV === 'development' && imageName && existe) {
      const imagesPath = this.getImagesPath(imageType);
      info.ruta_completa = path.join(imagesPath, imageName);
    }

    return info;
  }

  /**
   * Valida la configuración del servicio
   */
  public validateConfiguration(): boolean {
    if (this.config.useCloudinary) {
      return true;
    }

    const directories = [
      this.config.basePath,
      this.config.productImagesPath,
      this.config.commentImagesPath,
      this.config.marcaImagesPath
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        logger.error(`Directorio de imágenes no existe: ${dir}`);
        return false;
      }
    }

    // Verificar imágenes por defecto
    const defaultProductPath = path.join(this.config.productImagesPath, this.config.defaultProductImage);
    const defaultCommentPath = path.join(this.config.commentImagesPath, this.config.defaultCommentImage);

    if (!fs.existsSync(defaultProductPath)) {
      logger.warn(`Imagen por defecto de productos no encontrada: ${defaultProductPath}`);
    }

    if (!fs.existsSync(defaultCommentPath)) {
      logger.warn(`Imagen por defecto de comentarios no encontrada: ${defaultCommentPath}`);
    }

    const defaultMarcaPath = path.join(this.config.marcaImagesPath, this.config.defaultMarcaImage);
    if (!fs.existsSync(defaultMarcaPath)) {
      logger.warn(`Imagen por defecto de marcas no encontrada: ${defaultMarcaPath}`);
    }

    return true;
  }

  /**
   * Obtiene estadísticas de imágenes
   */
  public async getImageStats(): Promise<{
    total_imagenes: number;
    imagenes_por_extension: { [key: string]: number };
    tamaño_total_mb: number;
    imagenes_por_producto: number;
    imagenes_productos: number;
    imagenes_comentarios: number;
  }> {
    const stats = {
      total_imagenes: 0,
      imagenes_por_extension: {} as { [key: string]: number },
      tamaño_total_mb: 0,
      imagenes_por_producto: 0,
      imagenes_productos: 0,
      imagenes_comentarios: 0
    };

    try {
      if (this.config.useCloudinary) {
        return stats;
      }

      // Contar imágenes de productos
      const productFiles = fs.readdirSync(this.config.productImagesPath);
      const productImages = productFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
      });

      // Contar imágenes de comentarios
      const commentFiles = fs.readdirSync(this.config.commentImagesPath);
      const commentImages = commentFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
      });

      // Combinar todas las imágenes para estadísticas generales
      const allImages = [...productImages, ...commentImages];

      stats.total_imagenes = allImages.length;
      stats.imagenes_productos = productImages.length;
      stats.imagenes_comentarios = commentImages.length;

      // Calcular tamaño total y extensiones
      for (const file of allImages) {
        const ext = path.extname(file).toLowerCase();
        stats.imagenes_por_extension[ext] = (stats.imagenes_por_extension[ext] || 0) + 1;

        try {
          const filePath = allImages.includes(file) 
            ? path.join(this.config.productImagesPath, file)
            : path.join(this.config.commentImagesPath, file);
          
          if (fs.existsSync(filePath)) {
            const fileStats = fs.statSync(filePath);
            stats.tamaño_total_mb += fileStats.size / (1024 * 1024);
          }
        } catch (error) {
          logger.warn(`Error al obtener estadísticas de archivo ${file}:`, error);
        }
      }

      // Calcular promedio de imágenes por producto
      const totalProductos = await ProductoImagen.count({
        distinct: true,
        col: 'id_producto'
      });

      const totalImagenes = await ProductoImagen.count();
      stats.imagenes_por_producto = totalProductos > 0
        ? Math.round((totalImagenes / totalProductos) * 100) / 100
        : 0;

    } catch (error) {
      logger.error('Error al obtener estadísticas de imágenes:', error);
    }

    return stats;
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

      // Quitar principal de todas las imágenes del producto
      await ProductoImagen.update(
        { es_principal: false },
        { where: { id_producto: productId } }
      );

      // Establecer la imagen seleccionada como principal
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
      const imagenes = await ProductoImagen.findAll({
        where: { id_producto: productId }
      });

      for (let i = 0; i < imageOrder.length; i++) {
        const imageId = imageOrder[i];
        await ProductoImagen.update(
          { orden: i + 1 },
          { where: { id_imagen: imageId, id_producto: productId } }
        );
      }

      logger.info(`Imágenes reordenadas para producto ${productId}`);
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
        return false;
      }

      // Eliminar archivo físico
      const filePath = path.join(this.config.productImagesPath, imagen.url_imagen);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }

      // Eliminar registro de la base de datos
      await imagen.destroy();

      logger.info(`Imagen de producto eliminada: ${imagen.url_imagen}`);
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

      return await Promise.all(
        imagenes.map(imagen => this.getImageInfo(imagen.url_imagen, ImageType.PRODUCT, productId))
      );
    } catch (error) {
      logger.error('Error al obtener imágenes de producto:', error);
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
        // Si estamos estableciendo una nueva imagen principal, debe haber máximo 1
        return mainImages <= 1;
      } else {
        // Si no estamos estableciendo una nueva, debe haber exactamente 1
        return mainImages === 1;
      }
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
      if (this.config.useCloudinary) {
        return 0;
      }
      const allFiles = fs.readdirSync(this.config.productImagesPath);
      let deletedCount = 0;

      for (const file of allFiles) {
        if (!this.isValidImageName(file)) continue;

        const existsInDB = await ProductoImagen.findOne({
          where: { url_imagen: file }
        });

        if (!existsInDB) {
          const filePath = path.join(this.config.productImagesPath, file);
          await fs.promises.unlink(filePath);
          deletedCount++;
          logger.info(`Imagen huérfana eliminada: ${file}`);
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error('Error al limpiar imágenes huérfanas:', error);
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

      if (imagenPrincipal) {
        return await this.getImageInfo(imagenPrincipal.url_imagen, ImageType.PRODUCT, productId);
      }

      // Si no hay imagen principal, obtener la primera imagen
      const primeraImagen = await ProductoImagen.findOne({
        where: { id_producto: productId },
        order: [['orden', 'ASC']]
      });

      if (primeraImagen) {
        const info = await this.getImageInfo(primeraImagen.url_imagen, ImageType.PRODUCT, productId);
        if (process.env.NODE_ENV === 'development') {
          info.ruta_completa = path.join(this.config.productImagesPath, primeraImagen.url_imagen);
        }
        return info;
      }

      return null;
    } catch (error) {
      logger.error('Error al obtener imagen principal:', error);
      return null;
    }
  }
}

// Singleton pattern para el servicio de imágenes
let imageServiceInstance: ImageService | null = null;

export function initializeImageService(config: ImageServiceConfig): ImageService {
  if (!imageServiceInstance) {
    imageServiceInstance = new ImageService(config);
    
    if (!imageServiceInstance.validateConfiguration()) {
      logger.warn('La configuración del servicio de imágenes tiene problemas');
    }
  }
  return imageServiceInstance;
}

export function getImageService(): ImageService | null {
  return imageServiceInstance;
}

export default ImageService;



