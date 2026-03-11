import Notificacion, { TipoNotificacion } from '../models/Notificacion.js';
import logger from './loggerService.js';

/**
 * Servicio de notificaciones in-app para clientes.
 *
 * Provee métodos para crear, consultar, marcar como leídas y eliminar
 * notificaciones. El método `crearNotificacion` es fire-and-forget:
 * captura cualquier error internamente para no interrumpir el flujo
 * del llamador.
 */
const notificationService = {
  /**
   * Crea una notificación para un cliente.
   * Fire-and-forget: los errores se capturan internamente.
   */
  crearNotificacion(
    idCliente: number,
    tipo: TipoNotificacion,
    titulo: string,
    mensaje: string,
    idReferencia?: number,
    enlace?: string
  ): void {
    Notificacion.create({
      id_cliente: idCliente,
      tipo,
      titulo,
      mensaje,
      id_referencia: idReferencia ?? null,
      enlace: enlace ?? null,
      leido: false,
      fyh_creacion: new Date(),
      fyh_lectura: null
    }).catch((error: unknown) => {
      logger.error('Error al crear notificación:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        idCliente,
        tipo
      });
    });
  },

  /**
   * Retorna la cantidad de notificaciones no leídas de un cliente.
   */
  async contarNoLeidas(idCliente: number): Promise<number> {
    return Notificacion.count({
      where: { id_cliente: idCliente, leido: false }
    });
  },

  /**
   * Retorna las notificaciones de un cliente paginadas, ordenadas DESC por fecha.
   */
  async obtenerNotificaciones(
    idCliente: number,
    pagina: number = 1,
    limite: number = 20
  ): Promise<{ rows: Notificacion[]; count: number }> {
    const offset = (pagina - 1) * limite;
    return Notificacion.findAndCountAll({
      where: { id_cliente: idCliente },
      order: [['fyh_creacion', 'DESC']],
      limit: limite,
      offset
    });
  },

  /**
   * Marca una notificación específica como leída.
   * Verifica que pertenezca al cliente indicado.
   * @returns true si se actualizó, false si no se encontró.
   */
  async marcarLeida(idNotificacion: number, idCliente: number): Promise<boolean> {
    // Primero verificamos que la notificación pertenece al cliente
    const notificacion = await Notificacion.findOne({
      where: { id_notificacion: idNotificacion, id_cliente: idCliente }
    });
    if (!notificacion) return false;

    // Solo actualizamos si aún no está leída
    if (!notificacion.leido) {
      await Notificacion.update(
        { leido: true, fyh_lectura: new Date() },
        { where: { id_notificacion: idNotificacion, id_cliente: idCliente } }
      );
    }
    return true;
  },

  /**
   * Marca todas las notificaciones no leídas de un cliente como leídas.
   * @returns Cantidad de notificaciones actualizadas.
   */
  async marcarTodasLeidas(idCliente: number): Promise<number> {
    const [affectedRows] = await Notificacion.update(
      { leido: true, fyh_lectura: new Date() },
      {
        where: {
          id_cliente: idCliente,
          leido: false
        }
      }
    );
    return affectedRows;
  },

  /**
   * Elimina una notificación.
   * Verifica que pertenezca al cliente indicado.
   * @returns true si se eliminó, false si no se encontró.
   */
  async eliminarNotificacion(idNotificacion: number, idCliente: number): Promise<boolean> {
    const deleted = await Notificacion.destroy({
      where: {
        id_notificacion: idNotificacion,
        id_cliente: idCliente
      }
    });
    return deleted > 0;
  }
};

export default notificationService;
