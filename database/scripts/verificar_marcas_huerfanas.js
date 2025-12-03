/**
 * Script para verificar marcas sin productos asignados
 */

import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

async function verificarMarcasHuerfanas() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Verificación de Marcas Huérfanas - TecnoCel        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');

    connection = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Conexión exitosa\n');

    // Consultar marcas con conteo de productos
    const query = `
      SELECT
        m.id_marca,
        m.nombre_marca,
        COUNT(a.id_producto) as cantidad_productos
      FROM tb_marcas m
      LEFT JOIN tb_almacen a ON m.id_marca = a.id_marca
      GROUP BY m.id_marca, m.nombre_marca
      ORDER BY cantidad_productos ASC, m.nombre_marca
    `;

    const [rows] = await connection.execute(query);

    console.log('📊 ESTADO DE MARCAS EN LA BASE DE DATOS:\n');
    console.log('┌──────┬────────────────────────────┬──────────────┐');
    console.log('│  ID  │ Marca                      │ Productos    │');
    console.log('├──────┼────────────────────────────┼──────────────┤');

    const marcasHuerfanas = [];
    const marcasConProductos = [];
    let totalProductos = 0;

    rows.forEach(row => {
      const id = String(row.id_marca).padStart(4);
      const marca = row.nombre_marca.padEnd(26);
      const productos = String(row.cantidad_productos).padStart(10);

      if (row.cantidad_productos === 0) {
        console.log(`│ ${id} │ ${marca} │ ${productos}   │ ⚠️`);
        marcasHuerfanas.push(row);
      } else {
        console.log(`│ ${id} │ ${marca} │ ${productos}   │ ✅`);
        marcasConProductos.push(row);
        totalProductos += row.cantidad_productos;
      }
    });

    console.log('└──────┴────────────────────────────┴──────────────┘\n');

    console.log('📋 RESUMEN:\n');
    console.log(`  Total de marcas en BD: ${rows.length}`);
    console.log(`  ✅ Marcas con productos: ${marcasConProductos.length}`);
    console.log(`  ⚠️  Marcas huérfanas (sin productos): ${marcasHuerfanas.length}`);
    console.log(`  📦 Total de productos: ${totalProductos}\n`);

    if (marcasHuerfanas.length > 0) {
      console.log('⚠️  MARCAS HUÉRFANAS DETECTADAS:\n');
      marcasHuerfanas.forEach(marca => {
        console.log(`  • ID ${marca.id_marca}: ${marca.nombre_marca}`);
      });

      console.log('\n💡 RECOMENDACIONES:\n');
      console.log('  1. MANTENER: Si planeas agregar productos de estas marcas más adelante');
      console.log('  2. ELIMINAR: Si no necesitas estas marcas en tu catálogo\n');

      console.log('🗑️  Para eliminar marcas huérfanas, ejecuta:\n');
      console.log('  DELETE FROM tb_marcas WHERE id_marca IN (');
      const ids = marcasHuerfanas.map(m => m.id_marca).join(', ');
      console.log(`    ${ids}`);
      console.log('  );\n');
    } else {
      console.log('✅ ¡Perfecto! No hay marcas huérfanas.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// Ejecutar
verificarMarcasHuerfanas();
