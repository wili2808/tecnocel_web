/**
 * Servicio para gestión de ofertas desde el panel de administración
 * Usa axiosAdminConfig para inyectar token admin/empleado automáticamente
 */
import adminApi from '../api/axiosAdminConfig';
import type { Oferta, Product } from '../types';

/** Datos del formulario para crear/editar una oferta */
export interface OfertaFormData {
  nombre_oferta: string;
  descripcion?: string;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  precio_minimo?: number | null;
  precio_maximo?: number | null;
  limite_uso?: number | null;
  activo?: boolean;
}

/** Datos para asignar un producto a una oferta */
export interface ProductoOfertaAsignacion {
  id_producto: number;
  precio_oferta?: number;
}

/** Producto con datos pivot de la relación oferta-producto */
export interface ProductoEnOferta {
  id_producto: number;
  codigo: string;
  nombre: string;
  precio_venta: string;
  imagen_url?: string | null;
  imagenes?: { url_imagen: string; alt_text?: string | null; es_principal: boolean }[];
  ProductoOferta: {
    id_producto_oferta: number;
    precio_oferta: number | null;
    es_precio_personalizado: boolean;
  };
}

/** Oferta con sus productos asociados incluidos */
export interface OfertaConProductos extends Oferta {
  productos: ProductoEnOferta[];
}

/** Oferta con conteo de productos (para lista admin) */
export interface OfertaConConteo extends Oferta {
  productos_count?: number;
}

/** Oferta con datos pivot del producto (para vista desde el producto) */
export interface OfertaDeProducto {
  id_oferta: number;
  nombre_oferta: string;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  precio_oferta: number | null;
  es_precio_personalizado: boolean;
}

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
      return Array.isArray(response.data) ? response.data : [];
    }
    const response = await adminApi.get('/almacen/productos');
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default adminOfertaService;
