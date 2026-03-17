export type EstadoEnvio = 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado';

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
  estado_envio: EstadoEnvio;
  nro_seguimiento: string | null;
  fyh_despacho: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
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
  estado_envio?: EstadoEnvio;
  fecha_inicio?: string;
  fecha_fin?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListarEnviosResponse {
  success: boolean;
  data: EnvioAdminListItem[];
  total: number;
  limit: number;
  offset: number;
}

export const ESTADO_ENVIO_LABELS: Record<EstadoEnvio, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  en_camino: 'En camino',
  entregado: 'Entregado',
};

export const SIGUIENTE_ESTADO: Partial<Record<EstadoEnvio, Exclude<EstadoEnvio, 'pendiente'>>> = {
  pendiente: 'en_preparacion',
  en_preparacion: 'en_camino',
  en_camino: 'entregado',
};
