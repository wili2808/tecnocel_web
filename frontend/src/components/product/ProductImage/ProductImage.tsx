/**
 * ProductImage — Galería de imágenes del producto
 * Muestra imagen principal con navegación y tira de thumbnails
 */
import React, { useState, useEffect } from 'react';
import styles from './ProductImage.module.css';
import type { ImageData } from '../../../types';

interface ProductImageProps {
    images?: ImageData[];
    defaultImage?: string | null;
    alt: string;
    className?: string;
    mode?: 'simple' | 'gallery';
}

const ProductImage: React.FC<ProductImageProps> = ({
    images = [],
    defaultImage,
    alt,
    className,
    mode = 'simple'
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sortedImages = [...images].sort((a, b) => {
        if (a.es_principal && !b.es_principal) return -1;
        if (!a.es_principal && b.es_principal) return 1;
        return (a.orden || 0) - (b.orden || 0);
    });

    const currentImage = imageError || sortedImages.length === 0
        ? (defaultImage || '')
        : sortedImages[currentIndex].url;

    // Precargar siguiente imagen
    useEffect(() => {
        if (mode === 'gallery' && sortedImages.length > currentIndex + 1) {
            const next = new Image();
            next.src = sortedImages[currentIndex + 1].url;
        }
    }, [currentIndex, sortedImages, mode]);

    const handleImageError = () => {
        setImageError(true);
        setIsLoading(false);
    };

    const handleImageLoad = () => setIsLoading(false);

    const handlePrev = () => {
        setIsLoading(true);
        setCurrentIndex(prev => prev > 0 ? prev - 1 : sortedImages.length - 1);
    };

    const handleNext = () => {
        setIsLoading(true);
        setCurrentIndex(prev => prev < sortedImages.length - 1 ? prev + 1 : 0);
    };

    const handleThumbnailClick = (index: number) => {
        if (index !== currentIndex) {
            setIsLoading(true);
            setCurrentIndex(index);
        }
    };

    const showGalleryControls = mode === 'gallery' && sortedImages.length > 1;

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
                    alt={sortedImages[currentIndex]?.alt_text || alt}
                    className={`${styles.productImage} ${isLoading ? styles.imageHidden : ''}`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    loading="lazy"
                />

                {showGalleryControls && (
                    <>
                        <button
                            className={`${styles.navButton} ${styles.prevButton}`}
                            onClick={handlePrev}
                            aria-label="Imagen anterior"
                        >
                            <span className="material-icons">chevron_left</span>
                        </button>
                        <button
                            className={`${styles.navButton} ${styles.nextButton}`}
                            onClick={handleNext}
                            aria-label="Siguiente imagen"
                        >
                            <span className="material-icons">chevron_right</span>
                        </button>
                    </>
                )}
            </div>

            {/* Tira de thumbnails */}
            {showGalleryControls && (
                <div className={styles.thumbnailStrip} role="list" aria-label="Galería de imágenes">
                    {sortedImages.map((img, idx) => (
                        <button
                            key={idx}
                            role="listitem"
                            className={`${styles.thumbnailButton} ${idx === currentIndex ? styles.thumbnailActive : ''}`}
                            onClick={() => handleThumbnailClick(idx)}
                            aria-label={`Ver imagen ${idx + 1}`}
                            aria-current={idx === currentIndex ? 'true' : undefined}
                        >
                            <img
                                src={img.url}
                                alt={img.alt_text || `${alt} ${idx + 1}`}
                                className={styles.thumbnailImage}
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
