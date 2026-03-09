-- Migración V3: Crear tabla de respuestas a comentarios de productos
-- Permite a clientes y admins responder comentarios existentes

CREATE TABLE `tb_comentario_respuestas` (
  `id_respuesta`      INT            NOT NULL AUTO_INCREMENT,
  `id_comentario`     INT            NOT NULL,
  `id_cliente`        INT            NULL,
  `id_usuario`        INT            NULL,
  `tipo_autor`        ENUM('cliente', 'admin') NOT NULL,
  `contenido`         TEXT           NOT NULL,
  `estado`            ENUM('activo', 'oculto', 'eliminado') NOT NULL DEFAULT 'activo',
  `fyh_creacion`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fyh_actualizacion` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id_respuesta`),

  CONSTRAINT `fk_respuesta_comentario`
    FOREIGN KEY (`id_comentario`)
    REFERENCES `tb_comentarios_productos` (`id_comentario`)
    ON DELETE CASCADE,

  CONSTRAINT `fk_respuesta_cliente`
    FOREIGN KEY (`id_cliente`)
    REFERENCES `tb_clientes` (`id_cliente`)
    ON DELETE SET NULL,

  CONSTRAINT `fk_respuesta_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `tb_usuarios` (`id_usuario`)
    ON DELETE SET NULL,

  INDEX `idx_respuesta_comentario` (`id_comentario`),
  INDEX `idx_respuesta_estado`     (`estado`),
  INDEX `idx_respuesta_combo`      (`id_comentario`, `estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
