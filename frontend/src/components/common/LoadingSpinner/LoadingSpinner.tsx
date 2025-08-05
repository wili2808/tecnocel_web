import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    className = ''
}) => {
    return (
        <div className={`${styles.loadingContainer} ${className}`}>
            <div className={`${styles.spinner} ${styles[size]}`}></div>
            {text && <span className={styles.loadingText}>{text}</span>}
        </div>
    );
};

export default LoadingSpinner;