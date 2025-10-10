/**
 * Componente ProductImage - Visualización de imágenes del producto
 * Maneja la galería de imágenes con navegación y estados de carga
 * Incluye precarga de imágenes y manejo de errores para mejor UX
 */
import React, { useState, useEffect } from 'react';
import styles from './ProductImage.module.css';

import type { ImageData } from '../../../types';

interface ProductImageProps {
    images?: ImageData[];
    defaultImage?: string | null;
    alt: string;
    className?: string;
    mode?: 'simple' | 'gallery'; // 'simple': solo imagen principal, 'gallery': galería completa
}

const ProductImage: React.FC<ProductImageProps> = ({
    images = [],
    defaultImage,
    alt,
    className,
    mode = 'simple'
}) => {
    // ============================================================================
    // ESTADOS LOCALES
    // ============================================================================
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ============================================================================
    // CÁLCULOS Y PREPARACIÓN DE DATOS
    // ============================================================================

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

    // ============================================================================
    // EFECTOS Y PRECARGA
    // ============================================================================

    /**
     * Precarga la siguiente imagen para navegación fluida
     * Mejora la experiencia del usuario al cambiar entre imágenes
     */
    useEffect(() => {
        if (mode === 'gallery' && sortedImages.length > currentImageIndex + 1) {
            const nextImage = new Image();
            nextImage.src = sortedImages[currentImageIndex + 1].url;
        }
    }, [currentImageIndex, sortedImages, mode]);

    // ============================================================================
    // MANEJADORES DE EVENTOS
    // ============================================================================

    /**
     * Maneja errores de carga de imagen
     * Establece fallback y registra error solo en desarrollo
     */
    const handleImageError = () => {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Error al cargar imagen: ${currentImage}`);
        }
        setImageError(true);
        setIsLoading(false);
    };

    /**
     * Maneja la carga exitosa de imagen
     * Oculta el indicador de carga
     */
    const handleImageLoad = () => {
        setIsLoading(false);
    };

    /**
     * Navega a la imagen anterior
     * Implementa navegación circular (última -> primera)
     */
    const handlePrevImage = () => {
        setCurrentImageIndex(prev =>
            prev > 0 ? prev - 1 : sortedImages.length - 1
        );
    };

    /**
     * Navega a la siguiente imagen
     * Implementa navegación circular (última -> primera)
     */
    const handleNextImage = () => {
        setCurrentImageIndex(prev =>
            prev < sortedImages.length - 1 ? prev + 1 : 0
        );
    };

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={`${styles.imageContainer} ${className || ''}`}>
            {/* Contenedor de imagen principal con controles de navegación */}
            <div className={styles.mainImageContainer}>
                {/* Overlay de carga mientras se procesa la imagen */}
                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingSpinner} />
                    </div>
                )}

                {/* Imagen principal del producto */}
                <img
                    src={currentImage}
                    alt={sortedImages[currentImageIndex]?.alt_text || alt}
                    className={`${styles.productImage} ${isLoading ? styles.loading : ''}`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    loading="lazy"
                />

                {/* Controles de navegación - Solo visibles en modo galería y si hay múltiples imágenes */}
                {mode === 'gallery' && sortedImages.length > 1 && (
                    <>
                        {/* Botón de imagen anterior */}
                        <button
                            className={`${styles.navButton} ${styles.prevButton}`}
                            onClick={handlePrevImage}
                            aria-label="Imagen anterior"
                        >
                            ‹
                        </button>

                        {/* Botón de siguiente imagen */}
                        <button
                            className={`${styles.navButton} ${styles.nextButton}`}
                            onClick={handleNextImage}
                            aria-label="Siguiente imagen"
                        >
                            ›
                        </button>

                        {/* Indicador de múltiples imágenes */}
                        <div className={styles.imageCounter}>
                            {currentImageIndex + 1} / {sortedImages.length}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductImage;