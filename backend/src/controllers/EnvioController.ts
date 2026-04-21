import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import Envio from '../models/Envio.js';
import Venta from '../models/Venta.js';
import VentaItem from '../models/VentaItem.js';
import Cliente from '../models/Cliente.js';
import Almacen from '../models/Almacen.js';
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import Permiso from '../models/Permiso.js';
import logger from '../services/loggerService.js';
import { sendShippingInTransitEmail, sendShippingDeliveredEmail } from '../services/emailService.js';
import type {
  EnvioAdminListItem,
  EnvioAdminDetalle,
  ActualizarEstadoEnvioBody,
  FiltrosEnviosAdmin,
} from '../types/envio.types.js';
import { TRANSICIONES_ENVIO } from '../types/envio.types.js';
import type { UsuarioSession } from '../types/express.js';

class EnvioController {

  private static async _tienePermiso(req: Request, nombrePermiso: string): Promise<boolean> {
    const usuario = req.usuario as UsuarioSession | undefined;
    if (!usuario) return false;
    if (usuario.idRol === 1) return true; // ADMIN
    const dbUsuario = await Usuario.findByPk(usuario.id, {
      include: [{
        model: Rol,
        as: 'Rol',
        include: [{
          model: Permiso,
          as: 'permisos',
          where: { nombre: nombrePermiso },
          required: false
        }]
      }]
    });
    const rol = (dbUsuario as any)?.Rol;
    return !!(rol?.permisos && rol.permisos.length > 0);
  }

  // GET /api/envios/admin
  static async listarEnvios(req: Request, res: Response) {
    try {
      const {
        estado_envio,
        fecha_inicio,
        fecha_fin,
        search,
        limit = 20,
        offset = 0,
        tipo_entrega = 'envio',
      } = req.query as unknown as FiltrosEnviosAdmin;

      const permisoRequerido = tipo_entrega === 'retiro_en_tienda' ? 'ver_retiros' : 'ver_envios';
      const tienePermiso = await EnvioController._tienePermiso(req, permisoRequerido);
      if (!tienePermiso) {
        return res.status(403).json({ error: `No tiene permisos para ver ${tipo_entrega === 'retiro_en_tienda' ? 'retiros' : 'envíos'}` });
      }

      const limitNum = Math.min(Number(limit), 100);
      const offsetNum = Number(offset);

      const whereEnvio: Record<string, unknown> = { tipo_entrega };
      if (tipo_entrega !== 'retiro_en_tienda') {
        // Para envíos a domicilio, excluir 'no_aplica'
        whereEnvio['estado_envio'] = { [Op.ne]: 'no_aplica' };
      }
      // Para retiros no se filtra 'no_aplica' porque registros legacy lo usan como estado inicial
      if (estado_envio) whereEnvio['estado_envio'] = estado_envio;

      const whereVenta: Record<string, unknown> = {};
      if (fecha_inicio || fecha_fin) {
        const rango: Record<symbol, unknown> = {};
        if (fecha_inicio) rango[Op.gte] = new Date(fecha_inicio);
        if (fecha_fin)    rango[Op.lte] = new Date(fecha_fin + 'T23:59:59');
        whereVenta['fyh_creacion'] = rango;
      }

      const includeCliente: Record<string, unknown> = {
        model: Cliente,
        attributes: ['nombre_cliente', 'apellido_cliente', 'email_cliente'],
        required: false,
      };

      if (search) {
        const nroNum = parseInt(search as string);
        if (!isNaN(nroNum)) {
          whereVenta['nro_venta'] = nroNum;
        } else {
          includeCliente['where'] = {
            [Op.or]: [
              { nombre_cliente: { [Op.like]: `%${search}%` } },
              { apellido_cliente: { [Op.like]: `%${search}%` } },
            ],
          };
          includeCliente['required'] = true;
        }
      }

      const { count, rows } = await Envio.findAndCountAll({
        where: whereEnvio,
        include: [
          {
            model: Venta,
            as: 'venta',
            attributes: ['nro_venta', 'fyh_creacion'],
            where: Object.keys(whereVenta).length ? whereVenta : undefined,
            required: true,
            include: [includeCliente as never],
          },
        ],
        limit: limitNum,
        offset: offsetNum,
        order: [['fyh_creacion', 'DESC']],
      });

      const items: EnvioAdminListItem[] = rows.map(envio => {
        const e = envio.toJSON() as Record<string, unknown>;
        const venta = e['venta'] as Record<string, unknown>;
        const cliente = venta?.['Cliente'] as Record<string, unknown> | undefined;
        const nombre = cliente
          ? `${cliente['nombre_cliente'] ?? ''} ${cliente['apellido_cliente'] ?? ''}`.trim()
          : null;
        return {
          id_envio: e['id_envio'] as number,
          id_venta: e['id_venta'] as number,
          nro_venta: venta?.['nro_venta'] as number,
          nombre_cliente: nombre || null,
          email_cliente: (cliente?.['email_cliente'] as string) ?? null,
          envio_calle: e['envio_calle'] as string | null,
          envio_numero: e['envio_numero'] as string | null,
          envio_ciudad: e['envio_ciudad'] as string | null,
          envio_provincia: e['envio_provincia'] as string | null,
          estado_envio: e['estado_envio'] as EnvioAdminListItem['estado_envio'],
          nro_seguimiento: e['nro_seguimiento'] as string | null,
          fyh_despacho: e['fyh_despacho'] ? String(e['fyh_despacho']) : null,
          fyh_creacion: String(e['fyh_creacion']),
          fyh_actualizacion: String(e['fyh_actualizacion']),
        };
      });

      return res.status(200).json({ success: true, data: items, total: count, limit: limitNum, offset: offsetNum });
    } catch (error) {
      logger.error('Error en listarEnvios:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/envios/admin/:id_envio
  static async obtenerDetalle(req: Request, res: Response) {
    try {
      const idEnvio = parseInt(req.params['id_envio']);
      if (isNaN(idEnvio)) return res.status(400).json({ error: 'ID inválido' });

      const envio = await Envio.findByPk(idEnvio, {
        include: [
          {
            model: Venta,
            as: 'venta',
            attributes: ['nro_venta', 'total_pagado', 'moneda', 'metodo_pago', 'fyh_creacion'],
            include: [
              {
                model: Cliente,
                attributes: ['nombre_cliente', 'apellido_cliente', 'email_cliente'],
                required: false,
              },
              {
                model: VentaItem,
                as: 'items',
                include: [{ model: Almacen, as: 'producto', attributes: ['nombre'] }],
              },
            ],
          },
        ],
      });

      if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });

      const e = envio.toJSON() as Record<string, unknown>;
      const tipoEntrega = e['tipo_entrega'] as string;
      
      const permisoRequerido = tipoEntrega === 'retiro_en_tienda' ? 'ver_retiros' : 'ver_envios';
      const tienePermiso = await EnvioController._tienePermiso(req, permisoRequerido);
      if (!tienePermiso) {
        return res.status(403).json({ error: 'No tiene permisos para ver este registro' });
      }

      const venta = e['venta'] as Record<string, unknown>;
      const cliente = venta?.['Cliente'] as Record<string, unknown> | undefined;
      const ventaItems = (venta?.['items'] ?? []) as Array<Record<string, unknown>>;
      const nombre = cliente
        ? `${cliente['nombre_cliente'] ?? ''} ${cliente['apellido_cliente'] ?? ''}`.trim()
        : null;

      const detalle: EnvioAdminDetalle = {
        id_envio: e['id_envio'] as number,
        id_venta: e['id_venta'] as number,
        nro_venta: venta?.['nro_venta'] as number,
        nombre_cliente: nombre || null,
        email_cliente: (cliente?.['email_cliente'] as string) ?? null,
        envio_calle: e['envio_calle'] as string | null,
        envio_numero: e['envio_numero'] as string | null,
        envio_ciudad: e['envio_ciudad'] as string | null,
        envio_provincia: e['envio_provincia'] as string | null,
        estado_envio: e['estado_envio'] as EnvioAdminDetalle['estado_envio'],
        nro_seguimiento: e['nro_seguimiento'] as string | null,
        fyh_despacho: e['fyh_despacho'] ? String(e['fyh_despacho']) : null,
        fyh_creacion: String(e['fyh_creacion']),
        fyh_actualizacion: String(e['fyh_actualizacion']),
        envio_nombre_direccion: e['envio_nombre_direccion'] as string | null,
        envio_piso: e['envio_piso'] as string | null,
        envio_departamento: e['envio_departamento'] as string | null,
        envio_barrio: e['envio_barrio'] as string | null,
        envio_codigo_postal: e['envio_codigo_postal'] as string | null,
        envio_pais: e['envio_pais'] as string | null,
        envio_referencia: e['envio_referencia'] as string | null,
        envio_telefono_contacto: e['envio_telefono_contacto'] as string | null,
        total_pagado: venta?.['total_pagado'] as number,
        moneda: venta?.['moneda'] as string,
        metodo_pago: venta?.['metodo_pago'] as string,
        fyh_venta: String(venta?.['fyh_creacion']),
        items: ventaItems.map(item => {
          const producto = item['producto'] as Record<string, unknown> | undefined;
          return {
            nombre_producto: (producto?.['nombre'] as string) ?? 'Producto',
            cantidad: item['cantidad'] as number,
            precio_unitario: item['precio_unitario'] as number,
          };
        }),
      };

      return res.status(200).json({ success: true, data: detalle });
    } catch (error) {
      logger.error('Error en obtenerDetalle (envio):', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PATCH /api/envios/admin/:id_envio/estado
  static async actualizarEstado(req: Request, res: Response) {
    try {
      const idEnvio = parseInt(req.params['id_envio']);
      if (isNaN(idEnvio)) return res.status(400).json({ error: 'ID inválido' });

      const { estado_envio, nro_seguimiento } = req.body as ActualizarEstadoEnvioBody;

      const envio = await Envio.findByPk(idEnvio, {
        include: [
          {
            model: Venta,
            as: 'venta',
            attributes: ['nro_venta', 'fyh_creacion'],
            include: [
              { model: Cliente, attributes: ['nombre_cliente', 'apellido_cliente', 'email_cliente'], required: false },
              {
                model: VentaItem,
                as: 'items',
                include: [{ model: Almacen, as: 'producto', attributes: ['nombre'] }],
              },
            ],
          },
        ],
      });

      if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });

      const e = envio.toJSON() as Record<string, unknown>;
      const tipoEntrega = e['tipo_entrega'] as string;

      const permisoRequerido = tipoEntrega === 'retiro_en_tienda' ? 'gestionar_retiros' : 'gestionar_envios';
      const tienePermiso = await EnvioController._tienePermiso(req, permisoRequerido);
      if (!tienePermiso) {
        return res.status(403).json({ error: 'No tiene permisos para gestionar este registro' });
      }

      // ── Retiro en tienda: flujo simplificado pendiente → entregado ──────────
      if (tipoEntrega === 'retiro_en_tienda') {
        if (estado_envio !== 'entregado') {
          return res.status(400).json({ error: 'Solo se puede marcar como entregado un retiro en tienda' });
        }
        if (envio.estado_envio === 'entregado') {
          return res.status(400).json({ error: 'Este retiro ya fue entregado' });
        }
        if (envio.estado_envio !== 'pendiente' && envio.estado_envio !== 'no_aplica') {
          return res.status(400).json({ error: 'Estado inválido para retiro en tienda' });
        }

        await envio.update({ estado_envio: 'entregado', fyh_actualizacion: new Date() });
        logger.info('Retiro en tienda entregado', { id_envio: idEnvio, id_usuario: req.usuario?.id });
        return res.status(200).json({ success: true, mensaje: 'Retiro marcado como entregado' });
      }

      // ── Envío a domicilio: flujo secuencial existente ───────────────────────
      const estadosValidos = ['en_preparacion', 'en_camino', 'entregado'] as const;
      if (!estadosValidos.includes(estado_envio)) {
        return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` });
      }

      // Validar transición secuencial
      const transicionEsperada = TRANSICIONES_ENVIO[envio.estado_envio];
      if (transicionEsperada !== estado_envio) {
        return res.status(400).json({
          error: `Transición inválida: de '${envio.estado_envio}' solo se puede pasar a '${transicionEsperada ?? 'ningún estado (ya entregado)'}'`,
        });
      }

      const campos: Record<string, unknown> = { estado_envio, fyh_actualizacion: new Date() };
      if (estado_envio === 'en_camino') {
        campos['fyh_despacho'] = new Date();
        if (nro_seguimiento?.trim()) campos['nro_seguimiento'] = nro_seguimiento.trim();
      }

      await envio.update(campos);

      logger.info('Estado de envío actualizado', { id_envio: idEnvio, estado_envio, id_usuario: req.usuario?.id });

      // Enviar email (fire-and-forget)
      if (estado_envio === 'en_camino' || estado_envio === 'entregado') {
        const venta = e['venta'] as Record<string, unknown>;
        const cliente = venta?.['Cliente'] as Record<string, unknown> | undefined;
        const ventaItems = (venta?.['items'] ?? []) as Array<Record<string, unknown>>;

        if (cliente?.['email_cliente']) {
          const emailCliente = String(cliente['email_cliente']);
          const nombreCliente = `${cliente['nombre_cliente'] ?? ''} ${cliente['apellido_cliente'] ?? ''}`.trim();
          const nroVenta = `V-${String(venta?.['nro_venta']).padStart(5, '0')}`;
          const itemsEmail = ventaItems.map(item => {
            const producto = (item['producto'] ?? {}) as Record<string, unknown>;
            return { nombre: String(producto['nombre'] ?? 'Producto'), cantidad: item['cantidad'] as number };
          });

          if (estado_envio === 'en_camino') {
            const direccion = [e['envio_calle'], e['envio_numero'], e['envio_ciudad'], e['envio_provincia']]
              .filter(Boolean).join(', ');
            sendShippingInTransitEmail(emailCliente, {
              nombre_cliente: nombreCliente,
              nro_venta: nroVenta,
              nro_seguimiento: nro_seguimiento ?? null,
              direccion_destino: direccion,
              items: itemsEmail,
            }).catch(err => logger.error('Error enviando email en_camino:', { error: (err as Error).message }));
          } else {
            const fechaEntrega = new Date().toLocaleString('es-AR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            });
            sendShippingDeliveredEmail(emailCliente, {
              nombre_cliente: nombreCliente,
              nro_venta: nroVenta,
              fecha_entrega: fechaEntrega,
              items: itemsEmail,
            }).catch(err => logger.error('Error enviando email entregado:', { error: (err as Error).message }));
          }
        }
      }

      return res.status(200).json({ success: true, mensaje: `Estado actualizado a: ${estado_envio}` });
    } catch (error) {
      logger.error('Error en actualizarEstado (envio):', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default EnvioController;