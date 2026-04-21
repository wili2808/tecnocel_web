import adminApi from '../api/axiosAdminConfig';
import type { Oferta, Product, OfertaFormData, ProductoOfertaAsignacion, OfertaConProductos, OfertaConConteo, OfertaDeProducto } from '../types';

const adminOfertaService = {
  /**
   * Lista todas las ofertas (activas e inactivas)
   */
  listarOfertas: async (): Promise<OfertaConConteo[]> => {
    const response = await adminApi.get('/ofertas/todas');
    return response.data.data || [];
  },

  /**
   * Obtiene una oferta por ID con sus productos asociados
   */
  obtenerOferta: async (id: number): Promise<OfertaConProductos> => {
    const response = await adminApi.get(`/ofertas/${id}`);
    return response.data.data;
  },

  /**
   * Crea una nueva oferta
   */
  crearOferta: async (data: OfertaFormData): Promise<Oferta> => {
    const response = await adminApi.post('/ofertas', data);
    return response.data.data;
  },

  /**
   * Actualiza una oferta existente
   */
  actualizarOferta: async (id: number, data: Partial<OfertaFormData>): Promise<void> => {
    await adminApi.put(`/ofertas/${id}`, data);
  },

  /**
   * Elimina (desactiva) una oferta
   */
  eliminarOferta: async (id: number): Promise<void> => {
    await adminApi.delete(`/ofertas/${id}`);
  },

  /**
   * Asigna productos a una oferta
   */
  asignarProductos: async (idOferta: number, productos: ProductoOfertaAsignacion[]): Promise<void> => {
    await adminApi.post(`/ofertas/${idOferta}/productos`, { productos });
  },

  /**
   * Remueve un producto de una oferta
   */
  removerProducto: async (idOferta: number, idProducto: number): Promise<void> => {
    await adminApi.delete(`/ofertas/${idOferta}/productos/${idProducto}`);
  },

  /**
   * Obtiene todas las ofertas asociadas a un producto (para vista admin)
   */
  obtenerOfertasDeProducto: async (idProducto: number): Promise<OfertaDeProducto[]> => {
    const response = await adminApi.get(`/ofertas/producto/${idProducto}`);
    return response.data.data || [];
  },

  /**
   * Busca productos para el selector de asignación
   * Reutiliza el endpoint de almacen
   */
  buscarProductos: async (search?: string): Promise<Product[]> => {
    if (search && search.trim()) {
      const response = await adminApi.get('/almacen/productos/buscar', {
        params: { termino: search.trim() }
      });
      // searchProducts devuelve { success, data: [...] }
      return response.data.data || response.data;
    }
    const response = await adminApi.get('/almacen/productos', {
      params: { limit: 1000 }
    });
    // Con paginación: { success, data: { items, pagination } }
    const data = response.data.data;
    return Array.isArray(data) ? data : data.items || [];
  },
};

export default adminOfertaService;