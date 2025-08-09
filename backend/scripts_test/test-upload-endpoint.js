const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");

// Configuración de prueba
const TEST_CONFIG = {
  baseUrl: "http://localhost:3000/api",
  token: null, // Se obtendrá del localStorage del navegador
  testImagePath: path.join(__dirname, "test-image.jpg"),
};

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Función para crear imagen de prueba
function createTestImage() {
  const testImagePath = TEST_CONFIG.testImagePath;

  if (fs.existsSync(testImagePath)) {
    logInfo("Imagen de prueba ya existe");
    return testImagePath;
  }

  // Crear una imagen JPEG simple de 1x1 pixel
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x0c,
    0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0x8a, 0x00,
    0x07, 0xff, 0xd9,
  ]);

  try {
    fs.writeFileSync(testImagePath, jpegHeader);
    logSuccess(`Imagen de prueba creada: ${testImagePath}`);
    return testImagePath;
  } catch (error) {
    logError(`Error al crear imagen de prueba: ${error.message}`);
    return null;
  }
}

// Función para probar endpoint sin autenticación
async function testUploadWithoutAuth() {
  logInfo("Probando endpoint sin autenticación...");

  try {
    const formData = new FormData();
    const testImagePath = createTestImage();

    if (!testImagePath) {
      logError("No se pudo crear imagen de prueba");
      return false;
    }

    formData.append("imagenes", fs.createReadStream(testImagePath));

    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/upload/comment-images`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000,
      }
    );

    logError("❌ El endpoint debería haber rechazado la petición sin token");
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess(
        "✅ Endpoint correctamente rechaza peticiones sin autenticación"
      );
      return true;
    } else {
      logError(`❌ Error inesperado: ${error.message}`);
      return false;
    }
  }
}

// Función para probar endpoint con autenticación
async function testUploadWithAuth() {
  logInfo("Probando endpoint con autenticación...");

  if (!TEST_CONFIG.token) {
    logWarning(
      "⚠️  No hay token disponible. Obtén un token del navegador y agrégalo al script."
    );
    return false;
  }

  try {
    const formData = new FormData();
    const testImagePath = createTestImage();

    if (!testImagePath) {
      logError("No se pudo crear imagen de prueba");
      return false;
    }

    formData.append("imagenes", fs.createReadStream(testImagePath));

    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/upload/comment-images`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${TEST_CONFIG.token}`,
        },
        timeout: 10000,
      }
    );

    logSuccess("✅ Endpoint funciona correctamente con autenticación");
    logInfo(`Respuesta: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logError(`❌ Error en endpoint con autenticación: ${error.message}`);
    if (error.response?.data) {
      logError(`Detalles: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Función para probar campo incorrecto
async function testWrongFieldName() {
  logInfo("Probando con nombre de campo incorrecto...");

  try {
    const formData = new FormData();
    const testImagePath = createTestImage();

    if (!testImagePath) {
      logError("No se pudo crear imagen de prueba");
      return false;
    }

    // Usar nombre de campo incorrecto
    formData.append("images", fs.createReadStream(testImagePath));

    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/upload/comment-images`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${TEST_CONFIG.token}`,
        },
        timeout: 10000,
      }
    );

    logError("❌ El endpoint debería haber rechazado el campo incorrecto");
    return false;
  } catch (error) {
    if (
      error.response?.status === 500 &&
      error.response?.data?.error?.includes("Unexpected field")
    ) {
      logSuccess("✅ Endpoint correctamente rechaza campos incorrectos");
      return true;
    } else {
      logError(`❌ Error inesperado: ${error.message}`);
      return false;
    }
  }
}

// Función principal
async function testUploadEndpoint() {
  log("🧪 PRUEBA DEL ENDPOINT DE UPLOAD DE COMENTARIOS\n");

  // Verificar que el servidor esté corriendo
  try {
    await axios.get(`${TEST_CONFIG.baseUrl.replace("/api", "")}/`);
    logSuccess("Servidor está corriendo");
  } catch (error) {
    logError("❌ El servidor no está corriendo. Inicia el servidor primero.");
    return;
  }

  // Ejecutar pruebas
  const results = [];

  results.push(await testUploadWithoutAuth());
  results.push(await testWrongFieldName());

  if (TEST_CONFIG.token) {
    results.push(await testUploadWithAuth());
  }

  // Resumen
  log("\n📊 RESUMEN DE PRUEBAS");
  const passed = results.filter((r) => r).length;
  const total = results.length;

  logInfo(`Pruebas pasadas: ${passed}/${total}`);

  if (passed === total) {
    logSuccess("🎉 Todas las pruebas pasaron");
  } else {
    logError("❌ Algunas pruebas fallaron");
  }

  // Instrucciones para obtener token
  log("\n📝 INSTRUCCIONES PARA OBTENER TOKEN");
  log("1. Abre el navegador y ve a http://localhost:5173");
  log("2. Inicia sesión en TecnoCel Web");
  log("3. Abre las herramientas de desarrollador (F12)");
  log("4. Ve a la pestaña Application/Storage");
  log('5. Busca "token" en localStorage');
  log("6. Copia el valor del token");
  log('7. Agrega el token al script: TEST_CONFIG.token = "tu_token_aqui"');
}

// Ejecutar pruebas
if (require.main === module) {
  testUploadEndpoint().catch((error) => {
    logError(`Error en pruebas: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testUploadEndpoint,
  TEST_CONFIG,
};
