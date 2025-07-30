import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '../../hooks';
import ProductImage from '../../components/product/ProductImage';
import ProductInfo from '../../components/product/ProductInfo';
import ProductActions from '../../components/product/ProductActions';
import ProductFeatures from '../../components/product/ProductFeatures';
import ProductComments from '../../components/product/ProductComments';
import styles from './ProductPage.module.css';

const ProductPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const productId = id ? parseInt(id, 10) : 0;

    const { product, loading, error, refetch } = useProduct(productId);

    // Manejar casos de error
    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <div className={styles.errorIcon}>
                        <span className="material-icons">error_outline</span>
                    </div>
                    <h2 className={styles.errorTitle}>Producto no encontrado</h2>
                    <p className={styles.errorMessage}>
                        Lo sentimos, el producto que buscas no existe o no está disponible.
                    </p>
                    <div className={styles.errorActions}>
                        <button onClick={() => navigate('/productos')} className={styles.primaryButton}>
                            <span className="material-icons">storefront</span>
                            Ver catálogo
                        </button>
                        <button onClick={refetch} className={styles.secondaryButton}>
                            <span className="material-icons">refresh</span>
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Manejar estado de carga
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Cargando producto...</p>
                </div>
            </div>
        );
    }

    // Si no hay producto después de la carga
    if (!product) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <div className={styles.errorIcon}>
                        <span className="material-icons">inventory_2</span>
                    </div>
                    <h2 className={styles.errorTitle}>Producto no encontrado</h2>
                    <p className={styles.errorMessage}>
                        El producto que buscas no existe o ha sido removido del catálogo.
                    </p>
                    <button onClick={() => navigate('/productos')} className={styles.primaryButton}>
                        <span className="material-icons">storefront</span>
                        Ver catálogo
                    </button>
                </div>
            </div>
        );
    }

    const isOutOfStock = product.stock === 0;

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
                        <ProductImage
                            src={product.imagen_url}
                            alt={`Imagen de ${product.nombre}`}
                        />
                    </div>

                    <div className={styles.productInfoSection}>
                        <ProductInfo product={product} />
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