-- =====================================================
-- SCRIPT 1: CREAR/ACTUALIZAR CATEGORÍAS SIMPLIFICADAS
-- =====================================================
--
-- Este script crea las categorías simplificadas siguiendo
-- el modelo moderno del script generar_datos_produccion.js
--
-- Ejecutar: mysql -u root -p db_tecnocel_v4 < 1_crear_categorias_simplificadas.sql
-- =====================================================

USE db_tecnocel_v4;

-- Insertar o actualizar categorías simplificadas
INSERT INTO tb_categorias (id_categoria, nombre_categoria, fyh_creacion, fyh_actualizacion)
VALUES
  (1, 'Smartphones', NOW(), NOW()),
  (2, 'Laptops', NOW(), NOW()),
  (3, 'Tablets', NOW(), NOW()),
  (4, 'Smartwatches', NOW(), NOW()),
  (5, 'Auriculares', NOW(), NOW()),
  (6, 'Parlantes', NOW(), NOW()),
  (7, 'Consolas', NOW(), NOW()),
  (8, 'Accesorios Gaming', NOW(), NOW()),
  (9, 'Cargadores', NOW(), NOW()),
  (10, 'Fundas y Protectores', NOW(), NOW()),
  (11, 'Smart Bands', NOW(), NOW()),
  (12, 'Power Banks', NOW(), NOW()),
  (13, 'Drones', NOW(), NOW()),
  (14, 'Cámaras', NOW(), NOW()),
  (15, 'Accesorios Tablets', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  nombre_categoria = VALUES(nombre_categoria),
  fyh_actualizacion = NOW();

-- Verificar categorías creadas
SELECT
  id_categoria,
  nombre_categoria,
  (SELECT COUNT(*) FROM tb_almacen WHERE id_categoria = tc.id_categoria) as productos_actuales
FROM tb_categorias tc
WHERE id_categoria BETWEEN 1 AND 15
ORDER BY id_categoria;

-- Resumen
SELECT
  '✅ Categorías simplificadas creadas/actualizadas correctamente' as status,
  COUNT(*) as total_categorias
FROM tb_categorias
WHERE id_categoria BETWEEN 1 AND 15;
