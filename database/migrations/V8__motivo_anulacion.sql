-- V8: Agregar campo motivo_anulacion a compras
-- Almacena el motivo de anulación cuando se anula una compra

ALTER TABLE tb_compras
  ADD COLUMN motivo_anulacion TEXT NULL AFTER observaciones;
