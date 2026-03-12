/**
 * @file Middleware de rate limiting para endpoints de autenticación
 *
 * Protege los endpoints de login contra ataques de fuerza bruta y
 * credential stuffing limitando intentos por IP en una ventana de tiempo.
 *
 * Configuración:
 * - Clientes: 5 intentos cada 15 minutos por IP
 * - Usuarios del sistema (admin): 5 intentos cada 15 minutos por IP
 *
 * IMPORTANTE: En producción con múltiples instancias del servidor,
 * reemplazar el Map en memoria por Redis para compartir estado.
 *
 * @module loginRateLimit
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../services/loggerService.js';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Obtiene la IP del cliente considerando proxies
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Limpia entradas expiradas del store para evitar memory leaks
 */
function limpiarEntradasExpiradas(): void {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    if (now - entry.windowStart > VENTANA_MS) {
      loginAttempts.delete(key);
    }
  }
}

/**
 * Middleware de rate limiting para endpoints de login
 *
 * Permite máximo 5 intentos de login por IP cada 15 minutos.
 * Los intentos exitosos no se cuentan (el contador solo sube en fallos,
 * pero la ventana se reinicia al pasar los 15 minutos).
 *
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns 429 si se superan los intentos permitidos
 */
export const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req);
  const key = `login_${ip}`;
  const now = Date.now();

  // Limpiar entradas viejas cada 100 requests para evitar memory leaks
  if (loginAttempts.size > 500) {
    limpiarEntradasExpiradas();
  }

  const entry = loginAttempts.get(key);

  // Si no hay entrada o la ventana expiró, crear una nueva
  if (!entry || now - entry.windowStart > VENTANA_MS) {
    loginAttempts.set(key, { count: 1, windowStart: now });
    return next();
  }

  // Ventana activa — incrementar contador
  entry.count++;
  loginAttempts.set(key, entry);

  if (entry.count > MAX_INTENTOS) {
    const tiempoRestanteMs = VENTANA_MS - (now - entry.windowStart);
    const tiempoRestanteSeg = Math.ceil(tiempoRestanteMs / 1000);

    logger.warn('Rate limit de login excedido', {
      ip,
      intentos: entry.count,
      path: req.path,
      reintentar_en_segundos: tiempoRestanteSeg
    });

    return res.status(429).json({
      mensaje: 'Demasiados intentos de inicio de sesión. Intenta nuevamente más tarde.',
      reintentar_en: tiempoRestanteSeg
    });
  }

  next();
};
