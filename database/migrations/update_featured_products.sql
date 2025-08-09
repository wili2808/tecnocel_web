-- Script para marcar productos como destacados
-- Ejecutar después de agregar las columnas es_destacado y orden_destacado

-- Marcar algunos productos como destacados (ajustar los IDs según tu base de datos)
UPDATE tb_almacen
SET
    es_destacado = true,
    orden_destacado = 1
WHERE
    id_producto = 1;

UPDATE tb_almacen
SET
    es_destacado = true,
    orden_destacado = 2
WHERE
    id_producto = 2;

UPDATE tb_almacen
SET
    es_destacado = true,
    orden_destacado = 3
WHERE
    id_producto = 3;

UPDATE tb_almacen
SET
    es_destacado = true,
    orden_destacado = 4
WHERE
    id_producto = 4;

UPDATE tb_almacen
SET
    es_destacado = true,
    orden_destacado = 5
WHERE
    id_producto = 5;

UPDATE tb_almacen
SET
    es_destacado = true,
    orden_destacado = 6
WHERE
    id_producto = 6;

-- Verificar que se actualizaron correctamente
SELECT
    id_producto,
    nombre,
    es_destacado,
    orden_destacado
FROM tb_almacen
WHERE
    es_destacado = true
ORDER BY orden_destacado ASC;