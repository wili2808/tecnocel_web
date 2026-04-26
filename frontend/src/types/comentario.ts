
/**
 * Estructura de una imagen asociada a un comentario
 */
export interface ComentarioImagen {
  id_imagen: number;
  nombre_archivo: string;
  ruta_imagen: string;
  imagen_url: string;
  alt_text?: string;
}

/**
 * Información básica del cliente que realizó el comentario
 */
export interface ClienteInfo {
  nombre_cliente: string;
  apellido_cliente: string;
}

/**
 * Información del administrador que respondió al comentario
 */
export interface AdminRespuesta {
  nombres: string;
}

/**
 * Estructura de una respuesta a un comentario
 */
export interface Respuesta {
  id_respuesta: number;
  id_comentario: number;
  id_cliente?: number | null;
  id_usuario?: number | null;
  tipo_autor: 'cliente' | 'admin';
  contenido: string;
  estado: 'activo' | 'oculto' | 'eliminado';
  fyh_creacion: string;
  fyh_actualizacion: string;
  clienteAutor?: { nombre_cliente: string; apellido_cliente: string };
  usuarioAutor?: { nombres: string };
}

/**
 * Estructura completa de un comentario con toda su información
 */
export interface Comentario {
  id_comentario: number;
  id_producto: number;
  id_cliente: number;
  comentario: string;
  calificacion?: number;
  es_verificado: boolean;
  estado: 'activo' | 'oculto' | 'eliminado';
  respuesta_admin?: string;
  fecha_respuesta_admin?: string;
  fyh_creacion: string;
  fyh_actualizacion: string;
  cliente: ClienteInfo;
  imagenes?: ComentarioImagen[];
  adminRespuesta?: AdminRespuesta;
  respuestas?: Respuesta[];
}

/**
 * Estadísticas generales de comentarios de un producto
 */
export interface EstadisticasComentarios {
  total_comentarios: number;
  total_calificaciones: number;
  calificacion_promedio: number;
  distribucion_calificaciones: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  total_imagenes: number;
}

/**
 * Respuesta del servidor al obtener comentarios con paginación y estadísticas
 */
export interface ComentariosResponse {
  mensaje: string;
  datos: {
    comentarios: Comentario[];
    paginacion: {
      total: number;
      limite: number;
      offset: number;
      paginas: number;
    };
    estadisticas: EstadisticasComentarios;
  };
}

/**
 * Datos necesarios para crear un nuevo comentario
 */
export interface CrearComentarioData {
  id_producto: number;
  id_cliente: number;
  comentario: string;
  calificacion?: number;
  imagenes?: {
    nombre_archivo: string;
    ruta_imagen: string;
    tipo_archivo: string;
    tamaño_archivo?: number;
    alt_text?: string;
  }[];
}

/**
 * Datos que se pueden actualizar en un comentario existente
 */
export interface ActualizarComentarioData {
  comentario?: string;
  calificacion?: number;
  imagenes?: {
    nombre_archivo: string;
    ruta_imagen: string;
    tipo_archivo: string;
    tamaño_archivo?: number;
    alt_text?: string;
  }[];
}

/**
 * Parámetros para obtener comentarios con filtros y ordenamiento
 */
export interface ObtenerComentariosParams {
  limite?: number;
  offset?: number;
  orden?: 'recientes' | 'antiguos' | 'mejor_calificacion' | 'peor_calificacion';
  /** Cuando es true, incluye comentarios ocultos (solo para administradores del sistema) */
  incluirOcultos?: boolean;
}
