/**
 * Middleware de autenticación y autorización para la aplicación Tecnocel
 * Este archivo contiene las funciones necesarias para verificar tokens JWT y roles de usuario
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import logger from '../utils/logger.js';
import Cliente from '../models/Cliente.js';

// Clave secreta para firmar y verificar tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

/**
 * Interfaz que define la estructura del payload del token JWT
 */
export interface TokenPayload {
  id_usuario: number;
  email: string;
  id_rol: number;
}

/**
 * Extensión de la interfaz Request de Express para incluir el usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      usuario?: any;
    }
  }
}

/**
 * Middleware para verificar la autenticación mediante token JWT
 * @param req - Objeto Request de Express
 * @param res - Objeto Response de Express
 * @param next - Función Next de Express
 * @returns void
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
 * Middleware para verificar los roles de usuario
 * @param roles - Array de roles permitidos para acceder a la ruta
 * @returns Middleware que verifica si el usuario tiene el rol adecuado
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
 * Middleware para verificar la autenticación de clientes mediante token JWT
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
