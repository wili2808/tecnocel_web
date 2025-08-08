import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import styles from './CartSummary.module.css';

interface CartSummaryProps {
    total: number;
    itemCount: number;
    items: Array<{
        id_item: number;
        id_carrito: number;
        id_producto: number;
        cantidad: number;
        precio_unitario: number;
        subtotal: number;
        fyh_creacion: string;
        fyh_actualizacion: string;
        producto?: {
            id_producto: number;
            nombre: string;
            descripcion: string;
            precio_venta: string;
            imagen: string;
            stock: number;
            // Campos para ofertas
            precio_original?: number;
            precio_oferta?: number;
            descuento_porcentaje?: number;
            en_oferta?: boolean;
            ofertas?: Array<{
                id_oferta: number;
                nombre_oferta: string;
                tipo_descuento: 'porcentaje' | 'monto_fijo';
                valor_descuento: number;
            }>;
        };
    }>;
}

const CartSummary: React.FC<CartSummaryProps> = ({ total, itemCount, items }) => {
    const navigate = useNavigate();
    const { confirmarCompra } = useCarrito();
    const [couponCode, setCouponCode] = useState('');
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calcular subtotal y descuentos de ofertas
    const subtotalProducts = items.reduce((sum, item) => {
        const productInfo = item.producto;
        if (productInfo?.en_oferta && productInfo.precio_oferta) {
            // Si hay oferta, usar el precio con descuento
            return sum + (productInfo.precio_oferta * item.cantidad);
        }
        return sum + parseFloat(item.subtotal.toString());
    }, 0);

    const subtotalOriginal = items.reduce((sum, item) => {
        const productInfo = item.producto;
        if (productInfo?.en_oferta && productInfo.precio_original) {
            // Precio original sin descuento
            return sum + (productInfo.precio_original * item.cantidad);
        }
        return sum + parseFloat(item.subtotal.toString());
    }, 0);

    const discount = subtotalOriginal - subtotalProducts; // Descuentos por ofertas
    const discountCoupon = 0; // Descuentos por cupón (futuro)

    const handleCouponSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!couponCode.trim()) return;

        setIsProcessing(true);
        // Simular procesamiento del cupón
        setTimeout(() => {
            setIsProcessing(false);
            // Aquí iría la lógica para aplicar el cupón
            console.log('Cupón aplicado:', couponCode);
        }, 1000);
    };

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

    return (
        <div className={styles.cartSummary}>
            <div className={styles.summaryHeader}>
                <h2>Resumen de compra</h2>
            </div>

            <div className={styles.summaryContent}>
                <div className={styles.summarySection}>
                    <div className={styles.summaryRow}>
                        <span>Productos ({itemCount})</span>
                        <span>$ {subtotalOriginal.toLocaleString('es-ES')}</span>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>Envío</span>
                        <span className={styles.freeShipping}>Gratis</span>
                    </div>

                    {discount > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Descuentos por ofertas</span>
                            <span className={styles.discount}>-$ {discount.toLocaleString('es-ES')}</span>
                        </div>
                    )}

                    {discountCoupon > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Descuento por cupón</span>
                            <span className={styles.discount}>-$ {discountCoupon.toLocaleString('es-ES')}</span>
                        </div>
                    )}
                </div>

                <div className={styles.couponSection}>
                    {!showCouponInput ? (
                        <button
                            onClick={() => setShowCouponInput(true)}
                            className={styles.couponToggle}
                        >
                            Ingresar código de cupón
                        </button>
                    ) : (
                        <form onSubmit={handleCouponSubmit} className={styles.couponForm}>
                            <div className={styles.couponInputContainer}>
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Código de cupón"
                                    className={styles.couponInput}
                                    disabled={isProcessing}
                                />
                                <button
                                    type="submit"
                                    disabled={!couponCode.trim() || isProcessing}
                                    className={styles.couponSubmit}
                                >
                                    {isProcessing ? 'Aplicando...' : 'Aplicar'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className={styles.totalSection}>
                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Total</span>
                        <span className={styles.totalAmount}>$ {total.toLocaleString('es-ES')}</span>
                    </div>
                </div>

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

                <div className={styles.benefitsSection}>
                    <h3>Beneficios</h3>
                    <ul className={styles.benefitsList}>
                        <li>
                            <span className="material-icons">local_shipping</span>
                            <span>Envío gratis en compras superiores a $50.000</span>
                        </li>
                        <li>
                            <span className="material-icons">security</span>
                            <span>Compra protegida</span>
                        </li>
                        <li>
                            <span className="material-icons">assignment_return</span>
                            <span>Devolución gratis</span>
                        </li>
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

export default CartSummary; 