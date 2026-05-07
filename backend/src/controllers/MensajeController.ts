import { Request, Response } from 'express';
import MensajeContacto from '../models/MensajeContacto.js';
import logger from '../services/loggerService.js';
import { ok, okList, okPaginated, okMessage, errorResponse } from '../utils/apiResponse.js';

/**
 * Controlador para la gestión de mensajes de contacto
 * 
 * Permite recibir mensajes de la web y gestionarlos desde el panel administrativo.
 */
class MensajeController {
  
  /**
   * Obtiene todos los mensajes con paginación
   * Acceso: ADMIN, GERENTE
   */
  static async getMensajes(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = (page - 1) * limit;
      const { leido } = req.query;

      const where: any = {};
      if (leido !== undefined) {
        where.leido = leido === 'true';
      }

      const { count, rows: mensajes } = await MensajeContacto.findAndCountAll({
        where,
        limit,
        offset,
        order: [['fyh_creacion', 'DESC']]
      });

      return res.json(okPaginated(mensajes, {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }));
    } catch (error) {
      logger.error('Error al obtener mensajes de contacto:', error);
      return res.status(500).json(errorResponse('Error al obtener los mensajes'));
    }
  }

  /**
   * Obtiene un mensaje por su ID
   * Acceso: ADMIN, GERENTE
   */
  static async getMensajeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const mensaje = await MensajeContacto.findByPk(id);

      if (!mensaje) {
        return res.status(404).json(errorResponse('Mensaje no encontrado'));
      }

      return res.json(ok(mensaje));
    } catch (error) {
      logger.error('Error al obtener mensaje por ID:', error);
      return res.status(500).json(errorResponse('Error al obtener el mensaje'));
    }
  }

  /**
   * Crea un nuevo mensaje (Público)
   * Acceso: Público
   */
  static async createMensaje(req: Request, res: Response) {
    try {
      const { nombre, email, telefono, asunto, mensaje } = req.body;

      if (!nombre || !email || !asunto || !mensaje) {
        return res.status(400).json(errorResponse('Todos los campos obligatorios deben estar presentes'));
      }

      const nuevoMensaje = await MensajeContacto.create({
        nombre,
        email,
        telefono,
        asunto,
        mensaje,
        leido: false,
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      logger.info('Nuevo mensaje de contacto recibido', {
        id_mensaje: nuevoMensaje.id_mensaje_contacto,
        email: nuevoMensaje.email
      });

      return res.status(201).json(okMessage('Mensaje enviado correctamente. Nos pondremos en contacto pronto.'));
    } catch (error) {
      logger.error('Error al crear mensaje de contacto:', error);
      return res.status(500).json(errorResponse('Error al enviar el mensaje'));
    }
  }

  /**
   * Marca un mensaje como leído/no leído
   * Acceso: ADMIN, GERENTE
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { leido } = req.body;

      if (leido === undefined) {
        return res.status(400).json(errorResponse('El estado leido es requerido'));
      }

      const mensaje = await MensajeContacto.findByPk(id);
      if (!mensaje) {
        return res.status(404).json(errorResponse('Mensaje no encontrado'));
      }

      await mensaje.update({
        leido: !!leido,
        fyh_actualizacion: new Date()
      });

      return res.json(okMessage(`Mensaje marcado como ${leido ? 'leído' : 'no leído'}`));
    } catch (error) {
      logger.error('Error al actualizar estado del mensaje:', error);
      return res.status(500).json(errorResponse('Error al actualizar el mensaje'));
    }
  }

  /**
   * Elimina un mensaje
   * Acceso: ADMIN
   */
  static async deleteMensaje(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await MensajeContacto.destroy({ where: { id_mensaje_contacto: id } });

      if (!deleted) {
        return res.status(404).json(errorResponse('Mensaje no encontrado'));
      }

      return res.json(okMessage('Mensaje eliminado correctamente'));
    } catch (error) {
      logger.error('Error al eliminar mensaje de contacto:', error);
      return res.status(500).json(errorResponse('Error al eliminar el mensaje'));
    }
  }
}

export default MensajeController;
