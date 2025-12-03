/**
 * Script para analizar datos actuales de la base de datos
 * Uso: node database/scripts/analizar_datos_actuales.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_tecnocel_v4',
};

async function analizarDatos() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');

    // ========== CONSULTAR CATEGORÍAS ==========
    console.log('📁 CATEGORÍAS EXISTENTES:');
    console.log('═'.repeat(80));
    const [categorias] = await connection.query(`
      SELECT
        c.id_categoria,
        c.nombre_categoria,
        COUNT(a.id_producto) as total_productos
      FROM tb_categorias c
      LEFT JOIN tb_almacen a ON c.id_categoria = a.id_categoria
      GROUP BY c.id_categoria
      ORDER BY c.id_categoria
    `);

    for (const cat of categorias) {
      console.log(`ID: ${cat.id_categoria} | ${cat.nombre_categoria.padEnd(30)} | Productos: ${cat.total_productos}`);
    }

    // ========== CONSULTAR MARCAS ==========
    console.log('\n🏷️  MARCAS EXISTENTES:');
    console.log('═'.repeat(80));
    const [marcas] = await connection.query(`
      SELECT
        m.id_marca,
        m.nombre_marca,
        COUNT(a.id_producto) as total_productos
      FROM tb_marcas m
      LEFT JOIN tb_almacen a ON m.id_marca = a.id_marca
      GROUP BY m.id_marca
      ORDER BY m.id_marca
    `);

    for (const marca of marcas) {
      console.log(`ID: ${marca.id_marca.toString().padEnd(3)} | ${marca.nombre_marca.padEnd(25)} | Productos: ${marca.total_productos}`);
    }

    // ========== CONSULTAR PRODUCTOS CON CATEGORÍAS Y MARCAS ==========
    console.log('\n📦 PRODUCTOS CON CATEGORÍAS Y MARCAS:');
    console.log('═'.repeat(120));
    const [productos] = await connection.query(`
      SELECT
        a.id_producto,
        a.codigo,
        a.nombre,
        c.nombre_categoria,
        m.nombre_marca
      FROM tb_almacen a
      LEFT JOIN tb_categorias c ON a.id_categoria = c.id_categoria
      LEFT JOIN tb_marcas m ON a.id_marca = m.id_marca
      ORDER BY a.id_producto
    `);

    console.log('ID | Código                    | Nombre (primeros 40 chars)                | Categoría              | Marca');
    console.log('-'.repeat(120));
    for (const prod of productos) {
      const nombre = prod.nombre.length > 40 ? prod.nombre.substring(0, 37) + '...' : prod.nombre;
      const categoria = prod.nombre_categoria || 'SIN CATEGORÍA';
      const marca = prod.nombre_marca || 'SIN MARCA';
      console.log(
        `${prod.id_producto.toString().padEnd(3)} | ` +
        `${prod.codigo.padEnd(25)} | ` +
        `${nombre.padEnd(42)} | ` +
        `${categoria.padEnd(22)} | ` +
        `${marca}`
      );
    }

    // ========== CONSULTAR TIPOS DE CARACTERÍSTICAS ==========
    console.log('\n🔧 TIPOS DE CARACTERÍSTICAS DISPONIBLES:');
    console.log('═'.repeat(80));
    const [tiposCaract] = await connection.query(`
      SELECT
        id_tipo,
        nombre_tipo,
        tipo_dato,
        unidad_medida
      FROM tb_tipos_caracteristicas
      ORDER BY id_tipo
    `);

    for (const tipo of tiposCaract) {
      const unidad = tipo.unidad_medida ? ` (${tipo.unidad_medida})` : '';
      console.log(`ID: ${tipo.id_tipo.toString().padEnd(3)} | ${tipo.nombre_tipo.padEnd(25)} | Tipo: ${tipo.tipo_dato}${unidad}`);
    }

    // ========== PRODUCTOS SIN CARACTERÍSTICAS ==========
    console.log('\n⚠️  PRODUCTOS SIN CARACTERÍSTICAS:');
    console.log('═'.repeat(80));
    const [sinCaract] = await connection.query(`
      SELECT
        a.id_producto,
        a.codigo,
        a.nombre,
        c.nombre_categoria
      FROM tb_almacen a
      LEFT JOIN tb_categorias c ON a.id_categoria = c.id_categoria
      LEFT JOIN tb_producto_caracteristicas pc ON a.id_producto = pc.id_producto
      WHERE pc.id_producto IS NULL
      ORDER BY a.id_producto
    `);

    if (sinCaract.length > 0) {
      for (const prod of sinCaract) {
        console.log(`ID: ${prod.id_producto} | ${prod.codigo} | ${prod.nombre} (${prod.nombre_categoria})`);
      }
      console.log(`\nTotal: ${sinCaract.length} productos sin características`);
    } else {
      console.log('✅ Todos los productos tienen características');
    }

    // ========== PRODUCTOS SIN MARCA ==========
    console.log('\n⚠️  PRODUCTOS SIN MARCA:');
    console.log('═'.repeat(80));
    const [sinMarca] = await connection.query(`
      SELECT
        a.id_producto,
        a.codigo,
        a.nombre,
        c.nombre_categoria
      FROM tb_almacen a
      LEFT JOIN tb_categorias c ON a.id_categoria = c.id_categoria
      WHERE a.id_marca IS NULL
      ORDER BY a.id_producto
    `);

    if (sinMarca.length > 0) {
      for (const prod of sinMarca) {
        console.log(`ID: ${prod.id_producto} | ${prod.codigo} | ${prod.nombre} (${prod.nombre_categoria})`);
      }
      console.log(`\nTotal: ${sinMarca.length} productos sin marca`);
    } else {
      console.log('✅ Todos los productos tienen marca asignada');
    }

    console.log('\n✅ Análisis completado');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
analizarDatos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
