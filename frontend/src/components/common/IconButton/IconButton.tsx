import React from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps {
    icon: string;
    onClick?: () => void;
    ariaLabel: string;
    className?: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'ghost' | 'default';
    size?: 'small' | 'medium' | 'large';
    children?: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onClick,
    ariaLabel,
    className = '',
    disabled = false,
    variant = 'default',
    size = 'medium',
    children
}) => (
    <button
        className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${className}`}
        onClick={onClick}
        aria-label={ariaLabel}
        disabled={disabled}
    >
        <span className="material-icons">{icon}</span>
        {children}
    </button>
);

export default IconButton; 