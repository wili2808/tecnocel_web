import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Comentario from '../models/Comentario.js';
import ComentarioImagen from '../models/ComentarioImagen.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import logger from '../utils/logger.js';
import { getImageService } from '../services/imageService.js';

// Interfaces para tipado
interface ComentarioCreateData {
  id_producto: number;
  id_cliente: number;
  comentario: string;
  calificacion?: number;
}

interface ComentarioImagenData {
  url_imagen: string;
  alt_text?: string;
}

interface GetComentariosQuery {
  limite?: string;
  offset?: string;
  orden?: 'recientes' | 'antiguos' | 'mejor_calificacion' | 'peor_calificacion';
}

interface ActualizarComentarioData {
  comentario?: string;
  calificacion?: number;
  imagenes_a_eliminar?: number[]; // IDs de imágenes a eliminar
  imagenes?: {
    nombre_archivo: string;
    ruta_imagen: string;
    tipo_archivo: string;
    tamaño_archivo?: number;
    alt_text?: string;
  }[]; // Nuevas imágenes a agregar
}

class ComentarioController {
  
  // Método helper para transformar comentarios con URLs de imágenes
  private async transformComentariosWithImages(comentarios: any[]): Promise<any[]> {
    try {
      if (!comentarios || comentarios.length === 0) {
        return [];
      }

      const imageService = getImageService();
      if (!imageService) {
        logger.warn('Servicio de imágenes no disponible, devolviendo comentarios sin URLs de imagen');
        return comentarios.map(c => c.toJSON ? c.toJSON() : c);
      }
      
      // Usar el método específico para comentarios del imageService
      return await imageService.transformCommentsWithImageUrls(comentarios);
    } catch (error) {
      logger.error('Error al transformar comentarios con imágenes:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        comentarioCount: comentarios ? comentarios.length : 0,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return comentarios ? comentarios.map(c => c.toJSON ? c.toJSON() : c) : [];
    }
  }

  // Obtener comentarios de un producto
  async obtenerComentariosProducto(req: Request, res: Response): Promise<void> {
    try {
      const { id_producto } = req.params;
      const { limite = '10', offset = '0', orden = 'recientes' }: GetComentariosQuery = req.query;

      // Validar parámetros
      const productId = parseInt(id_producto);
      if (!productId || productId <= 0) {
        res.status(400).json({
          mensaje: 'ID de producto inválido',
          error: 'El ID del producto debe ser un número positivo'
        });
        return;
      }

      const limit = parseInt(limite);
      const offsetNum = parseInt(offset);

      // Determinar orden
      let orderClause: any[] = [['fyh_creacion', 'DESC']];
      switch (orden) {
        case 'antiguos':
          orderClause = [['fyh_creacion', 'ASC']];
          break;
        case 'mejor_calificacion':
          orderClause = [['calificacion', 'DESC'], ['fyh_creacion', 'DESC']];
          break;
        case 'peor_calificacion':
          orderClause = [['calificacion', 'ASC'], ['fyh_creacion', 'DESC']];
          break;
        default:
          orderClause = [['fyh_creacion', 'DESC']];
      }

      // Consultar comentarios
      const { rows: comentarios, count: total } = await Comentario.findAndCountAll({
        where: {
          id_producto: productId,
          estado: 'activo'
        },
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['nombre_cliente', 'apellido_cliente']
          },
          {
            model: ComentarioImagen,
            as: 'imagenes',
            required: false,
            attributes: ['id_imagen', 'url_imagen', 'alt_text']
          },
          {
            model: Usuario,
            as: 'adminRespuesta',
            required: false,
            attributes: ['nombres']
          }
        ],
        order: orderClause,
        limit,
        offset: offsetNum
      });

      // Transformar comentarios con URLs de imágenes
      const comentariosTransformados = await this.transformComentariosWithImages(comentarios);

      // Calcular estadísticas
      const estadisticas = await this.calcularEstadisticasProducto(productId);

      res.status(200).json({
        mensaje: 'Comentarios obtenidos exitosamente',
        datos: {
          comentarios: comentariosTransformados,
          paginacion: {
            total,
            limite: limit,
            offset: offsetNum,
            paginas: Math.ceil(total / limit)
          },
          estadisticas
        }
      });

    } catch (error) {
      logger.error('Error al obtener comentarios del producto:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_producto: req.params.id_producto,
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: 'No se pudieron obtener los comentarios'
      });
    }
  }

  // Crear nuevo comentario
  async crearComentario(req: Request, res: Response): Promise<void> {
    try {
      const { id_producto, id_cliente, comentario, calificacion, imagenes }: ComentarioCreateData & { imagenes?: ComentarioImagenData[] } = req.body;

      // Validaciones básicas
      if (!id_producto || !id_cliente || !comentario) {
        res.status(400).json({
          mensaje: 'Datos incompletos',
          error: 'Se requieren id_producto, id_cliente y comentario'
        });
        return;
      }

      if (calificacion && (calificacion < 1 || calificacion > 5)) {
        res.status(400).json({
          mensaje: 'Calificación inválida',
          error: 'La calificación debe estar entre 1 y 5'
        });
        return;
      }

      if (comentario.length < 10 || comentario.length > 2000) {
        res.status(400).json({
          mensaje: 'Comentario inválido',
          error: 'El comentario debe tener entre 10 y 2000 caracteres'
        });
        return;
      }

      // Verificar que el producto existe
      const producto = await Almacen.findByPk(id_producto);
      if (!producto) {
        res.status(404).json({
          mensaje: 'Producto no encontrado',
          error: 'El producto especificado no existe'
        });
        return;
      }

      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(id_cliente);
      if (!cliente) {
        res.status(404).json({
          mensaje: 'Cliente no encontrado',
          error: 'El cliente especificado no existe'
        });
        return;
      }

      // Crear el comentario
      const nuevoComentario = await Comentario.create({
        id_producto,
        id_cliente,
        comentario,
        calificacion,
        es_verificado: false,
        estado: 'activo',
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      // Crear imágenes si se proporcionaron
      if (imagenes && imagenes.length > 0) {
        if (imagenes.length > 5) {
          res.status(400).json({
            mensaje: 'Demasiadas imágenes',
            error: 'Máximo 5 imágenes por comentario'
          });
          return;
        }

        const imagenesData = imagenes.map((imagen) => ({
          id_comentario: nuevoComentario.id_comentario,
          url_imagen: imagen.url_imagen,
          alt_text: imagen.alt_text,
          fyh_creacion: new Date()
        }));

        await ComentarioImagen.bulkCreate(imagenesData);
      }

      // Obtener el comentario completo con relaciones
      const comentarioCompleto = await Comentario.findByPk(nuevoComentario.id_comentario, {
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['nombre_cliente', 'apellido_cliente']
          },
          {
            model: ComentarioImagen,
            as: 'imagenes',
            required: false
          }
        ]
      });

      // Transformar con URLs de imágenes
      const comentariosTransformados = await this.transformComentariosWithImages([comentarioCompleto]);
      const comentarioTransformado = comentariosTransformados[0];

      res.status(201).json({
        mensaje: 'Comentario creado exitosamente',
        datos: {
          comentario: comentarioTransformado
        }
      });

    } catch (error) {
      logger.error('Error al crear comentario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        body: req.body,
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: 'No se pudo crear el comentario'
      });
    }
  }

  // Actualizar comentario
  async actualizarComentario(req: Request, res: Response): Promise<void> {
    try {
      const { id_comentario } = req.params;
      const { comentario, calificacion, imagenes_a_eliminar, imagenes }: ActualizarComentarioData = req.body;

      // Validaciones
      const comentarioId = parseInt(id_comentario);
      if (!comentarioId || comentarioId <= 0) {
        res.status(400).json({
          mensaje: 'ID de comentario inválido',
          error: 'El ID del comentario debe ser un número positivo'
        });
        return;
      }

      // Buscar comentario
      const comentarioExistente = await Comentario.findByPk(comentarioId);
      if (!comentarioExistente) {
        res.status(404).json({
          mensaje: 'Comentario no encontrado',
          error: 'El comentario especificado no existe'
        });
        return;
      }

      // Preparar datos de actualización
      const datosActualizacion: any = {
        fyh_actualizacion: new Date()
      };

      if (comentario !== undefined) {
        if (comentario.length < 10 || comentario.length > 2000) {
          res.status(400).json({
            mensaje: 'Comentario inválido',
            error: 'El comentario debe tener entre 10 y 2000 caracteres'
          });
          return;
        }
        datosActualizacion.comentario = comentario;
      }

      if (calificacion !== undefined) {
        if (calificacion < 1 || calificacion > 5) {
          res.status(400).json({
            mensaje: 'Calificación inválida',
            error: 'La calificación debe estar entre 1 y 5'
          });
          return;
        }
        datosActualizacion.calificacion = calificacion;
      }

      // Eliminar imágenes si se solicita
      if (imagenes_a_eliminar && imagenes_a_eliminar.length > 0) {
        await ComentarioImagen.destroy({
          where: {
            id_imagen: imagenes_a_eliminar,
            id_comentario: comentarioId
          }
        });
        logger.info('Imágenes eliminadas del comentario', {
          id_comentario: comentarioId,
          ids_imagenes_eliminadas: imagenes_a_eliminar
        });
      }

      // Agregar nuevas imágenes si se proporcionan
      if (imagenes && imagenes.length > 0) {
        const imagenesData = imagenes.map((imagen) => ({
          id_comentario: comentarioId,
          url_imagen: imagen.ruta_imagen,
          alt_text: imagen.alt_text || `Imagen del comentario`,
          fyh_creacion: new Date()
        }));

        await ComentarioImagen.bulkCreate(imagenesData);
        logger.info('Nuevas imágenes agregadas al comentario', {
          id_comentario: comentarioId,
          cantidad_imagenes: imagenes.length
        });
      }

      // Actualizar comentario
      await comentarioExistente.update(datosActualizacion);

      // Obtener comentario actualizado
      const comentarioActualizado = await Comentario.findByPk(comentarioId, {
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['nombre_cliente', 'apellido_cliente']
          },
          {
            model: ComentarioImagen,
            as: 'imagenes',
            required: false
          }
        ]
      });

      const comentariosTransformados = await this.transformComentariosWithImages([comentarioActualizado]);
      const comentarioTransformado = comentariosTransformados[0];

      res.status(200).json({
        mensaje: 'Comentario actualizado exitosamente',
        datos: {
          comentario: comentarioTransformado
        }
      });

    } catch (error) {
      logger.error('Error al actualizar comentario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_comentario: req.params.id_comentario,
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: 'No se pudo actualizar el comentario'
      });
    }
  }

  // Eliminar comentario (soft delete)
  async eliminarComentario(req: Request, res: Response): Promise<void> {
    try {
      const { id_comentario } = req.params;

      const comentarioId = parseInt(id_comentario);
      if (!comentarioId || comentarioId <= 0) {
        res.status(400).json({
          mensaje: 'ID de comentario inválido',
          error: 'El ID del comentario debe ser un número positivo'
        });
        return;
      }

      const comentario = await Comentario.findByPk(comentarioId);
      if (!comentario) {
        res.status(404).json({
          mensaje: 'Comentario no encontrado',
          error: 'El comentario especificado no existe'
        });
        return;
      }

      // Obtener todas las imágenes del comentario antes de eliminarlo
      const imagenes = await ComentarioImagen.findAll({
        where: { id_comentario: comentarioId }
      });

      // Eliminar archivos físicos de las imágenes
      const { default: UploadController } = await import('../controllers/UploadController.js');
      let archivosEliminados = 0;
      
      for (const imagen of imagenes) {
        try {
          const archivoEliminado = await UploadController.deleteCommentImage(imagen.url_imagen);
          if (archivoEliminado) {
            archivosEliminados++;
          }
        } catch (error) {
          logger.warn('Error al eliminar archivo físico de imagen:', {
            id_imagen: imagen.id_imagen,
            url_imagen: imagen.url_imagen,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      // Eliminar registros de imágenes de la base de datos
      await ComentarioImagen.destroy({
        where: { id_comentario: comentarioId }
      });

      // Soft delete del comentario
      await comentario.update({
        estado: 'eliminado',
        fyh_actualizacion: new Date()
      });

      logger.info('Comentario eliminado con sus imágenes', {
        id_comentario: comentarioId,
        imagenes_eliminadas: imagenes.length,
        archivos_eliminados: archivosEliminados
      });

      res.status(200).json({
        mensaje: 'Comentario eliminado exitosamente',
        datos: {
          imagenes_eliminadas: imagenes.length,
          archivos_eliminados: archivosEliminados
        }
      });

    } catch (error) {
      logger.error('Error al eliminar comentario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_comentario: req.params.id_comentario,
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: 'No se pudo eliminar el comentario'
      });
    }
  }

  // Eliminar imagen de comentario
  async eliminarImagenComentario(req: Request, res: Response): Promise<void> {
    try {
      const { id_comentario, id_imagen } = req.params;

      // Log para debugging
      logger.info('Intento de eliminar imagen de comentario', {
        id_comentario,
        id_imagen,
        usuario: req.usuario,
        headers: req.headers.authorization ? 'Token presente' : 'Sin token'
      });

      // Validaciones
      const comentarioId = parseInt(id_comentario);
      const imagenId = parseInt(id_imagen);

      if (!comentarioId || comentarioId <= 0) {
        res.status(400).json({
          mensaje: 'ID de comentario inválido',
          error: 'El ID del comentario debe ser un número positivo'
        });
        return;
      }

      if (!imagenId || imagenId <= 0) {
        res.status(400).json({
          mensaje: 'ID de imagen inválido',
          error: 'El ID de la imagen debe ser un número positivo'
        });
        return;
      }

      // Buscar comentario y verificar que pertenece al usuario autenticado
      const comentario = await Comentario.findByPk(comentarioId);
      if (!comentario) {
        res.status(404).json({
          mensaje: 'Comentario no encontrado',
          error: 'El comentario especificado no existe'
        });
        return;
      }

      // Verificar que el usuario autenticado es el propietario del comentario
      const userId = req.usuario?.id_cliente;
      
      // Log para debugging
      logger.info('Verificación de permisos', {
        userId,
        comentarioClienteId: comentario.id_cliente,
        usuarioCompleto: req.usuario
      });
      
      if (!userId) {
        logger.warn('Usuario no autenticado al intentar eliminar imagen');
        res.status(401).json({
          mensaje: 'Usuario no autenticado',
          error: 'Debes estar autenticado para realizar esta acción'
        });
        return;
      }
      
      if (comentario.id_cliente !== userId) {
        logger.warn('Intento de eliminar imagen de comentario ajeno', {
          userId,
          comentarioClienteId: comentario.id_cliente
        });
        res.status(403).json({
          mensaje: 'Acceso denegado',
          error: 'Solo puedes eliminar imágenes de tus propios comentarios'
        });
        return;
      }

      // Buscar la imagen
      const imagen = await ComentarioImagen.findOne({
        where: {
          id_imagen: imagenId,
          id_comentario: comentarioId
        }
      });

      if (!imagen) {
        res.status(404).json({
          mensaje: 'Imagen no encontrada',
          error: 'La imagen especificada no existe en este comentario'
        });
        return;
      }

      // Eliminar el archivo físico
      const { default: UploadController } = await import('../controllers/UploadController.js');
      const archivoEliminado = await UploadController.deleteCommentImage(imagen.url_imagen);

      // Eliminar registro de la base de datos
      await imagen.destroy();

      logger.info('Imagen de comentario eliminada', {
        id_comentario: comentarioId,
        id_imagen: imagenId,
        archivo_eliminado: archivoEliminado
      });

      res.status(200).json({
        mensaje: 'Imagen eliminada exitosamente',
        datos: {
          id_imagen: imagenId,
          archivo_eliminado: archivoEliminado
        }
      });

    } catch (error) {
      logger.error('Error al eliminar imagen de comentario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_comentario: req.params.id_comentario,
        id_imagen: req.params.id_imagen,
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: 'No se pudo eliminar la imagen'
      });
    }
  }

  // Obtener estadísticas de comentarios de un producto
  async obtenerEstadisticasProducto(req: Request, res: Response): Promise<void> {
    try {
      const { id_producto } = req.params;

      const productId = parseInt(id_producto);
      if (!productId || productId <= 0) {
        res.status(400).json({
          mensaje: 'ID de producto inválido',
          error: 'El ID del producto debe ser un número positivo'
        });
        return;
      }

      const estadisticas = await this.calcularEstadisticasProducto(productId);

      res.status(200).json({
        mensaje: 'Estadísticas obtenidas exitosamente',
        datos: estadisticas
      });

    } catch (error) {
      logger.error('Error al obtener estadísticas:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_producto: req.params.id_producto,
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: 'No se pudieron obtener las estadísticas'
      });
    }
  }

  // Método helper para calcular estadísticas
  private async calcularEstadisticasProducto(id_producto: number) {
    const comentarios = await Comentario.findAll({
      where: {
        id_producto,
        estado: 'activo'
      },
      include: [
        {
          model: ComentarioImagen,
          as: 'imagenes',
          required: false
        }
      ]
    });

    const totalComentarios = comentarios.length;
    const comentariosConCalificacion = comentarios.filter(c => c.calificacion !== null);
    const totalCalificaciones = comentariosConCalificacion.length;

    let calificacionPromedio = 0;
    const distribucionCalificaciones = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalImagenes = 0;

    if (totalCalificaciones > 0) {
      const sumaCalificaciones = comentariosConCalificacion.reduce((suma, c) => suma + (c.calificacion || 0), 0);
      calificacionPromedio = Math.round((sumaCalificaciones / totalCalificaciones) * 10) / 10;

      comentariosConCalificacion.forEach(c => {
        if (c.calificacion) {
          distribucionCalificaciones[c.calificacion as keyof typeof distribucionCalificaciones]++;
        }
      });
    }

    // Usar casting para acceder a la relación imagenes
    comentarios.forEach(c => {
      const comentarioConImagenes = c as any;
      if (comentarioConImagenes.imagenes) {
        totalImagenes += comentarioConImagenes.imagenes.length;
      }
    });

    return {
      total_comentarios: totalComentarios,
      total_calificaciones: totalCalificaciones,
      calificacion_promedio: calificacionPromedio,
      distribucion_calificaciones: distribucionCalificaciones,
      total_imagenes: totalImagenes
    };
  }
}

export default ComentarioController;