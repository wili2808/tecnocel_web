import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useNotification } from '../../../contexts/NotificationContext';
import ProductImage from '../../product/ProductImage';
import OfferIndicator from '../../product/OfferIndicator';
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
            imagen_url?: string;
            imagenes?: Array<{
                url: string;
                alt_text?: string;
                es_principal: boolean;
                orden: number;
            }>;
            stock: number;
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
    };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const { actualizarCantidad, eliminarItem } = useCarrito();
    const { showNotification } = useNotification();

    const productInfo = item.producto || {
        id_producto: item.id_producto,
        nombre: 'Producto no disponible',
        descripcion: '',
        precio_venta: '0',
        stock: 0,
        descuento_porcentaje: undefined,
        en_oferta: false,
        ofertas: []
    };

    const images = productInfo.imagenes || [];

    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 1 || newQuantity > productInfo.stock) {
            return;
        }

        setIsUpdating(true);
        try {
            await actualizarCantidad(item.id_item, newQuantity);
        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
            showNotification('Error al actualizar la cantidad. Por favor, intente nuevamente.', 'error', 5000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveItem = async () => {
        setIsUpdating(true);
        try {
            await eliminarItem(item.id_item);
            showNotification('Producto eliminado del carrito', 'success', 3000);
        } catch (error) {
            console.error('Error al eliminar item:', error);
            showNotification('Error al eliminar el producto. Por favor, intente nuevamente.', 'error', 5000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleQuantityButtonClick = (e: React.MouseEvent, operation: 'add' | 'subtract') => {
        e.preventDefault();
        e.stopPropagation();

        const currentQuantity = item.cantidad;
        let newQuantity: number;

        if (operation === 'add') {
            newQuantity = currentQuantity + 1;
        } else {
            newQuantity = currentQuantity - 1;
        }

        handleQuantityChange(newQuantity);
    };

    // Determinar qué precio mostrar
    const getDisplayPrice = () => {
        if (productInfo.en_oferta && productInfo.precio_oferta) {
            return {
                current: productInfo.precio_oferta,
                original: productInfo.precio_original || Number(productInfo.precio_venta),
                hasDiscount: true
            };
        }
        return {
            current: Number(productInfo.precio_venta),
            original: Number(productInfo.precio_venta),
            hasDiscount: false
        };
    };

    const priceInfo = getDisplayPrice();

    return (
        <div className={styles.cartItem}>
            <Link
                to={`/productos/${item.id_producto}`}
                className={styles.productLink}
                aria-label={`Ver detalles de ${productInfo.nombre}`}
            >
                <div className={styles.imageContainer}>
                    <ProductImage
                        images={images}
                        defaultImage={images.length > 0 ? images[0].url : undefined}
                        alt={productInfo.nombre}
                        className={styles.productImage}
                    />
                    {/* Indicador de oferta reutilizable */}
                    {productInfo.en_oferta && productInfo.descuento_porcentaje && (
                        <OfferIndicator
                            descuentoPorcentaje={productInfo.descuento_porcentaje}
                            size="small"
                            position="top-left"
                            showLabel={false}
                        />
                    )}
                </div>

                <div className={styles.productInfo}>
                    <div className={styles.productHeader}>
                        <h3 className={styles.productTitle}>{productInfo.nombre}</h3>
                        <div className={styles.priceContainer}>
                            {priceInfo.hasDiscount ? (
                                <>
                                    <span className={styles.unitPrice}>
                                        $ {priceInfo.current.toLocaleString('es-ES')}
                                    </span>
                                    <span className={styles.originalPrice}>
                                        $ {priceInfo.original.toLocaleString('es-ES')}
                                    </span>
                                </>
                            ) : (
                                <span className={styles.unitPrice}>
                                    $ {priceInfo.current.toLocaleString('es-ES')}
                                </span>
                            )}
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