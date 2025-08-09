import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configurar __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const XAMPP_BASE = process.env.IMAGES_PATH || "C:/xampp/htdocs/tecnocel";
const config = {
  images: {
    imagesPath: XAMPP_BASE,
    productsPath:
      process.env.PRODUCTS_IMAGES_PATH ||
      path.join(XAMPP_BASE, "almacen/img_productos"),
    commentsPath:
      process.env.COMMENTS_IMAGES_PATH || path.join(XAMPP_BASE, "img_comments"),
    baseUrl: process.env.BASE_URL || "http://localhost",
    endpoint: process.env.IMAGES_ENDPOINT || "",
    defaultImage: process.env.DEFAULT_IMAGE || "default-product.png",
  },
};

// Función simple de logging
const logger = {
  info: (...args) => console.log("\x1b[32m%s\x1b[0m", "[INFO]", ...args),
  warn: (...args) => console.log("\x1b[33m%s\x1b[0m", "[WARN]", ...args),
  error: (...args) => console.log("\x1b[31m%s\x1b[0m", "[ERROR]", ...args),
};

const API_URL = "http://localhost:3000/api";

async function testImageEndpoints() {
  try {
    logger.info("Iniciando pruebas de endpoints de imágenes...");

    // 1. Probar endpoint de estado del servicio de imágenes
    logger.info("1. Probando endpoint de estado...");
    const statusResponse = await fetch(`${API_URL}/images-status`);
    const statusData = await statusResponse.json();
    logger.info("Estado del servicio de imágenes:", statusData);

    // 2. Obtener un producto para probar sus imágenes
    logger.info("2. Obteniendo producto de prueba...");
    const productResponse = await fetch(`${API_URL}/almacen/productos/5`);
    const productData = await productResponse.json();

    if (!productData) {
      throw new Error("No se pudo obtener el producto de prueba");
    }

    logger.info("Datos del producto:", {
      id: productData.id_producto,
      nombre: productData.nombre,
      imagen_url: productData.imagen_url,
      imagenes: productData.imagenes,
    });

    // 3. Probar acceso a las imágenes
    if (productData.imagenes && productData.imagenes.length > 0) {
      logger.info("3. Probando acceso a las imágenes del producto...");

      for (const imagen of productData.imagenes) {
        const imageUrl = imagen.url;
        logger.info(`Probando imagen: ${imageUrl}`);

        try {
          const imageResponse = await fetch(imageUrl);
          logger.info(`Respuesta para ${imageUrl}:`, {
            status: imageResponse.status,
            contentType: imageResponse.headers.get("content-type"),
            contentLength: imageResponse.headers.get("content-length"),
          });

          // Verificar si la imagen existe físicamente
          if (imageResponse.status === 404) {
            logger.error(`La imagen no existe: ${imageUrl}`);
          } else if (
            !imageResponse.headers.get("content-type")?.startsWith("image/")
          ) {
            logger.error(`La respuesta no es una imagen: ${imageUrl}`);
          } else {
            logger.info(`✅ Imagen accesible: ${imageUrl}`);
          }
        } catch (error) {
          logger.error(`Error al acceder a la imagen ${imageUrl}:`, error);
        }
      }
    } else {
      logger.warn("El producto no tiene imágenes asociadas");
    }

    // 4. Probar imagen por defecto
    logger.info("4. Probando acceso a la imagen por defecto...");
    const defaultImageUrl = `${config.images.baseUrl}${config.images.endpoint}/${config.images.defaultImage}`;
    try {
      const defaultImageResponse = await fetch(defaultImageUrl);
      logger.info(`Respuesta para imagen por defecto:`, {
        url: defaultImageUrl,
        status: defaultImageResponse.status,
        contentType: defaultImageResponse.headers.get("content-type"),
      });
    } catch (error) {
      logger.error("Error al acceder a la imagen por defecto:", error);
    }

    // 5. Verificar rutas configuradas
    logger.info("5. Verificando configuración de rutas:", {
      imagesPath: config.images.imagesPath,
      productsPath: config.images.productsPath,
      commentsPath: config.images.commentsPath,
      baseUrl: config.images.baseUrl,
      endpoint: config.images.endpoint,
    });

    // 6. Probar una URL de imagen específica de XAMPP
    const testXamppUrl = `${config.images.baseUrl}/tecnocel/almacen/img_productos/test.jpg`;
    logger.info("6. Probando acceso directo a XAMPP:", {
      url: testXamppUrl,
    });
    try {
      const xamppResponse = await fetch(testXamppUrl);
      logger.info(`Respuesta de XAMPP:`, {
        status: xamppResponse.status,
        contentType: xamppResponse.headers.get("content-type"),
      });
    } catch (error) {
      logger.error("Error al acceder a XAMPP:", error);
    }
  } catch (error) {
    logger.error("Error durante las pruebas:", error);
  }
}

// Ejecutar pruebas
testImageEndpoints()
  .then(() => {
    logger.info("Pruebas completadas");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Error en las pruebas:", error);
    process.exit(1);
  });
