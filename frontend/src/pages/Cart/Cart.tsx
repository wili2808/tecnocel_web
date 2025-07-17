import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCarrito } from '../../contexts/CarritoContext';
import CartItem from '../../components/cart/CartItem/CartItem';
import CartSummary from '../../components/cart/CartSummary/CartSummary';
import styles from './Cart.module.css';

const Cart: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { estado, obtenerCarrito, agregarItemsPrueba } = useCarrito();

    // Redirigir si no está autenticado
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Obtener carrito al cargar la página
    useEffect(() => {
        if (isAuthenticated) {
            obtenerCarrito();
        }
    }, [isAuthenticated, obtenerCarrito]);

    if (!isAuthenticated) {
        return null;
    }

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

    const isEmpty = estado.items.length === 0;

    return (
        <div className={styles.cartContainer}>
            <div className={styles.cartHeader}>
                <h1 className={styles.pageTitle}>Carrito de Compras</h1>
                <p className={styles.pageSubtitle}>
                    {isEmpty ? 'Tu carrito está vacío' : `${estado.items.length} producto${estado.items.length > 1 ? 's' : ''} en tu carrito`}
                </p>
            </div>

            {isEmpty ? (
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
                            Explorar productos
                        </button>
                        <button
                            onClick={agregarItemsPrueba}
                            className={styles.addTestItemsButton}
                        >
                            Agregar productos de prueba
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.cartContent}>
                    {/* Lista de productos */}
                    <div className={styles.cartItems}>
                        <div className={styles.cartItemsHeader}>
                            <h2>Productos de LACUARTAKOKORO</h2>
                        </div>
                        <div className={styles.cartItemsList}>
                            {estado.items.map((item) => (
                                <CartItem key={item.id} item={item} />
                            ))}
                        </div>

                        {/* Información de envío */}
                        <div className={styles.shippingInfo}>
                            <div className={styles.shippingStatus}>
                                <span className={styles.shippingIcon}>🚚</span>
                                <div className={styles.shippingText}>
                                    <span className={styles.shippingBadge}>Gratis</span>
                                    <span className={styles.shippingLabel}>Envío gratis</span>
                                </div>
                            </div>
                            <div className={styles.shippingDetails}>
                                <p>Aprovecha tu envío gratis agregando más productos de LACUARTAKOKORO.</p>
                                <button className={styles.moreProductsButton}>
                                    Ver más productos de este vendedor
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de compra */}
                    <div className={styles.cartSummary}>
                        <CartSummary
                            total={estado.total}
                            itemCount={estado.items.length}
                            items={estado.items}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart; 