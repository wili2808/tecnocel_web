const axios = require("axios");

// Configuración
const API_CONFIG = {
  baseUrl: "http://localhost:3000/api",
  token: null, // Reemplazar con tu token de autenticación
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

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

function logExample(message) {
  log(`📝 ${message}`, "cyan");
}

function logCode(message) {
  log(`💻 ${message}`, "magenta");
}

// Ejemplos de uso de la API de productos
class ProductosAPIExamples {
  constructor() {
    this.headers = API_CONFIG.token
      ? { Authorization: `Bearer ${API_CONFIG.token}` }
      : {};
  }

  // Ejemplo 1: Crear un producto básico
  async crearProductoBasico() {
    logExample("EJEMPLO 1: Crear un producto básico");

    const productoBasico = {
      codigo: "CEL-001",
      nombre: "iPhone 15 Pro",
      stock: 10,
      precio_compra: "800.00",
      precio_venta: "1200.00",
      fecha_ingreso: new Date().toISOString(),
      id_usuario: 1,
      id_categoria: 1,
    };

    logCode("Datos a enviar:");
    console.log(JSON.stringify(productoBasico, null, 2));

    try {
      const response = await axios.post(
        `${API_CONFIG.baseUrl}/almacen/productos`,
        productoBasico,
        { headers: this.headers }
      );

      logSuccess("Producto creado exitosamente");
      logInfo(`ID del producto: ${response.data.id_producto}`);
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 2: Crear un producto completo con descripción
  async crearProductoCompleto() {
    logExample("EJEMPLO 2: Crear un producto completo");

    const productoCompleto = {
      codigo: "CEL-002",
      nombre: "Samsung Galaxy S24 Ultra",
      descripcion:
        "Smartphone premium con cámara de 200MP, pantalla Dynamic AMOLED 2X de 6.8 pulgadas, procesador Snapdragon 8 Gen 3, 12GB RAM y 256GB almacenamiento.",
      stock: 25,
      stock_minimo: 5,
      stock_maximo: 100,
      precio_compra: "900.00",
      precio_venta: "1400.00",
      fecha_ingreso: new Date().toISOString(),
      id_usuario: 1,
      id_categoria: 1,
      es_destacado: true,
      orden_destacado: 1,
    };

    logCode("Datos a enviar:");
    console.log(JSON.stringify(productoCompleto, null, 2));

    try {
      const response = await axios.post(
        `${API_CONFIG.baseUrl}/almacen/productos`,
        productoCompleto,
        { headers: this.headers }
      );

      logSuccess("Producto completo creado exitosamente");
      logInfo(`ID del producto: ${response.data.id_producto}`);
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 3: Crear un producto con imágenes
  async crearProductoConImagenes() {
    logExample("EJEMPLO 3: Crear un producto con imágenes");

    const productoConImagenes = {
      codigo: "ACC-001",
      nombre: "Cargador Inalámbrico MagSafe",
      descripcion:
        "Cargador inalámbrico compatible con iPhone, carga rápida de 15W",
      stock: 50,
      precio_compra: "25.00",
      precio_venta: "45.00",
      fecha_ingreso: new Date().toISOString(),
      id_usuario: 1,
      id_categoria: 2, // Accesorios
      imagenes: [
        {
          url_imagen: "cargador-magsafe-1.jpg",
          alt_text: "Cargador MagSafe vista frontal",
          es_principal: true,
          orden: 0,
        },
        {
          url_imagen: "cargador-magsafe-2.jpg",
          alt_text: "Cargador MagSafe en uso",
          es_principal: false,
          orden: 1,
        },
        {
          url_imagen: "cargador-magsafe-3.jpg",
          alt_text: "Cargador MagSafe con iPhone",
          es_principal: false,
          orden: 2,
        },
      ],
    };

    logCode("Datos a enviar:");
    console.log(JSON.stringify(productoConImagenes, null, 2));

    try {
      const response = await axios.post(
        `${API_CONFIG.baseUrl}/almacen/productos`,
        productoConImagenes,
        { headers: this.headers }
      );

      logSuccess("Producto con imágenes creado exitosamente");
      logInfo(`ID del producto: ${response.data.id_producto}`);
      logInfo(`Número de imágenes: ${response.data.imagenes?.length || 0}`);
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 4: Obtener todos los productos
  async obtenerTodosLosProductos() {
    logExample("EJEMPLO 4: Obtener todos los productos");

    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}/almacen/productos`,
        { headers: this.headers }
      );

      logSuccess(`Se obtuvieron ${response.data.length} productos`);
      logInfo("Primeros 3 productos:");
      response.data.slice(0, 3).forEach((producto, index) => {
        console.log(
          `  ${index + 1}. ${producto.nombre} (${producto.codigo}) - Stock: ${
            producto.stock
          }`
        );
      });
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 5: Obtener un producto específico
  async obtenerProductoPorId(productoId) {
    logExample(`EJEMPLO 5: Obtener producto por ID (${productoId})`);

    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}/almacen/productos/${productoId}`,
        { headers: this.headers }
      );

      logSuccess("Producto obtenido exitosamente");
      logCode("Datos del producto:");
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        logError("Producto no encontrado");
      } else {
        logError(`Error: ${error.response?.data?.message || error.message}`);
      }
      return null;
    }
  }

  // Ejemplo 6: Buscar productos
  async buscarProductos(termino) {
    logExample(`EJEMPLO 6: Buscar productos con término "${termino}"`);

    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}/almacen/productos/buscar`,
        {
          params: { termino },
          headers: this.headers,
        }
      );

      logSuccess(`Se encontraron ${response.data.length} productos`);
      response.data.forEach((producto, index) => {
        console.log(`  ${index + 1}. ${producto.nombre} (${producto.codigo})`);
      });
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 7: Obtener productos destacados
  async obtenerProductosDestacados() {
    logExample("EJEMPLO 7: Obtener productos destacados");

    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}/almacen/productos/destacados`,
        { headers: this.headers }
      );

      logSuccess(`Se obtuvieron ${response.data.length} productos destacados`);
      response.data.forEach((producto, index) => {
        console.log(
          `  ${index + 1}. ${producto.nombre} - Orden: ${
            producto.orden_destacado
          }`
        );
      });
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 8: Actualizar un producto
  async actualizarProducto(productoId) {
    logExample(`EJEMPLO 8: Actualizar producto (ID: ${productoId})`);

    const datosActualizacion = {
      nombre: "iPhone 15 Pro - Actualizado",
      descripcion: "Descripción actualizada del iPhone 15 Pro",
      stock: 15,
      precio_venta: "1250.00",
    };

    logCode("Datos de actualización:");
    console.log(JSON.stringify(datosActualizacion, null, 2));

    try {
      const response = await axios.put(
        `${API_CONFIG.baseUrl}/almacen/productos/${productoId}`,
        datosActualizacion,
        { headers: this.headers }
      );

      logSuccess("Producto actualizado exitosamente");
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 9: Actualizar stock
  async actualizarStock(productoId, nuevoStock) {
    logExample(
      `EJEMPLO 9: Actualizar stock del producto ${productoId} a ${nuevoStock}`
    );

    try {
      const response = await axios.patch(
        `${API_CONFIG.baseUrl}/almacen/productos/${productoId}/stock`,
        { stock: nuevoStock },
        { headers: this.headers }
      );

      logSuccess("Stock actualizado exitosamente");
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 10: Eliminar un producto
  async eliminarProducto(productoId) {
    logExample(`EJEMPLO 10: Eliminar producto (ID: ${productoId})`);

    try {
      const response = await axios.delete(
        `${API_CONFIG.baseUrl}/almacen/productos/${productoId}`,
        { headers: this.headers }
      );

      logSuccess("Producto eliminado exitosamente");
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 11: Obtener categorías
  async obtenerCategorias() {
    logExample("EJEMPLO 11: Obtener todas las categorías");

    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}/almacen/categorias`,
        { headers: this.headers }
      );

      logSuccess(`Se obtuvieron ${response.data.length} categorías`);
      response.data.forEach((categoria, index) => {
        console.log(
          `  ${index + 1}. ${categoria.nombre_categoria} (ID: ${
            categoria.id_categoria
          })`
        );
      });
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  // Ejemplo 12: Obtener productos por categoría
  async obtenerProductosPorCategoria(categoriaId) {
    logExample(
      `EJEMPLO 12: Obtener productos por categoría (ID: ${categoriaId})`
    );

    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}/almacen/productos/categoria/${categoriaId}`,
        { headers: this.headers }
      );

      logSuccess(
        `Se obtuvieron ${response.data.length} productos para la categoría ${categoriaId}`
      );
      response.data.forEach((producto, index) => {
        console.log(`  ${index + 1}. ${producto.nombre} (${producto.codigo})`);
      });
      return response.data;
    } catch (error) {
      logError(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }
}

// Función para ejecutar todos los ejemplos
async function ejecutarEjemplos() {
  log("📚 EJEMPLOS DE USO DE LA API DE PRODUCTOS\n");

  if (!API_CONFIG.token) {
    logError(
      "❌ No hay token configurado. Configura API_CONFIG.token antes de ejecutar los ejemplos."
    );
    logInfo("Para obtener un token:");
    logInfo("1. Inicia sesión en http://localhost:5173");
    logInfo("2. Abre las herramientas de desarrollador (F12)");
    logInfo("3. Ve a Application/Storage > localStorage");
    logInfo("4. Copia el valor de 'token'");
    logInfo("5. Configura: API_CONFIG.token = 'tu_token_aqui'");
    return;
  }

  const api = new ProductosAPIExamples();

  // Ejecutar ejemplos de lectura (no modifican datos)
  await api.obtenerTodosLosProductos();
  await api.obtenerCategorias();
  await api.obtenerProductosDestacados();
  await api.buscarProductos("iPhone");

  // Ejecutar ejemplos de escritura (modifican datos)
  const productoBasico = await api.crearProductoBasico();
  const productoCompleto = await api.crearProductoCompleto();
  const productoConImagenes = await api.crearProductoConImagenes();

  // Si se crearon productos, probar operaciones con ellos
  if (productoBasico) {
    await api.obtenerProductoPorId(productoBasico.id_producto);
    await api.actualizarProducto(productoBasico.id_producto);
    await api.actualizarStock(productoBasico.id_producto, 20);
    await api.eliminarProducto(productoBasico.id_producto);
  }

  if (productoCompleto) {
    await api.obtenerProductoPorId(productoCompleto.id_producto);
    await api.eliminarProducto(productoCompleto.id_producto);
  }

  if (productoConImagenes) {
    await api.obtenerProductoPorId(productoConImagenes.id_producto);
    await api.eliminarProducto(productoConImagenes.id_producto);
  }

  // Obtener productos por categoría
  await api.obtenerProductosPorCategoria(1);

  log("\n🎉 Todos los ejemplos han sido ejecutados");
}

// Ejecutar ejemplos si se llama directamente
if (require.main === module) {
  ejecutarEjemplos().catch((error) => {
    logError(`Error en ejemplos: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  ProductosAPIExamples,
  ejecutarEjemplos,
  API_CONFIG,
};

