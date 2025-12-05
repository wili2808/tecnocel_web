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
import { Op } from 'sequelize';
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import Cliente from '../models/Cliente.js';
import logger from '../services/loggerService.js';

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
        attributes: ['id_usuario', 'nombres', 'email', 'id_rol', 'fyh_creacion', 'fyh_actualizacion'],
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
        usuario_solicitante: req.usuario?.id_usuario,
        total: count,
        limit,
        offset
      });

      res.json({
        usuarios,
        total: count,
        limit,
        offset
      });

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
        attributes: ['id_usuario', 'nombres', 'email', 'id_rol', 'fyh_creacion', 'fyh_actualizacion'],
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
        solicitante: req.usuario?.id_usuario
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

      const { nombres, email, password, id_rol } = req.body;

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
      const password_hash = await bcrypt.hash(password, 10);

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
        creado_por: req.usuario?.id_usuario
      });

      res.status(201).json({
        mensaje: 'Usuario creado exitosamente',
        usuario: {
          id_usuario: nuevoUsuario.id_usuario,
          nombres: nuevoUsuario.nombres,
          email: nuevoUsuario.email,
          id_rol: nuevoUsuario.id_rol,
          fyh_creacion: nuevoUsuario.fyh_creacion
        }
      });

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
      const { nombres, email, password, id_rol } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado'
        });
      }

      // Verificar permisos: empleados solo pueden editar su propia cuenta (sin cambiar rol)
      const esAdmin = req.usuario?.id_rol === 1;
      const esPropio = req.usuario?.id_usuario === parseInt(id);

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
        usuario.password_user = await bcrypt.hash(password, 10);
      }
      usuario.fyh_actualizacion = new Date();

      await usuario.save();

      logger.info('Usuario actualizado', {
        id_usuario: usuario.id_usuario,
        actualizado_por: req.usuario?.id_usuario,
        campos_actualizados: { nombres: !!nombres, email: !!email, password: !!password, id_rol: !!id_rol }
      });

      res.json({
        mensaje: 'Usuario actualizado exitosamente',
        usuario: {
          id_usuario: usuario.id_usuario,
          nombres: usuario.nombres,
          email: usuario.email,
          id_rol: usuario.id_rol,
          fyh_actualizacion: usuario.fyh_actualizacion
        }
      });

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
      if (req.usuario?.id_usuario === parseInt(id)) {
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

      await usuario.destroy();

      logger.info('Usuario eliminado', {
        id_usuario_eliminado: id,
        eliminado_por: req.usuario?.id_usuario
      });

      res.json({
        mensaje: 'Usuario eliminado exitosamente'
      });

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
      const whereClause: any = {};
      if (search) {
        whereClause[Op.or] = [
          { nombre_cliente: { [Op.like]: `%${search}%` } },
          { apellido_cliente: { [Op.like]: `%${search}%` } },
          { email_cliente: { [Op.like]: `%${search}%` } },
          { celular_cliente: { [Op.like]: `%${search}%` } }
        ];
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
        usuario_solicitante: req.usuario?.id_usuario,
        total: count,
        limit,
        offset,
        search
      });

      res.json({
        clientes,
        total: count,
        limit,
        offset
      });

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
        solicitante: req.usuario?.id_usuario
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
      } = req.body;

      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return res.status(404).json({
          mensaje: 'Cliente no encontrado'
        });
      }

      // Actualizar campos permitidos
      if (nombre_cliente !== undefined) cliente.nombre_cliente = nombre_cliente;
      if (apellido_cliente !== undefined) cliente.apellido_cliente = apellido_cliente;
      if (celular_cliente !== undefined) cliente.celular_cliente = celular_cliente;
      if (nit_ci_cliente !== undefined) cliente.nit_ci_cliente = nit_ci_cliente;

      // Solo admin puede cambiar estados
      if (req.usuario?.id_rol === 1) {
        if (is_web_enabled !== undefined) cliente.is_web_enabled = is_web_enabled;
        if (email_verified !== undefined) cliente.email_verified = email_verified;
      }

      cliente.fyh_actualizacion = new Date();
      await cliente.save();

      logger.info('Cliente actualizado desde panel admin', {
        id_cliente: id,
        actualizado_por: req.usuario?.id_usuario
      });

      res.json({
        mensaje: 'Cliente actualizado exitosamente',
        cliente: {
          id_cliente: cliente.id_cliente,
          nombre_cliente: cliente.nombre_cliente,
          apellido_cliente: cliente.apellido_cliente,
          email_cliente: cliente.email_cliente,
          celular_cliente: cliente.celular_cliente,
          nit_ci_cliente: cliente.nit_ci_cliente,
          is_web_enabled: cliente.is_web_enabled,
          email_verified: cliente.email_verified
        }
      });

    } catch (error) {
      logger.error('Error al actualizar cliente:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        id_cliente: req.params.id
      });
      res.status(500).json({
        mensaje: 'Error al actualizar cliente'
      });
    }
  }
}

export default UsuarioAdminController;
