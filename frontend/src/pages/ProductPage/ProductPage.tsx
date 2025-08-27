/**
 * Página ProductPage - Vista detallada de un producto individual
 * Muestra información completa del producto con imágenes, detalles, acciones y comentarios
 * Incluye navegación breadcrumb y manejo de estado del producto
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductActions } from '../../hooks/useProductActions';
import ProductImage from '../../components/product/ProductImage';
import ProductInfo from '../../components/product/ProductInfo';
import ProductActions from '../../components/product/ProductActions';
import ProductFeatures from '../../components/product/ProductFeatures';
import ProductComments from '../../components/product/ProductComments';
import OfferIndicator from '../../components/product/OfferIndicator';
import FavoriteButtonReusable from '../../components/product/FavoriteButtonReusable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './ProductPage.module.css';

const ProductPage: React.FC = () => {
    // ============================================================================
    // PARÁMETROS Y ESTADOS
    // ============================================================================
    const { id } = useParams<{ id: string }>();
    const productId = parseInt(id || '0', 10);

    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================
    const {
        currentProduct: product,
        productsLoading: loading,
        productsError: error,
        loadProduct,
        forceClearProductState
    } = useProductActions();

    // ============================================================================
    // ESTADOS LOCALES
    // ============================================================================
    const [isOutOfStock, setIsOutOfStock] = useState(false);
    const [hasLoadedProduct, setHasLoadedProduct] = useState<number | null>(null);

    // ============================================================================
    // EFECTOS Y CICLO DE VIDA
    // ============================================================================

    /**
     * Cargar producto al montar el componente o cambiar ID - CONTROLADO
     * Evita cargas innecesarias y mantiene el estado sincronizado
     */
    useEffect(() => {
        if (productId > 0 && hasLoadedProduct !== productId) {
            // ✅ FORZAR LIMPIEZA COMPLETA antes de cargar nuevo producto
            forceClearProductState();

            // ✅ SOLO cargar si es un producto diferente al ya cargado
            setHasLoadedProduct(productId);
            loadProduct(productId);
        }
    }, [productId, hasLoadedProduct, loadProduct, forceClearProductState]);

    /**
     * ✅ LIMPIAR ESTADO cuando se desmonte el componente
     * Previene memory leaks y mantiene el estado limpio
     */
    useEffect(() => {
        return () => {
            // Limpiar estado al desmontar
            if (process.env.NODE_ENV === 'development') {
                console.log('🧹 ProductPage desmontado, limpiando estado');
            }
            // ✅ LIMPIEZA MANUAL: Solo limpiar el producto actual
            // No llamar clearProductState() para evitar bucles infinitos
        };
    }, []); // ✅ Sin dependencias para evitar bucles

    /**
     * Actualizar estado local cuando cambia el producto
     * Incluye logs de desarrollo para debugging de ofertas
     */
    useEffect(() => {
        if (product) {
            setIsOutOfStock(product.stock === 0);

            // Log de desarrollo para verificar datos de ofertas
            if (process.env.NODE_ENV === 'development') {
                console.log('🛍️ ProductPage - Datos del producto:', {
                    nombre: product.nombre,
                    precio_venta: product.precio_venta,
                    precio_oferta: product.precio_oferta,
                    descuento_porcentaje: product.descuento_porcentaje,
                    en_oferta: product.en_oferta,
                    ofertas: product.ofertas?.length || 0,
                    hasDiscount: product.precio_oferta && product.precio_oferta < Number(product.precio_venta)
                });
            }
        }
    }, [product]);

    // ============================================================================
    // ESTADOS DE CARGA Y ERROR
    // ============================================================================

    // Mostrar spinner de carga mientras se obtiene el producto
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p className={styles.loadingText}>Cargando producto...</p>
            </div>
        );
    }

    // Mostrar mensaje de error si falla la carga
    if (error || !product) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <span className="material-icons">error_outline</span>
                    <h2>Error al cargar el producto</h2>
                    <p>{error || 'No se pudo cargar la información del producto.'}</p>
                    <Link to="/productos" className={styles.backButton}>
                        <span className="material-icons">arrow_back</span>
                        Volver al catálogo
                    </Link>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDERIZADO PRINCIPAL
    // ============================================================================

    return (
        <div className={styles.productPage}>
            {/* Contenido principal de la página del producto */}
            <div className={styles.productContent}>
                {/* Navegación breadcrumb para orientación del usuario */}
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                    <Link to="/" className={styles.breadcrumbLink}>
                        <span className="material-icons">home</span>
                        Inicio
                    </Link>
                    <span className={styles.breadcrumbSeparator}>
                        <span className="material-icons">chevron_right</span>
                    </span>
                    <Link to="/productos" className={styles.breadcrumbLink}>
                        Productos
                    </Link>
                    <span className={styles.breadcrumbSeparator}>
                        <span className="material-icons">chevron_right</span>
                    </span>
                    {/* Categoría del producto si existe */}
                    {product.Categoria && (
                        <>
                            <span className={styles.breadcrumbItem}>{product.Categoria.nombre_categoria}</span>
                            <span className={styles.breadcrumbSeparator}>
                                <span className="material-icons">chevron_right</span>
                            </span>
                        </>
                    )}
                    {/* Nombre del producto actual */}
                    <span className={styles.breadcrumbCurrent}>{product.nombre}</span>
                </nav>

                {/* Sección principal del producto con imagen, info y acciones */}
                <section className={styles.productMainSection}>
                    {/* Sección de imagen del producto */}
                    <div className={styles.productImageSection}>
                        <div className={styles.imageContainer}>
                            {/* Botón de favoritos - Posicionado en esquina superior derecha */}
                            <div className={styles.favoriteButtonContainer}>
                                <FavoriteButtonReusable
                                    productId={product.id_producto}
                                    productName={product.nombre}
                                    size="medium"
                                    showText={false}
                                    position="static"
                                    variant="outlined"
                                />
                            </div>
                            {/* Galería de imágenes del producto */}
                            <ProductImage
                                images={product.imagenes || []}
                                defaultImage={product.imagen_url}
                                alt={product.nombre}
                                mode="gallery"
                            />

                            {/* Indicador de oferta reutilizable - Posicionado en esquina superior izquierda */}
                            {(product.en_oferta ||
                                (product.precio_oferta && product.precio_oferta < Number(product.precio_venta)) ||
                                (product.ofertas && product.ofertas.length > 0)) && (
                                    <OfferIndicator
                                        descuentoPorcentaje={
                                            product.descuento_porcentaje ||
                                            (product.precio_oferta && product.precio_venta ?
                                                Math.round(((Number(product.precio_venta) - product.precio_oferta) / Number(product.precio_venta)) * 100) : 0)
                                        }
                                        size="large"
                                        position="top-left"
                                        showLabel={true}
                                    />
                                )}
                        </div>
                    </div>

                    {/* Sección de información del producto */}
                    <div className={styles.productInfoSection}>
                        <div className={styles.productHeader}>
                            {/* Información detallada del producto */}
                            <ProductInfo product={product} />

                        </div>
                    </div>

                    {/* Sección de acciones del producto (cantidad, agregar al carrito, comprar) */}
                    <div className={styles.productActionsSection}>

                        <ProductActions
                            productId={product.id_producto}
                            productName={product.nombre}
                            stock={product.stock}
                            isOutOfStock={isOutOfStock}
                        />
                    </div>
                </section>

                {/* Sección de características técnicas del producto */}
                <section className={styles.productDetailsSection}>
                    <ProductFeatures product={product} />
                </section>

                {/* Sección de comentarios y reseñas del producto */}
                <section className={styles.productCommentsSection}>
                    <ProductComments
                        productId={product.id_producto}
                        productName={product.nombre}
                    />
                </section>

                {/* Botón para volver al catálogo de productos */}
                <div className={styles.backToProducts}>
                    <Link to="/productos" className={styles.backButton}>
                        <span className="material-icons">arrow_back</span>
                        Volver al catálogo
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductPage; 