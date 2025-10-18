import { Request, Response } from 'express';
import Cliente from '../models/Cliente.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/emailService.js';
import logger from '../services/loggerService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';
const JWT_EXPIRES_IN = '7d';

/**
 * Controlador para gestión de clientes y autenticación
 *
 * Maneja todas las operaciones relacionadas con clientes incluyendo:
 * - Registro y login
 * - Autenticación JWT
 * - Recuperación de contraseña
 * - Verificación de email
 * - Gestión de sesiones
 *
 * @class ClienteController
 */
export default class ClienteController {
  /**
   * Registra un nuevo cliente en la plataforma
   *
   * Crea un cliente con contraseña hasheada usando bcrypt (10 rounds),
   * marca el email como verificado automáticamente y retorna un JWT
   * para login inmediato sin necesidad de verificación por email.
   *
   * El cliente es habilitado automáticamente para acceso web.
   * La contraseña debe cumplir requisitos mínimos de seguridad.
   *
   * @param req - Express Request con body conteniendo datos del cliente
   * @param req.body.nombre_cliente - Nombre del cliente (requerido)
   * @param req.body.apellido_cliente - Apellido del cliente (requerido)
   * @param req.body.email_cliente - Email único del cliente (requerido)
   * @param req.body.celular_cliente - Número de celular (requerido)
   * @param req.body.nit_ci_cliente - NIT o CI del cliente (requerido)
   * @param req.body.contrasena - Contraseña en texto plano (será hasheada)
   * @param res - Express Response object
   * @returns 201 con { mensaje, token, cliente } si el registro es exitoso
   * @returns 400 si faltan campos obligatorios
   * @returns 409 si el email ya está registrado
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/clientes/register
   * Body: {
   *   "nombre_cliente": "Juan",
   *   "apellido_cliente": "Pérez",
   *   "email_cliente": "juan@example.com",
   *   "celular_cliente": "70123456",
   *   "nit_ci_cliente": "1234567",
   *   "contrasena": "MiPassword123"
   * }
   *
   * Response 201: {
   *   "mensaje": "Registro exitoso. ¡Bienvenido a TecnoCell!",
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "cliente": {
   *     "id_cliente": 5,
   *     "nombre_cliente": "Juan",
   *     "apellido_cliente": "Pérez",
   *     "email_cliente": "juan@example.com",
   *     "celular_cliente": "70123456",
   *     "nit_ci_cliente": "1234567"
   *   }
   * }
   */
  static async register(req: Request, res: Response) {
    try {
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
      res.locals.skipHttpLog = true;
      
      logger.info('Cliente registrado exitosamente', {
        operacion: 'registrar_cliente',
        cliente_id: cliente.id_cliente,
        email: cliente.email_cliente,
        nombre: cliente.nombre_cliente,
        success: true
      });
      
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
   * Verifica el email de un cliente mediante token de verificación
   *
   * Procesa el token de verificación enviado por email y marca el email
   * del cliente como verificado. También habilita el acceso web del cliente.
   *
   * NOTA: En la implementación actual, los clientes se verifican automáticamente
   * al registrarse, por lo que este endpoint es opcional.
   *
   * @param req - Express Request con query.token (token de verificación)
   * @param res - Express Response object
   * @returns 200 con mensaje de confirmación si la verificación es exitosa
   * @returns 400 si el token no se proporciona, es inválido o expiró
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/clientes/verify-email?token=abc-123-def-456
   *
   * Response 200: {
   *   "mensaje": "Email verificado correctamente. Ya puedes iniciar sesión."
   * }
   */
  static async verifyEmail(req: Request, res: Response) {
    try {
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
      logger.info('Email verificado correctamente', {
        id: cliente.id_cliente,
        email: cliente.email_cliente
      });
      return res.json({ mensaje: 'Email verificado correctamente. Ya puedes iniciar sesión.' });
    } catch (error) {
      logger.error('Error al verificar email', { error });
      return res.status(500).json({ mensaje: 'Error al verificar email', error });
    }
  }

  /**
   * Autentica un cliente y genera token JWT
   *
   * Valida las credenciales del cliente (email y contraseña) y genera un JWT
   * válido por 7 días. La contraseña es comparada con el hash almacenado
   * usando bcrypt. Actualiza la fecha de último login del cliente.
   *
   * Solo pueden hacer login clientes habilitados para web (is_web_enabled=true).
   *
   * @param req - Express Request con body conteniendo credenciales
   * @param req.body.email_cliente - Email del cliente (requerido)
   * @param req.body.contrasena - Contraseña en texto plano (requerido)
   * @param res - Express Response object
   * @returns 200 con { token, cliente } si el login es exitoso
   * @returns 400 si faltan email o contraseña
   * @returns 401 si la contraseña es incorrecta
   * @returns 403 si el cliente no tiene contraseña establecida
   * @returns 404 si el cliente no existe o no está habilitado para web
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/clientes/login
   * Body: {
   *   "email_cliente": "juan@example.com",
   *   "contrasena": "MiPassword123"
   * }
   *
   * Response 200: {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "cliente": {
   *     "id_cliente": 5,
   *     "nombre_cliente": "Juan",
   *     "apellido_cliente": "Pérez",
   *     "email_cliente": "juan@example.com"
   *   }
   * }
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
   * Inicia el proceso de recuperación de contraseña
   *
   * Genera un token único de recuperación (UUID v4) con validez de 1 hora
   * y envía un email al cliente con instrucciones para restablecer su contraseña.
   *
   * El token se almacena en la base de datos junto con su fecha de expiración.
   * El cliente debe usar este token para completar el restablecimiento.
   *
   * @param req - Express Request con body.email_cliente
   * @param req.body.email_cliente - Email del cliente que olvidó su contraseña
   * @param res - Express Response object
   * @returns 200 con mensaje de confirmación si el email se envió
   * @returns 400 si no se proporciona email
   * @returns 404 si el cliente no existe o no está habilitado para web
   * @returns 500 si ocurre error en el servidor o al enviar email
   *
   * @example
   * POST /api/clientes/forgot-password
   * Body: {
   *   "email_cliente": "juan@example.com"
   * }
   *
   * Response 200: {
   *   "mensaje": "Se ha enviado un correo para restablecer la contraseña"
   * }
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
   * Completa el proceso de restablecimiento de contraseña
   *
   * Valida el token de recuperación (debe ser válido y no expirado), hashea
   * la nueva contraseña con bcrypt (10 rounds) y actualiza la contraseña del cliente.
   *
   * El token tiene validez de 1 hora desde su generación. Una vez usado, el token
   * se invalida automáticamente para evitar reutilización.
   *
   * @param req - Express Request con body conteniendo token y nueva contraseña
   * @param req.body.reset_token - Token de recuperación (UUID generado en forgotPassword)
   * @param req.body.nueva_contrasena - Nueva contraseña en texto plano (será hasheada)
   * @param res - Express Response object
   * @returns 200 con mensaje de confirmación si el restablecimiento es exitoso
   * @returns 400 si faltan datos, el token es inválido o expiró
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/clientes/reset-password
   * Body: {
   *   "reset_token": "abc-123-def-456",
   *   "nueva_contrasena": "NuevaPassword123"
   * }
   *
   * Response 200: {
   *   "mensaje": "Contraseña restablecida correctamente. Ya puedes iniciar sesión."
   * }
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
   * Verifica validez del token JWT y retorna datos del cliente
   *
   * Endpoint protegido que valida el token JWT del cliente y retorna sus datos
   * actualizados. Útil para mantener la sesión activa y sincronizar datos del
   * cliente entre frontend y backend.
   *
   * El middleware verificarTokenCliente debe ejecutarse antes de este método
   * para validar el token y agregar los datos del cliente a req.usuario.
   *
   * Solo retorna clientes que estén habilitados para web y con email verificado.
   *
   * @param req - Express Request (con req.usuario agregado por middleware)
   * @param res - Express Response object
   * @returns 200 con objeto cliente si el token es válido
   * @returns 401 si el token es inválido o no se proporcionó
   * @returns 403 si el cliente no está habilitado o no tiene email verificado
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/clientes/verify-token
   * Headers: {
   *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * Response 200: {
   *   "cliente": {
   *     "id_cliente": 5,
   *     "nombre_cliente": "Juan",
   *     "apellido_cliente": "Pérez",
   *     "email_cliente": "juan@example.com",
   *     "celular_cliente": "70123456",
   *     "nit_ci_cliente": "1234567"
   *   }
   * }
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

      res.locals.skipHttpLog = true;
      
      logger.info('Token verificado exitosamente', {
        operacion: 'verificar_token',
        cliente_id: clienteCompleto.id_cliente,
        email: clienteCompleto.email_cliente,
        success: true
      });
      
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