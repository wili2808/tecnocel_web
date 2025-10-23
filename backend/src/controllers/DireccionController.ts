import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Direccion from '../models/Direccion.js';
import Cliente from '../models/Cliente.js';
import logger from '../services/loggerService.js';

/**
 * Controlador para gestión de direcciones de envío
 *
 * Maneja las direcciones de entrega de los clientes permitiendo:
 * - CRUD completo de direcciones
 * - Establecer dirección predeterminada
 * - Gestión automática de dirección única predeterminada
 * - Direcciones de facturación
 *
 * Todos los endpoints requieren autenticación de cliente.
 *
 * @class DireccionController
 */
export class DireccionController {
  /**
   * Obtiene todas las direcciones de un cliente
   *
   * Endpoint protegido que retorna las direcciones ordenadas por:
   * 1. Predeterminada primero
   * 2. Más recientes primero
   *
   * @param req - Express Request con params.id_cliente
   * @param res - Express Response object
   * @returns 200 con { success, data, count }
   * @returns 404 si el cliente no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/direcciones/cliente/5
   * Response: {
   *   "success": true,
   *   "data": [
   *     {
   *       "id_direccion": 1,
   *       "nombre_direccion": "Casa",
   *       "calle": "Av. Siempre Viva",
   *       "numero": "742",
   *       "ciudad": "Santa Cruz",
   *       "es_predeterminada": true
   *     }
   *   ],
   *   "count": 3
   * }
   */
  static async getDireccionesCliente(req: Request, res: Response) {
    try {
      const { id_cliente } = req.params;

      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(id_cliente);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const direcciones = await Direccion.findAll({
        where: { id_cliente },
        order: [
          ['es_predeterminada', 'DESC'],
          ['fyh_creacion', 'DESC']
        ]
      });

      res.json({
        success: true,
        data: direcciones,
        count: direcciones.length
      });
    } catch (error) {
      logger.error('Error obteniendo direcciones del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene una dirección específica por ID
   * @param req - Express Request con params.id
   * @param res - Express Response object
   * @returns 200 con { success, data } si se encuentra
   * @returns 404 si la dirección no existe
   */
  static async getDireccionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clienteAutenticado = req.usuario?.id_cliente;

      const direccion = await Direccion.findByPk(id, {
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['nombre_cliente', 'apellido_cliente']
          }
        ]
      });

      if (!direccion) {
        return res.status(404).json({
          success: false,
          message: 'Dirección no encontrada'
        });
      }

      // SEGURIDAD: Verificar que la dirección pertenece al cliente autenticado
      if (direccion.id_cliente !== clienteAutenticado) {
        logger.warn('Intento de acceder a dirección de otro cliente', {
          id_cliente_token: clienteAutenticado,
          id_cliente_direccion: direccion.id_cliente,
          id_direccion: id
        });
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta dirección'
        });
      }

      res.json({
        success: true,
        data: direccion
      });
    } catch (error) {
      logger.error('Error obteniendo dirección:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Crea una nueva dirección para el cliente
   *
   * Si es_predeterminada=true, automáticamente remueve el flag de otras direcciones.
   * País por defecto: "Argentina" si no se especifica.
   *
   * @param req - Express Request con params.id_cliente y body con datos de dirección
   * @param req.body.nombre_direccion - Nombre identificador (requerido)
   * @param req.body.calle - Nombre de la calle (requerido)
   * @param req.body.numero - Número de domicilio (requerido)
   * @param req.body.ciudad - Ciudad (requerido)
   * @param req.body.provincia - Provincia/Estado (requerido)
   * @param req.body.es_predeterminada - Marcar como dirección predeterminada
   * @returns 201 con { success, message, data }
   * @returns 400 si faltan campos requeridos
   * @returns 404 si el cliente no existe
   */
  static async createDireccion(req: Request, res: Response) {
    try {
      const { id_cliente } = req.params;
      const {
        nombre_direccion,
        calle,
        numero,
        piso,
        departamento,
        barrio,
        ciudad,
        provincia,
        codigo_postal,
        pais,
        referencia,
        es_predeterminada,
        es_facturacion,
        telefono_contacto
      } = req.body;

      // Validar campos requeridos
      if (!nombre_direccion || !calle || !numero || !ciudad || !provincia) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: nombre_direccion, calle, numero, ciudad, provincia'
        });
      }

      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(id_cliente);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const now = new Date();

      // Si es predeterminada, quitar predeterminada de otras direcciones
      if (es_predeterminada) {
        await Direccion.update(
          { es_predeterminada: false, fyh_actualizacion: now },
          { where: { id_cliente, es_predeterminada: true } }
        );
      }

      const nuevaDireccion = await Direccion.create({
        id_cliente: parseInt(id_cliente),
        nombre_direccion,
        calle,
        numero,
        piso: piso || null,
        departamento: departamento || null,
        barrio: barrio || null,
        ciudad,
        provincia,
        codigo_postal: codigo_postal || null,
        pais: pais || 'Argentina',
        referencia: referencia || null,
        es_predeterminada: !!es_predeterminada,
        es_facturacion: !!es_facturacion,
        telefono_contacto: telefono_contacto || null,
        fyh_creacion: now,
        fyh_actualizacion: now
      });

      logger.info(`Nueva dirección creada para cliente ${id_cliente}: ${nombre_direccion}`);

      res.status(201).json({
        success: true,
        message: 'Dirección creada exitosamente',
        data: nuevaDireccion
      });
    } catch (error) {
      logger.error('Error creando dirección:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Actualiza una dirección existente
   *
   * Si se marca como predeterminada, remueve el flag de otras direcciones del cliente.
   *
   * @param req - Express Request con params.id y body con campos a actualizar
   * @returns 200 con { success, message, data }
   * @returns 404 si la dirección no existe
   */
  static async updateDireccion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;
      const clienteAutenticado = req.usuario?.id_cliente;

      const direccion = await Direccion.findByPk(id);
      if (!direccion) {
        return res.status(404).json({
          success: false,
          message: 'Dirección no encontrada'
        });
      }

      // SEGURIDAD: Verificar que la dirección pertenece al cliente autenticado
      if (direccion.id_cliente !== clienteAutenticado) {
        logger.warn('Intento de actualizar dirección de otro cliente', {
          id_cliente_token: clienteAutenticado,
          id_cliente_direccion: direccion.id_cliente,
          id_direccion: id
        });
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar esta dirección'
        });
      }

      const now = new Date();

      // Si se está marcando como predeterminada, quitar predeterminada de otras
      if (datosActualizacion.es_predeterminada) {
        await Direccion.update(
          { es_predeterminada: false, fyh_actualizacion: now },
          { 
            where: { 
              id_cliente: direccion.id_cliente,
              es_predeterminada: true,
              id_direccion: { [Op.ne]: id }
            }
          }
        );
      }

      // Agregar fecha de actualización
      datosActualizacion.fyh_actualizacion = now;

      await direccion.update(datosActualizacion);

      logger.info(`Dirección actualizada: ${direccion.nombre_direccion} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Dirección actualizada exitosamente',
        data: direccion
      });
    } catch (error) {
      logger.error('Error actualizando dirección:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Establece una dirección como predeterminada
   *
   * Automáticamente remueve es_predeterminada=true de otras direcciones del cliente
   * para asegurar que solo haya una dirección predeterminada.
   *
   * @param req - Express Request con params.id (ID de la dirección)
   * @returns 200 con { success, message, data }
   * @returns 404 si la dirección no existe
   */
  static async setPredeterminada(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clienteAutenticado = req.usuario?.id_cliente;

      const direccion = await Direccion.findByPk(id);
      if (!direccion) {
        return res.status(404).json({
          success: false,
          message: 'Dirección no encontrada'
        });
      }

      // SEGURIDAD: Verificar que la dirección pertenece al cliente autenticado
      if (direccion.id_cliente !== clienteAutenticado) {
        logger.warn('Intento de establecer como predeterminada dirección de otro cliente', {
          id_cliente_token: clienteAutenticado,
          id_cliente_direccion: direccion.id_cliente,
          id_direccion: id
        });
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar esta dirección'
        });
      }

      const now = new Date();

      // Quitar predeterminada de otras direcciones del mismo cliente
      await Direccion.update(
        { es_predeterminada: false, fyh_actualizacion: now },
        { 
          where: { 
            id_cliente: direccion.id_cliente,
            es_predeterminada: true,
            id_direccion: { [Op.ne]: id }
          }
        }
      );

      // Establecer como predeterminada
      await direccion.update({
        es_predeterminada: true,
        fyh_actualizacion: now
      });

      logger.info(`Dirección establecida como predeterminada: ${direccion.nombre_direccion} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Dirección establecida como predeterminada',
        data: direccion
      });
    } catch (error) {
      logger.error('Error estableciendo dirección predeterminada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Elimina una dirección permanentemente
   *
   * Si la dirección eliminada era predeterminada, automáticamente establece
   * otra dirección del cliente como predeterminada (la más antigua).
   *
   * @param req - Express Request con params.id (ID de la dirección)
   * @returns 200 con { success, message }
   * @returns 404 si la dirección no existe
   */
  static async deleteDireccion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clienteAutenticado = req.usuario?.id_cliente;

      const direccion = await Direccion.findByPk(id);
      if (!direccion) {
        return res.status(404).json({
          success: false,
          message: 'Dirección no encontrada'
        });
      }

      // SEGURIDAD: Verificar que la dirección pertenece al cliente autenticado
      if (direccion.id_cliente !== clienteAutenticado) {
        logger.warn('Intento de eliminar dirección de otro cliente', {
          id_cliente_token: clienteAutenticado,
          id_cliente_direccion: direccion.id_cliente,
          id_direccion: id
        });
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta dirección'
        });
      }

      // Si era la dirección predeterminada, establecer otra como predeterminada
      if (direccion.es_predeterminada) {
        const otraDireccion = await Direccion.findOne({
          where: {
            id_cliente: direccion.id_cliente,
            id_direccion: { [Op.ne]: id }
          },
          order: [['fyh_creacion', 'ASC']]
        });

        if (otraDireccion) {
          await otraDireccion.update({
            es_predeterminada: true,
            fyh_actualizacion: new Date()
          });
        }
      }

      await direccion.destroy();

      logger.info(`Dirección eliminada: ${direccion.nombre_direccion} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Dirección eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando dirección:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene la dirección predeterminada de un cliente
   *
   * Endpoint de conveniencia para checkout y procesos de compra.
   *
   * @param req - Express Request con params.id_cliente
   * @returns 200 con { success, data }
   * @returns 404 si no hay dirección predeterminada
   */
  static async getDireccionPredeterminada(req: Request, res: Response) {
    try {
      const { id_cliente } = req.params;

      const direccionPredeterminada = await Direccion.findOne({
        where: {
          id_cliente,
          es_predeterminada: true
        }
      });

      if (!direccionPredeterminada) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró dirección predeterminada'
        });
      }

      res.json({
        success: true,
        data: direccionPredeterminada
      });
    } catch (error) {
      logger.error('Error obteniendo dirección predeterminada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}