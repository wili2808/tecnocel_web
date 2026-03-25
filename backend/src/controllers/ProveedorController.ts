import { Request, Response } from 'express';
import Proveedor from '../models/Proveedor.js';
import logger from '../services/loggerService.js';
import { Op } from 'sequelize';
import type { CreateProveedorBody, UpdateProveedorBody } from '../types/proveedor.types.js';

/**
 * Controlador para gestión de Proveedores
 *
 * Maneja el CRUD de proveedores de mercadería:
 * - Listado de proveedores (con búsqueda)
 * - Obtener detalles de proveedor
 * - Crear proveedor
 * - Actualizar información de proveedor
 *
 * Requiere autenticación (token válido)
 * Crear/actualizar requiere rol ADMIN(1) o GERENTE(2)
 *
 * @class ProveedorController
 */
export class ProveedorController {
  /**
   * Obtiene listado de proveedores con búsqueda opcional
   * GET /api/proveedores
   * @query search - Búsqueda por nombre_proveedor, empresa o contacto
   * @returns 200 con { success, data, count }
   */
  static async listarProveedores(req: Request, res: Response) {
    try {
      const { search } = req.query;

      let whereClause: any = {};
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        whereClause = {
          [Op.or]: [
            { nombre_proveedor: { [Op.like]: searchTerm } },
            { empresa: { [Op.like]: searchTerm } },
            { celular: { [Op.like]: searchTerm } },
            { email: { [Op.like]: searchTerm } }
          ]
        };
      }

      const proveedores = await Proveedor.findAll({
        where: whereClause,
        order: [['nombre_proveedor', 'ASC']]
      });

      logger.info('Listado de proveedores obtenido', {
        operacion: 'listar_proveedores',
        cantidad: proveedores.length,
        con_busqueda: !!search
      });

      return res.status(200).json({
        success: true,
        data: proveedores,
        count: proveedores.length
      });
    } catch (error) {
      logger.error('Error listando proveedores:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener proveedores'
      });
    }
  }

  /**
   * Obtiene detalle de un proveedor específico
   * GET /api/proveedores/:id
   * @param id - ID del proveedor
   * @returns 200 con { success, data }
   */
  static async obtenerProveedor(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const proveedor = await Proveedor.findByPk(id);
      if (!proveedor) {
        return res.status(404).json({
          success: false,
          error: 'Proveedor no encontrado'
        });
      }

      logger.info('Detalle de proveedor obtenido', {
        operacion: 'obtener_proveedor',
        id_proveedor: id
      });

      return res.status(200).json({
        success: true,
        data: proveedor
      });
    } catch (error) {
      logger.error('Error obteniendo proveedor:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener proveedor'
      });
    }
  }

  /**
   * Crea un nuevo proveedor
   * POST /api/proveedores
   * Requiere rol ADMIN(1) o GERENTE(2)
   * @body CreateProveedorBody
   * @returns 201 con { success, data }
   */
  static async crearProveedor(req: Request, res: Response) {
    try {
      const { nombre_proveedor, empresa, celular, telefono, email, direccion } = req.body as CreateProveedorBody;

      // Validaciones básicas
      if (!nombre_proveedor || !nombre_proveedor.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre del proveedor es requerido'
        });
      }
      if (!empresa || !empresa.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre de empresa es requerido'
        });
      }
      if (!celular || !celular.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El celular es requerido'
        });
      }
      if (!direccion || !direccion.trim()) {
        return res.status(400).json({
          success: false,
          error: 'La dirección es requerida'
        });
      }

      // Verificar si ya existe proveedor con mismo nombre y empresa
      const existente = await Proveedor.findOne({
        where: {
          [Op.and]: [
            { nombre_proveedor: nombre_proveedor.trim() },
            { empresa: empresa.trim() }
          ]
        }
      });

      if (existente) {
        return res.status(409).json({
          success: false,
          error: 'Un proveedor con este nombre y empresa ya existe'
        });
      }

      const ahora = new Date();
      const proveedor = await Proveedor.create({
        nombre_proveedor: nombre_proveedor.trim(),
        empresa: empresa.trim(),
        celular: celular.trim(),
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim() : null,
        direccion: direccion.trim(),
        fyh_creacion: ahora,
        fyh_actualizacion: ahora
      });

      logger.info('Proveedor creado exitosamente', {
        operacion: 'crear_proveedor',
        id_proveedor: proveedor.id_proveedor,
        nombre: nombre_proveedor
      });

      return res.status(201).json({
        success: true,
        data: proveedor
      });
    } catch (error) {
      logger.error('Error creando proveedor:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al crear proveedor'
      });
    }
  }

  /**
   * Actualiza información de un proveedor
   * PUT /api/proveedores/:id
   * Requiere rol ADMIN(1) o GERENTE(2)
   * @param id - ID del proveedor
   * @body UpdateProveedorBody
   * @returns 200 con { success, data }
   */
  static async actualizarProveedor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateProveedorBody;

      const proveedor = await Proveedor.findByPk(id);
      if (!proveedor) {
        return res.status(404).json({
          success: false,
          error: 'Proveedor no encontrado'
        });
      }

      // Validar si hay cambios en campos requeridos
      const nombre = updates.nombre_proveedor ? updates.nombre_proveedor.trim() : proveedor.nombre_proveedor;
      const empresa = updates.empresa ? updates.empresa.trim() : proveedor.empresa;
      const celular = updates.celular ? updates.celular.trim() : proveedor.celular;
      const direccion = updates.direccion ? updates.direccion.trim() : proveedor.direccion;

      if (!nombre || !empresa || !celular || !direccion) {
        return res.status(400).json({
          success: false,
          error: 'Los campos requeridos no pueden estar vacíos'
        });
      }

      // Si cambió el nombre o empresa, verificar que no exista otro igual
      if (
        updates.nombre_proveedor ||
        updates.empresa
      ) {
        const existente = await Proveedor.findOne({
          where: {
            [Op.and]: [
              { nombre_proveedor: nombre },
              { empresa: empresa },
              { id_proveedor: { [Op.ne]: Number(id) } }
            ]
          }
        });

        if (existente) {
          return res.status(409).json({
            success: false,
            error: 'Un proveedor con este nombre y empresa ya existe'
          });
        }
      }

      await proveedor.update({
        nombre_proveedor: nombre,
        empresa: empresa,
        celular: celular,
        telefono: updates.telefono ? updates.telefono.trim() : proveedor.telefono,
        email: updates.email ? updates.email.trim() : proveedor.email,
        direccion: direccion,
        fyh_actualizacion: new Date()
      });

      logger.info('Proveedor actualizado exitosamente', {
        operacion: 'actualizar_proveedor',
        id_proveedor: id
      });

      return res.status(200).json({
        success: true,
        data: proveedor
      });
    } catch (error) {
      logger.error('Error actualizando proveedor:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar proveedor'
      });
    }
  }
}
