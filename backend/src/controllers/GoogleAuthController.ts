import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import Cliente from '../models/Cliente.js';
import logger from '../services/loggerService.js';
import { ClienteResponse, AuthResponse } from '../types/cliente.types.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Controlador para autenticación con Google OAuth 2.0
 *
 * Maneja el flujo de login social con Google permitiendo a los usuarios:
 * - Autenticarse usando su cuenta de Google
 * - Crear cuenta automáticamente si es primera vez
 * - Vincular cuenta Google con cuenta existente por email
 * - Obtener JWT para acceso a la aplicación
 *
 * Usa Google OAuth 2.0 con access tokens del frontend.
 *
 * @class GoogleAuthController
 */
export default class GoogleAuthController {
  /**
   * Mapea el modelo Cliente a la estructura de respuesta API
   *
   * @private
   * @param cliente - Instancia del modelo Cliente de Sequelize
   * @returns Objeto con estructura limpia para la respuesta API
   */
  private static mapearClienteRespuesta(cliente: Cliente): ClienteResponse {
    return {
      id: cliente.id_cliente,
      nombre: cliente.nombre_cliente,
      apellido: cliente.apellido_cliente,
      email: cliente.email_cliente,
      celular: cliente.celular_cliente,
      nitCi: cliente.nit_ci_cliente
    };
  }

  /**
   * Autentica un cliente usando Google OAuth 2.0
   *
   * Flujo completo de autenticación social:
   * 1. Recibe access_token de Google desde el frontend
   * 2. Consulta API de Google (userinfo) para obtener datos del usuario
   * 3. Busca cliente existente por google_id o email
   * 4. Si no existe, crea nuevo cliente con datos de Google
   * 5. Si existe por email pero sin google_id, vincula la cuenta
   * 6. Genera JWT de la aplicación (válido 7 días)
   * 7. Actualiza fecha de último login
   *
   * NOTA: Los clientes creados vía Google tienen email_verified=true automáticamente
   * y reciben valores temporales para campos obligatorios (celular, nit_ci).
   *
   * @param req - Express Request con body.access_token de Google
   * @param req.body.access_token - Access token de Google OAuth (requerido)
   * @param res - Express Response object
   * @returns 200 con { token, cliente } si la autenticación es exitosa
   * @returns 400 si falta el access_token o el email no está disponible
   * @returns 401 si el token de Google es inválido o expiró
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/clientes/google-login
   * Body: {
   *   "access_token": "ya29.a0AfH6SMBx..."
   * }
   *
   * Response 200: {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "cliente": {
   *     "id_cliente": 10,
   *     "nombre_cliente": "Juan",
   *     "apellido_cliente": "Pérez",
   *     "email_cliente": "juan@gmail.com",
   *     "celular_cliente": "000000000",
   *     "nit_ci_cliente": "GOOGLE_12345678"
   *   }
   * }
   */
  static async googleLogin(req: Request, res: Response) {
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        logger.warn('Google login fallido: token de acceso faltante');
        return res.status(400).json({ mensaje: 'Token de acceso requerido' });
      }

      // Usar el access token para obtener información del usuario
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (!userInfoResponse.ok) {
        logger.warn('Google login fallido: no se pudo obtener información del usuario');
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
      }

      const userInfo = await userInfoResponse.json();
      const { id: googleId, email, given_name, family_name } = userInfo;

      if (!email) {
        logger.warn('Google login fallido: email no disponible en respuesta');
        return res.status(400).json({ mensaje: 'Email no disponible' });
      }

      logger.info('Procesando login de Google', {
        email: email,
        googleId: googleId
      });

      // Buscar cliente existente por Google ID o email
      let cliente = await Cliente.findOne({ 
        where: { 
          [Op.or]: [
            { google_id: googleId },
            { email_cliente: email, is_web_enabled: true }
          ]
        }
      });

      if (!cliente) {
        // Crear nuevo cliente con datos de Google
        logger.info('Creando nuevo cliente con Google', { email: email });
        cliente = await Cliente.create({
          nombre_cliente: given_name || 'Usuario',
          apellido_cliente: family_name || 'Google',
          email_cliente: email,
          nit_ci_cliente: `GOOGLE_${googleId}`, // Identificador temporal
          celular_cliente: '000000000', // Valor temporal
          is_web_enabled: true,
          email_verified: true, // Google ya verifica el email
          google_id: googleId,
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
        });
        logger.info('Cliente creado exitosamente con Google', {
          id: cliente.id_cliente,
          email: cliente.email_cliente
        });
      } else {
        // Actualizar Google ID si no existe
        if (!cliente.google_id) {
          logger.info('Vinculando cliente existente con Google', {
            id: cliente.id_cliente,
            googleId: googleId
          });
          cliente.google_id = googleId;
          await cliente.save();
        }
      }

      // Generar JWT con estructura estándar (igual que ClienteController)
      const token = jwt.sign(
        { sub: cliente.id_cliente, role: 'cliente' },
        process.env.JWT_SECRET || 'tu_clave_secreta',
        { expiresIn: '7d' }
      );

      // Actualizar último login
      cliente.last_login = new Date();
      await cliente.save();

      logger.info('Login exitoso con Google', {
        id: cliente.id_cliente,
        email: cliente.email_cliente
      });

      const respuesta: AuthResponse = {
        token,
        cliente: GoogleAuthController.mapearClienteRespuesta(cliente)
      };

      return res.json(respuesta);

    } catch (error) {
      logger.error('Error en Google login:', error);
      return res.status(500).json({ 
        mensaje: 'Error en autenticación con Google',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
} 