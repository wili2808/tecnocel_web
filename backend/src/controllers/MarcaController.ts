import { Request, Response } from 'express';
import Marca from '../models/Marca.js';
import logger from '../utils/logger.js';

export class MarcaController {
  // Obtener todas las marcas activas
  static async getAllMarcas(req: Request, res: Response) {
    try {
      const marcas = await Marca.findAll({
        where: { activo: true },
        order: [['nombre_marca', 'ASC']]
      });

      res.json({
        success: true,
        data: marcas,
        count: marcas.length
      });
    } catch (error) {
      logger.error('Error obteniendo marcas:', error);
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
      
      const marca = await Marca.findOne({
        where: { 
          id_marca: id,
          activo: true 
        }
      });

      if (!marca) {
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }

      res.json({
        success: true,
        data: marca
      });
    } catch (error) {
      logger.error('Error obteniendo marca:', error);
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

      if (!nombre_marca) {
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

      logger.info(`Nueva marca creada: ${nombre_marca} (ID: ${nuevaMarca.id_marca})`);

      res.status(201).json({
        success: true,
        message: 'Marca creada exitosamente',
        data: nuevaMarca
      });
    } catch (error) {
      logger.error('Error creando marca:', error);
      
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

      const marca = await Marca.findByPk(id);
      
      if (!marca) {
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

      logger.info(`Marca actualizada: ${marca.nombre_marca} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Marca actualizada exitosamente',
        data: marca
      });
    } catch (error) {
      logger.error('Error actualizando marca:', error);
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

      const marca = await Marca.findByPk(id);
      
      if (!marca) {
        return res.status(404).json({
          success: false,
          message: 'Marca no encontrada'
        });
      }

      await marca.update({
        activo: false,
        fyh_actualizacion: new Date()
      });

      logger.info(`Marca desactivada: ${marca.nombre_marca} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Marca eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando marca:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}