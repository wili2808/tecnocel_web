const fs = require("fs");
const path = require("path");

// Crear estructura de directorios para logs
const logsDir = path.join(__dirname, "../logs");

// Crear directorio de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log("✅ Directorio de logs creado:", logsDir);
}

// Crear archivos de log vacíos si no existen
const logFiles = ["api.log", "error.log"];

logFiles.forEach((file) => {
  const logFile = path.join(logsDir, file);
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, "");
    console.log("✅ Archivo de log creado:", file);
  }
});

console.log("✨ Estructura de logs inicializada correctamente");
