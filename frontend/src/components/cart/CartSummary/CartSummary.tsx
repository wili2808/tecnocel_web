import React, { useState } from 'react';
import styles from './CartSummary.module.css';

interface CartSummaryProps {
    total: number;
    itemCount: number;
    items: Array<{
        id: number;
        producto_id: number;
        cantidad: number;
        precio: number;
        subtotal: number;
    }>;
}

const CartSummary: React.FC<CartSummaryProps> = ({ total, itemCount, items }) => {
    const [couponCode, setCouponCode] = useState('');
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const subtotalProducts = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = 0; // Envío gratis
    const discount = 0; // Descuentos por cupón

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

    const handleContinuePurchase = () => {
        setIsProcessing(true);
        // Simular proceso de compra
        setTimeout(() => {
            setIsProcessing(false);
            // Aquí iría la lógica para proceder con la compra
            console.log('Continuar con la compra');
        }, 1000);
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
                        <span>$ {subtotalProducts.toLocaleString('es-ES')}</span>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>Envío</span>
                        <span className={styles.freeShipping}>Gratis</span>
                    </div>

                    {discount > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Descuento</span>
                            <span className={styles.discount}>-$ {discount.toLocaleString('es-ES')}</span>
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