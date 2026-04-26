/**
 * Página ProductPage - Vista detallada de un producto individual
 * Muestra información completa del producto con imágenes, detalles, acciones y comentarios
 */
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import { useProductActions } from '../../hooks/useProductActions';
import ProductImage from '../../components/product/ProductImage';
import ProductInfo from '../../components/product/ProductInfo';
import ProductActions from '../../components/product/ProductActions';
import ProductFeatures from '../../components/product/ProductFeatures';
import ProductComments from '../../components/product/ProductComments';
import OfferIndicator from '../../components/product/OfferIndicator';
import FavoriteButtonReusable from '../../components/product/FavoriteButtonReusable';
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
    const abortControllerRef = useRef<AbortController | null>(null);
    // Refs para evitar que funciones inestables del contexto causen re-renders en el efecto
    const loadProductRef = useRef(loadProduct);
    const forceClearRef = useRef(forceClearProductState);
    loadProductRef.current = loadProduct;
    forceClearRef.current = forceClearProductState;

    // Solo se dispara cuando cambia el productId — no depende de funciones del contexto
    useEffect(() => {
        if (productId <= 0) return;

        // Cancelar la request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        forceClearRef.current();
        loadProductRef.current(productId, signal);

        // Limpiar al desmontar el componente
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [productId]);

    useEffect(() => {
        return () => {
            if (import.meta.env.DEV) {
                console.log('🧹 ProductPage desmontado');
            }
        };
    }, []);

    useEffect(() => {
        if (product) {
            setIsOutOfStock(product.stock === 0);
            if (import.meta.env.DEV) {
                console.log('🛍️ ProductPage - Producto:', {
                    nombre: product.nombre,
                    en_oferta: product.en_oferta,
                    precio_oferta: product.precio_oferta,
                });
            }
        }
    }, [product]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Cargando producto...</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <div className={styles.errorIcon}>
                        <span className="material-icons">error_outline</span>
                    </div>
                    <h2 className={styles.errorTitle}>Producto no encontrado</h2>
                    <p className={styles.errorMessage}>{error || 'No se pudo cargar la información del producto.'}</p>
                    <div className={styles.errorActions}>
                        <Link to="/productos" className={styles.primaryButton}>
                            <span className="material-icons">arrow_back</span>
                            Ver catálogo
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const hasOffer = product.en_oferta ||
        (product.precio_oferta && product.precio_oferta < Number(product.precio_venta)) ||
        (product.ofertas && product.ofertas.length > 0);

    const descuentoPorcentaje = product.descuento_porcentaje ||
        (product.precio_oferta && product.precio_venta
            ? Math.round(((Number(product.precio_venta) - product.precio_oferta) / Number(product.precio_venta)) * 100)
            : 0);

    const productImage = product.imagenes?.[0]?.url_imagen || product.imagen_url || undefined;
    const productPrice = product.precio_final ?? Number(product.precio_venta);
    const productDescription = product.descripcion
        ? product.descripcion.slice(0, 155)
        : `Comprá ${product.nombre} en TecnoCel. Precio: $${productPrice.toLocaleString('es-AR')}. Envío rápido y garantía oficial en Argentina.`;

    return (
        <div className={styles.productPage}>
            <PageMeta
                title={product.nombre}
                description={productDescription}
                image={productImage}
                url={`/productos/${id}`}
            />
            <div className={styles.productContent}>

                {/* Breadcrumb */}
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                    <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
                    <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
                    <Link to="/productos" className={styles.breadcrumbLink}>Productos</Link>
                    {product.Categoria && (
                        <>
                            <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
                            <span className={styles.breadcrumbItem}>{product.Categoria.nombre_categoria}</span>
                        </>
                    )}
                    <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
                    <span className={styles.breadcrumbCurrent}>{product.nombre}</span>
                </nav>

                {/* Sección principal: imagen | info + acciones */}
                <section className={styles.productMainSection}>

                    {/* Columna izquierda — galería */}
                    <div className={styles.imageColumn}>
                        <div className={styles.imageWrapper}>
                            {hasOffer && (
                                <div className={styles.offerBadgeWrap}>
                                    <OfferIndicator
                                        descuentoPorcentaje={descuentoPorcentaje}
                                        size="large"
                                        position="top-left"
                                        showLabel={true}
                                    />
                                </div>
                            )}
                            <div className={styles.favoriteBadgeWrap}>
                                <FavoriteButtonReusable
                                    productId={product.id_producto}
                                    productName={product.nombre}
                                    size="medium"
                                    showText={false}
                                    position="absolute"
                                    variant="outlined"
                                />
                            </div>
                            <ProductImage
                                images={product.imagenes || []}
                                defaultImage={product.imagen_url}
                                alt={product.nombre}
                                mode="gallery"
                            />
                        </div>
                    </div>

                    {/* Columna derecha — info + acciones */}
                    <div className={styles.detailColumn}>
                        <ProductInfo product={product} />

                        <div className={styles.actionsWrap}>
                            <ProductActions
                                productId={product.id_producto}
                                productName={product.nombre}
                                stock={product.stock}
                                isOutOfStock={isOutOfStock}
                            />
                        </div>
                    </div>
                </section>

                {/* Especificaciones técnicas */}
                {((product.productosCaracteristicas?.length ?? 0) > 0 || (product.caracteristicas?.length ?? 0) > 0) && (
                    <section className={styles.featuresSection}>
                        <ProductFeatures product={product} />
                    </section>
                )}

                {/* Comentarios y reseñas */}
                <section className={styles.commentsSection}>
                    <ProductComments
                        productId={product.id_producto}
                        productName={product.nombre}
                    />
                </section>

                {/* Volver al catálogo */}
                <div className={styles.backRow}>
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
