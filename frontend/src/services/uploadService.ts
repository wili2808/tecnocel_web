import axiosInstance from '../api/axiosConfig';

/**
 * Estructura de una imagen subida exitosamente
 */
export interface UploadedImage {
  url_imagen: string;
  alt_text: string;
}

/**
 * Respuesta del servidor al subir imágenes exitosamente
 */
export interface UploadResponse {
  mensaje: string;
  datos: {
    imagenes: UploadedImage[];
  };
}

/**
 * Estructura de error al subir imágenes
 */
export interface UploadError {
  mensaje: string;
  error: string;
}

/**
 * Servicio para manejar la subida de imágenes de comentarios
 * Incluye validación, procesamiento y gestión de archivos
 */
class UploadService {
  /**
   * Sube múltiples imágenes de comentario al servidor
   * Realiza validaciones del lado cliente antes de la subida
   * @param files - Array de archivos File a subir (máximo 5)
   * @returns Promise con las imágenes procesadas y sus URLs
   */
  async uploadCommentImages(files: File[]): Promise<UploadedImage[]> {
    try {
      // Validaciones del lado cliente
      this.validateFiles(files);

      // Crear FormData para la subida
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('imagenes', file);
      });

      // Realizar la petición
      const response = await axiosInstance.post<UploadResponse>(
        '/upload/comment-images',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 segundos timeout
        }
      );

      return response.data.datos.imagenes;

    } catch (error: any) {
      console.error('Error al subir imágenes:', error);
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Tiempo de espera agotado al subir las imágenes');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Error desconocido al subir las imágenes');
      }
    }
  }

  /**
   * Valida archivos antes de subir al servidor
   * Verifica tipo, tamaño y cantidad de archivos
   * @param files - Array de archivos a validar
   * @throws Error si la validación falla
   */
  private validateFiles(files: File[]): void {
    if (!files || files.length === 0) {
      throw new Error('No se han seleccionado archivos');
    }

    if (files.length > 5) {
      throw new Error('Máximo 5 imágenes por comentario');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    files.forEach((file, index) => {
      // Validar tipo de archivo
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`La imagen ${index + 1} tiene un formato no válido. Solo se permiten: JPG, PNG, WEBP, GIF`);
      }

      // Validar tamaño
      if (file.size > maxSize) {
        throw new Error(`La imagen ${index + 1} es muy grande. Tamaño máximo: 10MB`);
      }

      // Validar que el archivo no esté vacío
      if (file.size === 0) {
        throw new Error(`La imagen ${index + 1} está vacía`);
      }
    });
  }

  /**
   * Genera una vista previa de imagen para mostrar antes de subir
   * Convierte el archivo a una URL de datos para preview
   * @param file - Archivo de imagen a previsualizar
   * @returns Promise con la URL de preview de la imagen
   */
  async generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('No se pudo generar preview'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Formatea el tamaño de archivo en bytes a una representación legible
   * Convierte bytes a KB, MB, GB según corresponda
   * @param bytes - Tamaño del archivo en bytes
   * @returns String formateado (ej: "2.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Valida si un tipo de archivo MIME es una imagen válida
   * Verifica contra la lista de tipos de imagen permitidos
   * @param fileType - Tipo MIME del archivo a validar
   * @returns boolean indicando si el tipo es válido
   */
  isValidImageType(fileType: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    return allowedTypes.includes(fileType);
  }

  /**
   * Obtiene la extensión de archivo recomendada basada en el tipo MIME
   * Mapea tipos MIME a extensiones de archivo estándar
   * @param fileType - Tipo MIME del archivo
   * @returns Extensión recomendada para el archivo
   */
  getRecommendedExtension(fileType: string): string {
    const typeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif'
    };

    return typeMap[fileType] || 'jpg';
  }
}

export default new UploadService();