-- V6: Gestión de envíos
-- Renombra fecha_despacho a fyh_despacho (convención fyh_ para timestamps)
-- Agrega campo nro_seguimiento para código de rastreo logístico

ALTER TABLE tb_envios CHANGE fecha_despacho fyh_despacho DATETIME NULL;
ALTER TABLE tb_envios ADD COLUMN nro_seguimiento VARCHAR(100) NULL AFTER estado_envio;
