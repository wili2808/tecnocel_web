-- V12: Módulo de Mensajes de Contacto
-- Tabla para almacenar mensajes de la web y permisos asociados

CREATE TABLE `tb_mensajes_contacto` (
  `id_mensaje_contacto` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(20) NULL,
  `asunto` VARCHAR(100) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `leido` BOOLEAN NOT NULL DEFAULT FALSE,
  `fyh_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fyh_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensaje_contacto`),
  INDEX `idx_mensaje_leido` (`leido`),
  INDEX `idx_mensaje_creacion` (`fyh_creacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar nuevos permisos
INSERT INTO tb_permisos (nombre, descripcion, modulo, accion) VALUES
('ver_mensajes', 'Ver lista de mensajes de contacto', 'mensajes', 'ver'),
('gestionar_mensajes', 'Marcar mensajes como leídos o eliminarlos', 'mensajes', 'gestionar');

-- Asignar nuevos permisos al ADMIN (rol 1) y GERENTE (rol 2)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM tb_permisos WHERE modulo = 'mensajes';

INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 2, id_permiso FROM tb_permisos WHERE modulo = 'mensajes';
