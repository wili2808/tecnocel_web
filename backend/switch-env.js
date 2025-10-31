/**
 * Script para cambiar entre configuraciones de entorno
 * Uso: node switch-env.js [local|aiven]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener el argumento (local o aiven)
const env = process.argv[2];

if (!env || !['local', 'aiven'].includes(env)) {
  console.error('❌ Error: Debes especificar "local" o "aiven"');
  console.log('\nUso:');
  console.log('  node switch-env.js local   # Usar XAMPP local');
  console.log('  node switch-env.js aiven   # Usar Aiven cloud');
  process.exit(1);
}

const sourceFile = `.env.${env}`;
const targetFile = '.env';

try {
  // Verificar que el archivo fuente existe
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Error: No se encontró el archivo ${sourceFile}`);
    process.exit(1);
  }

  // Copiar el archivo
  fs.copyFileSync(sourceFile, targetFile);

  console.log('✅ Configuración cambiada exitosamente');
  console.log(`   ${sourceFile} → ${targetFile}`);

  if (env === 'local') {
    console.log('\n📦 Usando: XAMPP MySQL Local');
    console.log('   Host: localhost:3306');
    console.log('   SSL: No');
  } else {
    console.log('\n☁️  Usando: Aiven MySQL Cloud');
    console.log('   Host: db-tecnocel-tecnocel.l.aivencloud.com:24334');
    console.log('   SSL: Sí (certificado requerido)');
  }

  console.log('\nAhora ejecuta: npm run dev');

} catch (error) {
  console.error('❌ Error al copiar el archivo:', error.message);
  process.exit(1);
}
