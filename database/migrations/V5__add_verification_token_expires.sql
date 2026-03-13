-- Migración: agregar expiración al token de verificación de email
-- Ejecutar: mysql -u root -p db_tecnocel_v4 < database/migrations/V5__add_verification_token_expires.sql

ALTER TABLE tb_clientes
  ADD COLUMN verification_token_expires DATETIME NULL
  AFTER verification_token;
