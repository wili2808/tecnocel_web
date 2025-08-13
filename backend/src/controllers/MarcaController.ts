import { Request, Response } from 'express';
import Marca from '../models/Marca.js';
import logger from '../services/loggerService.js';

export class MarcaController {
  // Obtener todas las marcas activas
  static async getAllMarcas(req: Request, res: Response) {
    try {
      logger.debug('Obteniendo todas las marcas activas');
      
      const marcas = await Marca.findAll({
        where: { activo: true },
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
        data: marcas,
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

  // Obtener marca por ID
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
        data: marca
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

  // Crear nueva marca (admin)
  static async createMarca(req: Request, res: Response) {
    try {
      const { nombre_marca, logo_marca, descripcion_marca } = req.body;
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

  // Actualizar marca (admin)
  static async updateMarca(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre_marca, logo_marca, descripcion_marca, activo } = req.body;
      logger.debug(`Actualizando marca ID: ${id}`, { nombre_marca, logo_marca: !!logo_marca, descripcion_marca: !!descripcion_marca, activo });

      const marca = await Marca.findByPk(id);
      
      if (!marca) {
        logger.warn(`Intento de actualizar marca inexistente ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }

      const datosActualizados: any = {
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

  // Eliminar marca (desactivar)
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