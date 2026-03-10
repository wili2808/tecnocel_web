export type TipoNotificacion =
  | 'respuesta_admin'
  | 'respuesta_cliente'
  | 'comentario_moderado'
  | 'venta_confirmada'
  | 'venta_cancelada';

export interface Notificacion {
  id_notificacion: number;
  id_cliente: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  id_referencia: number | null;
  enlace: string | null;
  leido: boolean;
  fyh_creacion: string;
  fyh_lectura: string | null;
}

export interface NotificacionesData {
  notificaciones: Notificacion[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface NotificacionesResponse {
  success: boolean;
  data: NotificacionesData;
}

export interface NoLeidasResponse {
  success: boolean;
  data: { count: number };
}
