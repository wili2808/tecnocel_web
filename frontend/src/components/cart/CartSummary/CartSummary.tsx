/**
 * Componente CartSummary - Resumen de compra del carrito
 * Muestra totales, descuentos por ofertas y botón de checkout
 * Incluye funcionalidades para procesar compra y mostrar beneficios
 * Utiliza CarritoContext para confirmar compra y navegación
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import styles from './CartSummary.module.css';
import type { ItemCarritoCompleto } from '../../../types/carrito';

interface CartSummaryProps {
    itemCount: number;
    items: ItemCarritoCompleto[];
}

const CartSummary: React.FC<CartSummaryProps> = ({ itemCount, items }) => {
    // ============================================================================
    // HOOKS DE NAVEGACIÓN Y CONTEXTO
    // ============================================================================
    const navigate = useNavigate();
    const { confirmarCompra } = useCarrito();
    const [isProcessing, setIsProcessing] = useState(false);

    // ============================================================================
    // CÁLCULOS DE PRECIOS Y DESCUENTOS
    // ============================================================================

    /**
     * Calcular subtotal de productos usando precios ya calculados por el backend
     * El backend ahora calcula correctamente los subtotales con ofertas aplicadas
     */
    const subtotalProducts = items.reduce((sum, item) => {
        // Usar directamente el subtotal calculado por el backend
        // que ya incluye las ofertas aplicadas
        const itemSubtotal = parseFloat(item.subtotal.toString());
        return sum + itemSubtotal;
    }, 0);

    /**
     * Calcular subtotal original sin descuentos para mostrar el ahorro
     * Si hay oferta, usa precio_original; si no, usa precio_venta
     */
    const subtotalOriginal = items.reduce((sum, item) => {
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
     * Calcular el total final con descuentos aplicados
     * Usa directamente el subtotal de productos (ya incluye descuentos)
     */
    const totalFinal = subtotalProducts;

    // ============================================================================
    // MANEJO DE OPERACIONES DE COMPRA
    // ============================================================================

    /**
     * Procesar la compra del carrito completo
     * Confirma la venta y redirige al usuario al inicio
     */
    const handleContinuePurchase = async () => {
        if (items.length === 0) {
            alert('No hay productos en el carrito');
            return;
        }

        setIsProcessing(true);
        try {
            const venta = await confirmarCompra({
                observaciones: 'Compra realizada desde la web',
                moneda: 'BOB'
            });

            // Mostrar mensaje de éxito y redirigir
            alert(`¡Compra realizada exitosamente! Número de venta: ${venta.nro_venta}`);
            navigate('/'); // Redirigir al inicio
        } catch (error: any) {
            console.error('Error al procesar la compra:', error);
            alert(error.message || 'Error al procesar la compra. Intente nuevamente.');
        } finally {
            setIsProcessing(false);
        }
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
                {/* Sección de desglose de precios */}
                <div className={styles.summarySection}>
                    {/* Línea de productos con cantidad y precio original */}
                    <div className={styles.summaryRow}>
                        <span>Productos ({itemCount})</span>
                        <span>$ {subtotalOriginal.toLocaleString('es-ES')}</span>
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
                            <span className={styles.discount}>-$ {discount.toLocaleString('es-ES')}</span>
                        </div>
                    )}
                </div>

                {/* Sección del total final */}
                <div className={styles.totalSection}>
                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Total</span>
                        <span className={styles.totalAmount}>$ {totalFinal.toLocaleString('es-ES')}</span>
                    </div>
                </div>

                {/* Sección de checkout con botón de compra */}
                <div className={styles.checkoutSection}>
                    <button
                        onClick={handleContinuePurchase}
                        disabled={isProcessing}
                        className={styles.checkoutButton}
                    >
                        {isProcessing ? (
                            <>
                                <div className={styles.spinner}></div>
                                Procesando...
                            </>
                        ) : (
                            'Continuar compra'
                        )}
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