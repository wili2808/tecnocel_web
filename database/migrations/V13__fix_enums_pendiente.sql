-- Migración V13: Añadir estado 'pendiente' a los ENUMs de comentarios y respuestas
-- Esto corrige el error donde los comentarios nuevos se guardaban sin estado
-- debido a que 'pendiente' no existía en el ENUM de la base de datos.

-- 1. Modificar la tabla de comentarios
ALTER TABLE `tb_comentarios_productos` 
  MODIFY COLUMN `estado` ENUM('pendiente', 'activo', 'oculto', 'eliminado') NOT NULL DEFAULT 'pendiente';

-- 2. Modificar la tabla de respuestas
ALTER TABLE `tb_comentario_respuestas` 
  MODIFY COLUMN `estado` ENUM('pendiente', 'activo', 'oculto', 'eliminado') NOT NULL DEFAULT 'pendiente';

-- 3. Corregir registros existentes que quedaron con estado vacío por el error
-- Nota: MySQL puede haber guardado un valor vacío si el ENUM falló sin modo estricto
UPDATE `tb_comentarios_productos` SET `estado` = 'pendiente' WHERE `estado` = '' OR `estado` IS NULL;
UPDATE `tb_comentario_respuestas` SET `estado` = 'pendiente' WHERE `estado` = '' OR `estado` IS NULL;
