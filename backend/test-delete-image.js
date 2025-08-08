const axios = require("axios");

// Configuración
const API_URL = "http://localhost:3000/api";
const TEST_TOKEN = "tu_token_aqui"; // Reemplazar con un token válido

async function testDeleteImage() {
  try {
    console.log("🔍 Probando endpoint de eliminación de imagen...");

    // Configurar axios con el token
    const config = {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    // Datos de prueba
    const idComentario = 9; // Reemplazar con un ID válido
    const idImagen = 4; // Reemplazar con un ID válido

    console.log(
      `📝 Intentando eliminar imagen ${idImagen} del comentario ${idComentario}...`
    );

    const response = await axios.delete(
      `${API_URL}/comentarios/${idComentario}/imagenes/${idImagen}`,
      config
    );

    console.log("✅ Respuesta exitosa:", response.data);
  } catch (error) {
    console.error("❌ Error en la prueba:");

    if (error.response) {
      console.error("📊 Status:", error.response.status);
      console.error("📄 Data:", error.response.data);
      console.error("🔧 Headers:", error.response.headers);
    } else if (error.request) {
      console.error("🌐 No se recibió respuesta del servidor");
    } else {
      console.error("💥 Error:", error.message);
    }
  }
}

// Ejecutar la prueba
testDeleteImage();
