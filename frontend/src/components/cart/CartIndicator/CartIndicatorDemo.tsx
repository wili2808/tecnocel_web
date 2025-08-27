/**
 * Componente CartIndicatorDemo - Demostración de los diferentes tamaños
 * Muestra ejemplos de uso del CartIndicator con los 3 tamaños disponibles
 * Útil para desarrollo y testing
 */
import React from 'react';
import CartIndicator from './CartIndicator';
import styles from './CartIndicatorDemo.module.css';

const CartIndicatorDemo: React.FC = () => {
    // Simular un producto en el carrito para la demostración
    const demoProductId = 123;

    return (
        <div className={styles.demoContainer}>
            <h2 className={styles.demoTitle}>CartIndicator - Demostración de Tamaños</h2>
            
            <div className={styles.sizeExamples}>
                {/* Tamaño Small */}
                <div className={styles.exampleItem}>
                    <h3>Small (24x24px)</h3>
                    <div className={styles.exampleContainer}>
                        <CartIndicator 
                            productId={demoProductId} 
                            size="small"
                            showQuantity={true}
                        />
                    </div>
                    <p>Ideal para tarjetas compactas y listas</p>
                </div>

                {/* Tamaño Medium */}
                <div className={styles.exampleItem}>
                    <h3>Medium (32x32px) - Por defecto</h3>
                    <div className={styles.exampleContainer}>
                        <CartIndicator 
                            productId={demoProductId} 
                            size="medium"
                            showQuantity={true}
                        />
                    </div>
                    <p>Tamaño estándar para la mayoría de usos</p>
                </div>

                {/* Tamaño Large */}
                <div className={styles.exampleItem}>
                    <h3>Large (40x40px)</h3>
                    <div className={styles.exampleContainer}>
                        <CartIndicator 
                            productId={demoProductId} 
                            size="large"
                            showQuantity={true}
                        />
                    </div>
                    <p>Para vistas destacadas y elementos principales</p>
                </div>
            </div>

            <div className={styles.variantsExamples}>
                <h3>Variantes de Cantidad</h3>
                
                <div className={styles.variantItem}>
                    <h4>Con Cantidad Visible</h4>
                    <div className={styles.exampleContainer}>
                        <CartIndicator 
                            productId={demoProductId} 
                            size="medium"
                            showQuantity={true}
                        />
                    </div>
                </div>

                <div className={styles.variantItem}>
                    <h4>Sin Cantidad Visible</h4>
                    <div className={styles.exampleContainer}>
                        <CartIndicator 
                            productId={demoProductId} 
                            size="medium"
                            showQuantity={false}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.usageInfo}>
                <h3>Uso del Componente</h3>
                <pre className={styles.codeExample}>
{`// Tamaño pequeño para tarjetas compactas
<CartIndicator 
    productId={123} 
    size="small"
    showQuantity={true}
/>

// Tamaño mediano (por defecto)
<CartIndicator 
    productId={123} 
    size="medium"
    showQuantity={true}
/>

// Tamaño grande para vistas destacadas
<CartIndicator 
    productId={123} 
    size="large"
    showQuantity={true}
/>

// Sin mostrar cantidad
<CartIndicator 
    productId={123} 
    size="medium"
    showQuantity={false}
/>`}
                </pre>
            </div>
        </div>
    );
};

export default CartIndicatorDemo;
