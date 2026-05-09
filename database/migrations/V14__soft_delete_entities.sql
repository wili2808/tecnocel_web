-- Migración para añadir soporte de Soft Delete (Borrado Lógico) a entidades clave
-- Añade la columna 'activo' a productos, categorías y proveedores

-- 1. Añadir columna activo a tb_almacen (Productos)
ALTER TABLE `tb_almacen` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `orden_destacado`;

-- 2. Añadir columna activo a tb_categorias
ALTER TABLE `tb_categorias` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `nombre_categoria`;

-- 3. Añadir columna activo a tb_proveedores
ALTER TABLE `tb_proveedores` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `direccion`;

-- 4. Añadir columna activo a tb_marcas
ALTER TABLE `tb_marcas` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `descripcion_marca`;

-- 5. Añadir columna activo a tb_tipos_caracteristicas
ALTER TABLE `tb_tipos_caracteristicas` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `opciones_seleccion`;

-- Logs para auditoría (Opcional pero recomendado para saber quién hizo el cambio)
-- Nota: Ya existen fyh_actualizacion en estas tablas.
