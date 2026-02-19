/**
 * Tipos para el flujo de checkout
 * Incluye tipo de entrega, direcciones y métodos de pago
 */

export type TipoEntrega = 'envio' | 'retiro';

export interface CheckoutData {
  tipo_entrega: TipoEntrega;
  id_direccion?: number;  // Solo si es envío
  metodo_pago: 'efectivo' | 'qr' | 'tarjeta';
  observaciones?: string;
  moneda?: 'ARS' | 'USD';
}

export interface MetodoPago {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  disponible: boolean;
}

export interface DireccionEnvio {
  id_direccion: number;
  nombre_direccion: string;
  calle: string;
  numero: string;
  barrio: string;
  ciudad: string;
  provincia: string;
  piso?: string;
  departamento?: string;
  referencia?: string;
  telefono_contacto: string;
  es_predeterminada: boolean;
}

export interface LocalInfo {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  horario: string;
  referencia?: string;
  mapa_url?: string;
}
