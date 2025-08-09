-- ==============================================
-- Script de migración: Sistema de comentarios para productos
-- Versión: 1.0
-- Fecha: 2025-01-26
-- Autor: Sistema MacWil
-- Descripción: Crea las tablas necesarias para implementar
--              comentarios con imágenes en productos
-- ==============================================

-- Tabla principal de comentarios de productos
CREATE TABLE `tb_comentarios_productos` (
  `id_comentario` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `comentario` text NOT NULL,
  `calificacion` tinyint(1) DEFAULT NULL CHECK (`calificacion` >= 1 AND `calificacion` <= 5),
  `es_verificado` tinyint(1) NOT NULL DEFAULT 0,
  `estado` enum('activo','oculto','eliminado') NOT NULL DEFAULT 'activo',
  `respuesta_admin` text DEFAULT NULL,
  `fecha_respuesta_admin` datetime DEFAULT NULL,
  `id_admin_respuesta` int(11) DEFAULT NULL,
  `fyh_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fyh_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_comentario`),
  KEY `idx_producto` (`id_producto`),
  KEY `idx_cliente` (`id_cliente`),
  KEY `idx_estado` (`estado`),
  KEY `idx_calificacion` (`calificacion`),
  KEY `idx_fecha_creacion` (`fyh_creacion`),
  CONSTRAINT `fk_comentario_producto` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comentario_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comentario_admin` FOREIGN KEY (`id_admin_respuesta`) REFERENCES `tb_usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de comentarios y reseñas de productos';

-- Tabla de imágenes asociadas a comentarios
CREATE TABLE `tb_comentario_imagenes` (
  `id_imagen` int(11) NOT NULL AUTO_INCREMENT,
  `id_comentario` int(11) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_imagen` varchar(500) NOT NULL,
  `tipo_archivo` varchar(10) NOT NULL DEFAULT 'jpg',
  `tamaño_archivo` int(11) DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `orden` tinyint(2) NOT NULL DEFAULT 1,
  `estado` enum('activo','eliminado') NOT NULL DEFAULT 'activo',
  `fyh_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fyh_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_imagen`),
  KEY `idx_comentario` (`id_comentario`),
  KEY `idx_orden` (`orden`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_imagen_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `tb_comentarios_productos` (`id_comentario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_orden_valido` CHECK (`orden` >= 1 AND `orden` <= 5),
  CONSTRAINT `chk_tipo_archivo` CHECK (`tipo_archivo` IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de imágenes adjuntas a comentarios de productos';

-- Crear índices adicionales para optimización
CREATE INDEX `idx_comentarios_producto_activos` ON `tb_comentarios_productos` (`id_producto`, `estado`, `fyh_creacion`);

CREATE INDEX `idx_comentarios_cliente_activos` ON `tb_comentarios_productos` (`id_cliente`, `estado`, `fyh_creacion`);

CREATE INDEX `idx_imagenes_comentario_activas` ON `tb_comentario_imagenes` (`id_comentario`, `estado`, `orden`);

-- Crear vista para consultas optimizadas de comentarios con estadísticas
CREATE VIEW `vw_comentarios_con_estadisticas` AS
SELECT 
    c.id_comentario,
    c.id_producto,
    c.id_cliente,
    c.comentario,
    c.calificacion,
    c.es_verificado,
    c.estado,
    c.respuesta_admin,
    c.fecha_respuesta_admin,
    c.fyh_creacion,
    cl.nombre_cliente,
    cl.apellido_cliente,
    p.nombre as nombre_producto,
    p.codigo as codigo_producto,
    (SELECT COUNT(*) FROM tb_comentario_imagenes img 
     WHERE img.id_comentario = c.id_comentario AND img.estado = 'activo') as total_imagenes
FROM tb_comentarios_productos c
INNER JOIN tb_clientes cl ON c.id_cliente = cl.id_cliente
INNER JOIN tb_almacen p ON c.id_producto = p.id_producto
WHERE c.estado = 'activo';

-- Crear vista para estadísticas de productos
CREATE VIEW `vw_estadisticas_comentarios_productos` AS
SELECT 
    p.id_producto,
    p.nombre as nombre_producto,
    p.codigo as codigo_producto,
    COUNT(c.id_comentario) as total_comentarios,
    COUNT(CASE WHEN c.calificacion IS NOT NULL THEN 1 END) as total_calificaciones,
    ROUND(AVG(c.calificacion), 1) as calificacion_promedio,
    COUNT(CASE WHEN c.calificacion = 5 THEN 1 END) as calificaciones_5_estrellas,
    COUNT(CASE WHEN c.calificacion = 4 THEN 1 END) as calificaciones_4_estrellas,
    COUNT(CASE WHEN c.calificacion = 3 THEN 1 END) as calificaciones_3_estrellas,
    COUNT(CASE WHEN c.calificacion = 2 THEN 1 END) as calificaciones_2_estrellas,
    COUNT(CASE WHEN c.calificacion = 1 THEN 1 END) as calificaciones_1_estrella,
    SUM(CASE WHEN img.id_imagen IS NOT NULL THEN 1 ELSE 0 END) as total_imagenes
FROM tb_almacen p
LEFT JOIN tb_comentarios_productos c ON p.id_producto = c.id_producto AND c.estado = 'activo'
LEFT JOIN tb_comentario_imagenes img ON c.id_comentario = img.id_comentario AND img.estado = 'activo'
GROUP BY p.id_producto, p.nombre, p.codigo;

-- Crear procedimiento almacenado para obtener comentarios paginados
DELIMITER $$

CREATE PROCEDURE `sp_obtener_comentarios_producto`(
    IN p_id_producto INT,
    IN p_limite INT DEFAULT 10,
    IN p_offset INT DEFAULT 0,
    IN p_orden VARCHAR(20) DEFAULT 'recientes'
)
BEGIN
    DECLARE v_order_clause VARCHAR(50);
    
    -- Determinar el orden
    CASE p_orden
        WHEN 'recientes' THEN SET v_order_clause = 'c.fyh_creacion DESC';
        WHEN 'antiguos' THEN SET v_order_clause = 'c.fyh_creacion ASC';
        WHEN 'mejor_calificacion' THEN SET v_order_clause = 'c.calificacion DESC, c.fyh_creacion DESC';
        WHEN 'peor_calificacion' THEN SET v_order_clause = 'c.calificacion ASC, c.fyh_creacion DESC';
        ELSE SET v_order_clause = 'c.fyh_creacion DESC';
    END CASE;
    
    SET @sql = CONCAT('
        SELECT 
            c.id_comentario,
            c.id_producto,
            c.id_cliente,
            c.comentario,
            c.calificacion,
            c.es_verificado,
            c.respuesta_admin,
            c.fecha_respuesta_admin,
            c.fyh_creacion,
            cl.nombre_cliente,
            cl.apellido_cliente,
            GROUP_CONCAT(
                CONCAT(img.id_imagen, "|", img.ruta_imagen, "|", img.alt_text) 
                ORDER BY img.orden ASC 
                SEPARATOR ";"
            ) as imagenes
        FROM tb_comentarios_productos c
        INNER JOIN tb_clientes cl ON c.id_cliente = cl.id_cliente
        LEFT JOIN tb_comentario_imagenes img ON c.id_comentario = img.id_comentario AND img.estado = "activo"
        WHERE c.id_producto = ', p_id_producto, ' AND c.estado = "activo"
        GROUP BY c.id_comentario
        ORDER BY ', v_order_clause, '
        LIMIT ', p_limite, ' OFFSET ', p_offset
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Obtener total de comentarios para paginación
    SELECT COUNT(*) as total_comentarios 
    FROM tb_comentarios_productos 
    WHERE id_producto = p_id_producto AND estado = 'activo';
END$$

DELIMITER;

-- Datos de ejemplo para testing (opcional, se puede eliminar en producción)
-- Comentarios de ejemplo para los primeros productos
INSERT INTO `tb_comentarios_productos` 
    (`id_producto`, `id_cliente`, `comentario`, `calificacion`, `es_verificado`, `estado`) VALUES
    (5, 6, 'Excelente producto, muy buena calidad. La cámara es impresionante para el precio.', 5, 1, 'activo'),
    (5, 7, 'Buen teléfono pero la batería podría durar más. En general recomendado.', 4, 1, 'activo'),
    (6, 8, 'El diseño es hermoso y el rendimiento es excelente. Vale cada peso invertido.', 5, 1, 'activo'),
    (7, 9, 'Producto básico pero cumple su función. Ideal para uso diario sin complicaciones.', 3, 1, 'activo'),
    (8, 12, 'Muy contento con la compra. El envío fue rápido y el producto llegó en perfectas condiciones.', 4, 1, 'activo');

-- Comentarios adicionales (opcional - más volumen para testing)
INSERT INTO `tb_comentarios_productos` 
    (`id_producto`, `id_cliente`, `comentario`, `calificacion`, `es_verificado`, `estado`) VALUES
    (9, 13, 'La PlayStation 5 Pro es increíble. Los gráficos en 8K se ven espectaculares.', 5, 1, 'activo'),
    (11, 14, 'Xiaomi Poco C75 tiene una excelente relación calidad-precio. Recomendado 100%.', 4, 1, 'activo'),
    (12, 15, 'El color dorado es hermoso. Funciona perfecto y la cámara es sorprendente.', 5, 0, 'activo'),
    (13, 16, 'Verde es mi color favorito y este teléfono no decepciona. Muy satisfecho.', 4, 1, 'activo'),
    (14, 17, 'Pantalla grande y clara. Ideal para videos y juegos. Batería dura todo el día.', 5, 1, 'activo');

-- Información adicional del script
-- =====================================
-- NOTAS IMPORTANTES:
-- 1. Este script crea las tablas necesarias para el sistema de comentarios
-- 2. Incluye índices optimizados para mejorar el rendimiento de las consultas
-- 3. Las vistas creadas facilitan la obtención de estadísticas
-- 4. El procedimiento almacenado permite paginación eficiente
-- 5. Se pueden agregar más restricciones según las necesidades del negocio
--
-- CONFIGURACIONES RECOMENDADAS:
-- - Configurar límites de subida de imágenes (máximo 5 por comentario)
-- - Implementar validación de tipos de archivo en la aplicación
-- - Configurar limpieza automática de imágenes huérfanas
-- - Implementar moderación de comentarios si es necesario
--
-- PERMISOS NECESARIOS:
-- - CREATE TABLE
-- - CREATE VIEW
-- - CREATE PROCEDURE
-- - CREATE INDEX
-- - INSERT (para datos de ejemplo)
-- =====================================