-- V15: Permiso para gestionar configuración del sitio (mantenimiento)

-- Insertar el nuevo permiso
INSERT INTO tb_permisos (nombre, descripcion, modulo, accion) VALUES
('gestionar_configuracion', 'Gestionar estado del sitio (modo mantenimiento)', 'configuracion', 'gestionar');

-- Asignar nuevo permiso al ADMIN (rol id = 1)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM tb_permisos WHERE nombre = 'gestionar_configuracion';

-- Asignar nuevo permiso al GERENTE (rol id = 2)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 2, id_permiso FROM tb_permisos WHERE nombre = 'gestionar_configuracion';
