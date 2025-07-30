import React, { useState } from 'react';
import styles from './ProductImage.module.css';

interface ProductImageProps {
    src?: string | null;
    alt: string;
    className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ src, alt, className }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    const imageSource = imageError ? '/placeholder.svg' : (src || '/placeholder.svg');

    return (
        <div className={`${styles.imageContainer} ${className || ''}`}>
            <img
                src={imageSource}
                alt={alt}
                className={styles.productImage}
                onError={handleImageError}
                loading="lazy"
            />
        </div>
    );
};

export default ProductImage; 