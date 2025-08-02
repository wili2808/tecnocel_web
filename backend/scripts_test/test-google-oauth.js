// Script de prueba para Google OAuth
// Ejecutar con: node test-google-oauth.js

import fetch from "node-fetch";

async function testGoogleOAuth() {
  console.log("🧪 Probando Google OAuth...");

  // Simular un access token (reemplazar con uno real para pruebas)
  const mockAccessToken =
    "ya29.A0AS3H6Nz1qAaUpulELIzi73xCpZpyk2b8D3_5koUtcJ9Hajc6JQxi-xtszy4ePcqZMyawerFysSU3_3yKA5eoBSRMxyxkkGFD-2__TVmO42j7Cufi8_VZKVoRnUC7rPk6sBfcp6B89fWj8GIDkA-lxrKDXCsIc15snD8SS0uVMuTCGurUQsDnBRmBiSYR4oBofqnwYtEaCgYKAY0SARYSFQHGX2MiajJ8n2CKYul6B_zjel6ybQ0206";

  console.log("🔍 Analizando el token...");
  console.log("📏 Longitud del token:", mockAccessToken.length);
  console.log("🔤 Primeros 20 caracteres:", mockAccessToken.substring(0, 20));
  console.log(
    "🔤 Últimos 20 caracteres:",
    mockAccessToken.substring(mockAccessToken.length - 20)
  );

  try {
    console.log("\n📡 Haciendo petición a Google UserInfo API...");

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
          Accept: "application/json",
        },
      }
    );

    console.log("📊 Status de respuesta:", userInfoResponse.status);
    console.log("📊 Status Text:", userInfoResponse.statusText);
    console.log(
      "📊 Headers de respuesta:",
      Object.fromEntries(userInfoResponse.headers.entries())
    );

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error("❌ Error en la respuesta:", errorText);

      // Intentar parsear como JSON si es posible
      try {
        const errorJson = JSON.parse(errorText);
        console.error("❌ Error detallado:", errorJson);
      } catch (e) {
        console.error("❌ Error como texto:", errorText);
      }
      return;
    }

    const userInfo = await userInfoResponse.json();
    console.log("✅ Información del usuario obtenida:", userInfo);

    // Verificar campos requeridos
    if (userInfo.id && userInfo.email) {
      console.log("✅ Token válido - Campos requeridos presentes");
      console.log("👤 ID de Google:", userInfo.id);
      console.log("📧 Email:", userInfo.email);
      console.log("👤 Nombre:", userInfo.given_name || "No disponible");
      console.log("👤 Apellido:", userInfo.family_name || "No disponible");
    } else {
      console.log("⚠️ Token válido pero faltan campos requeridos");
    }
  } catch (error) {
    console.error("❌ Error en la petición:", error.message);
    console.error("❌ Stack trace:", error.stack);
  }
}

testGoogleOAuth();
