-- ===========================================================
-- SCRIPT 4: AGREGAR CARACTERÍSTICAS A SMARTPHONES
-- ===========================================================
--
-- Este script agrega características técnicas estimadas a los
-- smartphones basándose en el nombre del producto y marca.
--
-- NOTA: Los valores son aproximados basados en especificaciones
-- típicas de cada modelo. Para datos exactos, consultar
-- especificaciones del fabricante.
--
-- Ejecutar: mysql -u root -p db_tecnocel_v4 < 4_agregar_caracteristicas_smartphones.sql
-- ===========================================================

USE db_tecnocel_v4;

-- Verificar tipos de características disponibles
SELECT '📋 TIPOS DE CARACTERÍSTICAS DISPONIBLES:' as info;
SELECT id_tipo, nombre_tipo, tipo_dato, unidad_medida
FROM tb_tipos_caracteristicas
ORDER BY id_tipo;

-- ========== LIMPIAR CARACTERÍSTICAS EXISTENTES DE SMARTPHONES ==========
-- (Opcional: comentar si no quieres borrar características existentes)

DELETE pc FROM tb_producto_caracteristicas pc
JOIN tb_almacen a ON pc.id_producto = a.id_producto
WHERE a.id_categoria = 1; -- Smartphones

SELECT '🗑️  Características antiguas de smartphones eliminadas' as status;

-- ========================================================
-- AGREGAR CARACTERÍSTICAS POR MARCA Y MODELO
-- ========================================================

-- ========== SAMSUNG SMARTPHONES ==========

-- Samsung A Series (Gama Baja-Media)
-- A05, A06, A15, A16, A25
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  1, -- Pantalla
  CASE
    WHEN a.nombre LIKE '%A05%' THEN '6.7'
    WHEN a.nombre LIKE '%A06%' THEN '6.7'
    WHEN a.nombre LIKE '%A15%' THEN '6.5'
    WHEN a.nombre LIKE '%A16%' THEN '6.7'
    WHEN a.nombre LIKE '%A25%' THEN '6.5'
    ELSE '6.5'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1 -- Samsung
  AND (a.nombre LIKE '%A05%' OR a.nombre LIKE '%A06%' OR a.nombre LIKE '%A15%' OR a.nombre LIKE '%A16%' OR a.nombre LIKE '%A25%');

-- RAM para Samsung A Series
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  2, -- RAM
  CASE
    WHEN a.nombre LIKE '%4/64%' OR a.nombre LIKE '%4/128%' THEN '4'
    WHEN a.nombre LIKE '%6/128%' THEN '6'
    WHEN a.nombre LIKE '%8/128%' OR a.nombre LIKE '%8/256%' THEN '8'
    WHEN a.nombre LIKE '%A05%' THEN '4'
    WHEN a.nombre LIKE '%A06%' THEN '4'
    WHEN a.nombre LIKE '%A15%' THEN '4'
    WHEN a.nombre LIKE '%A16%' THEN '6'
    WHEN a.nombre LIKE '%A25%' THEN '8'
    ELSE '4'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1
  AND (a.nombre LIKE '%A05%' OR a.nombre LIKE '%A06%' OR a.nombre LIKE '%A15%' OR a.nombre LIKE '%A16%' OR a.nombre LIKE '%A25%');

-- Almacenamiento para Samsung A Series
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3, -- Almacenamiento
  CASE
    WHEN a.nombre LIKE '%/64%' OR a.nombre LIKE '%64gb%' THEN '64'
    WHEN a.nombre LIKE '%/128%' OR a.nombre LIKE '%128gb%' THEN '128'
    WHEN a.nombre LIKE '%/256%' OR a.nombre LIKE '%256gb%' THEN '256'
    ELSE '128'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1
  AND (a.nombre LIKE '%A05%' OR a.nombre LIKE '%A06%' OR a.nombre LIKE '%A15%' OR a.nombre LIKE '%A16%' OR a.nombre LIKE '%A25%');

-- Sistema Operativo para Samsung
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  7, -- Sistema Operativo
  'Android',
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1;

-- Conectividad para Samsung
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  CASE
    WHEN a.nombre LIKE '%5G%' OR a.nombre LIKE '%5g%' THEN '5G'
    ELSE '4G'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1;

-- Samsung S Series (Gama Alta)
-- S23 FE, S24, S24 Ultra, S25, S25 Plus, S25 Ultra
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  1, -- Pantalla
  CASE
    WHEN a.nombre LIKE '%S24 ULTRA%' OR a.nombre LIKE '%S25 ULTRA%' THEN '6.8'
    WHEN a.nombre LIKE '%S25 Plus%' OR a.nombre LIKE '%S25 PLUS%' THEN '6.7'
    WHEN a.nombre LIKE '%S24%' OR a.nombre LIKE '%S25%' THEN '6.2'
    WHEN a.nombre LIKE '%S23 FE%' THEN '6.4'
    ELSE '6.5'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1
  AND (a.nombre LIKE '%S23%' OR a.nombre LIKE '%S24%' OR a.nombre LIKE '%S25%');

-- RAM para Samsung S Series
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  2, -- RAM
  CASE
    WHEN a.nombre LIKE '%12/128%' OR a.nombre LIKE '%12/256%' OR a.nombre LIKE '%12/512%' THEN '12'
    WHEN a.nombre LIKE '%8/256%' THEN '8'
    ELSE '12'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1
  AND (a.nombre LIKE '%S23%' OR a.nombre LIKE '%S24%' OR a.nombre LIKE '%S25%');

-- Almacenamiento para Samsung S Series
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3, -- Almacenamiento
  CASE
    WHEN a.nombre LIKE '%/128%' OR a.nombre LIKE '%128gb%' THEN '128'
    WHEN a.nombre LIKE '%/256%' OR a.nombre LIKE '%256gb%' THEN '256'
    WHEN a.nombre LIKE '%/512%' OR a.nombre LIKE '%512gb%' THEN '512'
    ELSE '256'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1
  AND (a.nombre LIKE '%S23%' OR a.nombre LIKE '%S24%' OR a.nombre LIKE '%S25%');

-- Cámara Principal para Samsung (estimado)
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  4, -- Cámara Principal
  CASE
    WHEN a.nombre LIKE '%ULTRA%' THEN '200'
    WHEN a.nombre LIKE '%S24%' OR a.nombre LIKE '%S25%' THEN '50'
    WHEN a.nombre LIKE '%S23%' THEN '50'
    WHEN a.nombre LIKE '%A55%' THEN '50'
    WHEN a.nombre LIKE '%A25%' THEN '50'
    ELSE '50'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1;

-- Batería estimada para Samsung
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  6, -- Batería
  CASE
    WHEN a.nombre LIKE '%ULTRA%' THEN '5000'
    WHEN a.nombre LIKE '%Plus%' OR a.nombre LIKE '%PLUS%' THEN '4900'
    WHEN a.nombre LIKE '%A05%' OR a.nombre LIKE '%A06%' THEN '5000'
    ELSE '4500'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 1;


-- ========== APPLE iPHONE ==========

-- Pantalla para iPhones
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  1, -- Pantalla
  CASE
    WHEN a.nombre LIKE '%Pro Max%' OR a.nombre LIKE '%PRO MAX%' THEN '6.7'
    WHEN a.nombre LIKE '%Pro%' OR a.nombre LIKE '%PRO%' THEN '6.3'
    WHEN a.nombre LIKE '%Plus%' OR a.nombre LIKE '%PLUS%' THEN '6.7'
    WHEN a.nombre LIKE '%16e%' THEN '6.1'
    ELSE '6.1'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 2; -- Apple

-- RAM para iPhones (estimado)
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  2, -- RAM
  CASE
    WHEN a.nombre LIKE '%16 Pro%' OR a.nombre LIKE '%16 PRO%' THEN '8'
    WHEN a.nombre LIKE '%15 Pro%' OR a.nombre LIKE '%15 PRO%' THEN '8'
    WHEN a.nombre LIKE '%16%' THEN '8'
    WHEN a.nombre LIKE '%15%' THEN '6'
    WHEN a.nombre LIKE '%14%' THEN '6'
    WHEN a.nombre LIKE '%13%' THEN '4'
    ELSE '6'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 2;

-- Almacenamiento para iPhones
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3, -- Almacenamiento
  CASE
    WHEN a.nombre LIKE '%64gb%' THEN '64'
    WHEN a.nombre LIKE '%128gb%' THEN '128'
    WHEN a.nombre LIKE '%256gb%' THEN '256'
    WHEN a.nombre LIKE '%512gb%' THEN '512'
    WHEN a.nombre LIKE '%1TB%' OR a.nombre LIKE '%1tb%' THEN '1024'
    ELSE '128'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 2;

-- Cámara Principal para iPhones
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  4, -- Cámara Principal
  CASE
    WHEN a.nombre LIKE '%16 Pro%' OR a.nombre LIKE '%16 PRO%' OR a.nombre LIKE '%15 Pro%' THEN '48'
    WHEN a.nombre LIKE '%16%' OR a.nombre LIKE '%15%' THEN '48'
    WHEN a.nombre LIKE '%14%' THEN '12'
    WHEN a.nombre LIKE '%13%' THEN '12'
    WHEN a.nombre LIKE '%11%' OR a.nombre LIKE '%12%' THEN '12'
    ELSE '12'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 2;

-- Sistema Operativo para iPhones
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  7, -- Sistema Operativo
  'iOS',
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 2;

-- Conectividad para iPhones
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  '5G',
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 2;

-- Batería estimada para iPhones
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  6, -- Batería
  CASE
    WHEN a.nombre LIKE '%Pro Max%' OR a.nombre LIKE '%PRO MAX%' THEN '4685'
    WHEN a.nombre LIKE '%Plus%' OR a.nombre LIKE '%PLUS%' THEN '4383'
    WHEN a.nombre LIKE '%Pro%' OR a.nombre LIKE '%PRO%' THEN '3582'
    WHEN a.nombre LIKE '%16%' THEN '3561'
    WHEN a.nombre LIKE '%15%' THEN '3349'
    WHEN a.nombre LIKE '%14%' THEN '3279'
    ELSE '3200'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 2;


-- ========== XIAOMI/REDMI/POCO ==========

-- Pantalla para Xiaomi
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  1, -- Pantalla
  CASE
    WHEN a.nombre LIKE '%Note 13 Pro%' OR a.nombre LIKE '%Note 14 Pro%' THEN '6.67'
    WHEN a.nombre LIKE '%Note 13%' OR a.nombre LIKE '%Note 14%' THEN '6.67'
    WHEN a.nombre LIKE '%POCO X7%' THEN '6.67'
    WHEN a.nombre LIKE '%POCO F7%' THEN '6.67'
    WHEN a.nombre LIKE '%POCO M6%' OR a.nombre LIKE '%POCO M7%' THEN '6.67'
    WHEN a.nombre LIKE '%POCO C75%' THEN '6.88'
    WHEN a.nombre LIKE '%Redmi 14C%' OR a.nombre LIKE '%14C%' THEN '6.88'
    WHEN a.nombre LIKE '%Redmi 13C%' THEN '6.74'
    WHEN a.nombre LIKE '%Redmi A3X%' THEN '6.71'
    ELSE '6.67'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 3; -- Xiaomi

-- RAM para Xiaomi
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  2, -- RAM
  CASE
    WHEN a.nombre LIKE '%12/256%' OR a.nombre LIKE '%12/512%' THEN '12'
    WHEN a.nombre LIKE '%8/128%' OR a.nombre LIKE '%8/256%' THEN '8'
    WHEN a.nombre LIKE '%6/128%' THEN '6'
    WHEN a.nombre LIKE '%4/128%' OR a.nombre LIKE '%4/64%' OR a.nombre LIKE '%4/256%' THEN '4'
    ELSE '8'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 3;

-- Almacenamiento para Xiaomi
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3, -- Almacenamiento
  CASE
    WHEN a.nombre LIKE '%/64%' OR a.nombre LIKE '%64gb%' THEN '64'
    WHEN a.nombre LIKE '%/128%' OR a.nombre LIKE '%128gb%' THEN '128'
    WHEN a.nombre LIKE '%/256%' OR a.nombre LIKE '%256gb%' THEN '256'
    WHEN a.nombre LIKE '%/512%' OR a.nombre LIKE '%512gb%' THEN '512'
    ELSE '128'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 3;

-- Cámara Principal para Xiaomi (estimado)
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  4, -- Cámara Principal
  CASE
    WHEN a.nombre LIKE '%Note 13 Pro%' OR a.nombre LIKE '%Note 14 Pro%' THEN '200'
    WHEN a.nombre LIKE '%POCO X7 Pro%' OR a.nombre LIKE '%POCO F7%' THEN '50'
    WHEN a.nombre LIKE '%Note 13%' OR a.nombre LIKE '%Note 14%' THEN '108'
    WHEN a.nombre LIKE '%14C%' THEN '50'
    ELSE '50'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 3;

-- Sistema Operativo para Xiaomi
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  7, -- Sistema Operativo
  'Android',
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 3;

-- Conectividad para Xiaomi
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  CASE
    WHEN a.nombre LIKE '%5G%' OR a.nombre LIKE '%5g%' THEN '5G'
    ELSE '4G'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 3;

-- Batería para Xiaomi
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  6, -- Batería
  CASE
    WHEN a.nombre LIKE '%Note%' THEN '5000'
    WHEN a.nombre LIKE '%POCO%' THEN '5000'
    WHEN a.nombre LIKE '%14C%' THEN '5160'
    ELSE '5000'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 3;


-- ========== MOTOROLA ==========

-- Características similares para Motorola
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  1, -- Pantalla
  CASE
    WHEN a.nombre LIKE '%Edge 50 Ultra%' THEN '6.7'
    WHEN a.nombre LIKE '%Edge 50 Pro%' OR a.nombre LIKE '%Edge 50 Fusion%' OR a.nombre LIKE '%Edge 50 NEO%' THEN '6.7'
    WHEN a.nombre LIKE '%G85%' THEN '6.67'
    WHEN a.nombre LIKE '%g35%' THEN '6.72'
    WHEN a.nombre LIKE '%G24%' THEN '6.56'
    WHEN a.nombre LIKE '%G04%' OR a.nombre LIKE '%E14%' OR a.nombre LIKE '%E15%' THEN '6.5'
    ELSE '6.5'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 4; -- Motorola

-- RAM para Motorola
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  2, -- RAM
  CASE
    WHEN a.nombre LIKE '%16/1tb%' THEN '16'
    WHEN a.nombre LIKE '%12/256%' OR a.nombre LIKE '%12/512%' THEN '12'
    WHEN a.nombre LIKE '%8/256%' THEN '8'
    WHEN a.nombre LIKE '%4/64%' OR a.nombre LIKE '%4/128%' OR a.nombre LIKE '%4/256%' THEN '4'
    WHEN a.nombre LIKE '%2/64%' THEN '2'
    ELSE '4'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 4;

-- Almacenamiento para Motorola
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3, -- Almacenamiento
  CASE
    WHEN a.nombre LIKE '%/1tb%' OR a.nombre LIKE '%1TB%' THEN '1024'
    WHEN a.nombre LIKE '%/512%' OR a.nombre LIKE '%512gb%' THEN '512'
    WHEN a.nombre LIKE '%/256%' OR a.nombre LIKE '%256gb%' THEN '256'
    WHEN a.nombre LIKE '%/128%' OR a.nombre LIKE '%128gb%' THEN '128'
    WHEN a.nombre LIKE '%/64%' OR a.nombre LIKE '%64gb%' THEN '64'
    ELSE '128'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1
  AND a.id_marca = 4;

-- Sistema Operativo, Conectividad y Batería para Motorola
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 7, 'Android', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 4;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  8, -- Conectividad
  CASE WHEN a.nombre LIKE '%5G%' OR a.nombre LIKE '%5g%' THEN '5G' ELSE '4G' END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 4;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 6, '5000', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 4;


-- ========== INFINIX ==========

-- Características para Infinix
INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 1, '6.78', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 5; -- Infinix

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  2,
  CASE
    WHEN a.nombre LIKE '%16/256%' THEN '16'
    WHEN a.nombre LIKE '%8/256%' THEN '8'
    WHEN a.nombre LIKE '%4/128%' THEN '4'
    ELSE '8'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 5;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3,
  CASE
    WHEN a.nombre LIKE '%/256%' OR a.nombre LIKE '%256gb%' THEN '256'
    WHEN a.nombre LIKE '%/128%' OR a.nombre LIKE '%128gb%' THEN '128'
    ELSE '128'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 5;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 7, 'Android', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 5;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 8, '4G', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 5;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 6, '5000', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 5;


-- ========== HONOR ==========

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 1, '6.7', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 6; -- Honor

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 2, '4', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 6;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3,
  CASE
    WHEN a.nombre LIKE '%/256%' THEN '256'
    WHEN a.nombre LIKE '%/128%' THEN '128'
    ELSE '128'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 6;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 7, 'Android', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 6;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 8, '4G', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 6;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 6, '5000', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 6;


-- ========== REALME ==========

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 1, '6.74', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 7; -- Realme

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 2, '4', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 7;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT
  a.id_producto,
  3,
  CASE
    WHEN a.nombre LIKE '%/256%' THEN '256'
    WHEN a.nombre LIKE '%/128%' THEN '128'
    ELSE '128'
  END,
  NOW(),
  NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 7;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 7, 'Android', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 7;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 8, '4G', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 7;

INSERT INTO tb_producto_caracteristicas (id_producto, id_tipo, valor, fyh_creacion, fyh_actualizacion)
SELECT a.id_producto, 6, '5000', NOW(), NOW()
FROM tb_almacen a
WHERE a.id_categoria = 1 AND a.id_marca = 7;


-- ========================================================
-- VERIFICACIÓN FINAL
-- ========================================================

SELECT '\n📊 VERIFICACIÓN - Smartphones con características agregadas:' as info;

SELECT
  a.id_producto,
  a.nombre,
  m.nombre_marca,
  COUNT(pc.id_caracteristica) as total_caracteristicas
FROM tb_almacen a
LEFT JOIN tb_marcas m ON a.id_marca = m.id_marca
LEFT JOIN tb_producto_caracteristicas pc ON a.id_producto = pc.id_producto
WHERE a.id_categoria = 1 -- Smartphones
GROUP BY a.id_producto, a.nombre, m.nombre_marca
ORDER BY total_caracteristicas DESC, a.id_producto
LIMIT 20;

SELECT '\n✅ CARACTERÍSTICAS DE SMARTPHONES AGREGADAS' as status;

-- Total de características agregadas
SELECT
  'Total smartphones:' as metric,
  COUNT(DISTINCT a.id_producto) as total
FROM tb_almacen a
WHERE a.id_categoria = 1
UNION ALL
SELECT
  'Con características:' as metric,
  COUNT(DISTINCT pc.id_producto) as total
FROM tb_producto_caracteristicas pc
JOIN tb_almacen a ON pc.id_producto = a.id_producto
WHERE a.id_categoria = 1;
