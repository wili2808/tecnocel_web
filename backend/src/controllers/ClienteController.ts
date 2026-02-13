import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import Cliente from '../models/Cliente.js';
import { Request, Response } from 'express';
import logger from '../services/loggerService.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/emailService.js';
import {
  ClienteResponse,
  ClientePerfilResponse,
  AuthResponse,
  RegistroResponse,
  VerifyTokenResponse,
  GetPerfilResponse,
  UpdatePerfilResponse
} from '../types/cliente.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';
const JWT_CLIENTE_EXPIRES_IN = process.env.JWT_CLIENTE_EXPIRES_IN || '24h';
const BCRYPT_SALT_ROUNDS = 12; // Estándar 2025/2026 para seguridad óptima

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
   * Genera un token JWT para autenticación de cliente
   *
   * Crea un JWT con el ID del cliente y el rol, usando la configuración
   * de entorno para secret y tiempo de expiración.
   *
   * @private
   * @param idCliente - ID del cliente para el que se genera el token
   * @returns Token JWT firmado
   *
   * @example
   * const token = ClienteController.generarTokenJWT(cliente.id_cliente);
   * // Retorna: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  private static generarTokenJWT(idCliente: number): string {
    return jwt.sign(
      { sub: idCliente, role: 'cliente' },
      JWT_SECRET,
      { expiresIn: JWT_CLIENTE_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  }

  /**
   * Mapea el modelo Cliente a la estructura de respuesta API
   *
   * Transforma los nombres de campos de la base de datos a nombres
   * más amigables para el frontend (camelCase limpio).
   *
   * @private
   * @param cliente - Instancia del modelo Cliente de Sequelize
   * @returns Objeto con estructura limpia para la respuesta API
   *
   * @example
   * const clienteRespuesta = ClienteController.mapearClienteRespuesta(cliente);
   * // Retorna: { id: 5, nombre: "Juan", apellido: "Pérez", ... }
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
      const { email_cliente, contrasena } = req.body;
      logger.info('Intento de login de cliente', { email_cliente });
      
      if (!email_cliente || !contrasena) {
        return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
      }

      // Buscar al cliente por email sin filtrar por email_verified
      const cliente = await Cliente.findOne({ where: { email_cliente } });
      const errorAuth = { mensaje: 'Email o contraseña incorrectos' };
      
      // Validaciones de seguridad
      if (!cliente) {
        logger.warn(`Login fallido: Cliente no encontrado (${email_cliente})`);
        return res.status(401).json(errorAuth);
      }
      if (!cliente.is_web_enabled) {
        logger.warn(`Login fallido: Acceso web deshabilitado (${email_cliente})`);
        return res.status(403).json({ mensaje: 'Esta cuenta no está habilitada para acceso web. Por favor, contacta con soporte.' });
      }
      if (!cliente.password_hash) {
        logger.warn(`Login fallido: contraseña no establecida (${email_cliente})`);
        return res.status(403).json({ mensaje: 'Debes establecer una contraseña para acceder o usar un acceso social.' });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(contrasena, cliente.password_hash);
      if (!passwordValida) {
        logger.warn(`Login fallido: Contraseña incorrecta (${email_cliente})`);
        return res.status(401).json(errorAuth);
      }

      // Generar JWT usando método helper
      const token = ClienteController.generarTokenJWT(cliente.id_cliente);

      // Actualizar último login
      cliente.last_login = new Date();
      await cliente.save();

      logger.info(`Login exitoso para: ${cliente.email_cliente}`);

      const respuesta: AuthResponse = {
        token,
        cliente: ClienteController.mapearClienteRespuesta(cliente)
      };

      return res.json(respuesta);

    } catch (error) {
      logger.error('Error crítico en login de cliente', { 
        email: req.body.email_cliente,
        error: error instanceof Error ? error.message : error
      });
      return res.status(500).json({ mensaje: 'Hubo un error al procesar tu solicitud.', error });
    }
  }

  /**
   * Registra un nuevo cliente en la plataforma
   *
   * Crea un cliente con contraseña hasheada usando bcrypt (12 rounds),
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
   *   }
   * }
   */
  static async register(req: Request, res: Response) {
    try {
      const { nombre_cliente, apellido_cliente, email_cliente, contrasena, celular_cliente, nit_ci_cliente} = req.body;
      logger.info('Intentando registrar nuevo cliente', { email_cliente, nombre_cliente });
      
      // Validaciones básicas
      if (!nombre_cliente || !apellido_cliente || !email_cliente || !contrasena) {
        logger.warn('Registro fallido: campos obligatorios faltantes');
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
      }
      // Verificar si el email ya está registrado y habilitado para web
      // Buscamos el correo en TODA la tabla, sin filtros de estado
      const existente = await Cliente.findOne({ where: { email_cliente } });
      if (existente) {
        // Caso A: Ya tiene acceso web
        if (existente.is_web_enabled) {
          logger.warn(`Registro fallido: el email ya tiene cuenta activa (${email_cliente})`);
          return res.status(409).json({ mensaje: 'Este correo electrónico ya está registrado' });
        }
        // Caso B: Existe pero no tiene acceso web (ej: cliente físico o antiguo)
        logger.info(`Cliente existente sin acceso web intentando registro: ${email_cliente}`);
        return res.status(403).json({ 
          mensaje: 'Ya eres cliente, pero tu cuenta web no está activa. Por favor, contacta con soporte o recupera tu contraseña.' 
        });
      }

      // hash de la contraseña
      const password_hash = await bcrypt.hash(contrasena, BCRYPT_SALT_ROUNDS);
      
      // Creación del cliente
      // Nota: Omitimos fyh_creacion si el ORM está bien configurado
      const nuevoCliente = await Cliente.create({
        nombre_cliente,
        apellido_cliente,
        email_cliente,
        password_hash,
        celular_cliente: celular_cliente || null,
        nit_ci_cliente: nit_ci_cliente || null,
        is_web_enabled: true,
        email_verified: true, 
        verification_token: null
      });

      // Evitamos loguear datos sensibles en el middleware de HTTP
      res.locals.skipHttpLog = true;
      
      logger.info(`Nuevo cliente registrado: ${email_cliente} (ID: ${nuevoCliente.id_cliente})`);

      // Generar JWT para login automático usando método helper
      const token = ClienteController.generarTokenJWT(nuevoCliente.id_cliente);

      // Actualizar último login
      // Nota: fyh_actualizacion se actualizará solo gracias a la configuración de Sequelize
      nuevoCliente.last_login = new Date();
      await nuevoCliente.save();
      
      // Respuesta estructurada usando método helper de mapeo
      // Devolvemos el código 201 (Created) y nombres de propiedades limpios para el front
      const respuesta: RegistroResponse = {
        mensaje: 'Registro exitoso. ¡Bienvenido a TecnoCell!',
        token,
        cliente: ClienteController.mapearClienteRespuesta(nuevoCliente)
      };

      return res.status(201).json(respuesta);
    
    } catch (error) {
      // Manejo de errores seguro
      logger.error('Error crítico en registro de cliente', { 
        email: req.body.email_cliente,
        error: error instanceof Error ? error.message : error 
      });
      
      return res.status(500).json({ 
        mensaje: 'Lo sentimos, hubo un error al procesar tu registro. Inténtalo de nuevo más tarde.' 
      });
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
   *   "mensaje": "Tu cuenta ha sido verificada con éxito. Ya puedes iniciar sesión en TecnoCell."
   * }
   */
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        logger.warn('Intento de verificación sin token valido');
        return res.status(400).json({ mensaje: 'Token de verificación requerido' });
      }

      // Buscar cliente con el token
      const cliente = await Cliente.findOne({ where: { verification_token: token } });
      
      if (!cliente) {
        logger.warn('Token de verificación inválido o expirado');
        return res.status(400).json({ mensaje: 'El enlace de verificación es inválido o ha expirado' });
      }
      
      // Actualizar estado (Sequelize maneja fyh_actualizacion automáticamente)
      cliente.email_verified = true;
      cliente.verification_token = null; // Invalidar el token usado
      cliente.is_web_enabled = true;
      
      await cliente.save();
      
      logger.info(`Email verificado para cliente: ${cliente.email_cliente} (ID: ${cliente.id_cliente})`);
      
      return res.json({ mensaje: 'Tu cuenta ha sido verificada con éxito. Ya puedes iniciar sesión en TecnoCell.' });
    
    } catch (error) {
      logger.error('Error crítico en verificación de email', { 
        token: req.query.token,
        error: error instanceof Error ? error.message : error
      });

      return res.status(500).json({ 
        mensaje: 'Lo sentimos, hubo un problema tecnico al verificar tu cuenta. Inténtalo de nuevo más tarde.'
      });
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
      const { email_cliente } = req.body;

      logger.info('Solicitud de recuperación de contraseña para:', { email_cliente });
      
      if (!email_cliente) {
        return res.status(400).json({ mensaje: 'Email es obligatorio' });
      }

      // Buscar cliente habilitado para web
      const cliente = await Cliente.findOne({ 
        where: { email_cliente, is_web_enabled: true }
      });
      
      if (!cliente) {
        logger.warn(`Recuperación fallida: cliente no encontrado (${email_cliente})`);
        return res.json({ mensaje: 'Si el correo esta registrado, recibirás las instrucciones para restablecer tu contraseña.' });
      }

      // Generar token y fecha de expiración
      const reset_token = uuidv4();
      const reset_token_expires = new Date(Date.now() + 3600000); // 1 hora

      // Guardar token en la base de datos
      cliente.reset_token = reset_token;
      cliente.reset_token_expires = reset_token_expires;
      await cliente.save();

      // Enviar email con instrucciones
      await sendResetPasswordEmail(cliente.email_cliente, reset_token);

      logger.info(`Solicitud de recuperación enviada a: ${cliente.email_cliente}`);

      return res.json({ 
        mensaje: 'Si el correo esta registrado, recibirás las instrucciones para restablecer tu contraseña.'
      });

    } catch (error) {
      logger.error('Error critico en forgotPassword', {
        email: req.body.email_cliente,
        error: error instanceof Error ? error.message : error 
      });

      return res.status(500).json({
         mensaje: 'Lo sentimos, hubo un problema al procesar tu solicitud. Inténtalo de nuevo más tarde.'
      });
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
      const { reset_token, nueva_contrasena } = req.body;

      logger.info('Intento de restablecimiento de contraseña iniciado');

      if (!reset_token || !nueva_contrasena) {
        return res.status(400).json({ mensaje: 'El token y la nueva contraseña son obligatorios' });
      }

      // Buscar al cliente por token y verificar expiración en una sola consulta
      const cliente = await Cliente.findOne({ 
        where: { 
          reset_token,
          reset_token_expires: { [Op.gt]: new Date() } // Usando operadores de Sequelize para verificar que sea mayor a 'ahora'
        } 
      });

      if (!cliente) {
        logger.warn(`Restablecimiento fallido: Token inválido o expirado (${reset_token})`);
        return res.status(400).json({ mensaje: 'El enlace de recuperación es inválido o ha expirado' });
      }

      // Hashear la nueva contraseña
      cliente.password_hash = await bcrypt.hash(nueva_contrasena, BCRYPT_SALT_ROUNDS);

      // Limpiar tokens y habilitar acceso (Sequelize actualizará 'fyh_actualizacion' automáticamente)
      cliente.reset_token = null;
      cliente.reset_token_expires = null;
      cliente.is_web_enabled = true;

      await cliente.save();

      logger.info(`Contraseña actualizada con éxito para el cliente ID: ${cliente.id_cliente}`);

      return res.json({ 
        mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión en TecnoCell.' 
      });

    } catch (error) {
      logger.error('Error crítico al restablecer contraseña', { 
        error: error instanceof Error ? error.message : error 
      });
      
      return res.status(500).json({ 
        mensaje: 'Hubo un error técnico al procesar tu nueva contraseña.' 
      });
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
      const usuarioSession = req.usuario;

      if (!usuarioSession) {
        logger.warn('Intento de verifyToken sin datos de sesión en el request');
        return res.status(401).json({ mensaje: 'Sesión no válida' });
      }

      // Buscar datos frescos de la DB (Seguridad en tiempo real)
      const cliente = await Cliente.findOne({
        where: {
          id_cliente: usuarioSession.id, // o id_cliente según tu extensión de Request
          is_web_enabled: true,
          email_verified: true
        }
      });

      if (!cliente) {
        logger.warn(`Acceso denegado: Cliente ID ${usuarioSession.id} ya no cumple requisitos`);
        return res.status(403).json({ mensaje: 'Cuenta inactiva o no autorizada' });
      }

      // Evitar logs innecesarios de salud (health check)
      res.locals.skipHttpLog = true;

      logger.info(`Token verificado para: ${cliente.email_cliente}`);

      // Retornar objeto usando método helper de mapeo
      const respuesta: VerifyTokenResponse = {
        cliente: ClienteController.mapearClienteRespuesta(cliente)
      };

      return res.json(respuesta);

    } catch (error) {
      logger.error('Error crítico en verifyToken', { 
        error: error instanceof Error ? error.message : error 
      });
      return res.status(500).json({ mensaje: 'Error interno al sincronizar sesión' });
    }
  }

  /**
   * Obtiene el perfil completo del cliente autenticado
   *
   * Retorna información completa del perfil incluyendo metadatos como
   * fecha de registro, última sesión, tipo de autenticación (Google/normal).
   *
   * @param req - Express Request con req.usuario del middleware de autenticación
   * @param res - Express Response object
   * @returns 200 con perfil completo del cliente
   * @returns 401 si el token es inválido
   * @returns 404 si el cliente no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/clientes/perfil
   * Headers: { "Authorization": "Bearer <token>" }
   *
   * Response 200: {
   *   "cliente": {
   *     "id_cliente": 5,
   *     "nombre_cliente": "Juan",
   *     "apellido_cliente": "Pérez",
   *     "email_cliente": "juan@example.com",
   *     "celular_cliente": "70123456",
   *     "nit_ci_cliente": "1234567",
   *     "fyh_creacion": "2025-01-15T10:30:00.000Z",
   *     "last_login": "2025-01-22T14:20:00.000Z",
   *     "is_google_account": true,
   *     "email_verified": true
   *   }
   * }
   */
  static async obtenerPerfil(req: Request, res: Response) {
    try {
      // Extraer ID del usuario inyectado por el middleware
      const usuarioSession = req.usuario;

      if (!usuarioSession) {
        return res.status(401).json({ mensaje: 'Sesión no válida o expirada' });
      }

      // Consultar base de datos para obtener campos de auditoría y estados
      const cliente = await Cliente.findOne({
        where: {
          id_cliente: usuarioSession.id, // Ajustar según nombre en tu req.usuario
          is_web_enabled: true
        }
      });

      if (!cliente) {
        logger.warn(`Intento de obtener perfil de cliente inexistente o inactivo: ${usuarioSession.id}`);
        return res.status(404).json({ mensaje: 'Perfil no encontrado o cuenta inactiva' });
      }

      // Mapeo de datos - Transformamos la estructura de DB a estructura de UI
      const perfilCliente: ClientePerfilResponse = {
        id: cliente.id_cliente,
        nombre: cliente.nombre_cliente,
        apellido: cliente.apellido_cliente,
        email: cliente.email_cliente,
        celular: cliente.celular_cliente,
        nitCi: cliente.nit_ci_cliente,
        // Datos informativos para el usuario
        miembroDesde: cliente.fyh_creacion,
        ultimoIngreso: cliente.last_login,
        // Lógica derivada
        isGoogleAccount: !!cliente.google_id,
        emailVerificado: cliente.email_verified
      };

      const respuesta: GetPerfilResponse = {
        cliente: perfilCliente
      };

      return res.json(respuesta);

    } catch (error) {
      logger.error('Error crítico en obtenerPerfil', { 
        error: error instanceof Error ? error.message : error 
      });
      return res.status(500).json({ mensaje: 'Error interno al recuperar los datos del perfil' });
    }
  }

  /**
   * Actualiza el perfil del cliente autenticado
   *
   * Permite actualizar nombre, apellido, celular y NIT/CI del cliente.
   * Solo el cliente propietario puede actualizar su propio perfil.
   * No permite cambiar email ni contraseña (usar endpoints específicos).
   *
   * @param req - Express Request con req.usuario y body con datos a actualizar
   * @param req.body.nombre_cliente - Nuevo nombre (opcional)
   * @param req.body.apellido_cliente - Nuevo apellido (opcional)
   * @param req.body.celular_cliente - Nuevo celular (opcional)
   * @param req.body.nit_ci_cliente - Nuevo NIT/CI (opcional)
   * @param res - Express Response object
   * @returns 200 con { mensaje, cliente } si la actualización es exitosa
   * @returns 400 si no se proporciona ningún campo para actualizar
   * @returns 401 si el token es inválido
   * @returns 403 si intenta actualizar un perfil que no le pertenece
   * @returns 404 si el cliente no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * PUT /api/clientes/perfil
   * Headers: { "Authorization": "Bearer <token>" }
   * Body: {
   *   "nombre_cliente": "Juan Carlos",
   *   "celular_cliente": "70987654"
   * }
   *
   * Response 200: {
   *   "mensaje": "Perfil actualizado exitosamente",
   *   "cliente": {
   *     "id_cliente": 5,
   *     "nombre_cliente": "Juan Carlos",
   *     "apellido_cliente": "Pérez",
   *     "email_cliente": "juan@example.com",
   *     "celular_cliente": "70987654",
   *     "nit_ci_cliente": "1234567"
   *   }
   * }
   */
  static async actualizarPerfil(req: Request, res: Response) {
    try {
      const usuarioSession = req.usuario;
      const { nombre_cliente, apellido_cliente, celular_cliente, nit_ci_cliente } = req.body;

      if (!usuarioSession) {
        return res.status(401).json({ mensaje: 'Sesión no válida' });
      }

      // Validar que al menos un campo esté presente
      if (!nombre_cliente && !apellido_cliente && !celular_cliente && !nit_ci_cliente) {
        return res.status(400).json({ mensaje: 'Debe proporcionar al menos un campo para actualizar' });
      }

      // Buscar al cliente en la base de datos
      const cliente = await Cliente.findOne({ where: {id_cliente: usuarioSession.id, is_web_enabled: true} });

      if (!cliente) {
        logger.warn(`Intento de actualización en cuenta inexistente o inactiva: ${usuarioSession.id}`);
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }

      // Actualizar campos (Solo los que vienen en el body)
      // Sequelize detecta automáticamente si el valor cambió
      if (nombre_cliente) cliente.nombre_cliente = nombre_cliente;
      if (apellido_cliente) cliente.apellido_cliente = apellido_cliente;
      if (celular_cliente) cliente.celular_cliente = celular_cliente;
      if (nit_ci_cliente) cliente.nit_ci_cliente = nit_ci_cliente;

      /**
       * IMPORTANTE: 
       * Eliminamos 'cliente.fyh_actualizacion = new Date()'.
       * Gracias a 'updatedAt: fyh_actualizacion' en el modelo, 
       * Sequelize actualizará la fecha solo si hubo cambios reales.
       */
      await cliente.save();

      logger.info(`Perfil actualizado exitosamente para cliente ID: ${cliente.id_cliente}`);

      // Retornar respuesta usando método helper de mapeo
      const respuesta: UpdatePerfilResponse = {
        mensaje: 'Perfil actualizado exitosamente',
        cliente: ClienteController.mapearClienteRespuesta(cliente)
      };

      return res.json(respuesta);

    } catch (error) {
      logger.error('Error crítico en actualizarPerfil', { 
        id: req.usuario?.id,
        error: error instanceof Error ? error.message : error 
      });
      return res.status(500).json({ mensaje: 'Error interno al procesar la actualización' });
    }
  }

  /**
   * Cambia la contraseña del cliente autenticado
   *
   * Permite cambiar la contraseña validando primero la contraseña actual.
   * Solo disponible para cuentas con autenticación normal (no Google OAuth).
   *
   * @param req - Express Request con req.usuario y body con contraseñas
   * @param req.body.contrasena_actual - Contraseña actual (requerida)
   * @param req.body.contrasena_nueva - Nueva contraseña (requerida)
   * @param res - Express Response object
   * @returns 200 con mensaje de confirmación si el cambio es exitoso
   * @returns 400 si faltan campos o la nueva contraseña es igual a la actual
   * @returns 401 si la contraseña actual es incorrecta
   * @returns 403 si la cuenta usa Google OAuth
   * @returns 404 si el cliente no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * PUT /api/clientes/cambiar-contrasena
   * Headers: { "Authorization": "Bearer <token>" }
   * Body: {
   *   "contrasena_actual": "MiPassword123",
   *   "contrasena_nueva": "NuevaPassword456"
   * }
   *
   * Response 200: {
   *   "mensaje": "Contraseña cambiada exitosamente"
   * }
   */
  static async cambiarContrasena(req: Request, res: Response) {
    try {
      const usuarioSession = req.usuario;
      const { contrasena_actual, contrasena_nueva } = req.body;

      logger.info(`Intento de cambio de contraseña iniciado para el usuario ID: ${usuarioSession?.id}`);

      if (!usuarioSession) {
        return res.status(401).json({ mensaje: 'Sesión no válida' });
      }

      if (!contrasena_actual || !contrasena_nueva) {
        return res.status(400).json({ mensaje: 'Debe proporcionar la contraseña actual y la nueva' });
      }

      if (contrasena_actual === contrasena_nueva) {
        return res.status(400).json({ mensaje: 'La nueva contraseña no puede ser igual a la anterior' });
      }

      // Obtener datos frescos del cliente
      const cliente = await Cliente.findOne({
        where: { id_cliente: usuarioSession.id, is_web_enabled: true }
      });

      if (!cliente) {
        logger.warn(`Cambio de pass fallido: Cliente ${usuarioSession.id} no encontrado`);
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }

      // Validaciones de cuenta (Google OAuth)
      if (cliente.google_id) {
        logger.warn(`Intento de cambio de pass en cuenta Google: ${cliente.email_cliente}`);
        return res.status(403).json({ mensaje: 'Las cuentas vinculadas a Google deben gestionar su acceso desde Google' });
      }

      if (!cliente.password_hash) {
        return res.status(403).json({ mensaje: 'No existe una contraseña local para esta cuenta' });
      }

      // Verificar contraseña actual
      const esValida = await bcrypt.compare(contrasena_actual, cliente.password_hash);
      if (!esValida) {
        logger.warn(`Password actual incorrecta para: ${cliente.email_cliente}`);
        return res.status(401).json({ mensaje: 'La contraseña actual no es correcta' });
      }

      // Hashear nueva contraseña
      cliente.password_hash = await bcrypt.hash(contrasena_nueva, BCRYPT_SALT_ROUNDS);
      
      await cliente.save();

      logger.info(`Contraseña actualizada exitosamente: ${cliente.email_cliente}`);

      return res.json({ mensaje: 'Tu contraseña ha sido actualizada correctamente' });

    } catch (error) {
      logger.error('Error crítico en cambiarContrasena', { 
        error: error instanceof Error ? error.message : error 
      });
      return res.status(500).json({ mensaje: 'Hubo un error técnico al procesar el cambio' });
    }
  }
} 