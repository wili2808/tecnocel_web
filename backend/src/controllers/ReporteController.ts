import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import type {
  ReporteMetodoPago,
  ReporteVentasPeriodo,
  ReporteVentasResumenRaw,
  ReporteProductoResumen,
  ReporteProductoVendido,
  ReporteStockBajo,
  ReporteCountResult,
  ReporteClienteTop,
  ReporteCancelacionResumen,
  ReporteCancelacionItem
} from '../types/reporte.types.js';
import Venta from '../models/Venta.js';
import Cliente from '../models/Cliente.js';
import logger from '../services/loggerService.js';

// ─── Fragmentos SQL reutilizables para normalización de moneda ───────────────

/** Convierte total_pagado a ARS usando el tipo de cambio histórico de la venta */
const SQL_ARS = (alias = 'v') =>
  `CASE WHEN ${alias}.moneda = 'USD' AND ${alias}.valor_dolar IS NOT NULL AND ${alias}.valor_dolar > 0
        THEN ${alias}.total_pagado * ${alias}.valor_dolar
        ELSE ${alias}.total_pagado
   END`;

/** Convierte total_pagado a USD usando el tipo de cambio histórico de la venta */
const SQL_USD = (alias = 'v') =>
  `CASE WHEN ${alias}.moneda = 'USD' THEN ${alias}.total_pagado
        WHEN ${alias}.valor_dolar IS NOT NULL AND ${alias}.valor_dolar > 0
          THEN ROUND(${alias}.total_pagado / ${alias}.valor_dolar, 2)
        ELSE NULL
   END`;

export default class ReporteController {

  /**
   * Reporte de Ventas - Agrupado por período con totales duales ARS/USD
   * GET /api/reportes/ventas
   */
  static async reporteVentas(req: Request, res: Response) {
    try {
      const {
        fecha_inicio,
        fecha_fin,
        agrupacion = 'dia',
        metodo_pago,
        tipo_venta
      } = req.query;

      // Parsear id_vendedor con validación explícita
      const idVendedorRaw = req.query.id_vendedor as string | undefined;
      let filtroVendedor = '';
      let filtroVendedorV = '';
      let idVendedorNum: number | undefined;

      if (idVendedorRaw === 'null') {
        filtroVendedor  = 'AND id_vendedor IS NULL';
        filtroVendedorV = 'AND v.id_vendedor IS NULL';
      } else {
        const parsed = parseInt(idVendedorRaw ?? '', 10);
        if (parsed > 0) {
          idVendedorNum   = parsed;
          filtroVendedor  = 'AND id_vendedor = :id_vendedor';
          filtroVendedorV = 'AND v.id_vendedor = :id_vendedor';
        }
      }

      const hasFechas = fecha_inicio && fecha_fin;
      const filtroFechas = hasFechas
        ? 'AND fyh_creacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';
      const filtroFechasV = hasFechas
        ? 'AND v.fyh_creacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';
      const filtroMetodo  = metodo_pago ? 'AND metodo_pago = :metodo_pago'   : '';
      const filtroTipo    = tipo_venta  ? 'AND tipo_venta = :tipo_venta'     : '';
      const filtroMetodoV = metodo_pago ? 'AND v.metodo_pago = :metodo_pago' : '';
      const filtroTipoV   = tipo_venta  ? 'AND v.tipo_venta = :tipo_venta'   : '';

      const replacements = {
        fecha_inicio: fecha_inicio as string,
        fecha_fin_full: `${fecha_fin as string} 23:59:59`,
        metodo_pago: metodo_pago as string,
        tipo_venta: tipo_venta as string,
        ...(idVendedorNum !== undefined && { id_vendedor: idVendedorNum }),
      };

      const vendedorParaBuildWhere =
        idVendedorRaw === 'null' ? null :
        idVendedorNum !== undefined ? idVendedorNum :
        undefined;

      // ── Resumen general con montos duales ───────────────────────────────
      const [resumenRows, ventasWeb, ventasManual, metodoPagoResult] = await Promise.all([
        sequelize.query<ReporteVentasResumenRaw>(
          `SELECT
             COUNT(*) AS total_ventas,
             COALESCE(SUM(${SQL_ARS()}), 0) AS ingresos_ars,
             COALESCE(SUM(${SQL_USD()}), 0) AS ingresos_usd,
             COALESCE(SUM(CASE WHEN v.moneda = 'ARS' OR v.moneda IS NULL THEN 1 ELSE 0 END), 0) AS ventas_ars,
             COALESCE(SUM(CASE WHEN v.moneda = 'USD' THEN 1 ELSE 0 END), 0) AS ventas_usd
           FROM tb_ventas v
           WHERE v.estado = 'completada' ${filtroFechasV} ${filtroMetodoV} ${filtroTipoV} ${filtroVendedorV}`,
          { replacements, type: QueryTypes.SELECT }
        ),
        Venta.count({ where: buildWhere({ estado: 'completada', fecha_inicio, fecha_fin, metodo_pago, tipo_venta: 'web',    id_vendedor: vendedorParaBuildWhere }) }),
        Venta.count({ where: buildWhere({ estado: 'completada', fecha_inicio, fecha_fin, metodo_pago, tipo_venta: 'manual', id_vendedor: vendedorParaBuildWhere }) }),
        sequelize.query<ReporteMetodoPago>(
          `SELECT metodo_pago, COUNT(*) AS total
           FROM tb_ventas
           WHERE estado = 'completada' ${filtroFechas} ${filtroMetodo} ${filtroTipo} ${filtroVendedor}
             AND metodo_pago IS NOT NULL
           GROUP BY metodo_pago
           ORDER BY total DESC
           LIMIT 1`,
          { replacements, type: QueryTypes.SELECT }
        )
      ]);

      const resumenRaw = resumenRows[0] || { total_ventas: 0, ingresos_ars: 0, ingresos_usd: 0, ventas_ars: 0, ventas_usd: 0 };

      // ── Datos agrupados por período ──────────────────────────────────────
      let dateFormat: string;
      switch (agrupacion) {
        case 'semana': dateFormat = '%x-W%v'; break;
        case 'mes':    dateFormat = '%Y-%m';  break;
        default:       dateFormat = '%Y-%m-%d';
      }

      const datosAgrupados = await sequelize.query<ReporteVentasPeriodo>(
        `SELECT
           DATE_FORMAT(v.fyh_creacion, :dateFormat) AS periodo,
           COUNT(*) AS ventas,
           COALESCE(SUM(${SQL_ARS()}), 0) AS ingresos_ars,
           COALESCE(SUM(${SQL_USD()}), 0) AS ingresos_usd,
           COALESCE(ROUND(AVG(${SQL_ARS()}), 0), 0) AS ticket_promedio
         FROM tb_ventas v
         WHERE v.estado = 'completada' ${filtroFechasV} ${filtroMetodoV} ${filtroTipoV} ${filtroVendedorV}
         GROUP BY periodo
         ORDER BY periodo DESC`,
        { replacements: { ...replacements, dateFormat }, type: QueryTypes.SELECT }
      );

      return res.json({
        success: true,
        data: {
          resumen: {
            total_ventas:     resumenRaw.total_ventas,
            ingresos_ars:     resumenRaw.ingresos_ars,
            ingresos_usd:     resumenRaw.ingresos_usd,
            ventas_ars:       resumenRaw.ventas_ars,
            ventas_usd:       resumenRaw.ventas_usd,
            ticket_promedio:  resumenRaw.total_ventas > 0
              ? Math.round(resumenRaw.ingresos_ars / resumenRaw.total_ventas)
              : 0,
            ventas_web:       ventasWeb,
            ventas_manual:    ventasManual,
            metodo_mas_usado: metodoPagoResult[0]?.metodo_pago || 'N/A'
          },
          datos: datosAgrupados
        }
      });
    } catch (error) {
      logger.error('Error en reporteVentas:', { error: error instanceof Error ? error.message : 'Error desconocido' });
      return res.status(500).json({ mensaje: 'Error al obtener el reporte de ventas' });
    }
  }

  /**
   * Reporte de Productos - Más vendidos, stock bajo, métricas
   * GET /api/reportes/productos
   * Nota: subtotales de VentaItem se almacenan en la moneda de la venta padre.
   * La conversión dual requiere JOIN con tb_ventas.
   */
  static async reporteProductos(req: Request, res: Response) {
    try {
      const {
        fecha_inicio,
        fecha_fin,
        limite = '20',
        orden = 'mas_vendidos'
      } = req.query;

      const limiteNum = parseInt(limite as string, 10) || 20;
      const fechaCondition = fecha_inicio && fecha_fin
        ? 'AND v.fyh_creacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';

      let orderBy: string;
      switch (orden) {
        case 'menos_vendidos': orderBy = 'unidades_vendidas ASC';  break;
        case 'mayor_ingreso':  orderBy = 'ingreso_total DESC';     break;
        default:               orderBy = 'unidades_vendidas DESC';
      }

      const replacements = {
        fecha_inicio: fecha_inicio as string,
        fecha_fin_full: `${fecha_fin as string} 23:59:59`,
        limite: limiteNum
      };

      // Resumen: subtotales de items × conversión de la venta padre
      const resumenResult = await sequelize.query<ReporteProductoResumen>(
        `SELECT
           COUNT(DISTINCT vi.id_producto) AS productos_distintos_vendidos,
           COALESCE(SUM(vi.cantidad), 0) AS unidades_totales,
           COALESCE(SUM(
             CASE WHEN v.moneda = 'USD' AND v.valor_dolar IS NOT NULL AND v.valor_dolar > 0
               THEN vi.subtotal * v.valor_dolar
               ELSE vi.subtotal
             END
           ), 0) AS ingreso_total_productos
         FROM tb_venta_items vi
         INNER JOIN tb_ventas v ON v.id_venta = vi.id_venta
         WHERE v.estado = 'completada' ${fechaCondition}`,
        { replacements, type: QueryTypes.SELECT }
      );

      const masVendidos = await sequelize.query<ReporteProductoVendido>(
        `SELECT
           a.id_producto,
           a.nombre,
           a.codigo,
           COALESCE(c.nombre_categoria, 'Sin categoría') AS categoria,
           COALESCE(m.nombre_marca, 'Sin marca') AS marca,
           SUM(vi.cantidad) AS unidades_vendidas,
           COALESCE(SUM(
             CASE WHEN v.moneda = 'USD' AND v.valor_dolar IS NOT NULL AND v.valor_dolar > 0
               THEN vi.subtotal * v.valor_dolar
               ELSE vi.subtotal
             END
           ), 0) AS ingreso_total,
           a.precio_venta AS precio_venta_actual,
           a.stock AS stock_actual
         FROM tb_venta_items vi
         INNER JOIN tb_ventas v ON v.id_venta = vi.id_venta
         INNER JOIN tb_almacen a ON a.id_producto = vi.id_producto
         LEFT JOIN tb_categorias c ON c.id_categoria = a.id_categoria
         LEFT JOIN tb_marcas m ON m.id_marca = a.id_marca
         WHERE v.estado = 'completada' ${fechaCondition}
         GROUP BY a.id_producto, a.nombre, a.codigo, c.nombre_categoria, m.nombre_marca, a.precio_venta, a.stock
         ORDER BY ${orderBy}
         LIMIT :limite`,
        { replacements, type: QueryTypes.SELECT }
      );

      const stockBajo = await sequelize.query<ReporteStockBajo>(
        `SELECT id_producto, nombre, stock, stock_minimo
         FROM tb_almacen
         WHERE stock_minimo IS NOT NULL AND stock <= stock_minimo
         ORDER BY (stock_minimo - stock) DESC
         LIMIT 20`,
        { type: QueryTypes.SELECT }
      );

      return res.json({
        success: true,
        data: {
          resumen: resumenResult[0] || { productos_distintos_vendidos: 0, unidades_totales: 0, ingreso_total_productos: 0 },
          mas_vendidos: masVendidos,
          stock_bajo: stockBajo
        }
      });
    } catch (error) {
      logger.error('Error en reporteProductos:', { error: error instanceof Error ? error.message : 'Error desconocido' });
      return res.status(500).json({ mensaje: 'Error al obtener el reporte de productos' });
    }
  }

  /**
   * Reporte de Clientes - Top clientes con montos duales ARS/USD
   * GET /api/reportes/clientes
   */
  static async reporteClientes(req: Request, res: Response) {
    try {
      const { fecha_inicio, fecha_fin, limite = '20' } = req.query;

      const limiteNum = parseInt(limite as string, 10) || 20;
      const hasFechas = fecha_inicio && fecha_fin;
      const fechaCondition = hasFechas
        ? 'AND v.fyh_creacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';
      const fechaConditionCliente = hasFechas
        ? 'AND fyh_creacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';

      const replacements = {
        fecha_inicio: fecha_inicio as string,
        fecha_fin_full: `${fecha_fin as string} 23:59:59`,
        limite: limiteNum
      };

      const [clientesNuevos, clientesConCompras, clientesTotales] = await Promise.all([
        sequelize.query<ReporteCountResult>(
          `SELECT COUNT(*) AS total FROM tb_clientes WHERE 1=1 ${fechaConditionCliente}`,
          { replacements, type: QueryTypes.SELECT }
        ),
        sequelize.query<ReporteCountResult>(
          `SELECT COUNT(DISTINCT v.id_cliente) AS total
           FROM tb_ventas v
           WHERE v.estado = 'completada' AND v.id_cliente IS NOT NULL ${fechaCondition}`,
          { replacements, type: QueryTypes.SELECT }
        ),
        Cliente.count()
      ]);

      const topClientes = await sequelize.query<ReporteClienteTop>(
        `SELECT
           c.id_cliente,
           CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) AS nombre,
           c.email_cliente AS email,
           COUNT(v.id_venta) AS total_compras,
           COALESCE(SUM(${SQL_ARS('v')}), 0) AS monto_ars,
           COALESCE(SUM(${SQL_USD('v')}), 0) AS monto_usd,
           MAX(v.fyh_creacion) AS ultima_compra
         FROM tb_clientes c
         INNER JOIN tb_ventas v ON v.id_cliente = c.id_cliente
         WHERE v.estado = 'completada' ${fechaCondition}
         GROUP BY c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.email_cliente
         ORDER BY monto_ars DESC
         LIMIT :limite`,
        { replacements, type: QueryTypes.SELECT }
      );

      return res.json({
        success: true,
        data: {
          resumen: {
            clientes_nuevos_periodo: clientesNuevos[0]?.total || 0,
            clientes_con_compras:    clientesConCompras[0]?.total || 0,
            clientes_totales:        clientesTotales
          },
          top_clientes: topClientes
        }
      });
    } catch (error) {
      logger.error('Error en reporteClientes:', { error: error instanceof Error ? error.message : 'Error desconocido' });
      return res.status(500).json({ mensaje: 'Error al obtener el reporte de clientes' });
    }
  }

  /**
   * Reporte de Cancelaciones - Montos duales ARS/USD
   * GET /api/reportes/cancelaciones
   */
  static async reporteCancelaciones(req: Request, res: Response) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      const hasFechas = fecha_inicio && fecha_fin;
      const fechaConditionCancel = hasFechas
        ? 'AND ca.fyh_cancelacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';
      const fechaConditionVenta = hasFechas
        ? 'AND fyh_creacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';

      const replacements = {
        fecha_inicio: fecha_inicio as string,
        fecha_fin_full: `${fecha_fin as string} 23:59:59`
      };

      const [cancelaciones, totalVentasPeriodo] = await Promise.all([
        sequelize.query<ReporteCancelacionResumen>(
          `SELECT
             COUNT(*) AS total_cancelaciones,
             COALESCE(SUM(${SQL_ARS('v')}), 0) AS monto_ars,
             COALESCE(SUM(${SQL_USD('v')}), 0) AS monto_usd
           FROM tb_cancelaciones ca
           INNER JOIN tb_ventas v ON v.id_venta = ca.id_venta
           WHERE 1=1 ${fechaConditionCancel}`,
          { replacements, type: QueryTypes.SELECT }
        ),
        sequelize.query<ReporteCountResult>(
          `SELECT COUNT(*) AS total FROM tb_ventas WHERE 1=1 ${fechaConditionVenta}`,
          { replacements, type: QueryTypes.SELECT }
        )
      ]);

      const totalCancelaciones = cancelaciones[0]?.total_cancelaciones || 0;
      const totalVentas = totalVentasPeriodo[0]?.total || 0;
      const tasaCancelacion = totalVentas > 0
        ? parseFloat(((totalCancelaciones / totalVentas) * 100).toFixed(1))
        : 0;

      const datos = await sequelize.query<ReporteCancelacionItem>(
        `SELECT
           v.id_venta,
           CONCAT('V-', LPAD(v.nro_venta, 5, '0')) AS nro_venta,
           ca.fyh_cancelacion AS fecha_cancelacion,
           v.total_pagado AS monto,
           COALESCE(v.moneda, 'ARS') AS moneda,
           ${SQL_ARS('v')} AS monto_ars,
           ${SQL_USD('v')} AS monto_usd,
           COALESCE(ca.motivo, 'Sin motivo especificado') AS motivo,
           COALESCE(u.nombres, 'Sistema') AS cancelado_por
         FROM tb_cancelaciones ca
         INNER JOIN tb_ventas v ON v.id_venta = ca.id_venta
         LEFT JOIN tb_usuarios u ON u.id_usuario = ca.id_usuario
         WHERE 1=1 ${fechaConditionCancel}
         ORDER BY ca.fyh_cancelacion DESC
         LIMIT 100`,
        { replacements, type: QueryTypes.SELECT }
      );

      return res.json({
        success: true,
        data: {
          resumen: {
            total_cancelaciones:  totalCancelaciones,
            monto_ars:            cancelaciones[0]?.monto_ars || 0,
            monto_usd:            cancelaciones[0]?.monto_usd || 0,
            tasa_cancelacion:     tasaCancelacion
          },
          datos
        }
      });
    } catch (error) {
      logger.error('Error en reporteCancelaciones:', { error: error instanceof Error ? error.message : 'Error desconocido' });
      return res.status(500).json({ mensaje: 'Error al obtener el reporte de cancelaciones' });
    }
  }

  /**
   * Exportar CSV - Genera archivo CSV descargable con montos duales
   * GET /api/reportes/exportar/:tipo
   */
  static async exportarCSV(req: Request, res: Response) {
    try {
      const { tipo } = req.params;
      const tiposValidos = ['ventas', 'productos', 'clientes', 'cancelaciones'];

      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ mensaje: 'Tipo de reporte inválido' });
      }

      const { fecha_inicio, fecha_fin } = req.query;
      const hasFechas = fecha_inicio && fecha_fin;
      const fechaCondition = hasFechas
        ? 'AND v.fyh_creacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';
      const fechaConditionCancel = hasFechas
        ? 'AND ca.fyh_cancelacion BETWEEN :fecha_inicio AND :fecha_fin_full'
        : '';

      const replacements: Record<string, unknown> = {
        fecha_inicio: fecha_inicio as string,
        fecha_fin_full: `${fecha_fin as string} 23:59:59`
      };

      const idVendedorRawCsv = req.query.id_vendedor as string | undefined;
      let filtroVendedorCsv = '';

      if (idVendedorRawCsv === 'null') {
        filtroVendedorCsv = 'AND v.id_vendedor IS NULL';
      } else {
        const parsed = parseInt(idVendedorRawCsv ?? '', 10);
        if (parsed > 0) {
          filtroVendedorCsv = 'AND v.id_vendedor = :id_vendedor';
          replacements['id_vendedor'] = parsed;
        }
      }

      let csvContent = '';
      let filename = '';

      switch (tipo) {
        case 'ventas': {
          const datos = await sequelize.query<Record<string, unknown>>(
            `SELECT
               v.id_venta AS "ID",
               CONCAT('V-', LPAD(v.nro_venta, 5, '0')) AS "Nro Venta",
               DATE_FORMAT(v.fyh_creacion, '%Y-%m-%d') AS "Fecha",
               COALESCE(v.moneda, 'ARS') AS "Moneda",
               v.total_pagado AS "Total (Moneda Original)",
               ${SQL_ARS('v')} AS "Total ARS",
               ${SQL_USD('v')} AS "Total USD",
               COALESCE(v.valor_dolar, '') AS "Tipo de Cambio",
               COALESCE(v.metodo_pago, 'N/A') AS "Metodo Pago",
               v.tipo_venta AS "Tipo",
               v.estado AS "Estado",
               COALESCE(CONCAT(c.nombre_cliente, ' ', c.apellido_cliente), 'Venta manual') AS "Cliente",
               COALESCE(u.nombres, 'Venta Web') AS "Vendedor"
             FROM tb_ventas v
             LEFT JOIN tb_clientes c ON c.id_cliente = v.id_cliente
             LEFT JOIN tb_usuarios u ON u.id_usuario = v.id_vendedor
             WHERE v.estado = 'completada' ${fechaCondition} ${filtroVendedorCsv}
             ORDER BY v.fyh_creacion DESC`,
            { replacements, type: QueryTypes.SELECT }
          );
          csvContent = ReporteController.arrayToCSV(datos);
          filename = 'reporte_ventas';
          break;
        }

        case 'productos': {
          const datos = await sequelize.query<Record<string, unknown>>(
            `SELECT
               a.id_producto AS "ID",
               a.nombre AS "Producto",
               a.codigo AS "Codigo",
               COALESCE(cat.nombre_categoria, 'Sin categoria') AS "Categoria",
               COALESCE(m.nombre_marca, 'Sin marca') AS "Marca",
               SUM(vi.cantidad) AS "Unidades Vendidas",
               COALESCE(SUM(
                 CASE WHEN v.moneda = 'USD' AND v.valor_dolar IS NOT NULL AND v.valor_dolar > 0
                   THEN vi.subtotal * v.valor_dolar
                   ELSE vi.subtotal
                 END
               ), 0) AS "Ingreso Total ARS",
               a.precio_venta AS "Precio Actual",
               a.stock AS "Stock"
             FROM tb_venta_items vi
             INNER JOIN tb_ventas v ON v.id_venta = vi.id_venta
             INNER JOIN tb_almacen a ON a.id_producto = vi.id_producto
             LEFT JOIN tb_categorias cat ON cat.id_categoria = a.id_categoria
             LEFT JOIN tb_marcas m ON m.id_marca = a.id_marca
             WHERE v.estado = 'completada' ${fechaCondition}
             GROUP BY a.id_producto, a.nombre, a.codigo, cat.nombre_categoria, m.nombre_marca, a.precio_venta, a.stock
             ORDER BY SUM(vi.cantidad) DESC`,
            { replacements, type: QueryTypes.SELECT }
          );
          csvContent = ReporteController.arrayToCSV(datos);
          filename = 'reporte_productos';
          break;
        }

        case 'clientes': {
          const datos = await sequelize.query<Record<string, unknown>>(
            `SELECT
               c.id_cliente AS "ID",
               CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) AS "Nombre",
               c.email_cliente AS "Email",
               COUNT(v.id_venta) AS "Total Compras",
               COALESCE(SUM(${SQL_ARS('v')}), 0) AS "Monto Total ARS",
               COALESCE(SUM(${SQL_USD('v')}), 0) AS "Monto Total USD",
               MAX(DATE_FORMAT(v.fyh_creacion, '%Y-%m-%d')) AS "Ultima Compra"
             FROM tb_clientes c
             INNER JOIN tb_ventas v ON v.id_cliente = c.id_cliente
             WHERE v.estado = 'completada' ${fechaCondition}
             GROUP BY c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.email_cliente
             ORDER BY SUM(${SQL_ARS('v')}) DESC`,
            { replacements, type: QueryTypes.SELECT }
          );
          csvContent = ReporteController.arrayToCSV(datos);
          filename = 'reporte_clientes';
          break;
        }

        case 'cancelaciones': {
          const datos = await sequelize.query<Record<string, unknown>>(
            `SELECT
               v.id_venta AS "ID Venta",
               CONCAT('V-', LPAD(v.nro_venta, 5, '0')) AS "Nro Venta",
               DATE_FORMAT(ca.fyh_cancelacion, '%Y-%m-%d') AS "Fecha Cancelacion",
               COALESCE(v.moneda, 'ARS') AS "Moneda",
               v.total_pagado AS "Monto (Moneda Original)",
               ${SQL_ARS('v')} AS "Monto ARS",
               ${SQL_USD('v')} AS "Monto USD",
               COALESCE(v.valor_dolar, '') AS "Tipo de Cambio",
               COALESCE(ca.motivo, 'Sin motivo') AS "Motivo",
               COALESCE(u.nombres, 'Sistema') AS "Cancelado Por"
             FROM tb_cancelaciones ca
             INNER JOIN tb_ventas v ON v.id_venta = ca.id_venta
             LEFT JOIN tb_usuarios u ON u.id_usuario = ca.id_usuario
             WHERE 1=1 ${fechaConditionCancel}
             ORDER BY ca.fyh_cancelacion DESC`,
            { replacements, type: QueryTypes.SELECT }
          );
          csvContent = ReporteController.arrayToCSV(datos);
          filename = 'reporte_cancelaciones';
          break;
        }
      }

      const fechaSufijo = hasFechas
        ? `_${fecha_inicio}_${fecha_fin}`
        : `_${new Date().toISOString().split('T')[0]}`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}${fechaSufijo}.csv"`);
      return res.send('\uFEFF' + csvContent); // BOM para Excel
    } catch (error) {
      logger.error('Error en exportarCSV:', { error: error instanceof Error ? error.message : 'Error desconocido' });
      return res.status(500).json({ mensaje: 'Error al exportar el reporte' });
    }
  }

  /** Convierte un array de objetos a formato CSV */
  private static arrayToCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const headerRow = headers.map(h => `"${h}"`).join(',');
    const rows = data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [headerRow, ...rows].join('\n');
  }
}

// ─── Helper: construir where para Sequelize.count ────────────────────────────
function buildWhere(opts: {
  estado?: string;
  fecha_inicio?: unknown;
  fecha_fin?: unknown;
  metodo_pago?: unknown;
  tipo_venta?: string;
  id_vendedor?: number | null;
}): Record<string, unknown> {
  const w: Record<string, unknown> = {};
  if (opts.estado) w['estado'] = opts.estado;
  if (opts.tipo_venta) w['tipo_venta'] = opts.tipo_venta;
  if (opts.metodo_pago) w['metodo_pago'] = opts.metodo_pago;
  if (opts.fecha_inicio && opts.fecha_fin) {
    w['fyh_creacion'] = {
      [Op.between]: [opts.fecha_inicio as string, `${opts.fecha_fin as string} 23:59:59`]
    };
  }
  if (opts.id_vendedor !== undefined) {
    w['id_vendedor'] = opts.id_vendedor === null
      ? { [Op.is]: null }
      : opts.id_vendedor;
  }
  return w;
}
