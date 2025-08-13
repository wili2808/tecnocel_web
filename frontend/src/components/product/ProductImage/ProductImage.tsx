import React, { useState, useEffect } from 'react';
import styles from './ProductImage.module.css';

import type { ImageData } from '../../../types/product';

interface ProductImageProps {
    images?: ImageData[];
    defaultImage?: string | null;
    alt: string;
    className?: string;
    showThumbnails?: boolean;
    onImageChange?: (imageUrl: string) => void;
}

const ProductImage: React.FC<ProductImageProps> = ({
    images = [],
    defaultImage,
    alt,
    className,
    showThumbnails = false,
    onImageChange
}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Ordenar imágenes: principales primero, luego por orden
    const sortedImages = [...images].sort((a, b) => {
        if (a.es_principal && !b.es_principal) return -1;
        if (!a.es_principal && b.es_principal) return 1;
        return (a.orden || 0) - (b.orden || 0);
    });

    // Imagen actual o fallback
    const currentImage = imageError || sortedImages.length === 0
        ? (defaultImage || '')
        : sortedImages[currentImageIndex].url;

    useEffect(() => {
        // Precargar la siguiente imagen si existe
        if (sortedImages.length > currentImageIndex + 1) {
            const nextImage = new Image();
            nextImage.src = sortedImages[currentImageIndex + 1].url;
        }
    }, [currentImageIndex, sortedImages]);

    const handleImageError = () => {
        // ✅ Solo log de error cuando realmente falla, no en cada render
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Error al cargar imagen: ${currentImage}`);
        }
        setImageError(true);
        setIsLoading(false);
    };

    const handleImageLoad = () => {
        // ✅ Solo actualizar estado, sin logs problemáticos
        setIsLoading(false);
    };

    const handleImageChange = (index: number) => {
        setCurrentImageIndex(index);
        if (onImageChange) {
            onImageChange(sortedImages[index].url);
        }
    };

    const handlePrevImage = () => {
        setCurrentImageIndex(prev =>
            prev > 0 ? prev - 1 : sortedImages.length - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex(prev =>
            prev < sortedImages.length - 1 ? prev + 1 : 0
        );
    };

    return (
        <div className={`${styles.imageContainer} ${className || ''}`}>
            {/* Imagen principal */}
            <div className={styles.mainImageContainer}>
                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingSpinner} />
                    </div>
                )}
                <img
                    src={currentImage}
                    alt={sortedImages[currentImageIndex]?.alt_text || alt}
                    className={`${styles.productImage} ${isLoading ? styles.loading : ''}`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    loading="lazy"
                />

                {/* Controles de navegación */}
                {sortedImages.length > 1 && (
                    <>
                        <button
                            className={`${styles.navButton} ${styles.prevButton}`}
                            onClick={handlePrevImage}
                            aria-label="Imagen anterior"
                        >
                            ‹
                        </button>
                        <button
                            className={`${styles.navButton} ${styles.nextButton}`}
                            onClick={handleNextImage}
                            aria-label="Siguiente imagen"
                        >
                            ›
                        </button>
                    </>
                )}
            </div>

            {/* Miniaturas */}
            {showThumbnails && sortedImages.length > 1 && (
                <div className={styles.thumbnailContainer}>
                    {sortedImages.map((image, index) => (
                        <button
                            key={`thumb-${index}`}
                            className={`${styles.thumbnail} ${index === currentImageIndex ? styles.activeThumbnail : ''
                                }`}
                            onClick={() => handleImageChange(index)}
                            aria-label={`Ver imagen ${index + 1}`}
                        >
                            <img
                                src={image.url}
                                alt={`Miniatura ${index + 1}`}
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductImage;