-- Migración para añadir soporte de Soft Delete (Borrado Lógico) a entidades clave
-- Usamos un procedimiento almacenado temporal para que sea idempotente (seguro) en MySQL.

DELIMITER $$

DROP PROCEDURE IF EXISTS AddSoftDeleteColumns$$

CREATE PROCEDURE AddSoftDeleteColumns()
BEGIN
    -- 1. Añadir columna activo a tb_almacen si no existe
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_almacen' 
        AND COLUMN_NAME = 'activo'
    ) THEN
        ALTER TABLE `tb_almacen` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `orden_destacado`;
    END IF;

    -- 2. Añadir columna activo a tb_categorias si no existe
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_categorias' 
        AND COLUMN_NAME = 'activo'
    ) THEN
        ALTER TABLE `tb_categorias` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `nombre_categoria`;
    END IF;

    -- 3. Añadir columna activo a tb_proveedores si no existe
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tb_proveedores' 
        AND COLUMN_NAME = 'activo'
    ) THEN
        ALTER TABLE `tb_proveedores` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `direccion`;
    END IF;
END$$

DELIMITER ;

-- Ejecutar el procedimiento
CALL AddSoftDeleteColumns();

-- Limpiar el procedimiento temporal
DROP PROCEDURE AddSoftDeleteColumns;
