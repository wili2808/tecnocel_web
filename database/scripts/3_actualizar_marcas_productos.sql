-- ================================================
-- SCRIPT 3: ACTUALIZAR MARCAS DE PRODUCTOS
-- ================================================
--
-- Este script corrige las marcas de productos que:
-- 1. No tienen marca asignada (id_marca IS NULL)
-- 2. Tienen marca incorrecta
--
-- Ejecutar: mysql -u root -p db_tecnocel_v4 < 3_actualizar_marcas_productos.sql
-- ================================================

USE db_tecnocel_v4;

-- Mostrar productos SIN MARCA antes de actualizar
SELECT '⚠️  PRODUCTOS SIN MARCA (ANTES):' as info;
SELECT id_producto, codigo, nombre
FROM tb_almacen
WHERE id_marca IS NULL
ORDER BY id_producto;

-- ========== CORREGIR PRODUCTOS SIN MARCA ==========

-- MacBook Air M3 y M1 → Apple (id_marca = 2)
UPDATE tb_almacen
SET id_marca = 2, fyh_actualizacion = NOW()
WHERE id_producto IN (120, 121)
  AND (nombre LIKE '%Macbook%' OR nombre LIKE '%MacBook%');

-- AirPods Pro → Apple (id_marca = 2)
UPDATE tb_almacen
SET id_marca = 2, fyh_actualizacion = NOW()
WHERE id_producto = 183
  AND nombre LIKE '%AirPods%';

-- Cargador Samsung 45W → Samsung (id_marca = 1)
UPDATE tb_almacen
SET id_marca = 1, fyh_actualizacion = NOW()
WHERE id_producto = 200
  AND nombre LIKE '%Samsung%';

-- Notebook Victus HP → HP (id_marca = 14)
UPDATE tb_almacen
SET id_marca = 14, fyh_actualizacion = NOW()
WHERE id_producto = 202
  AND nombre LIKE '%Victus%';

-- Xiaomi Note 14 Pro (varios productos) → Xiaomi (id_marca = 3)
UPDATE tb_almacen
SET id_marca = 3, fyh_actualizacion = NOW()
WHERE id_producto IN (130, 214)
  AND (nombre LIKE '%Xiaomi%' OR nombre LIKE '%Redmi%' OR nombre LIKE '%Note 14%' OR nombre LIKE '%POCO%');

-- Auriculares IMIKI → Marca genérica o crear marca nueva
-- Por ahora los dejamos sin marca o se puede crear una marca "Genérico"
-- Si quieres asignarlos a Xiaomi (comunes en el mercado):
UPDATE tb_almacen
SET id_marca = 3, fyh_actualizacion = NOW()
WHERE id_producto IN (233, 234)
  AND nombre LIKE '%IMIKI%';

-- Productos Realme → Realme (id_marca = 7)
UPDATE tb_almacen
SET id_marca = 7, fyh_actualizacion = NOW()
WHERE id_producto IN (237, 238, 239)
  AND (nombre LIKE '%Realme%' OR nombre LIKE '%NOTE 50%' OR nombre LIKE '%NOTE 60%');


-- ========== CORREGIR MARCAS INCORRECTAS ==========

-- Producto ID 139: Motorola G04S categorizado como Samsung → Motorola (id_marca = 4)
UPDATE tb_almacen
SET id_marca = 4, fyh_actualizacion = NOW()
WHERE id_producto = 139
  AND nombre LIKE '%Moto%';

-- Producto ID 157: Xiaomi Note 13 categorizado como Samsung → Xiaomi (id_marca = 3)
UPDATE tb_almacen
SET id_marca = 3, fyh_actualizacion = NOW()
WHERE id_producto = 157
  AND nombre LIKE '%Xiaomi%';


-- ========================================================
-- VERIFICACIÓN FINAL
-- ========================================================

SELECT '\n✅ PRODUCTOS ACTUALIZADOS - Verificación:' as info;

-- Productos que tenían marca NULL y ahora tienen marca
SELECT
  a.id_producto,
  a.codigo,
  a.nombre,
  m.nombre_marca as marca_asignada
FROM tb_almacen a
JOIN tb_marcas m ON a.id_marca = m.id_marca
WHERE a.id_producto IN (120, 121, 130, 183, 200, 202, 214, 233, 234, 237, 238, 239)
ORDER BY a.id_producto;

-- Productos corregidos
SELECT
  a.id_producto,
  a.codigo,
  a.nombre,
  m.nombre_marca as marca_corregida
FROM tb_almacen a
JOIN tb_marcas m ON a.id_marca = m.id_marca
WHERE a.id_producto IN (139, 157)
ORDER BY a.id_producto;

-- Productos que aún no tienen marca (si quedan)
SELECT '\n⚠️  PRODUCTOS AÚN SIN MARCA (DESPUÉS):' as info;
SELECT
  id_producto,
  codigo,
  nombre
FROM tb_almacen
WHERE id_marca IS NULL
ORDER BY id_producto;

-- Resumen por marca
SELECT '\n📊 RESUMEN - PRODUCTOS POR MARCA:' as info;
SELECT
  m.nombre_marca,
  COUNT(a.id_producto) as total_productos
FROM tb_marcas m
LEFT JOIN tb_almacen a ON m.id_marca = a.id_marca
GROUP BY m.nombre_marca
ORDER BY total_productos DESC;

SELECT '\n✅ ACTUALIZACIÓN DE MARCAS COMPLETADA' as status;
