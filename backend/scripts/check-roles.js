import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkRoles() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_tecnocel_v4'
    });

    console.log('\n=== ROLES DISPONIBLES ===\n');
    const [roles] = await connection.execute('SELECT * FROM tb_roles ORDER BY id_rol');
    console.table(roles);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRoles();
