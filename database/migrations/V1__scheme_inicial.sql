-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-03-2026 a las 13:23:00
-- Versión del servidor: 10.4.27-MariaDB
-- Versión de PHP: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `db_tecnocel_v4`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_almacen`
--

CREATE TABLE `tb_almacen` (
  `id_producto` int(11) NOT NULL,
  `codigo` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `modelo` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `stock_minimo` int(11) DEFAULT NULL,
  `stock_maximo` int(11) DEFAULT NULL,
  `precio_compra` varchar(255) NOT NULL,
  `precio_venta` varchar(255) NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL,
  `id_marca` int(11) DEFAULT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  `es_destacado` tinyint(1) DEFAULT 0,
  `orden_destacado` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_cancelaciones`
--

CREATE TABLE `tb_cancelaciones` (
  `id_cancelacion` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL COMMENT 'Usuario del sistema que realizó la cancelación',
  `motivo` text DEFAULT NULL,
  `fyh_cancelacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_carrito`
--

CREATE TABLE `tb_carrito` (
  `id_carrito` int(11) NOT NULL,
  `nro_venta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_carritosweb`
--

CREATE TABLE `tb_carritosweb` (
  `id_carrito` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `estado` enum('activo','completado','abandonado') DEFAULT 'activo',
  `total_carrito` decimal(10,2) DEFAULT 0.00,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  `fyh_abandono` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_carritoweb_items`
--

CREATE TABLE `tb_carritoweb_items` (
  `id_item` int(11) NOT NULL,
  `id_carrito` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  `precio_base_original` decimal(10,2) NOT NULL COMMENT 'Precio de catalogo SIN descuento al momento de agregar al carrito',
  `precio_con_oferta_original` decimal(10,2) DEFAULT NULL COMMENT 'Precio CON oferta aplicada al momento de agregar (NULL si no habia oferta)',
  `descuento_porcentaje_original` decimal(5,2) DEFAULT NULL COMMENT 'Porcentaje de descuento que se aplico originalmente',
  `id_oferta_aplicada` int(11) DEFAULT NULL COMMENT 'FK a la oferta que se uso (NULL si no hubo oferta)',
  `precio_es_manual` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'TRUE si fue un precio personalizado manualmente',
  `fyh_precio_validado` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Ultima vez que se valido/verifico el precio contra el catalogo actual',
  `precio_ha_cambiado` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'TRUE si el precio actual del producto difiere del original'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_categorias`
--

CREATE TABLE `tb_categorias` (
  `id_categoria` int(11) NOT NULL,
  `nombre_categoria` varchar(255) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_clientes`
--

CREATE TABLE `tb_clientes` (
  `id_cliente` int(11) NOT NULL,
  `nombre_cliente` varchar(255) NOT NULL,
  `apellido_cliente` varchar(255) NOT NULL DEFAULT '',
  `nit_ci_cliente` varchar(255) NOT NULL,
  `celular_cliente` varchar(50) NOT NULL,
  `email_cliente` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `is_web_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  `google_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_comentarios_productos`
--

CREATE TABLE `tb_comentarios_productos` (
  `id_comentario` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `comentario` text NOT NULL,
  `calificacion` tinyint(4) DEFAULT NULL,
  `es_verificado` tinyint(1) NOT NULL DEFAULT 0,
  `estado` enum('activo','oculto','eliminado') NOT NULL DEFAULT 'activo',
  `respuesta_admin` text DEFAULT NULL,
  `fecha_respuesta_admin` datetime DEFAULT NULL,
  `id_admin_respuesta` int(11) DEFAULT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_comentario_imagenes`
--

CREATE TABLE `tb_comentario_imagenes` (
  `id_imagen` int(11) NOT NULL,
  `id_comentario` int(11) NOT NULL,
  `url_imagen` text NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `fyh_creacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_comentario_respuestas`
--

CREATE TABLE `tb_comentario_respuestas` (
  `id_respuesta` int(11) NOT NULL,
  `id_comentario` int(11) NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `tipo_autor` enum('cliente','admin') NOT NULL,
  `contenido` text NOT NULL,
  `estado` enum('activo','oculto','eliminado') NOT NULL DEFAULT 'activo',
  `fyh_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fyh_actualizacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_compras`
--

CREATE TABLE `tb_compras` (
  `id_compra` int(11) NOT NULL,
  `nro_compra` int(11) NOT NULL,
  `fecha_compra` date NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `comprobante` varchar(255) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `precio_total` varchar(50) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_configuracion`
--

CREATE TABLE `tb_configuracion` (
  `clave` varchar(100) NOT NULL,
  `valor` varchar(500) NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_detalle_compras`
--

CREATE TABLE `tb_detalle_compras` (
  `id_detalle_compra` int(11) NOT NULL,
  `nro_compra` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `fyh_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fyh_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_detalle_devoluciones`
--

CREATE TABLE `tb_detalle_devoluciones` (
  `id_detalle` int(11) NOT NULL,
  `id_devolucion` int(11) DEFAULT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `fyh_creacion` datetime DEFAULT NULL,
  `fyh_actualizacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_devoluciones`
--

CREATE TABLE `tb_devoluciones` (
  `id_devolucion` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `total_a_devolver` decimal(10,2) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  `motivo_devolucion` varchar(255) NOT NULL,
  `estado_devolucion` varchar(50) NOT NULL,
  `tipo_devolucion` varchar(50) NOT NULL,
  `nro_venta` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_direcciones`
--

CREATE TABLE `tb_direcciones` (
  `id_direccion` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `nombre_direccion` varchar(100) NOT NULL,
  `calle` varchar(255) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `piso` varchar(10) DEFAULT NULL,
  `departamento` varchar(10) DEFAULT NULL,
  `barrio` varchar(100) DEFAULT NULL,
  `ciudad` varchar(100) NOT NULL,
  `provincia` varchar(100) NOT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `pais` varchar(100) DEFAULT 'Argentina',
  `referencia` text DEFAULT NULL,
  `es_predeterminada` tinyint(1) DEFAULT 0,
  `es_facturacion` tinyint(1) DEFAULT 0,
  `telefono_contacto` varchar(50) DEFAULT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_envios`
--

CREATE TABLE `tb_envios` (
  `id_envio` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL COMMENT 'Una venta → un registro logístico',
  `tipo_entrega` enum('envio','retiro_en_tienda') NOT NULL DEFAULT 'retiro_en_tienda',
  `id_direccion` int(11) DEFAULT NULL COMMENT 'NULL si es retiro en tienda',
  `envio_nombre_direccion` varchar(100) DEFAULT NULL,
  `envio_calle` varchar(255) DEFAULT NULL,
  `envio_numero` varchar(20) DEFAULT NULL,
  `envio_piso` varchar(10) DEFAULT NULL,
  `envio_departamento` varchar(10) DEFAULT NULL,
  `envio_barrio` varchar(100) DEFAULT NULL,
  `envio_ciudad` varchar(100) DEFAULT NULL,
  `envio_provincia` varchar(100) DEFAULT NULL,
  `envio_codigo_postal` varchar(20) DEFAULT NULL,
  `envio_pais` varchar(100) DEFAULT NULL,
  `envio_referencia` text DEFAULT NULL,
  `envio_telefono_contacto` varchar(50) DEFAULT NULL,
  `estado_envio` enum('pendiente','en_preparacion','en_camino','entregado','no_aplica') NOT NULL DEFAULT 'pendiente',
  `fecha_despacho` datetime DEFAULT NULL COMMENT 'Cuándo fue despachado',
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_favoritos`
--

CREATE TABLE `tb_favoritos` (
  `id_favorito` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `fyh_creacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_marcas`
--

CREATE TABLE `tb_marcas` (
  `id_marca` int(11) NOT NULL,
  `nombre_marca` varchar(100) NOT NULL,
  `logo_marca` text DEFAULT NULL,
  `descripcion_marca` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_ofertas`
--

CREATE TABLE `tb_ofertas` (
  `id_oferta` int(11) NOT NULL,
  `nombre_oferta` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo_descuento` enum('porcentaje','monto_fijo') NOT NULL,
  `valor_descuento` decimal(10,2) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `precio_minimo` decimal(10,2) DEFAULT NULL,
  `precio_maximo` decimal(10,2) DEFAULT NULL,
  `limite_uso` int(11) DEFAULT NULL,
  `uso_actual` int(11) DEFAULT 0,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_presupuestos`
--

CREATE TABLE `tb_presupuestos` (
  `id_presupuesto` int(11) NOT NULL,
  `nro_presupuesto` int(11) DEFAULT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `total_pagado` decimal(10,2) DEFAULT NULL,
  `fyh_creacion` datetime DEFAULT NULL,
  `moneda` varchar(50) DEFAULT NULL,
  `valor_dolar` decimal(10,2) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_presupuesto_detalles`
--

CREATE TABLE `tb_presupuesto_detalles` (
  `id_detalle` int(11) NOT NULL,
  `nro_presupuesto` int(11) DEFAULT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `fyh_creacion` datetime DEFAULT NULL,
  `fyh_actualizacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_productos_ofertas`
--

CREATE TABLE `tb_productos_ofertas` (
  `id_producto_oferta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_oferta` int(11) NOT NULL,
  `precio_oferta` decimal(10,2) DEFAULT NULL COMMENT 'Precio con oferta aplicada. NULL = calcular din├ímicamente, valor = precio personalizado',
  `fyh_creacion` datetime NOT NULL,
  `es_precio_personalizado` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el precio_oferta es personalizado (true) o debe calcularse din├ímicamente (false)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_producto_caracteristicas`
--

CREATE TABLE `tb_producto_caracteristicas` (
  `id_caracteristica` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_tipo` int(11) NOT NULL,
  `valor` text NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_producto_imagenes`
--

CREATE TABLE `tb_producto_imagenes` (
  `id_imagen` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `url_imagen` text NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `es_principal` tinyint(1) DEFAULT 0,
  `orden` int(11) DEFAULT 0,
  `fyh_creacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_proveedores`
--

CREATE TABLE `tb_proveedores` (
  `id_proveedor` int(11) NOT NULL,
  `nombre_proveedor` varchar(255) NOT NULL,
  `celular` varchar(50) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `empresa` varchar(255) NOT NULL,
  `email` varchar(50) DEFAULT NULL,
  `direccion` varchar(255) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_roles`
--

CREATE TABLE `tb_roles` (
  `id_rol` int(11) NOT NULL,
  `rol` varchar(255) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_tipos_caracteristicas`
--

CREATE TABLE `tb_tipos_caracteristicas` (
  `id_tipo` int(11) NOT NULL,
  `nombre_tipo` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo_dato` enum('texto','numero','booleano','seleccion') DEFAULT 'texto',
  `unidad_medida` varchar(20) DEFAULT NULL,
  `opciones_seleccion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`opciones_seleccion`)),
  `activo` tinyint(1) DEFAULT 1,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_usuarios`
--

CREATE TABLE `tb_usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombres` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_user` text NOT NULL,
  `token` varchar(100) NOT NULL,
  `fyh_ultimo_login` datetime DEFAULT NULL,
  `id_rol` int(11) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_ventas`
--

CREATE TABLE `tb_ventas` (
  `id_venta` int(11) NOT NULL,
  `nro_venta` int(11) NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `total_pagado` int(11) NOT NULL,
  `fyh_creacion` datetime NOT NULL,
  `fyh_actualizacion` datetime NOT NULL,
  `observaciones` text DEFAULT NULL,
  `valor_dolar` decimal(10,2) DEFAULT NULL,
  `moneda` varchar(15) DEFAULT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia','qr') DEFAULT NULL,
  `tipo_venta` enum('web','manual') NOT NULL DEFAULT 'web',
  `estado` enum('completada','cancelada','pendiente') NOT NULL DEFAULT 'completada',
  `estado_reembolso` enum('sin_reembolso','pendiente','procesado','rechazado') DEFAULT NULL,
  `id_vendedor` int(11) DEFAULT NULL,
  `id_carrito_web` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tb_venta_items`
--

CREATE TABLE `tb_venta_items` (
  `id_item` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `fyh_creacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `tb_almacen`
--
ALTER TABLE `tb_almacen`
  ADD PRIMARY KEY (`id_producto`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_categoria` (`id_categoria`),
  ADD KEY `fk_almacen_marca` (`id_marca`),
  ADD KEY `idx_almacen_destacado` (`es_destacado`,`orden_destacado`);

--
-- Indices de la tabla `tb_cancelaciones`
--
ALTER TABLE `tb_cancelaciones`
  ADD PRIMARY KEY (`id_cancelacion`),
  ADD KEY `id_venta` (`id_venta`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `tb_carrito`
--
ALTER TABLE `tb_carrito`
  ADD PRIMARY KEY (`id_carrito`),
  ADD KEY `id_venta` (`nro_venta`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indices de la tabla `tb_carritosweb`
--
ALTER TABLE `tb_carritosweb`
  ADD PRIMARY KEY (`id_carrito`),
  ADD KEY `idx_cliente_estado` (`id_cliente`,`estado`);

--
-- Indices de la tabla `tb_carritoweb_items`
--
ALTER TABLE `tb_carritoweb_items`
  ADD PRIMARY KEY (`id_item`),
  ADD UNIQUE KEY `unique_carrito_producto` (`id_carrito`,`id_producto`),
  ADD UNIQUE KEY `tb_carritoweb_items_id_carrito_id_producto` (`id_carrito`,`id_producto`),
  ADD KEY `id_producto` (`id_producto`),
  ADD KEY `idx_carritoweb_items_oferta` (`id_oferta_aplicada`) COMMENT 'Indice para busquedas por oferta aplicada',
  ADD KEY `idx_carritoweb_items_fyh_validado` (`fyh_precio_validado`) COMMENT 'Indice para analisis temporal de validaciones de precio',
  ADD KEY `idx_carritoweb_items_ha_cambiado` (`precio_ha_cambiado`) COMMENT 'Indice para filtrar items con cambio de precio';

--
-- Indices de la tabla `tb_categorias`
--
ALTER TABLE `tb_categorias`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Indices de la tabla `tb_clientes`
--
ALTER TABLE `tb_clientes`
  ADD PRIMARY KEY (`id_cliente`),
  ADD UNIQUE KEY `idx_google_id` (`google_id`),
  ADD KEY `idx_email_web` (`email_cliente`,`is_web_enabled`),
  ADD KEY `idx_verification_token` (`verification_token`),
  ADD KEY `idx_reset_token` (`reset_token`);

--
-- Indices de la tabla `tb_comentarios_productos`
--
ALTER TABLE `tb_comentarios_productos`
  ADD PRIMARY KEY (`id_comentario`),
  ADD KEY `id_admin_respuesta` (`id_admin_respuesta`),
  ADD KEY `tb_comentarios_productos_id_producto` (`id_producto`),
  ADD KEY `tb_comentarios_productos_id_cliente` (`id_cliente`),
  ADD KEY `tb_comentarios_productos_estado` (`estado`),
  ADD KEY `tb_comentarios_productos_calificacion` (`calificacion`),
  ADD KEY `tb_comentarios_productos_fyh_creacion` (`fyh_creacion`),
  ADD KEY `tb_comentarios_productos_id_producto_estado_fyh_creacion` (`id_producto`,`estado`,`fyh_creacion`);

--
-- Indices de la tabla `tb_comentario_imagenes`
--
ALTER TABLE `tb_comentario_imagenes`
  ADD PRIMARY KEY (`id_imagen`),
  ADD KEY `idx_id_comentario` (`id_comentario`),
  ADD KEY `idx_comentario_principal_orden` (`id_comentario`),
  ADD KEY `tb_comentario_imagenes_id_comentario` (`id_comentario`),
  ADD KEY `tb_comentario_imagenes_id_comentario_es_principal_orden` (`id_comentario`);

--
-- Indices de la tabla `tb_comentario_respuestas`
--
ALTER TABLE `tb_comentario_respuestas`
  ADD PRIMARY KEY (`id_respuesta`),
  ADD KEY `idx_comentario` (`id_comentario`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `tb_compras`
--
ALTER TABLE `tb_compras`
  ADD PRIMARY KEY (`id_compra`),
  ADD KEY `id_proveedor` (`id_proveedor`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `nro_compra` (`nro_compra`) USING BTREE;

--
-- Indices de la tabla `tb_configuracion`
--
ALTER TABLE `tb_configuracion`
  ADD PRIMARY KEY (`clave`);

--
-- Indices de la tabla `tb_detalle_compras`
--
ALTER TABLE `tb_detalle_compras`
  ADD PRIMARY KEY (`id_detalle_compra`),
  ADD KEY `nro_compra` (`nro_compra`),
  ADD KEY `tb_detalle_compras_ibfk_2` (`id_producto`);

--
-- Indices de la tabla `tb_detalle_devoluciones`
--
ALTER TABLE `tb_detalle_devoluciones`
  ADD PRIMARY KEY (`id_detalle`),
  ADD UNIQUE KEY `id_devolucion` (`id_devolucion`),
  ADD KEY `tb_detalle_devoluciones_ibfk_1` (`id_producto`);

--
-- Indices de la tabla `tb_devoluciones`
--
ALTER TABLE `tb_devoluciones`
  ADD PRIMARY KEY (`id_devolucion`),
  ADD KEY `id_cliente` (`id_cliente`);

--
-- Indices de la tabla `tb_direcciones`
--
ALTER TABLE `tb_direcciones`
  ADD PRIMARY KEY (`id_direccion`),
  ADD KEY `idx_cliente` (`id_cliente`),
  ADD KEY `idx_predeterminada` (`es_predeterminada`);

--
-- Indices de la tabla `tb_envios`
--
ALTER TABLE `tb_envios`
  ADD PRIMARY KEY (`id_envio`),
  ADD UNIQUE KEY `id_venta` (`id_venta`),
  ADD KEY `fk_envio_direccion` (`id_direccion`);

--
-- Indices de la tabla `tb_favoritos`
--
ALTER TABLE `tb_favoritos`
  ADD PRIMARY KEY (`id_favorito`),
  ADD UNIQUE KEY `cliente_producto_unique` (`id_cliente`,`id_producto`),
  ADD UNIQUE KEY `tb_favoritos_id_cliente_id_producto` (`id_cliente`,`id_producto`),
  ADD KEY `idx_cliente` (`id_cliente`),
  ADD KEY `idx_producto` (`id_producto`);

--
-- Indices de la tabla `tb_marcas`
--
ALTER TABLE `tb_marcas`
  ADD PRIMARY KEY (`id_marca`),
  ADD UNIQUE KEY `nombre_marca_unique` (`nombre_marca`);

--
-- Indices de la tabla `tb_ofertas`
--
ALTER TABLE `tb_ofertas`
  ADD PRIMARY KEY (`id_oferta`),
  ADD KEY `idx_fechas` (`fecha_inicio`,`fecha_fin`),
  ADD KEY `idx_activo` (`activo`);

--
-- Indices de la tabla `tb_presupuestos`
--
ALTER TABLE `tb_presupuestos`
  ADD PRIMARY KEY (`id_presupuesto`),
  ADD UNIQUE KEY `id_presupuesto` (`nro_presupuesto`) USING BTREE,
  ADD KEY `tb_presupuestos_ibfk_1` (`id_cliente`);

--
-- Indices de la tabla `tb_presupuesto_detalles`
--
ALTER TABLE `tb_presupuesto_detalles`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `nro_presupuesto` (`nro_presupuesto`),
  ADD KEY `tb_presupuesto_detalles_ibfk_2` (`id_producto`);

--
-- Indices de la tabla `tb_productos_ofertas`
--
ALTER TABLE `tb_productos_ofertas`
  ADD PRIMARY KEY (`id_producto_oferta`),
  ADD UNIQUE KEY `producto_oferta_unique` (`id_producto`,`id_oferta`),
  ADD UNIQUE KEY `tb_productos_ofertas_id_producto_id_oferta` (`id_producto`,`id_oferta`),
  ADD KEY `idx_producto` (`id_producto`),
  ADD KEY `idx_oferta` (`id_oferta`);

--
-- Indices de la tabla `tb_producto_caracteristicas`
--
ALTER TABLE `tb_producto_caracteristicas`
  ADD PRIMARY KEY (`id_caracteristica`),
  ADD UNIQUE KEY `producto_tipo_unique` (`id_producto`,`id_tipo`),
  ADD UNIQUE KEY `tb_producto_caracteristicas_id_producto_id_tipo` (`id_producto`,`id_tipo`),
  ADD KEY `idx_producto` (`id_producto`),
  ADD KEY `idx_tipo` (`id_tipo`);

--
-- Indices de la tabla `tb_producto_imagenes`
--
ALTER TABLE `tb_producto_imagenes`
  ADD PRIMARY KEY (`id_imagen`),
  ADD KEY `idx_producto` (`id_producto`),
  ADD KEY `idx_principal` (`es_principal`),
  ADD KEY `idx_orden` (`orden`);

--
-- Indices de la tabla `tb_proveedores`
--
ALTER TABLE `tb_proveedores`
  ADD PRIMARY KEY (`id_proveedor`);

--
-- Indices de la tabla `tb_roles`
--
ALTER TABLE `tb_roles`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `tb_tipos_caracteristicas`
--
ALTER TABLE `tb_tipos_caracteristicas`
  ADD PRIMARY KEY (`id_tipo`),
  ADD UNIQUE KEY `nombre_tipo_unique` (`nombre_tipo`);

--
-- Indices de la tabla `tb_usuarios`
--
ALTER TABLE `tb_usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD KEY `id_rol` (`id_rol`);

--
-- Indices de la tabla `tb_ventas`
--
ALTER TABLE `tb_ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `nro_venta` (`nro_venta`),
  ADD KEY `id_carrito` (`id_carrito_web`),
  ADD KEY `fk_venta_vendedor` (`id_vendedor`);

--
-- Indices de la tabla `tb_venta_items`
--
ALTER TABLE `tb_venta_items`
  ADD PRIMARY KEY (`id_item`),
  ADD KEY `fk_venta_item_venta` (`id_venta`),
  ADD KEY `fk_venta_item_producto` (`id_producto`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `tb_almacen`
--
ALTER TABLE `tb_almacen`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_cancelaciones`
--
ALTER TABLE `tb_cancelaciones`
  MODIFY `id_cancelacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_carrito`
--
ALTER TABLE `tb_carrito`
  MODIFY `id_carrito` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_carritosweb`
--
ALTER TABLE `tb_carritosweb`
  MODIFY `id_carrito` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_carritoweb_items`
--
ALTER TABLE `tb_carritoweb_items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_categorias`
--
ALTER TABLE `tb_categorias`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_clientes`
--
ALTER TABLE `tb_clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_comentarios_productos`
--
ALTER TABLE `tb_comentarios_productos`
  MODIFY `id_comentario` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_comentario_imagenes`
--
ALTER TABLE `tb_comentario_imagenes`
  MODIFY `id_imagen` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_comentario_respuestas`
--
ALTER TABLE `tb_comentario_respuestas`
  MODIFY `id_respuesta` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_compras`
--
ALTER TABLE `tb_compras`
  MODIFY `id_compra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_detalle_compras`
--
ALTER TABLE `tb_detalle_compras`
  MODIFY `id_detalle_compra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_detalle_devoluciones`
--
ALTER TABLE `tb_detalle_devoluciones`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_devoluciones`
--
ALTER TABLE `tb_devoluciones`
  MODIFY `id_devolucion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_direcciones`
--
ALTER TABLE `tb_direcciones`
  MODIFY `id_direccion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_envios`
--
ALTER TABLE `tb_envios`
  MODIFY `id_envio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_favoritos`
--
ALTER TABLE `tb_favoritos`
  MODIFY `id_favorito` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_marcas`
--
ALTER TABLE `tb_marcas`
  MODIFY `id_marca` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_ofertas`
--
ALTER TABLE `tb_ofertas`
  MODIFY `id_oferta` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_presupuestos`
--
ALTER TABLE `tb_presupuestos`
  MODIFY `id_presupuesto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_presupuesto_detalles`
--
ALTER TABLE `tb_presupuesto_detalles`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_productos_ofertas`
--
ALTER TABLE `tb_productos_ofertas`
  MODIFY `id_producto_oferta` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_producto_caracteristicas`
--
ALTER TABLE `tb_producto_caracteristicas`
  MODIFY `id_caracteristica` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_producto_imagenes`
--
ALTER TABLE `tb_producto_imagenes`
  MODIFY `id_imagen` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_proveedores`
--
ALTER TABLE `tb_proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_roles`
--
ALTER TABLE `tb_roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_tipos_caracteristicas`
--
ALTER TABLE `tb_tipos_caracteristicas`
  MODIFY `id_tipo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_usuarios`
--
ALTER TABLE `tb_usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_ventas`
--
ALTER TABLE `tb_ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tb_venta_items`
--
ALTER TABLE `tb_venta_items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `tb_almacen`
--
ALTER TABLE `tb_almacen`
  ADD CONSTRAINT `fk_almacen_marca` FOREIGN KEY (`id_marca`) REFERENCES `tb_marcas` (`id_marca`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tb_almacen_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `tb_categorias` (`id_categoria`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tb_almacen_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `tb_usuarios` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `tb_cancelaciones`
--
ALTER TABLE `tb_cancelaciones`
  ADD CONSTRAINT `tb_cancelaciones_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `tb_ventas` (`id_venta`),
  ADD CONSTRAINT `tb_cancelaciones_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `tb_usuarios` (`id_usuario`);

--
-- Filtros para la tabla `tb_carrito`
--
ALTER TABLE `tb_carrito`
  ADD CONSTRAINT `tb_carrito_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`);

--
-- Filtros para la tabla `tb_carritosweb`
--
ALTER TABLE `tb_carritosweb`
  ADD CONSTRAINT `tb_carritosweb_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`);

--
-- Filtros para la tabla `tb_carritoweb_items`
--
ALTER TABLE `tb_carritoweb_items`
  ADD CONSTRAINT `fk_carritoweb_items_oferta` FOREIGN KEY (`id_oferta_aplicada`) REFERENCES `tb_ofertas` (`id_oferta`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tb_carritoweb_items_ibfk_1` FOREIGN KEY (`id_carrito`) REFERENCES `tb_carritosweb` (`id_carrito`) ON DELETE CASCADE,
  ADD CONSTRAINT `tb_carritoweb_items_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`);

--
-- Filtros para la tabla `tb_comentarios_productos`
--
ALTER TABLE `tb_comentarios_productos`
  ADD CONSTRAINT `tb_comentarios_productos_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tb_comentarios_productos_ibfk_2` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tb_comentarios_productos_ibfk_3` FOREIGN KEY (`id_admin_respuesta`) REFERENCES `tb_usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `tb_comentario_imagenes`
--
ALTER TABLE `tb_comentario_imagenes`
  ADD CONSTRAINT `tb_comentario_imagenes_ibfk_1` FOREIGN KEY (`id_comentario`) REFERENCES `tb_comentarios_productos` (`id_comentario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tb_comentario_respuestas`
--
ALTER TABLE `tb_comentario_respuestas`
  ADD CONSTRAINT `tb_comentario_respuestas_ibfk_1` FOREIGN KEY (`id_comentario`) REFERENCES `tb_comentarios_productos` (`id_comentario`),
  ADD CONSTRAINT `tb_comentario_respuestas_ibfk_2` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`),
  ADD CONSTRAINT `tb_comentario_respuestas_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `tb_usuarios` (`id_usuario`);

--
-- Filtros para la tabla `tb_compras`
--
ALTER TABLE `tb_compras`
  ADD CONSTRAINT `tb_compras_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `tb_usuarios` (`id_usuario`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tb_compras_ibfk_4` FOREIGN KEY (`id_proveedor`) REFERENCES `tb_proveedores` (`id_proveedor`),
  ADD CONSTRAINT `tb_compras_ibfk_5` FOREIGN KEY (`nro_compra`) REFERENCES `tb_detalle_compras` (`nro_compra`);

--
-- Filtros para la tabla `tb_detalle_compras`
--
ALTER TABLE `tb_detalle_compras`
  ADD CONSTRAINT `tb_detalle_compras_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`);

--
-- Filtros para la tabla `tb_detalle_devoluciones`
--
ALTER TABLE `tb_detalle_devoluciones`
  ADD CONSTRAINT `tb_detalle_devoluciones_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`);

--
-- Filtros para la tabla `tb_devoluciones`
--
ALTER TABLE `tb_devoluciones`
  ADD CONSTRAINT `tb_devoluciones_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`),
  ADD CONSTRAINT `tb_devoluciones_ibfk_2` FOREIGN KEY (`id_devolucion`) REFERENCES `tb_detalle_devoluciones` (`id_devolucion`);

--
-- Filtros para la tabla `tb_direcciones`
--
ALTER TABLE `tb_direcciones`
  ADD CONSTRAINT `tb_direcciones_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tb_envios`
--
ALTER TABLE `tb_envios`
  ADD CONSTRAINT `fk_envio_direccion` FOREIGN KEY (`id_direccion`) REFERENCES `tb_direcciones` (`id_direccion`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_envio_venta` FOREIGN KEY (`id_venta`) REFERENCES `tb_ventas` (`id_venta`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tb_favoritos`
--
ALTER TABLE `tb_favoritos`
  ADD CONSTRAINT `tb_favoritos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`) ON DELETE CASCADE,
  ADD CONSTRAINT `tb_favoritos_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tb_presupuestos`
--
ALTER TABLE `tb_presupuestos`
  ADD CONSTRAINT `tb_presupuestos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`),
  ADD CONSTRAINT `tb_presupuestos_ibfk_2` FOREIGN KEY (`nro_presupuesto`) REFERENCES `tb_presupuesto_detalles` (`nro_presupuesto`);

--
-- Filtros para la tabla `tb_presupuesto_detalles`
--
ALTER TABLE `tb_presupuesto_detalles`
  ADD CONSTRAINT `tb_presupuesto_detalles_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`);

--
-- Filtros para la tabla `tb_productos_ofertas`
--
ALTER TABLE `tb_productos_ofertas`
  ADD CONSTRAINT `tb_productos_ofertas_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE,
  ADD CONSTRAINT `tb_productos_ofertas_ibfk_2` FOREIGN KEY (`id_oferta`) REFERENCES `tb_ofertas` (`id_oferta`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tb_producto_caracteristicas`
--
ALTER TABLE `tb_producto_caracteristicas`
  ADD CONSTRAINT `tb_producto_caracteristicas_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE,
  ADD CONSTRAINT `tb_producto_caracteristicas_ibfk_2` FOREIGN KEY (`id_tipo`) REFERENCES `tb_tipos_caracteristicas` (`id_tipo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tb_producto_imagenes`
--
ALTER TABLE `tb_producto_imagenes`
  ADD CONSTRAINT `tb_producto_imagenes_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tb_usuarios`
--
ALTER TABLE `tb_usuarios`
  ADD CONSTRAINT `tb_usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `tb_roles` (`id_rol`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `tb_ventas`
--
ALTER TABLE `tb_ventas`
  ADD CONSTRAINT `fk_venta_carrito_web` FOREIGN KEY (`id_carrito_web`) REFERENCES `tb_carritosweb` (`id_carrito`),
  ADD CONSTRAINT `fk_venta_vendedor` FOREIGN KEY (`id_vendedor`) REFERENCES `tb_usuarios` (`id_usuario`),
  ADD CONSTRAINT `tb_ventas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`);

--
-- Filtros para la tabla `tb_venta_items`
--
ALTER TABLE `tb_venta_items`
  ADD CONSTRAINT `fk_venta_item_producto` FOREIGN KEY (`id_producto`) REFERENCES `tb_almacen` (`id_producto`),
  ADD CONSTRAINT `fk_venta_item_venta` FOREIGN KEY (`id_venta`) REFERENCES `tb_ventas` (`id_venta`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
