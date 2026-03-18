export interface EnvioAdminListItem {
  id_envio: number;
  id_venta: number;
  nro_venta: number;
  nombre_cliente: string | null;
  email_cliente: string | null;
  envio_calle: string | null;
  envio_numero: string | null;
  envio_ciudad: string | null;
  envio_provincia: string | null;
  estado_envio: 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado';
  nro_seguimiento: string | null;
  fyh_despacho: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
  tipo_entrega?: 'envio' | 'retiro_en_tienda';
}

export interface EnvioAdminDetalle extends EnvioAdminListItem {
  envio_nombre_direccion: string | null;
  envio_piso: string | null;
  envio_departamento: string | null;
  envio_barrio: string | null;
  envio_codigo_postal: string | null;
  envio_pais: string | null;
  envio_referencia: string | null;
  envio_telefono_contacto: string | null;
  total_pagado: number;
  moneda: string;
  metodo_pago: string;
  fyh_venta: string;
  items: Array<{
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
  }>;
}

export interface ActualizarEstadoEnvioBody {
  estado_envio: 'en_preparacion' | 'en_camino' | 'entregado';
  nro_seguimiento?: string;
}

export interface FiltrosEnviosAdmin {
  estado_envio?: 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado';
  fecha_inicio?: string;
  fecha_fin?: string;
  search?: string;
  limit?: number;
  offset?: number;
  tipo_entrega?: 'envio' | 'retiro_en_tienda';
}

// Mapa de transiciones válidas (solo avanzar, secuencial)
export const TRANSICIONES_ENVIO: Record<string, string> = {
  pendiente: 'en_preparacion',
  en_preparacion: 'en_camino',
  en_camino: 'entregado',
};
