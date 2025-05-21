import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Usuario, { RolUsuario } from '../models/Usuario.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

export interface TokenPayload {
  id: number;
  email: string;
  rol: RolUsuario;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: any;
    }
  }
}

export const verificarToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const decodificado = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Buscar el usuario en la base de datos
    const usuario = await Usuario.findByPk(decodificado.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      telefono: usuario.telefono
    };
    next();
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
};

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
