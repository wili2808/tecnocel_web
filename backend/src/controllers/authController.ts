import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Usuario, {RolUsuario} from '../models/Usuario.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';
const isDev = process.env.NODE_ENV !== 'production';

export const registro = async (req: Request, res: Response) => {
  try {
    const { email, contrasena, nombre, apellido, telefono = '', rol = RolUsuario.CLIENTE } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      logger.warn(`Intento de registro con email ya registrado: ${email}`);
      return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado.' });
    }

    // Crear nuevo usuario
    const usuario = await Usuario.create({
      email,
      contrasena,
      nombre,
      apellido,
      telefono,
      rol
    });

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`Usuario registrado exitosamente: ${email}`);

    res.status(201).json({
      mensaje: '¡Cuenta creada exitosamente! Bienvenido/a.',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        telefono: usuario.telefono
      }
    });

    if (isDev) {
      console.log('Respuesta del registro:', {
        mensaje: 'Usuario registrado exitosamente',
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rol: usuario.rol,
          telefono: usuario.telefono
        }
      });
    }
  } catch (error) {
    logger.error(`Error en el registro: ${error}`);
    res.status(500).json({ mensaje: 'Error al registrar el usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, contrasena } = req.body;

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      logger.warn(`Intento de login fallido: usuario no encontrado (${email})`);
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }

    // Verificar contraseña
    const contrasenaValida = await usuario.compararContrasena(contrasena);
    if (!contrasenaValida) {
      logger.warn(`Intento de login fallido: contraseña incorrecta para usuario (${email})`);
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`Login exitoso para usuario: ${email}`);

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        telefono: usuario.telefono
      }
    });
  } catch (error) {
    logger.error(`Error en el login: ${error}`);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
};
