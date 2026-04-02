/**
 * @file Controlador de administración de usuarios del sistema
 *
 * Proporciona funcionalidades CRUD completas para gestión de usuarios (administradores y empleados)
 * y visualización de información de clientes desde el panel de administración.
 *
 * Requiere autenticación y autorización por rol para todas las operaciones.
 *
 * @module UsuarioAdminController
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ROLES } from '../constants/roles.js';
import { Op } from 'sequelize';
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import Cliente from '../models/Cliente.js';
import Almacen from '../models/Almacen.js';
import Cancelacion from '../models/Cancelacion.js';
import ComentarioRespuesta from '../models/ComentarioRespuesta.js';
import Compra from '../models/Compra.js';
import logger from '../services/loggerService.js';
import { sendAccountCreatedByAdminEmail } from '../services/emailService.js';
import { WhereOptions } from 'sequelize';
import {
  ListarClientesResponse,
  ClienteAdminResponse,
  UpdateClienteAdminResponse,
  ActualizarClienteAdminRequest
} from '../types/cliente.types.js';
import {
  UsuarioSistemaResponse,
  UsuarioCreacionResponse,
  UsuarioActualizacionResponse,
  ListarUsuariosResponse,
  CrearUsuarioResponse,
  ActualizarUsuarioResponse,
  EliminarResponse,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest
} from '../types/usuario.types.js';
import { UsuarioSession } from '../types/express.js';

/**
 * Helper para verificar si req.usuario es un UsuarioSession (admin/empleado)
 */
function esUsuarioSistema(usuario: unknown): usuario is UsuarioSession {
  return usuario !== null && typeof usuario === 'object' && 'idRol' in usuario;
}

const BCRYPT_SALT_ROUNDS = 12; // Estándar 2025/2026 para seguridad óptima

/**
 * Controlador para administración de usuarios y clientes
 *
 * Proporciona endpoints para:
 * - CRUD completo de usuarios del sistema (admin/empleado)
 * - Visualización y edición de clientes web
 * - Gestión de roles
 *
 * @class UsuarioAdminController
 */

class UsuarioAdminController {

  // ============================================================================
  // MÉTODOS HELPER PRIVADOS
  // ============================================================================

  /**
   * Mapea el modelo Usuario a la estructura base de respuesta API
   *
   * Transforma los nombres de campos de la base de datos a nombres
   * más amigables para el frontend (camelCase limpio).
   *
   * @private
   * @param usuario - Instancia del modelo Usuario de Sequelize
   * @returns Objeto con estructura limpia para la respuesta API
   *
   * @example
   * const usuarioRespuesta = UsuarioAdminController.mapearUsuarioRespuesta(usuario);
   * // Retorna: { id: 1, nombres: "Juan Pérez", email: "admin@tecnocel.com", idRol: 1, rolNombre: "ADMINISTRADOR" }
   */
  private static mapearUsuarioRespuesta(usuario: Usuario, rolNombre?: string): UsuarioSistemaResponse {
    return {
      id: usuario.id_usuario,
      nombres: usuario.nombres,
      email: usuario.email,
      idRol: usuario.id_rol,
      /** Sequelize no tipifica asociaciones — cast necesario para acceder a la relación Rol */
      rolNombre: rolNombre || (usuario as unknown as { Rol?: { rol: string } }).Rol?.rol || 'Desconocido'
    };
  }

  /**
   * Mapea el modelo Usuario a respuesta con fecha de creación
   *
   * @private
   * @param usuario - Instancia del modelo Usuario de Sequelize
   * @returns Objeto con datos del usuario y fecha de creación
   */
  private static mapearUsuarioCreacion(usuario: Usuario, rolNombre?: string): UsuarioCreacionResponse {
    return {
      ...UsuarioAdminController.mapearUsuarioRespuesta(usuario, rolNombre),
      fyhCreacion: usuario.fyh_creacion
    };
  }

  /**
   * Mapea el modelo Usuario a respuesta con fecha de actualización
   *
   * @private
   * @param usuario - Instancia del modelo Usuario de Sequelize
   * @returns Objeto con datos del usuario y fecha de actualización
   */
  private static mapearUsuarioActualizacion(usuario: Usuario, rolNombre?: string): UsuarioActualizacionResponse {
    return {
      ...UsuarioAdminController.mapearUsuarioRespuesta(usuario, rolNombre),
      fyhActualizacion: usuario.fyh_actualizacion
    };
  }

  // ============================================================================
  // GESTIÓN DE ROLES
  // ============================================================================

  /**
   * Listar todos los roles disponibles en el sistema
   *
   * Retorna la lista completa de roles para uso en formularios de creación/edición.
   * Accesible por: Admin
   *
   * @async
   * @param req - Express Request
   * @param res - Express Response
   * @returns 200 con array de roles
   * @returns 500 si ocurre un error
   *
   * @example
   * GET /api/usuarios/admin/roles
   *
   * Response: {
   *   "roles": [
   *     { "id_rol": 1, "rol": "ADMINISTRADOR" },
   *     { "id_rol": 2, "rol": "GERENTE" }
   *     { "id_rol": 3, "rol": "VENDEDOR" }
   *   ]
   * }
   */
  static async listarRoles(_req: Request, res: Response) {
    try {
      const roles = await Rol.findAll({
        attributes: ['id_rol', 'rol'],
        order: [['id_rol', 'ASC']]
      });

      res.json({ roles });
    } catch (error) {
      logger.error('Error al listar roles:', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({
        mensaje: 'Error al obtener lista de roles'
      });
    }
  }

  // ============================================================================
  // GESTIÓN DE USUARIOS DEL SISTEMA
  // ============================================================================

  /**
   * Listar todos los usuarios del sistema con información de rol
   *
   * Retorna lista paginada de usuarios con información completa excepto contraseñas.
   * Incluye join con tabla Rol para mostrar nombre del rol.
   * Accesible por: Admin y Empleado
   *
   * @async
   * @param req - Express Request (puede incluir query params para paginación)
   * @param res - Express Response
   * @returns 200 con array de usuarios
   * @returns 500 si ocurre un error en el servidor
   *
   * @example
   * GET /api/usuarios/admin/usuarios?limit=10&offset=0
   *
   * Response: {
   *   "usuarios": [
   *     {
   *       "id_usuario": 1,
   *       "nombres": "Juan Pérez",
   *       "email": "admin@tecnocel.com",
   *       "id_rol": 1,
   *       "fyh_creacion": "2024-01-15T10:30:00.000Z",
   *       "Rol": { "id_rol": 1, "rol": "Administrador" }
   *     }
   *   ],
   *   "total": 5
   * }
   */
  static async listarUsuarios(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const { count, rows: usuarios } = await Usuario.findAndCountAll({
        attributes: ['id_usuario', 'nombres', 'email', 'id_rol', 'fyh_ultimo_login', 'fyh_creacion', 'fyh_actualizacion'],
        include: [
          {
            model: Rol,
            attributes: ['id_rol', 'rol']
          }
        ],
        limit,
        offset,
        order: [['fyh_creacion', 'DESC']]
      });

      logger.info('Lista de usuarios obtenida', {
        usuario_solicitante: req.usuario?.id,
        total: count,
        limit,
        offset
      });

      const respuesta: ListarUsuariosResponse = {
        usuarios,
        total: count,
        limit,
        offset
      };

      res.json(respuesta);

    } catch (error) {
      logger.error('Error al listar usuarios:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        mensaje: 'Error al obtener lista de usuarios'
      });
    }
  }

  /**
   * Obtener información detallada de un usuario específico
   *
   * Retorna información completa de un usuario por su ID, incluyendo su rol.
   * No incluye contraseña ni token por seguridad.
   * Accesible por: Admin y Empleado
   *
   * @async
   * @param req - Express Request con params.id
   * @param res - Express Response
   * @returns 200 con datos del usuario
   * @returns 404 si el usuario no existe
   * @returns 500 si ocurre un error
   *
   * @example
   * GET /api/usuarios/admin/usuarios/1
   *
   * Response: {
   *   "id_usuario": 1,
   *   "nombres": "Juan Pérez",
   *   "email": "admin@tecnocel.com",
   *   "id_rol": 1,
   *   "fyh_creacion": "2024-01-15T10:30:00.000Z",
   *   "Rol": { "id_rol": 1, "rol": "Administrador" }
   * }
   */
  static async obtenerUsuario(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id, {
        attributes: ['id_usuario', 'nombres', 'email', 'id_rol', 'fyh_ultimo_login', 'fyh_creacion', 'fyh_actualizacion'],
        include: [
          {
            model: Rol,
            attributes: ['id_rol', 'rol']
          }
        ]
      });

      if (!usuario) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      logger.info('Usuario obtenido', {
        id_usuario_solicitado: id,
        solicitante: req.usuario?.id
      });

      res.json(usuario);

    } catch (error) {
      logger.error('Error al obtener usuario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_usuario: req.params.id
      });
      res.status(500).json({
        mensaje: 'Error al obtener usuario'
      });
    }
  }

  /**
   * Crear nuevo usuario del sistema (admin o empleado)
   *
   * Crea una cuenta de usuario con contraseña hasheada y token inicial.
   * Solo accesible por administradores.
   * Valida que el email sea único en el sistema.
   *
   * @async
   * @param req - Express Request con body { nombres, email, password, id_rol }
   * @param res - Express Response
   * @returns 201 con usuario creado (sin contraseña)
   * @returns 400 si hay errores de validación o email duplicado
   * @returns 500 si ocurre un error
   *
   * @example
   * POST /api/usuarios/admin/usuarios
   * Body: {
   *   "nombres": "María González",
   *   "email": "maria@tecnocel.com",
   *   "password": "Password123!",
   *   "id_rol": 2
   * }
   *
   * Response: {
   *   "mensaje": "Usuario creado exitosamente",
   *   "usuario": {
   *     "id_usuario": 5,
   *     "nombres": "María González",
   *     "email": "maria@tecnocel.com",
   *     "id_rol": 2
   *   }
   * }
   */
  static async crearUsuario(req: Request, res: Response) {
    try {
      // Validar errores de express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nombres, email, password, id_rol } = req.body as CrearUsuarioRequest;

      // Verificar si el email ya existe
      const usuarioExistente = await Usuario.findOne({ where: { email } });
      if (usuarioExistente) {
        return res.status(400).json({
          mensaje: 'El email ya está registrado'
        });
      }

      // Verificar que el rol exista
      const rol = await Rol.findByPk(id_rol);
      if (!rol) {
        return res.status(400).json({
          mensaje: 'El rol especificado no existe'
        });
      }

      // Hashear contraseña
      const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      // Crear usuario
      const nuevoUsuario = await Usuario.create({
        nombres,
        email,
        password_user: password_hash,
        token: '', // Token vacío inicial
        id_rol,
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      logger.info('Usuario creado exitosamente', {
        id_usuario_nuevo: nuevoUsuario.id_usuario,
        email: nuevoUsuario.email,
        id_rol: nuevoUsuario.id_rol,
        creado_por: req.usuario?.id
      });

      const respuesta: CrearUsuarioResponse = {
        mensaje: 'Usuario creado exitosamente',
        usuario: UsuarioAdminController.mapearUsuarioCreacion(nuevoUsuario, rol.rol)
      };

      res.status(201).json(respuesta);

    } catch (error) {
      logger.error('Error al crear usuario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        mensaje: 'Error al crear usuario'
      });
    }
  }

  /**
   * Actualizar información de un usuario existente
   *
   * Permite actualizar nombres, email y rol de un usuario.
   * Si se proporciona nueva contraseña, se hashea antes de guardar.
   * Administradores pueden actualizar cualquier usuario.
   * Empleados solo pueden actualizar su propia información (excepto rol).
   *
   * @async
   * @param req - Express Request con params.id y body { nombres?, email?, password?, id_rol? }
   * @param res - Express Response
   * @returns 200 con usuario actualizado
   * @returns 400 si hay errores de validación
   * @returns 403 si empleado intenta actualizar otro usuario
   * @returns 404 si el usuario no existe
   * @returns 500 si ocurre un error
   *
   * @example
   * PUT /api/usuarios/admin/usuarios/5
   * Body: {
   *   "nombres": "María González Rodríguez",
   *   "email": "maria.gonzalez@tecnocel.com"
   * }
   *
   * Response: {
   *   "mensaje": "Usuario actualizado exitosamente",
   *   "usuario": { ... }
   * }
   */
  static async actualizarUsuario(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { nombres, email, password, id_rol } = req.body as ActualizarUsuarioRequest;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      // Verificar permisos: empleados solo pueden editar su propia cuenta (sin cambiar rol)
      const usuarioActual = req.usuario;
      const esAdmin = esUsuarioSistema(usuarioActual) && usuarioActual.idRol === ROLES.ADMIN;
      const esPropio = usuarioActual?.id === parseInt(id);

      if (!esAdmin && !esPropio) {
        return res.status(403).json({
          mensaje: 'No tienes permisos para editar este usuario'
        });
      }

      // Si no es admin y intenta cambiar el rol, denegar
      if (!esAdmin && id_rol && id_rol !== usuario.id_rol) {
        return res.status(403).json({
          mensaje: 'No tienes permisos para cambiar el rol'
        });
      }

      // Si se proporciona nuevo email, verificar que no esté en uso
      if (email && email !== usuario.email) {
        const emailExistente = await Usuario.findOne({ where: { email } });
        if (emailExistente) {
          return res.status(400).json({
            mensaje: 'El email ya está en uso'
          });
        }
      }

      // Actualizar campos
      if (nombres) usuario.nombres = nombres;
      if (email) usuario.email = email;
      if (id_rol && esAdmin) usuario.id_rol = id_rol;
      if (password) {
        usuario.password_user = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      }

      await usuario.save();

      // Obtener nombre del rol actualizado
      const rolActual = await Rol.findByPk(usuario.id_rol);

      logger.info('Usuario actualizado', {
        id_usuario: usuario.id_usuario,
        actualizado_por: req.usuario?.id,
        campos_actualizados: { nombres: !!nombres, email: !!email, password: !!password, id_rol: !!id_rol }
      });

      const respuesta: ActualizarUsuarioResponse = {
        mensaje: 'Usuario actualizado exitosamente',
        usuario: UsuarioAdminController.mapearUsuarioActualizacion(usuario, rolActual?.rol)
      };

      res.json(respuesta);

    } catch (error) {
      logger.error('Error al actualizar usuario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_usuario: req.params.id
      });
      res.status(500).json({
        mensaje: 'Error al actualizar usuario'
      });
    }
  }

  /**
   * Eliminar usuario del sistema
   *
   * Elimina permanentemente un usuario de la base de datos.
   * Solo accesible por administradores.
   * No permite auto-eliminación (admin no puede eliminarse a sí mismo).
   *
   * @async
   * @param req - Express Request con params.id
   * @param res - Express Response
   * @returns 200 con mensaje de confirmación
   * @returns 400 si intenta auto-eliminación
   * @returns 404 si el usuario no existe
   * @returns 500 si ocurre un error
   *
   * @example
   * DELETE /api/usuarios/admin/usuarios/5
   *
   * Response: {
   *   "mensaje": "Usuario eliminado exitosamente"
   * }
   */
  static async eliminarUsuario(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Evitar auto-eliminación
      if (req.usuario?.id === parseInt(id)) {
        return res.status(400).json({
          mensaje: 'No puedes eliminar tu propia cuenta'
        });
      }

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      // Verificar si el usuario tiene datos asociados en otras tablas
      // Foreign keys en tb_usuarios previenen eliminación directa
      const validacionesAsociaciones = await Promise.all([
        Almacen.count({ where: { id_usuario: id } }),
        Cancelacion.count({ where: { id_usuario: id } }),
        ComentarioRespuesta.count({ where: { id_usuario: id } }),
        Compra.count({ where: { id_usuario: id } })
      ]);

      const [productosCount, cancelacionesCount, respuestasCount, comprasCount] = validacionesAsociaciones;

      // Compilar lista de asociaciones encontradas
      const asociacionesEncontradas: string[] = [];
      if (productosCount > 0) asociacionesEncontradas.push(`${productosCount} producto(s)`);
      if (cancelacionesCount > 0) asociacionesEncontradas.push(`${cancelacionesCount} cancelación(es)`);
      if (respuestasCount > 0) asociacionesEncontradas.push(`${respuestasCount} respuesta(s) a comentarios`);
      if (comprasCount > 0) asociacionesEncontradas.push(`${comprasCount} compra(s) a proveedor(es)`);

      if (asociacionesEncontradas.length > 0) {
        logger.warn('Intento de eliminar usuario con datos asociados', {
          id_usuario: id,
          productos: productosCount,
          cancelaciones: cancelacionesCount,
          respuestas: respuestasCount,
          compras: comprasCount,
          intentado_por: req.usuario?.id
        });
        return res.status(409).json({
          mensaje: 'No se puede eliminar este usuario. Tiene datos asociados en el sistema.',
          detalles: `Registros encontrados: ${asociacionesEncontradas.join(', ')}. Resuelva estas asociaciones antes de eliminar.`,
          asociaciones: {
            productos: productosCount,
            cancelaciones: cancelacionesCount,
            respuestas_comentarios: respuestasCount,
            compras: comprasCount
          }
        });
      }

      await usuario.destroy();

      logger.info('Usuario eliminado', {
        id_usuario_eliminado: id,
        eliminado_por: req.usuario?.id
      });

      const respuesta: EliminarResponse = {
        mensaje: 'Usuario eliminado exitosamente'
      };

      res.json(respuesta);

    } catch (error) {
      logger.error('Error al eliminar usuario:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_usuario: req.params.id
      });
      res.status(500).json({
        mensaje: 'Error al eliminar usuario'
      });
    }
  }

  // ============================================================================
  // GESTIÓN DE CLIENTES (VISTA ADMINISTRATIVA)
  // ============================================================================

  /**
   * Crear un nuevo cliente desde el panel de administración
   *
   * Crea el cliente sin contraseña y envía un email de activación para que el
   * cliente establezca su propia contraseña. El token de activación expira en 48h.
   * Accesible por: Admin, Gerente y Vendedor
   *
   * @async
   * @param req - Express Request con body: nombre_cliente, apellido_cliente, email_cliente, celular_cliente?, nit_ci_cliente?
   * @param res - Express Response
   * @returns 201 con mensaje de éxito
   * @returns 400 si faltan campos obligatorios
   * @returns 409 si el email ya está registrado
   * @returns 500 si ocurre un error
   */
  static async crearCliente(req: Request, res: Response) {
    try {
      const { nombre_cliente, apellido_cliente, email_cliente, celular_cliente, nit_ci_cliente } = req.body;

      if (!nombre_cliente || !apellido_cliente || !email_cliente) {
        return res.status(400).json({ mensaje: 'Nombre, apellido y email son obligatorios' });
      }

      const existente = await Cliente.findOne({ where: { email_cliente } });
      if (existente) {
        return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese email' });
      }

      const reset_token = uuidv4();
      const reset_token_expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 horas

      await Cliente.create({
        nombre_cliente,
        apellido_cliente,
        email_cliente,
        celular_cliente: celular_cliente || null,
        nit_ci_cliente: nit_ci_cliente || null,
        password_hash: null,
        is_web_enabled: false,
        email_verified: false,
        reset_token,
        reset_token_expires,
      });

      sendAccountCreatedByAdminEmail(email_cliente, nombre_cliente, reset_token)
        .catch(err => logger.error('Error enviando email de activación por admin:', { error: err.message }));

      logger.info(`Cliente creado por admin: ${email_cliente}`);
      return res.status(201).json({ success: true, mensaje: 'Cliente creado. Se envió un email de activación.' });
    } catch (error) {
      logger.error('Error al crear cliente desde admin:', { error: error instanceof Error ? error.message : error });
      return res.status(500).json({ mensaje: 'Error al crear el cliente' });
    }
  }

  /**
   * Listar todos los clientes registrados en la tienda web
   *
   * Retorna lista paginada de clientes con información relevante.
   * Útil para administradores y empleados para gestión de clientes.
   * Accesible por: Admin y Empleado
   *
   * @async
   * @param req - Express Request (puede incluir query params para paginación y búsqueda)
   * @param res - Express Response
   * @returns 200 con array de clientes
   * @returns 500 si ocurre un error
   *
   * @example
   * GET /api/usuarios/admin/clientes?limit=20&offset=0&search=juan
   *
   * Response: {
   *   "clientes": [
   *     {
   *       "id_cliente": 1,
   *       "nombre_cliente": "Juan",
   *       "apellido_cliente": "Pérez",
   *       "email_cliente": "juan@example.com",
   *       "celular_cliente": "70123456",
   *       "nit_ci_cliente": "1234567",
   *       "is_web_enabled": true,
   *       "email_verified": true,
   *       "last_login": "2024-01-20T15:30:00.000Z",
   *       "fyh_creacion": "2024-01-10T10:00:00.000Z"
   *     }
   *   ],
   *   "total": 150
   * }
   */
  static async listarClientes(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      // Construir filtros de búsqueda si se proporciona término
      let whereClause: WhereOptions = {};
      if (search) {
        whereClause = {
          [Op.or]: [
            { nombre_cliente: { [Op.like]: `%${search}%` } },
            { apellido_cliente: { [Op.like]: `%${search}%` } },
            { email_cliente: { [Op.like]: `%${search}%` } },
            { celular_cliente: { [Op.like]: `%${search}%` } }
          ]
        };
      }

      const { count, rows: clientes } = await Cliente.findAndCountAll({
        where: whereClause,
        attributes: [
          'id_cliente',
          'nombre_cliente',
          'apellido_cliente',
          'email_cliente',
          'celular_cliente',
          'nit_ci_cliente',
          'is_web_enabled',
          'email_verified',
          'last_login',
          'fyh_creacion',
          'fyh_actualizacion'
        ],
        limit,
        offset,
        order: [['fyh_creacion', 'DESC']]
      });

      logger.info('Lista de clientes obtenida', {
        usuario_solicitante: req.usuario?.id,
        total: count,
        limit,
        offset,
        search
      });

      const respuesta: ListarClientesResponse = {
        clientes,
        total: count,
        limit,
        offset
      };

      res.json(respuesta);

    } catch (error) {
      logger.error('Error al listar clientes:', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({
        mensaje: 'Error al obtener lista de clientes'
      });
    }
  }

  /**
   * Obtener información detallada de un cliente específico
   *
   * Retorna información completa de un cliente por su ID.
   * No incluye contraseña ni tokens por seguridad.
   * Accesible por: Admin y Empleado
   *
   * @async
   * @param req - Express Request con params.id
   * @param res - Express Response
   * @returns 200 con datos del cliente
   * @returns 404 si el cliente no existe
   * @returns 500 si ocurre un error
   *
   * @example
   * GET /api/usuarios/admin/clientes/1
   *
   * Response: {
   *   "id_cliente": 1,
   *   "nombre_cliente": "Juan",
   *   "apellido_cliente": "Pérez",
   *   ... (todos los campos del cliente)
   * }
   */
  static async obtenerCliente(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const cliente = await Cliente.findByPk(id, {
        attributes: { exclude: ['password_hash', 'verification_token', 'reset_token', 'reset_token_expires'] }
      });

      if (!cliente) {
        return res.status(404).json({
          mensaje: 'Cliente no encontrado'
        });
      }

      logger.info('Cliente obtenido', {
        id_cliente: id,
        solicitante: req.usuario?.id
      });

      res.json(cliente);

    } catch (error) {
      logger.error('Error al obtener cliente:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_cliente: req.params.id
      });
      res.status(500).json({
        mensaje: 'Error al obtener cliente'
      });
    }
  }

  /**
   * Actualizar información de un cliente (vista administrativa)
   *
   * Permite a administradores actualizar datos de clientes.
   * Puede actualizar información personal y estados (is_web_enabled, email_verified).
   * No permite cambiar contraseñas desde panel admin (seguridad).
   * Accesible por: Admin (empleados tienen acceso limitado)
   *
   * @async
   * @param req - Express Request con params.id y body con campos a actualizar
   * @param res - Express Response
   * @returns 200 con cliente actualizado
   * @returns 400 si hay errores de validación
   * @returns 404 si el cliente no existe
   * @returns 500 si ocurre un error
   *
   * @example
   * PUT /api/usuarios/admin/clientes/1
   * Body: {
   *   "celular_cliente": "70654321",
   *   "is_web_enabled": true
   * }
   *
   * Response: {
   *   "mensaje": "Cliente actualizado exitosamente",
   *   "cliente": { ... }
   * }
   */
  static async actualizarCliente(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        nombre_cliente,
        apellido_cliente,
        celular_cliente,
        nit_ci_cliente,
        is_web_enabled,
        email_verified
      } = req.body as ActualizarClienteAdminRequest;

      // 1. Buscar el cliente por su Clave Primaria (PK)
      const cliente = await Cliente.findByPk(id);
      
      if (!cliente) {
        logger.warn(`Intento de edición de cliente inexistente ID: ${id}`);
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }

      // 2. Actualización de campos de perfil
      // Usamos !== undefined para permitir valores vacíos ("") pero ignorar los no enviados
      if (nombre_cliente !== undefined) cliente.nombre_cliente = nombre_cliente;
      if (apellido_cliente !== undefined) cliente.apellido_cliente = apellido_cliente;
      if (celular_cliente !== undefined) cliente.celular_cliente = celular_cliente;
      if (nit_ci_cliente !== undefined) cliente.nit_ci_cliente = nit_ci_cliente;

      // 3. Seguridad de Roles (Solo el ID_ROL 1 puede gestionar estados)
      // Asumimos que req.usuario viene del middleware de Admin/Empleado
      const usuarioAdmin = req.usuario;
      if (esUsuarioSistema(usuarioAdmin) && usuarioAdmin.idRol === ROLES.ADMIN) {
        if (is_web_enabled !== undefined) cliente.is_web_enabled = is_web_enabled;
        if (email_verified !== undefined) cliente.email_verified = email_verified;
      } else if (is_web_enabled !== undefined || email_verified !== undefined) {
        logger.warn(`Usuario ${req.usuario?.id} intentó cambiar estados sin permisos suficientes`);
        // Opcional: podrías retornar 403 aquí si quieres ser estricto
      }

      /**
       * 4. Persistencia Automática
       * Eliminamos 'cliente.fyh_actualizacion = new Date()'.
       * Sequelize lo hará automáticamente si detecta cambios.
       */
      await cliente.save();

      logger.info(`Cliente ID ${id} actualizado desde panel admin por usuario ${req.usuario?.id}`);

      // 5. Respuesta con mapeo consistente para el Frontend de Admin
      const clienteRespuesta: ClienteAdminResponse = {
        id: cliente.id_cliente,
        nombre: cliente.nombre_cliente,
        apellido: cliente.apellido_cliente,
        email: cliente.email_cliente,
        celular: cliente.celular_cliente,
        nitCi: cliente.nit_ci_cliente,
        isWebEnabled: cliente.is_web_enabled,
        emailVerified: cliente.email_verified
      };

      const respuesta: UpdateClienteAdminResponse = {
        mensaje: 'Cliente actualizado exitosamente',
        cliente: clienteRespuesta
      };

      return res.json(respuesta);

    } catch (error) {
      logger.error('Error crítico al actualizar cliente desde admin', {
        id_cliente: req.params.id,
        error: error instanceof Error ? error.message : error
      });
      return res.status(500).json({ mensaje: 'Error interno al procesar la actualización' });
    }
  }

  /**
   * Estadísticas del dashboard: usuarios del sistema, clientes, productos
   * GET /api/usuarios/admin/dashboard-stats
   * Roles: admin (1), empleado (2), vendedor (3)
   */
  static async obtenerEstadisticasDashboard(_req: Request, res: Response) {
    try {
      const [usuariosSistema, clientesRegistrados, productosActivos] = await Promise.all([
        Usuario.count(),
        Cliente.count(),
        Almacen.count()
      ]);

      return res.json({
        usuarios_sistema: usuariosSistema,
        clientes_registrados: clientesRegistrados,
        productos_activos: productosActivos
      });

    } catch (error) {
      logger.error('Error al obtener estadísticas del dashboard:', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      return res.status(500).json({ mensaje: 'Error al obtener estadísticas del dashboard' });
    }
  }
}

export default UsuarioAdminController;
