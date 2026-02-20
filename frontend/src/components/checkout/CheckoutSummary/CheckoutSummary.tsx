/**
 * Resumen de la compra en checkout
 * Muestra items, subtotales y total
 */
import { memo, useMemo } from 'react';
import type { ItemCarritoCompleto } from '../../../types/carrito';
import type { TipoEntrega } from '../../../types/checkout';
import styles from './CheckoutSummary.module.css';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS, formatUSD, formatARSDirecto } from '../../../utils/formatPrecio';

interface CheckoutSummaryProps {
  items: ItemCarritoCompleto[];
  tipoEntrega?: TipoEntrega;
}

export const CheckoutSummary = memo<CheckoutSummaryProps>(({ items, tipoEntrega }) => {
  const { tipoCambio } = useTipoCambio();

  // Filtrar items con stock
  const itemsConStock = useMemo(() => {
    return items.filter(item => item.tiene_stock !== false);
  }, [items]);

  // Calcular subtotal sumando los subtotales de items con stock
  const subtotal = useMemo(() => {
    return itemsConStock.reduce((sum, item) => {
      const itemSubtotal = item.subtotal_actual ?? item.subtotal;
      return sum + parseFloat(itemSubtotal.toString());
    }, 0);
  }, [itemsConStock]);

  // Total final es el subtotal calculado (ya que no hay costos adicionales)
  const totalFinal = useMemo(() => subtotal, [subtotal]);

  const cantidadTotal = useMemo(() => {
    return itemsConStock.reduce((sum, item) => sum + item.cantidad, 0);
  }, [itemsConStock]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Resumen del Pedido</h3>

      <div className={styles.itemsList}>
        {itemsConStock.map((item) => {
          const subtotalUSD = item.subtotal_actual ?? item.subtotal;
          return (
            <div key={item.id_item} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>
                  {item.producto?.nombre || 'Producto'}
                </span>
                <span className={styles.itemQuantity}>x{item.cantidad}</span>
              </div>
              <div className={styles.itemPriceBlock}>
                <span className={styles.itemPrice}>
                  {formatARS(subtotalUSD, tipoCambio)}
                </span>
                <span className={styles.itemPriceUsd}>
                  {formatUSD(subtotalUSD)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.divider}></div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Productos ({cantidadTotal})</span>
          <span>{formatARS(subtotal, tipoCambio)}</span>
        </div>

        <div className={styles.summaryRow}>
          <span>Envío</span>
          <span className={styles.freeShipping}>Gratis</span>
        </div>

        {tipoEntrega && (
          <div className={styles.deliveryInfo}>
            <span className="material-icons">
              {tipoEntrega === 'envio' ? 'local_shipping' : 'store'}
            </span>
            <span>{tipoEntrega === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</span>
          </div>
        )}
      </div>

      <div className={styles.divider}></div>

      <div className={styles.total}>
        <span className={styles.totalLabel}>Total a pagar</span>
        <span className={styles.totalAmount}>{formatARS(totalFinal, tipoCambio)}</span>
      </div>

      <div className={styles.tipoCambioInfo}>
        <span className="material-icons">info</span>
        <span>
          Tipo de cambio: {formatARSDirecto(tipoCambio)}/USD ·{' '}
          Equivale a {formatUSD(totalFinal)}
        </span>
      </div>
    </div>
  );
});

CheckoutSummary.displayName = 'CheckoutSummary';

export default CheckoutSummary;
