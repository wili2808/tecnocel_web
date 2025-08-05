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
  nombre_archivo: string;
  ruta_imagen: string;
  tipo_archivo: string;
  tamaño_archivo?: number;
  alt_text?: string;
  orden: number;
}

interface GetComentariosQuery {
  limite?: string;
  offset?: string;
  orden?: 'recientes' | 'antiguos' | 'mejor_calificacion' | 'peor_calificacion';
}

class ComentarioController {
  
  // Método helper para transformar comentarios con URLs de imágenes
  private transformComentariosWithImages(comentarios: any[]): any[] {
    try {
      if (!comentarios || comentarios.length === 0) {
        return [];
      }

      const imageService = getImageService();
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      
      return comentarios.map(comentario => {
        const comentarioData = comentario.toJSON ? comentario.toJSON() : comentario;
        
        // Transformar imágenes si existen
        if (comentarioData.imagenes && comentarioData.imagenes.length > 0) {
          comentarioData.imagenes = comentarioData.imagenes.map((imagen: any) => {
            const imagenData = imagen.toJSON ? imagen.toJSON() : imagen;
            
            if (imageService && imagenData.ruta_imagen) {
              imagenData.imagen_url = imageService.generateImageUrl(imagenData.ruta_imagen);
            } else if (imagenData.ruta_imagen) {
              imagenData.imagen_url = `${baseUrl}/api/images/${imagenData.ruta_imagen}`;
            }
            
            return imagenData;
          });
        }
        
        return comentarioData;
      });
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
            where: { estado: 'activo' },
            required: false,
            attributes: ['id_imagen', 'nombre_archivo', 'ruta_imagen', 'alt_text', 'orden']
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
      const comentariosTransformados = this.transformComentariosWithImages(comentarios);

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

        const imagenesData = imagenes.map((imagen, index) => ({
          id_comentario: nuevoComentario.id_comentario,
          nombre_archivo: imagen.nombre_archivo,
          ruta_imagen: imagen.ruta_imagen,
          tipo_archivo: imagen.tipo_archivo,
          tamaño_archivo: imagen.tamaño_archivo,
          alt_text: imagen.alt_text,
          orden: imagen.orden || (index + 1),
          estado: 'activo' as const,
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
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
            where: { estado: 'activo' },
            required: false
          }
        ]
      });

      // Transformar con URLs de imágenes
      const comentarioTransformado = this.transformComentariosWithImages([comentarioCompleto])[0];

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
      const { comentario, calificacion } = req.body;

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
            where: { estado: 'activo' },
            required: false
          }
        ]
      });

      const comentarioTransformado = this.transformComentariosWithImages([comentarioActualizado])[0];

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

      // Soft delete
      await comentario.update({
        estado: 'eliminado',
        fyh_actualizacion: new Date()
      });

      // También marcar las imágenes como eliminadas
      await ComentarioImagen.update(
        { 
          estado: 'eliminado',
          fyh_actualizacion: new Date()
        },
        { 
          where: { id_comentario: comentarioId } 
        }
      );

      res.status(200).json({
        mensaje: 'Comentario eliminado exitosamente'
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
          where: { estado: 'activo' },
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