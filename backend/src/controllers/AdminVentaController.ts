/**
 * @file Controlador de administración de ventas
 *
 * Proporciona endpoints de gestión de ventas para el panel de administración:
 * - Estadísticas de ventas (hoy, semana, mes, ingresos)
 * - Listar todas las ventas con filtros avanzados y paginación
 * - Obtener detalle completo de cualquier venta (sin restricción de cliente)
 * - Registrar ventas manuales (vendedor crea venta directamente)
 * - Cancelar ventas con restauración automática de stock
 *
 * Los items de venta se leen/crean en tb_venta_items (query único sin bifurcación
 * por tipo_venta, funciona igual para ventas web y manuales).
 *
 * Requiere autenticación de usuario del sistema (verificarToken) y autorización
 * por rol (verificarRol). Solo admin (rol 1) puede cancelar ventas.
 *
 * @module AdminVentaController
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import type { RegistrarVentaManualBody, CancelarVentaBody, ActualizarTipoCambioBody } from '../types/venta.types.js';
import Venta from '../models/Venta.js';
import VentaItem from '../models/VentaItem.js';
import Cancelacion from '../models/Cancelacion.js';
import Envio from '../models/Envio.js';
import Direccion from '../models/Direccion.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import Configuracion from '../models/Configuracion.js';
import logger from '../services/loggerService.js';
import { sendCancellationEmail, sendOrderStatusEmail, sendComprobanteEmail } from '../services/emailService.js';
import { generarComprobantePDF } from '../services/comprobanteService.js';
import type { DetalleParaComprobante } from '../services/comprobanteService.js';
import notificationService from '../services/notificationService.js';

/** Type guard para verificar que el usuario es del sistema (tiene idRol) */
function esUsuarioSistema(usuario: unknown): usuario is { id: number; idRol: number } {
  return (
    usuario !== null &&
    typeof usuario === 'object' &&
    'idRol' in usuario &&
    'id' in usuario
  );
}

export default class AdminVentaController {

  /**
   * Obtiene estadísticas rápidas de ventas para el dashboard
   * GET /api/ventas/admin/estadisticas
   */
  static async obtenerEstadisticasVentas(req: Request, res: Response) {
    try {
      const ahora = new Date();
      const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - 7);
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      const [ventasHoy, ventasSemana, ventasMes, ingresosMes] = await Promise.all([
        Venta.count({
          where: { fyh_creacion: { [Op.gte]: inicioDia }, estado: 'completada' }
        }),
        Venta.count({
          where: { fyh_creacion: { [Op.gte]: inicioSemana }, estado: 'completada' }
        }),
        Venta.count({
          where: { fyh_creacion: { [Op.gte]: inicioMes }, estado: 'completada' }
        }),
        Venta.sum('total_pagado', {
          where: { fyh_creacion: { [Op.gte]: inicioMes }, estado: 'completada' }
        })
      ]);

      return res.json({
        ventas_hoy: ventasHoy,
        ventas_semana: ventasSemana,
        ventas_mes: ventasMes,
        ingresos_mes: ingresosMes || 0
      });

    } catch (error) {
      logger.error('Error al obtener estadísticas de ventas:', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      return res.status(500).json({ mensaje: 'Error al obtener estadísticas de ventas' });
    }
  }

  /**
   * Lista todas las ventas con filtros, búsqueda y paginación
   * GET /api/ventas/admin/listar
   */
  static async listarVentasAdmin(req: Request, res: Response) {
    try {
      const limit  = Math.min(parseInt(req.query.limit  as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const { fecha_inicio, fecha_fin, estado, tipo_venta, metodo_pago, search } = req.query as Record<string, string>;

      // Construcción dinámica del filtro WHERE
      const where: Record<string, unknown> = {};

      if (fecha_inicio || fecha_fin) {
        where.fyh_creacion = {};
        if (fecha_inicio) (where.fyh_creacion as Record<string, unknown>)[Op.gte as unknown as string] = new Date(fecha_inicio);
        if (fecha_fin)    (where.fyh_creacion as Record<string, unknown>)[Op.lte as unknown as string] = new Date(fecha_fin);
      }
      if (estado)      where.estado      = estado;
      if (tipo_venta)  where.tipo_venta  = tipo_venta;
      if (metodo_pago) where.metodo_pago = metodo_pago;

      // Filtro de búsqueda por nro_venta o nombre de cliente
      let clienteWhere: Record<string, unknown> | undefined;
      if (search) {
        const nroNumero = parseInt(search);
        if (!isNaN(nroNumero)) {
          where.nro_venta = nroNumero;
        } else {
          clienteWhere = {
            [Op.or]: [
              { nombre_cliente: { [Op.like]: `%${search}%` } },
              { apellido_cliente: { [Op.like]: `%${search}%` } },
              { email_cliente: { [Op.like]: `%${search}%` } }
            ]
          };
        }
      }

      const { count, rows } = await Venta.findAndCountAll({
        where,
        include: [
          {
            model: Cliente,
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'email_cliente'],
            required: !!clienteWhere,
            where: clienteWhere
          },
          {
            model: Usuario,
            as: 'vendedor',
            attributes: ['id_usuario', 'nombres'],
            required: false
          },
          {
            model: VentaItem,
            as: 'items',
            attributes: ['id_item'],
            required: false
          }
        ],
        order: [['fyh_creacion', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      const ventas = rows.map(venta => {
        /** Sequelize no tipifica asociaciones — cast necesario para acceder a relaciones incluidas */
        const v = venta.toJSON() as Record<string, any>;
        return {
          id_venta:        v.id_venta,
          nro_venta:       `V-${v.nro_venta.toString().padStart(5, '0')}`,
          fyh_creacion:    v.fyh_creacion,
          id_cliente:      v.id_cliente,
          nombre_cliente:  v.Cliente
            ? `${v.Cliente.nombre_cliente} ${v.Cliente.apellido_cliente}`
            : null,
          email_cliente:   v.Cliente?.email_cliente || null,
          cantidad_items:  (v.items || []).length,
          total_pagado:    parseFloat(v.total_pagado),
          metodo_pago:     v.metodo_pago,
          tipo_venta:      v.tipo_venta,
          estado:          v.estado,
          moneda:          v.moneda || 'ARS',
          id_vendedor:     v.id_vendedor,
          nombre_vendedor: v.vendedor?.nombres || null
        };
      });

      return res.json({ ventas, total: count, limit, offset });

    } catch (error) {
      logger.error('Error al listar ventas admin:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        query: req.query
      });
      return res.status(500).json({ mensaje: 'Error al obtener el listado de ventas' });
    }
  }

  /**
   * Obtiene el detalle completo de una venta (sin restricción de cliente)
   * GET /api/ventas/admin/:id_venta
   *
   * Query única sin bifurcación: Venta → VentaItems → Almacen
   */
  static async obtenerDetalleAdmin(req: Request, res: Response) {
    try {
      const { id_venta } = req.params;

      const venta = await Venta.findOne({
        where: { id_venta },
        include: [
          {
            model: Cliente,
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'email_cliente'],
            required: false
          },
          {
            model: Usuario,
            as: 'vendedor',
            attributes: ['id_usuario', 'nombres'],
            required: false
          },
          {
            model: VentaItem,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'codigo']
              }
            ]
          },
          {
            model: Cancelacion,
            as: 'cancelacion',
            required: false,
            include: [
              {
                model: Usuario,
                as: 'usuario_cancelacion',
                attributes: ['id_usuario', 'nombres']
              }
            ]
          },
          {
            model: Envio,
            as: 'envio',
            required: false,
            include: [{
              model: Direccion,
              as: 'direccion_envio',
              required: false,
              attributes: ['calle', 'numero', 'piso', 'departamento', 'barrio', 'ciudad', 'provincia']
            }]
          }
        ]
      });

      if (!venta) {
        return res.status(404).json({ mensaje: 'Venta no encontrada' });
      }

      /** Sequelize no tipifica asociaciones — cast necesario para acceder a relaciones incluidas */
      const v = venta.toJSON() as Record<string, any>;

      return res.json({
        id_venta:     v.id_venta,
        nro_venta:    `V-${v.nro_venta.toString().padStart(5, '0')}`,
        fyh_creacion: v.fyh_creacion,
        fyh_actualizacion: v.fyh_actualizacion,
        total_pagado: parseFloat(v.total_pagado),
        estado:       v.estado,
        estado_reembolso: v.estado_reembolso || null,
        envio: v.envio ? {
          tipo_entrega:    v.envio.tipo_entrega,
          estado_envio:    v.envio.estado_envio,
          fecha_despacho:  v.envio.fyh_despacho || null,
          direccion_envio: (v.envio.envio_calle || v.envio.direccion_envio) ? {
            nombre_direccion: v.envio.envio_nombre_direccion || null,
            calle:        v.envio.envio_calle || v.envio.direccion_envio?.calle || null,
            numero:       v.envio.envio_numero || v.envio.direccion_envio?.numero || null,
            piso:         v.envio.envio_piso || v.envio.direccion_envio?.piso || null,
            departamento: v.envio.envio_departamento || v.envio.direccion_envio?.departamento || null,
            barrio:       v.envio.envio_barrio || v.envio.direccion_envio?.barrio || null,
            ciudad:       v.envio.envio_ciudad || v.envio.direccion_envio?.ciudad || null,
            provincia:    v.envio.envio_provincia || v.envio.direccion_envio?.provincia || null,
            codigo_postal: v.envio.envio_codigo_postal || null,
            pais:         v.envio.envio_pais || null,
            referencia:   v.envio.envio_referencia || null,
            telefono_contacto: v.envio.envio_telefono_contacto || null
          } : null
        } : null,
        metodo_pago:  v.metodo_pago,
        tipo_venta:   v.tipo_venta,
        moneda:       v.moneda,
        observaciones: v.observaciones,
        cliente: v.Cliente ? {
          id_cliente:      v.Cliente.id_cliente,
          nombre_cliente:  v.Cliente.nombre_cliente,
          apellido_cliente: v.Cliente.apellido_cliente,
          correo:          v.Cliente.email_cliente
        } : null,
        vendedor: v.vendedor ? {
          id_vendedor: v.vendedor.id_usuario,
          nombres:     v.vendedor.nombres
        } : null,
        cancelacion: v.cancelacion ? {
          motivo:           v.cancelacion.motivo,
          fyh_cancelacion:  v.cancelacion.fyh_cancelacion,
          cancelado_por:    v.cancelacion.usuario_cancelacion?.nombres || null
        } : null,
        items: (v.items || []).map((item: any) => ({
          id_producto:     item.producto?.id_producto,
          nombre_producto: item.producto?.nombre || 'Producto no disponible',
          codigo:          item.producto?.codigo || null,
          cantidad:        item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal:        parseFloat(item.subtotal)
        }))
      });

    } catch (error) {
      logger.error('Error al obtener detalle de venta (admin):', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_venta: req.params.id_venta
      });
      return res.status(500).json({ mensaje: 'Error al obtener el detalle de la venta' });
    }
  }

  /**
   * Registra una venta manual desde el panel admin
   * POST /api/ventas/admin/registrar
   *
   * El vendedor selecciona cliente (opcional) y productos.
   * Se crea directamente en tb_ventas + tb_venta_items sin pasar por CarritoWeb.
   */
  static async registrarVentaManual(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({ mensaje: 'Datos inválidos', errores: errors.array() });
      }

      if (!esUsuarioSistema(req.usuario)) {
        await transaction.rollback();
        return res.status(403).json({ mensaje: 'No autorizado' });
      }

      const id_vendedor = req.usuario.id;
      const { id_cliente, items, metodo_pago, observaciones, moneda = 'ARS', valor_dolar } = req.body as RegistrarVentaManualBody;

      // 1. Verificar cliente si se proporcionó
      if (id_cliente) {
        const cliente = await Cliente.findByPk(id_cliente, { transaction });
        if (!cliente) {
          await transaction.rollback();
          return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }
      }

      // 2. Verificar que no haya id_producto duplicados
      const productosIds: number[] = items.map((i: any) => i.id_producto);
      if (new Set(productosIds).size !== productosIds.length) {
        await transaction.rollback();
        return res.status(400).json({
          mensaje: 'Hay productos duplicados en la lista. Ajuste las cantidades en vez de repetir el mismo producto.'
        });
      }

      // 3. Validar stock y calcular precios para cada item
      const itemsValidados: { id_producto: number; nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[] = [];

      for (const item of items) {
        const producto = await Almacen.findByPk(item.id_producto, { transaction });
        if (!producto) {
          await transaction.rollback();
          return res.status(404).json({
            mensaje: `Producto con ID ${item.id_producto} no encontrado`
          });
        }
        if (producto.stock < item.cantidad) {
          await transaction.rollback();
          return res.status(400).json({
            mensaje: `Stock insuficiente para "${producto.nombre}"`,
            stock_disponible: producto.stock,
            cantidad_solicitada: item.cantidad
          });
        }

        // Usar precio manual si lo proveyó el vendedor, sino precio del catálogo
        const precio_unitario = (item.precio_unitario_manual != null)
          ? parseFloat(String(item.precio_unitario_manual))
          : parseFloat(producto.precio_venta);

        itemsValidados.push({
          id_producto:    item.id_producto,
          nombre:         producto.nombre,
          cantidad:       item.cantidad,
          precio_unitario,
          subtotal:       precio_unitario * item.cantidad
        });
      }

      // 4. Calcular total
      const total = itemsValidados.reduce((sum, i) => sum + i.subtotal, 0);

      // 5. Generar nro_venta secuencial (mismo patrón que confirmarCompra)
      const ultimaVenta = await Venta.findOne({
        order: [['nro_venta', 'DESC']],
        transaction
      });
      const nroVenta = ultimaVenta ? ultimaVenta.nro_venta + 1 : 1;

      // 5b. Siempre guardar tipo de cambio vigente (necesario para conversiones en reportes)
      const valorDolarFinal: number | null = valor_dolar
        ? parseFloat(String(valor_dolar))
        : await Configuracion.findByPk('tipo_cambio_usd', { transaction })
            .then(c => c ? parseFloat(c.valor) : null);

      // 6. Crear Venta
      const venta = await Venta.create({
        nro_venta:        nroVenta,
        id_cliente:       id_cliente || null,
        id_carrito_web:   null,
        tipo_venta:       'manual',
        estado:           'completada',
        metodo_pago,
        id_vendedor,
        total_pagado:     Math.round(total), // INTEGER en BD
        observaciones:    observaciones || null,
        moneda,
        valor_dolar:      valorDolarFinal,
        fyh_creacion:     new Date(),
        fyh_actualizacion: new Date()
      }, { transaction });

      // 7. Crear VentaItems
      for (const item of itemsValidados) {
        await VentaItem.create({
          id_venta:        venta.id_venta,
          id_producto:     item.id_producto,
          cantidad:        item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal:        item.subtotal,
          fyh_creacion:    new Date()
        }, { transaction });
      }

      // 8. Decrementar stock
      for (const item of itemsValidados) {
        const producto = await Almacen.findByPk(item.id_producto, { transaction });
        if (producto) {
          await Almacen.update(
            { stock: producto.stock - item.cantidad, fyh_actualizacion: new Date() },
            { where: { id_producto: item.id_producto }, transaction }
          );
        }
      }

      await transaction.commit();

      logger.info('Venta manual registrada exitosamente', {
        id_venta:     venta.id_venta,
        nro_venta:    nroVenta,
        id_vendedor,
        id_cliente:   id_cliente || null,
        total,
        items_count:  itemsValidados.length
      });

      return res.status(201).json({
        mensaje: 'Venta registrada exitosamente',
        venta: {
          id_venta:     venta.id_venta,
          nro_venta:    `V-${nroVenta.toString().padStart(5, '0')}`,
          total_pagado: total,
          metodo_pago,
          tipo_venta:   'manual',
          estado:       'completada',
          fyh_creacion: venta.fyh_creacion
        }
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('Error al registrar venta manual (ROLLBACK):', {
        error:      error instanceof Error ? error.message : 'Error desconocido',
        vendedor_id: req.usuario?.id
      });
      return res.status(500).json({ mensaje: 'Error al registrar la venta' });
    }
  }

  /**
   * Cancela una venta y restaura el stock de los productos
   * PATCH /api/ventas/admin/:id_venta/cancelar
   *
   * Accesible para administradores (rol 1) y vendedores (rol 3).
   * Reglas de negocio:
   * - Ventas manuales: solo cancelables dentro de las 48hs de registradas
   * - Ventas web: solo cancelables si fecha_despacho es null (aún no despachadas)
   * Registra la cancelación en tb_cancelaciones con motivo y usuario responsable.
   */
  static async cancelarVenta(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const { id_venta } = req.params;
      const { motivo } = req.body as CancelarVentaBody;

      const venta = await Venta.findOne({
        where: { id_venta },
        include: [
          {
            model: VentaItem,
            as: 'items',
            include: [{ model: Almacen, as: 'producto' }]
          },
          {
            model: Envio,
            as: 'envio',
            required: false
          }
        ],
        transaction
      });

      if (!venta) {
        await transaction.rollback();
        return res.status(404).json({ mensaje: 'Venta no encontrada' });
      }

      /** Sequelize no tipifica asociaciones — cast necesario para acceder a relaciones incluidas */
      const ventaData = venta.toJSON() as Record<string, any>;

      if (ventaData.estado === 'cancelada') {
        await transaction.rollback();
        return res.status(400).json({ mensaje: 'La venta ya está cancelada' });
      }

      // Regla: ventas manuales solo cancelables dentro de las 48hs
      if (ventaData.tipo_venta === 'manual') {
        const horasTranscurridas = (Date.now() - new Date(ventaData.fyh_creacion).getTime()) / (1000 * 60 * 60);
        if (horasTranscurridas > 48) {
          await transaction.rollback();
          return res.status(400).json({
            mensaje: 'Las ventas manuales solo pueden cancelarse dentro de las 48 horas de registradas'
          });
        }
      }

      // Regla: ventas web solo cancelables si aún no fueron despachadas
      if (ventaData.tipo_venta === 'web' && ventaData.envio?.fyh_despacho != null) {
        await transaction.rollback();
        return res.status(400).json({
          mensaje: 'No se puede cancelar una venta web que ya fue despachada'
        });
      }

      // Restaurar stock para cada item (funciona igual para web y manual)
      for (const item of ventaData.items || []) {
        if (item.producto) {
          await Almacen.update(
            {
              stock: item.producto.stock + item.cantidad,
              fyh_actualizacion: new Date()
            },
            { where: { id_producto: item.id_producto }, transaction }
          );
        }
      }

      // Marcar como cancelada (sin tocar observaciones)
      await venta.update({
        estado:            'cancelada',
        fyh_actualizacion: new Date()
      }, { transaction });

      // Registrar en tabla de auditoría de cancelaciones
      if (!esUsuarioSistema(req.usuario)) {
        await transaction.rollback();
        return res.status(403).json({ mensaje: 'No autorizado' });
      }

      await Cancelacion.create({
        id_venta:       ventaData.id_venta,
        id_usuario:     req.usuario.id,
        motivo:         motivo || null,
        fyh_cancelacion: new Date()
      }, { transaction });

      await transaction.commit();

      logger.info('Venta cancelada y stock restaurado', {
        id_venta,
        cancelada_por:    req.usuario.id,
        items_restaurados: (ventaData.items || []).length,
        motivo:           motivo || null
      });

      // fire-and-forget: notificar al cliente que su venta fue cancelada (solo si hay cliente asociado)
      if (ventaData.id_cliente) {
        notificationService.crearNotificacion(
          ventaData.id_cliente,
          'venta_cancelada',
          'Venta cancelada',
          'Tu pedido fue cancelado.',
          ventaData.id_venta,
          '/panel'
        );
      }

      // Email de cancelación al cliente (no bloqueante — falla silenciosa)
      if (ventaData.id_cliente) {
        Cliente.findByPk(ventaData.id_cliente, {
          attributes: ['email_cliente', 'nombre_cliente']
        }).then(cliente => {
          if (cliente?.email_cliente) {
            sendCancellationEmail(cliente.email_cliente, {
              nro_venta:    `V-${ventaData.nro_venta.toString().padStart(5, '0')}`,
              total_pagado: ventaData.total_pagado,
              motivo:       motivo || null,
              items:        ventaData.items || []
            }).catch(err => logger.error('Error enviando email de cancelación:', { error: err.message }));
          }
        }).catch(err => logger.error('Error buscando cliente para email cancelación:', { error: err.message }));
      }

      return res.json({ mensaje: 'Venta cancelada y stock restaurado exitosamente' });

    } catch (error) {
      await transaction.rollback();
      logger.error('Error al cancelar venta (ROLLBACK):', {
        error:    error instanceof Error ? error.message : 'Error desconocido',
        id_venta: req.params.id_venta
      });
      return res.status(500).json({ mensaje: 'Error al cancelar la venta' });
    }
  }

  /**
   * Obtiene la cotización USD/ARS configurada en el sistema
   * GET /api/ventas/admin/tipo-cambio
   * Accesible por roles 1, 2 y 3
   */
  static async obtenerTipoCambio(_req: Request, res: Response) {
    try {
      const config = await Configuracion.findByPk('tipo_cambio_usd');
      const valor = config ? parseFloat(config.valor) : 1200.00;
      return res.json({ valor, fyh_actualizacion: config?.fyh_actualizacion || null });
    } catch (error) {
      logger.error('Error al obtener tipo de cambio:', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      return res.status(500).json({ mensaje: 'Error al obtener tipo de cambio' });
    }
  }

  /**
   * Actualiza la cotización USD/ARS del sistema
   * PUT /api/ventas/admin/tipo-cambio
   * Solo admin (rol 1) y empleado (rol 2)
   */
  static async actualizarTipoCambio(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ mensaje: 'Datos inválidos', errores: errors.array() });
      }

      const { valor } = req.body as ActualizarTipoCambioBody;
      await Configuracion.upsert({
        clave: 'tipo_cambio_usd',
        valor: valor.toString(),
        fyh_actualizacion: new Date()
      });

      logger.info('Tipo de cambio USD actualizado', { valor, usuario_id: req.usuario?.id });
      return res.json({ mensaje: 'Tipo de cambio actualizado', valor });
    } catch (error) {
      logger.error('Error al actualizar tipo de cambio:', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      return res.status(500).json({ mensaje: 'Error al actualizar tipo de cambio' });
    }
  }

  /**
   * Actualiza el estado de una venta (en_preparacion, enviado, entregado)
   * PATCH /api/ventas/admin/:id_venta/estado
   *
   * Roles: admin (1), gerente (2), vendedor (3)
   * Envía email al cliente de forma no bloqueante al actualizar el estado.
   */
  static async actualizarEstadoVenta(req: Request, res: Response) {
    try {
      const { id_venta } = req.params;
      const { estado } = req.body as { estado: string };

      const estadosValidos = ['en_preparacion', 'enviado', 'entregado'] as const;
      type EstadoValidoVenta = typeof estadosValidos[number];

      if (!estadosValidos.includes(estado as EstadoValidoVenta)) {
        return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` });
      }

      const venta = await Venta.findByPk(parseInt(id_venta), {
        include: [{ model: Cliente, attributes: ['email_cliente', 'nombre_cliente'] }]
      });

      if (!venta) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      if (venta.estado === 'cancelada') {
        return res.status(400).json({ error: 'No se puede actualizar el estado de una venta cancelada' });
      }

      await venta.update({ estado, fyh_actualizacion: new Date() });

      logger.info('Estado de venta actualizado', { id_venta, estado, id_usuario: req.usuario?.id });

      // Enviar email al cliente (no bloqueante)
      const ventaJson = venta.toJSON() as Record<string, unknown>;
      const clienteData = ventaJson['Cliente'] as { email_cliente: string; nombre_cliente: string } | undefined;

      if (clienteData?.email_cliente) {
        const nroVenta = `V-${String(ventaJson['nro_venta']).padStart(5, '0')}`;
        sendOrderStatusEmail(clienteData.email_cliente, {
          nro_venta: nroVenta,
          nombre_cliente: clienteData.nombre_cliente,
          nuevo_estado: estado as EstadoValidoVenta,
        }).catch(err => logger.error('Error enviando email de estado de venta:', { error: err.message }));
      }

      return res.status(200).json({ success: true, mensaje: `Estado actualizado a: ${estado}` });
    } catch (error) {
      logger.error('Error en actualizarEstadoVenta:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Genera y descarga el comprobante de una venta en PDF
   * GET /api/ventas/admin/:id_venta/comprobante
   * Roles: admin (1), gerente (2), vendedor (3)
   */
  static async descargarComprobante(req: Request, res: Response) {
    try {
      const { id_venta } = req.params;

      const venta = await Venta.findOne({
        where: { id_venta },
        include: [
          {
            model: Cliente,
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'email_cliente'],
            required: false,
          },
          {
            model: Usuario,
            as: 'vendedor',
            attributes: ['id_usuario', 'nombres'],
            required: false,
          },
          {
            model: VentaItem,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'codigo'],
              },
            ],
          },
          {
            model: Envio,
            as: 'envio',
            required: false,
            include: [
              {
                model: Direccion,
                as: 'direccion_envio',
                required: false,
                attributes: ['calle', 'numero', 'piso', 'departamento', 'barrio', 'ciudad', 'provincia'],
              },
            ],
          },
        ],
      });

      if (!venta) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      const v = venta.toJSON() as Record<string, any>;
      const nroVenta = `V-${v.nro_venta.toString().padStart(5, '0')}`;

      const detalle: DetalleParaComprobante = {
        id_venta:     v.id_venta,
        nro_venta:    nroVenta,
        fyh_creacion: v.fyh_creacion,
        total_pagado: parseFloat(v.total_pagado),
        estado:       v.estado,
        metodo_pago:  v.metodo_pago,
        tipo_venta:   v.tipo_venta,
        moneda:       v.moneda,
        observaciones: v.observaciones,
        cliente: v.Cliente ? {
          id_cliente:      v.Cliente.id_cliente,
          nombre_cliente:  v.Cliente.nombre_cliente,
          apellido_cliente: v.Cliente.apellido_cliente,
          correo:          v.Cliente.email_cliente,
        } : null,
        vendedor: v.vendedor ? {
          id_vendedor: v.vendedor.id_usuario,
          nombres:     v.vendedor.nombres,
        } : null,
        envio: v.envio ? {
          tipo_entrega: v.envio.tipo_entrega,
          direccion_envio: (v.envio.envio_calle || v.envio.direccion_envio) ? {
            calle:       v.envio.envio_calle       || v.envio.direccion_envio?.calle       || null,
            numero:      v.envio.envio_numero      || v.envio.direccion_envio?.numero      || null,
            piso:        v.envio.envio_piso        || v.envio.direccion_envio?.piso        || null,
            departamento: v.envio.envio_departamento || v.envio.direccion_envio?.departamento || null,
            barrio:      v.envio.envio_barrio      || v.envio.direccion_envio?.barrio      || null,
            ciudad:      v.envio.envio_ciudad      || v.envio.direccion_envio?.ciudad      || null,
            provincia:   v.envio.envio_provincia   || v.envio.direccion_envio?.provincia   || null,
          } : null,
        } : null,
        items: (v.items || []).map((item: any) => ({
          nombre_producto: item.producto?.nombre || 'Producto no disponible',
          codigo:          item.producto?.codigo || null,
          cantidad:        item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal:        parseFloat(item.subtotal),
        })),
      };

      const pdfBuffer = await generarComprobantePDF(detalle);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="comprobante-${nroVenta}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (error) {
      logger.error('Error generando comprobante PDF:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_venta: req.params.id_venta,
      });
      return res.status(500).json({ error: 'Error al generar el comprobante' });
    }
  }

  /**
   * Envía el comprobante de una venta por email al cliente
   * POST /api/ventas/admin/:id_venta/enviar-comprobante
   * Roles: admin (1), gerente (2), vendedor (3)
   * Requiere que la venta tenga cliente con correo registrado
   */
  static async enviarComprobante(req: Request, res: Response) {
    try {
      const { id_venta } = req.params;

      const venta = await Venta.findOne({
        where: { id_venta },
        include: [
          {
            model: Cliente,
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'email_cliente'],
            required: false,
          },
          {
            model: Usuario,
            as: 'vendedor',
            attributes: ['id_usuario', 'nombres'],
            required: false,
          },
          {
            model: VentaItem,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'codigo'],
              },
            ],
          },
          {
            model: Envio,
            as: 'envio',
            required: false,
            include: [
              {
                model: Direccion,
                as: 'direccion_envio',
                required: false,
                attributes: ['calle', 'numero', 'piso', 'departamento', 'barrio', 'ciudad', 'provincia'],
              },
            ],
          },
        ],
      });

      if (!venta) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      const v = venta.toJSON() as Record<string, any>;

      if (!v.Cliente?.email_cliente) {
        return res.status(400).json({ error: 'Esta venta no tiene cliente con correo registrado' });
      }

      const nroVenta = `V-${v.nro_venta.toString().padStart(5, '0')}`;

      const detalle: DetalleParaComprobante = {
        id_venta:     v.id_venta,
        nro_venta:    nroVenta,
        fyh_creacion: v.fyh_creacion,
        total_pagado: parseFloat(v.total_pagado),
        estado:       v.estado,
        metodo_pago:  v.metodo_pago,
        tipo_venta:   v.tipo_venta,
        moneda:       v.moneda,
        observaciones: v.observaciones,
        cliente: {
          id_cliente:      v.Cliente.id_cliente,
          nombre_cliente:  v.Cliente.nombre_cliente,
          apellido_cliente: v.Cliente.apellido_cliente,
          correo:          v.Cliente.email_cliente,
        },
        vendedor: v.vendedor ? {
          id_vendedor: v.vendedor.id_usuario,
          nombres:     v.vendedor.nombres,
        } : null,
        envio: v.envio ? {
          tipo_entrega: v.envio.tipo_entrega,
          direccion_envio: (v.envio.envio_calle || v.envio.direccion_envio) ? {
            calle:       v.envio.envio_calle       || v.envio.direccion_envio?.calle       || null,
            numero:      v.envio.envio_numero      || v.envio.direccion_envio?.numero      || null,
            piso:        v.envio.envio_piso        || v.envio.direccion_envio?.piso        || null,
            departamento: v.envio.envio_departamento || v.envio.direccion_envio?.departamento || null,
            barrio:      v.envio.envio_barrio      || v.envio.direccion_envio?.barrio      || null,
            ciudad:      v.envio.envio_ciudad      || v.envio.direccion_envio?.ciudad      || null,
            provincia:   v.envio.envio_provincia   || v.envio.direccion_envio?.provincia   || null,
          } : null,
        } : null,
        items: (v.items || []).map((item: any) => ({
          nombre_producto: item.producto?.nombre || 'Producto no disponible',
          codigo:          item.producto?.codigo || null,
          cantidad:        item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal:        parseFloat(item.subtotal),
        })),
      };

      const pdfBuffer = await generarComprobantePDF(detalle);
      const nombreCliente = `${v.Cliente.nombre_cliente} ${v.Cliente.apellido_cliente}`;
      await sendComprobanteEmail(v.Cliente.email_cliente, nroVenta, nombreCliente, pdfBuffer);

      return res.json({ mensaje: `Comprobante enviado a ${v.Cliente.email_cliente}` });
    } catch (error) {
      logger.error('Error enviando comprobante por email:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_venta: req.params.id_venta,
      });
      return res.status(500).json({ error: 'Error al enviar el comprobante por email' });
    }
  }
}

