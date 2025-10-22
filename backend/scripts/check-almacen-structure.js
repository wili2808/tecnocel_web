import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_tecnocel_v4'
    });

    console.log('\n=== ESTRUCTURA DE TB_ALMACEN ===\n');
    const [columns] = await connection.execute('DESCRIBE tb_almacen');
    console.table(columns);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
