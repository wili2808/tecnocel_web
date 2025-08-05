import axiosInstance from '../api/axiosConfig';

// Tipos de datos
export interface ComentarioImagen {
  id_imagen: number;
  nombre_archivo: string;
  ruta_imagen: string;
  imagen_url: string;
  alt_text?: string;
  orden: number;
}

export interface Cliente {
  nombre_cliente: string;
  apellido_cliente: string;
}

export interface AdminRespuesta {
  nombres: string;
}

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
  cliente: Cliente;
  imagenes?: ComentarioImagen[];
  adminRespuesta?: AdminRespuesta;
}

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
    orden: number;
  }[];
}

export interface ActualizarComentarioData {
  comentario?: string;
  calificacion?: number;
}

export interface ObtenerComentariosParams {
  limite?: number;
  offset?: number;
  orden?: 'recientes' | 'antiguos' | 'mejor_calificacion' | 'peor_calificacion';
}

const commentService = {
  // Obtener comentarios de un producto
  getComentariosProducto: async (
    idProducto: number, 
    params: ObtenerComentariosParams = {}
  ): Promise<ComentariosResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.limite) queryParams.append('limite', params.limite.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.orden) queryParams.append('orden', params.orden);

      const url = `/comentarios/producto/${idProducto}${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching product comments:', error);
      throw error;
    }
  },

  // Obtener estadísticas de comentarios de un producto
  getEstadisticasProducto: async (idProducto: number): Promise<EstadisticasComentarios> => {
    try {
      const response = await axiosInstance.get(`/comentarios/producto/${idProducto}/estadisticas`);
      return response.data.datos;
    } catch (error) {
      console.error('Error fetching product comment statistics:', error);
      throw error;
    }
  },

  // Crear nuevo comentario
  crearComentario: async (data: CrearComentarioData): Promise<Comentario> => {
    try {
      const response = await axiosInstance.post('/comentarios', data);
      return response.data.datos.comentario;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  // Actualizar comentario existente
  actualizarComentario: async (
    idComentario: number, 
    data: ActualizarComentarioData
  ): Promise<Comentario> => {
    try {
      const response = await axiosInstance.put(`/comentarios/${idComentario}`, data);
      return response.data.datos.comentario;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  // Eliminar comentario
  eliminarComentario: async (idComentario: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/comentarios/${idComentario}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Subir imagen para comentario
  subirImagenComentario: async (file: File): Promise<{ ruta_imagen: string; nombre_archivo: string }> => {
    try {
      const formData = new FormData();
      formData.append('imagen', file);

      const response = await axiosInstance.post('/comentarios/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.datos;
    } catch (error) {
      console.error('Error uploading comment image:', error);
      throw error;
    }
  },

  // Validar archivo de imagen
  validarImagenComentario: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no válido. Solo se permiten: JPG, PNG, WEBP, GIF'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 10MB'
      };
    }

    return { valid: true };
  },

  // Formatear fecha de comentario
  formatearFechaComentario: (fecha: string): string => {
    try {
      const fechaObj = new Date(fecha);
      const ahora = new Date();
      const diferencia = ahora.getTime() - fechaObj.getTime();
      
      const minutos = Math.floor(diferencia / (1000 * 60));
      const horas = Math.floor(diferencia / (1000 * 60 * 60));
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

      if (minutos < 1) return 'Hace un momento';
      if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
      if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
      if (dias < 7) return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
      
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  },

  // Generar texto de calificación
  generarTextoCalificacion: (calificacion: number): string => {
    const textos = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente'
    };
    return textos[calificacion as keyof typeof textos] || 'Sin calificación';
  },

  // Validar datos de comentario
  validarDatosComentario: (datos: Partial<CrearComentarioData>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!datos.comentario || datos.comentario.trim().length < 10) {
      errors.push('El comentario debe tener al menos 10 caracteres');
    }

    if (datos.comentario && datos.comentario.length > 2000) {
      errors.push('El comentario no puede tener más de 2000 caracteres');
    }

    if (datos.calificacion && (datos.calificacion < 1 || datos.calificacion > 5)) {
      errors.push('La calificación debe estar entre 1 y 5');
    }

    if (datos.imagenes && datos.imagenes.length > 5) {
      errors.push('Máximo 5 imágenes por comentario');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default commentService;