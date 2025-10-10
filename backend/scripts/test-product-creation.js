const axios = require("axios");
const path = require("path");

// Configuración de prueba
const TEST_CONFIG = {
  baseUrl: "http://localhost:3000/api",
  token: null, // Se debe obtener del localStorage del navegador
  testUserId: 1, // ID de usuario válido en la base de datos
  testCategoryId: 1, // ID de categoría válida en la base de datos
};

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
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

function logTest(message) {
  log(`🧪 ${message}`, "cyan");
}

function logData(message) {
  log(`📊 ${message}`, "magenta");
}

// Datos de prueba para productos
const SAMPLE_PRODUCTS = {
  // Producto básico (mínimo requerido)
  basic: {
    codigo: "TEST-001",
    nombre: "Producto de Prueba Básico",
    stock: 10,
    precio_compra: "50.00",
    precio_venta: "75.00",
    fecha_ingreso: new Date().toISOString(),
    id_usuario: TEST_CONFIG.testUserId,
    id_categoria: TEST_CONFIG.testCategoryId,
  },

  // Producto completo (con todos los campos)
  complete: {
    codigo: "TEST-002",
    nombre: "Producto de Prueba Completo",
    descripcion: "Este es un producto de prueba con descripción completa",
    stock: 25,
    stock_minimo: 5,
    stock_maximo: 100,
    precio_compra: "100.00",
    precio_venta: "150.00",
    fecha_ingreso: new Date().toISOString(),
    id_usuario: TEST_CONFIG.testUserId,
    id_categoria: TEST_CONFIG.testCategoryId,
    es_destacado: true,
    orden_destacado: 1,
  },

  // Producto con imágenes
  withImages: {
    codigo: "TEST-003",
    nombre: "Producto con Imágenes",
    descripcion: "Producto que incluye imágenes de prueba",
    stock: 15,
    precio_compra: "80.00",
    precio_venta: "120.00",
    fecha_ingreso: new Date().toISOString(),
    id_usuario: TEST_CONFIG.testUserId,
    id_categoria: TEST_CONFIG.testCategoryId,
    imagenes: [
      {
        url_imagen: "test-image-1.jpg",
        alt_text: "Imagen principal del producto",
        es_principal: true,
        orden: 0,
      },
      {
        url_imagen: "test-image-2.jpg",
        alt_text: "Imagen secundaria del producto",
        es_principal: false,
        orden: 1,
      },
    ],
  },

  // Producto con datos inválidos (para probar validaciones)
  invalid: {
    codigo: "", // Código vacío - debería fallar
    nombre: "", // Nombre vacío - debería fallar
    stock: -5, // Stock negativo - debería fallar
    precio_compra: "invalid", // Precio inválido - debería fallar
    precio_venta: "invalid", // Precio inválido - debería fallar
    fecha_ingreso: "invalid-date", // Fecha inválida - debería fallar
    id_usuario: 99999, // Usuario inexistente - debería fallar
    id_categoria: 99999, // Categoría inexistente - debería fallar
  },
};

// Función para verificar que el servidor esté corriendo
async function checkServerStatus() {
  try {
    await axios.get(`${TEST_CONFIG.baseUrl.replace("/api", "")}/`);
    logSuccess("Servidor está corriendo");
    return true;
  } catch (error) {
    logError("❌ El servidor no está corriendo. Inicia el servidor primero.");
    return false;
  }
}

// Función para verificar autenticación
async function checkAuthentication() {
  if (!TEST_CONFIG.token) {
    logWarning(
      "⚠️  No hay token disponible. Algunas pruebas no se ejecutarán."
    );
    return false;
  }

  try {
    const response = await axios.get(
      `${TEST_CONFIG.baseUrl}/almacen/productos`,
      {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.token}`,
        },
      }
    );
    logSuccess("Token de autenticación válido");
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      logError("❌ Token de autenticación inválido o expirado");
    } else {
      logError(`❌ Error al verificar autenticación: ${error.message}`);
    }
    return false;
  }
}

// Función para probar creación de producto sin autenticación
async function testCreateProductWithoutAuth() {
  logTest("Probando creación de producto sin autenticación...");

  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/almacen/productos`,
      SAMPLE_PRODUCTS.basic
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

// Función para probar creación de producto básico
async function testCreateBasicProduct() {
  logTest("Probando creación de producto básico...");

  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/almacen/productos`,
      SAMPLE_PRODUCTS.basic,
      {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.token}`,
        },
      }
    );

    logSuccess("✅ Producto básico creado exitosamente");
    logData(`ID del producto: ${response.data.id_producto}`);
    logData(`Nombre: ${response.data.nombre}`);
    logData(`Código: ${response.data.codigo}`);
    logData(`Stock: ${response.data.stock}`);
    logData(`Precio venta: $${response.data.precio_venta}`);

    return {
      success: true,
      productId: response.data.id_producto,
      data: response.data,
    };
  } catch (error) {
    logError(`❌ Error al crear producto básico: ${error.message}`);
    if (error.response?.data) {
      logError(`Detalles: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

// Función para probar creación de producto completo
async function testCreateCompleteProduct() {
  logTest("Probando creación de producto completo...");

  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/almacen/productos`,
      SAMPLE_PRODUCTS.complete,
      {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.token}`,
        },
      }
    );

    logSuccess("✅ Producto completo creado exitosamente");
    logData(`ID del producto: ${response.data.id_producto}`);
    logData(`Nombre: ${response.data.nombre}`);
    logData(`Descripción: ${response.data.descripcion}`);
    logData(`Stock mínimo: ${response.data.stock_minimo}`);
    logData(`Stock máximo: ${response.data.stock_maximo}`);
    logData(`Es destacado: ${response.data.es_destacado}`);
    logData(`Orden destacado: ${response.data.orden_destacado}`);

    return {
      success: true,
      productId: response.data.id_producto,
      data: response.data,
    };
  } catch (error) {
    logError(`❌ Error al crear producto completo: ${error.message}`);
    if (error.response?.data) {
      logError(`Detalles: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

// Función para probar creación de producto con imágenes
async function testCreateProductWithImages() {
  logTest("Probando creación de producto con imágenes...");

  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/almacen/productos`,
      SAMPLE_PRODUCTS.withImages,
      {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.token}`,
        },
      }
    );

    logSuccess("✅ Producto con imágenes creado exitosamente");
    logData(`ID del producto: ${response.data.id_producto}`);
    logData(`Nombre: ${response.data.nombre}`);
    logData(`Imágenes: ${response.data.imagenes?.length || 0}`);

    if (response.data.imagenes && response.data.imagenes.length > 0) {
      response.data.imagenes.forEach((img, index) => {
        logData(
          `  Imagen ${index + 1}: ${img.url_imagen} (Principal: ${
            img.es_principal
          })`
        );
      });
    }

    return {
      success: true,
      productId: response.data.id_producto,
      data: response.data,
    };
  } catch (error) {
    logError(`❌ Error al crear producto con imágenes: ${error.message}`);
    if (error.response?.data) {
      logError(`Detalles: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

// Función para probar validaciones con datos inválidos
async function testInvalidData() {
  logTest("Probando validaciones con datos inválidos...");

  try {
    const response = await axios.post(
      `${TEST_CONFIG.baseUrl}/almacen/productos`,
      SAMPLE_PRODUCTS.invalid,
      {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.token}`,
        },
      }
    );

    logError("❌ El endpoint debería haber rechazado los datos inválidos");
    return false;
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 500) {
      logSuccess("✅ Endpoint correctamente rechaza datos inválidos");
      logData(`Status: ${error.response.status}`);
      logData(
        `Error: ${error.response.data?.message || "Error de validación"}`
      );
      return true;
    } else {
      logError(`❌ Error inesperado: ${error.message}`);
      return false;
    }
  }
}

// Función para probar obtención de productos creados
async function testGetCreatedProducts(createdProductIds) {
  logTest("Probando obtención de productos creados...");

  let successCount = 0;
  const totalProducts = createdProductIds.length;

  for (const productId of createdProductIds) {
    try {
      const response = await axios.get(
        `${TEST_CONFIG.baseUrl}/almacen/productos/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${TEST_CONFIG.token}`,
          },
        }
      );

      logSuccess(`✅ Producto ${productId} obtenido exitosamente`);
      logData(`  Nombre: ${response.data.nombre}`);
      logData(`  Código: ${response.data.codigo}`);
      successCount++;
    } catch (error) {
      logError(`❌ Error al obtener producto ${productId}: ${error.message}`);
    }
  }

  logInfo(`Productos obtenidos: ${successCount}/${totalProducts}`);
  return successCount === totalProducts;
}

// Función para limpiar productos de prueba
async function cleanupTestProducts(createdProductIds) {
  logTest("Limpiando productos de prueba...");

  let deletedCount = 0;
  const totalProducts = createdProductIds.length;

  for (const productId of createdProductIds) {
    try {
      await axios.delete(
        `${TEST_CONFIG.baseUrl}/almacen/productos/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${TEST_CONFIG.token}`,
          },
        }
      );

      logSuccess(`✅ Producto ${productId} eliminado exitosamente`);
      deletedCount++;
    } catch (error) {
      logError(`❌ Error al eliminar producto ${productId}: ${error.message}`);
    }
  }

  logInfo(`Productos eliminados: ${deletedCount}/${totalProducts}`);
  return deletedCount === totalProducts;
}

// Función principal
async function testProductCreation() {
  log("🧪 PRUEBA DE CREACIÓN DE PRODUCTOS EN ALMACÉN\n");

  // Verificar servidor
  if (!(await checkServerStatus())) {
    return;
  }

  // Verificar autenticación
  const isAuthenticated = await checkAuthentication();
  if (!isAuthenticated) {
    logWarning("⚠️  Continuando con pruebas limitadas (sin autenticación)");
  }

  const results = [];
  const createdProductIds = [];

  // Ejecutar pruebas
  results.push(await testCreateProductWithoutAuth());

  if (isAuthenticated) {
    // Crear productos de prueba
    const basicResult = await testCreateBasicProduct();
    if (basicResult.success) {
      createdProductIds.push(basicResult.productId);
    }
    results.push(basicResult.success);

    const completeResult = await testCreateCompleteProduct();
    if (completeResult.success) {
      createdProductIds.push(completeResult.productId);
    }
    results.push(completeResult.success);

    const imagesResult = await testCreateProductWithImages();
    if (imagesResult.success) {
      createdProductIds.push(imagesResult.productId);
    }
    results.push(imagesResult.success);

    // Probar validaciones
    results.push(await testInvalidData());

    // Probar obtención de productos
    if (createdProductIds.length > 0) {
      results.push(await testGetCreatedProducts(createdProductIds));
    }

    // Limpiar productos de prueba
    if (createdProductIds.length > 0) {
      await cleanupTestProducts(createdProductIds);
    }
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
  if (!TEST_CONFIG.token) {
    log("\n📝 INSTRUCCIONES PARA OBTENER TOKEN");
    log("1. Abre el navegador y ve a http://localhost:5173");
    log("2. Inicia sesión en TecnoCel Web");
    log("3. Abre las herramientas de desarrollador (F12)");
    log("4. Ve a la pestaña Application/Storage");
    log('5. Busca "token" en localStorage');
    log("6. Copia el valor del token");
    log('7. Agrega el token al script: TEST_CONFIG.token = "tu_token_aqui"');
  }

  // Información sobre la estructura de datos
  log("\n📋 ESTRUCTURA DE DATOS PARA CREAR PRODUCTOS");
  log("Campos obligatorios:");
  log("  - codigo: string (código único del producto)");
  log("  - nombre: string (nombre del producto)");
  log("  - stock: number (cantidad en stock)");
  log("  - precio_compra: string (precio de compra)");
  log("  - precio_venta: string (precio de venta)");
  log("  - fecha_ingreso: string (fecha en formato ISO)");
  log("  - id_usuario: number (ID del usuario que crea el producto)");
  log("  - id_categoria: number (ID de la categoría)");
  log("\nCampos opcionales:");
  log("  - descripcion: string (descripción del producto)");
  log("  - stock_minimo: number (stock mínimo)");
  log("  - stock_maximo: number (stock máximo)");
  log("  - es_destacado: boolean (si es producto destacado)");
  log("  - orden_destacado: number (orden en productos destacados)");
  log(
    "  - imagenes: array (array de objetos con url_imagen, alt_text, es_principal, orden)"
  );
}

// Ejecutar pruebas
if (require.main === module) {
  testProductCreation().catch((error) => {
    logError(`Error en pruebas: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testProductCreation,
  TEST_CONFIG,
  SAMPLE_PRODUCTS,
};
