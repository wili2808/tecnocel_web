import axiosInstance from '../api/axiosConfig';
import type { Product, ProductFilters, ProductoImagen } from '../types';

/**
 * Opciones para obtener productos con paginación y filtros
 */
interface GetProductsOptions {
  page?: number;
  limit?: number;
  filters?: ProductFilters;
}

/**
 * Servicio para manejar todas las operaciones relacionadas con productos
 * Incluye gestión de productos, categorías, marcas e imágenes
 */
const productService = {
  /**
   * Obtiene una lista paginada de productos con filtros opcionales
   * @param options - Opciones de paginación y filtros
   * @param options.page - Número de página (por defecto: 1)
   * @param options.limit - Límite de productos por página (por defecto: 12)
   * @param options.filters - Filtros de búsqueda opcionales
   * @returns Promise con array de productos
   */
  getProducts: async ({ page = 1, limit = 12, filters }: GetProductsOptions = {}): Promise<Product[]> => {
    try {
      const response = await axiosInstance.get('/almacen/productos', {
        params: {
          page,
          limit,
          ...filters
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Obtiene un producto específico por su ID
   * @param id - ID único del producto
   * @param signal - AbortSignal para cancelar la request (opcional)
   * @returns Promise con los datos del producto
   */
  getProductById: async (id: number, signal?: AbortSignal): Promise<Product> => {
    try {
      const response = await axiosInstance.get(`/almacen/productos/${id}`, { signal });
      return response.data;
    } catch (error) {
      // No loguear errores de cancelación (AbortError)
      if (error instanceof Error && error.name === 'AbortError') {
        console.debug('Request al producto cancelado');
        throw error;
      }
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  },

  /**
   * Obtiene productos destacados para mostrar en secciones especiales
   * @param limit - Número máximo de productos destacados (por defecto: 6)
   * @returns Promise con array de productos destacados
   */
  getFeaturedProducts: async (limit: number = 6): Promise<Product[]> => {
    try {
      const response = await axiosInstance.get('/almacen/productos/destacados', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las categorías disponibles de productos
   * @returns Promise con array de categorías
   */
  getCategorias: async () => {
    try {
      const response = await axiosInstance.get('/almacen/categorias');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las marcas disponibles de productos
   * Maneja tanto el formato {data: [...]} como el formato directo
   * @returns Promise con array de marcas
   */
  getMarcas: async () => {
    try {
      const response = await axiosInstance.get('/marcas');
      return response.data.data || response.data; // Manejar tanto el formato {data: [...]} como el formato directo
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las imágenes asociadas a un producto específico
   * @param productId - ID del producto
   * @returns Promise con array de imágenes del producto
   */
  getProductImages: async (productId: number): Promise<ProductoImagen[]> => {
    try {
      const response = await axiosInstance.get(`/almacen/productos/${productId}/imagenes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product images:', error);
      throw error;
    }
  },

  /**
   * Sube una nueva imagen para un producto específico
   * @param productId - ID del producto
   * @param imageFile - Archivo de imagen a subir
   * @param isPrincipal - Indica si la imagen debe ser la principal (por defecto: false)
   * @returns Promise con los datos de la imagen subida
   */
  uploadProductImage: async (productId: number, imageFile: File, isPrincipal: boolean = false): Promise<ProductoImagen> => {
    try {
      const formData = new FormData();
      formData.append('imagen', imageFile);
      formData.append('es_principal', String(isPrincipal));

      const response = await axiosInstance.post(
        `/almacen/productos/${productId}/imagenes`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  },

  /**
   * Actualiza la información de una imagen específica de un producto
   * @param productId - ID del producto
   * @param imageId - ID de la imagen a actualizar
   * @param data - Datos a actualizar (alt_text, es_principal, orden)
   * @returns Promise con los datos actualizados de la imagen
   */
  updateProductImage: async (
    productId: number,
    imageId: number,
    data: {
      alt_text?: string;
      es_principal?: boolean;
      orden?: number;
    }
  ): Promise<ProductoImagen> => {
    try {
      const response = await axiosInstance.patch(
        `/almacen/productos/${productId}/imagenes/${imageId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating product image:', error);
      throw error;
    }
  },

  /**
   * Elimina una imagen específica de un producto
   * @param productId - ID del producto
   * @param imageId - ID de la imagen a eliminar
   * @returns Promise que se resuelve cuando la imagen es eliminada
   */
  deleteProductImage: async (productId: number, imageId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/almacen/productos/${productId}/imagenes/${imageId}`);
    } catch (error) {
      console.error('Error deleting product image:', error);
      throw error;
    }
  },

  /**
   * Reordena las imágenes de un producto según el orden especificado
   * @param productId - ID del producto
   * @param imageOrder - Array con el nuevo orden de las imágenes
   * @returns Promise que se resuelve cuando el orden es actualizado
   */
  reorderProductImages: async (productId: number, imageOrder: { id_imagen: number; orden: number }[]): Promise<void> => {
    try {
      await axiosInstance.put(`/almacen/productos/${productId}/imagenes/orden`, {
        orden: imageOrder
      });
    } catch (error) {
      console.error('Error reordering product images:', error);
      throw error;
    }
  }
};

export default productService;