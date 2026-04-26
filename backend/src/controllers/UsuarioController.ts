import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import Permiso from '../models/Permiso.js';
import { Request, Response } from 'express';
import logger from '../services/loggerService.js';

interface LoginBody { email: string; contrasena: string; }

const _jwtAdminSecret = process.env.JWT_ADMIN_SECRET;
if (!_jwtAdminSecret) throw new Error('JWT_ADMIN_SECRET no está configurado en las variables de entorno');
const JWT_ADMIN_SECRET: string = _jwtAdminSecret;
const JWT_ADMIN_EXPIRES_IN = process.env.JWT_ADMIN_EXPIRES_IN || '8h';

import { UsuarioSistemaResponse, AuthUsuarioResponse, UsuarioJWTPayload } from '../types/usuario.types.js';

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
   * Genera un token JWT para un usuario dado
   * @private
   * @param usuario - Instancia del modelo Usuario
   * @returns Token JWT firmado con estructura estándar JWT
   */
  private static generarTokenJWT(usuario: Usuario): string {
    // Payload con estructura estándar JWT (sub para ID)
    const payload: Omit<UsuarioJWTPayload, 'iat' | 'exp'> = {
      sub: usuario.id_usuario,
      role: usuario.id_rol === ROLES.ADMIN ? 'admin' : 'gerente',
      idRol: usuario.id_rol
    };

    return jwt.sign(
      payload,
      JWT_ADMIN_SECRET,
      { expiresIn: JWT_ADMIN_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  }

  /**
   * Mapea una instancia de Usuario a un objeto de respuesta seguro
   * @private
   * @param usuario - Instancia del modelo Usuario
   * @returns Objeto con datos públicos del usuario
   */
  private static mapearUsuarioResponse(usuario: Usuario, rolNombre?: string): UsuarioSistemaResponse {
    return {
      id: usuario.id_usuario,
      nombres: usuario.nombres,
      email: usuario.email,
      idRol: usuario.id_rol,
      rolNombre: rolNombre || 'Desconocido'
    };
  }

  /**
   * Login de usuario del sistema (admin/empleado)
   *
   * Autentica a un usuario mediante email y contraseña, generando un token JWT
   * que contiene sub (ID), role y idRol para autorización posterior.
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
  static async login(req: Request, res: Response) {
    try {
      const { email, contrasena } = req.body as LoginBody;

      logger.debug('Procesando login de usuario', { email });

      // Validar que se proporcionen las credenciales
      if (!email || !contrasena) {
        logger.warn('Intento de login sin credenciales completas', { email });
        return res.status(400).json({
          mensaje: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario por email con su rol
      const usuario = await Usuario.findOne({
        where: { email },
        include: [{ model: Rol, attributes: ['rol'] }]
      });
      const errorAuth = { mensaje: 'Credenciales inválidas' };

      // Validacion de seguridad: usuario existe
      if (!usuario) {
        logger.warn('Login fallido: Usuario no encontrado', { email });
        return res.status(401).json(errorAuth);
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(contrasena, usuario.password_user);
      if (!passwordValida) {
        logger.warn('Intento de login con contraseña incorrecta', { email });
        return res.status(401).json(errorAuth);
      }

      // Generar token JWT
      const token = this.generarTokenJWT(usuario);

      // Registrar fecha/hora del último login
      await usuario.update({ fyh_ultimo_login: new Date() });

      // Obtener permisos del usuario
      let permisos: string[] = [];
      
      if (usuario.id_rol === ROLES.ADMIN) {
        // ADMIN tiene todos los permisos
        const todosPermisos = await Permiso.findAll({ attributes: ['nombre'] });
        permisos = todosPermisos.map(p => p.nombre);
      } else {
        // Otros roles obtienen permisos de su rol
        const rol = await Rol.findByPk(usuario.id_rol, {
          include: [{
            model: Permiso,
            as: 'permisos',
            attributes: ['nombre'],
            through: { attributes: [] }
          }]
        });
        permisos = (rol as unknown as { permisos?: { nombre: string }[] })?.permisos?.map(p => p.nombre) || [];
      }

      // Responder con token y datos del usuario
      const rolNombre = (usuario as any).Rol?.rol || 'Desconocido';
      const response: AuthUsuarioResponse = {
        token,
        usuario: {
          ...this.mapearUsuarioResponse(usuario, rolNombre),
          permisos
        }
      };

      res.json(response);

      logger.info('Login de usuario exitoso', { email: usuario.email, id_rol: usuario.id_rol })
    } catch (error) {
      logger.error('Error crítico en login de usuario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({mensaje: 'Error al procesar el login'});
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
  static async getMe(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        return res.status(401).json({mensaje: 'No autenticado'});
      }

      // Buscar usuario en la base de datos con su rol
      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{ model: Rol, attributes: ['rol'] }]
      });

      if (!usuario) {
        return res.status(404).json({mensaje: 'Usuario no encontrado'});
      }

      // Obtener permisos del usuario
      let permisos: string[] = [];
      if (usuario.id_rol === ROLES.ADMIN) {
        const todosPermisos = await Permiso.findAll({ attributes: ['nombre'] });
        permisos = todosPermisos.map(p => p.nombre);
      } else {
        const rol = await Rol.findByPk(usuario.id_rol, {
          include: [{
            model: Permiso,
            as: 'permisos',
            attributes: ['nombre'],
            through: { attributes: [] }
          }]
        });
        permisos = (rol as unknown as { permisos?: { nombre: string }[] })?.permisos?.map(p => p.nombre) || [];
      }

      const rolNombre = (usuario as any).Rol?.rol || 'Desconocido';
      res.json({
        ...this.mapearUsuarioResponse(usuario, rolNombre),
        permisos
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

export default UsuarioController;