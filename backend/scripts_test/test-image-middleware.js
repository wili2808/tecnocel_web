import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const COMMENTS_IMAGES_PATH =
  process.env.COMMENTS_IMAGES_PATH || "C:/xampp/htdocs/tecnocel/img_comments";

console.log("🧪 Probando lógica del middleware de imágenes...\n");

function testMiddlewareLogic() {
  // Simular la lógica del middleware
  function buildImagePath(filename) {
    if (
      filename.startsWith("img_comments/") ||
      filename.startsWith("comments_img/") ||
      filename.startsWith("comments/")
    ) {
      // Para comentarios, extraer solo el nombre del archivo (sin el prefijo)
      const fileName = filename.replace(
        /^(img_comments\/|comments_img\/|comments\/)/,
        ""
      );
      const filePath = path.join(COMMENTS_IMAGES_PATH, fileName);
      return { filePath, fileName, type: "comment" };
    } else {
      // Para otros archivos, usar el directorio normal
      const filePath = path.join(COMMENTS_IMAGES_PATH, filename);
      return { filePath, fileName: filename, type: "normal" };
    }
  }

  // Casos de prueba
  const testCases = [
    "img_comments/comment_1754155702029_47cdd98e-37fe-4285-b751-389765d16311.jpg",
    "comments_img/comment_1754120473546_88ac61df-3623-4315-b166-7f56a565c75a.jpg",
    "comments/comment_1754116295935_9f8a0b1a-a293-44a0-863e-5c758ebc1e80.jpg",
    "producto.jpg",
    "img_comments/test.jpg",
  ];

  console.log("📋 Casos de prueba:");
  testCases.forEach((testCase, index) => {
    const result = buildImagePath(testCase);
    const fileExists = fs.existsSync(result.filePath);

    console.log(`\n${index + 1}. Input: "${testCase}"`);
    console.log(`   Tipo: ${result.type}`);
    console.log(`   Archivo extraído: "${result.fileName}"`);
    console.log(`   Ruta construida: "${result.filePath}"`);
    console.log(`   Archivo existe: ${fileExists ? "✅" : "❌"}`);
  });

  // Verificar archivos reales en el directorio
  console.log("\n📁 Verificando archivos reales en el directorio:");
  if (fs.existsSync(COMMENTS_IMAGES_PATH)) {
    const files = fs.readdirSync(COMMENTS_IMAGES_PATH);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
    });

    console.log(`   Total de archivos: ${imageFiles.length}`);
    if (imageFiles.length > 0) {
      console.log("   Archivos disponibles:");
      imageFiles.slice(0, 5).forEach((file, index) => {
        console.log(`     ${index + 1}. ${file}`);
      });
      if (imageFiles.length > 5) {
        console.log(`     ... y ${imageFiles.length - 5} más`);
      }
    }
  }
}

// Ejecutar prueba
testMiddlewareLogic();
console.log("\n🎉 Prueba completada");
