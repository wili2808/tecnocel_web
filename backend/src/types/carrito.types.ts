export interface AgregarItemBody {
  id_producto: number;
  cantidad: number;
}

export interface ActualizarItemBody {
  cantidad: number;
}

export interface ConfirmarCompraBody {
  tipo_entrega: 'domicilio' | 'sucursal';
  id_direccion?: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
  observaciones?: string;
  moneda?: string;
  valor_dolar?: number;
  aceptar_cambio_precio?: boolean;
}

export interface UpdateDireccionBody {
  nombre_direccion?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  departamento?: string;
  barrio?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;
  referencia?: string;
  es_predeterminada?: boolean;
  es_facturacion?: boolean;
  telefono_contacto?: string;
}

export interface CarritoItemTransformado {
  id_item: number;
  id_producto: number;
  nombre: string;
  codigo: string;
  imagen_url: string | null;
  cantidad: number;
  stock_disponible: number;
  precio_base: number;
  precio_con_oferta: number | null;
  descuento_porcentaje: number | null;
  en_oferta: boolean;
  subtotal: number;
  precio_ha_cambiado: boolean;
  precio_base_original: number | null;
  id_oferta_aplicada: number | null;
}

export interface CarritoResponse {
  id_carrito: number;
  id_cliente: number;
  items: CarritoItemTransformado[];
  total: number;
  total_items: number;
  tiene_cambios_precio: boolean;
}
