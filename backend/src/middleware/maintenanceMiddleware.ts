import { Request, Response, NextFunction } from 'express';
import Configuracion from '../models/Configuracion.js';
import logger from '../services/loggerService.js';
import { ROLES } from '../constants/roles.js';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

/**
 * Middleware para bloquear el acceso cuando el sitio está en modo mantenimiento.
 * Permite el acceso solo a usuarios con roles administrativos (ADMIN, GERENTE, VENDEDOR).
 * Las rutas de administración (/api/usuarios, /api/configuracion, etc.) deben ser accesibles
 * para que el personal pueda desactivar el modo mantenimiento.
 */
export const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Verificar si es una ruta que SIEMPRE debe estar disponible
    // - El dashboard administrativo (/api/configuracion, /api/usuarios, etc.)
    // - El login de administración (/api/usuarios/login)
    // - Las imágenes (para que el personal las vea)
    const publicPaths = [
      '/api/configuracion',
      '/api/usuarios/login',
      '/api/images',
      '/api/comment-images',
      '/api/marca-images',
      '/api/tipo-cambio'
    ];

    const isPublicPath = publicPaths.some(path => req.originalUrl.startsWith(path));

    // Si es una ruta administrativa crítica o de imágenes, dejamos pasar
    if (isPublicPath) {
      return next();
    }

    // 2. Obtener el estado del modo mantenimiento desde la base de datos
    const maintenanceConfig = await Configuracion.findByPk('maintenance_mode');
    const valorMantenimiento = maintenanceConfig?.valor;
    const isMaintenanceMode = valorMantenimiento === '1' || 
                             String(valorMantenimiento).toLowerCase() === 'true';

    if (!isMaintenanceMode) {
      return next();
    }

    // 3. Si el modo mantenimiento está activo, verificar si es personal del sistema
    const adminTokenHeader = req.headers['x-admin-token'] as string;
    const authHeader = req.headers.authorization;
    const token = adminTokenHeader || authHeader?.split(' ')[1];
    
    if (token) {
      try {
        const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;
        if (!JWT_ADMIN_SECRET) {
          logger.error('CRÍTICO: JWT_ADMIN_SECRET no definido en .env - Bypass no funcionará');
          throw new Error('Secret not configured');
        }

        const decodificado = jwt.verify(token, JWT_ADMIN_SECRET) as any;
        const usuarioId = decodificado.sub;
        
        const usuario = await Usuario.findByPk(usuarioId);
        
        if (usuario && [ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR].includes(usuario.id_rol as any)) {
          logger.info(`Bypass de mantenimiento exitoso para administrador: ${usuario.email} (${req.originalUrl})`);
          req.usuario = {
            id: usuario.id_usuario,
            nombres: usuario.nombres,
            email: usuario.email,
            idRol: usuario.id_rol
          };
          return next();
        } else {
          logger.warn(`Bypass RECHAZADO: Usuario existe pero no es personal del sistema o rol insuficiente`, { 
            email: usuario?.email, 
            rol: usuario?.id_rol,
            path: req.originalUrl 
          });
        }
      } catch (e) {
        logger.debug(`Fallo verificación de token en modo mantenimiento: ${e instanceof Error ? e.message : 'Error desconocido'}`);
        // Puede ser un token de cliente o expirado, continuamos al bloqueo
      }
    }

    // 4. Bloquear el acceso para clientes y usuarios anónimos
    logger.warn(`ACCESO DENEGADO (Mantenimiento): ${req.method} ${req.originalUrl}`);
    
    return res.status(503).json({
      error: 'MODO_MANTENIMIENTO',
      mensaje: 'El sitio se encuentra actualmente en mantenimiento.',
      retryAfter: 3600
    });

  } catch (error) {
    logger.error('Error en maintenanceMiddleware:', error);
    // En caso de error al consultar la configuración, permitimos el acceso por seguridad
    next();
  }
};
