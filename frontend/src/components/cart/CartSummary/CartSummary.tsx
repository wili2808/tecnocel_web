/**
 * Componente CartSummary - Resumen de compra del carrito
 * Muestra totales, descuentos por ofertas y botón de checkout
 * Incluye funcionalidades para procesar compra y mostrar beneficios
 * Utiliza CarritoContext para confirmar compra y navegación
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import styles from './CartSummary.module.css';
import type { ItemCarritoCompleto } from '../../../types/carrito';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS } from '../../../utils/formatPrecio';

interface CartSummaryProps {
    itemCount: number;
    items: ItemCarritoCompleto[];
}

const CartSummary: React.FC<CartSummaryProps> = ({ items }) => {
    // ============================================================================
    // HOOKS DE NAVEGACIÓN Y CONTEXTO
    // ============================================================================
    const navigate = useNavigate();
    const { estado } = useCarrito();
    const { tipoCambio } = useTipoCambio();

    // ============================================================================
    // CÁLCULOS DE PRECIOS Y DESCUENTOS
    // ============================================================================

    /**
     * Filtrar items con stock disponible
     * Excluir items sin stock de todos los cálculos de totales
     */
    const itemsConStock = items.filter(item => item.tiene_stock !== false);
    const itemCountConStock = itemsConStock.reduce((sum, item) => sum + item.cantidad, 0);

    /**
     * ✅ CALCULAR TOTALES CON PRECIOS ACTUALES (Fase 2)
     * Usar subtotal_actual cuando está disponible (precio revalidado)
     * Si no hay revalidación, usar subtotal normal
     */
    const subtotalProducts = itemsConStock.reduce((sum, item) => {
        // Usar subtotal_actual si existe (precio revalidado), sino usar subtotal normal
        const itemSubtotal = item.subtotal_actual !== undefined
            ? parseFloat(item.subtotal_actual.toString())
            : parseFloat(item.subtotal.toString());
        return sum + itemSubtotal;
    }, 0);

    /**
     * Calcular subtotal original sin descuentos para mostrar el ahorro
     * Si hay oferta, usa precio_original; si no, usa precio_venta
     * SOLO incluye items con stock disponible
     */
    const subtotalOriginal = itemsConStock.reduce((sum, item) => {
        const productInfo = item.producto;
        let itemOriginalPrice = 0;

        if (productInfo?.en_oferta && productInfo.precio_original) {
            // Si hay oferta, usar precio original * cantidad
            itemOriginalPrice = productInfo.precio_original * item.cantidad;
        } else {
            // Si no hay oferta, usar precio_venta * cantidad
            const precioVenta = parseFloat(productInfo?.precio_venta || '0');
            itemOriginalPrice = precioVenta * item.cantidad;
        }

        return sum + itemOriginalPrice;
    }, 0);

    /**
     * Calcular descuento total por ofertas aplicadas
     * Diferencia entre precio original y precio con descuento
     */
    const discount = subtotalOriginal - subtotalProducts;

    /**
     * ✅ USAR TOTAL ACTUAL DEL ESTADO SI ESTÁ DISPONIBLE (Fase 2)
     * El estado.total_actual viene del backend con precios revalidados
     */
    const totalFinal = estado.total_actual !== undefined
        ? estado.total_actual
        : subtotalProducts;

    /**
     * Detectar si hay items sin stock excluidos del cálculo
     */
    const itemsSinStock = items.filter(item => item.tiene_stock === false);
    const hayItemsSinStock = itemsSinStock.length > 0;

    // ============================================================================
    // MANEJO DE OPERACIONES DE COMPRA
    // ============================================================================

    /**
     * Redirigir a la página de checkout
     * Ya no confirma la compra directamente desde aquí
     */
    const handleContinuePurchase = () => {
        if (items.length === 0) {
            alert('No hay productos en el carrito');
            return;
        }

        // Redirigir a checkout
        navigate('/checkout');
    };


    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.cartSummary}>
            {/* Encabezado del resumen de compra */}
            <div className={styles.summaryHeader}>
                <h2>Resumen de compra</h2>
            </div>

            {/* Contenido principal del resumen */}
            <div className={styles.summaryContent}>
                {/* Alerta si hay items sin stock excluidos del total */}
                {hayItemsSinStock && (
                    <div className={styles.stockAlert}>
                        <span className="material-icons">info</span>
                        <span>
                            {itemsSinStock.length === 1
                                ? '1 producto sin stock no está incluido en el total'
                                : `${itemsSinStock.length} productos sin stock no están incluidos en el total`
                            }
                        </span>
                    </div>
                )}

                {/* Sección de desglose de precios */}
                <div className={styles.summarySection}>
                    {/* Línea de productos con cantidad y precio original */}
                    <div className={styles.summaryRow}>
                        <span>Productos ({itemCountConStock})</span>
                        <span>{formatARS(subtotalOriginal, tipoCambio)}</span>
                    </div>

                    {/* Línea de envío (siempre gratis) */}
                    <div className={styles.summaryRow}>
                        <span>Envío</span>
                        <span className={styles.freeShipping}>Gratis</span>
                    </div>

                    {/* Línea de descuentos por ofertas (solo visible si hay descuentos) */}
                    {discount > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Descuentos por ofertas</span>
                            <span className={styles.discount}>-{formatARS(discount, tipoCambio)}</span>
                        </div>
                    )}

                    {/* ✅ MOSTRAR AJUSTE POR CAMBIO DE PRECIO (Fase 2) */}
                    {estado.tiene_cambios_precio && estado.diferencia_total !== undefined && estado.diferencia_total !== 0 && (
                        <div className={styles.summaryRow}>
                            <span className={styles.priceAdjustmentLabel}>
                                <span className="material-icons">
                                    {estado.diferencia_total > 0 ? 'trending_up' : 'trending_down'}
                                </span>
                                Ajuste de precio
                            </span>
                            <span className={estado.diferencia_total > 0 ? styles.priceAdjustmentUp : styles.priceAdjustmentDown}>
                                {estado.diferencia_total > 0 ? '+' : '-'}{formatARS(Math.abs(estado.diferencia_total), tipoCambio)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Sección del total final */}
                <div className={styles.totalSection}>
                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Total</span>
                        <span className={styles.totalAmount}>{formatARS(totalFinal, tipoCambio)}</span>
                    </div>
                </div>

                {/* Sección de checkout con botón de compra */}
                <div className={styles.checkoutSection}>
                    <button
                        onClick={handleContinuePurchase}
                        disabled={totalFinal === 0}
                        className={styles.checkoutButton}
                    >
                        {totalFinal === 0 ? 'No hay productos disponibles' : 'Continuar compra'}
                    </button>
                </div>

                {/* Sección de beneficios del servicio */}
                <div className={styles.benefitsSection}>
                    <h3>Beneficios</h3>
                    <ul className={styles.benefitsList}>
                        {/* Envío gratis para compras grandes */}
                        <li>
                            <span className="material-icons">local_shipping</span>
                            <span>Envío gratis en compras superiores a $50.000</span>
                        </li>
                        {/* Compra protegida */}
                        <li>
                            <span className="material-icons">security</span>
                            <span>Compra protegida</span>
                        </li>
                        {/* Devolución gratis */}
                        <li>
                            <span className="material-icons">assignment_return</span>
                            <span>Devolución gratis</span>
                        </li>
                        {/* Atención al cliente 24/7 */}
                        <li>
                            <span className="material-icons">support_agent</span>
                            <span>Atención al cliente 24/7</span>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
    );
};

CartSummary.displayName = 'CartSummary';

export default CartSummary; 