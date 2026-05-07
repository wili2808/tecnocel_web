export interface ComentarioCreateData {
  id_producto: number;
  id_cliente: number;
  comentario: string;
  calificacion?: number;
}

export interface ComentarioImagenData {
  url_imagen: string;
  alt_text?: string;
}

export interface GetComentariosQuery {
  limite?: string;
  offset?: string;
  orden?: 'recientes' | 'antiguos' | 'mejor_calificacion' | 'peor_calificacion';
  /** Cuando es 'true', incluye comentarios ocultos (solo para administradores) */
  incluir_ocultos?: string;
}

export interface ComentarioNuevaImagen {
  nombre_archivo: string;
  ruta_imagen: string;
  tipo_archivo: string;
  tamaño_archivo?: number;
  alt_text?: string;
}

export interface ActualizarComentarioData {
  comentario?: string;
  calificacion?: number;
  imagenes_a_eliminar?: number[];
  imagenes?: ComentarioNuevaImagen[];
}

export interface CrearRespuestaClienteBody {
  contenido: string;
}

export interface CrearRespuestaAdminBody {
  contenido: string;
}

export interface ModerarComentarioBody {
  estado: 'pendiente' | 'activo' | 'oculto' | 'eliminado';
}

export interface ModerarRespuestaBody {
  estado: 'pendiente' | 'activo' | 'oculto' | 'eliminado';
}
