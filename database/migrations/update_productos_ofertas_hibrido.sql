-- ============================================================================
-- MIGRACIÓN: Sistema Híbrido de Precios de Oferta
-- ============================================================================
-- Fecha: 2025-01-28
-- Descripción: Modifica la tabla tb_productos_ofertas para implementar
--              un sistema híbrido que permite tanto cálculo dinámico
--              como precios personalizados de oferta.
--
-- Cambios:
-- 1. Hace la columna precio_oferta NULLABLE
-- 2. Agrega columna es_precio_personalizado para identificar precios custom
-- 3. Actualiza registros existentes para marcarlos como personalizados
-- ============================================================================

USE db_tecnocel_v4;

-- Paso 1: Agregar la columna es_precio_personalizado
ALTER TABLE tb_productos_ofertas
ADD COLUMN es_precio_personalizado BOOLEAN DEFAULT FALSE NOT NULL
COMMENT 'Indica si el precio_oferta es personalizado (true) o debe calcularse dinámicamente (false)';

-- Paso 2: Marcar todos los registros existentes como personalizados
-- (para mantener comportamiento actual y evitar cambios en datos existentes)
UPDATE tb_productos_ofertas
SET es_precio_personalizado = TRUE
WHERE precio_oferta IS NOT NULL;

-- Paso 3: Hacer la columna precio_oferta NULLABLE
ALTER TABLE tb_productos_ofertas
MODIFY COLUMN precio_oferta DECIMAL(10,2) NULL
COMMENT 'Precio con oferta aplicada. NULL = calcular dinámicamente, valor = precio personalizado';

-- ============================================================================
-- ROLLBACK (si es necesario)
-- ============================================================================
-- Para revertir estos cambios:
-- ALTER TABLE tb_productos_ofertas DROP COLUMN es_precio_personalizado;
-- ALTER TABLE tb_productos_ofertas MODIFY COLUMN precio_oferta DECIMAL(10,2) NOT NULL;
-- ============================================================================

-- Verificar estructura actualizada
DESCRIBE tb_productos_ofertas;

-- Verificar datos
SELECT
    id_producto_oferta,
    id_producto,
    id_oferta,
    precio_oferta,
    es_precio_personalizado,
    fyh_creacion
FROM tb_productos_ofertas
LIMIT 5;
