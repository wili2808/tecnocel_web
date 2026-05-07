/**
 * Interfaz para el modelo MensajeContacto
 */
export interface MensajeContacto {
  id_mensaje_contacto: number;
  nombre: string;
  email: string;
  telefono: string | null;
  asunto: string;
  mensaje: string;
  leido: boolean;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interface para la creación de un mensaje (vía formulario de contacto)
 */
export interface CreateMensajeBody {
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
}

/**
 * Interface para la respuesta paginada de mensajes
 */
export interface MensajesPaginatedResponse {
  success: boolean;
  data: {
    items: MensajeContacto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}
