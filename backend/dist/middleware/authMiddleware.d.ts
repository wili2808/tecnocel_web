/**
 * Middleware de autenticación y autorización para la aplicación Tecnocel
 * Este archivo contiene las funciones necesarias para verificar tokens JWT y roles de usuario
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Interfaz que define la estructura del payload del token JWT
 */
export interface TokenPayload {
    id_usuario: number;
    email: string;
    id_rol: number;
}
/**
 * Extensión de la interfaz Request de Express para incluir el usuario autenticado
 */
declare global {
    namespace Express {
        interface Request {
            usuario?: any;
        }
    }
}
/**
 * Middleware para verificar la autenticación mediante token JWT
 * @param req - Objeto Request de Express
 * @param res - Objeto Response de Express
 * @param next - Función Next de Express
 * @returns void
 */
export declare const verificarToken: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware para verificar los roles de usuario
 * @param roles - Array de roles permitidos para acceder a la ruta
 * @returns Middleware que verifica si el usuario tiene el rol adecuado
 */
export declare const verificarRol: (roles: number[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware para verificar la autenticación de clientes mediante token JWT
 */
export declare const verificarTokenCliente: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
