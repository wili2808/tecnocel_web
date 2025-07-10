interface ImageServiceConfig {
    baseUrl: string;
    imagesPath: string;
    defaultImage: string;
    endpoint: string;
}
declare class ImageService {
    private config;
    constructor(config: ImageServiceConfig);
    /**
     * Genera una URL completa para una imagen
     * @param imageName - Nombre del archivo de imagen almacenado en la base de datos
     * @returns URL completa de la imagen o URL de imagen por defecto
     */
    generateImageUrl(imageName: string | null): string;
    /**
     * Genera URL de imagen por defecto
     * @returns URL de la imagen por defecto
     */
    private getDefaultImageUrl;
    /**
     * Valida que el nombre de la imagen sea seguro
     * @param imageName - Nombre del archivo a validar
     * @returns true si es válido, false en caso contrario
     */
    private isValidImageName;
    /**
     * Verifica si un archivo de imagen existe físicamente
     * @param imageName - Nombre del archivo de imagen
     * @returns true si existe, false en caso contrario
     */
    imageExists(imageName: string): boolean;
    /**
     * Transforma un objeto producto agregando la URL de imagen
     * @param producto - Objeto producto del modelo Almacen
     * @returns Producto con campo imagen_url agregado
     */
    transformProductWithImageUrl(producto: any): any;
    /**
     * Transforma una lista de productos agregando URLs de imágenes
     * @param productos - Array de productos
     * @returns Array de productos con URLs de imágenes
     */
    transformProductsWithImageUrls(productos: any[]): any[];
    /**
     * Obtiene información detallada de una imagen
     * @param imageName - Nombre del archivo de imagen
     * @returns Información de la imagen
     */
    getImageInfo(imageName: string | null): {
        nombre: string | null;
        url: string;
        existe: boolean;
        es_defecto: boolean;
        ruta_completa?: string;
    };
    /**
     * Valida la configuración del servicio
     * @returns true si la configuración es válida
     */
    validateConfiguration(): boolean;
    /**
     * Obtiene estadísticas del servicio de imágenes
     * @returns Estadísticas del directorio de imágenes
     */
    getImageStats(): Promise<{
        total_imagenes: number;
        imagenes_por_extension: {
            [key: string]: number;
        };
        tamaño_total_mb: number;
    }>;
}
/**
 * Inicializa el servicio de imágenes con la configuración proporcionada
 * @param config - Configuración del servicio
 * @returns Instancia del servicio de imágenes
 */
export declare function initializeImageService(config: ImageServiceConfig): ImageService;
/**
 * Obtiene la instancia actual del servicio de imágenes
 * @returns Instancia del servicio o null si no ha sido inicializado
 */
export declare function getImageService(): ImageService | null;
export default ImageService;
