import { Request, Response, NextFunction } from 'express';

interface RegistrationData {
  email: string;
  contrasena: string;
  nombre: string;
  apellido: string;
}

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { email, contrasena, nombre, apellido }: RegistrationData = req.body;

  // Validar que todos los campos requeridos estén presentes
  if (!email || !contrasena || !nombre || !apellido) {
    return res.status(400).json({
      error: 'Todos los campos son obligatorios'
    });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'El formato del correo electrónico no es válido'
    });
  }

  // Validar longitud de la contraseña
  if (contrasena.length < 6) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  // Validar nombres
  if (nombre.length < 2 || apellido.length < 2) {
    return res.status(400).json({
      error: 'El nombre y apellido deben tener al menos 2 caracteres'
    });
  }

  next();
};