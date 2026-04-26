-- V10: Separación de permisos de retiros en tienda

-- Insertar los nuevos permisos de retiros (módulo "envios" para agruparlos en la misma sección UI)
INSERT INTO tb_permisos (nombre, descripcion, modulo, accion) VALUES
('ver_retiros', 'Ver lista de retiros en tienda', 'envios', 'ver'),
('gestionar_retiros', 'Gestionar estados de retiros en tienda', 'envios', 'gestionar');

-- Asignar nuevos permisos al ADMIN (rol id = 1)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM tb_permisos WHERE nombre IN ('ver_retiros', 'gestionar_retiros');

-- Asignar nuevos permisos al GERENTE (rol id = 2) - Si tenía ver_envios y gestionar_envios
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 2, id_permiso FROM tb_permisos WHERE nombre IN ('ver_retiros', 'gestionar_retiros');

-- Asignar nuevos permisos al VENDEDOR (rol id = 3) - El vendedor tiene permisos de envíos por defecto, le damos también retiros
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 3, id_permiso FROM tb_permisos WHERE nombre IN ('ver_retiros', 'gestionar_retiros');
