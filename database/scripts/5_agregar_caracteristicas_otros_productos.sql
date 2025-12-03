-- ================================================================
-- SCRIPT 5: AGREGAR CARACTERÍSTICAS A OTROS PRODUCTOS
-- ================================================================
--
-- Este script agrega características a laptops, tablets, smartwatches,
-- auriculares, parlantes, consolas y otros accesorios.
--
-- Ejecutar: mysql -u root -p db_tecnocel_v4 < 5_agregar_caracteristicas_otros_productos.sql
-- ================================================================

USE db_tecnocel_v4;

-- ========== LAPTOPS (Categoría 2) ==========

SELECT '💻 Agregando características a LAPTOPS...' as info;

-- Pantalla para laptops
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  1, -- Pantalla
  CASE
    WHEN a.nombre LIKE '%16%' OR a.nombre LIKE '%16.%' THEN '16'
    WHEN a.nombre LIKE '%15.6%' OR a.nombre LIKE '%15%' THEN '15.6'
    WHEN a.nombre LIKE '%14%' THEN '14'
    WHEN a.nombre LIKE '%13%' THEN '13.3'
    ELSE '15.6'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 2;

-- RAM para laptops
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  2, -- RAM
  CASE
    WHEN a.nombre LIKE '%32GB%' OR a.nombre LIKE '%32gb%' THEN '32'
    WHEN a.nombre LIKE '%16GB%' OR a.nombre LIKE '%16gb%' THEN '16'
    WHEN a.nombre LIKE '%8GB%' OR a.nombre LIKE '%8gb%' OR a.nombre LIKE '%8/512%' THEN '8'
    WHEN a.nombre LIKE '%4GB%' OR a.nombre LIKE '%4gb%' THEN '4'
    ELSE '8'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 2;

-- Almacenamiento para laptops
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3, -- Almacenamiento
  CASE
    WHEN a.nombre LIKE '%1TB%' OR a.nombre LIKE '%1tb%' THEN '1024'
    WHEN a.nombre LIKE '%512GB%' OR a.nombre LIKE '%512gb%' OR a.nombre LIKE '%8/512%' THEN '512'
    WHEN a.nombre LIKE '%256GB%' OR a.nombre LIKE '%256gb%' THEN '256'
    ELSE '512'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 2;

-- Sistema Operativo para laptops
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  7, -- Sistema Operativo
  CASE
    WHEN a.nombre LIKE '%MacBook%' OR a.nombre LIKE '%Macbook%' THEN 'macOS'
    ELSE 'Windows'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 2;


-- ========== TABLETS (Categoría 3) ==========

SELECT '📱 Agregando características a TABLETS...' as info;

-- Pantalla para tablets
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  1, -- Pantalla
  CASE
    WHEN a.nombre LIKE '%10th%' OR a.nombre LIKE '%10.%' THEN '10.9'
    WHEN a.nombre LIKE '%8.7%' THEN '8.7'
    ELSE '10.5'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 3;

-- RAM para tablets
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  2, -- RAM
  CASE
    WHEN a.nombre LIKE '%8/128%' OR a.nombre LIKE '%8/256%' THEN '8'
    WHEN a.nombre LIKE '%4/64%' OR a.nombre LIKE '%4/128%' THEN '4'
    ELSE '4'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 3;

-- Almacenamiento para tablets
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3, -- Almacenamiento
  CASE
    WHEN a.nombre LIKE '%256GB%' OR a.nombre LIKE '%256gb%' OR a.nombre LIKE '%/256%' THEN '256'
    WHEN a.nombre LIKE '%128GB%' OR a.nombre LIKE '%128gb%' OR a.nombre LIKE '%/128%' THEN '128'
    WHEN a.nombre LIKE '%64GB%' OR a.nombre LIKE '%64gb%' OR a.nombre LIKE '%/64%' THEN '64'
    ELSE '64'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 3;

-- Sistema Operativo para tablets
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  7, -- Sistema Operativo
  CASE
    WHEN a.nombre LIKE '%iPad%' OR a.nombre LIKE '%Ipad%' THEN 'iPadOS'
    ELSE 'Android'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 3;


-- ========== SMARTWATCHES (Categoría 4) ==========

SELECT '⌚ Agregando características a SMARTWATCHES...' as info;

-- Pantalla para smartwatches
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  1, -- Pantalla
  CASE
    WHEN a.nombre LIKE '%46mm%' THEN '1.96'
    WHEN a.nombre LIKE '%44mm%' THEN '1.5'
    WHEN a.nombre LIKE '%42mm%' THEN '1.7'
    WHEN a.nombre LIKE '%40mm%' THEN '1.56'
    ELSE '1.5'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 4;

-- Sistema Operativo para smartwatches
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  7, -- Sistema Operativo
  CASE
    WHEN a.nombre LIKE '%Apple Watch%' THEN 'watchOS'
    WHEN a.nombre LIKE '%Galaxy Watch%' THEN 'Wear OS'
    ELSE 'Wear OS'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 4;

-- Batería estimada para smartwatches (en horas)
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  6, -- Batería (horas de uso)
  CASE
    WHEN a.nombre LIKE '%Apple Watch%' THEN '18'
    WHEN a.nombre LIKE '%Galaxy Watch%' THEN '40'
    ELSE '24'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 4;


-- ========== AURICULARES (Categoría 5) ==========

SELECT '🎧 Agregando características a AURICULARES...' as info;

-- Conectividad para auriculares
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  CASE
    WHEN a.nombre LIKE '%Bluetooth%' OR a.nombre LIKE '%BT%' OR a.nombre LIKE '%BUDS%' OR a.nombre LIKE '%AirPods%' THEN 'Bluetooth 5.0'
    WHEN a.nombre LIKE '%type-c%' OR a.nombre LIKE '%USB-C%' THEN 'USB-C'
    ELSE 'Bluetooth 5.0'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 5;

-- Batería estimada para auriculares inalámbricos (horas)
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  6, -- Batería
  CASE
    WHEN a.nombre LIKE '%AirPods Pro%' THEN '30'
    WHEN a.nombre LIKE '%720%' THEN '76'
    WHEN a.nombre LIKE '%520%' THEN '57'
    WHEN a.nombre LIKE '%WAVE%' OR a.nombre LIKE '%TUNE%' THEN '40'
    WHEN a.nombre LIKE '%Buds%' THEN '36'
    ELSE '24'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 5
  AND (a.nombre LIKE '%Bluetooth%' OR a.nombre LIKE '%BT%' OR a.nombre LIKE '%BUDS%' OR a.nombre LIKE '%AirPods%');


-- ========== PARLANTES (Categoría 6) ==========

SELECT '🔊 Agregando características a PARLANTES...' as info;

-- Conectividad para parlantes
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  'Bluetooth 5.0',
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 6;

-- Batería para parlantes (horas)
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  6, -- Batería
  CASE
    WHEN a.nombre LIKE '%CHARGE 5%' THEN '20'
    WHEN a.nombre LIKE '%FLIP 6%' THEN '12'
    WHEN a.nombre LIKE '%GO 4%' THEN '5'
    WHEN a.nombre LIKE '%EXTREME 4%' THEN '24'
    WHEN a.nombre LIKE '%PARTYBOX%' THEN '18'
    ELSE '12'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 6;


-- ========== CONSOLAS (Categoría 7) ==========

SELECT '🎮 Agregando características a CONSOLAS...' as info;

-- Almacenamiento para consolas
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3, -- Almacenamiento
  CASE
    WHEN a.nombre LIKE '%2TB%' THEN '2048'
    WHEN a.nombre LIKE '%1TB%' THEN '1024'
    WHEN a.nombre LIKE '%512GB%' THEN '512'
    WHEN a.nombre LIKE '%64GB%' OR a.nombre LIKE '%Switch%' THEN '64'
    ELSE '1024'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 7;

-- Conectividad para consolas
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  'WiFi 6',
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 7;


-- ========== ACCESORIOS GAMING (Categoría 8) - Joysticks ==========

SELECT '🕹️  Agregando características a ACCESORIOS GAMING...' as info;

-- Conectividad para joysticks
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  'Bluetooth 5.0',
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 8;


-- ========== CARGADORES (Categoría 9) ==========

SELECT '🔌 Agregando características a CARGADORES...' as info;

-- No requieren características adicionales por ahora
-- Los cargadores ya tienen su descripción en el nombre del producto


-- ========== POWER BANKS (Categoría 12) ==========

SELECT '🔋 Agregando características a POWER BANKS...' as info;

-- Batería para Power Banks (mAh)
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  6, -- Batería
  '10000', -- Valor estimado
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 12;


-- ========== ACCESORIOS TABLETS (Categoría 15) - Apple Pencil ==========

SELECT '✏️  Agregando características a ACCESORIOS TABLETS...' as info;

-- Conectividad para Apple Pencil
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  'Bluetooth',
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 15;


-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================

SELECT '\n📊 RESUMEN - Productos por categoría con características:' as info;

SELECT
  c.nombre_categoria,
  COUNT(DISTINCT a.id_producto) as total_productos,
  COUNT(DISTINCT pc.id_producto) as productos_con_caracteristicas,
  ROUND((COUNT(DISTINCT pc.id_producto) * 100.0 / COUNT(DISTINCT a.id_producto)), 2) as porcentaje
FROM tb_categorias c
LEFT JOIN tb_almacen a ON c.id_categoria = a.id_categoria
LEFT JOIN tb_producto_caracteristicas pc ON a.id_producto = pc.id_producto
WHERE c.id_categoria BETWEEN 1 AND 15
GROUP BY c.nombre_categoria
ORDER BY c.id_categoria;

SELECT '\n✅ CARACTERÍSTICAS AGREGADAS A TODOS LOS PRODUCTOS' as status;
