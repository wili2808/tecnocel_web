/**
 * ProductImage — Galería de imágenes del producto
 * Muestra imagen principal con navegación y tira de thumbnails
 * Incluye swipe táctil con Framer Motion para navegación entre imágenes
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import styles from './ProductImage.module.css';
import type { ImageData } from '../../../types';

interface ProductImageProps {
    images?: ImageData[];
    defaultImage?: string | null;
    alt: string;
    className?: string;
    mode?: 'simple' | 'gallery';
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
        transition: {
            x: { type: 'spring' as const, stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
        },
    },
    exit: (direction: number) => ({
        x: direction > 0 ? '-100%' : '100%',
        opacity: 0,
        transition: {
            x: { type: 'spring' as const, stiffness: 300, damping: 30 },
            opacity: { duration: 0.15 },
        },
    }),
};

const ProductImage: React.FC<ProductImageProps> = ({
    images = [],
    defaultImage,
    alt,
    className,
    mode = 'simple'
}) => {
    const isSimpleMode = mode === 'simple';
    const isGalleryMode = mode === 'gallery';
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sortedImages = [...images].sort((a, b) => {
        if (a.es_principal && !b.es_principal) return -1;
        if (!a.es_principal && b.es_principal) return 1;
        return (a.orden || 0) - (b.orden || 0);
    });

    const totalImages = sortedImages.length;
    const currentImage = imageError || totalImages === 0
        ? (defaultImage || '')
        : sortedImages[currentIndex].url;

    // Precargar todas las imágenes en modo galería para swipe instantáneo
    useEffect(() => {
        if (mode === 'gallery') {
            sortedImages.forEach(img => {
                const preload = new Image();
                preload.src = img.url;
            });
        }
    }, [mode, sortedImages]);

    const handleImageError = () => {
        setImageError(true);
        setIsLoading(false);
    };

    const handleImageLoad = () => setIsLoading(false);

    const handlePrev = useCallback(() => {
        if (totalImages <= 1) return;
        setDirection(-1);
        setCurrentIndex(prev => prev > 0 ? prev - 1 : totalImages - 1);
    }, [totalImages]);

    const handleNext = useCallback(() => {
        if (totalImages <= 1) return;
        setDirection(1);
        setCurrentIndex(prev => prev < totalImages - 1 ? prev + 1 : 0);
    }, [totalImages]);

    const handleDragEnd = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 60;
        if (info.offset.x < -swipeThreshold) handleNext();
        else if (info.offset.x > swipeThreshold) handlePrev();
    }, [handleNext, handlePrev]);

    const handleThumbnailClick = (index: number) => {
        if (index !== currentIndex) {
            setDirection(index > currentIndex ? 1 : -1);
            setCurrentIndex(index);
        }
    };

    const showGalleryControls = mode === 'gallery' && sortedImages.length > 1;

    return (
        <div className={`${styles.imageContainer} ${className || ''}`}>
            {/* Imagen principal */}
            <div
                className={`${styles.mainImageContainer} ${isSimpleMode ? styles.simpleMainImageContainer : ''} ${isGalleryMode ? styles.galleryMainImageContainer : ''}`}
            >
                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingSpinner} />
                    </div>
                )}

                {showGalleryControls ? (
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className={styles.motionTrack}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.12}
                            onDragEnd={handleDragEnd}
                        >
                            <img
                                src={currentImage}
                                alt={sortedImages[currentIndex]?.alt_text || alt}
                                className={`${styles.productImage} ${isLoading ? styles.imageHidden : ''}`}
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                                loading="lazy"
                            />
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <img
                        src={currentImage}
                        alt={sortedImages[currentIndex]?.alt_text || alt}
                        className={`${styles.productImage} ${isLoading ? styles.imageHidden : ''}`}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        loading="lazy"
                    />
                )}

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
                            className={`${styles.thumbnailButton} ${isGalleryMode ? styles.galleryThumbnailButton : ''} ${idx === currentIndex ? styles.thumbnailActive : ''}`}
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
