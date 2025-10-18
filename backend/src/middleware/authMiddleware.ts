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
import Usuario from '../models/Usuario.js';
import logger from '../services/loggerService.js';
import Cliente from '../models/Cliente.js';

/**
 * Clave secreta para firmar y verificar tokens JWT
 * Debe configurarse en variable de entorno JWT_SECRET
 * @private
 */
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

/**
 * Estructura del payload decodificado del token JWT para usuarios del sistema
 *
 * @interface TokenPayload
 * @property {number} id_usuario - ID único del usuario
 * @property {string} email - Email del usuario
 * @property {number} id_rol - ID del rol (1=admin, 2=empleado, etc.)
 */
export interface TokenPayload {
  id_usuario: number;
  email: string;
  id_rol: number;
}

/**
 * Extensión de la interfaz Request de Express para incluir datos de autenticación
 *
 * Agrega propiedad `usuario` al objeto Request que contiene información del
 * usuario/cliente autenticado después de pasar por middleware de autenticación.
 */
declare global {
  namespace Express {
    interface Request {
      usuario?: any;
    }
  }
}

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
 * const userId = req.usuario.id_usuario;
 * const userRole = req.usuario.id_rol;
 */
export const verificarToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extraer el token del header de autorización
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Intento de acceso sin token', { path: req.path, method: req.method });
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    // Verificar y decodificar el token
    const decodificado = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Buscar el usuario en la base de datos
    const usuario = await Usuario.findByPk(decodificado.id_usuario);

    if (!usuario) {
      logger.warn('Token válido pero usuario no encontrado', { userId: decodificado.id_usuario });
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Adjuntar información del usuario al objeto request
    req.usuario = {
      id_usuario: usuario.id_usuario,
      nombres: usuario.nombres,
      email: usuario.email,
      id_rol: usuario.id_rol
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

    if (!roles.includes(req.usuario.id_rol)) {
      return res.status(403).json({ mensaje: 'Acceso no autorizado' });
    }

    next();
  };
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
 * const clienteId = req.usuario.id_cliente;
 * const nombreCliente = req.usuario.nombre_cliente;
 */
export const verificarTokenCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn('Intento de acceso cliente sin token', { path: req.path, method: req.method });
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }
    const decodificado = jwt.verify(token, JWT_SECRET) as { id_cliente: number; email: string };
    const cliente = await Cliente.findByPk(decodificado.id_cliente);
    if (!cliente || !cliente.is_web_enabled || !cliente.email_verified) {
      logger.warn('Token válido pero cliente no habilitado o no verificado', { id_cliente: decodificado.id_cliente });
      return res.status(403).json({ mensaje: 'Cliente no habilitado o email no verificado' });
    }
    req.usuario = {
      id_cliente: cliente.id_cliente,
      nombre_cliente: cliente.nombre_cliente,
      email_cliente: cliente.email_cliente
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
