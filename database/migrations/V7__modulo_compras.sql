-- V7: Módulo de Compras a Proveedores
-- Agrega campos de precio a detalle de compras (precio_unitario, subtotal)
-- Agrega estado y observaciones a compras

ALTER TABLE tb_detalle_compras
  ADD COLUMN precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER cantidad,
  ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER precio_unitario;

ALTER TABLE tb_compras
  ADD COLUMN estado ENUM('activa', 'anulada') NOT NULL DEFAULT 'activa' AFTER precio_total,
  ADD COLUMN observaciones TEXT NULL AFTER estado;
