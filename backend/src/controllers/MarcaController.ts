import { Request, Response } from 'express';
import Marca from '../models/Marca.js';
import logger from '../services/loggerService.js';
import { getImageService, ImageType } from '../services/imageService.js';
import sequelize from '../config/database.js';

interface CreateMarcaBody { nombre_marca: string; logo_marca?: string; descripcion_marca?: string; }
interface UpdateMarcaBody extends Partial<CreateMarcaBody> { activo?: boolean; }

/**
 * Enriquece datos de marca con URL completa del logo
 * @param marca - Instancia Sequelize de Marca o datos planos
 * @returns Datos de marca con logo_marca transformado a URL completa (o null)
 */
function enriquecerLogoMarca(marca: any): any {
  const imageService = getImageService();
  if (!imageService) return marca.toJSON ? marca.toJSON() : marca;
  const data = marca.toJSON ? marca.toJSON() : marca;
  return {
    ...data,
    logo_marca: data.logo_marca
      ? imageService.generateImageUrl(data.logo_marca, ImageType.BRAND)
      : null
  };
}

/**
 * Controlador para gestión de marcas de productos
 *
 * Maneja el catálogo de marcas permitiendo:
 * - CRUD completo de marcas
 * - Activar/desactivar marcas (soft delete)
 * - Listado de marcas activas
 *
 * Endpoints públicos para lectura, protegidos para escritura.
 *
 * @class MarcaController
 */
class MarcaController {
  /**
   * Obtiene todas las marcas activas ordenadas alfabéticamente
   * @param req - Express Request
   * @param res - Express Response
   * @returns 200 con { success, data, count }
   */
  static async getAllMarcas(req: Request, res: Response) {
    try {
      const soloInactivos = req.query.solo_inactivos === 'true';
      const verInactivos = req.query.ver_inactivos === 'true';
      
      const where: any = {};
      if (soloInactivos) {
        where.activo = 0;
      } else if (!verInactivos) {
        where.activo = 1;
      }
      
      const marcas = await Marca.findAll({
        where,
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM tb_almacen AS p
                WHERE p.id_marca = Marca.id_marca
              )`),
              'product_count'
            ]
          ]
        },
        order: [['nombre_marca', 'ASC']]
      });

      // Marcar para evitar log HTTP duplicado
      res.locals.skipHttpLog = true;
      
      logger.info('Marcas obtenidas exitosamente', {
        operacion: 'obtener_marcas',
        cantidad: marcas.length,
        success: true
      });

      res.json({
        success: true,
        data: marcas.map(enriquecerLogoMarca),
        count: marcas.length
      });
    } catch (error) {
      logger.error('Error obteniendo marcas:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene una marca específica por ID
   * @param req - Express Request con params.id
   * @returns 200 con { success, data } o 404 si no existe
   */
  static async getMarcaById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Obteniendo marca por ID: ${id}`);
      
      const marca = await Marca.findOne({
        where: { 
          id_marca: id,
          activo: true 
        }
      });

      if (!marca) {
        logger.warn(`Marca no encontrada con ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }

      // Marcar para evitar log HTTP duplicado
      res.locals.skipHttpLog = true;
      
      logger.info('Marca obtenida exitosamente', {
        operacion: 'obtener_marca_por_id',
        marca_id: id,
        nombre_marca: marca.nombre_marca,
        success: true
      });

      res.json({
        success: true,
        data: enriquecerLogoMarca(marca)
      });
    } catch (error) {
      logger.error('Error obteniendo marca por ID:', {
        marca_id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Crea una nueva marca (requiere admin)
   * @param req - Express Request con body {nombre_marca, logo_marca?, descripcion_marca?}
   * @returns 201 con { success, message, data }
   * @returns 400 si falta nombre_marca o ya existe
   */
  static async createMarca(req: Request, res: Response) {
    try {
      const { nombre_marca, logo_marca, descripcion_marca } = req.body as CreateMarcaBody;
      logger.debug('Creando nueva marca', { nombre_marca, logo_marca: !!logo_marca, descripcion_marca: !!descripcion_marca });

      if (!nombre_marca) {
        logger.warn('Intento de crear marca sin nombre');
        return res.status(400).json({
          success: false,
          message: 'El nombre de la marca es requerido'
        });
      }

      const now = new Date();
      
      const nuevaMarca = await Marca.create({
        nombre_marca,
        logo_marca: logo_marca || null,
        descripcion_marca: descripcion_marca || null,
        activo: true,
        fyh_creacion: now,
        fyh_actualizacion: now
      });

      // Marcar para evitar log HTTP duplicado
      res.locals.skipHttpLog = true;
      
      logger.info('Nueva marca creada exitosamente', {
        operacion: 'crear_marca',
        marca_id: nuevaMarca.id_marca,
        nombre_marca: nuevaMarca.nombre_marca,
        success: true
      });

      res.status(201).json({
        success: true,
        message: 'Marca creada exitosamente',
        data: nuevaMarca
      });
    } catch (error) {
      logger.error('Error creando marca:', {
        nombre_marca: req.body.nombre_marca,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una marca con ese nombre'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Actualiza una marca existente (requiere admin)
   * @param req - Express Request con params.id y body con campos a actualizar
   * @returns 200 con { success, message, data }
   * @returns 404 si la marca no existe
   */
  static async updateMarca(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre_marca, logo_marca, descripcion_marca, activo } = req.body as UpdateMarcaBody;
      logger.debug(`Actualizando marca ID: ${id}`, { nombre_marca, logo_marca: !!logo_marca, descripcion_marca: !!descripcion_marca, activo });

      const marca = await Marca.findByPk(id);
      
      if (!marca) {
        logger.warn(`Intento de actualizar marca inexistente ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }

      const datosActualizados: UpdateMarcaBody & { fyh_actualizacion: Date } = {
        fyh_actualizacion: new Date()
      };

      if (nombre_marca !== undefined) datosActualizados.nombre_marca = nombre_marca;
      if (logo_marca !== undefined) datosActualizados.logo_marca = logo_marca;
      if (descripcion_marca !== undefined) datosActualizados.descripcion_marca = descripcion_marca;
      if (activo !== undefined) datosActualizados.activo = activo;

      await marca.update(datosActualizados);

      // Marcar para evitar log HTTP duplicado
      res.locals.skipHttpLog = true;
      
      logger.info('Marca actualizada exitosamente', {
        operacion: 'actualizar_marca',
        marca_id: id,
        nombre_marca: marca.nombre_marca,
        campos_actualizados: Object.keys(datosActualizados),
        success: true
      });

      res.json({
        success: true,
        message: 'Marca actualizada exitosamente',
        data: marca
      });
    } catch (error) {
      logger.error('Error actualizando marca:', {
        marca_id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Desactiva una marca (soft delete) (requiere admin)
   *
   * No elimina la marca de la BD, solo marca activo=false.
   *
   * @param req - Express Request con params.id
   * @returns 200 con { success, message }
   * @returns 404 si la marca no existe
   */
  static async deleteMarca(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Desactivando marca ID: ${id}`);

      const marca = await Marca.findByPk(id);
      
      if (!marca) {
        logger.warn(`Intento de desactivar marca inexistente ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }

      await marca.update({
        activo: false,
        fyh_actualizacion: new Date()
      });

      // Marcar para evitar log HTTP duplicado
      res.locals.skipHttpLog = true;
      
      logger.info('Marca desactivada exitosamente', {
        operacion: 'desactivar_marca',
        marca_id: id,
        nombre_marca: marca.nombre_marca,
        success: true
      });

      res.json({
        success: true,
        message: 'Marca eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error desactivando marca:', {
        marca_id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export default MarcaController;