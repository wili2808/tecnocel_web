/**
 * Script de test simple para verificar logs duplicados en el backend
 * Compila TypeScript primero y luego ejecuta el servidor
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "test-logs.txt");
const TEST_DURATION = 10000; // 10 segundos

console.log("🧪 Iniciando test simple de logs duplicados...");
console.log(`📝 Los logs se guardarán en: ${LOG_FILE}`);

// Limpiar archivo de logs anterior
if (fs.existsSync(LOG_FILE)) {
  fs.unlinkSync(LOG_FILE);
}

// Función para analizar logs duplicados
const analyzeLogs = () => {
  if (!fs.existsSync(LOG_FILE)) {
    console.log("❌ No se encontró el archivo de logs");
    return;
  }

  const logs = fs
    .readFileSync(LOG_FILE, "utf8")
    .split("\n")
    .filter((line) => line.trim());
  const logCounts = {};
  const duplicates = [];

  logs.forEach((log, index) => {
    // Normalizar el log para comparación
    const normalizedLog = log
      .replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, "[TIMESTAMP]")
      .replace(/port: \d+/g, "port: [PORT]")
      .replace(/duration: \d+ms/g, "duration: [DURATION]ms")
      .replace(/timestamp: [^|]+/g, "timestamp: [TIMESTAMP]")
      .replace(/nodeVersion: [^|]+/g, "nodeVersion: [VERSION]");

    if (!logCounts[normalizedLog]) {
      logCounts[normalizedLog] = [];
    }
    logCounts[normalizedLog].push(index + 1);
  });

  // Encontrar duplicados
  Object.entries(logCounts).forEach(([log, lineNumbers]) => {
    if (lineNumbers.length > 1) {
      duplicates.push({
        log: log,
        count: lineNumbers.length,
        lines: lineNumbers,
      });
    }
  });

  console.log("\n📊 Resultados del análisis:");
  console.log(`Total de logs: ${logs.length}`);
  console.log(`Logs únicos: ${Object.keys(logCounts).length}`);
  console.log(`Logs duplicados encontrados: ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log("\n🚨 LOGS DUPLICADOS DETECTADOS:");
    duplicates.forEach((dup, index) => {
      console.log(`\n${index + 1}. Log duplicado (${dup.count} veces):`);
      console.log(`   Líneas: ${dup.lines.join(", ")}`);
      console.log(`   Contenido: ${dup.log}`);
    });
  } else {
    console.log("\n✅ No se encontraron logs duplicados");
  }

  // Verificar patrones específicos
  const patterns = {
    "Iniciando servidor": logs.filter((log) =>
      log.includes("Iniciando servidor")
    ).length,
    "Servidor iniciado": logs.filter((log) => log.includes("Servidor iniciado"))
      .length,
    "Conexión a la base de datos": logs.filter((log) =>
      log.includes("Conexión a la base de datos")
    ).length,
    "Modelos sincronizados": logs.filter((log) =>
      log.includes("Modelos sincronizados")
    ).length,
    "Datos de ejemplo": logs.filter((log) => log.includes("Datos de ejemplo"))
      .length,
  };

  console.log("\n🔍 Análisis de patrones específicos:");
  Object.entries(patterns).forEach(([pattern, count]) => {
    if (count > 1) {
      console.log(`⚠️  "${pattern}" aparece ${count} veces`);
    } else if (count === 1) {
      console.log(`✅ "${pattern}" aparece ${count} vez`);
    } else {
      console.log(`❌ "${pattern}" no aparece`);
    }
  });

  // Mostrar logs relevantes
  console.log("\n📋 Logs relevantes del servidor:");
  const relevantLogs = logs.filter(
    (log) =>
      log.includes("INFO") ||
      log.includes("ERROR") ||
      log.includes("WARN") ||
      log.includes("Iniciando") ||
      log.includes("Servidor") ||
      log.includes("Conexión") ||
      log.includes("Modelos")
  );

  relevantLogs.slice(0, 15).forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
};

// Compilar TypeScript
const compileTypeScript = () => {
  return new Promise((resolve, reject) => {
    console.log("🔨 Compilando TypeScript...");

    const tsc = spawn("npx", ["tsc"], {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    tsc.on("close", (code) => {
      if (code === 0) {
        console.log("✅ TypeScript compilado exitosamente");
        resolve();
      } else {
        console.log("❌ Error al compilar TypeScript");
        reject(new Error(`TypeScript compilation failed with code ${code}`));
      }
    });

    tsc.on("error", (error) => {
      console.error("❌ Error al ejecutar TypeScript compiler:", error);
      reject(error);
    });
  });
};

// Iniciar el servidor compilado
const startServer = () => {
  return new Promise((resolve, reject) => {
    console.log("🚀 Iniciando servidor compilado...");

    const server = spawn("node", ["dist/index.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "development",
        LOG_LEVEL: "debug",
        PORT: "3001",
      },
    });

    server.stdout.on("data", (data) => {
      const output = data.toString();
      fs.appendFileSync(LOG_FILE, output);
      process.stdout.write(output);
    });

    server.stderr.on("data", (data) => {
      const output = data.toString();
      fs.appendFileSync(LOG_FILE, output);
      process.stderr.write(output);
    });

    server.on("error", (error) => {
      console.error("❌ Error al iniciar el servidor:", error);
      reject(error);
    });

    server.on("close", (code) => {
      console.log(`\n📋 Servidor cerrado con código: ${code}`);
    });

    setTimeout(() => {
      console.log("\n⏹️ Deteniendo servidor...");
      server.kill("SIGTERM");

      setTimeout(() => {
        if (server.killed) {
          console.log("✅ Servidor detenido correctamente");
        } else {
          console.log("⚠️ Forzando cierre del servidor...");
          server.kill("SIGKILL");
        }
        resolve();
      }, 2000);
    }, TEST_DURATION);
  });
};

// Ejecutar el test
const runTest = async () => {
  try {
    await compileTypeScript();
    await startServer();
    console.log("\n🔍 Analizando logs...");
    analyzeLogs();
  } catch (error) {
    console.error("❌ Error durante el test:", error);
  }
};

runTest();
