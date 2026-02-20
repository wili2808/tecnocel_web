/**
 * Componente de alerta para cambios de precio en el carrito
 * Muestra información detallada cuando los precios de productos han cambiado
 * desde que fueron agregados al carrito
 */
import React from 'react';
import type { CambioPrecio } from '../../../types/carrito';
import styles from './PriceChangeAlert.module.css';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS } from '../../../utils/formatPrecio';

interface PriceChangeAlertProps {
  itemsConCambio: CambioPrecio[];
  diferencia_total: number;
  onAceptar: () => void;
  onCancelar?: () => void;
}

/**
 * PriceChangeAlert - Alerta visual para cambios de precio
 *
 * Muestra:
 * - Lista de productos con precio cambiado
 * - Comparación precio anterior vs nuevo
 * - Porcentaje de cambio
 * - Diferencia total del carrito
 * - Botones de acción (Aceptar/Cancelar)
 */
export const PriceChangeAlert: React.FC<PriceChangeAlertProps> = ({
  itemsConCambio,
  diferencia_total,
  onAceptar,
  onCancelar
}) => {
  const esAumento = diferencia_total > 0;
  const { tipoCambio } = useTipoCambio();

  return (
    <div className={styles.alert}>
      <div className={styles.header}>
        <span className={styles.icon}>{esAumento ? '⚠️' : 'ℹ️'}</span>
        <h3 className={styles.title}>
          {esAumento ? 'Los precios aumentaron' : 'Los precios cambiaron'}
        </h3>
      </div>

      <div className={styles.content}>
        <p className={styles.message}>
          Algunos productos en tu carrito cambiaron de precio desde que los agregaste:
        </p>

        <ul className={styles.itemList}>
          {itemsConCambio.map(item => (
            <li key={item.id_item} className={styles.item}>
              <span className={styles.itemName}>{item.nombre_producto}</span>
              <div className={styles.priceChange}>
                <span className={styles.oldPrice}>
                  {formatARS(item.precio_guardado, tipoCambio)}
                </span>
                <span className={styles.arrow}>→</span>
                <span className={item.diferencia_precio > 0 ? styles.newPriceUp : styles.newPriceDown}>
                  {formatARS(item.precio_actual, tipoCambio)}
                  <span className={styles.percentage}>
                    ({item.porcentaje_cambio > 0 ? '+' : ''}{item.porcentaje_cambio.toFixed(1)}%)
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.totalChange}>
          <span className={styles.totalLabel}>Diferencia en total:</span>
          <span className={esAumento ? styles.totalUp : styles.totalDown}>
            {esAumento ? '+' : '-'}{formatARS(Math.abs(diferencia_total), tipoCambio)}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        {onCancelar && (
          <button onClick={onCancelar} className={styles.btnCancel}>
            Cancelar
          </button>
        )}
        <button onClick={onAceptar} className={styles.btnAccept}>
          Aceptar y continuar
        </button>
      </div>
    </div>
  );
};

export default PriceChangeAlert;
