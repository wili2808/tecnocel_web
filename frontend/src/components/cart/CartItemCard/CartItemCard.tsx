import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import ProductImage from '../../product/ProductImage';
import styles from './CartItemCard.module.css';

interface CartItemCardProps {
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

const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
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

    const productInfo = item.producto || {
        nombre: `Producto ${item.id_producto}`,
        descripcion: 'Descripción no disponible',
        imagen: null,
        imagen_url: null,
        imagenes: [],
        stock: 0,
        precio_venta: item.precio_unitario.toString(),
        precio_original: item.precio_unitario,
        precio_oferta: undefined,
        descuento_porcentaje: undefined,
        en_oferta: false,
        ofertas: []
    };

    // Usar las imágenes ya transformadas del backend
    // Transformar las imágenes al formato esperado por ProductImage


    const images = productInfo.imagenes || [];

    return (
        <div className={`${styles.card} ${isUpdating ? styles.updating : ''}`}>
            <Link
                to={`/productos/${item.id_producto}`}
                className={styles.imageLink}
                aria-label={`Ver detalles de ${productInfo.nombre}`}
            >
                <ProductImage
                    images={images}
                    defaultImage={images.length > 0 ? images[0].url : undefined}
                    alt={productInfo.nombre}
                    className={styles.productImage}
                />
            </Link>

            <div className={styles.content}>
                <div className={styles.header}>
                    <Link
                        to={`/productos/${item.id_producto}`}
                        className={styles.titleLink}
                    >
                        <h3 className={styles.title}>{productInfo.nombre}</h3>
                    </Link>
                    <button
                        onClick={handleRemoveItem}
                        className={styles.removeButton}
                        disabled={isUpdating}
                        type="button"
                        aria-label="Eliminar del carrito"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className={styles.details}>
                    <div className={styles.priceInfo}>
                        <span className={styles.price}>
                            ${item.precio_unitario.toLocaleString('es-ES')}
                        </span>
                        {productInfo.en_oferta && (
                            <span className={styles.originalPrice}>
                                ${productInfo.precio_original?.toLocaleString('es-ES')}
                            </span>
                        )}
                    </div>

                    <div className={styles.quantityControls}>
                        <button
                            onClick={() => handleQuantityChange(item.cantidad - 1)}
                            disabled={item.cantidad <= 1 || isUpdating}
                            className={styles.quantityButton}
                            type="button"
                            aria-label="Reducir cantidad"
                        >
                            <span className="material-icons">remove</span>
                        </button>
                        <span className={styles.quantity}>{item.cantidad}</span>
                        <button
                            onClick={() => handleQuantityChange(item.cantidad + 1)}
                            disabled={item.cantidad >= productInfo.stock || isUpdating}
                            className={styles.quantityButton}
                            type="button"
                            aria-label="Aumentar cantidad"
                        >
                            <span className="material-icons">add</span>
                        </button>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.stock}>
                        <span className="material-icons">inventory_2</span>
                        <span>{productInfo.stock} disponibles</span>
                    </div>
                    <div className={styles.subtotal}>
                        <span>Total:</span>
                        <strong>${item.subtotal.toLocaleString('es-ES')}</strong>
                    </div>
                </div>
            </div>

            {isUpdating && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner} />
                </div>
            )}
        </div>
    );
};

export default CartItemCard;
