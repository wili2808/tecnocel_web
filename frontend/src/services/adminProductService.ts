/**
 * Servicio para gestión de productos desde el panel de administración
 * Usa axiosAdminConfig para inyectar token admin/empleado automáticamente
 */
import adminApi from '../api/axiosAdminConfig';
import type { Product, Category, Marca, ProductoFormData } from '../types';

interface UploadImagenResponse {
  mensaje: string;
  datos: {
    imagenes: { url_imagen: string; alt_text: string }[];
  };
}

const adminProductService = {
  /**
   * Lista todos los productos, opcionalmente filtrados por búsqueda
   * Usa /productos/buscar cuando hay término, /productos cuando no
   * La paginación y el ordenamiento se manejan en el componente
   */
  listarProductos: async (search?: string): Promise<Product[]> => {
    if (search && search.trim()) {
      const response = await adminApi.get('/almacen/productos/buscar', {
        params: { termino: search.trim() }
      });
      return Array.isArray(response.data) ? response.data : [];
    }

    const response = await adminApi.get('/almacen/productos');
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Obtiene un producto por su ID con todas las relaciones
   */
  obtenerProducto: async (id: number): Promise<Product> => {
    const response = await adminApi.get(`/almacen/productos/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo producto
   */
  crearProducto: async (data: ProductoFormData): Promise<Product> => {
    const response = await adminApi.post('/almacen/productos', data);
    return response.data;
  },

  /**
   * Actualiza un producto existente
   */
  actualizarProducto: async (id: number, data: Partial<ProductoFormData>): Promise<void> => {
    await adminApi.put(`/almacen/productos/${id}`, data);
  },

  /**
   * Elimina un producto
   */
  eliminarProducto: async (id: number): Promise<void> => {
    await adminApi.delete(`/almacen/productos/${id}`);
  },

  /**
   * Actualiza solo el stock de un producto
   */
  actualizarStock: async (id: number, stock: number): Promise<void> => {
    await adminApi.patch(`/almacen/productos/${id}/stock`, { stock });
  },

  /**
   * Sube imágenes de producto al servidor
   * @returns Array de objetos con url_imagen y alt_text
   */
  subirImagenes: async (files: File[]): Promise<{ url_imagen: string; alt_text: string }[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('imagenes', file);
    });

    const response = await adminApi.post<UploadImagenResponse>(
      '/upload/product-images',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      }
    );

    return response.data.datos.imagenes;
  },

  /**
   * Obtiene todas las categorías
   */
  obtenerCategorias: async (): Promise<Category[]> => {
    const response = await adminApi.get('/almacen/categorias');
    return response.data;
  },

  /**
   * Obtiene todas las marcas
   */
  obtenerMarcas: async (): Promise<Marca[]> => {
    const response = await adminApi.get('/marcas');
    return response.data.data || response.data;
  },
};

export default adminProductService;
