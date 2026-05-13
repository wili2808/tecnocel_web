import adminApi from '../api/axiosAdminConfig';
import type { Product, Category, Marca, ProductoFormData, TipoCaracteristica, ProductoCaracteristica } from '../types';

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
  listarProductos: async (
    search?: string, 
    limit = 10, 
    page = 1, 
    sortBy?: string, 
    order?: 'ASC' | 'DESC',
    es_destacado?: boolean,
    ver_inactivos = true,
    solo_inactivos = false
  ): Promise<{ items: Product[], total: number }> => {
    const params: any = { 
      limit, 
      page, 
      sortBy, 
      order, 
      es_destacado, 
      ver_inactivos, 
      solo_inactivos 
    };

    if (search && search.trim()) {
      params.busqueda = search.trim();
    }

    const response = await adminApi.get('/almacen/productos', { params });
    
    // El backend devuelve { success: true, data: { items, pagination: { total } } }
    // o a veces { success: true, data: [...], pagination: { total } }
    const result = response.data;
    
    if (result.data && result.data.items) {
      return {
        items: result.data.items,
        total: result.data.pagination?.total || result.data.items.length
      };
    }
    
    // Caso de fallback: { success: true, data: [...] }
    const items = Array.isArray(result.data) ? result.data : [];
    return {
      items,
      total: result.pagination?.total || items.length
    };
  },

  /**
   * Obtiene un producto por su ID con todas las relaciones
   */
  obtenerProducto: async (id: number): Promise<Product> => {
    const response = await adminApi.get(`/almacen/productos/${id}`);
    // getProductById devuelve { success, data: {...} }
    return response.data.data || response.data;
  },

  /**
   * Crea un nuevo producto
   */
  crearProducto: async (data: ProductoFormData): Promise<Product> => {
    const response = await adminApi.post('/almacen/productos', data);
    return response.data.data || response.data;
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
      '/uploads/product-images',
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
  obtenerCategorias: async (ver_inactivos = true, solo_inactivos = false): Promise<Category[]> => {
    const response = await adminApi.get('/almacen/categorias', {
      params: { ver_inactivos, solo_inactivos }
    });
    // getAllCategories devuelve { success, data: [...] }
    return response.data.data || response.data;
  },

  /**
   * Obtiene todas las marcas
   */
  obtenerMarcas: async (ver_inactivos = true, solo_inactivos = false): Promise<Marca[]> => {
    const response = await adminApi.get('/marcas', {
      params: { ver_inactivos, solo_inactivos }
    });
    return response.data.data || response.data;
  },

  // --- CARACTERÍSTICAS DE PRODUCTOS ---

  /**
   * Obtiene todos los tipos de características activos
   */
  obtenerTiposCaracteristicas: async (ver_inactivos = true, solo_inactivos = false): Promise<TipoCaracteristica[]> => {
    const response = await adminApi.get('/caracteristicas/tipos', {
      params: { ver_inactivos, solo_inactivos }
    });
    return response.data.data || [];
  },

  /**
   * Crea un nuevo tipo de característica
   */
  crearTipoCaracteristica: async (data: {
    nombre_tipo: string;
    descripcion?: string;
    tipo_dato: string;
    unidad_medida?: string;
    opciones_seleccion?: string[];
  }): Promise<TipoCaracteristica> => {
    const response = await adminApi.post('/caracteristicas/tipos', data);
    return response.data.data;
  },

  /**
   * Obtiene las características de un producto específico
   */
  obtenerCaracteristicasProducto: async (idProducto: number): Promise<ProductoCaracteristica[]> => {
    const response = await adminApi.get(`/caracteristicas/producto/${idProducto}`);
    return response.data.data || [];
  },

  /**
   * Crea una nueva marca
   */
  crearMarca: async (data: { nombre_marca: string; descripcion_marca?: string; activo?: boolean }): Promise<Marca> => {
    const response = await adminApi.post('/marcas', data);
    return response.data.data;
  },

  /**
   * Crea una nueva categoría
   */
  crearCategoria: async (data: { nombre_categoria: string; activo?: boolean }): Promise<Category> => {
    const response = await adminApi.post('/almacen/categorias', data);
    return response.data.data;
  },

  // --- CRUD COMPLETO — MARCAS ---

  actualizarMarca: async (id: number, data: { nombre_marca: string; descripcion_marca?: string; activo?: boolean }): Promise<Marca> => {
    const response = await adminApi.put(`/marcas/${id}`, data);
    return response.data.data;
  },

  eliminarMarca: async (id: number): Promise<void> => {
    await adminApi.delete(`/marcas/${id}`);
  },

  /**
   * Sube el logo de una marca al servidor
   * @returns Objeto con filename y url del logo subido
   */
  uploadMarcaLogo: async (id_marca: number, file: File): Promise<{ filename: string; url: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await adminApi.post(`/uploads/marca-logo/${id_marca}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  },

  // --- CRUD COMPLETO — CATEGORÍAS ---

  actualizarCategoria: async (id: number, data: { nombre_categoria: string; activo?: boolean }): Promise<Category> => {
    const response = await adminApi.put(`/almacen/categorias/${id}`, data);
    return response.data.data;
  },

  eliminarCategoria: async (id: number): Promise<void> => {
    await adminApi.delete(`/almacen/categorias/${id}`);
  },

  // --- CRUD COMPLETO — TIPOS DE CARACTERÍSTICAS ---

  actualizarTipoCaracteristica: async (id: number, data: Partial<TipoCaracteristica>): Promise<TipoCaracteristica> => {
    const response = await adminApi.put(`/caracteristicas/tipos/${id}`, data);
    return response.data.data;
  },

  eliminarTipoCaracteristica: async (id: number): Promise<void> => {
    await adminApi.delete(`/caracteristicas/tipos/${id}`);
  },
};

export default adminProductService;