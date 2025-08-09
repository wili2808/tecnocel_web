import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const COMMENTS_IMAGES_PATH =
  process.env.COMMENTS_IMAGES_PATH || "C:/xampp/htdocs/tecnocel/img_comments";

console.log("🧪 Probando middleware directamente...\n");

// Simular exactamente la lógica del middleware
function testMiddlewareLogic(filename) {
  console.log(`📋 Probando con: ${filename}`);

  // Validar extensión
  const ext = path.extname(filename).toLowerCase();
  const ALLOWED_IMAGE_TYPES = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
  ];

  if (!ext || !ALLOWED_IMAGE_TYPES.includes(ext)) {
    console.log(`   ❌ Extensión inválida: ${ext}`);
    return false;
  }

  console.log(`   ✅ Extensión válida: ${ext}`);

  // Validar caracteres peligrosos
  const dangerousChars = /[\x00-\x1f\x7f<>:"|*\?]/;
  if (dangerousChars.test(filename)) {
    console.log(`   ❌ Caracteres peligrosos detectados`);
    return false;
  }

  console.log(`   ✅ Sin caracteres peligrosos`);

  // Validar rutas seguras
  const safePaths = ["img_comments/", "comments_img/", "comments/"];
  const hasValidPath = safePaths.some((safePath) =>
    filename.startsWith(safePath)
  );

  if (!hasValidPath && (filename.includes("/") || filename.includes("\\"))) {
    console.log(`   ❌ Ruta no válida`);
    return false;
  }

  console.log(`   ✅ Ruta válida`);

  // Construir ruta
  let filePath;
  if (
    filename.startsWith("img_comments/") ||
    filename.startsWith("comments_img/") ||
    filename.startsWith("comments/")
  ) {
    const fileName = filename.replace(
      /^(img_comments\/|comments_img\/|comments\/)/,
      ""
    );
    filePath = path.join(COMMENTS_IMAGES_PATH, fileName);
    console.log(`   🔧 Construyendo ruta de comentario:`);
    console.log(`      - commentsImagesPath: ${COMMENTS_IMAGES_PATH}`);
    console.log(`      - fileName extraído: ${fileName}`);
    console.log(`      - filePath final: ${filePath}`);
  } else {
    filePath = path.join(COMMENTS_IMAGES_PATH, filename);
    console.log(`   🔧 Construyendo ruta normal: ${filePath}`);
  }

  // Verificar si existe
  const exists = fs.existsSync(filePath);
  const isFile = exists ? fs.statSync(filePath).isFile() : false;

  console.log(`   📁 Archivo existe: ${exists ? "✅" : "❌"}`);
  console.log(`   📄 Es archivo: ${isFile ? "✅" : "❌"}`);

  if (exists && isFile) {
    const stats = fs.statSync(filePath);
    console.log(`   📊 Tamaño: ${stats.size} bytes`);
    console.log(`   🕒 Última modificación: ${stats.mtime}`);
  }

  return exists && isFile;
}

// Casos de prueba
const testCases = [
  "img_comments/comment_1754155702029_47cdd98e-37fe-4285-b751-389765d16311.jpg",
  "comment_1754155702029_47cdd98e-37fe-4285-b751-389765d16311.jpg",
  "img_comments/test.jpg",
  "test.jpg",
];

console.log("🔍 Ejecutando casos de prueba:\n");

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ==========================================`);
  const result = testMiddlewareLogic(testCase);
  console.log(`   🎯 RESULTADO: ${result ? "✅ ÉXITO" : "❌ FALLO"}`);
});

console.log("\n🎉 Prueba completada");
