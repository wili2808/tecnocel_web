/**
 * Middleware de validación para el registro de usuarios
 * Este archivo contiene las funciones necesarias para validar los datos de registro
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../services/loggerService.js';
import Cliente from '../models/Cliente.js';

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

export const validateClienteRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.debug('Iniciando validación de registro de cliente', req.body);
    const { nombre_cliente, apellido_cliente, email_cliente, celular_cliente, nit_ci_cliente, contrasena } = req.body;
    // Validar campos obligatorios
    if (!nombre_cliente || !apellido_cliente || !email_cliente || !celular_cliente || !nit_ci_cliente || !contrasena) {
      logger.warn('Campos obligatorios faltantes en registro de cliente', {
        nombre_cliente: !!nombre_cliente,
        apellido_cliente: !!apellido_cliente,
        email_cliente: !!email_cliente,
        celular_cliente: !!celular_cliente,
        nit_ci_cliente: !!nit_ci_cliente,
        contrasena: !!contrasena
      });
      return res.status(400).json({
        error: 'Todos los campos son obligatorios',
        detalles: {
          nombre_cliente: !nombre_cliente ? 'El nombre es requerido' : null,
          apellido_cliente: !apellido_cliente ? 'El apellido es requerido' : null,
          email_cliente: !email_cliente ? 'El correo electrónico es requerido' : null,
          celular_cliente: !celular_cliente ? 'El celular es requerido' : null,
          nit_ci_cliente: !nit_ci_cliente ? 'El NIT/CI es requerido' : null,
          contrasena: !contrasena ? 'La contraseña es requerida' : null
        }
      });
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_cliente)) {
      logger.warn('Formato de email inválido en registro de cliente', { email_cliente });
      return res.status(400).json({
        error: 'El formato del correo electrónico no es válido',
        detalles: 'El correo debe tener un formato válido (ejemplo@dominio.com)'
      });
    }
    // Validar unicidad de email
    const existente = await Cliente.findOne({ where: { email_cliente, is_web_enabled: true } });
    if (existente) {
      logger.warn('Intento de registro con email ya registrado', { email_cliente });
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    // Validar longitud y complejidad de la contraseña
    if (contrasena.length < 8) {
      logger.warn('Contraseña muy corta en registro de cliente');
      return res.status(400).json({
        error: 'La contraseña es muy débil',
        detalles: 'La contraseña debe tener al menos 8 caracteres'
      });
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(contrasena)) {
      logger.warn('Contraseña sin complejidad suficiente en registro de cliente');
      return res.status(400).json({
        error: 'La contraseña es muy débil',
        detalles: 'La contraseña debe contener al menos una letra y un número'
      });
    }
    // Validar nombre_cliente solo letras y espacios
    const nameRegex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/;
    if (!nameRegex.test(nombre_cliente) || nombre_cliente.length < 2) {
      logger.warn('Nombre inválido en registro de cliente', { nombre_cliente });
      return res.status(400).json({
        error: 'Nombre inválido',
        detalles: 'El nombre debe tener al menos 2 caracteres y solo letras y espacios'
      });
    }

    // Validar apellido_cliente solo letras y espacios
    if (!nameRegex.test(apellido_cliente) || apellido_cliente.length < 2) {
      logger.warn('Apellido inválido en registro de cliente', { apellido_cliente });
      return res.status(400).json({
        error: 'Apellido inválido',
        detalles: 'El apellido debe tener al menos 2 caracteres y solo letras y espacios'
      });
    }
    // Validar celular_cliente (8-15 dígitos, puede incluir +, espacios y guiones)
    const phoneRegex = /^\+?[\d\s-]{8,15}$/;
    if (!phoneRegex.test(celular_cliente)) {
      logger.warn('Celular inválido en registro de cliente', { celular_cliente });
      return res.status(400).json({
        error: 'Formato de celular inválido',
        detalles: 'El celular debe tener entre 8 y 15 dígitos y puede incluir +, espacios y guiones'
      });
    }
    // Validar nit_ci_cliente (no vacío)
    if (typeof nit_ci_cliente !== 'string' || nit_ci_cliente.length < 1) {
      logger.warn('NIT/CI inválido en registro de cliente', { nit_ci_cliente });
      return res.status(400).json({
        error: 'NIT/CI inválido',
        detalles: 'El NIT/CI es requerido'
      });
    }
    logger.debug('Validación de registro de cliente exitosa', { email_cliente });
    next();
  } catch (error) {
    logger.error('Error en la validación de registro de cliente:', error);
    return res.status(500).json({
      error: 'Error en la validación de datos',
      detalles: 'Ocurrió un error al validar los datos de registro'
    });
  }
};