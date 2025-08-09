const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Configuración de prueba
const TEST_CONFIG = {
  baseUrl: "http://localhost:3000/api",
  testImagePath: path.join(__dirname, "test-comment-image.jpg"),
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

// Función para probar endpoint de comentarios
async function testCommentImages() {
  logInfo("Probando endpoint de comentarios...");

  try {
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/comentarios/producto/5`
    );

    if (
      response.data &&
      response.data.datos &&
      response.data.datos.comentarios
    ) {
      const comentarios = response.data.datos.comentarios;
      logSuccess(`✅ Se obtuvieron ${comentarios.length} comentarios`);

      // Verificar imágenes en comentarios
      comentarios.forEach((comentario, index) => {
        if (comentario.imagenes && comentario.imagenes.length > 0) {
          logInfo(
            `Comentario ${index + 1} tiene ${
              comentario.imagenes.length
            } imágenes:`
          );
          comentario.imagenes.forEach((imagen, imgIndex) => {
            logInfo(`  Imagen ${imgIndex + 1}: ${imagen.imagen_url}`);

            // Verificar que la URL sea correcta
            if (
              imagen.imagen_url &&
              imagen.imagen_url.includes("/api/comment-images/")
            ) {
              logSuccess(`    ✅ URL correcta para comentarios`);
            } else {
              logError(`    ❌ URL incorrecta: ${imagen.imagen_url}`);
            }
          });
        } else {
          logInfo(`Comentario ${index + 1}: Sin imágenes`);
        }
      });

      return true;
    } else {
      logError("❌ Respuesta inesperada del endpoint");
      return false;
    }
  } catch (error) {
    logError(`❌ Error al obtener comentarios: ${error.message}`);
    return false;
  }
}

// Función para probar endpoint de imágenes de comentarios
async function testCommentImageEndpoint() {
  logInfo("Probando endpoint de imágenes de comentarios...");

  try {
    // Buscar una imagen de comentario existente
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/comentarios/producto/5`
    );

    if (
      response.data &&
      response.data.datos &&
      response.data.datos.comentarios
    ) {
      const comentarios = response.data.datos.comentarios;

      for (const comentario of comentarios) {
        if (comentario.imagenes && comentario.imagenes.length > 0) {
          const imagen = comentario.imagenes[0];
          const imageUrl = imagen.imagen_url;

          if (imageUrl) {
            logInfo(`Probando imagen: ${imageUrl}`);

            try {
              const imageResponse = await axios.get(imageUrl, {
                responseType: "arraybuffer",
                timeout: 5000,
              });

              if (imageResponse.status === 200) {
                logSuccess(
                  `✅ Imagen cargada correctamente (${imageResponse.data.length} bytes)`
                );
                return true;
              } else {
                logError(`❌ Error al cargar imagen: ${imageResponse.status}`);
              }
            } catch (imageError) {
              logError(`❌ Error al cargar imagen: ${imageError.message}`);
            }
          }
        }
      }

      logWarning("⚠️  No se encontraron imágenes de comentarios para probar");
      return false;
    }
  } catch (error) {
    logError(`❌ Error al probar endpoint de imágenes: ${error.message}`);
    return false;
  }
}

// Función para verificar directorios
function checkDirectories() {
  logInfo("Verificando directorios de imágenes...");

  const directories = [
    "C:/xampp/htdocs/tecnocel",
    "C:/xampp/htdocs/tecnocel/products",
    "C:/xampp/htdocs/tecnocel/comments",
  ];

  let allExist = true;

  directories.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      logSuccess(`✅ ${dir} existe (${files.length} archivos)`);
    } else {
      logError(`❌ ${dir} no existe`);
      allExist = false;
    }
  });

  return allExist;
}

// Función principal
async function testCommentImagesSystem() {
  log("🧪 PRUEBA DEL SISTEMA DE IMÁGENES DE COMENTARIOS\n");

  // Verificar que el servidor esté corriendo
  try {
    await axios.get(`${TEST_CONFIG.baseUrl.replace("/api", "")}/`);
    logSuccess("Servidor está corriendo");
  } catch (error) {
    logError("❌ El servidor no está corriendo. Inicia el servidor primero.");
    return;
  }

  // Crear imagen de prueba
  createTestImage();

  // Verificar directorios
  const directoriesOk = checkDirectories();

  // Ejecutar pruebas
  const results = [];

  results.push(await testCommentImages());
  results.push(await testCommentImageEndpoint());

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

  // Instrucciones adicionales
  log("\n📝 INSTRUCCIONES ADICIONALES");
  log("1. Verifica que las imágenes se muestren correctamente en el frontend");
  log("2. Limpia la caché del navegador si es necesario");
  log("3. Verifica los logs del servidor para errores");
}

// Ejecutar pruebas
if (require.main === module) {
  testCommentImagesSystem().catch((error) => {
    logError(`Error en pruebas: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testCommentImagesSystem,
  TEST_CONFIG,
};
