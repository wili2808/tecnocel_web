import axiosInstance from '../api/axiosConfig';
import type { Product, ProductFilters, ProductoImagen } from '../types/product';

interface GetProductsOptions {
  page?: number;
  limit?: number;
  filters?: ProductFilters;
}

const productService = {
  // Obtener lista de productos con paginación y filtros
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

  // Obtener un producto específico por ID
  getProductById: async (id: number): Promise<Product> => {
    try {
      const response = await axiosInstance.get(`/almacen/productos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  },

  // Obtener productos destacados
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

  // Obtener categorías
  getCategorias: async () => {
    try {
      const response = await axiosInstance.get('/almacen/categorias');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Obtener imágenes de un producto
  getProductImages: async (productId: number): Promise<ProductoImagen[]> => {
    try {
      const response = await axiosInstance.get(`/almacen/productos/${productId}/imagenes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product images:', error);
      throw error;
    }
  },

  // Subir una nueva imagen para un producto
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

  // Actualizar información de una imagen
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

  // Eliminar una imagen de un producto
  deleteProductImage: async (productId: number, imageId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/almacen/productos/${productId}/imagenes/${imageId}`);
    } catch (error) {
      console.error('Error deleting product image:', error);
      throw error;
    }
  },

  // Reordenar imágenes de un producto
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