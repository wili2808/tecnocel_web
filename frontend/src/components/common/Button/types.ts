/**
 * Tipos y interfaces para el componente Button
 */

// ============================================================================
// TIPOS DE VARIANTES
// ============================================================================

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'ghost' 
  | 'outline' 
  | 'text' 
  | 'link' 
  | 'danger' 
  | 'success' 
  | 'warning';

// ============================================================================
// TIPOS DE TAMAÑOS
// ============================================================================

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ============================================================================
// TIPOS DE TARGET
// ============================================================================

export type ButtonTarget = '_blank' | '_self' | '_parent' | '_top';

// ============================================================================
// TIPOS DE POSICIÓN DE ICONO
// ============================================================================

export type IconPosition = 'left' | 'right';

// ============================================================================
// INTERFACE PRINCIPAL
// ============================================================================

export interface ButtonProps {
  /** Contenido del botón (texto, iconos, etc.) */
  children: React.ReactNode;
  
  /** Variante visual del botón */
  variant?: ButtonVariant;
  
  /** Tamaño del botón */
  size?: ButtonSize;
  
  /** Si el botón está deshabilitado */
  disabled?: boolean;
  
  /** Si el botón está en estado de carga */
  loading?: boolean;
  
  /** Tipo de botón HTML */
  type?: 'button' | 'submit' | 'reset';
  
  /** ID del formulario asociado */
  form?: string;
  
  /** Clases CSS adicionales */
  className?: string;
  
  /** Función que se ejecuta al hacer clic */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /** URL para botones de enlace */
  href?: string;
  
  /** Target para enlaces externos */
  target?: ButtonTarget;
  
  /** Rel para enlaces externos */
  rel?: string;
  
  /** Si el botón debe ocupar todo el ancho disponible */
  fullWidth?: boolean;
  
  /** Si el botón debe tener bordes redondeados */
  rounded?: boolean;
  
  /** Icono opcional (Material Design) */
  icon?: string;
  
  /** Posición del icono */
  iconPosition?: IconPosition;
  
  /** Si el botón debe tener efecto de elevación */
  elevated?: boolean;
  
  /** Si el botón debe tener efecto de glassmorphism */
  glass?: boolean;
}

// ============================================================================
// TIPOS DE REFERENCIA
// ============================================================================

export type ButtonRef = HTMLButtonElement | HTMLAnchorElement;
