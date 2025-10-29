-- ============================================================================
-- MIGRACION: Agregar auditoria de precios a CarritoWebItems
-- VERSION 3 - Nomenclatura clara sin ambiguedades
-- ============================================================================
-- Fecha: 2025-10-28
-- Descripcion: Agrega campos para rastrear precios originales, ofertas aplicadas
--              y detectar cambios de precio entre el momento de agregar al carrito
--              y el momento de compra.
--
-- NOMENCLATURA CLARA:
-- - Campos existentes (precio_unitario, fyh_creacion) NO se renombran
-- - Campos nuevos usan sufijo "_original" para valores historicos
-- - Nombres descriptivos sin ambiguedades
--
-- Cambios:
-- 1. Agrega 7 columnas nuevas para auditoria de precios
-- 2. Migra datos existentes de forma segura
-- 3. Agrega foreign key a tb_ofertas
-- 4. Crea indices para optimizacion de consultas
-- ============================================================================

USE db_tecnocel_v4;

-- ============================================================================
-- VERIFICACION PREVIA: Ver cuantos registros existen
-- ============================================================================

SELECT
    '=== ESTADO ANTES DE LA MIGRACION ===' as info;

SELECT
    COUNT(*) as total_items_existentes,
    MIN(fyh_creacion) as item_mas_antiguo,
    MAX(fyh_creacion) as item_mas_reciente
FROM tb_carritoweb_items;

-- ============================================================================
-- PASO 1: Agregar nuevas columnas (inicialmente NULL para facilitar migracion)
-- ============================================================================

SELECT
    '=== PASO 1: Agregando columnas nuevas ===' as info;

ALTER TABLE tb_carritoweb_items
ADD COLUMN precio_base_original DECIMAL(10,2) NULL
  COMMENT 'Precio de catalogo SIN descuento al momento de agregar al carrito',
ADD COLUMN precio_con_oferta_original DECIMAL(10,2) NULL
  COMMENT 'Precio CON oferta aplicada al momento de agregar (NULL si no habia oferta)',
ADD COLUMN descuento_porcentaje_original DECIMAL(5,2) NULL
  COMMENT 'Porcentaje de descuento que se aplico originalmente',
ADD COLUMN id_oferta_aplicada INT NULL
  COMMENT 'FK a la oferta que se uso (NULL si no hubo oferta)',
ADD COLUMN precio_es_manual BOOLEAN NULL
  COMMENT 'TRUE si fue un precio personalizado manualmente',
ADD COLUMN fyh_precio_validado DATETIME NULL
  COMMENT 'Ultima vez que se valido/verifico el precio contra el catalogo actual',
ADD COLUMN precio_ha_cambiado BOOLEAN NULL
  COMMENT 'TRUE si el precio actual del producto difiere del original';

-- ============================================================================
-- PASO 2: Migrar datos existentes ANTES de aplicar constraints
-- ============================================================================

SELECT
    '=== PASO 2: Migrando datos existentes ===' as info;

-- Para items existentes en el carrito, asumir que:
-- 1. precio_base_original = precio_unitario (no tenemos info de precio sin oferta)
-- 2. precio_con_oferta_original = precio_unitario (precio que se guardo)
-- 3. descuento_porcentaje_original = NULL (no sabemos si habia descuento)
-- 4. id_oferta_aplicada = NULL (no sabemos que oferta se uso)
-- 5. precio_es_manual = FALSE (asumimos precio calculado)
-- 6. fyh_precio_validado = fyh_creacion (primera vez = creacion)
-- 7. precio_ha_cambiado = FALSE (asumimos que no ha cambiado)

UPDATE tb_carritoweb_items
SET
  precio_base_original = precio_unitario,
  precio_con_oferta_original = precio_unitario,
  descuento_porcentaje_original = NULL,
  id_oferta_aplicada = NULL,
  precio_es_manual = FALSE,
  fyh_precio_validado = fyh_creacion,
  precio_ha_cambiado = FALSE
WHERE precio_base_original IS NULL;

-- Verificar cuantos registros se migraron
SELECT
    COUNT(*) as items_totales,
    COUNT(precio_base_original) as items_con_precio_base,
    COUNT(precio_con_oferta_original) as items_con_precio_oferta,
    COUNT(fyh_precio_validado) as items_con_fyh_validado,
    COUNT(CASE WHEN precio_base_original = precio_unitario THEN 1 END) as items_migrados_ok
FROM tb_carritoweb_items;

-- ============================================================================
-- PASO 3: Aplicar constraints NOT NULL ahora que los datos estan migrados
-- ============================================================================

SELECT
    '=== PASO 3: Aplicando constraints NOT NULL ===' as info;

ALTER TABLE tb_carritoweb_items
MODIFY COLUMN precio_base_original DECIMAL(10,2) NOT NULL
  COMMENT 'Precio de catalogo SIN descuento al momento de agregar al carrito',
MODIFY COLUMN precio_es_manual BOOLEAN NOT NULL DEFAULT FALSE
  COMMENT 'TRUE si fue un precio personalizado manualmente',
MODIFY COLUMN fyh_precio_validado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  COMMENT 'Ultima vez que se valido/verifico el precio contra el catalogo actual',
MODIFY COLUMN precio_ha_cambiado BOOLEAN NOT NULL DEFAULT FALSE
  COMMENT 'TRUE si el precio actual del producto difiere del original';

-- ============================================================================
-- PASO 4: Agregar foreign key a ofertas
-- ============================================================================

SELECT
    '=== PASO 4: Agregando foreign key ===' as info;

ALTER TABLE tb_carritoweb_items
ADD CONSTRAINT fk_carritoweb_items_oferta
FOREIGN KEY (id_oferta_aplicada)
REFERENCES tb_ofertas(id_oferta)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- PASO 5: Crear indices para optimizacion
-- ============================================================================

SELECT
    '=== PASO 5: Creando indices ===' as info;

CREATE INDEX idx_carritoweb_items_oferta
ON tb_carritoweb_items(id_oferta_aplicada)
COMMENT 'Indice para busquedas por oferta aplicada';

CREATE INDEX idx_carritoweb_items_fyh_validado
ON tb_carritoweb_items(fyh_precio_validado)
COMMENT 'Indice para analisis temporal de validaciones de precio';

CREATE INDEX idx_carritoweb_items_ha_cambiado
ON tb_carritoweb_items(precio_ha_cambiado)
COMMENT 'Indice para filtrar items con cambio de precio';

-- ============================================================================
-- VALIDACION FINAL
-- ============================================================================

SELECT
    '=== VALIDACION: Columnas agregadas ===' as info;

SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_tecnocel_v4'
  AND TABLE_NAME = 'tb_carritoweb_items'
  AND COLUMN_NAME IN (
    'precio_base_original',
    'precio_con_oferta_original',
    'descuento_porcentaje_original',
    'id_oferta_aplicada',
    'precio_es_manual',
    'fyh_precio_validado',
    'precio_ha_cambiado'
  )
ORDER BY ORDINAL_POSITION;

SELECT
    '=== VALIDACION: Foreign key ===' as info;

SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    REFERENCED_TABLE_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'db_tecnocel_v4'
  AND CONSTRAINT_NAME = 'fk_carritoweb_items_oferta';

SELECT
    '=== VALIDACION: Indices creados ===' as info;

SHOW INDEX FROM tb_carritoweb_items
WHERE Key_name IN (
  'idx_carritoweb_items_oferta',
  'idx_carritoweb_items_fyh_validado',
  'idx_carritoweb_items_ha_cambiado'
);

SELECT
    '=== VALIDACION: Integridad de datos ===' as info;

SELECT
    COUNT(*) as total_items,
    COUNT(precio_base_original) as con_precio_base,
    COUNT(precio_con_oferta_original) as con_precio_oferta,
    COUNT(fyh_precio_validado) as con_fyh_validado,
    COUNT(CASE WHEN precio_ha_cambiado = TRUE THEN 1 END) as items_con_cambio,
    COUNT(CASE WHEN precio_ha_cambiado = FALSE THEN 1 END) as items_sin_cambio
FROM tb_carritoweb_items;

SELECT
    '=== VALIDACION: Ejemplos de datos migrados ===' as info;

SELECT
    id_item,
    id_producto,
    cantidad,
    precio_unitario as precio_actual,
    precio_base_original,
    precio_con_oferta_original,
    descuento_porcentaje_original,
    id_oferta_aplicada,
    precio_es_manual,
    DATE_FORMAT(fyh_creacion, '%Y-%m-%d %H:%i') as creado_en,
    DATE_FORMAT(fyh_precio_validado, '%Y-%m-%d %H:%i') as validado_en,
    precio_ha_cambiado
FROM tb_carritoweb_items
LIMIT 5;

-- ============================================================================
-- ROLLBACK (si es necesario)
-- ============================================================================
-- Para revertir esta migracion, ejecutar:
--
-- ALTER TABLE tb_carritoweb_items
-- DROP FOREIGN KEY fk_carritoweb_items_oferta,
-- DROP INDEX idx_carritoweb_items_oferta,
-- DROP INDEX idx_carritoweb_items_fyh_validado,
-- DROP INDEX idx_carritoweb_items_ha_cambiado,
-- DROP COLUMN precio_base_original,
-- DROP COLUMN precio_con_oferta_original,
-- DROP COLUMN descuento_porcentaje_original,
-- DROP COLUMN id_oferta_aplicada,
-- DROP COLUMN precio_es_manual,
-- DROP COLUMN fyh_precio_validado,
-- DROP COLUMN precio_ha_cambiado;
-- ============================================================================

SELECT
    '=== MIGRACION COMPLETADA EXITOSAMENTE ===' as info;

-- Mostrar estructura final de la tabla
DESCRIBE tb_carritoweb_items;
