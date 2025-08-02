-- Migración: Agregar campo google_id a la tabla tb_clientes
-- Ejecutar este script en tu base de datos MySQL

USE tecnocel_db_v2;

-- Agregar columna google_id
ALTER TABLE tb_clientes
ADD COLUMN google_id VARCHAR(255) NULL,
ADD UNIQUE INDEX idx_google_id (google_id);

-- Verificar que la columna se agregó correctamente
DESCRIBE tb_clientes;