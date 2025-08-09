import axios from "axios";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || "http://localhost:3000";

async function testOffersEndpoint() {
  console.log("🧪 Probando endpoint de ofertas...\n");

  try {
    // Probar endpoint de ofertas activas
    console.log("1. Probando GET /api/ofertas/activas");
    const ofertasResponse = await axios.get(`${BASE_URL}/api/ofertas/activas`);
    console.log(
      "✅ Ofertas activas:",
      ofertasResponse.data.data.length,
      "ofertas encontradas"
    );

    if (ofertasResponse.data.data.length > 0) {
      console.log(
        "   Primera oferta:",
        ofertasResponse.data.data[0].nombre_oferta
      );
    }

    // Probar endpoint de productos en oferta
    console.log("\n2. Probando GET /api/ofertas/productos");
    const productosResponse = await axios.get(
      `${BASE_URL}/api/ofertas/productos?limit=5&offset=0`
    );
    console.log(
      "✅ Productos en oferta:",
      productosResponse.data.data.length,
      "productos encontrados"
    );
    console.log(
      "   Total de productos:",
      productosResponse.data.pagination.total
    );

    if (productosResponse.data.data.length > 0) {
      const primerProducto = productosResponse.data.data[0];
      console.log("\n📦 Primer producto en oferta:");
      console.log("   Nombre:", primerProducto.nombre);
      console.log("   Precio original:", primerProducto.precio_original);
      console.log("   Precio oferta:", primerProducto.precio_oferta);
      console.log("   Descuento:", primerProducto.descuento_porcentaje + "%");
      console.log("   En oferta:", primerProducto.en_oferta);

      // Debug: mostrar todas las propiedades del producto
      console.log("\n🔍 Debug - Todas las propiedades:");
      console.log("   Keys:", Object.keys(primerProducto));
      console.log(
        "   Producto completo:",
        JSON.stringify(primerProducto, null, 2)
      );

      // Verificar imágenes
      console.log("\n🖼️  Información de imágenes:");
      console.log("   imagen_url:", primerProducto.imagen_url);
      console.log(
        "   imagenes array:",
        primerProducto.imagenes ? primerProducto.imagenes.length : 0,
        "imágenes"
      );

      if (primerProducto.imagenes && primerProducto.imagenes.length > 0) {
        console.log("   Primera imagen URL:", primerProducto.imagenes[0].url);
        console.log(
          "   Es principal:",
          primerProducto.imagenes[0].es_principal
        );
      }

      // Verificar ofertas
      console.log("\n🏷️  Información de ofertas:");
      console.log(
        "   Ofertas array:",
        primerProducto.ofertas ? primerProducto.ofertas.length : 0,
        "ofertas"
      );

      if (primerProducto.ofertas && primerProducto.ofertas.length > 0) {
        console.log(
          "   Primera oferta:",
          primerProducto.ofertas[0].nombre_oferta
        );
        console.log(
          "   Tipo descuento:",
          primerProducto.ofertas[0].tipo_descuento
        );
        console.log(
          "   Valor descuento:",
          primerProducto.ofertas[0].valor_descuento
        );
      }
    }

    console.log("\n✅ Todas las pruebas completadas exitosamente");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

// Ejecutar las pruebas
testOffersEndpoint();
