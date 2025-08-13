/**
 * Componente ProductImage - Visualización de imágenes del producto
 * Maneja la galería de imágenes con navegación, miniaturas y estados de carga
 * Incluye precarga de imágenes y manejo de errores para mejor UX
 */
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
        if (sortedImages.length > currentImageIndex + 1) {
            const nextImage = new Image();
            nextImage.src = sortedImages[currentImageIndex + 1].url;
        }
    }, [currentImageIndex, sortedImages]);

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
     * Cambia la imagen actual y notifica al componente padre
     * Permite sincronización con otros componentes
     */
    const handleImageChange = (index: number) => {
        setCurrentImageIndex(index);
        if (onImageChange) {
            onImageChange(sortedImages[index].url);
        }
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

                {/* Controles de navegación - Solo visibles si hay múltiples imágenes */}
                {sortedImages.length > 1 && (
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
                    </>
                )}
            </div>

            {/* Galería de miniaturas - Solo visible si está habilitada y hay múltiples imágenes */}
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