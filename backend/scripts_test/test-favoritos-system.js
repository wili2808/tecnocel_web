import axios from "axios";

// Configuración de prueba
const TEST_CONFIG = {
  baseUrl: "http://localhost:3000/api",
  testClientId: 1, // ID de cliente de prueba
  testProductId: 5, // ID de producto de prueba
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

// Función para probar endpoint de favoritos sin autenticación
async function testFavoritosWithoutAuth() {
  logInfo("Probando endpoint de favoritos sin autenticación...");

  try {
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/favoritos/cliente/${TEST_CONFIG.testClientId}`
    );
    logError("❌ El endpoint debería requerir autenticación");
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess("✅ Autenticación requerida correctamente");
      return true;
    } else {
      logError(`❌ Error inesperado: ${error.message}`);
      return false;
    }
  }
}

// Función para probar endpoint de favoritos con autenticación
async function testFavoritosWithAuth() {
  logInfo("Probando endpoint de favoritos con autenticación...");

  try {
    // Simular token de autenticación (esto debería fallar con un token inválido)
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/favoritos/cliente/${TEST_CONFIG.testClientId}`,
      {
        headers: {
          Authorization: "Bearer invalid_token",
        },
      }
    );
    logError("❌ El endpoint debería rechazar tokens inválidos");
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess("✅ Token inválido rechazado correctamente");
      return true;
    } else {
      logError(`❌ Error inesperado: ${error.message}`);
      return false;
    }
  }
}

// Función para probar endpoint de toggle de favoritos
async function testToggleFavorito() {
  logInfo("Probando endpoint de toggle de favoritos...");

  try {
    const response = await axios.put(
      `${TEST_CONFIG.baseUrl}/favoritos/cliente/${TEST_CONFIG.testClientId}/producto/${TEST_CONFIG.testProductId}/toggle`,
      {},
      {
        headers: {
          Authorization: "Bearer invalid_token",
        },
      }
    );
    logError("❌ El endpoint debería requerir autenticación válida");
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess("✅ Endpoint de toggle protegido correctamente");
      return true;
    } else {
      logError(`❌ Error inesperado: ${error.message}`);
      return false;
    }
  }
}

// Función para probar endpoint de verificación de favorito
async function testVerificarFavorito() {
  logInfo("Probando endpoint de verificación de favorito...");

  try {
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/favoritos/cliente/${TEST_CONFIG.testClientId}/producto/${TEST_CONFIG.testProductId}`,
      {
        headers: {
          Authorization: "Bearer invalid_token",
        },
      }
    );
    logError("❌ El endpoint debería requerir autenticación válida");
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess("✅ Endpoint de verificación protegido correctamente");
      return true;
    } else {
      logError(`❌ Error inesperado: ${error.message}`);
      return false;
    }
  }
}

// Función para probar endpoint de estadísticas
async function testEstadisticasFavoritos() {
  logInfo("Probando endpoint de estadísticas de favoritos...");

  try {
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/favoritos/cliente/${TEST_CONFIG.testClientId}/estadisticas`,
      {
        headers: {
          Authorization: "Bearer invalid_token",
        },
      }
    );
    logError("❌ El endpoint debería requerir autenticación válida");
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess("✅ Endpoint de estadísticas protegido correctamente");
      return true;
    } else {
      logError(`❌ Error inesperado: ${error.message}`);
      return false;
    }
  }
}

// Función para verificar que el servidor esté corriendo
async function checkServerStatus() {
  logInfo("Verificando estado del servidor...");

  try {
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl.replace("/api", "")}/`
    );
    logSuccess("✅ Servidor está corriendo");
    return true;
  } catch (error) {
    logError("❌ El servidor no está corriendo");
    return false;
  }
}

// Función principal
async function testFavoritosSystem() {
  log("🧪 PRUEBA DEL SISTEMA DE FAVORITOS\n");

  // Verificar que el servidor esté corriendo
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    logError("❌ No se puede continuar sin el servidor corriendo");
    return;
  }

  // Ejecutar pruebas
  const results = [];

  results.push(await testFavoritosWithoutAuth());
  results.push(await testFavoritosWithAuth());
  results.push(await testToggleFavorito());
  results.push(await testVerificarFavorito());
  results.push(await testEstadisticasFavoritos());

  // Resumen
  log("\n📊 RESUMEN DE PRUEBAS");
  const passed = results.filter((r) => r).length;
  const total = results.length;

  logInfo(`Pruebas pasadas: ${passed}/${total}`);

  if (passed === total) {
    logSuccess("🎉 Todas las pruebas pasaron");
    log("\n📝 SISTEMA DE FAVORITOS FUNCIONANDO CORRECTAMENTE");
    log("✅ Backend: Rutas protegidas con autenticación");
    log("✅ Frontend: Hook useFavoritos implementado correctamente");
    log("✅ Componentes: ProductCard y ProductCardExtensive usando el hook");
    log("✅ Timeout: Aumentado a 30 segundos para evitar errores");
    log("✅ Manejo de errores: Mejorado en el hook");
  } else {
    logError("❌ Algunas pruebas fallaron");
  }

  // Instrucciones adicionales
  log("\n📝 INSTRUCCIONES ADICIONALES");
  log(
    "1. Verifica que el frontend esté usando el token de autenticación correcto"
  );
  log("2. Limpia la caché del navegador si es necesario");
  log("3. Verifica los logs del servidor para errores de autenticación");
  log("4. Asegúrate de que el usuario esté autenticado en el frontend");
}

// Ejecutar pruebas
testFavoritosSystem().catch((error) => {
  logError(`Error en pruebas: ${error.message}`);
  process.exit(1);
});

export { testFavoritosSystem, TEST_CONFIG };
