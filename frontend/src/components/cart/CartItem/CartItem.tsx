import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import styles from './CartItem.module.css';

interface CartItemProps {
    item: {
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
        };
    };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
    const { actualizarCantidad, eliminarItem } = useCarrito();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 1) return;

        setIsUpdating(true);
        try {
            await actualizarCantidad(item.id_item, newQuantity);
        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveItem = async () => {
        setIsUpdating(true);
        try {
            await eliminarItem(item.id_item);
        } catch (error) {
            console.error('Error al eliminar item:', error);
            setIsUpdating(false);
        }
    };

    const handleQuantityButtonClick = (e: React.MouseEvent, operation: 'add' | 'subtract') => {
        e.preventDefault(); // Prevenir navegación del Link
        e.stopPropagation(); // Prevenir propagación del evento

        const newQuantity = operation === 'add' ? item.cantidad + 1 : item.cantidad - 1;
        handleQuantityChange(newQuantity);
    };

    // Usar datos del producto si están disponibles, sino usar placeholders
    const productInfo = item.producto || {
        nombre: `Producto ${item.id_producto}`,
        descripcion: 'Descripción del producto',
        imagen: '/placeholder.svg',
        stock: 0,
        precio_venta: item.precio_unitario.toString()
    };

    return (
        <div className={`${styles.cartItem} ${isUpdating ? styles.updating : ''}`}>
            {/* Contenido clickeable del producto */}
            <Link
                to={`/productos/${item.id_producto}`}
                className={styles.productLink}
                aria-label={`Ver detalles de ${productInfo.nombre}`}
            >
                {/* Imagen del producto */}
                <div className={styles.imageContainer}>
                    <img
                        src={productInfo.imagen}
                        alt={productInfo.nombre}
                        className={styles.productImage}
                    />
                </div>

                {/* Información del producto */}
                <div className={styles.productInfo}>
                    <div className={styles.productHeader}>
                        <h3 className={styles.productTitle}>{productInfo.nombre}</h3>
                        <div className={styles.priceContainer}>
                            <span className={styles.unitPrice}>
                                $ {item.precio_unitario.toLocaleString('es-ES')}
                            </span>
                        </div>
                    </div>

                    <p className={styles.productDescription}>{productInfo.descripcion}</p>

                    <div className={styles.productFooter}>
                        <div className={styles.stockContainer}>
                            <span className={styles.stockBadge}>
                                {productInfo.stock} en Stock
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Controles y precio total */}
            <div className={styles.actionContainer}>
                <div className={styles.quantityControls}>
                    <button
                        onClick={(e) => handleQuantityButtonClick(e, 'subtract')}
                        disabled={item.cantidad <= 1 || isUpdating}
                        className={styles.quantityButton}
                        type="button"
                    >
                        <span className="material-icons">remove</span>
                    </button>
                    <span className={styles.quantity}>{item.cantidad}</span>
                    <button
                        onClick={(e) => handleQuantityButtonClick(e, 'add')}
                        disabled={isUpdating}
                        className={styles.quantityButton}
                        type="button"
                    >
                        <span className="material-icons">add</span>
                    </button>
                </div>

                <div className={styles.subtotalContainer}>
                    <span className={styles.subtotalLabel}>Total:</span>
                    <span className={styles.subtotal}>
                        $ {item.subtotal.toLocaleString('es-ES')}
                    </span>
                </div>

                <button
                    onClick={handleRemoveItem}
                    className={styles.removeButton}
                    disabled={isUpdating}
                    type="button"
                >
                    <span className="material-icons">delete</span>
                    Eliminar
                </button>
            </div>

            {isUpdating && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                </div>
            )}
        </div>
    );
};

export default CartItem; 