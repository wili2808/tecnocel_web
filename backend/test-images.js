import axios from "axios";
import fs from "fs";
import path from "path";

async function testImageService() {
  try {
    console.log("🔍 Probando servicio de imágenes...\n");

    // 1. Verificar estado del servicio
    console.log("1. Verificando estado del servicio...");
    const statusResponse = await axios.get(
      "http://localhost:3000/api/images-status"
    );
    console.log("Estado del servicio:", statusResponse.data);

    // 2. Probar endpoint de imágenes
    console.log("\n2. Probando endpoint de imágenes...");
    try {
      const imageResponse = await axios.get(
        "http://localhost:3000/api/images/test.jpg",
        {
          responseType: "arraybuffer",
        }
      );
      console.log("✅ Imagen servida correctamente");
    } catch (error) {
      console.log(
        "❌ Error al servir imagen:",
        error.response?.status,
        error.response?.statusText
      );
    }

    // 2.1. Probar imagen específica que está fallando
    console.log("\n2.1. Probando imagen específica que falla...");
    try {
      const specificImageResponse = await axios.get(
        "http://localhost:3000/api/images/2025-02-01-09-21-45_descarga.jfif",
        {
          responseType: "arraybuffer",
        }
      );
      console.log("✅ Imagen específica servida correctamente");
    } catch (error) {
      console.log(
        "❌ Error al servir imagen específica:",
        error.response?.status,
        error.response?.statusText
      );
    }

    // 2.2. Probar imagen que existe (995.jpg)
    console.log("\n2.2. Probando imagen que existe (995.jpg)...");
    try {
      const existingImageResponse = await axios.get(
        "http://localhost:3000/api/images/995.jpg",
        {
          responseType: "arraybuffer",
        }
      );
      console.log("✅ Imagen existente servida correctamente");
    } catch (error) {
      console.log(
        "❌ Error al servir imagen existente:",
        error.response?.status,
        error.response?.statusText
      );
    }

    // 3. Verificar directorios
    console.log("\n3. Verificando directorios...");

    const config = {
      imagesPath: "C:/xampp/htdocs/tecnocel",
      productsPath: "C:/xampp/htdocs/tecnocel", // ✅ Actualizado para usar directorio raíz
      commentsPath: "C:/xampp/htdocs/tecnocel/img_comments",
    };

    Object.entries(config).forEach(([key, dirPath]) => {
      const exists = fs.existsSync(dirPath);
      console.log(`${key}: ${exists ? "✅" : "❌"} ${dirPath}`);

      if (exists) {
        try {
          const files = fs.readdirSync(dirPath);
          console.log(`  - Archivos encontrados: ${files.length}`);
          if (files.length > 0) {
            console.log(
              `  - Primeros 5 archivos: ${files.slice(0, 5).join(", ")}`
            );
          }
        } catch (error) {
          console.log(`  - Error al leer directorio: ${error.message}`);
        }
      }
    });
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
  }
}

testImageService();
