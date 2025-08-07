import { Request, Response } from 'express';
import Direccion from '../models/Direccion.js';
import Cliente from '../models/Cliente.js';
import logger from '../utils/logger.js';

export class DireccionController {
  // Obtener direcciones de un cliente
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

  // Obtener dirección por ID
  static async getDireccionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

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

  // Crear nueva dirección
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

  // Actualizar dirección
  static async updateDireccion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      const direccion = await Direccion.findByPk(id);
      if (!direccion) {
        return res.status(404).json({
          success: false,
          message: 'Dirección no encontrada'
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
              id_direccion: { [require('sequelize').Op.ne]: id }
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

  // Establecer dirección como predeterminada
  static async setPredeterminada(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const direccion = await Direccion.findByPk(id);
      if (!direccion) {
        return res.status(404).json({
          success: false,
          message: 'Dirección no encontrada'
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
            id_direccion: { [require('sequelize').Op.ne]: id }
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

  // Eliminar dirección
  static async deleteDireccion(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const direccion = await Direccion.findByPk(id);
      if (!direccion) {
        return res.status(404).json({
          success: false,
          message: 'Dirección no encontrada'
        });
      }

      // Si era la dirección predeterminada, establecer otra como predeterminada
      if (direccion.es_predeterminada) {
        const otraDireccion = await Direccion.findOne({
          where: {
            id_cliente: direccion.id_cliente,
            id_direccion: { [require('sequelize').Op.ne]: id }
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

  // Obtener dirección predeterminada de un cliente
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