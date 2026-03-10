CREATE TABLE `tb_notificaciones` (
  `id_notificacion`  INT            NOT NULL AUTO_INCREMENT,
  `id_cliente`       INT            NOT NULL,
  `tipo`             ENUM('respuesta_admin','respuesta_cliente','comentario_moderado','venta_confirmada','venta_cancelada') NOT NULL,
  `titulo`           VARCHAR(100)   NOT NULL,
  `mensaje`          VARCHAR(255)   NOT NULL,
  `id_referencia`    INT            NULL,
  `enlace`           VARCHAR(255)   NULL,
  `leido`            TINYINT(1)     NOT NULL DEFAULT 0,
  `fyh_creacion`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fyh_lectura`      DATETIME       NULL,
  PRIMARY KEY (`id_notificacion`),
  CONSTRAINT `fk_notificacion_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`) ON DELETE CASCADE,
  INDEX `idx_notif_cliente_leido`    (`id_cliente`, `leido`),
  INDEX `idx_notif_cliente_creacion` (`id_cliente`, `fyh_creacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
