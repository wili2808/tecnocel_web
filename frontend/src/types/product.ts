import type { Oferta } from './oferta';

// ============================================================================
// TIPOS DE PRODUCTOS Y CATÁLOGO
// ============================================================================

/**
 * Interfaz para Marcas - Tabla tb_marcas
 */
export interface Marca {
  id_marca: number;
  nombre_marca: string;
  logo_marca?: string | null;
  descripcion_marca?: string | null;
  activo: boolean;
  product_count?: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Categorías - Tabla tb_categorias
 */
export interface Category {
  id_categoria: number;
  nombre_categoria: string;
  activo: boolean;
  product_count?: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Tipos de Características - Tabla tb_tipos_caracteristicas
 */
export interface TipoCaracteristica {
  id_tipo: number;
  nombre_tipo: string;
  descripcion?: string | null;
  tipo_dato: 'texto' | 'numero' | 'booleano' | 'seleccion';
  unidad_medida?: string | null;
  opciones_seleccion?: string[] | null;
  activo: boolean;
  fyh_creacion?: string;
  fyh_actualizacion?: string;
}

/**
 * Interfaz para Características de Productos - Tabla tb_producto_caracteristicas
 */
export interface ProductoCaracteristica {
  id_caracteristica: number;
  id_producto: number;
  id_tipo: number;
  valor: string;
  fyh_creacion: string;
  fyh_actualizacion: string;
  tipo?: TipoCaracteristica;
}

/**
 * Característica en estado local (para formulario crear/editar)
 */
export interface CaracteristicaLocal {
  id_tipo: number;
  valor: string;
  nombre_tipo: string;
  tipo_dato: 'texto' | 'numero' | 'booleano' | 'seleccion';
  unidad_medida?: string | null;
  opciones_seleccion?: string[] | null;
}

/**
 * Interfaz para Imágenes de Productos - Tabla tb_producto_imagenes
 */
export interface ProductoImagen {
  id_imagen: number;
  id_producto: number;
  url_imagen: string;
  alt_text?: string | null;
  es_principal: boolean;
  orden: number;
  fyh_creacion: string;
}

/**
 * Interfaz para Imágenes transformadas por el backend
 */
export interface ImageData {
  url: string;
  url_imagen?: string;
  alt_text?: string | null;
  es_principal: boolean;
  orden: number;
}

/**
 * Interfaz completa del producto según el modelo tb_almacen
 */
export interface Product {
  // Campos principales
  id_producto: number;
  codigo: string;
  nombre: string;
  modelo?: string | null;
  descripcion: string | null;
  stock: number;
  stock_minimo?: number | null;
  stock_maximo?: number | null;
  precio_compra: string;
  precio_venta: string;
  fecha_ingreso: string;
  id_usuario: number;
  id_categoria: number;
  id_marca?: number | null;
  es_destacado: boolean;
  orden_destacado: number;
  activo: boolean;
  fyh_creacion: string;
  fyh_actualizacion: string;
  
  // Relaciones incluidas en las consultas
  Categoria?: Category;
  Usuario?: {
    id_usuario: number;
    nombres: string;
    email: string;
  };
  marca?: Marca;
  caracteristicas?: ProductoCaracteristica[];
  productosCaracteristicas?: ProductoCaracteristica[];
  ofertas?: Oferta[];
  imagenes?: ImageData[];
  
  // Campos calculados por el backend
  precio_original?: number;
  precio_oferta?: number;
  precio_final?: number;
  descuento_porcentaje?: number;
  en_oferta?: boolean;
  es_favorito?: boolean;
  
  // Campos de imagen (legacy)
  imagen?: string | null;
  imagen_url?: string | null;
  imagen_disponible?: boolean;
}

/**
 * Interfaz para las props del ProductCard (solo propiedades necesarias)
 */
export interface ProductCardProps {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  imagenes?: ImageData[];
  precio_venta: string;
  stock: number;
  className?: string;
  onClick?: () => void;
  
  // Props para ofertas
  precio_original?: number;
  precio_oferta?: number;
  descuento_porcentaje?: number;
  en_oferta?: boolean;
  ofertas?: Oferta[];
}

// ============================================================================
// INTERFACES PARA FILTROS Y BÚSQUEDA
// ============================================================================

/**
 * Interfaz para filtros de productos
 */
export interface ProductFilters {
  categoria?: number;
  marca?: number;
  busqueda?: string;
  precio_min?: number;
  precio_max?: number;
  solo_con_stock?: boolean;
  solo_ofertas?: boolean;
  caracteristicas?: { [key: string]: string };
  es_destacado?: boolean;
  order?: string;
}

/**
 * Interfaz para filtros de UI de productos
 */
export interface ProductUIFilters {
  search: string;
  selectedDropdownCategory: string;
  selectedDropdownBrand: string;
  order: string;
  onlyStock: boolean;
  priceMin?: string;
  priceMax?: string;
  onlyOffers?: boolean;
  minRating?: number;
}

// ============================================================================
// INTERFACES PARA ADMIN - FORMULARIO DE PRODUCTOS
// ============================================================================

/**
 * Datos del formulario para crear/editar un producto desde el admin
 */
export interface ProductoFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  id_categoria: number | null;
  id_marca?: number | null;
  modelo?: string;
  precio_compra: string;
  precio_venta: string;
  stock: number;
  stock_minimo?: number;
  stock_maximo?: number;
  fecha_ingreso: string;
  es_destacado: boolean;
  orden_destacado?: number;
  activo?: boolean;
  imagenes?: { url_imagen: string; alt_text?: string }[];
  caracteristicas?: { id_tipo: number; valor: string }[];
}

/**
 * Imagen en estado de preview antes de subir al servidor
 */
export interface ImagenPreview {
  file?: File;
  preview: string;
  url_imagen?: string;
  alt_text: string;
  es_existente: boolean;
}