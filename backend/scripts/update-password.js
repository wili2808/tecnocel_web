/**
 * Script para actualizar la contraseña de un usuario
 *
 * Como las contraseñas están hasheadas con bcrypt, no se pueden recuperar.
 * Este script te permite establecer una nueva contraseña para cualquier usuario.
 *
 * Uso: node scripts/update-password.js
 */

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`)
};

// Interfaz para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function updatePassword() {
  console.log('\n' + '='.repeat(60));
  console.log('  ACTUALIZAR CONTRASEÑA DE USUARIO');
  console.log('='.repeat(60) + '\n');

  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_tecnocel_v4'
    });

    log.success('Conectado a la base de datos\n');

    // Mostrar usuarios disponibles
    log.step('Usuarios disponibles:');
    const [usuarios] = await connection.execute(
      'SELECT id_usuario, nombres, email, id_rol FROM tb_usuarios ORDER BY id_usuario'
    );

    console.table(usuarios);

    // Pedir al usuario que elija
    console.log('');
    const email = await question('Ingresa el email del usuario (o presiona Enter para usar el primero): ');
    const emailSeleccionado = email.trim() || usuarios[0]?.email;

    if (!emailSeleccionado) {
      log.error('No hay usuarios en la base de datos');
      await connection.end();
      rl.close();
      return;
    }

    // Verificar que el usuario existe
    const [usuarioExiste] = await connection.execute(
      'SELECT id_usuario, nombres, email FROM tb_usuarios WHERE email = ?',
      [emailSeleccionado]
    );

    if (usuarioExiste.length === 0) {
      log.error(`No existe un usuario con email: ${emailSeleccionado}`);
      await connection.end();
      rl.close();
      return;
    }

    const usuario = usuarioExiste[0];
    console.log('');
    log.info(`Usuario seleccionado: ${usuario.nombres} (${usuario.email})`);

    // Pedir nueva contraseña
    const nuevaContrasena = await question('\nIngresa la nueva contraseña (mínimo 6 caracteres): ');

    if (nuevaContrasena.length < 6) {
      log.error('La contraseña debe tener al menos 6 caracteres');
      await connection.end();
      rl.close();
      return;
    }

    // Confirmar
    const confirmacion = await question(`\n¿Confirmas actualizar la contraseña de "${usuario.email}"? (s/n): `);

    if (confirmacion.toLowerCase() !== 's' && confirmacion.toLowerCase() !== 'si') {
      log.warn('Operación cancelada');
      await connection.end();
      rl.close();
      return;
    }

    // Hashear la contraseña
    log.step('\nHasheando contraseña con bcrypt...');
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar en la base de datos
    log.step('Actualizando en la base de datos...');
    await connection.execute(
      'UPDATE tb_usuarios SET password_user = ?, fyh_actualizacion = NOW() WHERE email = ?',
      [hashedPassword, emailSeleccionado]
    );

    console.log('\n' + '='.repeat(60));
    log.success('¡Contraseña actualizada exitosamente!');
    console.log('='.repeat(60));

    console.log('\n' + colors.cyan + 'Credenciales para usar:' + colors.reset);
    console.log(`  Email:      ${colors.green}${usuario.email}${colors.reset}`);
    console.log(`  Contraseña: ${colors.green}${nuevaContrasena}${colors.reset}`);

    console.log('\n' + colors.yellow + 'Ahora puedes usar estas credenciales en:' + colors.reset);
    console.log('  - test-create-product.js (línea 44)');
    console.log('  - Login de admin en el frontend');
    console.log('  - Cualquier herramienta de testing (Postman, Thunder Client, etc.)\n');

    await connection.end();
    rl.close();

  } catch (error) {
    log.error('Error: ' + error.message);
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

updatePassword();
