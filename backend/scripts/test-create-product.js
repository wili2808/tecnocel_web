/**
 * Script de prueba para endpoint privado: createProduct
 *
 * Este script demuestra cómo:
 * 1. Hacer login para obtener un token JWT
 * 2. Usar el token para crear un producto
 *
 * Uso: node scripts/test-create-product.js
 */

const BASE_URL = 'http://localhost:3000/api';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`)
};

/**
 * Función para hacer login y obtener token
 */
async function login() {
  log.step('Paso 1: Haciendo login...');

  // Opciones de login - MODIFICA ESTAS CREDENCIALES
  const loginOptions = [
    {
      type: 'cliente',
      endpoint: '/clientes/login',
      credentials: {
        email_cliente: 'cliente@example.com',
        contrasena: 'password123'
      }
    },
    {
      type: 'usuario/admin',
      endpoint: '/usuarios/login',
      credentials: {
        email: 'admin@tecnocel.com',
        contrasena: 'admin123'
      }
    }
  ];

  // Intentar primero con cliente, luego con usuario/admin
  for (const option of loginOptions) {
    try {
      log.info(`Intentando login como ${option.type}...`);

      const response = await fetch(`${BASE_URL}${option.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(option.credentials)
      });

      const data = await response.json();

      if (response.ok && data.token) {
        log.success(`Login exitoso como ${option.type}`);
        log.info(`Token obtenido: ${data.token.substring(0, 20)}...`);
        return { token: data.token, type: option.type };
      } else {
        log.warn(`Login como ${option.type} falló: ${data.mensaje || 'Error desconocido'}`);
      }
    } catch (error) {
      log.warn(`Error al intentar login como ${option.type}: ${error.message}`);
    }
  }

  // Si ninguno funcionó, intentar registro
  log.warn('Ningún login funcionó, intentando registrar nuevo cliente...');
  return await registerAndLogin();
}

/**
 * Función para registrar un nuevo cliente si no existe
 */
async function registerAndLogin() {
  log.step('Registrando nuevo cliente...');

  const registroData = {
    nombre_cliente: 'Test',
    apellido_cliente: 'Usuario',
    email_cliente: `test${Date.now()}@example.com`,
    celular_cliente: '70000000',
    nit_ci_cliente: '0000000',
    contrasena: 'Test123456'
  };

  try {
    const response = await fetch(`${BASE_URL}/clientes/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registroData)
    });

    const data = await response.json();

    if (response.ok && data.token) {
      log.success('Cliente registrado exitosamente');
      log.info(`Email: ${registroData.email_cliente}`);
      log.info(`Contraseña: ${registroData.contrasena}`);
      log.info(`Token obtenido: ${data.token.substring(0, 20)}...`);
      return { token: data.token, type: 'cliente (nuevo)' };
    } else {
      log.error(`Error en registro: ${data.mensaje || 'Error desconocido'}`);
      return null;
    }
  } catch (error) {
    log.error(`Error al registrar: ${error.message}`);
    return null;
  }
}

/**
 * Función para crear un producto usando el token
 */
async function createProduct(token) {
  log.step('Paso 2: Creando producto...');

  // Datos del producto a crear
  const productoData = {
    codigo: `TEST-${Date.now()}`,
    nombre: 'Producto de Prueba',
    descripcion: 'Este es un producto creado mediante script de prueba',
    precio_venta: 999.99,
    stock: 100,
    id_categoria: 1,  // Asegúrate de que esta categoría exista
    id_marca: 1,      // Asegúrate de que esta marca exista
    id_usuario: 1,    // Usuario que crea el producto
    es_destacado: false,
    imagenes: [
      {
        url_imagen: 'test-producto.jpg',
        alt_text: 'Imagen de prueba del producto'
      }
    ]
  };

  log.info('Datos del producto:');
  console.log(JSON.stringify(productoData, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/almacen/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productoData)
    });

    const data = await response.json();

    if (response.ok) {
      log.success('Producto creado exitosamente!');
      log.info(`ID del producto: ${data.id_producto || 'N/A'}`);
      log.info(`Nombre: ${data.nombre || productoData.nombre}`);
      console.log('\nRespuesta completa:');
      console.log(JSON.stringify(data, null, 2));
      return data;
    } else {
      log.error(`Error al crear producto (${response.status}): ${data.message || data.mensaje || 'Error desconocido'}`);

      // Mostrar detalles del error
      if (response.status === 401) {
        log.warn('Token inválido o expirado. Intenta hacer login nuevamente.');
      } else if (response.status === 403) {
        log.warn('No tienes permisos para crear productos. Necesitas ser admin/usuario.');
      }

      console.log('\nRespuesta de error:');
      console.log(JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    log.error(`Error de red: ${error.message}`);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  TEST: Crear Producto (Endpoint Privado)');
  console.log('='.repeat(60) + '\n');

  // Verificar que el servidor esté corriendo
  log.info('Verificando conexión al servidor...');
  try {
    const response = await fetch(`${BASE_URL}/almacen/productos?limit=1`);
    if (!response.ok) {
      log.error('El servidor no responde correctamente');
      log.warn('Asegúrate de que el backend esté corriendo en http://localhost:3000');
      process.exit(1);
    }
    log.success('Servidor conectado correctamente');
  } catch (error) {
    log.error(`No se pudo conectar al servidor: ${error.message}`);
    log.warn('Ejecuta: npm run dev (desde el directorio backend/)');
    process.exit(1);
  }

  console.log();

  // Paso 1: Obtener token
  const authResult = await login();

  if (!authResult || !authResult.token) {
    log.error('No se pudo obtener un token de autenticación');
    log.warn('Verifica las credenciales en el script o crea un usuario/cliente primero');
    process.exit(1);
  }

  console.log();

  // Paso 2: Crear producto
  const producto = await createProduct(authResult.token);

  console.log('\n' + '='.repeat(60));
  if (producto) {
    log.success('Test completado exitosamente!');
  } else {
    log.error('El test falló');
  }
  console.log('='.repeat(60) + '\n');
}

// Ejecutar el script
main().catch(error => {
  log.error(`Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
