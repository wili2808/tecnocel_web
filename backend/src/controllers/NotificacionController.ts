import { Request, Response } from 'express';
import type { ClienteSession } from '../types/express.d.js';
import notificationService from '../services/notificationService.js';
import logger from '../services/loggerService.js';

/**
 * Controlador para gestión de notificaciones in-app de clientes.
 *
 * Todos los endpoints requieren autenticación de cliente
 * (middleware verificarTokenCliente).
 *
 * @class NotificacionController
 */
export class NotificacionController {
  /**
   * Devuelve la cantidad de notificaciones no leídas del cliente autenticado.
   *
   * GET /api/notificaciones/no-leidas
   *
   * Response 200: { success: true, data: { count: number } }
   */
  static async getNoLeidas(req: Request, res: Response) {
    try {
      const cliente = req.usuario as ClienteSession;
      const count = await notificationService.contarNoLeidas(cliente.id);

      return res.json({ success: true, data: { count } });
    } catch (error) {
      logger.error('Error obteniendo notificaciones no leídas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Devuelve las notificaciones del cliente autenticado con paginación.
   *
   * GET /api/notificaciones?pagina=1&limite=20
   *
   * Response 200: { success: true, data: [...], pagination: { total, pagina, limite, paginas } }
   */
  static async getNotificaciones(req: Request, res: Response) {
    try {
      const cliente = req.usuario as ClienteSession;
      const pagina = Math.max(1, parseInt(req.query.pagina as string) || 1);
      const limite = Math.min(100, Math.max(1, parseInt(req.query.limite as string) || 20));

      const { rows, count } = await notificationService.obtenerNotificaciones(
        cliente.id,
        pagina,
        limite
      );

      return res.json({
        success: true,
        data: {
          notificaciones: rows,
          total: count,
          pagina,
          limite,
          totalPaginas: Math.ceil(count / limite)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo notificaciones:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Marca una notificación específica como leída.
   *
   * PUT /api/notificaciones/:id/leer
   *
   * Response 200: { success: true, mensaje: 'Notificación marcada como leída' }
   * Response 404: { error: 'Notificación no encontrada' }
   */
  static async marcarLeida(req: Request, res: Response) {
    try {
      const cliente = req.usuario as ClienteSession;
      const idNotificacion = parseInt(req.params.id);

      if (isNaN(idNotificacion)) {
        return res.status(400).json({ error: 'ID de notificación inválido' });
      }

      const actualizado = await notificationService.marcarLeida(idNotificacion, cliente.id);

      if (!actualizado) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      return res.json({ success: true, mensaje: 'Notificación marcada como leída' });
    } catch (error) {
      logger.error('Error marcando notificación como leída:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Marca todas las notificaciones no leídas del cliente como leídas.
   *
   * PUT /api/notificaciones/leer-todas
   *
   * Response 200: { success: true, data: { actualizadas: number } }
   */
  static async marcarTodasLeidas(req: Request, res: Response) {
    try {
      const cliente = req.usuario as ClienteSession;
      const actualizadas = await notificationService.marcarTodasLeidas(cliente.id);

      return res.json({ success: true, data: { actualizadas } });
    } catch (error) {
      logger.error('Error marcando todas las notificaciones como leídas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Elimina una notificación del cliente autenticado.
   *
   * DELETE /api/notificaciones/:id
   *
   * Response 200: { success: true, mensaje: 'Notificación eliminada' }
   * Response 404: { error: 'Notificación no encontrada' }
   */
  static async eliminarNotificacion(req: Request, res: Response) {
    try {
      const cliente = req.usuario as ClienteSession;
      const idNotificacion = parseInt(req.params.id);

      if (isNaN(idNotificacion)) {
        return res.status(400).json({ error: 'ID de notificación inválido' });
      }

      const eliminado = await notificationService.eliminarNotificacion(idNotificacion, cliente.id);

      if (!eliminado) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      return res.json({ success: true, mensaje: 'Notificación eliminada' });
    } catch (error) {
      logger.error('Error eliminando notificación:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
