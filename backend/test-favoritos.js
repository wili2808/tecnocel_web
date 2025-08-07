import axios from "axios";

async function testFavoritosAPI() {
  try {
    console.log("🔍 Probando API de favoritos...\n");

    // 1. Probar endpoint de favoritos
    console.log("1. Probando endpoint de favoritos...");
    try {
      const favoritosResponse = await axios.get(
        "http://localhost:3000/api/favoritos/cliente/89"
      );
      console.log("✅ API de favoritos responde correctamente");
      console.log("Status:", favoritosResponse.status);

      // Verificar estructura de datos
      const data = favoritosResponse.data;
      console.log("\nEstructura de respuesta:");
      console.log("- Success:", data.success);
      console.log("- Total productos:", data.data?.length || 0);

      if (data.data && data.data.length > 0) {
        const primerProducto = data.data[0].producto;
        console.log("\nPrimer producto:");
        console.log("- ID:", primerProducto.id_producto);
        console.log("- Nombre:", primerProducto.nombre);
        console.log("- imagen_url:", primerProducto.imagen_url);
        console.log("- Total imágenes:", primerProducto.imagenes?.length || 0);

        if (primerProducto.imagenes && primerProducto.imagenes.length > 0) {
          console.log("\nPrimera imagen:");
          console.log("- URL:", primerProducto.imagenes[0].url);
          console.log(
            "- Es principal:",
            primerProducto.imagenes[0].es_principal
          );
        }
      }
    } catch (error) {
      console.log(
        "❌ Error en API de favoritos:",
        error.response?.status,
        error.response?.statusText
      );
      if (error.response?.data) {
        console.log("Error details:", error.response.data);
      }
    }
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
  }
}

testFavoritosAPI();
