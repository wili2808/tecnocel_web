-- V16: Permisos granulares para cada sección de configuración del sitio

-- Insertar los nuevos permisos
INSERT INTO tb_permisos (nombre, descripcion, modulo, accion) VALUES
('gestionar_presencia_web', 'Gestionar título y descripción SEO del sitio', 'configuracion', 'gestionar'),
('gestionar_contacto', 'Gestionar email, teléfono, horarios y dirección', 'configuracion', 'gestionar'),
('gestionar_redes_sociales', 'Gestionar enlaces a redes sociales', 'configuracion', 'gestionar'),
('gestionar_ubicacion', 'Gestionar coordenadas y título del mapa', 'configuracion', 'gestionar');

-- Asignar nuevos permisos al ADMIN (rol id = 1)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM tb_permisos WHERE nombre IN (
  'gestionar_presencia_web',
  'gestionar_contacto',
  'gestionar_redes_sociales',
  'gestionar_ubicacion'
);

-- Asignar nuevos permisos al GERENTE (rol id = 2)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 2, id_permiso FROM tb_permisos WHERE nombre IN (
  'gestionar_presencia_web',
  'gestionar_contacto',
  'gestionar_redes_sociales',
  'gestionar_ubicacion'
);
