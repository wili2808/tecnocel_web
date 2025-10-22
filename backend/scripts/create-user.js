/**
 * Script para crear nuevos usuarios en tb_usuarios
 *
 * Este script te permite crear usuarios administradores o vendedores
 * con contraseñas hasheadas correctamente usando bcrypt.
 *
 * Uso: node scripts/create-user.js
 */

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`)
};

/**
 * Configuración del usuario a crear
 * MODIFICA ESTOS VALORES según tus necesidades
 */
const NUEVO_USUARIO = {
  nombres: 'Admin Test',              // Nombre completo del usuario
  email: 'admin@tecnocel.com',        // Email (debe ser único)
  contrasena: 'admin123',             // Contraseña (mínimo 6 caracteres)
  id_rol: 1                           // 1 = ADMINISTRADOR, 3 = VENDEDOR
};

async function createUser() {
  console.log('\n' + '='.repeat(70));
  console.log('  CREAR NUEVO USUARIO EN TB_USUARIOS');
  console.log('='.repeat(70) + '\n');

  try {
    // Validaciones básicas
    if (!NUEVO_USUARIO.nombres || NUEVO_USUARIO.nombres.length < 3) {
      log.error('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (!NUEVO_USUARIO.email || !NUEVO_USUARIO.email.includes('@')) {
      log.error('Email inválido');
      return;
    }

    if (!NUEVO_USUARIO.contrasena || NUEVO_USUARIO.contrasena.length < 6) {
      log.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (![1, 3].includes(NUEVO_USUARIO.id_rol)) {
      log.error('id_rol debe ser 1 (ADMINISTRADOR) o 3 (VENDEDOR)');
      return;
    }

    // Conectar a la base de datos
    log.step('Conectando a la base de datos...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_tecnocel_v4'
    });

    log.success('Conectado a la base de datos\n');

    // Verificar que el email no existe
    log.step('Verificando que el email no esté en uso...');
    const [existente] = await connection.execute(
      'SELECT email FROM tb_usuarios WHERE email = ?',
      [NUEVO_USUARIO.email]
    );

    if (existente.length > 0) {
      log.error(`Ya existe un usuario con el email: ${NUEVO_USUARIO.email}`);
      log.warn('Usa otro email o actualiza la contraseña del usuario existente');
      await connection.end();
      return;
    }

    log.success('Email disponible\n');

    // Obtener nombre del rol
    const [roles] = await connection.execute(
      'SELECT rol FROM tb_roles WHERE id_rol = ?',
      [NUEVO_USUARIO.id_rol]
    );

    const nombreRol = roles[0]?.rol || 'DESCONOCIDO';

    // Mostrar información del usuario a crear
    console.log(colors.cyan + '📋 Información del usuario a crear:' + colors.reset);
    console.log('─'.repeat(70));
    console.log(`  Nombre:     ${colors.bold}${NUEVO_USUARIO.nombres}${colors.reset}`);
    console.log(`  Email:      ${colors.bold}${NUEVO_USUARIO.email}${colors.reset}`);
    console.log(`  Contraseña: ${colors.bold}${NUEVO_USUARIO.contrasena}${colors.reset}`);
    console.log(`  Rol:        ${colors.bold}${nombreRol}${colors.reset} (ID: ${NUEVO_USUARIO.id_rol})`);
    console.log('─'.repeat(70) + '\n');

    // Hashear la contraseña
    log.step('Hasheando contraseña con bcrypt (10 rounds)...');
    const hashedPassword = await bcrypt.hash(NUEVO_USUARIO.contrasena, 10);
    log.success('Contraseña hasheada correctamente\n');

    // Generar token aleatorio (puede estar vacío o tener un valor)
    const token = crypto.randomBytes(16).toString('hex');

    // Insertar usuario en la base de datos
    log.step('Insertando usuario en la base de datos...');
    const [result] = await connection.execute(
      `INSERT INTO tb_usuarios (nombres, email, password_user, token, id_rol, fyh_creacion, fyh_actualizacion)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [NUEVO_USUARIO.nombres, NUEVO_USUARIO.email, hashedPassword, token, NUEVO_USUARIO.id_rol]
    );

    console.log('\n' + '='.repeat(70));
    log.success('¡Usuario creado exitosamente!');
    console.log('='.repeat(70) + '\n');

    // Mostrar credenciales para usar
    console.log(colors.green + colors.bold + '🎉 CREDENCIALES PARA USAR:' + colors.reset);
    console.log('─'.repeat(70));
    console.log(`  ID Usuario: ${colors.cyan}${result.insertId}${colors.reset}`);
    console.log(`  Email:      ${colors.cyan}${NUEVO_USUARIO.email}${colors.reset}`);
    console.log(`  Contraseña: ${colors.cyan}${NUEVO_USUARIO.contrasena}${colors.reset}`);
    console.log(`  Rol:        ${colors.cyan}${nombreRol}${colors.reset}`);
    console.log('─'.repeat(70) + '\n');

    // Instrucciones de uso
    console.log(colors.yellow + '📝 Ahora puedes usar estas credenciales en:' + colors.reset);
    console.log(`
  1. ${colors.bold}Script de prueba test-create-product.js:${colors.reset}
     Edita línea 44:
     ${colors.blue}email: '${NUEVO_USUARIO.email}',
     contrasena: '${NUEVO_USUARIO.contrasena}'${colors.reset}

  2. ${colors.bold}Login de API (POST /api/usuarios/login):${colors.reset}
     ${colors.blue}curl -X POST http://localhost:3000/api/usuarios/login \\
       -H "Content-Type: application/json" \\
       -d '{"email":"${NUEVO_USUARIO.email}","contrasena":"${NUEVO_USUARIO.contrasena}"}'${colors.reset}

  3. ${colors.bold}Herramientas de testing:${colors.reset}
     - Postman
     - Thunder Client
     - Insomnia
`);

    // Mostrar todos los usuarios actuales
    log.step('Usuarios actuales en la base de datos:');
    const [usuarios] = await connection.execute(
      `SELECT u.id_usuario, u.nombres, u.email, r.rol
       FROM tb_usuarios u
       LEFT JOIN tb_roles r ON u.id_rol = r.id_rol
       ORDER BY u.id_usuario`
    );
    console.table(usuarios);

    await connection.end();

  } catch (error) {
    log.error('Error al crear usuario: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
createUser();
