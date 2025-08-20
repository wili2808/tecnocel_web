/**
 * Tipos optimizados para el componente Button
 */

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

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconPosition = 'left' | 'right';

export interface ButtonProps {
  /** Contenido del botón */
  children: React.ReactNode;
  
  /** Variante visual */
  variant?: ButtonVariant;
  
  /** Tamaño del botón */
  size?: ButtonSize;
  
  /** Estados del botón */
  disabled?: boolean;
  loading?: boolean;
  
  /** Funcionalidad */
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  
  /** Enlaces */
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  
  /** Estilos */
  className?: string;
  fullWidth?: boolean;
  rounded?: boolean;
  elevated?: boolean;
  
  /** Iconos */
  icon?: string;
  iconPosition?: IconPosition;
  
  /** Responsive */
  mobileFullWidth?: boolean;
  hideOnMobile?: boolean;
  showOnMobile?: boolean;
  
  /** Accesibilidad */
  ariaLabel?: string;
}
