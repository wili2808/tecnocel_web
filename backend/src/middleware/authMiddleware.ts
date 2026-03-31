/**
 * @file Middleware de autenticación y autorización JWT
 *
 * Proporciona middleware para proteger rutas y verificar autenticación mediante
 * tokens JWT (JSON Web Tokens). Soporta autenticación dual:
 * - Usuarios del sistema (administradores, empleados)
 * - Clientes web (usuarios finales de la tienda)
 *
 * Todos los middleware verifican tokens en el header Authorization: "Bearer <token>"
 * y adjuntan información del usuario/cliente a req.usuario para uso posterior.
 *
 * @module authMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../services/loggerService.js';
import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';
import Rol from '../models/Rol.js';
import Permiso from '../models/Permiso.js';
import { UsuarioSession } from '../types/express.js';
import { UsuarioJWTPayload } from '../types/usuario.types.js';
import { ClienteJWTPayload } from '../types/cliente.types.js';
import { ROLES } from '../constants/roles.js';

/**
 * Type guard para verificar si req.usuario es un UsuarioSession (admin/empleado)
 * @param usuario - El objeto usuario a verificar
 * @returns true si es UsuarioSession, false si es ClienteSession
 */
function esUsuarioSistema(usuario: unknown): usuario is UsuarioSession {
  return usuario !== null && typeof usuario === 'object' && 'idRol' in usuario;
}

/**
 * Clave secreta para firmar y verificar tokens JWT
 * Debe configurarse en variable de entorno JWT_SECRET
 * @private
 */
const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) throw new Error('JWT_SECRET no está configurado en las variables de entorno');
const JWT_SECRET: string = _jwtSecret;

const _jwtAdminSecret = process.env.JWT_ADMIN_SECRET;
if (!_jwtAdminSecret) throw new Error('JWT_ADMIN_SECRET no está configurado en las variables de entorno');
const JWT_ADMIN_SECRET: string = _jwtAdminSecret;

/**
 * Middleware para verificar autenticación de usuarios del sistema vía JWT
 *
 * Verifica el token JWT en el header Authorization y valida que:
 * - El token sea válido y no haya expirado
 * - El usuario existe en la base de datos
 * - Adjunta información del usuario a req.usuario para uso en controladores
 *
 * @async
 * @param req - Express Request con header Authorization: "Bearer <token>"
 * @param res - Express Response object
 * @param next - Express NextFunction para continuar al siguiente middleware
 * @returns {void}
 * @returns 401 si el token no se proporciona o es inválido
 * @returns 404 si el token es válido pero el usuario no existe
 *
 * @example
 * // En rutas protegidas
 * router.get('/admin/users', verificarToken, verificarRol([1]), obtenerUsuarios);
 *
 * // En controladores, acceder a req.usuario
 * const userId = req.usuario.id;
 * const userRole = req.usuario.idRol;
 */
export const verificarToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extraer el token del header de autorización
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Intento de acceso sin token', { path: req.path, method: req.method });
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    // Verificar y decodificar el token (usa tipo centralizado)
    const decodificado = jwt.verify(token, JWT_ADMIN_SECRET) as unknown as UsuarioJWTPayload;

    // Buscar el usuario en la base de datos usando 'sub' (estándar JWT)
    const usuario = await Usuario.findByPk(decodificado.sub);

    if (!usuario) {
      logger.warn('Token válido pero usuario no encontrado', { userId: decodificado.sub });
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Adjuntar información del usuario al objeto request (formato limpio)
    req.usuario = {
      id: usuario.id_usuario,
      nombres: usuario.nombres,
      email: usuario.email,
      idRol: usuario.id_rol
    };
    
    logger.debug('Token verificado exitosamente', { 
      userId: usuario.id_usuario,
      email: usuario.email
    });
    
    next();
  } catch (error) {
    logger.error('Error al verificar token:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      path: req.path,
      method: req.method
    });
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
};

/**
 * Middleware para verificar autenticación de clientes web vía JWT
 *
 * Similar a verificarToken pero específico para clientes (usuarios finales de la tienda).
 * Verifica que:
 * - El token JWT sea válido
 * - El cliente existe en la base de datos
 * - El cliente tiene acceso web habilitado (is_web_enabled=true)
 * - El cliente ha verificado su email (email_verified=true)
 *
 * Adjunta información del cliente a req.usuario con estructura diferente a usuarios del sistema.
 *
 * @async
 * @param req - Express Request con header Authorization: "Bearer <token>"
 * @param res - Express Response object
 * @param next - Express NextFunction para continuar al siguiente middleware
 * @returns 401 si el token no se proporciona o es inválido
 * @returns 403 si el cliente no está habilitado o email no verificado
 *
 * @example
 * // En rutas de clientes
 * router.post('/carrito/items', verificarTokenCliente, agregarItemCarrito);
 * router.get('/mis-pedidos', verificarTokenCliente, obtenerPedidos);
 *
 * // En controladores
 * const clienteId = req.usuario.id;
 * const nombreCliente = req.usuario.nombre;
 */
export const verificarTokenCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn('Intento de acceso cliente sin token', { path: req.path, method: req.method });
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    // Decodificar token usando tipo centralizado
    const decodificado = jwt.verify(token, JWT_SECRET) as unknown as ClienteJWTPayload;

    const cliente = await Cliente.findByPk(decodificado.sub);

    if (!cliente || !cliente.is_web_enabled || !cliente.email_verified) {
      logger.warn('Token válido pero cliente no habilitado o no verificado', { id_cliente: decodificado.sub });
      return res.status(403).json({ mensaje: 'Cliente no habilitado o email no verificado' });
    }

    // Adjuntar información del cliente usando estructura limpia (camelCase)
    req.usuario = {
      id: cliente.id_cliente,
      nombre: cliente.nombre_cliente,
      email: cliente.email_cliente
    };

    logger.debug('Token de cliente verificado exitosamente', {
      id_cliente: cliente.id_cliente,
      email: cliente.email_cliente
    });

    next();
  } catch (error) {
    logger.error('Error al verificar token de cliente:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      path: req.path,
      method: req.method
    });
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
};

/**
 * Factory de middleware para verificar autorización basada en roles
 *
 * Crea un middleware que verifica si el usuario autenticado tiene uno de los
 * roles permitidos. Debe usarse después de verificarToken.
 *
 * Roles comunes del sistema:
 * - 1: Administrador (acceso total)
 * - 2: Empleado (acceso limitado)
 *
 * @param roles - Array de IDs de roles permitidos para acceder a la ruta
 * @returns Middleware function que verifica autorización
 * @returns 401 si el usuario no está autenticado
 * @returns 403 si el usuario no tiene rol autorizado
 *
 * @example
 * // Solo administradores
 * router.delete('/productos/:id', verificarToken, verificarRol([1]), eliminarProducto);
 *
 * // Administradores y empleados
 * router.get('/ventas', verificarToken, verificarRol([1, 2]), obtenerVentas);
 */
export const verificarRol = (roles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    // Verificar que sea un usuario del sistema (no cliente) y tenga el rol requerido
    if (!esUsuarioSistema(req.usuario)) {
      return res.status(403).json({ mensaje: 'Acceso no autorizado para clientes' });
    }

    if (!roles.includes(req.usuario.idRol)) {
      return res.status(403).json({ mensaje: 'Acceso no autorizado' });
    }

    next();
  };
};

export const verificarPermiso = (nombrePermiso: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuarioSistema = req.usuario && esUsuarioSistema(req.usuario) ? req.usuario : null;

      if (!req.usuario) {
        return res.status(401).json({ mensaje: 'Usuario no autenticado' });
      }

      if (!usuarioSistema) {
        return res.status(403).json({ mensaje: 'Acceso no autorizado para clientes' });
      }

      if (usuarioSistema.idRol === ROLES.ADMIN) {
        return next();
      }

      const usuario = await Usuario.findByPk(usuarioSistema.id, {
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

      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      const rol = (usuario as unknown as { Rol?: Rol & { permisos?: Permiso[] } }).Rol;
      const tienePermiso = rol?.permisos && rol.permisos.length > 0;

      if (!tienePermiso) {
        logger.warn(`Permiso denegado: ${nombrePermiso}`, {
          usuarioId: usuario.id_usuario,
          rolId: usuario.id_rol
        });
        return res.status(403).json({
          mensaje: `No tienes permiso para realizar esta acción: ${nombrePermiso}`
        });
      }

      next();
    } catch (error) {
      logger.error('Error en verificarPermiso:', error);
      return res.status(500).json({ mensaje: 'Error al verificar permisos' });
    }
  };
};

export const verificarCualquierPermiso = (nombresPermisos: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ mensaje: 'Usuario no autenticado' });
      }

      if (!esUsuarioSistema(req.usuario)) {
        return res.status(403).json({ mensaje: 'Acceso no autorizado para clientes' });
      }

      if (req.usuario.idRol === ROLES.ADMIN) {
        return next();
      }

      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{
          model: Rol,
          as: 'Rol',
          include: [{
            model: Permiso,
            as: 'permisos',
            where: { nombre: nombresPermisos },
            required: false
          }]
        }]
      });

      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      const rol = (usuario as unknown as { Rol?: Rol & { permisos?: Permiso[] } }).Rol;
      const tieneAlgunPermiso = rol?.permisos && rol.permisos.length > 0;

      if (!tieneAlgunPermiso) {
        return res.status(403).json({
          mensaje: `No tienes ninguno de los permisos requeridos`
        });
      }

      next();
    } catch (error) {
      logger.error('Error en verificarCualquierPermiso:', error);
      return res.status(500).json({ mensaje: 'Error al verificar permisos' });
    }
  };
};

