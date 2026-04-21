import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import db from '../config/database.js';
import Permiso from '../models/Permiso.js';
import Rol from '../models/Rol.js';
import Usuario from '../models/Usuario.js';
import logger from '../services/loggerService.js';
import { ROLES } from '../constants/roles.js';

interface PermisoResponse {
  id_permiso: number;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  accion: string;
}

interface RolPermisoResponse extends PermisoResponse {
  asignado: boolean;
}

interface PermisosPorModulo {
  [modulo: string]: RolPermisoResponse[];
}

interface AsignarPermisosRequest {
  id_rol: number;
  permisos: number[];
}

class PermisoController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
      }

      const permisos = await Permiso.findAll({
        order: [['modulo', 'ASC'], ['accion', 'ASC'], ['nombre', 'ASC']]
      });

      const permisosAgrupados = permisos.reduce((acc: PermisosPorModulo, permiso: Permiso) => {
        const data: PermisoResponse = {
          id_permiso: permiso.id_permiso,
          nombre: permiso.nombre,
          descripcion: permiso.descripcion,
          modulo: permiso.modulo,
          accion: permiso.accion
        };
        if (!acc[permiso.modulo]) {
          acc[permiso.modulo] = [];
        }
        acc[permiso.modulo].push({ ...data, asignado: false });
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        data: permisosAgrupados,
        total: permisos.length
      });
    } catch (error) {
      logger.error('Error en PermisoController.getAll:', error);
      return res.status(500).json({ error: 'Error al obtener permisos' });
    }
  }

  static async getByRol(req: Request, res: Response): Promise<Response> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
      }

      const { id_rol } = req.params;

      const rol = await Rol.findByPk(id_rol, {
        include: [{
          model: Permiso,
          as: 'permisos',
          attributes: ['id_permiso', 'nombre', 'descripcion', 'modulo', 'accion']
        }]
      });

      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      const todosPermisos = await Permiso.findAll({
        order: [['modulo', 'ASC'], ['accion', 'ASC']]
      });

      const permisosAsignados = (rol as unknown as { permisos?: Permiso[] }).permisos || [];
      const idsAsignados = new Set(permisosAsignados.map(p => p.id_permiso));

      const permisosAgrupados: PermisosPorModulo = {};

      for (const permiso of todosPermisos) {
        const data: RolPermisoResponse = {
          id_permiso: permiso.id_permiso,
          nombre: permiso.nombre,
          descripcion: permiso.descripcion,
          modulo: permiso.modulo,
          accion: permiso.accion,
          asignado: idsAsignados.has(permiso.id_permiso)
        };
        if (!permisosAgrupados[permiso.modulo]) {
          permisosAgrupados[permiso.modulo] = [];
        }
        permisosAgrupados[permiso.modulo].push(data);
      }

      return res.status(200).json({
        success: true,
        data: {
          rol: {
            id_rol: rol.id_rol,
            rol: rol.rol
          },
          permisos: permisosAgrupados
        }
      });
    } catch (error) {
      logger.error('Error en PermisoController.getByRol:', error);
      return res.status(500).json({ error: 'Error al obtener permisos del rol' });
    }
  }

  static async getAllWithStatus(req: Request, res: Response): Promise<Response> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
      }

      const { id_rol } = req.query;

      if (!id_rol) {
        return res.status(400).json({ error: 'Se requiere id_rol' });
      }

      const rol = await Rol.findByPk(Number(id_rol));
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      const permisosAsignados = await Permiso.findAll({
        include: [{
          model: Rol,
          as: 'roles',
          where: { id_rol: Number(id_rol) },
          attributes: [],
          through: { attributes: [] }
        }],
        attributes: ['id_permiso', 'nombre', 'descripcion', 'modulo', 'accion']
      });

      const idsAsignados = new Set(permisosAsignados.map(p => p.id_permiso));

      const todosPermisos = await Permiso.findAll({
        order: [['modulo', 'ASC'], ['accion', 'ASC']]
      });

      const permisosResponse: PermisoResponse[] = todosPermisos.map(p => ({
        id_permiso: p.id_permiso,
        nombre: p.nombre,
        descripcion: p.descripcion,
        modulo: p.modulo,
        accion: p.accion
      }));

      return res.status(200).json({
        success: true,
        data: {
          permisos: permisosResponse,
          asignados: Array.from(idsAsignados)
        }
      });
    } catch (error) {
      logger.error('Error en PermisoController.getAllWithStatus:', error);
      return res.status(500).json({ error: 'Error al obtener permisos' });
    }
  }

  static async syncPermisos(req: Request, res: Response): Promise<Response> {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
      }

      const { id_rol, permisos }: AsignarPermisosRequest = req.body;

      if (!id_rol || !Array.isArray(permisos)) {
        return res.status(400).json({ error: 'Se requiere id_rol y array de permisos' });
      }

      const rol = await Rol.findByPk(id_rol);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      if (Number(id_rol) === ROLES.ADMIN) {
        return res.status(403).json({ error: 'No se pueden modificar los permisos del administrador' });
      }

      // Eliminar permisos actuales y agregar los nuevos
      await db.query('DELETE FROM tb_roles_permisos WHERE id_rol = ?', {
        replacements: [id_rol]
      });

      if (permisos.length > 0) {
        const valores = permisos.map((idPermiso: number) => `(${id_rol}, ${idPermiso})`).join(', ');
        await db.query(`INSERT INTO tb_roles_permisos (id_rol, id_permiso) VALUES ${valores}`);
      }

      logger.info(`Permisos sincronizados para rol ${id_rol} por usuario`);

      return res.status(200).json({
        success: true,
        mensaje: 'Permisos actualizados correctamente'
      });
    } catch (error) {
      logger.error('Error en PermisoController.syncPermisos:', error);
      return res.status(500).json({ error: 'Error al sincronizar permisos' });
    }
  }

  static async getRolesConPermisos(req: Request, res: Response): Promise<Response> {
    try {
      const roles = await Rol.findAll({
        include: [{
          model: Permiso,
          as: 'permisos',
          attributes: ['id_permiso', 'nombre', 'modulo', 'accion'],
          through: { attributes: [] }
        }],
        order: [['id_rol', 'ASC']]
      });

      const rolesResponse = roles.map(rol => ({
        id_rol: rol.id_rol,
        rol: rol.rol,
        cantidad_permisos: (rol as unknown as { permisos?: Permiso[] }).permisos?.length || 0
      }));

      return res.status(200).json({
        success: true,
        data: rolesResponse
      });
    } catch (error) {
      logger.error('Error en PermisoController.getRolesConPermisos:', error);
      return res.status(500).json({ error: 'Error al obtener roles' });
    }
  }

  static async tienePermiso(usuarioId: number, nombrePermiso: string): Promise<boolean> {
    try {
      const usuario = await Usuario.findByPk(usuarioId, {
        include: [{
          model: Rol,
          as: 'Rol',
          include: [{
            model: Permiso,
            as: 'permisos',
            where: { nombre: nombrePermiso },
            required: true,
            through: { attributes: [] }
          }]
        }]
      });

      if (!usuario) return false;

      if (usuario.id_rol === ROLES.ADMIN) return true;

      const rol = (usuario as unknown as { Rol?: Rol & { permisos?: Permiso[] } }).Rol;
      return rol?.permisos?.length ? rol.permisos.length > 0 : false;
    } catch (error) {
      logger.error('Error en tienePermiso:', error);
      return false;
    }
  }
}

export default PermisoController;