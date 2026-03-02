import type { Product } from './product';

// ============================================================================
// TIPOS BASE DE OFERTAS - Tabla tb_ofertas
// ============================================================================

/**
 * Interfaz base para Ofertas - Tabla tb_ofertas
 */
export interface Oferta {
  id_oferta: number;
  nombre_oferta: string;
  descripcion?: string | null;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  precio_minimo?: number | null;
  precio_maximo?: number | null;
  limite_uso?: number | null;
  uso_actual: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  productos_count?: number;
}

/**
 * Información de oferta aplicada a un item del carrito
 */
export interface OfertaAplicada {
  id_oferta: number | null;
  nombre_oferta?: string | null;
  descuento_porcentaje: number | null;
  precio_oferta: number | null;
}

// ============================================================================
// TIPOS PARA SERVICIO PÚBLICO DE OFERTAS (ofertaService)
// ============================================================================

/**
 * Respuesta del servidor al obtener ofertas con conteo
 */
export interface OfertaResponse {
  success: boolean;
  data: Oferta[];
  count: number;
}

/**
 * Respuesta del servidor al obtener productos en oferta con paginación
 */
export interface ProductosOfertaResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

/**
 * Respuesta del servidor con detalle completo de una oferta
 */
export interface OfertaDetalleResponse {
  success: boolean;
  data: Oferta & {
    productos: Product[];
    productosCount: number;
  };
}

/**
 * Respuesta del servidor con estadísticas generales de ofertas
 */
export interface OfertasEstadisticasResponse {
  success: boolean;
  data: {
    total: number;
    activas: number;
    expiradas: number;
    productosEnOferta: number;
    promedioDescuento: number;
  };
}

// ============================================================================
// TIPOS PARA CONTEXTO GLOBAL DE OFERTAS
// ============================================================================

/**
 * Oferta enriquecida con información adicional para el contexto global
 * Incluye productos del catálogo público y metadatos calculados
 */
export interface OfertaConInfo extends Oferta {
  productos?: Product[];
  productosCount?: number;
  isActive?: boolean;
  timeRemaining?: string;
}

// ============================================================================
// TIPOS PARA ADMINISTRACIÓN DE OFERTAS (adminOfertaService)
// ============================================================================

/**
 * Datos del formulario para crear/editar una oferta
 */
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

/**
 * Datos para asignar un producto a una oferta
 */
export interface ProductoOfertaAsignacion {
  id_producto: number;
  precio_oferta?: number;
}

/**
 * Producto con datos pivot de la relación oferta-producto (vista admin)
 */
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

/**
 * Oferta con sus productos asociados incluidos (gestión admin)
 */
export interface OfertaConProductos extends Oferta {
  productos: ProductoEnOferta[];
}

/**
 * Oferta con conteo de productos (para lista admin)
 */
export interface OfertaConConteo extends Oferta {
  productos_count?: number;
}

/**
 * Oferta con datos pivot del producto (para vista desde el producto en admin)
 */
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
