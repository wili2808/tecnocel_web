/**
 * Componente MobileMenuDropdown - Menú desplegable mobile reutilizable
 * Proporciona una interfaz de dropdown touch-friendly para menús en pantallas pequeñas
 * Soporta iconos, labels, estados activos y animaciones suaves
 */

import React, { memo, useRef, useState, useEffect } from 'react';
import styles from './MobileMenuDropdown.module.css';

export interface MenuDropdownOption {
  id: string;
  label: string;
  icon?: string;
}

export interface MobileMenuDropdownProps {
  options: MenuDropdownOption[];
  activeOptionId: string;
  onSelect: (optionId: string) => void;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  /** Personalizador de clase CSS adicional para el trigger */
  triggerClassName?: string;
  /** Label personalizado para aria-label del trigger */
  triggerAriaLabel?: string;
  /** Mostrar icono en el trigger */
  showTriggerIcon?: boolean;
  /** Clase personalizada para el contenedor */
  containerClassName?: string;
}

/**
 * MobileMenuDropdown - Componente dropdown mobile reutilizable
 * Optimizado para pantallas pequeñas con animaciones suaves y accesibilidad
 *
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 * <MobileMenuDropdown
 *   options={MENU_OPTIONS}
 *   activeOptionId={activeSection}
 *   onSelect={(id) => {
 *     setActiveSection(id);
 *     setIsOpen(false);
 *   }}
 *   isOpen={isOpen}
 *   onToggle={setIsOpen}
 *   showTriggerIcon={true}
 * />
 */
const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = memo(
  ({
    options,
    activeOptionId,
    onSelect,
    isOpen,
    onToggle,
    triggerClassName,
    triggerAriaLabel = 'Abrir menú',
    showTriggerIcon = true,
    containerClassName,
  }) => {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });

    // Calcular la posición del dropdown cuando se abre
    useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4, // 4px debajo del trigger
          left: rect.left,
          width: rect.width,
        });
      }
    }, [isOpen]);

    const activeOption = options.find((o) => o.id === activeOptionId);

    const handleSelectOption = (optionId: string) => {
      onSelect(optionId);
      onToggle(false);
    };

    return (
      <div className={`${styles.mobileMenuContainer} ${containerClassName || ''}`}>
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          className={`${styles.mobileMenuTrigger} ${triggerClassName || ''}`}
          onClick={() => onToggle(!isOpen)}
          aria-expanded={isOpen}
          aria-label={triggerAriaLabel}
          aria-haspopup="listbox"
        >
          {showTriggerIcon && activeOption?.icon && (
            <span className={`material-icons ${styles.triggerIcon}`}>{activeOption.icon}</span>
          )}
          <span className={styles.triggerLabel}>{activeOption?.label || 'Selecciona una opción'}</span>
          <span
            className={`material-icons ${styles.mobileMenuChevron} ${isOpen ? styles.mobileMenuChevronOpen : ''}`}
            aria-hidden="true"
          >
            expand_more
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={styles.mobileMenuDropdown}
            role="listbox"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {options.map((option) => (
              <button
                key={option.id}
                className={`${styles.mobileMenuItem} ${
                  option.id === activeOptionId ? styles.mobileMenuItemActive : ''
                }`}
                onClick={() => handleSelectOption(option.id)}
                role="option"
                aria-selected={option.id === activeOptionId}
              >
                {option.icon && <span className={`material-icons ${styles.optionIcon}`}>{option.icon}</span>}
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MobileMenuDropdown.displayName = 'MobileMenuDropdown';

export default MobileMenuDropdown;
