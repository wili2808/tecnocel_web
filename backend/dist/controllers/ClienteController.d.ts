import { Request, Response } from 'express';
export default class ClienteController {
    /**
     * Registro de cliente
     */
    static register(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Verificación de email
     */
    static verifyEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Login de cliente
     */
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Solicitud de recuperación de contraseña
     */
    static forgotPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Restablecimiento de contraseña
     */
    static resetPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Verificación de token JWT para mantener sesión activa
     */
    static verifyToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
