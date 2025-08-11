import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import Cliente from '../models/Cliente.js';
import logger from '../services/loggerService.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default class GoogleAuthController {
  /**
   * Autenticación con Google OAuth
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

      // Generar JWT
      const token = jwt.sign(
        { id_cliente: cliente.id_cliente, email: cliente.email_cliente },
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

      return res.json({
        token,
        cliente: {
          id_cliente: cliente.id_cliente,
          nombre_cliente: cliente.nombre_cliente,
          apellido_cliente: cliente.apellido_cliente,
          email_cliente: cliente.email_cliente,
          celular_cliente: cliente.celular_cliente,
          nit_ci_cliente: cliente.nit_ci_cliente
        }
      });

    } catch (error) {
      logger.error('Error en Google login:', error);
      return res.status(500).json({ 
        mensaje: 'Error en autenticación con Google',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
} 