/**
 * Script auxiliar para verificar usuarios en la base de datos
 *
 * Este script muestra todos los usuarios en tb_usuarios para que
 * puedas verificar qué usuarios existen y configurar las credenciales
 * correctas en el script de prueba.
 *
 * Uso: node scripts/check-usuarios.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsuarios() {
  console.log('\n' + '='.repeat(60));
  console.log('  VERIFICACIÓN DE USUARIOS EN LA BASE DE DATOS');
  console.log('='.repeat(60) + '\n');

  try {
    // Crear conexión
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_tecnocel_v4'
    });

    console.log('✓ Conectado a la base de datos\n');

    // Obtener usuarios
    const [usuarios] = await connection.execute(
      'SELECT id_usuario, nombres, email, id_rol FROM tb_usuarios ORDER BY id_usuario'
    );

    if (usuarios.length === 0) {
      console.log('⚠ No hay usuarios en la tabla tb_usuarios');
      console.log('\nPara crear un usuario administrador, ejecuta:');
      console.log('node scripts/create-admin-user.js\n');
    } else {
      console.log(`✓ Se encontraron ${usuarios.length} usuario(s):\n`);
      console.table(usuarios);

      console.log('\n' + '-'.repeat(60));
      console.log('NOTAS:');
      console.log('- id_rol 1 = Administrador');
      console.log('- id_rol 2 = Empleado');
      console.log('\nPara usar en test-create-product.js, configura:');
      console.log('  email: "' + (usuarios[0]?.email || 'email@example.com') + '"');
      console.log('  contrasena: "tu_contraseña"\n');
    }

    await connection.end();

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('\nVerifica que:');
    console.error('1. MySQL está corriendo');
    console.error('2. Las credenciales en .env son correctas');
    console.error('3. La base de datos existe\n');
  }
}

checkUsuarios();
