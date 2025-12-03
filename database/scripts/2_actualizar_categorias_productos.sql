-- ========================================================
-- SCRIPT 2: ACTUALIZAR CATEGORÍAS DE PRODUCTOS EXISTENTES
-- ========================================================
--
-- Este script actualiza las categorías de todos los productos
-- para usar las categorías simplificadas (sin mezclar con marcas)
--
-- Ejecutar: mysql -u root -p db_tecnocel_v4 < 2_actualizar_categorias_productos.sql
-- ========================================================

USE db_tecnocel_v4;

-- Mostrar estado ANTES de la actualización
SELECT '📊 ESTADO ANTES DE LA ACTUALIZACIÓN:' as info;
SELECT
  c.nombre_categoria,
  COUNT(*) as total_productos
FROM tb_almacen a
LEFT JOIN tb_categorias c ON a.id_categoria = c.id_categoria
GROUP BY c.nombre_categoria
ORDER BY total_productos DESC;

-- ========== SMARTPHONES ==========
-- Unificar todos los celulares en categoría 1 (Smartphones)

UPDATE tb_almacen
SET id_categoria = 1, fyh_actualizacion = NOW()
WHERE id_categoria IN (
  1,  -- CELULAR - SAMSUNG
  2,  -- CELULAR - IPHONE NUEVO
  3,  -- CELULAR - IPHONE USADO
  15, -- CELULAR - MOTOROLA
  16, -- CELULAR - INFINIX
  22, -- CELULAR - XIAOMI
  34, -- CELULAR - HONOR
  37  -- CELULAR - REALME
);

-- Casos especiales: productos mal categorizados
UPDATE tb_almacen
SET id_categoria = 1, fyh_actualizacion = NOW()
WHERE id_producto IN (72, 139, 157, 170); -- Samsung Galaxy Watch 7 y tablets mal categorizadas como celular

SELECT '✅ Smartphones actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 1;


-- ========== LAPTOPS ==========
-- Unificar Notebooks y MacBooks en categoría 2 (Laptops)

UPDATE tb_almacen
SET id_categoria = 2, fyh_actualizacion = NOW()
WHERE id_categoria IN (
  12, -- MACBOOK
  17  -- NOTEBOOKS
);

SELECT '✅ Laptops actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 2;


-- ========== TABLETS ==========
-- Unificar iPads y Tablets en categoría 3 (Tablets)

UPDATE tb_almacen
SET id_categoria = 3, fyh_actualizacion = NOW()
WHERE id_categoria IN (
  14, -- IPAD
  32, -- TABLET-XIAOMI
  33  -- TABLET-SAMSUNG
);

-- Corregir tablets mal categorizadas
UPDATE tb_almacen
SET id_categoria = 3, fyh_actualizacion = NOW()
WHERE id_producto IN (170, 171, 172, 173); -- Galaxy Tabs mal categorizadas

SELECT '✅ Tablets actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 3;


-- ========== SMARTWATCHES ==========
-- Unificar todos los smartwatches en categoría 4 (Smartwatches)

UPDATE tb_almacen
SET id_categoria = 4, fyh_actualizacion = NOW()
WHERE id_categoria IN (
  8,  -- SMARTWATCH - GALAXY WATCH
  18, -- SMARTWATCH - APPLE WATCH
  26  -- SMARTWATCH-XIAOMI
);

-- Corregir Samsung Galaxy Watch 7 que estaba como celular
UPDATE tb_almacen
SET id_categoria = 4, fyh_actualizacion = NOW()
WHERE id_producto = 72;

SELECT '✅ Smartwatches actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 4;


-- ========== AURICULARES ==========
-- Unificar todos los auriculares en categoría 5 (Auriculares)

UPDATE tb_almacen
SET id_categoria = 5, fyh_actualizacion = NOW()
WHERE id_categoria IN (
  19, -- AURICULAR - AIRPODS
  20, -- AURICULAR - JBL
  24, -- AURICULAR-SAMSUNG
  25, -- AURICULAR-XIAOMI
  36, -- AURICULAR - XIAOMI (duplicado)
  39  -- AURICULAR
);

SELECT '✅ Auriculares actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 5;


-- ========== PARLANTES ==========
-- Unificar parlantes en categoría 6 (Parlantes)

UPDATE tb_almacen
SET id_categoria = 6, fyh_actualizacion = NOW()
WHERE id_categoria = 23; -- PARLANTE - JBL

SELECT '✅ Parlantes actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 6;


-- ========== CONSOLAS ==========
-- Unificar consolas en categoría 7 (Consolas)

UPDATE tb_almacen
SET id_categoria = 7, fyh_actualizacion = NOW()
WHERE id_categoria IN (
  4,  -- CONSOLA
  30  -- NINTENDO SWITCH
);

SELECT '✅ Consolas actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 7;


-- ========== ACCESORIOS GAMING ==========
-- Joysticks y accesorios gaming en categoría 8

UPDATE tb_almacen
SET id_categoria = 8, fyh_actualizacion = NOW()
WHERE id_categoria IN (
  29, -- JOYSTICK PS5
  31, -- JOYSTICK XBOX
  42  -- JOYSTICK
);

SELECT '✅ Accesorios Gaming actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 8;


-- ========== CARGADORES ==========
-- Unificar cargadores en categoría 9 (Cargadores)

UPDATE tb_almacen
SET id_categoria = 9, fyh_actualizacion = NOW()
WHERE id_categoria IN (
  27, -- CARGADOR-SAMSUNG
  28  -- CARGADOR-IPHONE
);

SELECT '✅ Cargadores actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 9;


-- ========== FUNDAS Y PROTECTORES ==========
-- Categoría 10 - actualmente sin productos

SELECT '✅ Fundas y Protectores' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 10;


-- ========== SMART BANDS ==========
-- Categoría 11 - actualmente sin productos (se puede usar para futuro)

SELECT '✅ Smart Bands' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 11;


-- ========== POWER BANKS ==========
-- Categoría 12 (Power Banks)

UPDATE tb_almacen
SET id_categoria = 12, fyh_actualizacion = NOW()
WHERE id_categoria = 35; -- POWER BANK

SELECT '✅ Power Banks actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 12;


-- ========== DRONES ==========
-- Categoría 13 (Drones)

UPDATE tb_almacen
SET id_categoria = 13, fyh_actualizacion = NOW()
WHERE id_categoria = 38; -- DRON

SELECT '✅ Drones actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 13;


-- ========== CÁMARAS ==========
-- Categoría 14 (Cámaras)

UPDATE tb_almacen
SET id_categoria = 14, fyh_actualizacion = NOW()
WHERE id_categoria = 40; -- CAMARA

SELECT '✅ Cámaras actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 14;


-- ========== ACCESORIOS TABLETS ==========
-- Categoría 15 (Accesorios Tablets) - Apple Pencil

UPDATE tb_almacen
SET id_categoria = 15, fyh_actualizacion = NOW()
WHERE id_categoria = 41; -- APPLE - PENCIL

SELECT '✅ Accesorios Tablets actualizados' as status, COUNT(*) as total
FROM tb_almacen WHERE id_categoria = 15;


-- ========================================================
-- RESUMEN FINAL
-- ========================================================

SELECT '\n📊 RESUMEN FINAL - PRODUCTOS POR CATEGORÍA SIMPLIFICADA:' as info;

SELECT
  c.id_categoria,
  c.nombre_categoria,
  COUNT(a.id_producto) as total_productos
FROM tb_categorias c
LEFT JOIN tb_almacen a ON c.id_categoria = a.id_categoria
WHERE c.id_categoria BETWEEN 1 AND 15
GROUP BY c.id_categoria, c.nombre_categoria
ORDER BY c.id_categoria;

SELECT '\n✅ ACTUALIZACIÓN DE CATEGORÍAS COMPLETADA' as status;
