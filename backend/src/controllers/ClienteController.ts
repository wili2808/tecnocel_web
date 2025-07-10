import { Request, Response } from 'express';
import Cliente from '../models/Cliente.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/emailService.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';
const JWT_EXPIRES_IN = '7d';

export default class ClienteController {
  /**
   * Registro de cliente
   */
  static async register(req: Request, res: Response) {
    try {
      logger.info('Intentando registrar cliente', req.body);
      const { nombre_cliente, apellido_cliente, email_cliente, celular_cliente, nit_ci_cliente, contrasena } = req.body;
      // Validaciones básicas
      if (!nombre_cliente || !apellido_cliente || !email_cliente || !celular_cliente || !nit_ci_cliente || !contrasena) {
        logger.warn('Registro fallido: campos obligatorios faltantes');
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
      }
      // Verificar si el email ya está registrado y habilitado para web
      const existente = await Cliente.findOne({ where: { email_cliente, is_web_enabled: true } });
      if (existente) {
        logger.warn(`Registro fallido: correo ya registrado (${email_cliente})`);
        return res.status(409).json({ mensaje: 'El correo ya está registrado' });
      }
      // Hashear contraseña
      const password_hash = await bcrypt.hash(contrasena, 10);
      // Crear cliente
      const cliente = await Cliente.create({
        nombre_cliente,
        apellido_cliente,
        email_cliente,
        celular_cliente,
        nit_ci_cliente,
        password_hash,
        is_web_enabled: true,
        email_verified: true, // Marcar como verificado automáticamente para login inmediato
        verification_token: null, // No necesitamos token de verificación para login automático
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });
      logger.info(`Cliente registrado exitosamente: ${cliente.email_cliente}`);
      
      // Generar JWT para login automático
      const token = jwt.sign({ id_cliente: cliente.id_cliente, email: cliente.email_cliente }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      
      // Actualizar último login
      cliente.last_login = new Date();
      await cliente.save();
      
      // Opcional: Enviar email de bienvenida en lugar de verificación
      // await sendWelcomeEmail(cliente.email_cliente, cliente.nombre_cliente);
      
              return res.status(201).json({ 
          mensaje: 'Registro exitoso. ¡Bienvenido a TecnoCell!',
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
      logger.error('Error en el registro de cliente', { error });
      return res.status(500).json({ mensaje: 'Error en el registro', error });
    }
  }

  /**
   * Verificación de email
   */
  static async verifyEmail(req: Request, res: Response) {
    try {
      logger.info('Intentando verificar email', req.query);
      const { token } = req.query;
      if (!token) {
        logger.warn('Verificación fallida: token no proporcionado');
        return res.status(400).json({ mensaje: 'Token no proporcionado' });
      }
      const cliente = await Cliente.findOne({ where: { verification_token: token } });
      if (!cliente) {
        logger.warn('Verificación fallida: token inválido o expirado');
        return res.status(400).json({ mensaje: 'Token inválido o expirado' });
      }
      cliente.email_verified = true;
      cliente.verification_token = null;
      cliente.is_web_enabled = true;
      cliente.fyh_actualizacion = new Date();
      await cliente.save();
      logger.info(`Email verificado correctamente para: ${cliente.email_cliente}`);
      return res.json({ mensaje: 'Email verificado correctamente. Ya puedes iniciar sesión.' });
    } catch (error) {
      logger.error('Error al verificar email', { error });
      return res.status(500).json({ mensaje: 'Error al verificar email', error });
    }
  }

  /**
   * Login de cliente
   */
  static async login(req: Request, res: Response) {
    try {
      logger.info('Intentando login de cliente', req.body);
      const { email_cliente, contrasena } = req.body;
      if (!email_cliente || !contrasena) {
        logger.warn('Login fallido: email o contraseña faltantes');
        return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
      }
      const cliente = await Cliente.findOne({ where: { email_cliente, is_web_enabled: true } });
      if (!cliente) {
        logger.warn(`Login fallido: cliente no encontrado (${email_cliente})`);
        return res.status(404).json({ mensaje: 'Cliente no encontrado o no habilitado para web' });
      }
      if (!cliente.password_hash) {
        logger.warn(`Login fallido: contraseña no establecida (${email_cliente})`);
        return res.status(403).json({ mensaje: 'Debes establecer una contraseña para acceder' });
      }
      const passwordValida = await bcrypt.compare(contrasena, cliente.password_hash);
      if (!passwordValida) {
        logger.warn(`Login fallido: contraseña incorrecta (${email_cliente})`);
        return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
      }
      // Generar JWT
      const token = jwt.sign({ id_cliente: cliente.id_cliente, email: cliente.email_cliente }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      cliente.last_login = new Date();
      await cliente.save();
      logger.info(`Login exitoso para: ${cliente.email_cliente}`);
      return res.json({ token, cliente: { id_cliente: cliente.id_cliente, nombre_cliente: cliente.nombre_cliente, apellido_cliente: cliente.apellido_cliente, email_cliente: cliente.email_cliente } });
    } catch (error) {
      logger.error('Error en el login de cliente', { error });
      return res.status(500).json({ mensaje: 'Error en el login', error });
    }
  }

  /**
   * Solicitud de recuperación de contraseña
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      logger.info('Solicitud de recuperación de contraseña', req.body);
      const { email_cliente } = req.body;
      if (!email_cliente) {
        logger.warn('Recuperación fallida: email no proporcionado');
        return res.status(400).json({ mensaje: 'Email es obligatorio' });
      }
      const cliente = await Cliente.findOne({ where: { email_cliente, is_web_enabled: true } });
      if (!cliente) {
        logger.warn(`Recuperación fallida: cliente no encontrado (${email_cliente})`);
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }
      const reset_token = uuidv4();
      const reset_token_expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
      cliente.reset_token = reset_token;
      cliente.reset_token_expires = reset_token_expires;
      await cliente.save();
      await sendResetPasswordEmail(cliente.email_cliente, reset_token);
      logger.info(`Solicitud de recuperación enviada a: ${cliente.email_cliente}`);
      return res.json({ mensaje: 'Se ha enviado un correo para restablecer la contraseña' });
    } catch (error) {
      logger.error('Error al solicitar recuperación de contraseña', { error });
      return res.status(500).json({ mensaje: 'Error al solicitar recuperación', error });
    }
  }

  /**
   * Restablecimiento de contraseña
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      logger.info('Intentando restablecer contraseña', req.body);
      const { reset_token, nueva_contrasena } = req.body;
      if (!reset_token || !nueva_contrasena) {
        logger.warn('Restablecimiento fallido: datos incompletos');
        return res.status(400).json({ mensaje: 'Datos incompletos' });
      }
      const cliente = await Cliente.findOne({ where: { reset_token } });
      if (!cliente || !cliente.reset_token_expires || cliente.reset_token_expires < new Date()) {
        logger.warn('Restablecimiento fallido: token inválido o expirado');
        return res.status(400).json({ mensaje: 'Token inválido o expirado' });
      }
      cliente.password_hash = await bcrypt.hash(nueva_contrasena, 10);
      cliente.reset_token = null;
      cliente.reset_token_expires = null;
      cliente.is_web_enabled = true;
      cliente.fyh_actualizacion = new Date();
      await cliente.save();
      logger.info(`Contraseña restablecida correctamente para: ${cliente.email_cliente}`);
      return res.json({ mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
    } catch (error) {
      logger.error('Error al restablecer contraseña', { error });
      return res.status(500).json({ mensaje: 'Error al restablecer contraseña', error });
    }
  }

  /**
   * Verificación de token JWT para mantener sesión activa
   */
  static async verifyToken(req: Request, res: Response) {
    try {
      logger.info('Llamada a verifyToken iniciada');
      // El middleware verificarTokenCliente ya validó el token y añadió el usuario a req.usuario
      const cliente = req.usuario;
      
      if (!cliente) {
        logger.warn('Verificación fallida: datos de cliente no encontrados en request');
        return res.status(401).json({ mensaje: 'Token inválido' });
      }

      // Buscar datos completos del cliente en la base de datos para asegurar que sigue activo
      const clienteCompleto = await Cliente.findOne({ 
        where: { 
          id_cliente: cliente.id_cliente,
          is_web_enabled: true,
          email_verified: true 
        } 
      });

      if (!clienteCompleto) {
        logger.warn(`Verificación fallida: cliente no encontrado o deshabilitado (${cliente.id_cliente})`);
        return res.status(403).json({ mensaje: 'Cliente no encontrado o no habilitado' });
      }

      logger.info(`Token verificado exitosamente para: ${clienteCompleto.email_cliente}`);
      
      return res.json({ 
        cliente: { 
          id_cliente: clienteCompleto.id_cliente, 
          nombre_cliente: clienteCompleto.nombre_cliente,
          apellido_cliente: clienteCompleto.apellido_cliente,
          email_cliente: clienteCompleto.email_cliente,
          celular_cliente: clienteCompleto.celular_cliente,
          nit_ci_cliente: clienteCompleto.nit_ci_cliente
        } 
      });
    } catch (error) {
      logger.error('Error al verificar token de cliente', { error });
      return res.status(500).json({ mensaje: 'Error al verificar token', error });
    }
  }
} 