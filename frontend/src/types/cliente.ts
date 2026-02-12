// ============================================================================
// TIPOS DE CLIENTE DE LA TIENDA WEB
// ============================================================================

/**
 * Interfaz para Clientes - Tabla tb_clientes
 * Representa a los usuarios finales de la tienda web
 */
export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  nitCi: string;
  celular: string;
  isWebEnabled: boolean;
  isEmailVerified: boolean;
  isGoogleAccount?: boolean;
  miembroDesde?: string; // fyh_creacion mapeado
  ultimoIngreso?: string; // last_login mapeado
  rol: 'cliente';
}

/**
 * Interfaz para Direcciones - Tabla tb_direcciones
 * Direcciones de envío y facturación del cliente
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
 * Interfaz para Favoritos - Tabla tb_favoritos
 * Productos marcados como favoritos por el cliente
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
