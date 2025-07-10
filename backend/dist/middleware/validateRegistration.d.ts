/**
 * Middleware de validación para el registro de usuarios
 * Este archivo contiene las funciones necesarias para validar los datos de registro
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Middleware para validar los datos de registro de usuarios
 * Realiza validaciones de:
 * - Campos requeridos
 * - Formato de email
 * - Longitud y complejidad de contraseña
 * - Longitud y formato de nombre y apellido
 * - Formato de teléfono (opcional)
 *
 * @param req - Objeto Request de Express
 * @param res - Objeto Response de Express
 * @param next - Función Next de Express
 * @returns void
 */
export declare const validateRegistration: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateClienteRegistration: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
