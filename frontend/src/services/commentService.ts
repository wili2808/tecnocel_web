import axiosInstance from '../api/axiosConfig';

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
export interface Cliente {
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
  cliente: Cliente;
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
}

/**
 * Servicio para manejar todas las operaciones relacionadas con comentarios
 * Incluye CRUD de comentarios, gestión de imágenes y utilidades de formato
 */
const commentService = {
  /**
   * Obtiene comentarios de un producto específico con paginación y ordenamiento
   * @param idProducto - ID del producto cuyos comentarios se quieren obtener
   * @param params - Parámetros de paginación y ordenamiento
   * @returns Promise con comentarios paginados y estadísticas del producto
   */
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

  /**
   * Obtiene estadísticas de comentarios de un producto específico
   * Incluye totales, promedios y distribución de calificaciones
   * @param idProducto - ID del producto para obtener estadísticas
   * @returns Promise con estadísticas completas de comentarios
   */
  getEstadisticasProducto: async (idProducto: number): Promise<EstadisticasComentarios> => {
    try {
      const response = await axiosInstance.get(`/comentarios/producto/${idProducto}/estadisticas`);
      return response.data.datos;
    } catch (error) {
      console.error('Error fetching product comment statistics:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo comentario para un producto
   * @param data - Datos del comentario a crear
   * @returns Promise con el comentario creado
   */
  crearComentario: async (data: CrearComentarioData): Promise<Comentario> => {
    try {
      const response = await axiosInstance.post('/comentarios', data);
      return response.data.datos.comentario;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  /**
   * Actualiza un comentario existente
   * @param idComentario - ID del comentario a actualizar
   * @param data - Datos a actualizar en el comentario
   * @returns Promise con el comentario actualizado
   */
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

  /**
   * Elimina un comentario específico del sistema
   * @param idComentario - ID del comentario a eliminar
   * @returns Promise que se resuelve cuando el comentario es eliminado
   */
  eliminarComentario: async (idComentario: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/comentarios/${idComentario}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  /**
   * Elimina una imagen específica de un comentario
   * @param idComentario - ID del comentario
   * @param idImagen - ID de la imagen a eliminar
   * @returns Promise que se resuelve cuando la imagen es eliminada
   */
  eliminarImagenComentario: async (idComentario: number, idImagen: number): Promise<void> => {
    try {
      console.log('🔍 Intentando eliminar imagen:', { idComentario, idImagen });
      console.log('🔑 Token en localStorage:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
      
      const response = await axiosInstance.delete(`/comentarios/${idComentario}/imagenes/${idImagen}`);
      console.log('✅ Imagen eliminada exitosamente:', response.data);
    } catch (error: any) {
      console.error('❌ Error deleting comment image:', error);
      console.error('📊 Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  /**
   * Sube una imagen para asociar a un comentario
   * @param file - Archivo de imagen a subir
   * @returns Promise con la información de la imagen subida
   */
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

  /**
   * Valida un archivo de imagen antes de subirlo
   * Verifica tipo, tamaño y otros criterios de validación
   * @param file - Archivo de imagen a validar
   * @returns Objeto con resultado de validación y mensaje de error si aplica
   */
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

  /**
   * Formatea una fecha de comentario en formato relativo legible
   * Convierte timestamps a texto como "Hace 2 horas", "Hace 3 días"
   * @param fecha - Fecha en formato string o Date
   * @returns String formateado con tiempo relativo
   */
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

  /**
   * Genera texto descriptivo para una calificación numérica
   * @param calificacion - Calificación numérica (1-5)
   * @returns String descriptivo de la calificación
   */
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

  /**
   * Crea una respuesta de cliente a un comentario
   * @param idComentario - ID del comentario al que se responde
   * @param contenido - Texto de la respuesta (1-1000 caracteres)
   */
  crearRespuestaCliente: async (idComentario: number, contenido: string): Promise<Respuesta> => {
    try {
      const response = await axiosInstance.post(`/comentarios/${idComentario}/respuestas/cliente`, { contenido });
      return response.data.datos.respuesta;
    } catch (error) {
      console.error('Error creating client reply:', error);
      throw error;
    }
  },

  /**
   * Elimina la propia respuesta del cliente (soft delete)
   * @param idRespuesta - ID de la respuesta a eliminar
   */
  eliminarRespuesta: async (idRespuesta: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/comentarios/respuestas/${idRespuesta}`);
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
  },

  /**
   * Valida los datos de un comentario antes de enviarlo al servidor
   * Verifica longitud, calificación y cantidad de imágenes
   * @param datos - Datos del comentario a validar
   * @returns Objeto con resultado de validación y lista de errores
   */
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