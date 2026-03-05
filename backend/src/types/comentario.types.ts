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
