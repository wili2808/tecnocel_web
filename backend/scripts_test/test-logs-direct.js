/**
 * Test directo para verificar logs duplicados
 * Ejecuta el servidor compilado directamente
 */

import { spawn } from "child_process";
import fs from "fs";

const LOG_FILE = "test-logs-direct.txt";
const TEST_DURATION = 8000; // 8 segundos

console.log("🧪 Test directo de logs duplicados...");

// Limpiar archivo anterior
if (fs.existsSync(LOG_FILE)) {
  fs.unlinkSync(LOG_FILE);
}

// Función para analizar logs
const analyzeLogs = () => {
  if (!fs.existsSync(LOG_FILE)) {
    console.log("❌ No se encontró archivo de logs");
    return;
  }

  const logs = fs
    .readFileSync(LOG_FILE, "utf8")
    .split("\n")
    .filter((line) => line.trim());

  console.log(`\n📊 Total de logs capturados: ${logs.length}`);

  // Buscar logs específicos que podrían duplicarse
  const patterns = {
    "Iniciando servidor": logs.filter((log) =>
      log.includes("Iniciando servidor")
    ),
    "Servidor iniciado": logs.filter((log) =>
      log.includes("Servidor iniciado")
    ),
    "Conexión a la base de datos": logs.filter((log) =>
      log.includes("Conexión a la base de datos")
    ),
    "Modelos sincronizados": logs.filter((log) =>
      log.includes("Modelos sincronizados")
    ),
    "Datos de ejemplo": logs.filter((log) => log.includes("Datos de ejemplo")),
    INFO: logs.filter((log) => log.includes("INFO")),
    ERROR: logs.filter((log) => log.includes("ERROR")),
    WARN: logs.filter((log) => log.includes("WARN")),
  };

  console.log("\n🔍 Análisis de patrones:");
  Object.entries(patterns).forEach(([pattern, matches]) => {
    if (matches.length > 1) {
      console.log(`⚠️  "${pattern}" aparece ${matches.length} veces`);
      matches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.substring(0, 100)}...`);
      });
    } else if (matches.length === 1) {
      console.log(`✅ "${pattern}" aparece 1 vez`);
    } else {
      console.log(`❌ "${pattern}" no aparece`);
    }
  });

  // Mostrar todos los logs relevantes
  console.log("\n📋 Todos los logs capturados:");
  logs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
};

// Ejecutar servidor
const runServer = () => {
  return new Promise((resolve) => {
    console.log("🚀 Iniciando servidor...");

    const server = spawn("node", ["dist/index.js"], {
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

    server.on("close", (code) => {
      console.log(`\n📋 Servidor cerrado (código: ${code})`);
    });

    setTimeout(() => {
      console.log("\n⏹️ Deteniendo servidor...");
      server.kill("SIGTERM");

      setTimeout(() => {
        if (!server.killed) {
          server.kill("SIGKILL");
        }
        resolve();
      }, 2000);
    }, TEST_DURATION);
  });
};

// Ejecutar test
const runTest = async () => {
  try {
    await runServer();
    console.log("\n🔍 Analizando logs...");
    analyzeLogs();
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

runTest();
