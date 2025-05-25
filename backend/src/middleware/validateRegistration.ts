/**
 * Middleware de validación para el registro de usuarios
 * Este archivo contiene las funciones necesarias para validar los datos de registro
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Interfaz que define la estructura de los datos de registro
 */
interface RegistrationData {
  email: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

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
export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, contrasena, nombre, apellido, telefono }: RegistrationData = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!email || !contrasena || !nombre || !apellido) {
      logger.warn('Intento de registro con campos incompletos', { 
        email: !!email, 
        contrasena: !!contrasena, 
        nombre: !!nombre, 
        apellido: !!apellido 
      });
      return res.status(400).json({
        error: 'Todos los campos son obligatorios',
        detalles: {
          email: !email ? 'El correo electrónico es requerido' : null,
          contrasena: !contrasena ? 'La contraseña es requerida' : null,
          nombre: !nombre ? 'El nombre es requerido' : null,
          apellido: !apellido ? 'El apellido es requerido' : null
        }
      });
    }

    // Validar formato de email usando expresión regular
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Intento de registro con email inválido', { email });
      return res.status(400).json({
        error: 'El formato del correo electrónico no es válido',
        detalles: 'El correo debe tener un formato válido (ejemplo@dominio.com)'
      });
    }

    // Validar longitud y complejidad de la contraseña
    if (contrasena.length < 8) {
      logger.warn('Intento de registro con contraseña muy corta');
      return res.status(400).json({
        error: 'La contraseña es muy débil',
        detalles: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Validar que la contraseña contenga al menos una letra y un número
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(contrasena)) {
      logger.warn('Intento de registro con contraseña sin complejidad suficiente');
      return res.status(400).json({
        error: 'La contraseña es muy débil',
        detalles: 'La contraseña debe contener al menos una letra y un número'
      });
    }

    // Validar longitud y formato de nombre y apellido
    if (nombre.length < 2 || apellido.length < 2) {
      logger.warn('Intento de registro con nombre/apellido muy corto', { 
        nombreLength: nombre.length, 
        apellidoLength: apellido.length 
      });
      return res.status(400).json({
        error: 'Nombre o apellido inválido',
        detalles: 'El nombre y apellido deben tener al menos 2 caracteres'
      });
    }

    // Validar que nombre y apellido solo contengan letras y espacios
    const nameRegex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/;
    if (!nameRegex.test(nombre) || !nameRegex.test(apellido)) {
      logger.warn('Intento de registro con caracteres inválidos en nombre/apellido');
      return res.status(400).json({
        error: 'Nombre o apellido inválido',
        detalles: 'El nombre y apellido solo pueden contener letras y espacios'
      });
    }

    // Validar formato de teléfono si se proporciona
    if (telefono) {
      const phoneRegex = /^\+?[\d\s-]{8,15}$/;
      if (!phoneRegex.test(telefono)) {
        logger.warn('Intento de registro con teléfono inválido', { telefono });
        return res.status(400).json({
          error: 'Formato de teléfono inválido',
          detalles: 'El teléfono debe tener entre 8 y 15 dígitos y puede incluir +, espacios y guiones'
        });
      }
    }

    logger.debug('Validación de registro exitosa', { email });
    next();
  } catch (error) {
    logger.error('Error en la validación de registro:', error);
    return res.status(500).json({
      error: 'Error en la validación de datos',
      detalles: 'Ocurrió un error al validar los datos de registro'
    });
  }
};