export interface TransformedProductImage {
  id_imagen: number;
  url_imagen: string;
  alt_text: string | null;
  es_principal: boolean;
  orden: number;
}

export interface TransformedProduct {
  id_producto: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  stock: number;
  stock_minimo: number | null;
  precio_compra: string;
  precio_venta: string;
  id_categoria: number;
  id_marca: number | null;
  es_destacado: boolean;
  activo: boolean;
  imagen_url: string | null;
  imagen_disponible: boolean;
  imagenes?: TransformedProductImage[];
  Categoria?: { id_categoria: number; nombre_categoria: string };
  marca?: { id_marca: number; nombre_marca: string };
}

export interface CreateProductoImagen {
  url_imagen: string;
  alt_text?: string;
  es_principal?: boolean;
  orden?: number;
}

export interface CreateProductoCaracteristica {
  id_tipo: number;
  valor: string;
}

export interface CreateProductoBody {
  nombre: string;
  codigo: string;
  descripcion?: string;
  stock: number;
  stock_minimo?: number;
  precio_compra: number | string;
  precio_venta: number | string;
  id_categoria: number;
  id_marca?: number;
  modelo?: string;
  es_destacado?: boolean;
  activo?: boolean;
  imagenes?: CreateProductoImagen[];
  caracteristicas?: CreateProductoCaracteristica[];
}

export interface UpdateProductoBody extends Partial<CreateProductoBody> {}

export interface UpdateStockBody {
  stock: number;
}
