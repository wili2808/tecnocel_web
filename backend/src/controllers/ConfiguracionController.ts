import { Request, Response } from 'express';
import Configuracion from '../models/Configuracion.js';
import logger from '../services/loggerService.js';

export class ConfiguracionController {
  /**
   * Obtiene todas las configuraciones
   */
  static async getAll(_req: Request, res: Response) {
    try {
      const configs = await Configuracion.findAll();
      return res.status(200).json(configs);
    } catch (error) {
      logger.error('Error en ConfiguracionController.getAll:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene configuraciones públicas (sin requerir token)
   */
  static async getPublic(_req: Request, res: Response) {
    try {
      // Solo retornar claves que son seguras para el público
      const publicKeys = [
        'maintenance_mode',
        'site_name',
        'contact_email',
        'contact_phone',
        'facebook_url',
        'instagram_url',
        'whatsapp_url',
        'office_hours'
      ];

      const configs = await Configuracion.findAll({
        where: {
          clave: publicKeys
        }
      });
      return res.status(200).json(configs);
    } catch (error) {
      logger.error('Error en ConfiguracionController.getPublic:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene una configuración por clave
   */
  static async getByKey(req: Request, res: Response) {
    try {
      const { clave } = req.params;
      const config = await Configuracion.findByPk(clave);
      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }
      return res.status(200).json(config);
    } catch (error) {
      logger.error('Error en ConfiguracionController.getByKey:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Actualiza o crea una configuración
   */
  static async update(req: Request, res: Response) {
    try {
      const { clave } = req.params;
      const { valor } = req.body;

      if (valor === undefined) {
        return res.status(400).json({ error: 'El valor es requerido' });
      }

      const [config, created] = await Configuracion.upsert({
        clave,
        valor,
        fyh_actualizacion: new Date()
      });

      return res.status(200).json({
        success: true,
        message: created ? 'Configuración creada' : 'Configuración actualizada',
        data: config
      });
    } catch (error) {
      logger.error('Error en ConfiguracionController.update:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Actualiza múltiples configuraciones (Bulk Update)
   */
  static async bulkUpdate(req: Request, res: Response) {
    try {
      const { configuraciones } = req.body;

      if (!configuraciones || typeof configuraciones !== 'object') {
        return res.status(400).json({ error: 'Formato de configuraciones inválido' });
      }

      const promises = Object.entries(configuraciones).map(([clave, valor]) => {
        return Configuracion.upsert({
          clave,
          valor: String(valor),
          fyh_actualizacion: new Date()
        });
      });

      await Promise.all(promises);

      return res.status(200).json({
        success: true,
        message: 'Configuraciones actualizadas correctamente'
      });
    } catch (error) {
      logger.error('Error en ConfiguracionController.bulkUpdate:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
