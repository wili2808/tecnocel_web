// Script para probar la creación de clientes con Google ID
// Ejecutar con: node test-google-creation.js

import { Sequelize, Op } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tecnocel_db_v2",
  port: process.env.DB_PORT || 3306,
  logging: false,
});

async function testGoogleClientCreation() {
  try {
    console.log("🧪 Probando creación de cliente con Google ID...");

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida");

    // Datos de prueba
    const testGoogleId = "110998812894150885577";
    const testEmail = "test-google-user@gmail.com";
    const testName = "Test";
    const testLastName = "Google User";

    console.log("📊 Datos de prueba:");
    console.log(`   Google ID: ${testGoogleId}`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Nombre: ${testName} ${testLastName}`);

    // Paso 1: Buscar cliente existente usando SQL directo
    console.log("\n🔍 Paso 1: Buscando cliente existente...");
    const [existingClients] = await sequelize.query(
      `
      SELECT id_cliente, email_cliente, google_id 
      FROM tb_clientes 
      WHERE google_id = ? OR (email_cliente = ? AND is_web_enabled = 1)
    `,
      {
        replacements: [testGoogleId, testEmail],
      }
    );

    let cliente = existingClients[0];
    if (cliente) {
      console.log("✅ Cliente encontrado:", {
        id: cliente.id_cliente,
        email: cliente.email_cliente,
        google_id: cliente.google_id,
      });
    } else {
      console.log("❌ Cliente no encontrado, procediendo a crear...");
    }

    // Paso 2: Crear cliente si no existe
    if (!cliente) {
      console.log("\n🔧 Paso 2: Creando nuevo cliente...");
      try {
        const [newClient] = await sequelize.query(
          `
          INSERT INTO tb_clientes (
            nombre_cliente, apellido_cliente, email_cliente, 
            nit_ci_cliente, celular_cliente, is_web_enabled, 
            email_verified, google_id, fyh_creacion, fyh_actualizacion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
          {
            replacements: [
              testName,
              testLastName,
              testEmail,
              `GOOGLE_${testGoogleId}`,
              "000000000",
              1, // is_web_enabled
              1, // email_verified
              testGoogleId,
            ],
          }
        );

        console.log(
          "✅ Cliente creado exitosamente con ID:",
          newClient.insertId
        );
        cliente = {
          id_cliente: newClient.insertId,
          email_cliente: testEmail,
          google_id: testGoogleId,
        };
      } catch (createError) {
        console.error("❌ Error al crear cliente:", createError.message);
        console.error("❌ Detalles del error:", createError);
        return;
      }
    }

    // Paso 3: Verificar que el cliente se guardó correctamente
    console.log("\n🔍 Paso 3: Verificando cliente en base de datos...");
    const [savedClients] = await sequelize.query(
      `
      SELECT id_cliente, email_cliente, google_id, nombre_cliente, apellido_cliente
      FROM tb_clientes 
      WHERE id_cliente = ?
    `,
      {
        replacements: [cliente.id_cliente],
      }
    );

    if (savedClients.length > 0) {
      const savedCliente = savedClients[0];
      console.log("✅ Cliente verificado en base de datos:", {
        id: savedCliente.id_cliente,
        email: savedCliente.email_cliente,
        google_id: savedCliente.google_id,
        nombre: savedCliente.nombre_cliente,
        apellido: savedCliente.apellido_cliente,
      });
    } else {
      console.log("❌ Cliente no encontrado en base de datos");
    }

    // Paso 4: Limpiar datos de prueba
    console.log("\n🧹 Paso 4: Limpiando datos de prueba...");
    if (cliente && cliente.email_cliente === testEmail) {
      await sequelize.query("DELETE FROM tb_clientes WHERE email_cliente = ?", {
        replacements: [testEmail],
      });
      console.log("✅ Cliente de prueba eliminado");
    }
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
    console.error("❌ Stack trace:", error.stack);
  } finally {
    await sequelize.close();
    console.log("🔌 Conexión cerrada");
  }
}

testGoogleClientCreation();
