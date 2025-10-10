#!/usr/bin/env node
/*
  Valida enlaces internos en archivos Markdown y actualiza la línea "Última actualización" al día de hoy.
  Uso: node scripts/check-docs-links.js [--write]
  - Sin --write: solo reporta problemas
  - Con --write: corrige fechas de "Última actualización"
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MD_GLOBS = [
  "README.md",
  "backend/README.md",
  "frontend/README.md",
  "docs/**/*.md",
];

function listMarkdownFiles(dir) {
  const out = [];
  function walk(p) {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(p)) {
        if (entry.startsWith(".")) continue;
        walk(path.join(p, entry));
      }
    } else if (p.endsWith(".md")) {
      out.push(p);
    }
  }
  walk(dir);
  return out;
}

function getAllMarkdownFiles() {
  // Simplificado: recorrer raíz y filtrar .md
  return listMarkdownFiles(ROOT);
}

function extractLinks(markdown) {
  const regex = /\[[^\]]+\]\(([^)]+)\)/g; // [texto](link)
  const links = [];
  let m;
  while ((m = regex.exec(markdown))) {
    links.push(m[1]);
  }
  return links;
}

function isInternalLink(link) {
  return (
    link &&
    !link.startsWith("http://") &&
    !link.startsWith("https://") &&
    !link.startsWith("#")
  );
}

function normalize(p, fileDir) {
  if (p.startsWith("/")) return path.join(ROOT, p);
  return path.resolve(fileDir, p);
}

function updateLastUpdated(markdown) {
  const today = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const pattern = /(Última actualización\s*:\s*)(.*)/i;
  if (pattern.test(markdown)) {
    return markdown.replace(pattern, `$1${today}`);
  }
  // Si no existe, añadir al final
  return markdown + `\n\nÚltima actualización: ${today}\n`;
}

function main() {
  const write = process.argv.includes("--write");
  const files = getAllMarkdownFiles();
  const problems = [];
  let updated = 0;

  for (const file of files) {
    const md = fs.readFileSync(file, "utf8");
    const links = extractLinks(md);
    const fileDir = path.dirname(file);

    for (const link of links) {
      if (!isInternalLink(link)) continue;
      // quitar anchors tipo file.md#seccion
      const base = link.split("#")[0];
      if (!base) continue;
      const target = normalize(base, fileDir);
      if (!fs.existsSync(target)) {
        problems.push({ file, link, resolved: target });
      }
    }

    if (write) {
      const next = updateLastUpdated(md);
      if (next !== md) {
        fs.writeFileSync(file, next, "utf8");
        updated += 1;
      }
    }
  }

  if (problems.length) {
    console.log("Enlaces internos rotos encontrados:");
    for (const p of problems) {
      console.log(
        `- En '${path.relative(ROOT, p.file)}' → '${
          p.link
        }' (no existe: ${path.relative(ROOT, p.resolved)})`
      );
    }
    process.exitCode = 1;
  } else {
    console.log("Sin enlaces internos rotos.");
  }

  if (write) {
    console.log(`Fechas actualizadas en ${updated} archivo(s).`);
  }
}

main();
