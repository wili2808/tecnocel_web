export interface CreateOfertaBody {
  nombre_oferta: string;
  descripcion?: string;
  tipo_descuento: string;
  valor_descuento: number | string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_minimo?: number | string;
  precio_maximo?: number | string;
  limite_uso?: number | string;
  activo?: boolean;
}

export interface UpdateOfertaBody {
  nombre_oferta?: string;
  descripcion?: string;
  tipo_descuento?: string;
  valor_descuento?: number | string;
  fecha_inicio?: string;
  fecha_fin?: string;
  precio_minimo?: number | string;
  precio_maximo?: number | string;
  limite_uso?: number | string;
  activo?: boolean;
}

export interface AsignarProductoItem {
  id_producto: number;
  precio_oferta?: number;
  es_precio_personalizado?: boolean;
}

export interface AsignarProductosOfertaBody {
  productos: AsignarProductoItem[];
}

export interface OfertaJson {
  id_oferta: number;
  nombre_oferta: string;
  descripcion: string | null;
  tipo_descuento: string;
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  imagen_url?: string | null;
}
