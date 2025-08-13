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
    const { id } = useParams<{ id: string }>();
    const productId = parseInt(id || '0', 10);
    const { 
        currentProduct: product, 
        productsLoading: loading, 
        productsError: error,
        loadProduct,
        forceClearProductState
    } = useProductActions();
    const [isOutOfStock, setIsOutOfStock] = useState(false);
    const [hasLoadedProduct, setHasLoadedProduct] = useState<number | null>(null);

    // Cargar producto al montar el componente o cambiar ID - CONTROLADO
    useEffect(() => {
        if (productId > 0 && hasLoadedProduct !== productId) {
            // ✅ FORZAR LIMPIEZA COMPLETA antes de cargar nuevo producto
            forceClearProductState();
            
            // ✅ SOLO cargar si es un producto diferente al ya cargado
            setHasLoadedProduct(productId);
            loadProduct(productId);
        }
    }, [productId, hasLoadedProduct, loadProduct, forceClearProductState]);

    // ✅ LIMPIAR ESTADO cuando se desmonte el componente
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

    useEffect(() => {
        if (product) {
            setIsOutOfStock(product.stock === 0);
        }
    }, [product]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p className={styles.loadingText}>Cargando producto...</p>
            </div>
        );
    }

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

    return (
        <div className={styles.productPage}>
            {/* Breadcrumb */}
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
                {product.Categoria && (
                    <>
                        <span className={styles.breadcrumbItem}>{product.Categoria.nombre_categoria}</span>
                        <span className={styles.breadcrumbSeparator}>
                            <span className="material-icons">chevron_right</span>
                        </span>
                    </>
                )}
                <span className={styles.breadcrumbCurrent}>{product.nombre}</span>
            </nav>

            {/* Contenido principal */}
            <div className={styles.productContent}>
                {/* Sección principal del producto */}
                <section className={styles.productMainSection}>
                    <div className={styles.productImageSection}>
                        <div className={styles.imageContainer}>
                            <ProductImage
                                images={product.imagenes || []}
                                defaultImage={product.imagen_url}
                                alt={product.nombre}
                                showThumbnails={true}
                            />
                            {/* Indicador de oferta reutilizable */}
                            {product.en_oferta && product.descuento_porcentaje && (
                                <OfferIndicator
                                    descuentoPorcentaje={product.descuento_porcentaje}
                                    size="large"
                                    position="top-left"
                                    showLabel={true}
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.productInfoSection}>
                        <div className={styles.productHeader}>
                            <ProductInfo product={product} />
                            <div className={styles.favoriteButtonContainer}>
                                <FavoriteButtonReusable
                                    productId={product.id_producto}
                                    productName={product.nombre}
                                    size="large"
                                    showText={false}
                                    position="static"
                                    variant="outlined"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.productActionsSection}>
                        <ProductActions
                            productId={product.id_producto}
                            productName={product.nombre}
                            stock={product.stock}
                            isOutOfStock={isOutOfStock}
                        />
                    </div>
                </section>

                {/* Sección de características */}
                <section className={styles.productDetailsSection}>
                    <ProductFeatures product={product} />
                </section>

                {/* Sección de comentarios */}
                <section className={styles.productCommentsSection}>
                    <ProductComments
                        productId={product.id_producto}
                        productName={product.nombre}
                    />
                </section>

                {/* Botón para volver */}
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