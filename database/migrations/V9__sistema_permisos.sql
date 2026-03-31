-- V9: Sistema de permisos granulares
-- Tabla de permisos y relación muchos a muchos con roles

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS tb_permisos (
  id_permiso INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL COMMENT 'Identificador único del permiso',
  descripcion VARCHAR(255) NULL COMMENT 'Descripción legible del permiso',
  modulo VARCHAR(50) NOT NULL COMMENT 'Módulo al que pertenece el permiso',
  accion VARCHAR(20) NOT NULL COMMENT 'Tipo de acción: crear, editar, eliminar, ver, exportar',
  fyh_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fyh_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_permiso),
  UNIQUE KEY uk_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de permisos del sistema';

-- Tabla pivote roles-permisos
CREATE TABLE IF NOT EXISTS tb_roles_permisos (
  id_rol INT(11) NOT NULL,
  id_permiso INT(11) NOT NULL,
  fyh_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_rol, id_permiso),
  FOREIGN KEY (id_rol) REFERENCES tb_roles(id_rol) ON DELETE CASCADE,
  FOREIGN KEY (id_permiso) REFERENCES tb_permisos(id_permiso) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Relación entre roles y permisos';

-- Insertar permisos iniciales
INSERT INTO tb_permisos (nombre, descripcion, modulo, accion) VALUES
-- Permisos de usuarios
('ver_usuarios', 'Ver lista de usuarios del sistema', 'usuarios', 'ver'),
('crear_usuario', 'Crear nuevos usuarios del sistema', 'usuarios', 'crear'),
('editar_usuario', 'Editar usuarios existentes', 'usuarios', 'editar'),
('eliminar_usuario', 'Eliminar usuarios del sistema', 'usuarios', 'eliminar'),

-- Permisos de roles
('ver_roles', 'Ver lista de roles', 'roles', 'ver'),
('crear_rol', 'Crear nuevos roles', 'roles', 'crear'),
('editar_rol', 'Editar roles existentes', 'roles', 'editar'),
('eliminar_rol', 'Eliminar roles del sistema', 'roles', 'eliminar'),
('gestionar_permisos', 'Gestionar permisos de roles', 'roles', 'gestionar'),

-- Permisos de clientes
('ver_clientes', 'Ver lista de clientes', 'clientes', 'ver'),
('crear_cliente', 'Crear nuevos clientes', 'clientes', 'crear'),
('editar_cliente', 'Editar clientes existentes', 'clientes', 'editar'),
('eliminar_cliente', 'Eliminar clientes', 'clientes', 'eliminar'),

-- Permisos de productos
('ver_productos', 'Ver lista de productos', 'productos', 'ver'),
('crear_producto', 'Crear nuevos productos', 'productos', 'crear'),
('editar_producto', 'Editar productos existentes', 'productos', 'editar'),
('eliminar_producto', 'Eliminar productos', 'productos', 'eliminar'),

-- Permisos de marcas
('ver_marcas', 'Ver lista de marcas', 'marcas', 'ver'),
('crear_marca', 'Crear nuevas marcas', 'marcas', 'crear'),
('editar_marca', 'Editar marcas existentes', 'marcas', 'editar'),
('eliminar_marca', 'Eliminar marcas', 'marcas', 'eliminar'),

-- Permisos de categorías
('ver_categorias', 'Ver lista de categorías', 'categorias', 'ver'),
('crear_categoria', 'Crear nuevas categorías', 'categorias', 'crear'),
('editar_categoria', 'Editar categorías existentes', 'categorias', 'editar'),
('eliminar_categoria', 'Eliminar categorías', 'categorias', 'eliminar'),

-- Permisos de ofertas
('ver_ofertas', 'Ver lista de ofertas', 'ofertas', 'ver'),
('crear_oferta', 'Crear nuevas ofertas', 'ofertas', 'crear'),
('editar_oferta', 'Editar ofertas existentes', 'ofertas', 'editar'),
('eliminar_oferta', 'Eliminar ofertas', 'ofertas', 'eliminar'),

-- Permisos de ventas
('ver_ventas', 'Ver lista de ventas', 'ventas', 'ver'),
('crear_venta', 'Registrar nuevas ventas', 'ventas', 'crear'),
('editar_venta', 'Editar ventas existentes', 'ventas', 'editar'),
('cancelar_venta', 'Cancelar ventas', 'ventas', 'cancelar'),
('descargar_pdf_venta', 'Descargar comprobante PDF de ventas', 'ventas', 'descargar'),
('enviar_email_venta', 'Enviar comprobante por email', 'ventas', 'enviar'),

-- Permisos de compras
('ver_compras', 'Ver lista de compras', 'compras', 'ver'),
('crear_compra', 'Registrar nuevas compras', 'compras', 'crear'),
('editar_compra', 'Editar compras existentes', 'compras', 'editar'),
('eliminar_compra', 'Eliminar compras', 'compras', 'eliminar'),

-- Permisos de proveedores
('ver_proveedores', 'Ver lista de proveedores', 'proveedores', 'ver'),
('crear_proveedor', 'Crear nuevos proveedores', 'proveedores', 'crear'),
('editar_proveedor', 'Editar proveedores existentes', 'proveedores', 'editar'),
('eliminar_proveedor', 'Eliminar proveedores', 'proveedores', 'eliminar'),

-- Permisos de reportes
('ver_reportes', 'Ver reportes del sistema', 'reportes', 'ver'),
('exportar_reportes', 'Exportar reportes a CSV/PDF', 'reportes', 'exportar'),

-- Permisos de envíos
('ver_envios', 'Ver lista de envíos', 'envios', 'ver'),
('gestionar_envios', 'Gestionar estados de envíos', 'envios', 'gestionar'),

-- Permisos de imágenes

-- Permisos de características
('ver_caracteristicas', 'Ver tipos de características', 'caracteristicas', 'ver'),
('crear_caracteristica', 'Crear tipos de características', 'caracteristicas', 'crear'),
('editar_caracteristica', 'Editar tipos de características', 'caracteristicas', 'editar'),
('eliminar_caracteristica', 'Eliminar tipos de características', 'caracteristicas', 'eliminar'),

-- Permisos de comentarios
('responder_comentarios', 'Responder comentarios', 'comentarios', 'responder'),
('eliminar_comentarios', 'Eliminar comentarios', 'comentarios', 'eliminar'),
('moderar_comentarios', 'Moderar comentarios (ocultar/mostrar)', 'comentarios', 'moderar'),

-- Permisos de configuración
('ver_configuracion', 'Ver valor dólar', 'configuracion', 'ver'),
('editar_configuracion', 'Editar valor dólar', 'configuracion', 'editar');

-- Asignar permisos por defecto a ADMIN (rol id = 1)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM tb_permisos;

-- Asignar permisos por defecto a GERENTE (rol id = 2)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 2, id_permiso FROM tb_permisos
WHERE nombre NOT IN (
  'crear_rol', 'editar_rol', 'eliminar_rol', 'gestionar_permisos',
  'crear_marca', 'editar_marca', 'eliminar_marca',
  'crear_usuario', 'editar_usuario', 'eliminar_usuario',
  'ver_configuracion', 'editar_configuracion'
);

-- Asignar permisos por defecto a VENDEDOR (rol id = 3)
INSERT INTO tb_roles_permisos (id_rol, id_permiso)
SELECT 3, id_permiso FROM tb_permisos
WHERE nombre IN (
  'ver_productos', 'crear_producto', 'editar_producto',
  'ver_clientes', 'crear_cliente', 'editar_cliente',
  'ver_ventas', 'crear_venta',
  'ver_compras', 'crear_compra', 'editar_compra',
  'ver_envios', 'gestionar_envios',
  'responder_comentarios',
  'ver_proveedores'
);
