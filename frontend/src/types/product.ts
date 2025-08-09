// ============================================================================
// TIPOS DE PRODUCTOS Y ENTIDADES PRINCIPALES
// ============================================================================

/**
 * Interfaz para Marcas - Tabla tb_marcas
 */
export interface Marca {
  id_marca: number;
  nombre_marca: string;
  logo_marca?: string | null;
  descripcion_marca?: string | null;
  activo: boolean;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Categorías - Tabla tb_categorias
 */
export interface Category {
  id_categoria: number;
  nombre_categoria: string;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Tipos de Características - Tabla tb_tipos_caracteristicas
 */
export interface TipoCaracteristica {
  id_tipo: number;
  nombre_tipo: string;
  descripcion?: string | null;
  tipo_dato: 'texto' | 'numero' | 'booleano' | 'seleccion';
  unidad_medida?: string | null;
  opciones_seleccion?: string[] | null;
  activo: boolean;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Características de Productos - Tabla tb_producto_caracteristicas
 */
export interface ProductoCaracteristica {
  id_caracteristica: number;
  id_producto: number;
  id_tipo: number;
  valor: string;
  fyh_creacion: string;
  fyh_actualizacion: string;
  tipo?: TipoCaracteristica;
}

/**
 * Interfaz para Ofertas - Tabla tb_ofertas
 */
export interface Oferta {
  id_oferta: number;
  nombre_oferta: string;
  descripcion?: string | null;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  precio_minimo?: number | null;
  precio_maximo?: number | null;
  limite_uso?: number | null;
  uso_actual: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Productos en Oferta - Tabla tb_productos_ofertas
 */
export interface ProductoOferta {
  id_producto_oferta: number;
  id_producto: number;
  id_oferta: number;
  precio_oferta: number;
  fyh_creacion: string;
}

/**
 * Interfaz para resumen de ofertas
 */
export interface OfertasResumen {
  total: number;
  activas: number;
  expiradas: number;
  productosEnOferta: number;
}

/**
 * Interfaz para oferta con productos incluidos
 */
export interface OfertaConProductos extends Oferta {
  productos?: Product[];
  productosCount?: number;
  isActive?: boolean;
  timeRemaining?: string;
}

/**
 * Interfaz para Imágenes de Productos - Tabla tb_producto_imagenes
 */
export interface ProductoImagen {
  id_imagen: number;
  id_producto: number;
  url_imagen: string;
  alt_text?: string | null;
  es_principal: boolean;
  orden: number;
  fyh_creacion: string;
}

/**
 * Interfaz para Imágenes transformadas por el backend
 */
export interface ImageData {
  url: string;
  alt_text?: string | null;
  es_principal: boolean;
  orden: number;
}

/**
 * Interfaz para Direcciones - Tabla tb_direcciones
 */
export interface Direccion {
  id_direccion: number;
  id_cliente: number;
  nombre_direccion: string;
  calle: string;
  numero: string;
  piso?: string | null;
  departamento?: string | null;
  barrio?: string | null;
  ciudad: string;
  provincia: string;
  codigo_postal?: string | null;
  pais: string;
  referencia?: string | null;
  es_predeterminada: boolean;
  es_facturacion: boolean;
  telefono_contacto?: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Clientes - Tabla tb_clientes
 */
export interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  apellido_cliente: string;
  nit_ci_cliente: string;
  celular_cliente: string;
  email_cliente: string;
  password_hash?: string | null;
  is_web_enabled: boolean;
  last_login?: string | null;
  email_verified: boolean;
  verification_token?: string | null;
  reset_token?: string | null;
  reset_token_expires?: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
  google_id?: string | null;
}

/**
 * Interfaz para Usuarios - Tabla tb_usuarios
 */
export interface Usuario {
  id_usuario: number;
  nombres: string;
  email: string;
  password_user: string;
  token: string;
  id_rol: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Roles - Tabla tb_roles
 */
export interface Rol {
  id_rol: number;
  rol: string;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Comentarios - Tabla tb_comentarios_productos
 */
export interface Comentario {
  id_comentario: number;
  id_producto: number;
  id_cliente: number;
  comentario: string;
  calificacion?: number | null;
  es_verificado: boolean;
  estado: 'activo' | 'oculto' | 'eliminado';
  respuesta_admin?: string | null;
  fecha_respuesta_admin?: string | null;
  id_admin_respuesta?: number | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
  cliente?: Cliente;
  imagenes?: ComentarioImagen[];
}

/**
 * Interfaz para Imágenes de Comentarios - Tabla tb_comentario_imagenes
 */
export interface ComentarioImagen {
  id_imagen: number;
  id_comentario: number;
  url_imagen: string;
  alt_text?: string | null;
  fyh_creacion: string;
}

/**
 * Interfaz para Favoritos - Tabla tb_favoritos
 */
export interface Favorito {
  id_favorito: number;
  id_cliente: number;
  id_producto: number;
  fyh_creacion: string;
  producto?: {
    id_producto: number;
    nombre: string;
    descripcion: string | null;
    precio_venta: string;
    imagen_url?: string | null;
    stock: number;
  };
}

// ============================================================================
// INTERFACES PRINCIPALES DE PRODUCTOS
// ============================================================================

/**
 * Interfaz completa del producto según el modelo tb_almacen
 */
export interface Product {
  // Campos principales
  id_producto: number;
  codigo: string;
  nombre: string;
  modelo?: string | null;
  descripcion: string | null;
  stock: number;
  stock_minimo?: number | null;
  stock_maximo?: number | null;
  precio_compra: string;
  precio_venta: string;
  fecha_ingreso: string;
  id_usuario: number;
  id_categoria: number;
  id_marca?: number | null;
  es_destacado: boolean;
  orden_destacado: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  
  // Relaciones incluidas en las consultas
  Categoria?: Category;
  Usuario?: Usuario;
  marca?: Marca;
  caracteristicas?: ProductoCaracteristica[];
  productosCaracteristicas?: ProductoCaracteristica[];
  ofertas?: Oferta[];
  imagenes?: ImageData[];
  
  // Campos calculados por el backend
  precio_original?: number;
  precio_oferta?: number;
  precio_final?: number;
  descuento_porcentaje?: number;
  en_oferta?: boolean;
  es_favorito?: boolean;
  
  // Campos de imagen (legacy)
  imagen?: string | null;
  imagen_url?: string | null;
  imagen_disponible?: boolean;
}

/**
 * Interfaz para las props del ProductCard (solo propiedades necesarias)
 */
export interface ProductCardProps {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  imagenes?: ImageData[];
  precio_venta: string;
  stock: number;
  className?: string;
  onClick?: () => void;
  
  // Props para ofertas
  precio_original?: number;
  precio_oferta?: number;
  descuento_porcentaje?: number;
  en_oferta?: boolean;
  ofertas?: Oferta[];
}

// ============================================================================
// INTERFACES PARA FILTROS Y BÚSQUEDA
// ============================================================================

/**
 * Interfaz para filtros de productos
 */
export interface ProductFilters {
  categoria?: number;
  marca?: number;
  busqueda?: string;
  precio_min?: number;
  precio_max?: number;
  solo_con_stock?: boolean;
  solo_ofertas?: boolean;
  caracteristicas?: { [key: string]: string };
  es_destacado?: boolean;
}

/**
 * Interfaz para respuesta de la API de productos
 */
export interface ProductsResponse {
  productos: Product[];
  total: number;
  pagina: number;
  por_pagina: number;
}

// ============================================================================
// INTERFACES PARA CARRITO
// ============================================================================

/**
 * Interfaz para Carrito Web - Tabla tb_carritosweb
 */
export interface CarritoWeb {
  id_carrito: number;
  id_cliente: number;
  estado: 'activo' | 'completado' | 'abandonado';
  total_carrito: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  fyh_abandono?: string | null;
}

/**
 * Interfaz para Items del Carrito Web - Tabla tb_carritoweb_items
 */
export interface CarritoWebItem {
  id_item: number;
  id_carrito: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  producto?: Product;
}

// ============================================================================
// INTERFACES PARA VENTAS
// ============================================================================

/**
 * Interfaz para Ventas - Tabla tb_ventas
 */
export interface Venta {
  id_venta: number;
  nro_venta: number;
  id_cliente: number;
  total_pagado: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  observaciones?: string | null;
  valor_dolar?: number | null;
  moneda?: string | null;
  id_carrito?: number | null;
  cliente?: Cliente;
}

/**
 * Interfaz para Carrito de Venta - Tabla tb_carrito
 */
export interface CarritoVenta {
  id_carrito: number;
  nro_venta: number;
  id_producto: number;
  cantidad: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  producto?: Product;
}

// ============================================================================
// INTERFACES PARA PRESUPUESTOS
// ============================================================================

/**
 * Interfaz para Presupuestos - Tabla tb_presupuestos
 */
export interface Presupuesto {
  id_presupuesto: number;
  nro_presupuesto?: number | null;
  id_cliente?: number | null;
  total_pagado?: number | null;
  fyh_creacion?: string | null;
  moneda?: string | null;
  valor_dolar?: number | null;
  observaciones?: string | null;
  estado?: string | null;
  cliente?: Cliente;
}

/**
 * Interfaz para Detalles de Presupuesto - Tabla tb_presupuesto_detalles
 */
export interface PresupuestoDetalle {
  id_detalle: number;
  nro_presupuesto?: number | null;
  id_producto?: number | null;
  cantidad?: number | null;
  fyh_creacion?: string | null;
  fyh_actualizacion?: string | null;
  producto?: Product;
}

// ============================================================================
// INTERFACES PARA DEVOLUCIONES
// ============================================================================

/**
 * Interfaz para Devoluciones - Tabla tb_devoluciones
 */
export interface Devolucion {
  id_devolucion: number;
  id_cliente: number;
  total_a_devolver: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  motivo_devolucion: string;
  estado_devolucion: string;
  tipo_devolucion: string;
  nro_venta?: string | null;
  cliente?: Cliente;
}

/**
 * Interfaz para Detalles de Devolución - Tabla tb_detalle_devoluciones
 */
export interface DetalleDevolucion {
  id_detalle: number;
  id_devolucion?: number | null;
  id_producto?: number | null;
  cantidad?: number | null;
  fyh_creacion?: string | null;
  fyh_actualizacion?: string | null;
  producto?: Product;
}

// ============================================================================
// INTERFACES PARA COMPRAS
// ============================================================================

/**
 * Interfaz para Compras - Tabla tb_compras
 */
export interface Compra {
  id_compra: number;
  nro_compra: number;
  fecha_compra: string;
  id_proveedor: number;
  comprobante: string;
  id_usuario: number;
  precio_total: string;
  fyh_creacion: string;
  fyh_actualizacion: string;
  usuario?: Usuario;
}

/**
 * Interfaz para Detalles de Compra - Tabla tb_detalle_compras
 */
export interface DetalleCompra {
  id_detalle_compra: number;
  nro_compra: number;
  id_producto: number;
  cantidad: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  producto?: Product;
}

// ============================================================================
// INTERFACES PARA PROVEEDORES
// ============================================================================

/**
 * Interfaz para Proveedores - Tabla tb_proveedores
 */
export interface Proveedor {
  id_proveedor: number;
  nombre_proveedor: string;
  celular: string;
  telefono?: string | null;
  empresa: string;
  email?: string | null;
  direccion: string;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

// ============================================================================
// TIPOS DE UTILIDAD
// ============================================================================

/**
 * Tipo para respuestas de API genéricas
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * Tipo para respuestas paginadas
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}

/**
 * Tipo para estadísticas
 */
export interface Estadisticas {
  total_productos: number;
  total_clientes: number;
  total_ventas: number;
  ventas_mes: number;
  productos_destacados: number;
  productos_oferta: number;
}

// ============================================================================
// TIPOS PARA AUTENTICACIÓN
// ============================================================================

/**
 * Tipo para datos de autenticación
 */
export interface AuthData {
  token: string;
  user: Cliente;
  expires_at: string;
}

/**
 * Tipo para login
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Tipo para registro
 */
export interface RegisterData {
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  celular_cliente: string;
  nit_ci_cliente: string;
  password: string;
  confirmPassword: string;
}

/**
 * Tipo para cambio de contraseña
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Tipo para recuperación de contraseña
 */
export interface ResetPasswordData {
  email: string;
}

/**
 * Tipo para nueva contraseña
 */
export interface NewPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}