/**
 * Componente para seleccionar tipo de entrega
 * Envío a domicilio vs Retiro en local
 */
import { memo } from 'react';
import type { TipoEntrega } from '../../../types/checkout';
import styles from './DeliveryTypeSelector.module.css';

interface DeliveryTypeSelectorProps {
  tipoEntrega: TipoEntrega;
  onChangeTipo: (tipo: TipoEntrega) => void;
}

export const DeliveryTypeSelector = memo<DeliveryTypeSelectorProps>(({
  tipoEntrega,
  onChangeTipo
}) => {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <span className="material-icons">local_shipping</span>
        Tipo de Entrega
      </h3>

      <div className={styles.optionsList}>
        {/* Opción: Envío a domicilio */}
        <label
          className={`${styles.optionCard} ${tipoEntrega === 'envio' ? styles.selected : ''}`}
        >
          <input
            type="radio"
            name="tipo_entrega"
            value="envio"
            checked={tipoEntrega === 'envio'}
            onChange={() => onChangeTipo('envio')}
            className={styles.radio}
          />

          <div className={styles.optionContent}>
            <div className={styles.optionHeader}>
              <span className={`material-icons ${styles.optionIcon}`}>
                home
              </span>
              <div className={styles.optionInfo}>
                <strong className={styles.optionTitle}>Envío a domicilio</strong>
                <p className={styles.optionDescription}>
                  Recibe tu pedido en la dirección que prefieras
                </p>
              </div>
            </div>

            <div className={styles.optionBadge}>
              <span className="material-icons">check_circle</span>
              Envío gratis
            </div>
          </div>

          {tipoEntrega === 'envio' && (
            <span className={`material-icons ${styles.checkIcon}`}>
              check_circle
            </span>
          )}
        </label>

        {/* Opción: Retiro en local */}
        <label
          className={`${styles.optionCard} ${tipoEntrega === 'retiro' ? styles.selected : ''}`}
        >
          <input
            type="radio"
            name="tipo_entrega"
            value="retiro"
            checked={tipoEntrega === 'retiro'}
            onChange={() => onChangeTipo('retiro')}
            className={styles.radio}
          />

          <div className={styles.optionContent}>
            <div className={styles.optionHeader}>
              <span className={`material-icons ${styles.optionIcon}`}>
                store
              </span>
              <div className={styles.optionInfo}>
                <strong className={styles.optionTitle}>Retiro en local</strong>
                <p className={styles.optionDescription}>
                  Retira tu pedido en nuestro local
                </p>
              </div>
            </div>

            <div className={styles.optionBadge}>
              <span className="material-icons">schedule</span>
              Disponible hoy
            </div>
          </div>

          {tipoEntrega === 'retiro' && (
            <span className={`material-icons ${styles.checkIcon}`}>
              check_circle
            </span>
          )}
        </label>
      </div>
    </div>
  );
});

DeliveryTypeSelector.displayName = 'DeliveryTypeSelector';

export default DeliveryTypeSelector;
