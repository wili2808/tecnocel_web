/**
 * @file Controlador de gestión de usuarios del sistema
 *
 * Maneja las operaciones de autenticación y gestión de usuarios administradores
 * y empleados del sistema (no confundir con clientes de la tienda web).
 *
 * @module UsuarioController
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import logger from '../services/loggerService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

/**
 * Controlador para gestión de usuarios del sistema
 *
 * Proporciona endpoints para:
 * - Login de usuarios/administradores
 * - Obtener información del usuario autenticado
 *
 * @class UsuarioController
 */
class UsuarioController {

  /**
   * Login de usuario del sistema (admin/empleado)
   *
   * Autentica a un usuario mediante email y contraseña, generando un token JWT
   * que contiene id_usuario, email e id_rol para autorización posterior.
   *
   * El token generado debe enviarse en requests subsecuentes como:
   * Authorization: Bearer <token>
   *
   * @async
   * @param req - Express Request con body { email, contrasena }
   * @param req.body.email - Email del usuario registrado en el sistema
   * @param req.body.contrasena - Contraseña del usuario (se verifica con bcrypt)
   * @param res - Express Response object
   * @returns 200 con { token, usuario } si login es exitoso
   * @returns 400 si faltan credenciales
   * @returns 401 si las credenciales son inválidas
   * @returns 500 si ocurre un error en el servidor
   *
   * @example
   * POST /api/usuarios/login
   * Body: {
   *   "email": "admin@tecnocel.com",
   *   "contrasena": "admin123"
   * }
   *
   * Response: {
   *   "token": "eyJhbGciOiJIUzI1NiIs...",
   *   "usuario": {
   *     "id_usuario": 1,
   *     "nombres": "Administrador",
   *     "email": "admin@tecnocel.com",
   *     "id_rol": 1
   *   }
   * }
   */
  async login(req: Request, res: Response) {
    try {
      const { email, contrasena } = req.body;

      // Validar que se proporcionen las credenciales
      if (!email || !contrasena) {
        logger.warn('Intento de login sin credenciales completas', { email });
        return res.status(400).json({
          mensaje: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario por email
      const usuario = await Usuario.findOne({
        where: { email }
      });

      if (!usuario) {
        logger.warn('Intento de login con email no registrado', { email });
        return res.status(401).json({
          mensaje: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(contrasena, usuario.password_user);

      if (!passwordValida) {
        logger.warn('Intento de login con contraseña incorrecta', {
          email,
          id_usuario: usuario.id_usuario
        });
        return res.status(401).json({
          mensaje: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id_usuario: usuario.id_usuario,
          email: usuario.email,
          id_rol: usuario.id_rol
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      logger.info('Login de usuario exitoso', {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        id_rol: usuario.id_rol
      });

      // Responder con token y datos del usuario
      res.json({
        token,
        usuario: {
          id_usuario: usuario.id_usuario,
          nombres: usuario.nombres,
          email: usuario.email,
          id_rol: usuario.id_rol
        }
      });

    } catch (error) {
      logger.error('Error en login de usuario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        mensaje: 'Error al procesar el login'
      });
    }
  }

  /**
   * Obtener información del usuario autenticado
   *
   * Retorna los datos del usuario basándose en el token JWT proporcionado.
   * Requiere middleware verificarToken antes de llamar a este método.
   *
   * @async
   * @param req - Express Request con req.usuario adjuntado por middleware
   * @param res - Express Response object
   * @returns 200 con datos del usuario autenticado
   * @returns 401 si no hay autenticación
   * @returns 404 si el usuario no existe
   * @returns 500 si ocurre un error
   *
   * @example
   * GET /api/usuarios/me
   * Headers: { Authorization: "Bearer eyJhbG..." }
   *
   * Response: {
   *   "id_usuario": 1,
   *   "nombres": "Administrador",
   *   "email": "admin@tecnocel.com",
   *   "id_rol": 1
   * }
   */
  async getMe(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          mensaje: 'No autenticado'
        });
      }

      const usuario = await Usuario.findByPk(req.usuario.id_usuario);

      if (!usuario) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      res.json({
        id_usuario: usuario.id_usuario,
        nombres: usuario.nombres,
        email: usuario.email,
        id_rol: usuario.id_rol
      });

    } catch (error) {
      logger.error('Error al obtener datos del usuario:', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({
        mensaje: 'Error al obtener datos del usuario'
      });
    }
  }
}

export default new UsuarioController();
