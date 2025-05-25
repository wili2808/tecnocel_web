/**
 * Middleware de autenticación y autorización para la aplicación MacWil
 * Este archivo contiene las funciones necesarias para verificar tokens JWT y roles de usuario
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Usuario, { RolUsuario } from '../models/Usuario.js';
import logger from '../utils/logger.js';

// Clave secreta para firmar y verificar tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

/**
 * Interfaz que define la estructura del payload del token JWT
 */
export interface TokenPayload {
  id: number;
  email: string;
  rol: RolUsuario;
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
    const usuario = await Usuario.findByPk(decodificado.id);

    if (!usuario) {
      logger.warn('Token válido pero usuario no encontrado', { userId: decodificado.id });
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Adjuntar información del usuario al objeto request
    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      telefono: usuario.telefono
    };
    
    logger.debug('Token verificado exitosamente', { 
      userId: usuario.id,
      email: usuario.email,
      path: req.path
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
export const verificarRol = (roles: RolUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'Acceso no autorizado' });
    }

    next();
  };
};
