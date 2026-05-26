import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TecnoCel Web API',
      description: 'API REST para la tienda en línea de productos tecnológicos TecnoCel Web. Incluye gestión de productos, clientes, ventas, carrito de compras y más.',
      version: '1.0.0',
      contact: {
        name: 'Soporte TecnoCel'
      }
    },
    servers: [
      {
        url: 'https://tecnocel-api.onrender.com/api',
        description: 'Servidor de producción (Render)'
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de desarrollo (Local)'
      }
    ],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'JWT token. Formato: "Bearer {token}"'
      },
      bearerAuthCliente: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'JWT token para clientes. Formato: "Bearer {token}"'
      }
    }
  },
  // Swagger-jsdoc puede leer tanto .js como .ts directamente
  // porque parsea los comentarios JSDoc del código fuente
  apis: [
    path.join(__dirname, '../src/routes/*.ts'),
    path.join(__dirname, '../src/routes/*.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);
const outputPath = path.join(__dirname, '../src/swagger.json');

fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log('✅ Swagger documentation generated successfully!');
console.log(`📄 Output: ${outputPath}`);
console.log(`📋 Endpoints documentados: ${Object.keys(swaggerSpec.paths || {}).length}`);
