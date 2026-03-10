-- Migración V3: Agregar columna fyh_ultimo_login a tb_usuarios

ALTER TABLE `tb_usuarios`
  ADD COLUMN `fyh_ultimo_login` DATETIME NULL DEFAULT NULL
    AFTER `id_rol`;
