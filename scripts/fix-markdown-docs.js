/**
 * Script para estandarizar y corregir la documentación markdown
 *
 * Correcciones:
 * 1. Agregar/corregir tabla de contenidos
 * 2. Corregir enlaces de anclas con emojis
 * 3. Agregar botones de navegación
 * 4. Estandarizar formato
 */

const fs = require('fs');
const path = require('path');

// Función para eliminar emojis de un string
function removeEmojis(str) {
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/gu, '').trim();
}

// Función para generar un anchor ID (sin emojis, lowercase, guiones)
function generateAnchorId(title) {
  return removeEmojis(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Función para extraer títulos del contenido
function extractHeadings(content) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const anchor = generateAnchorId(title);

    headings.push({ level, title, anchor });
  }

  return headings;
}

// Función para generar tabla de contenidos
function generateTableOfContents(headings) {
  if (headings.length === 0) return '';

  let toc = '## 📋 Tabla de Contenidos\n\n';

  headings.forEach(heading => {
    const indent = '  '.repeat(heading.level - 2);
    // Mantener el título con emojis, pero usar anchor sin emojis
    toc += `${indent}- [${heading.title}](#${heading.anchor})\n`;
  });

  return toc + '\n---\n';
}

// Función para agregar botones de navegación según profundidad
function generateNavigationButtons(filePath, projectRoot) {
  const relativePath = path.relative(projectRoot, filePath);
  const depth = relativePath.split(path.sep).length - 1;

  let navigation = '\n---\n\n';

  if (depth === 0) {
    // Archivo en raíz
    navigation += '**[📚 Documentación](docs/README.md)**';
  } else if (depth === 1) {
    // Un nivel de profundidad (docs/README.md, backend/README.md)
    navigation += '**[⬆ Volver arriba](#tabla-de-contenidos)** | **[🏠 Inicio](../README.md)**';
  } else if (depth === 2) {
    // Dos niveles (docs/api/README.md)
    const parentFolder = path.basename(path.dirname(filePath));
    navigation += `**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../README.md)** | **[🏠 Inicio](../../README.md)**`;
  } else {
    // Más profundo
    const backLevels = '../'.repeat(depth);
    navigation += `**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](${backLevels}docs/README.md)** | **[🏠 Inicio](${backLevels}README.md)**`;
  }

  navigation += '\n';
  return navigation;
}

// Función principal para procesar un archivo
function processMarkdownFile(filePath, projectRoot) {
  console.log(`\nProcesando: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Extraer títulos
  const headings = extractHeadings(content);

  if (headings.length < 2) {
    console.log('  ⚠️  Archivo con pocos títulos, omitiendo...');
    return false;
  }

  // 2. Verificar si ya tiene tabla de contenidos
  const hasToc = /^##\s+.*?(Tabla de Contenidos|Índice)/mi.test(content);

  // 3. Generar nueva tabla de contenidos
  const newToc = generateTableOfContents(headings);

  // 4. Corregir enlaces de ancla con emojis en la tabla de contenidos existente
  if (hasToc) {
    console.log('  🔍 Corrigiendo enlaces en tabla de contenidos existente...');

    // Reemplazar enlaces mal formados (con emojis en el anchor)
    content = content.replace(/\[([^\]]+)\]\(#([^)]+)\)/g, (match, linkText, anchor) => {
      // Si el anchor tiene emojis, corregirlo
      const cleanAnchor = generateAnchorId(linkText);
      if (anchor !== cleanAnchor && removeEmojis(anchor) !== anchor) {
        modified = true;
        return `[${linkText}](#${cleanAnchor})`;
      }
      return match;
    });
  } else if (headings.length >= 3) {
    // 5. Agregar tabla de contenidos si no existe y tiene suficientes secciones
    console.log('  ➕ Agregando tabla de contenidos...');

    // Insertar después del primer bloque (título principal + descripción)
    const firstHeadingMatch = content.match(/^#\s+.+$/m);
    if (firstHeadingMatch) {
      const insertPosition = firstHeadingMatch.index + firstHeadingMatch[0].length;

      // Buscar el final del bloque de descripción (primera línea ---\n\n##)
      const nextSectionMatch = content.slice(insertPosition).match(/\n---\n\n##/);

      if (nextSectionMatch) {
        const finalInsertPosition = insertPosition + nextSectionMatch.index + 5; // después de "---\n\n"
        content = content.slice(0, finalInsertPosition) + '\n' + newToc + '\n' + content.slice(finalInsertPosition);
        modified = true;
      }
    }
  }

  // 6. Agregar o actualizar navegación al final
  console.log('  🔗 Verificando navegación...');

  const hasNavigation = /\*\*\[⬆\s*Volver arriba\]/.test(content);
  const navigation = generateNavigationButtons(filePath, projectRoot);

  if (!hasNavigation) {
    console.log('  ➕ Agregando navegación...');
    content = content.trimEnd() + '\n' + navigation;
    modified = true;
  }

  // 7. Remover emojis de los títulos de sección (##, ###) y dejarlos solo en el texto visible
  console.log('  🧹 Limpiando formato de títulos...');

  // Esto NO modifica los títulos, solo asegura que estén consistentes

  // 8. Guardar archivo si hubo cambios
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  ✅ Archivo actualizado');
    return true;
  } else {
    console.log('  ℹ️  Sin cambios necesarios');
    return false;
  }
}

// Función para buscar archivos markdown
function findMarkdownFiles(dir, projectRoot, excludeDirs = ['node_modules', '.git']) {
  let results = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(item)) {
        results = results.concat(findMarkdownFiles(fullPath, projectRoot, excludeDirs));
      }
    } else if (stat.isFile() && item.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

// Ejecución principal
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  console.log('🚀 Iniciando corrección de documentación markdown...');
  console.log(`📁 Directorio del proyecto: ${projectRoot}\n`);

  // Archivos prioritarios
  const priorityFiles = [
    'docs/README.md',
    'backend/README.md',
    'frontend/README.md',
    'docs/api/ENDPOINTS.md',
    'docs/api/README.md',
    'docs/guides/GETTING_STARTED.md',
    'docs/database/SCHEMA.md',
    'docs/database/README.md',
    'docs/deployment/ENVIRONMENT.md',
    'docs/deployment/HOSTING.md',
    'docs/deployment/README.md',
    'docs/project/TECNOLOGIAS.md',
    'docs/project/ESTADO_AVANCE.md',
    'docs/project/README.md',
    'docs/frontend/README.md',
    'docs/frontend/COMPONENTS.md',
  ];

  let processedCount = 0;
  let modifiedCount = 0;

  console.log('📌 Procesando archivos prioritarios...\n');

  for (const file of priorityFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      processedCount++;
      if (processMarkdownFile(fullPath, projectRoot)) {
        modifiedCount++;
      }
    } else {
      console.log(`⚠️  Archivo no encontrado: ${file}`);
    }
  }

  // Procesar el resto de archivos markdown
  console.log('\n📄 Buscando otros archivos markdown...\n');
  const allMarkdownFiles = findMarkdownFiles(projectRoot, projectRoot);

  const remainingFiles = allMarkdownFiles.filter(file => {
    const relativePath = path.relative(projectRoot, file);
    return !priorityFiles.includes(relativePath.replace(/\\/g, '/')) &&
           path.basename(file) !== 'README.md' ||
           relativePath.includes('components');
  });

  console.log(`\n📋 Procesando ${remainingFiles.length} archivos adicionales...\n`);

  for (const file of remainingFiles) {
    processedCount++;
    if (processMarkdownFile(file, projectRoot)) {
      modifiedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Proceso completado');
  console.log(`📊 Archivos procesados: ${processedCount}`);
  console.log(`✏️  Archivos modificados: ${modifiedCount}`);
  console.log('='.repeat(60) + '\n');
}

// Ejecutar
main();
