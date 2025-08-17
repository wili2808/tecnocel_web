/**
 * Componente CartItemCard - Tarjeta de item individual del carrito
 * Muestra información completa del producto con controles de cantidad y eliminación
 * Incluye funcionalidades para actualizar cantidad, eliminar item y navegar al producto
 * Utiliza CarritoContext para operaciones del carrito y manejo de estado
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useCarrito as useCarritoHook } from '../../../hooks/useCarrito';
import ProductImage from '../../product/ProductImage';
import IconButton from '../../common/IconButton';
import styles from './CartItemCard.module.css';
import type { ItemCarritoCompleto } from '../../../types/carrito';

interface CartItemCardProps {
    item: ItemCarritoCompleto;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================
    const { actualizarCantidad, eliminarItem } = useCarrito();
    const { canAddMoreOfProduct } = useCarritoHook();
    const [isUpdating, setIsUpdating] = useState(false);

    // ============================================================================
    // MANEJO DE ESTADO Y OPERACIONES
    // ============================================================================

    /**
     * Manejar cambio de cantidad del item en el carrito
     * Previene cantidades menores a 1 y muestra estado de carga
     * USA VALIDACIONES EXISTENTES del hook useCarrito
     */
    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 1) return;

        // USAR VALIDACIONES EXISTENTES: No duplicar lógica
        // El hook useCarrito ya valida stock antes de enviar al backend
        setIsUpdating(true);
        try {
            await actualizarCantidad(item.id_item, newQuantity);
        } catch (error: any) {
            console.error('Error al actualizar cantidad:', error);
            // El error ya viene validado del backend con mensaje claro
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * Manejar eliminación del item del carrito
     * Muestra estado de carga durante la operación
     */
    const handleRemoveItem = async () => {
        setIsUpdating(true);
        try {
            await eliminarItem(item.id_item);
        } catch (error) {
            console.error('Error al eliminar item:', error);
            setIsUpdating(false);
        }
    };

    // ============================================================================
    // PROCESAMIENTO DE DATOS DEL PRODUCTO
    // ============================================================================

    /**
     * Crear objeto de información del producto con fallbacks para campos faltantes
     * Preserva los campos calculados del backend (precio_oferta, descuentos, etc.)
     */
    const productInfo = {
        nombre: item.producto?.nombre || `Producto ${item.id_producto}`,
        descripcion: item.producto?.descripcion || 'Descripción no disponible',
        imagen: item.producto?.imagen || null,
        imagen_url: item.producto?.imagen_url || null,
        imagenes: item.producto?.imagenes || [],
        stock: item.producto?.stock ?? 0,
        precio_venta: item.producto?.precio_venta || item.precio_unitario.toString(),
        // NO sobrescribir los campos calculados del backend
        precio_original: item.producto?.precio_original,
        precio_oferta: item.producto?.precio_oferta,
        descuento_porcentaje: item.producto?.descuento_porcentaje,
        en_oferta: item.producto?.en_oferta,
        ofertas: item.producto?.ofertas || []
    };

    /**
     * Obtener imágenes del producto para el componente ProductImage
     * Usa las imágenes ya transformadas del backend
     */
    const images = productInfo.imagenes || [];

    /**
     * Verificar si se puede agregar más cantidad del producto
     * Usa la validación existente del hook useCarrito
     */
    const canAddMore = canAddMoreOfProduct([item], item.id_producto, productInfo.stock);

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={`${styles.card} ${isUpdating ? styles.updating : ''}`}>
            {/* Enlace a la imagen del producto con navegación a detalles */}
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

            {/* Información del producto y controles */}
            <div className={styles.productInfo}>
                {/* Título y descripción del producto */}
                <h3 className={styles.productTitle}>{productInfo.nombre}</h3>

                {/* Información de precios con soporte para ofertas */}
                <div className={styles.priceInfo}>
                    {productInfo.en_oferta && productInfo.precio_oferta ? (
                        <>
                            <span className={styles.originalPrice}>
                                $ {productInfo.precio_original?.toLocaleString('es-ES')}
                            </span>
                            <span className={styles.currentPrice}>
                                $ {productInfo.precio_oferta.toLocaleString('es-ES')}
                            </span>
                        </>
                    ) : (
                        <span className={styles.currentPrice}>
                            $ {Number(productInfo.precio_venta).toLocaleString('es-ES')}
                        </span>
                    )}
                </div>

                <div className={styles.quantityControlsContainer}>
                    {/* Controles de cantidad con IconButton para consistencia */}
                    <div className={styles.quantityControls}>
                        <IconButton
                            icon="remove"
                            onClick={() => handleQuantityChange(item.cantidad - 1)}
                            disabled={item.cantidad <= 1 || isUpdating}
                            ariaLabel="Reducir cantidad"
                            variant="outline"
                            size="sm"
                            className={styles.quantityButton}
                        />
                        {/* Input de cantidad con validaciones */}
                        <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                            className={styles.quantityInput}
                            min="1"
                            max={productInfo.stock}
                            aria-label="Cantidad del producto"
                        />
                        <IconButton
                            icon="add"
                            onClick={() => handleQuantityChange(item.cantidad + 1)}
                            disabled={isUpdating || !canAddMore}
                            ariaLabel="Aumentar cantidad"
                            variant="outline"
                            size="sm"
                            className={styles.quantityButton}
                        />
                    </div>
                    {/* Botón para eliminar el item del carrito */}
                    <IconButton
                        icon="delete"
                        onClick={handleRemoveItem}
                        disabled={isUpdating}
                        ariaLabel="Eliminar item del carrito"
                        className={styles.removeButton}
                        size="sm"
                    />

                </div>
                {/* Indicador de stock máximo alcanzado */}
                {!canAddMore && (
                    <div className={styles.stockWarning}>
                        <span className="material-icons">info</span>
                        <span>Stock máximo alcanzado ({productInfo.stock})</span>
                    </div>
                )}
            </div>
        </div>
    );
};

CartItemCard.displayName = 'CartItemCard';

export default CartItemCard;
