// Interfaces para las nuevas funcionalidades
export interface Marca {
  id_marca: number;
  nombre_marca: string;
  logo_marca?: string | null;
  descripcion_marca?: string | null;
}

export interface TipoCaracteristica {
  id_tipo: number;
  nombre_tipo: string;
  descripcion?: string | null;
  tipo_dato: 'texto' | 'numero' | 'booleano' | 'seleccion';
  unidad_medida?: string | null;
  opciones_seleccion?: string[] | null;
}

export interface ProductoCaracteristica {
  id_caracteristica: number;
  id_tipo: number;
  valor: string;
  tipo?: TipoCaracteristica;
}

export interface Oferta {
  id_oferta: number;
  nombre_oferta: string;
  descripcion?: string | null;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  ProductoOferta?: {
    precio_oferta: number;
  };
}

export interface ProductoImagen {
  id_imagen: number;
  id_producto: number;
  url: string;  // El backend transforma url_imagen a url
  alt_text?: string | null;
  es_principal: boolean;
  orden: number;
}

// Esta interfaz debe coincidir exactamente con lo que devuelve el backend
export interface ImageData {
  url: string;
  alt_text?: string | null;
  es_principal: boolean;
  orden: number;
}

export interface Direccion {
  id_direccion: number;
  id_cliente: number;
  nombre_direccion: string;
  calle: string;
  numero: string;
  piso?: string | null;
  departamento?: string | null;
  barrio?: string | null;
  ciudad: string;
  provincia: string;
  codigo_postal?: string | null;
  pais: string;
  referencia?: string | null;
  es_predeterminada: boolean;
  es_facturacion: boolean;
  telefono_contacto?: string | null;
}

// Interfaz completa del producto según el modelo Almacen
export interface Product {
  id_producto: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  stock: number;
  stock_minimo: number | null;
  stock_maximo: number | null;
  precio_compra: string;
  precio_venta: string;
  fecha_ingreso: string;
  imagen: string | null;
  imagen_url?: string | null; // Generada por el backend
  imagen_disponible?: boolean; // Generada por el backend
  id_usuario: number;
  id_categoria: number;
  id_marca?: number | null;
  modelo?: string | null;
  es_destacado: boolean;
  orden_destacado: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  
  // Relaciones incluidas en las consultas
  Categoria?: {
    nombre_categoria: string;
  };
  Usuario?: {
    nombres: string;
  };
  marca?: Marca;
  caracteristicas?: ProductoCaracteristica[];
  productosCaracteristicas?: ProductoCaracteristica[];
  ofertas?: Oferta[];
  imagenes?: ImageData[];
  
  // Campos calculados
  precio_original?: number;
  precio_oferta?: number;
  precio_final?: number;
  descuento_porcentaje?: number;
  en_oferta?: boolean;
  es_favorito?: boolean;
}

// Interfaz para categorías del backend
export interface Category {
  id_categoria: number;
  nombre_categoria: string;
}

// Interfaz para las props del ProductCard (solo propiedades necesarias)
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

// Interfaz para filtros de productos (actualizada)
export interface ProductFilters {
  categoria?: number;
  marca?: number;
  busqueda?: string;
  precio_min?: number;
  precio_max?: number;
  solo_con_stock?: boolean;
  solo_ofertas?: boolean;
  caracteristicas?: { [key: string]: string };
}

// Interfaz para respuesta de la API
export interface ProductsResponse {
  productos: Product[];
  total: number;
  pagina: number;
  por_pagina: number;
}