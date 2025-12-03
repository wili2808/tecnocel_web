/**
 * Script de Generación de Datos de Producción - TecnoCel
 *
 * Este script genera datos realistas de productos electrónicos modernos
 * basados en el mercado boliviano 2025.
 *
 * PRECIOS EN DÓLARES (USD)
 *
 * Requisitos:
 * - Base de datos db_tecnocel_v6 creada
 * - Variables de entorno configuradas
 * - Usuario admin creado (id_usuario = 1)
 *
 * Uso:
 * node database/scripts/generar_datos_produccion.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_tecnocel_v4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// ===================================
// CATEGORÍAS SIMPLIFICADAS
// ===================================

const categorias = [
  { id: 1, nombre: 'Smartphones', descripcion: 'Teléfonos inteligentes de todas las marcas' },
  { id: 2, nombre: 'Laptops', descripcion: 'Computadoras portátiles gaming y profesionales' },
  { id: 3, nombre: 'Tablets', descripcion: 'Tablets iPad y Android' },
  { id: 4, nombre: 'Smartwatches', descripcion: 'Relojes inteligentes' },
  { id: 5, nombre: 'Auriculares', descripcion: 'Auriculares inalámbricos y con cable' },
  { id: 6, nombre: 'Parlantes', descripcion: 'Altavoces portátiles y de escritorio' },
  { id: 7, nombre: 'Consolas', descripcion: 'Consolas de videojuegos' },
  { id: 8, nombre: 'Accesorios Gaming', descripcion: 'Controles y accesorios para gaming' },
  { id: 9, nombre: 'Cargadores', descripcion: 'Cargadores y cables' },
  { id: 10, nombre: 'Fundas y Protectores', descripcion: 'Fundas y protectores para dispositivos' },
  { id: 11, nombre: 'Smart Bands', descripcion: 'Pulseras inteligentes fitness' }
];

// ===================================
// MARCAS
// ===================================

const marcas = [
  { id: 1, nombre: 'Samsung', logo: 'samsung.png', descripcion: 'Marca líder en smartphones y tecnología' },
  { id: 2, nombre: 'Apple', logo: 'apple.png', descripcion: 'iPhone, iPad, MacBook y productos premium' },
  { id: 3, nombre: 'Xiaomi', logo: 'xiaomi.png', descripcion: 'Smartphones con excelente relación precio-calidad' },
  { id: 4, nombre: 'Motorola', logo: 'motorola.png', descripcion: 'Smartphones duraderos y confiables' },
  { id: 5, nombre: 'Infinix', logo: null, descripcion: 'Smartphones accesibles con buenas prestaciones' },
  { id: 6, nombre: 'Honor', logo: null, descripcion: 'Smartphones elegantes y potentes' },
  { id: 7, nombre: 'Realme', logo: 'realme.png', descripcion: 'Smartphones jóvenes e innovadores' },
  { id: 8, nombre: 'JBL', logo: 'jbl.png', descripcion: 'Altavoces y auriculares de alta calidad' },
  { id: 9, nombre: 'Sony', logo: 'sony.png', descripcion: 'Audio profesional y consumer' },
  { id: 10, nombre: 'Gamesir', logo: null, descripcion: 'Controles y accesorios gaming' },
  { id: 11, nombre: 'PlayStation', logo: 'play-station.png', descripcion: 'Consolas y juegos Sony' },
  { id: 12, nombre: 'Xbox', logo: 'xbox.png', descripcion: 'Consolas y juegos Microsoft' },
  { id: 13, nombre: 'Nintendo', logo: 'nintendo.png', descripcion: 'Consolas portátiles y juegos' },
  { id: 14, nombre: 'HP', logo: 'hp.png', descripcion: 'Computadoras y laptops empresariales' },
  { id: 15, nombre: 'Asus', logo: 'asus.png', descripcion: 'Laptops gaming y profesionales' },
  { id: 16, nombre: 'Dell', logo: 'dell.png', descripcion: 'Laptops y computadoras profesionales' },
  { id: 17, nombre: 'Lenovo', logo: 'lenovo.png', descripcion: 'ThinkPad y laptops empresariales' },
  { id: 18, nombre: 'Acer', logo: 'acer.png', descripcion: 'Laptops gaming y multimedia' },
  { id: 19, nombre: 'MSI', logo: 'msi.png', descripcion: 'Laptops gaming de alto rendimiento' },
  { id: 20, nombre: 'Razer', logo: 'razer.png', descripcion: 'Periféricos y laptops gaming premium' }
];

// ===================================
// CATÁLOGO DE PRODUCTOS MODERNOS 2025
// ===================================

const catalogoProductos = {

  // ================== SMARTPHONES ==================

  smartphones_gama_alta: [
    {
      codigo: 'APL-IPH16PMAX-256-TIT',
      nombre: 'iPhone 16 Pro Max 256GB Titanio Natural',
      modelo: 'iPhone 16 Pro Max',
      descripcion: 'El iPhone más avanzado hasta ahora. Pantalla Super Retina XDR de 6.9 pulgadas con ProMotion y Always-On. Chip A18 Pro con Neural Engine de 16 núcleos. Sistema de cámaras Pro con teleobjetivo Tetraprism 5x. Diseño de titanio con Ceramic Shield. Botón de Acción y Control de Cámara.',
      precio_compra: '1551.72',
      precio_venta: '1795.98',
      stock: 8,
      stock_minimo: 3,
      stock_maximo: 15,
      id_categoria: 1, // Smartphones
      id_marca: 2, // Apple
      es_destacado: true,
      orden_destacado: 1,
      imagenes: ['iphone_16_pro_max_titanium_front.jpg', 'iphone_16_pro_max_titanium_back.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.9' }, // Pantalla
        { id_tipo: 2, valor: '8' }, // RAM
        { id_tipo: 3, valor: '256' }, // Almacenamiento
        { id_tipo: 4, valor: '48' }, // Cámara Principal
        { id_tipo: 5, valor: '12' }, // Cámara Frontal
        { id_tipo: 6, valor: '4685' }, // Batería
        { id_tipo: 7, valor: 'iOS' }, // Sistema Operativo
        { id_tipo: 8, valor: '5G' }, // Conectividad
        { id_tipo: 9, valor: 'Titanio Natural' }, // Color
        { id_tipo: 10, valor: 'Apple A18 Pro' }, // Procesador
        { id_tipo: 14, valor: 'true' }, // Carga Rápida
        { id_tipo: 15, valor: 'true' } // Carga Inalámbrica
      ]
    },
    {
      codigo: 'APL-IPH16PRO-128-BLK',
      nombre: 'iPhone 16 Pro 128GB Titanio Negro',
      modelo: 'iPhone 16 Pro',
      descripcion: 'iPhone 16 Pro con pantalla Super Retina XDR de 6.3 pulgadas ProMotion. Chip A18 Pro. Sistema de cámaras Pro avanzado. Diseño premium de titanio con Ceramic Shield.',
      precio_compra: '1307.47',
      precio_venta: '1508.62',
      stock: 12,
      stock_minimo: 5,
      stock_maximo: 20,
      id_categoria: 2,
      id_marca: 2,
      es_destacado: true,
      orden_destacado: 2,
      imagenes: ['iphone_16_pro_black_front.jpg', 'iphone_16_pro_black_back.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.3' },
        { id_tipo: 2, valor: '8' },
        { id_tipo: 3, valor: '128' },
        { id_tipo: 4, valor: '48' },
        { id_tipo: 5, valor: '12' },
        { id_tipo: 6, valor: '3582' },
        { id_tipo: 7, valor: 'iOS' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Titanio Negro' },
        { id_tipo: 10, valor: 'Apple A18 Pro' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'true' }
      ]
    },
    {
      codigo: 'APL-IPH16-256-BLU',
      nombre: 'iPhone 16 256GB Azul Ultramar',
      modelo: 'iPhone 16',
      descripcion: 'iPhone 16 con pantalla Super Retina XDR de 6.1 pulgadas. Chip A18. Cámara Fusion de 48MP. Diseño de aluminio aeroespacial con Ceramic Shield. Botón de Acción y Control de Cámara.',
      precio_compra: '1106.32',
      precio_venta: '1278.74',
      stock: 15,
      stock_minimo: 8,
      stock_maximo: 25,
      id_categoria: 2,
      id_marca: 2,
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['iphone_16_blue_front.jpg', 'iphone_16_blue_back.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.1' },
        { id_tipo: 2, valor: '8' },
        { id_tipo: 3, valor: '256' },
        { id_tipo: 4, valor: '48' },
        { id_tipo: 5, valor: '12' },
        { id_tipo: 6, valor: '3561' },
        { id_tipo: 7, valor: 'iOS' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Azul Ultramar' },
        { id_tipo: 10, valor: 'Apple A18' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'true' }
      ]
    },
    {
      codigo: 'SAM-S24U-512-TIT',
      nombre: 'Samsung Galaxy S24 Ultra 512GB Titanio Gris',
      modelo: 'Galaxy S24 Ultra',
      descripcion: 'El smartphone Galaxy más poderoso. Pantalla Dynamic AMOLED 2X de 6.8 pulgadas QHD+ con 120Hz. Snapdragon 8 Gen 3 for Galaxy. Cámara de 200MP con zoom óptico 5x y Space Zoom 100x. S Pen integrado. Diseño premium de titanio.',
      precio_compra: '1465.52',
      precio_venta: '1695.40',
      stock: 10,
      stock_minimo: 4,
      stock_maximo: 18,
      id_categoria: 1, // CELULAR - SAMSUNG
      id_marca: 1, // Samsung
      es_destacado: true,
      orden_destacado: 3,
      imagenes: ['s24_ultra_titanium_front.jpg', 's24_ultra_titanium_back.jpg', 's24_ultra_spen.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.8' },
        { id_tipo: 2, valor: '12' },
        { id_tipo: 3, valor: '512' },
        { id_tipo: 4, valor: '200' },
        { id_tipo: 5, valor: '12' },
        { id_tipo: 6, valor: '5000' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Titanio Gris' },
        { id_tipo: 10, valor: 'Snapdragon 8 Gen 3' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'true' }
      ]
    },
    {
      codigo: 'SAM-S24PLUS-256-VIO',
      nombre: 'Samsung Galaxy S24+ 256GB Violeta',
      modelo: 'Galaxy S24+',
      descripcion: 'Galaxy S24+ con pantalla Dynamic AMOLED 2X de 6.7 pulgadas QHD+. Snapdragon 8 Gen 3. Triple cámara de 50MP. Batería de 4900mAh con carga rápida.',
      precio_compra: '1056.03',
      precio_venta: '1221.26',
      stock: 15,
      stock_minimo: 6,
      stock_maximo: 25,
      id_categoria: 1, // Smartphones
      id_marca: 1, // Samsung
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['s24_plus_violet_front.jpg', 's24_plus_violet_back.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.7' },
        { id_tipo: 2, valor: '12' },
        { id_tipo: 3, valor: '256' },
        { id_tipo: 4, valor: '50' },
        { id_tipo: 5, valor: '12' },
        { id_tipo: 6, valor: '4900' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Violeta' },
        { id_tipo: 10, valor: 'Snapdragon 8 Gen 3' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'true' }
      ]
    },
    {
      codigo: 'SAM-ZFOLD6-512-BLK',
      nombre: 'Samsung Galaxy Z Fold 6 512GB Negro',
      modelo: 'Galaxy Z Fold 6',
      descripcion: 'Smartphone plegable premium. Pantalla principal Dynamic AMOLED 2X de 7.6 pulgadas plegable. Pantalla externa de 6.3 pulgadas. Snapdragon 8 Gen 3. Triple cámara de 50MP. Diseño más delgado y ligero.',
      precio_compra: '1925.29',
      precio_venta: '2227.01',
      stock: 4,
      stock_minimo: 2,
      stock_maximo: 8,
      id_categoria: 1, // Smartphones
      id_marca: 1, // Samsung
      es_destacado: true,
      orden_destacado: 4,
      imagenes: ['zfold6_closed.jpg', 'zfold6_open.jpg', 'zfold6_multitasking.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '7.6' },
        { id_tipo: 2, valor: '12' },
        { id_tipo: 3, valor: '512' },
        { id_tipo: 4, valor: '50' },
        { id_tipo: 5, valor: '10' },
        { id_tipo: 6, valor: '4400' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Negro Fantasma' },
        { id_tipo: 10, valor: 'Snapdragon 8 Gen 3' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'true' }
      ]
    }
  ],

  smartphones_gama_media: [
    {
      codigo: 'XIA-14TPRO-512-BLK',
      nombre: 'Xiaomi 14T Pro 512GB Negro Titanio',
      modelo: '14T Pro',
      descripcion: 'Xiaomi 14T Pro con pantalla AMOLED de 6.67 pulgadas 144Hz. MediaTek Dimensity 9300+. Triple cámara Leica de 50MP. Carga HyperCharge de 120W.',
      precio_compra: '596.26',
      precio_venta: '689.66',
      stock: 25,
      stock_minimo: 10,
      stock_maximo: 40,
      id_categoria: 1, // Smartphones
      id_marca: 3, // Xiaomi
      es_destacado: true,
      orden_destacado: 5,
      imagenes: ['xiaomi_14tpro_front.jpg', 'xiaomi_14tpro_camera.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.67' },
        { id_tipo: 2, valor: '12' },
        { id_tipo: 3, valor: '512' },
        { id_tipo: 4, valor: '50' },
        { id_tipo: 5, valor: '32' },
        { id_tipo: 6, valor: '5000' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Negro Titanio' },
        { id_tipo: 10, valor: 'Dimensity 9300+' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'false' }
      ]
    },
    {
      codigo: 'XIA-RN13PRO-256-PUR',
      nombre: 'Xiaomi Redmi Note 13 Pro 256GB Púrpura',
      modelo: 'Redmi Note 13 Pro',
      descripcion: 'Redmi Note 13 Pro con cámara de 200MP. Pantalla AMOLED de 6.67 pulgadas 120Hz. Snapdragon 7s Gen 2. Batería de 5100mAh con carga de 67W.',
      precio_compra: '285.92',
      precio_venta: '330.46',
      stock: 40,
      stock_minimo: 15,
      stock_maximo: 60,
      id_categoria: 1, // Smartphones
      id_marca: 3, // Xiaomi
      es_destacado: true,
      orden_destacado: 6,
      imagenes: ['redmi_note13pro_purple.jpg', 'redmi_note13pro_camera.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.67' },
        { id_tipo: 2, valor: '8' },
        { id_tipo: 3, valor: '256' },
        { id_tipo: 4, valor: '200' },
        { id_tipo: 5, valor: '16' },
        { id_tipo: 6, valor: '5100' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Púrpura' },
        { id_tipo: 10, valor: 'Snapdragon 7s Gen 2' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'false' }
      ]
    },
    {
      codigo: 'MOT-EDGE50PRO-512-BLU',
      nombre: 'Motorola Edge 50 Pro 512GB Azul Luxe',
      modelo: 'Edge 50 Pro',
      descripcion: 'Motorola Edge 50 Pro con pantalla pOLED de 6.7 pulgadas 144Hz. Snapdragon 7 Gen 3. Triple cámara de 50MP. Carga TurboPower de 125W. Diseño premium vegano.',
      precio_compra: '484.20',
      precio_venta: '560.34',
      stock: 20,
      stock_minimo: 8,
      stock_maximo: 35,
      id_categoria: 1, // Smartphones
      id_marca: 4, // Motorola
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['edge50pro_blue.jpg', 'edge50pro_camera.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.7' },
        { id_tipo: 2, valor: '12' },
        { id_tipo: 3, valor: '512' },
        { id_tipo: 4, valor: '50' },
        { id_tipo: 5, valor: '50' },
        { id_tipo: 6, valor: '4500' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Azul Luxe' },
        { id_tipo: 10, valor: 'Snapdragon 7 Gen 3' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'true' }
      ]
    },
    {
      codigo: 'MOT-G84-256-GRN',
      nombre: 'Motorola Moto G84 256GB Verde Viva Magenta',
      modelo: 'Moto G84',
      descripcion: 'Moto G84 con pantalla pOLED de 6.5 pulgadas 120Hz. Snapdragon 695. Cámara de 50MP con OIS. Diseño delgado con certificación IP52.',
      precio_compra: '224.14',
      precio_venta: '258.62',
      stock: 35,
      stock_minimo: 12,
      stock_maximo: 50,
      id_categoria: 1, // Smartphones
      id_marca: 4, // Motorola
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['motog84_magenta.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.5' },
        { id_tipo: 2, valor: '12' },
        { id_tipo: 3, valor: '256' },
        { id_tipo: 4, valor: '50' },
        { id_tipo: 5, valor: '16' },
        { id_tipo: 6, valor: '5000' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Verde Viva Magenta' },
        { id_tipo: 10, valor: 'Snapdragon 695' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'false' }
      ]
    }
  ],

  smartphones_gama_baja: [
    {
      codigo: 'INF-NOTE40PRO-256-BLK',
      nombre: 'Infinix Note 40 Pro 256GB Negro',
      modelo: 'Note 40 Pro',
      descripcion: 'Infinix Note 40 Pro con pantalla AMOLED de 6.78 pulgadas 120Hz. MediaTek Dimensity 7020. Cámara de 108MP. Batería de 5000mAh con carga de 45W.',
      precio_compra: '173.85',
      precio_venta: '201.15',
      stock: 30,
      stock_minimo: 10,
      stock_maximo: 50,
      id_categoria: 1, // Smartphones
      id_marca: 5, // Infinix
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['infinix_note40pro.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.78' },
        { id_tipo: 2, valor: '8' },
        { id_tipo: 3, valor: '256' },
        { id_tipo: 4, valor: '108' },
        { id_tipo: 5, valor: '32' },
        { id_tipo: 6, valor: '5000' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '5G' },
        { id_tipo: 9, valor: 'Negro' },
        { id_tipo: 10, valor: 'Dimensity 7020' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'false' }
      ]
    },
    {
      codigo: 'INF-HOT40PRO-128-GLD',
      nombre: 'Infinix Hot 40 Pro 128GB Dorado',
      modelo: 'Hot 40 Pro',
      descripcion: 'Infinix Hot 40 Pro con pantalla IPS de 6.78 pulgadas 120Hz. MediaTek Helio G99. Cámara de 108MP. Batería de 5000mAh.',
      precio_compra: '112.07',
      precio_venta: '129.31',
      stock: 50,
      stock_minimo: 20,
      stock_maximo: 80,
      id_categoria: 1, // Smartphones
      id_marca: 5, // Infinix
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['infinix_hot40pro_gold.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '6.78' },
        { id_tipo: 2, valor: '8' },
        { id_tipo: 3, valor: '128' },
        { id_tipo: 4, valor: '108' },
        { id_tipo: 5, valor: '32' },
        { id_tipo: 6, valor: '5000' },
        { id_tipo: 7, valor: 'Android' },
        { id_tipo: 8, valor: '4G' },
        { id_tipo: 9, valor: 'Dorado' },
        { id_tipo: 10, valor: 'Helio G99' },
        { id_tipo: 14, valor: 'true' },
        { id_tipo: 15, valor: 'false' }
      ]
    }
  ],

  // ================== LAPTOPS ==================

  laptops_gaming: [
    {
      codigo: 'ASU-ROGG16-I714-4060',
      nombre: 'Asus ROG Strix G16 (2024) i7 RTX 4060 16GB 1TB',
      modelo: 'ROG Strix G16',
      descripcion: 'Laptop gaming Asus ROG Strix G16 con pantalla FHD de 16 pulgadas 165Hz. Intel Core i7-14650HX. NVIDIA GeForce RTX 4060 8GB. 16GB DDR5 RAM. 1TB SSD NVMe. Sistema de refrigeración ROG Intelligent Cooling.',
      precio_compra: '1795.98',
      precio_venta: '2083.33',
      stock: 5,
      stock_minimo: 2,
      stock_maximo: 10,
      id_categoria: 2, // Laptops
      id_marca: 15, // Asus
      es_destacado: true,
      orden_destacado: 7,
      imagenes: ['rog_strix_g16.jpg', 'rog_strix_keyboard.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '16' },
        { id_tipo: 2, valor: '16' },
        { id_tipo: 3, valor: '1024' },
        { id_tipo: 7, valor: 'Windows' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 10, valor: 'Intel Core i7-14650HX' },
        { id_tipo: 11, valor: 'NVIDIA RTX 4060 8GB' },
        { id_tipo: 12, valor: '2300' }
      ]
    },
    {
      codigo: 'MSI-KATANA15-I713-4060',
      nombre: 'MSI Katana 15 B13V i7 RTX 4060 16GB 1TB',
      modelo: 'Katana 15 B13V',
      descripcion: 'Laptop gaming MSI Katana 15 con pantalla FHD de 15.6 pulgadas 144Hz. Intel Core i7-13620H. NVIDIA GeForce RTX 4060 8GB. 16GB DDR5. 1TB SSD.',
      precio_compra: '1142.24',
      precio_venta: '1321.84',
      stock: 10,
      stock_minimo: 4,
      stock_maximo: 15,
      id_categoria: 2, // Laptops
      id_marca: 19, // MSI
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['msi_katana15.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '15.6' },
        { id_tipo: 2, valor: '16' },
        { id_tipo: 3, valor: '1024' },
        { id_tipo: 7, valor: 'Windows' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 10, valor: 'Intel Core i7-13620H' },
        { id_tipo: 11, valor: 'NVIDIA RTX 4060 8GB' },
        { id_tipo: 12, valor: '2200' }
      ]
    }
  ],

  laptops_profesionales: [
    {
      codigo: 'APL-MBP16-M3PRO-18-512',
      nombre: 'MacBook Pro 16" M3 Pro 12-core 18GB 512GB',
      modelo: 'MacBook Pro 16"',
      descripcion: 'MacBook Pro de 16 pulgadas con pantalla Liquid Retina XDR. Chip M3 Pro con CPU de 12 núcleos y GPU de 18 núcleos. 18GB de memoria unificada. SSD de 512GB. Batería de hasta 22 horas.',
      precio_compra: '2421.26',
      precio_venta: '2801.72',
      stock: 4,
      stock_minimo: 2,
      stock_maximo: 8,
      id_categoria: 2, // Laptops
      id_marca: 2, // Apple
      es_destacado: true,
      orden_destacado: 8,
      imagenes: ['mbp16_m3pro.jpg', 'mbp16_ports.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '16.2' },
        { id_tipo: 2, valor: '18' },
        { id_tipo: 3, valor: '512' },
        { id_tipo: 7, valor: 'macOS' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 10, valor: 'Apple M3 Pro 12-core' },
        { id_tipo: 11, valor: 'GPU M3 Pro 18-core' },
        { id_tipo: 12, valor: '2140' }
      ]
    },
    {
      codigo: 'APL-MBA13-M2-8-256',
      nombre: 'MacBook Air 13" M2 8GB 256GB',
      modelo: 'MacBook Air 13"',
      descripcion: 'MacBook Air con pantalla Liquid Retina de 13.6 pulgadas. Chip M2 con CPU de 8 núcleos y GPU de 8 núcleos. 8GB de memoria unificada. SSD de 256GB. Diseño delgado sin ventilador.',
      precio_compra: '1106.32',
      precio_venta: '1278.74',
      stock: 12,
      stock_minimo: 5,
      stock_maximo: 20,
      id_categoria: 2, // Laptops
      id_marca: 2, // Apple
      es_destacado: true,
      orden_destacado: 9,
      imagenes: ['mba13_m2.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '13.6' },
        { id_tipo: 2, valor: '8' },
        { id_tipo: 3, valor: '256' },
        { id_tipo: 7, valor: 'macOS' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 10, valor: 'Apple M2 8-core' },
        { id_tipo: 11, valor: 'GPU M2 8-core' },
        { id_tipo: 12, valor: '1240' }
      ]
    },
    {
      codigo: 'LEN-IDP3-R5-8-512',
      nombre: 'Lenovo IdeaPad 3 15 Ryzen 5 8GB 512GB',
      modelo: 'IdeaPad 3 15',
      descripcion: 'Laptop Lenovo IdeaPad 3 con pantalla FHD de 15.6 pulgadas. AMD Ryzen 5 7530U. 8GB DDR4. SSD de 512GB. Windows 11 Home.',
      precio_compra: '434.63',
      precio_venta: '502.87',
      stock: 25,
      stock_minimo: 10,
      stock_maximo: 40,
      id_categoria: 2, // Laptops
      id_marca: 17, // Lenovo
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['ideapad3_15.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '15.6' },
        { id_tipo: 2, valor: '8' },
        { id_tipo: 3, valor: '512' },
        { id_tipo: 7, valor: 'Windows' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 10, valor: 'AMD Ryzen 5 7530U' },
        { id_tipo: 11, valor: 'AMD Radeon' },
        { id_tipo: 12, valor: '1650' }
      ]
    }
  ],

  // ================== TABLETS ==================

  tablets: [
    {
      codigo: 'APL-IPADPRO13-M4-256-WF',
      nombre: 'iPad Pro 13" M4 256GB WiFi',
      modelo: 'iPad Pro 13"',
      descripcion: 'iPad Pro de 13 pulgadas con pantalla Ultra Retina XDR OLED. Chip M4. 256GB de almacenamiento. Compatible con Apple Pencil Pro y Magic Keyboard.',
      precio_compra: '1056.03',
      precio_venta: '1221.26',
      stock: 5,
      stock_minimo: 2,
      stock_maximo: 10,
      id_categoria: 3, // Tablets
      id_marca: 2,
      es_destacado: true,
      orden_destacado: 10,
      imagenes: ['ipad_pro13_m4.jpg', 'ipad_pro13_pencil.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '13' },
        { id_tipo: 2, valor: '8' },
        { id_tipo: 3, valor: '256' },
        { id_tipo: 7, valor: 'iPadOS' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 10, valor: 'Apple M4' },
        { id_tipo: 12, valor: '579' }
      ]
    },
    {
      codigo: 'APL-IPAD-64-WF',
      nombre: 'iPad 10.9" 64GB WiFi',
      modelo: 'iPad 10.9"',
      descripcion: 'iPad con pantalla Liquid Retina de 10.9 pulgadas. Chip A14 Bionic. 64GB de almacenamiento. Compatible con Apple Pencil (1ra generación).',
      precio_compra: '347.70',
      precio_venta: '402.30',
      stock: 18,
      stock_minimo: 8,
      stock_maximo: 30,
      id_categoria: 3, // Tablets
      id_marca: 2, // Apple
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['ipad_109.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '10.9' },
        { id_tipo: 2, valor: '4' },
        { id_tipo: 3, valor: '64' },
        { id_tipo: 7, valor: 'iPadOS' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 10, valor: 'Apple A14 Bionic' },
        { id_tipo: 12, valor: '477' }
      ]
    }
  ],

  // ================== AUDIO ==================

  auriculares: [
    {
      codigo: 'APL-AIRPODSPRO2-USBC',
      nombre: 'Apple AirPods Pro 2 (USB-C)',
      modelo: 'AirPods Pro (2da generación)',
      descripcion: 'AirPods Pro con cancelación activa de ruido, modo Ambiente adaptativo, Audio Espacial Personalizado. Chip H2. Estuche MagSafe con USB-C. Hasta 30 horas de batería total.',
      precio_compra: '224.14',
      precio_venta: '258.62',
      stock: 25,
      stock_minimo: 10,
      stock_maximo: 40,
      id_categoria: 5, // Auriculares
      id_marca: 2,
      es_destacado: true,
      orden_destacado: 11,
      imagenes: ['airpods_pro2_usbc.jpg', 'airpods_pro2_case.jpg'],
      caracteristicas: [
        { id_tipo: 6, valor: '30' }, // Batería (horas)
        { id_tipo: 8, valor: 'Bluetooth 5.0' },
        { id_tipo: 9, valor: 'Blanco' }
      ]
    },
    {
      codigo: 'JBL-TUNE770NC-BLK',
      nombre: 'JBL Tune 770NC Negro',
      modelo: 'Tune 770NC',
      descripcion: 'Auriculares inalámbricos JBL con cancelación activa de ruido. Bluetooth 5.3. Hasta 70 horas de batería. JBL Pure Bass Sound.',
      precio_compra: '80.46',
      precio_venta: '93.39',
      stock: 40,
      stock_minimo: 15,
      stock_maximo: 60,
      id_categoria: 5, // Auriculares
      id_marca: 8, // JBL
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['jbl_tune770nc.jpg'],
      caracteristicas: [
        { id_tipo: 6, valor: '70' },
        { id_tipo: 8, valor: 'Bluetooth 5.0' },
        { id_tipo: 9, valor: 'Negro' }
      ]
    },
    {
      codigo: 'SNY-WH1000XM5-BLK',
      nombre: 'Sony WH-1000XM5 Negro',
      modelo: 'WH-1000XM5',
      descripcion: 'Auriculares premium con la mejor cancelación de ruido de la industria. Procesador V1. Audio de alta resolución con LDAC. 30 horas de batería. Diseño renovado.',
      precio_compra: '310.34',
      precio_venta: '359.20',
      stock: 12,
      stock_minimo: 5,
      stock_maximo: 20,
      id_categoria: 5, // Auriculares
      id_marca: 9, // Sony
      es_destacado: true,
      orden_destacado: 12,
      imagenes: ['sony_wh1000xm5.jpg'],
      caracteristicas: [
        { id_tipo: 6, valor: '30' },
        { id_tipo: 8, valor: 'Bluetooth 5.0' },
        { id_tipo: 9, valor: 'Negro' }
      ]
    }
  ],

  parlantes: [
    {
      codigo: 'JBL-CHARGE5-BLU',
      nombre: 'JBL Charge 5 Azul',
      modelo: 'Charge 5',
      descripcion: 'Parlante portátil JBL con certificación IP67. 40W de potencia. 20 horas de batería. Función powerbank. JBL PartyBoost.',
      precio_compra: '122.13',
      precio_venta: '140.80',
      stock: 35,
      stock_minimo: 15,
      stock_maximo: 50,
      id_categoria: 6, // Parlantes
      id_marca: 8,
      es_destacado: true,
      orden_destacado: 13,
      imagenes: ['jbl_charge5_blue.jpg'],
      caracteristicas: [
        { id_tipo: 6, valor: '20' },
        { id_tipo: 8, valor: 'Bluetooth 5.0' },
        { id_tipo: 9, valor: 'Azul' },
        { id_tipo: 13, valor: 'IP67' }
      ]
    },
    {
      codigo: 'JBL-FLIP6-RED',
      nombre: 'JBL Flip 6 Rojo',
      modelo: 'Flip 6',
      descripcion: 'Parlante portátil compacto JBL con certificación IP67. 30W de potencia. 12 horas de batería. JBL PartyBoost.',
      precio_compra: '89.08',
      precio_venta: '103.45',
      stock: 45,
      stock_minimo: 20,
      stock_maximo: 70,
      id_categoria: 6, // Parlantes
      id_marca: 8, // JBL
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['jbl_flip6_red.jpg'],
      caracteristicas: [
        { id_tipo: 6, valor: '12' },
        { id_tipo: 8, valor: 'Bluetooth 5.0' },
        { id_tipo: 9, valor: 'Rojo' },
        { id_tipo: 13, valor: 'IP67' }
      ]
    }
  ],

  // ================== GAMING ==================

  consolas: [
    {
      codigo: 'SNY-PS5SLIM-DIGITAL',
      nombre: 'PlayStation 5 Slim Digital Edition',
      modelo: 'PS5 Slim',
      descripcion: 'Consola PlayStation 5 edición digital sin lector de discos. 1TB SSD. Ray Tracing. 4K a 120fps. Tempest 3D AudioTech. DualSense incluido.',
      precio_compra: '521.55',
      precio_venta: '603.45',
      stock: 12,
      stock_minimo: 5,
      stock_maximo: 20,
      id_categoria: 7, // Consolas
      id_marca: 11, // PlayStation
      es_destacado: true,
      orden_destacado: 14,
      imagenes: ['ps5_slim_digital.jpg', 'ps5_dualsense.jpg'],
      caracteristicas: [
        { id_tipo: 3, valor: '1024' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 9, valor: 'Blanco' }
      ]
    },
    {
      codigo: 'MS-XBOXSERIESX',
      nombre: 'Xbox Series X',
      modelo: 'Xbox Series X',
      descripcion: 'Consola Xbox Series X. 1TB SSD. 12 TFLOPS. 4K a 120fps. Ray Tracing. Quick Resume. Xbox Game Pass compatible.',
      precio_compra: '646.55',
      precio_venta: '747.13',
      stock: 8,
      stock_minimo: 3,
      stock_maximo: 15,
      id_categoria: 7, // Consolas
      id_marca: 12, // Xbox // Xbox
      es_destacado: true,
      orden_destacado: 15,
      imagenes: ['xbox_series_x.jpg'],
      caracteristicas: [
        { id_tipo: 3, valor: '1024' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 9, valor: 'Negro' }
      ]
    },
    {
      codigo: 'NIN-SWITCHOLED-WHT',
      nombre: 'Nintendo Switch OLED Blanco',
      modelo: 'Switch OLED',
      descripcion: 'Nintendo Switch modelo OLED con pantalla de 7 pulgadas. 64GB de almacenamiento interno. Soporte ajustable mejorado. Dock con puerto LAN.',
      precio_compra: '360.63',
      precio_venta: '416.67',
      stock: 20,
      stock_minimo: 8,
      stock_maximo: 30,
      id_categoria: 7, // Consolas
      id_marca: 13, // Nintendo // Nintendo
      es_destacado: true,
      orden_destacado: 16,
      imagenes: ['switch_oled_white.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '7' },
        { id_tipo: 3, valor: '64' },
        { id_tipo: 8, valor: 'WiFi 6' },
        { id_tipo: 9, valor: 'Blanco' }
      ]
    }
  ],

  joysticks: [
    {
      codigo: 'SNY-DUALSENSE-WHT',
      nombre: 'PlayStation 5 DualSense Blanco',
      modelo: 'DualSense',
      descripcion: 'Control inalámbrico DualSense para PS5 con Haptic Feedback, gatillos adaptativos, micrófono integrado y USB-C.',
      precio_compra: '71.84',
      precio_venta: '83.33',
      stock: 40,
      stock_minimo: 15,
      stock_maximo: 60,
      id_categoria: 8, // Accesorios Gaming
      id_marca: 11,
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['dualsense_white.jpg'],
      caracteristicas: [
        { id_tipo: 8, valor: 'Bluetooth 5.0' },
        { id_tipo: 9, valor: 'Blanco' }
      ]
    },
    {
      codigo: 'MS-XBOXCTRL-BLK',
      nombre: 'Xbox Series X|S Controller Negro',
      modelo: 'Xbox Wireless Controller',
      descripcion: 'Control inalámbrico Xbox con textura antideslizante, botón Share, D-pad híbrido y USB-C. Compatible con Xbox y PC.',
      precio_compra: '59.63',
      precio_venta: '68.97',
      stock: 45,
      stock_minimo: 18,
      stock_maximo: 70,
      id_categoria: 8, // Accesorios Gaming
      id_marca: 12,
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['xbox_controller_black.jpg'],
      caracteristicas: [
        { id_tipo: 8, valor: 'Bluetooth 5.0' },
        { id_tipo: 9, valor: 'Negro' }
      ]
    }
  ],

  // ================== WEARABLES ==================

  smartwatches: [
    {
      codigo: 'APL-WATCH10-GPS-46',
      nombre: 'Apple Watch Series 10 GPS 46mm',
      modelo: 'Apple Watch Series 10',
      descripcion: 'Apple Watch Series 10 con pantalla Always-On Retina más grande y delgada. Chip S10. Detección de caídas y accidentes. watchOS 11. Hasta 18 horas de batería.',
      precio_compra: '434.63',
      precio_venta: '502.87',
      stock: 15,
      stock_minimo: 6,
      stock_maximo: 25,
      id_categoria: 4, // Smartwatches
      id_marca: 2,
      es_destacado: true,
      orden_destacado: 17,
      imagenes: ['apple_watch10.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '1.96' },
        { id_tipo: 6, valor: '18' },
        { id_tipo: 7, valor: 'watchOS' },
        { id_tipo: 8, valor: 'Bluetooth 5.0' }
      ]
    },
    {
      codigo: 'SAM-WATCH7-44',
      nombre: 'Samsung Galaxy Watch 7 44mm',
      modelo: 'Galaxy Watch 7',
      descripcion: 'Samsung Galaxy Watch 7 con pantalla Super AMOLED. Procesador Exynos W1000. Wear OS 5. Seguimiento de salud avanzado. GPS integrado.',
      precio_compra: '347.70',
      precio_venta: '402.30',
      stock: 20,
      stock_minimo: 8,
      stock_maximo: 35,
      id_categoria: 8, // SMARTWATCH - GALAXY WATCH
      id_marca: 1,
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['galaxy_watch7.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '1.5' },
        { id_tipo: 6, valor: '40' },
        { id_tipo: 7, valor: 'Wear OS' },
        { id_tipo: 8, valor: 'Bluetooth 5.0' }
      ]
    }
  ],

  smartbands: [
    {
      codigo: 'XIA-BAND8PRO-BLK',
      nombre: 'Xiaomi Smart Band 8 Pro Negro',
      modelo: 'Smart Band 8 Pro',
      descripcion: 'Xiaomi Smart Band 8 Pro con pantalla AMOLED de 1.74 pulgadas. GPS integrado. Hasta 14 días de batería. Más de 150 modos deportivos.',
      precio_compra: '59.63',
      precio_venta: '68.97',
      stock: 60,
      stock_minimo: 25,
      stock_maximo: 100,
      id_categoria: 11, // Smart Bands
      id_marca: 3,
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['xiaomi_band8pro.jpg'],
      caracteristicas: [
        { id_tipo: 1, valor: '1.74' },
        { id_tipo: 6, valor: '14' },
        { id_tipo: 8, valor: 'Bluetooth 5.0' },
        { id_tipo: 9, valor: 'Negro' }
      ]
    }
  ],

  // ================== ACCESORIOS ==================

  cargadores: [
    {
      codigo: 'APL-MAGSAFE-15W',
      nombre: 'Cargador Apple MagSafe 15W',
      modelo: 'MagSafe Charger',
      descripcion: 'Cargador inalámbrico MagSafe de Apple con alineación magnética perfecta. 15W de carga rápida para iPhone 12 y posteriores.',
      precio_compra: '34.48',
      precio_venta: '40.23',
      stock: 50,
      stock_minimo: 20,
      stock_maximo: 80,
      id_categoria: 9, // Cargadores
      id_marca: 2,
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['magsafe_charger.jpg'],
      caracteristicas: [
        { id_tipo: 9, valor: 'Blanco' }
      ]
    },
    {
      codigo: 'APL-USB C-20W',
      nombre: 'Cargador Apple USB-C 20W',
      modelo: 'USB-C Power Adapter 20W',
      descripcion: 'Adaptador de corriente USB-C de 20W de Apple. Ideal para iPhone, iPad y AirPods. Carga rápida compatible.',
      precio_compra: '18.68',
      precio_venta: '21.55',
      stock: 80,
      stock_minimo: 30,
      stock_maximo: 120,
      id_categoria: 9, // Cargadores
      id_marca: 2, // Apple
      es_destacado: false,
      orden_destacado: 0,
      imagenes: ['apple_20w_charger.jpg'],
      caracteristicas: [
        { id_tipo: 9, valor: 'Blanco' }
      ]
    }
  ]
};

// ===================================
// FUNCIONES AUXILIARES
// ===================================

/**
 * Genera fecha aleatoria entre dos fechas
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Formatea fecha para MySQL
 */
function formatDateForMySQL(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Convierte array plano a grupos por categoría
 */
function agruparProductosPorCategoria() {
  const todosProductos = [];

  for (const categoria in catalogoProductos) {
    todosProductos.push(...catalogoProductos[categoria]);
  }

  return todosProductos;
}

// ===================================
// SCRIPT PRINCIPAL
// ===================================

async function generarDatosProduccion() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');

    // ========== INSERTAR/ACTUALIZAR CATEGORÍAS ==========
    console.log('📁 Configurando categorías...\n');

    for (const cat of categorias) {
      try {
        await connection.query(`
          INSERT INTO tb_categorias (id_categoria, nombre_categoria, fyh_creacion, fyh_actualizacion)
          VALUES (?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            nombre_categoria = VALUES(nombre_categoria),
            fyh_actualizacion = NOW()
        `, [cat.id, cat.nombre]);

        console.log(`  ✓ ${cat.nombre}`);
      } catch (error) {
        console.error(`  ❌ Error con categoría ${cat.nombre}:`, error.message);
      }
    }

    console.log('\n✅ Categorías configuradas\n');

    // ========== INSERTAR/ACTUALIZAR MARCAS ==========
    console.log('🏷️  Configurando marcas...\n');

    for (const marca of marcas) {
      try {
        await connection.query(`
          INSERT INTO tb_marcas (id_marca, nombre_marca, logo_marca, descripcion_marca, activo, fyh_creacion, fyh_actualizacion)
          VALUES (?, ?, ?, ?, 1, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            nombre_marca = VALUES(nombre_marca),
            logo_marca = VALUES(logo_marca),
            descripcion_marca = VALUES(descripcion_marca),
            fyh_actualizacion = NOW()
        `, [marca.id, marca.nombre, marca.logo, marca.descripcion]);

        console.log(`  ✓ ${marca.nombre}`);
      } catch (error) {
        console.error(`  ❌ Error con marca ${marca.nombre}:`, error.message);
      }
    }

    console.log('\n✅ Marcas configuradas\n');

    // ========== LIMPIAR DATOS EXISTENTES ==========
    console.log('🗑️  Limpiando productos existentes...');

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    await connection.query('DELETE FROM tb_producto_caracteristicas');
    await connection.query('DELETE FROM tb_productos_ofertas');
    await connection.query('DELETE FROM tb_producto_imagenes');
    await connection.query('DELETE FROM tb_almacen');

    // Reiniciar auto_increment
    await connection.query('ALTER TABLE tb_almacen AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE tb_producto_imagenes AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE tb_producto_caracteristicas AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE tb_productos_ofertas AUTO_INCREMENT = 1');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Datos anteriores eliminados\n');

    // ========== INSERTAR PRODUCTOS ==========
    console.log('📦 Insertando productos...\n');

    const todosProductos = agruparProductosPorCategoria();
    let productoId = 1;
    let contadorProductos = 0;

    const fechaBase = new Date('2024-12-01');
    const fechaActual = new Date();

    for (const producto of todosProductos) {
      const fechaIngreso = randomDate(fechaBase, fechaActual);
      const fyh = formatDateForMySQL(fechaIngreso);

      // Insertar producto
      const sqlProducto = `
        INSERT INTO tb_almacen (
          codigo, nombre, modelo, descripcion, stock, stock_minimo, stock_maximo,
          precio_compra, precio_venta, fecha_ingreso, id_usuario, id_categoria, id_marca,
          es_destacado, orden_destacado, fyh_creacion, fyh_actualizacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.query(sqlProducto, [
        producto.codigo,
        producto.nombre,
        producto.modelo || null,
        producto.descripcion,
        producto.stock,
        producto.stock_minimo,
        producto.stock_maximo,
        producto.precio_compra,
        producto.precio_venta,
        formatDateForMySQL(fechaIngreso),
        1, // id_usuario admin
        producto.id_categoria,
        producto.id_marca || null,
        producto.es_destacado ? 1 : 0,
        producto.orden_destacado,
        fyh,
        fyh
      ]);

      console.log(`  ✓ ${productoId}. ${producto.nombre}`);

      // Insertar imágenes
      if (producto.imagenes && producto.imagenes.length > 0) {
        for (let i = 0; i < producto.imagenes.length; i++) {
          const sqlImagen = `
            INSERT INTO tb_producto_imagenes (
              id_producto, url_imagen, alt_text, es_principal, orden, fyh_creacion
            ) VALUES (?, ?, ?, ?, ?, ?)
          `;

          await connection.query(sqlImagen, [
            productoId,
            producto.imagenes[i],
            `${producto.nombre} - Imagen ${i + 1}`,
            i === 0 ? 1 : 0, // Primera imagen es principal
            i,
            fyh
          ]);
        }
        console.log(`     └─ ${producto.imagenes.length} imagen(es)`);
      }

      // Insertar características
      if (producto.caracteristicas && producto.caracteristicas.length > 0) {
        for (const caract of producto.caracteristicas) {
          const sqlCaract = `
            INSERT INTO tb_producto_caracteristicas (
              id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion
            ) VALUES (?, ?, ?, ?, ?)
          `;

          await connection.query(sqlCaract, [
            productoId,
            caract.id_tipo,
            caract.valor,
            fyh,
            fyh
          ]);
        }
        console.log(`     └─ ${producto.caracteristicas.length} característica(s)`);
      }

      productoId++;
      contadorProductos++;
      console.log('');
    }

    console.log(`\n✅ Total de productos insertados: ${contadorProductos}\n`);

    // ========== ASIGNAR OFERTAS ==========
    console.log('🎁 Asignando productos a ofertas...\n');

    // Obtener ofertas existentes
    const [ofertas] = await connection.query('SELECT * FROM tb_ofertas WHERE activo = 1');

    if (ofertas.length > 0) {
      // Asignar algunos productos a ofertas de forma aleatoria
      const [productos] = await connection.query('SELECT id_producto FROM tb_almacen ORDER BY RAND() LIMIT 20');

      for (const prod of productos) {
        // Elegir una oferta aleatoria
        const ofertaRandom = ofertas[Math.floor(Math.random() * ofertas.length)];

        try {
          const sqlOferta = `
            INSERT INTO tb_productos_ofertas (
              id_producto, id_oferta, precio_oferta, es_precio_personalizado, fyh_creacion
            ) VALUES (?, ?, NULL, 0, NOW())
          `;

          await connection.query(sqlOferta, [
            prod.id_producto,
            ofertaRandom.id_oferta
          ]);

          console.log(`  ✓ Producto ${prod.id_producto} → Oferta "${ofertaRandom.nombre_oferta}"`);
        } catch (error) {
          // Ignorar duplicados
          if (!error.message.includes('Duplicate entry')) {
            throw error;
          }
        }
      }

      console.log(`\n✅ Ofertas asignadas exitosamente\n`);
    } else {
      console.log('⚠️  No hay ofertas activas en la base de datos\n');
    }

    // ========== ESTADÍSTICAS FINALES ==========
    console.log('📊 Estadísticas finales:\n');

    const [statsProductos] = await connection.query(`
      SELECT
        c.nombre_categoria,
        COUNT(*) as cantidad,
        SUM(stock) as stock_total
      FROM tb_almacen a
      JOIN tb_categorias c ON a.id_categoria = c.id_categoria
      GROUP BY c.nombre_categoria
      ORDER BY cantidad DESC
    `);

    console.log('  Productos por categoría:');
    for (const stat of statsProductos) {
      console.log(`    - ${stat.nombre_categoria}: ${stat.cantidad} productos (${stat.stock_total} unidades en stock)`);
    }

    const [statsImagenes] = await connection.query(`
      SELECT COUNT(*) as total FROM tb_producto_imagenes
    `);
    console.log(`\n  Total de imágenes: ${statsImagenes[0].total}`);

    const [statsCaract] = await connection.query(`
      SELECT COUNT(*) as total FROM tb_producto_caracteristicas
    `);
    console.log(`  Total de características: ${statsCaract[0].total}`);

    const [statsOfertas] = await connection.query(`
      SELECT COUNT(*) as total FROM tb_productos_ofertas
    `);
    console.log(`  Productos en oferta: ${statsOfertas[0].total}`);

    console.log('\n✅ ¡Datos de producción generados exitosamente!\n');

  } catch (error) {
    console.error('\n❌ Error al generar datos:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// Ejecutar script
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  Script de Generación de Datos de Producción - TecnoCel  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

generarDatosProduccion()
  .then(() => {
    console.log('🎉 Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
