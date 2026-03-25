import { Request, Response } from 'express';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database.js';
import Compra from '../models/Compra.js';
import DetalleCompra from '../models/DetalleCompra.js';
import Proveedor from '../models/Proveedor.js';
import Usuario from '../models/Usuario.js';
import Almacen from '../models/Almacen.js';
import logger from '../services/loggerService.js';
import type { RegistrarCompraBody, AnularCompraBody, FiltrosComprasAdmin } from '../types/compra.types.js';
import type { UsuarioSession } from '../types/express.js';

/**
 * Controlador para gestión de Compras a Proveedores
 *
 * Maneja:
 * - Listado de compras con filtros
 * - Obtener detalle de compra
 * - Registrar compra (crear productos nuevos al vuelo)
 * - Anular compra (revertir stock)
 * - Estadísticas de compras
 *
 * Requiere autenticación (token válido)
 * Anular compra requiere rol ADMIN(1) o GERENTE(2)
 *
 * @class CompraController
 */
export class CompraController {
  /**
   * Obtiene estadísticas de compras (hoy, semana, mes, gasto total del mes)
   * GET /api/compras/admin/estadisticas
   * @returns 200 con { success, data }
   */
  static async obtenerEstadisticas(req: Request, res: Response) {
    try {
      const ahora = new Date();
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      const [comprasHoy, comprasSemana, comprasMes, gastoMes] = await Promise.all([
        Compra.count({
          where: {
            fyh_creacion: { [Op.gte]: hoy },
            estado: 'activa'
          }
        }),
        Compra.count({
          where: {
            fyh_creacion: { [Op.gte]: hace7Dias },
            estado: 'activa'
          }
        }),
        Compra.count({
          where: {
            fyh_creacion: { [Op.gte]: inicioMes },
            estado: 'activa'
          }
        }),
        Compra.sum('precio_total', {
          where: {
            fyh_creacion: { [Op.gte]: inicioMes },
            estado: 'activa'
          }
        })
      ]);

      logger.info('Estadísticas de compras obtenidas', {
        operacion: 'obtener_estadisticas_compras',
        compras_hoy: comprasHoy,
        compras_semana: comprasSemana
      });

      return res.status(200).json({
        success: true,
        data: {
          compras_hoy: comprasHoy || 0,
          compras_semana: comprasSemana || 0,
          compras_mes: comprasMes || 0,
          gasto_mes: gastoMes || '0.00'
        }
      });
    } catch (error) {
      logger.error('Error en obtenerEstadisticas:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Lista compras con paginación y filtros
   * GET /api/compras/admin/listar
   * @query limit - Máximo de resultados (default 20, max 100)
   * @query offset - Desplazamiento (default 0)
   * @query fecha_inicio - Filtro de fecha inicio (YYYY-MM-DD)
   * @query fecha_fin - Filtro de fecha fin (YYYY-MM-DD)
   * @query id_proveedor - Filtro por proveedor
   * @query estado - Filtro por estado (activa|anulada)
   * @query search - Búsqueda por nro_compra, nombre_proveedor
   * @returns 200 con { success, data, total, limit, offset }
   */
  static async listarCompras(req: Request, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const filtros = req.query as any as FiltrosComprasAdmin;

      let whereClause: any = {};

      if (filtros.fecha_inicio) {
        whereClause.fyh_creacion = {
          [Op.gte]: new Date(filtros.fecha_inicio)
        };
      }
      if (filtros.fecha_fin) {
        const fechaFin = new Date(filtros.fecha_fin);
        fechaFin.setHours(23, 59, 59, 999);
        whereClause.fyh_creacion = {
          ...whereClause.fyh_creacion,
          [Op.lte]: fechaFin
        };
      }

      if (filtros.id_proveedor) {
        whereClause.id_proveedor = filtros.id_proveedor;
      }

      if (filtros.estado) {
        whereClause.estado = filtros.estado;
      }

      if (filtros.search) {
        const searchTerm = `%${filtros.search}%`;
        // Extraer número si viene en formato "C-00001"
        let numeroCompra: number | null = null;
        const match = filtros.search.match(/^C-?(\d+)$/) || filtros.search.match(/^(\d+)$/);
        if (match) {
          numeroCompra = parseInt(match[1], 10);
        }

        const orConditions: any[] = [
          sequelize.where(
            sequelize.col('Proveedor.nombre_proveedor'),
            Op.like,
            searchTerm
          )
        ];

        // Agregar búsqueda por número si se extrajo uno válido
        if (numeroCompra !== null) {
          orConditions.unshift({ nro_compra: numeroCompra });
        }

        whereClause = {
          ...whereClause,
          [Op.or]: orConditions
        };
      }

      const { count, rows } = await Compra.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Proveedor,
            attributes: ['nombre_proveedor', 'empresa']
          },
          {
            model: Usuario,
            attributes: ['nombres']
          },
          {
            model: DetalleCompra,
            attributes: ['id_detalle_compra']
          }
        ],
        order: [['fyh_creacion', 'DESC']],
        limit,
        offset,
        subQuery: false
      });

      const comprasFormateadas = rows.map((c: any) => ({
        id_compra: c.id_compra,
        nro_compra: `C-${String(c.nro_compra).padStart(5, '0')}`,
        fecha_compra: c.fecha_compra,
        comprobante: c.comprobante,
        estado: c.estado,
        precio_total: c.precio_total,
        id_proveedor: c.id_proveedor,
        nombre_proveedor: c.Proveedor?.nombre_proveedor,
        empresa_proveedor: c.Proveedor?.empresa,
        id_usuario: c.id_usuario,
        nombre_usuario: c.Usuario?.nombres,
        cantidad_items: c.DetalleCompras?.length || 0,
        fyh_creacion: c.fyh_creacion
      }));

      logger.info('Listado de compras obtenido', {
        operacion: 'listar_compras',
        cantidad: rows.length,
        total: count,
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        data: comprasFormateadas,
        total: count,
        limit,
        offset
      });
    } catch (error) {
      logger.error('Error en listarCompras:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al listar compras'
      });
    }
  }

  /**
   * Obtiene detalle completo de una compra
   * GET /api/compras/admin/:id
   * @param id - ID de la compra
   * @returns 200 con { success, data }
   */
  static async obtenerDetalle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const compra = await Compra.findByPk(id, {
        include: [
          {
            model: Proveedor,
            attributes: ['nombre_proveedor', 'empresa', 'celular', 'email', 'direccion']
          },
          {
            model: Usuario,
            attributes: ['nombres', 'email']
          },
          {
            model: DetalleCompra,
            include: [
              {
                model: Almacen,
                attributes: ['codigo', 'nombre']
              }
            ]
          }
        ]
      });

      if (!compra) {
        return res.status(404).json({
          success: false,
          error: 'Compra no encontrada'
        });
      }

      const detalleJson: any = compra.toJSON();

      // Aplanar estructura de datos
      const detalle = {
        id_compra: detalleJson.id_compra,
        nro_compra: `C-${String(compra.nro_compra).padStart(5, '0')}`,
        fecha_compra: detalleJson.fecha_compra,
        comprobante: detalleJson.comprobante,
        estado: detalleJson.estado,
        precio_total: detalleJson.precio_total,
        observaciones: detalleJson.observaciones,
        motivo_anulacion: detalleJson.motivo_anulacion,
        id_proveedor: detalleJson.id_proveedor,
        id_usuario: detalleJson.id_usuario,
        fyh_creacion: detalleJson.fyh_creacion,
        fyh_actualizacion: detalleJson.fyh_actualizacion,
        // Información del proveedor
        nombre_proveedor: detalleJson.Proveedor?.nombre_proveedor,
        empresa_proveedor: detalleJson.Proveedor?.empresa,
        celular_proveedor: detalleJson.Proveedor?.celular,
        email_proveedor: detalleJson.Proveedor?.email,
        direccion_proveedor: detalleJson.Proveedor?.direccion,
        // Información del usuario
        nombre_usuario: detalleJson.Usuario?.nombres,
        email_usuario: detalleJson.Usuario?.email,
        // Items
        items: detalleJson.DetalleCompras?.map((item: any) => ({
          id_detalle_compra: item.id_detalle_compra,
          id_producto: item.id_producto,
          nombre_producto: item.Almacen?.nombre,
          codigo_producto: item.Almacen?.codigo,
          cantidad: item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal)
        })) || []
      };

      logger.info('Detalle de compra obtenido', {
        operacion: 'obtener_detalle_compra',
        id_compra: id,
        nro_compra: compra.nro_compra
      });

      return res.status(200).json({
        success: true,
        data: detalle
      });
    } catch (error) {
      logger.error('Error en obtenerDetalle:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener detalle de compra'
      });
    }
  }

  /**
   * Registra una nueva compra a un proveedor
   * POST /api/compras/admin/registrar
   * Flujo de transacción:
   * 1. Validar proveedor
   * 2. Para cada item: crear producto si es nuevo, validar si existe
   * 3. Calcular totales
   * 4. Generar nro_compra
   * 5. Crear Compra y DetalleCompra
   * 6. Incrementar stock e actualizar precio_compra
   * @body RegistrarCompraBody
   * @returns 201 con { success, data }
   */
  static async registrarCompra(req: Request, res: Response) {
    const transaction = await sequelize.transaction();

    try {
      const { id_proveedor, fecha_compra, comprobante, observaciones, items } = req.body as RegistrarCompraBody;
      const usuario = req.usuario as UsuarioSession;

      // Validaciones
      if (!id_proveedor) {
        return res.status(400).json({
          success: false,
          error: 'id_proveedor es requerido'
        });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Debe incluir al menos un producto'
        });
      }

      // 1. Validar que el proveedor existe
      const proveedor = await Proveedor.findByPk(id_proveedor, { transaction });
      if (!proveedor) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Proveedor no encontrado'
        });
      }

      // 2. Procesar items y crear productos si es necesario
      const itemsProcesados = [];
      for (const item of items) {
        let idProducto = item.id_producto;

        if (item.es_nuevo) {
          // Crear producto nuevo
          if (!item.nuevo_codigo || !item.nuevo_nombre || !item.nuevo_precio_venta || !item.nuevo_id_categoria) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              error: 'Productos nuevos requieren: nuevo_codigo, nuevo_nombre, nuevo_precio_venta, nuevo_id_categoria'
            });
          }

          // Verificar que el código no existe
          const existeProducto = await Almacen.findOne({
            where: { codigo: item.nuevo_codigo },
            transaction
          });

          if (existeProducto) {
            await transaction.rollback();
            return res.status(409).json({
              success: false,
              error: `El código de producto "${item.nuevo_codigo}" ya existe`
            });
          }

          // Crear el producto con todos los campos requeridos
          const nuevoProducto = await Almacen.create({
            codigo: item.nuevo_codigo,
            nombre: item.nuevo_nombre,
            stock: 0,
            precio_compra: String(item.precio_unitario),
            precio_venta: String(item.nuevo_precio_venta),
            id_categoria: item.nuevo_id_categoria,
            id_marca: item.nuevo_id_marca || null,
            es_destacado: false,
            fecha_ingreso: new Date().toISOString().split('T')[0],
            id_usuario: usuario.id,
            orden_destacado: 0,
            fyh_creacion: new Date(),
            fyh_actualizacion: new Date()
          }, { transaction });

          idProducto = nuevoProducto.id_producto;
        } else {
          // Validar que el producto existe
          const producto = await Almacen.findByPk(idProducto, { transaction });
          if (!producto) {
            await transaction.rollback();
            return res.status(404).json({
              success: false,
              error: `Producto con ID ${idProducto} no encontrado`
            });
          }
        }

        itemsProcesados.push({
          id_producto: idProducto,
          cantidad: item.cantidad,
          precio_unitario: parseFloat(String(item.precio_unitario))
        });
      }

      // 3. Calcular totales
      const subtotales = itemsProcesados.map(item => item.cantidad * item.precio_unitario);
      const precioTotal = subtotales.reduce((a, b) => a + b, 0);

      // 4. Generar nro_compra
      const ultimaCompra = await Compra.findOne({
        order: [['nro_compra', 'DESC']],
        transaction
      });
      const nroCompra = (ultimaCompra?.nro_compra || 0) + 1;

      // 5. Crear DetalleCompra PRIMERO (por FK invertida en BD)
      for (let i = 0; i < itemsProcesados.length; i++) {
        const item = itemsProcesados[i];
        const subtotal = subtotales[i];

        await DetalleCompra.create({
          nro_compra: nroCompra,
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: subtotal,
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
        }, { transaction });
      }

      // 6. Crear Compra DESPUÉS de los DetalleCompra
      const compra = await Compra.create({
        nro_compra: nroCompra,
        fecha_compra: new Date(fecha_compra),
        id_proveedor: id_proveedor,
        comprobante,
        id_usuario: usuario.id,
        precio_total: String(Math.round(precioTotal)),
        estado: 'activa',
        observaciones: observaciones || null,
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      }, { transaction });

      // 7. Incrementar stock e actualizar precio_compra en Almacen
      for (const item of itemsProcesados) {
        const producto = await Almacen.findByPk(item.id_producto, { transaction });
        if (producto) {
          await Almacen.update({
            stock: producto.stock + item.cantidad,
            precio_compra: String(item.precio_unitario),
            fyh_actualizacion: new Date()
          }, {
            where: { id_producto: item.id_producto },
            transaction
          });
        }
      }

      // Commit
      await transaction.commit();

      logger.info('Compra registrada exitosamente', {
        operacion: 'registrar_compra',
        id_compra: compra.id_compra,
        nro_compra: nroCompra,
        id_proveedor: id_proveedor,
        cantidad_items: itemsProcesados.length,
        id_usuario: usuario.id
      });

      return res.status(201).json({
        success: true,
        data: {
          id_compra: compra.id_compra,
          nro_compra: `C-${String(nroCompra).padStart(5, '0')}`,
          precio_total: compra.precio_total,
          estado: compra.estado,
          fyh_creacion: compra.fyh_creacion
        }
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error en registrarCompra:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al registrar compra'
      });
    }
  }

  /**
   * Anula una compra activa (revertir stock)
   * PATCH /api/compras/admin/:id/anular
   * @param id - ID de la compra
   * @body AnularCompraBody
   * @returns 200 con { success, data }
   */
  static async anularCompra(req: Request, res: Response) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { motivo } = req.body as AnularCompraBody;

      const compra = await Compra.findByPk(id, {
        include: [
          {
            model: DetalleCompra,
            include: [{ model: Almacen }]
          }
        ],
        transaction
      });

      if (!compra) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Compra no encontrada'
        });
      }

      if (compra.estado !== 'activa') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden anular compras activas'
        });
      }

      // Revertir stock
      const detalles = compra.toJSON() as any;
      if (detalles.DetalleCompras) {
        for (const item of detalles.DetalleCompras) {
          const producto = item.Almacen;
          if (producto) {
            await Almacen.update({
              stock: Math.max(0, producto.stock - item.cantidad),
              fyh_actualizacion: new Date()
            }, {
              where: { id_producto: item.id_producto },
              transaction
            });
          }
        }
      }

      // Actualizar estado y guardar motivo de anulación
      await compra.update({
        estado: 'anulada',
        motivo_anulacion: motivo || null,
        fyh_actualizacion: new Date()
      }, { transaction });

      await transaction.commit();

      logger.info('Compra anulada exitosamente', {
        operacion: 'anular_compra',
        id_compra: id,
        nro_compra: compra.nro_compra,
        motivo: motivo || 'Sin motivo'
      });

      return res.status(200).json({
        success: true,
        data: {
          id_compra: compra.id_compra,
          nro_compra: `C-${String(compra.nro_compra).padStart(5, '0')}`,
          estado: 'anulada'
        }
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error en anularCompra:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al anular compra'
      });
    }
  }
}
