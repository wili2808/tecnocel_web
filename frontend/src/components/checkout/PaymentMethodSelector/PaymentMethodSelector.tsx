/**
 * Componente para seleccionar método de pago (simulado)
 * Los métodos reales se implementarán cuando se defina la pasarela
 */
import { memo } from 'react';
import type { MetodoPago } from '../../../types/checkout';
import styles from './PaymentMethodSelector.module.css';

interface PaymentMethodSelectorProps {
  selectedMetodo: string | null;
  onSelectMetodo: (metodo: string) => void;
  error?: string;
}

const METODOS_PAGO: MetodoPago[] = [
  {
    id: 'efectivo',
    nombre: 'Pago contra entrega',
    descripcion: 'Paga en efectivo cuando recibas tu pedido',
    icono: 'payments',
    disponible: true
  },
  {
    id: 'qr',
    nombre: 'QR Simple/Tigo Money',
    descripcion: 'Paga con código QR (próximamente)',
    icono: 'qr_code_2',
    disponible: false
  },
  {
    id: 'tarjeta',
    nombre: 'Tarjeta de crédito/débito',
    descripcion: 'Paga con tarjeta (próximamente)',
    icono: 'credit_card',
    disponible: false
  }
];

export const PaymentMethodSelector = memo<PaymentMethodSelectorProps>(({
  selectedMetodo,
  onSelectMetodo,
  error
}) => {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <span className="material-icons">payment</span>
        Método de Pago
      </h3>

      <div className={styles.methodList}>
        {METODOS_PAGO.map((metodo) => (
          <label
            key={metodo.id}
            className={`${styles.methodCard} ${
              !metodo.disponible ? styles.disabled : ''
            } ${selectedMetodo === metodo.id ? styles.selected : ''}`}
          >
            <input
              type="radio"
              name="metodo_pago"
              value={metodo.id}
              checked={selectedMetodo === metodo.id}
              onChange={() => onSelectMetodo(metodo.id)}
              disabled={!metodo.disponible}
              className={styles.radio}
            />

            <div className={styles.methodContent}>
              <span className={`material-icons ${styles.methodIcon}`}>
                {metodo.icono}
              </span>

              <div className={styles.methodInfo}>
                <strong>{metodo.nombre}</strong>
                <p>{metodo.descripcion}</p>
              </div>
            </div>

            {selectedMetodo === metodo.id && metodo.disponible && (
              <span className={`material-icons ${styles.checkIcon}`}>
                check_circle
              </span>
            )}

            {!metodo.disponible && (
              <span className={styles.comingSoon}>Próximamente</span>
            )}
          </label>
        ))}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span className="material-icons">error</span>
          {error}
        </div>
      )}
    </div>
  );
});

PaymentMethodSelector.displayName = 'PaymentMethodSelector';

export default PaymentMethodSelector;
