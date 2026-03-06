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
  const { tipoCambio, esConfiable, origen } = useTipoCambio();

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

      {!esConfiable && (
        <div className={styles.tipoCambioWarning}>
          <span className="material-icons">warning_amber</span>
          <span>
            No pudimos sincronizar la cotización en este momento. Mostramos importes en USD y el total final en ARS
            se confirmará al procesar la compra.
          </span>
        </div>
      )}

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
                {esConfiable ? (
                  <span className={styles.itemPrice}>
                    {formatARS(subtotalUSD, tipoCambio)}
                  </span>
                ) : (
                  <span className={styles.itemPrice}>
                    {formatUSD(subtotalUSD)}
                  </span>
                )}
                <span className={styles.itemPriceUsd}>
                  {esConfiable ? formatUSD(subtotalUSD) : 'ARS pendiente de cotización'}
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
          <span>{esConfiable ? formatARS(subtotal, tipoCambio) : formatUSD(subtotal)}</span>
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
        <span className={styles.totalAmount}>{esConfiable ? formatARS(totalFinal, tipoCambio) : formatUSD(totalFinal)}</span>
      </div>

      <div className={styles.tipoCambioInfo}>
        <span className="material-icons">info</span>
        <span>
          {esConfiable
            ? `Tipo de cambio: ${formatARSDirecto(tipoCambio)}/USD · Equivale a ${formatUSD(totalFinal)}`
            : 'Tipo de cambio no sincronizado. El total definitivo en ARS se calculará al confirmar la compra.'}
          {origen === 'cache' ? ' (Mostrando último valor guardado)' : ''}
        </span>
      </div>
    </div>
  );
});

CheckoutSummary.displayName = 'CheckoutSummary';

export default CheckoutSummary;
