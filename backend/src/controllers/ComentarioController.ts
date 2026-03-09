import { Request, Response } from 'express';
import { Op } from 'sequelize';
import type { Order } from 'sequelize';
import type {
  ComentarioCreateData,
  ComentarioImagenData,
  GetComentariosQuery,
  ActualizarComentarioData,
  CrearRespuestaClienteBody,
  CrearRespuestaAdminBody,
  ModerarComentarioBody,
  ModerarRespuestaBody
} from '../types/comentario.types.js';
import Comentario from '../models/Comentario.js';
import ComentarioRespuesta from '../models/ComentarioRespuesta.js';
import ComentarioImagen from '../models/ComentarioImagen.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import logger from '../services/loggerService.js';
import { getImageService } from '../services/imageService.js';

/**
 * Controlador para gestión de comentarios y reseñas de productos
 *
 * Maneja el sistema completo de comentarios de clientes sobre productos, incluyendo:
 * - CRUD de comentarios con calificaciones (1-5 estrellas)
 * - Gestión de imágenes adjuntas a comentarios (hasta 5 por comentario)
 * - Cálculo de estadísticas y promedios de calificaciones
 * - Paginación y ordenamiento de comentarios
 * - Soft delete de comentarios
 * - Respuestas de administradores a comentarios
 *
 * Todos los endpoints transforman URLs de imágenes a URLs completas mediante imageService.
 *
 * @class ComentarioController
 */
class ComentarioController {

  /**
   * Transforma comentarios agregando URLs completas de imágenes
   *
   * Método helper privado que procesa un array de comentarios y enriquece cada uno
   * con URLs completas de imágenes usando el servicio de imágenes. Maneja
   * gracefully la ausencia del servicio retornando comentarios sin transformar.
   *
   * @private
   * @param comentarios - Array de comentarios Sequelize a transformar
   * @returns Promise que resuelve con array de comentarios transformados con URLs de imágenes
   */
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

  /**
   * Obtiene comentarios de un producto con paginación y ordenamiento
   *
   * Endpoint público que retorna comentarios activos de un producto con:
   * - Paginación (limite y offset)
   * - Ordenamiento configurable (recientes, antiguos, mejor/peor calificación)
   * - Información del cliente autor
   * - Imágenes adjuntas transformadas con URLs completas
   * - Respuestas de administradores si existen
   * - Estadísticas del producto (promedio, distribución de calificaciones)
   *
   * @param req - Express Request con params.id_producto y query {limite?, offset?, orden?}
   * @param res - Express Response object
   * @returns 200 con { mensaje, datos: { comentarios, paginacion, estadisticas } }
   * @returns 400 si el ID del producto es inválido
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/comentarios/producto/123?limite=10&offset=0&orden=recientes
   * Response: {
   *   mensaje: "Comentarios obtenidos exitosamente",
   *   datos: {
   *     comentarios: [...],
   *     paginacion: { total: 45, limite: 10, offset: 0, paginas: 5 },
   *     estadisticas: { total_comentarios: 45, calificacion_promedio: 4.5, ... }
   *   }
   * }
   */
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
      let orderClause: Order = [['fyh_creacion', 'DESC']];
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
          },
          {
            model: ComentarioRespuesta,
            as: 'respuestas',
            where: { estado: 'activo' },
            required: false,
            include: [
              { model: Cliente, as: 'clienteAutor', attributes: ['nombre_cliente', 'apellido_cliente'] },
              { model: Usuario, as: 'usuarioAutor', attributes: ['nombres'] }
            ]
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

  /**
   * Crea un nuevo comentario con calificación e imágenes opcionales
   *
   * Endpoint protegido que permite a clientes autenticados crear comentarios sobre productos.
   * Valida:
   * - Existencia del producto y cliente
   * - Comentario entre 10 y 2000 caracteres
   * - Calificación entre 1 y 5 (opcional)
   * - Máximo 5 imágenes adjuntas
   *
   * El comentario se crea con estado 'activo' y es_verificado=false por defecto.
   *
   * @param req - Express Request con body {id_producto, id_cliente, comentario, calificacion?, imagenes?}
   * @param res - Express Response object
   * @returns 201 con { mensaje, datos: { comentario } } comentario creado con imágenes transformadas
   * @returns 400 si faltan datos, datos inválidos o demasiadas imágenes
   * @returns 404 si el producto o cliente no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/comentarios
   * Body: {
   *   id_producto: 123,
   *   id_cliente: 45,
   *   comentario: "Excelente producto, superó mis expectativas",
   *   calificacion: 5,
   *   imagenes: [{ url_imagen: "foto1.jpg", alt_text: "Producto en uso" }]
   * }
   */
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

  /**
   * Actualiza un comentario existente
   *
   * Endpoint protegido que permite modificar el texto, calificación e imágenes de un comentario.
   * Permite:
   * - Actualizar texto del comentario (10-2000 caracteres)
   * - Modificar calificación (1-5)
   * - Eliminar imágenes específicas por ID
   * - Agregar nuevas imágenes
   *
   * @param req - Express Request con params.id_comentario y body {comentario?, calificacion?, imagenes_a_eliminar?, imagenes?}
   * @param res - Express Response object
   * @returns 200 con { mensaje, datos: { comentario } } comentario actualizado
   * @returns 400 si el ID o datos son inválidos
   * @returns 404 si el comentario no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * PUT /api/comentarios/5
   * Body: {
   *   comentario: "Actualizo mi opinión: el producto es excelente",
   *   calificacion: 5,
   *   imagenes_a_eliminar: [1, 2],
   *   imagenes: [{ ruta_imagen: "nueva.jpg", alt_text: "Nueva foto" }]
   * }
   */
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

  /**
   * Elimina un comentario (soft delete) junto con sus imágenes
   *
   * Endpoint protegido que marca un comentario como 'eliminado' (estado='eliminado')
   * sin borrarlo permanentemente de la BD. También:
   * - Elimina archivos físicos de imágenes del servidor
   * - Elimina registros de imágenes de la BD (hard delete)
   * - Registra cuántos archivos fueron eliminados exitosamente
   *
   * @param req - Express Request con params.id_comentario
   * @param res - Express Response object
   * @returns 200 con { mensaje, datos: { imagenes_eliminadas, archivos_eliminados } }
   * @returns 400 si el ID es inválido
   * @returns 404 si el comentario no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * DELETE /api/comentarios/5
   * Response: {
   *   mensaje: "Comentario eliminado exitosamente",
   *   datos: { imagenes_eliminadas: 3, archivos_eliminados: 3 }
   * }
   */
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

  /**
   * Elimina una imagen específica de un comentario
   *
   * Endpoint protegido que permite a clientes eliminar imágenes individuales de sus propios comentarios.
   * Verifica que:
   * - El usuario está autenticado
   * - El comentario pertenece al usuario autenticado
   * - La imagen existe y pertenece al comentario
   *
   * Elimina tanto el archivo físico como el registro de la BD.
   *
   * @param req - Express Request con params {id_comentario, id_imagen} y req.usuario
   * @param res - Express Response object
   * @returns 200 con { mensaje, datos: { id_imagen, archivo_eliminado } }
   * @returns 400 si los IDs son inválidos
   * @returns 401 si el usuario no está autenticado
   * @returns 403 si el comentario no pertenece al usuario
   * @returns 404 si el comentario o imagen no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * DELETE /api/comentarios/5/imagenes/12
   * Response: {
   *   mensaje: "Imagen eliminada exitosamente",
   *   datos: { id_imagen: 12, archivo_eliminado: true }
   * }
   */
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
      const userId = req.usuario?.id;
      
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

  /**
   * Obtiene estadísticas de comentarios de un producto
   *
   * Endpoint público que calcula y retorna estadísticas agregadas de todos los
   * comentarios activos de un producto:
   * - Total de comentarios
   * - Total de calificaciones
   * - Calificación promedio (redondeado a 1 decimal)
   * - Distribución de calificaciones (cuántos de cada estrella)
   * - Total de imágenes adjuntas
   *
   * @param req - Express Request con params.id_producto
   * @param res - Express Response object
   * @returns 200 con { mensaje, datos: estadisticas }
   * @returns 400 si el ID del producto es inválido
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/comentarios/producto/123/estadisticas
   * Response: {
   *   mensaje: "Estadísticas obtenidas exitosamente",
   *   datos: {
   *     total_comentarios: 45,
   *     total_calificaciones: 40,
   *     calificacion_promedio: 4.3,
   *     distribucion_calificaciones: { 1: 2, 2: 3, 3: 5, 4: 15, 5: 15 },
   *     total_imagenes: 78
   *   }
   * }
   */
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

  /**
   * Calcula estadísticas agregadas de comentarios de un producto
   *
   * Método helper privado que procesa todos los comentarios activos de un producto
   * y calcula estadísticas detalladas. Incluye manejo de comentarios sin calificación.
   *
   * @private
   * @param id_producto - ID del producto para calcular estadísticas
   * @returns Promise con objeto de estadísticas {total_comentarios, calificacion_promedio, distribucion_calificaciones, total_imagenes}
   */
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

  async crearRespuestaCliente(req: Request, res: Response): Promise<void> {
    try {
      const { id_comentario } = req.params;
      const { contenido }: CrearRespuestaClienteBody = req.body;
      const idCliente = req.usuario?.id;

      const comentarioId = parseInt(id_comentario);
      if (!comentarioId || comentarioId <= 0) {
        res.status(400).json({ mensaje: 'ID de comentario inválido', error: 'El ID debe ser un número positivo' });
        return;
      }

      if (!idCliente) {
        res.status(401).json({ mensaje: 'No autenticado', error: 'Se requiere autenticación' });
        return;
      }

      if (!contenido || contenido.trim().length < 1 || contenido.trim().length > 1000) {
        res.status(400).json({ mensaje: 'Contenido inválido', error: 'El contenido debe tener entre 1 y 1000 caracteres' });
        return;
      }

      const comentario = await Comentario.findOne({
        where: { id_comentario: comentarioId, estado: 'activo' }
      });

      if (!comentario) {
        res.status(404).json({ mensaje: 'Comentario no encontrado', error: 'El comentario especificado no existe' });
        return;
      }

      const respuesta = await ComentarioRespuesta.create({
        id_comentario: comentarioId,
        id_cliente: idCliente,
        id_usuario: null,
        tipo_autor: 'cliente',
        contenido: contenido.trim(),
        estado: 'activo',
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      const respuestaCompleta = await ComentarioRespuesta.findByPk(respuesta.id_respuesta, {
        include: [
          { model: Cliente, as: 'clienteAutor', attributes: ['nombre_cliente', 'apellido_cliente'] }
        ]
      });

      logger.info('Respuesta de cliente creada', { id_respuesta: respuesta.id_respuesta, id_comentario: comentarioId });

      res.status(201).json({
        mensaje: 'Respuesta creada exitosamente',
        datos: { respuesta: respuestaCompleta?.toJSON() }
      });
    } catch (error) {
      logger.error('Error al crear respuesta de cliente:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ mensaje: 'Error interno del servidor', error: 'No se pudo crear la respuesta' });
    }
  }

  async crearRespuestaAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id_comentario } = req.params;
      const { contenido }: CrearRespuestaAdminBody = req.body;
      const idUsuario = req.usuario?.id;

      const comentarioId = parseInt(id_comentario);
      if (!comentarioId || comentarioId <= 0) {
        res.status(400).json({ mensaje: 'ID de comentario inválido', error: 'El ID debe ser un número positivo' });
        return;
      }

      if (!idUsuario) {
        res.status(401).json({ mensaje: 'No autenticado', error: 'Se requiere autenticación' });
        return;
      }

      if (!contenido || contenido.trim().length < 1 || contenido.trim().length > 1000) {
        res.status(400).json({ mensaje: 'Contenido inválido', error: 'El contenido debe tener entre 1 y 1000 caracteres' });
        return;
      }

      const comentario = await Comentario.findByPk(comentarioId);
      if (!comentario) {
        res.status(404).json({ mensaje: 'Comentario no encontrado', error: 'El comentario especificado no existe' });
        return;
      }

      const respuesta = await ComentarioRespuesta.create({
        id_comentario: comentarioId,
        id_cliente: null,
        id_usuario: idUsuario,
        tipo_autor: 'admin',
        contenido: contenido.trim(),
        estado: 'activo',
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      const respuestaCompleta = await ComentarioRespuesta.findByPk(respuesta.id_respuesta, {
        include: [
          { model: Usuario, as: 'usuarioAutor', attributes: ['nombres'] }
        ]
      });

      logger.info('Respuesta de admin creada', { id_respuesta: respuesta.id_respuesta, id_comentario: comentarioId, id_usuario: idUsuario });

      res.status(201).json({
        mensaje: 'Respuesta oficial creada exitosamente',
        datos: { respuesta: respuestaCompleta?.toJSON() }
      });
    } catch (error) {
      logger.error('Error al crear respuesta de admin:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ mensaje: 'Error interno del servidor', error: 'No se pudo crear la respuesta oficial' });
    }
  }

  async eliminarRespuesta(req: Request, res: Response): Promise<void> {
    try {
      const { id_respuesta } = req.params;
      const idUsuarioActual = req.usuario?.id;

      const respuestaId = parseInt(id_respuesta);
      if (!respuestaId || respuestaId <= 0) {
        res.status(400).json({ mensaje: 'ID de respuesta inválido', error: 'El ID debe ser un número positivo' });
        return;
      }

      const respuesta = await ComentarioRespuesta.findByPk(respuestaId);
      if (!respuesta || respuesta.estado === 'eliminado') {
        res.status(404).json({ mensaje: 'Respuesta no encontrada', error: 'La respuesta especificada no existe' });
        return;
      }

      if (!idUsuarioActual) {
        res.status(401).json({ mensaje: 'No autenticado', error: 'Debes estar autenticado para realizar esta acción' });
        return;
      }

      if (respuesta.tipo_autor !== 'cliente' || respuesta.id_cliente !== idUsuarioActual) {
        res.status(403).json({ mensaje: 'Acceso denegado', error: 'Solo puedes eliminar tus propias respuestas' });
        return;
      }

      await respuesta.update({ estado: 'eliminado' });

      logger.info('Respuesta eliminada', { id_respuesta: respuestaId });
      res.status(200).json({ mensaje: 'Respuesta eliminada exitosamente' });
    } catch (error) {
      logger.error('Error al eliminar respuesta:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ mensaje: 'Error interno del servidor', error: 'No se pudo eliminar la respuesta' });
    }
  }

  async moderarComentario(req: Request, res: Response): Promise<void> {
    try {
      const { id_comentario } = req.params;
      const { estado }: ModerarComentarioBody = req.body;

      const comentarioId = parseInt(id_comentario);
      if (!comentarioId || comentarioId <= 0) {
        res.status(400).json({ mensaje: 'ID de comentario inválido', error: 'El ID debe ser un número positivo' });
        return;
      }

      if (!['activo', 'oculto', 'eliminado'].includes(estado)) {
        res.status(400).json({ mensaje: 'Estado inválido', error: 'Valores permitidos: activo, oculto, eliminado' });
        return;
      }

      const comentario = await Comentario.findByPk(comentarioId);
      if (!comentario) {
        res.status(404).json({ mensaje: 'Comentario no encontrado', error: 'El comentario especificado no existe' });
        return;
      }

      await comentario.update({ estado, fyh_actualizacion: new Date() });

      logger.info('Comentario moderado', { id_comentario: comentarioId, nuevo_estado: estado, moderador: req.usuario?.id });
      res.status(200).json({
        mensaje: `Comentario ${estado === 'oculto' ? 'ocultado' : estado === 'eliminado' ? 'eliminado' : 'restaurado'} exitosamente`,
        datos: { id_comentario: comentarioId, estado }
      });
    } catch (error) {
      logger.error('Error al moderar comentario:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ mensaje: 'Error interno del servidor', error: 'No se pudo moderar el comentario' });
    }
  }

  async moderarRespuesta(req: Request, res: Response): Promise<void> {
    try {
      const { id_respuesta } = req.params;
      const { estado }: ModerarRespuestaBody = req.body;

      const respuestaId = parseInt(id_respuesta);
      if (!respuestaId || respuestaId <= 0) {
        res.status(400).json({ mensaje: 'ID de respuesta inválido', error: 'El ID debe ser un número positivo' });
        return;
      }

      if (!['activo', 'oculto', 'eliminado'].includes(estado)) {
        res.status(400).json({ mensaje: 'Estado inválido', error: 'Valores permitidos: activo, oculto, eliminado' });
        return;
      }

      const respuesta = await ComentarioRespuesta.findByPk(respuestaId);
      if (!respuesta) {
        res.status(404).json({ mensaje: 'Respuesta no encontrada', error: 'La respuesta especificada no existe' });
        return;
      }

      await respuesta.update({ estado });

      logger.info('Respuesta moderada', { id_respuesta: respuestaId, nuevo_estado: estado, moderador: req.usuario?.id });
      res.status(200).json({
        mensaje: 'Respuesta moderada exitosamente',
        datos: { id_respuesta: respuestaId, estado }
      });
    } catch (error) {
      logger.error('Error al moderar respuesta:', { error: error instanceof Error ? error.message : error });
      res.status(500).json({ mensaje: 'Error interno del servidor', error: 'No se pudo moderar la respuesta' });
    }
  }
}

export default ComentarioController;