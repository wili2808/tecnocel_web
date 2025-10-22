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

    console.log('\n=== CATEGORÍAS ===');
    const [categorias] = await connection.execute('SELECT * FROM tb_categorias ORDER BY id_categoria LIMIT 10');
    console.table(categorias);

    console.log('\n=== MARCAS ===');
    const [marcas] = await connection.execute('SELECT * FROM tb_marcas ORDER BY id_marca LIMIT 10');
    console.table(marcas);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
