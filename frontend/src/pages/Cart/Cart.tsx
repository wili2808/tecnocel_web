/**
 * Componente Cart - Página principal del carrito de compras
 * Muestra todos los productos agregados al carrito con opciones de gestión
 * Incluye funcionalidades para vaciar carrito, continuar comprando y procesar compra
 * Utiliza CarritoContext para el estado global del carrito
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import { useCarrito } from '../../contexts/CarritoContext';
import CartItemCard from '../../components/cart/CartItemCard';
import CartSummary from '../../components/cart/CartSummary/CartSummary';
import styles from './Cart.module.css';

const Cart: React.FC = () => {
    // ============================================================================
    // HOOKS DE NAVEGACIÓN Y CONTEXTO
    // ============================================================================
    const navigate = useNavigate();
    const { estado, obtenerCarrito, vaciarCarrito } = useCarrito();

    // ============================================================================
    // EFECTOS Y MANEJO DE ESTADO
    // ============================================================================
    
    /**
     * Obtener carrito al cargar la página
     * Se ejecuta cada vez que cambia la función obtenerCarrito
     */
    useEffect(() => {
        obtenerCarrito();
    }, [obtenerCarrito]);

    // ============================================================================
    // ESTADOS DE CARGA Y ERROR
    // ============================================================================
    
    /**
     * Estado de carga - Muestra spinner mientras se obtienen datos del carrito
     */
    if (estado.cargando) {
        return (
            <div className={styles.cartContainer}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando carrito...</p>
                </div>
            </div>
        );
    }

    /**
     * Estado de error - Muestra mensaje de error con opción de reintentar
     */
    if (estado.error) {
        return (
            <div className={styles.cartContainer}>
                <div className={styles.errorContainer}>
                    <span className="material-icons">error</span>
                    <h3>Error al cargar el carrito</h3>
                    <p>{estado.error}</p>
                    <button
                        onClick={obtenerCarrito}
                        className={styles.retryButton}
                    >
                        Intentar nuevamente
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // LÓGICA DE ESTADO DEL CARRITO
    // ============================================================================
    
    /**
     * Verificar si el carrito está vacío para mostrar estado apropiado
     */
    const isEmpty = estado.items.length === 0;

    // ============================================================================
    // RENDERIZADO
    // ============================================================================
    
    return (
        <div className={styles.cartContainer}>
            <PageMeta title="Mi carrito" noIndex />
            {isEmpty ? (
                // ============================================================================
                // ESTADO DE CARRITO VACÍO
                // ============================================================================
                <div className={styles.emptyCart}>
                    <div className={styles.emptyCartIcon}>
                        <span className="material-icons">shopping_cart</span>
                    </div>
                    <h2>Tu carrito está vacío</h2>
                    <p>¿No sabes qué comprar? Miles de productos te esperan!</p>
                    <div className={styles.emptyCartButtons}>
                        <button
                            onClick={() => navigate('/productos')}
                            className={styles.continueShoppingButton}
                        >
                            Productos disponibles
                        </button>
                        <button
                            onClick={() => navigate('/ofertas')}
                            className={styles.offersButton}
                        >
                            Nuestras ofertas
                        </button>
                    </div>
                </div>
            ) : (
                // ============================================================================
                // ESTADO DE CARRITO CON PRODUCTOS
                // ============================================================================
                <div className={styles.cartContent}>
                    {/* Lista de productos del carrito */}
                    <div className={styles.cartItems}>
                        <div className={styles.cartItemsList}>
                            {estado.items.map((item) => (
                                <CartItemCard key={item.id_item} item={item} />
                            ))}
                        </div>

                        {/* Información de envío y acciones del carrito */}
                        <div className={styles.shippingInfo}>
                            <div className={styles.shippingStatus}>
                                <span className={styles.shippingBadge}>
                                    <span className="material-icons" style={{ fontSize: '14px' }}>local_shipping</span>
                                    Envío gratis
                                </span>
                                <span className={styles.shippingLabel}>en todos tus pedidos</span>
                            </div>
                            <div className={styles.cartActions}>
                                <button
                                    className={styles.moreProductsButton}
                                    onClick={() => navigate('/productos')}
                                >
                                    <span className="material-icons">shopping_bag</span>
                                    Ver más productos
                                </button>
                                <button
                                    className={styles.clearCartButton}
                                    onClick={async () => {
                                        if (window.confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
                                            await vaciarCarrito();
                                        }
                                    }}
                                    disabled={estado.cargando}
                                >
                                    <span className="material-icons">delete_sweep</span>
                                    Vaciar carrito
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de compra con totales y botón de checkout */}
                    <div className={styles.cartSummary}>
                        <CartSummary
                            itemCount={estado.cantidad_items}
                            items={estado.items}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

Cart.displayName = 'Cart';

export default Cart; 