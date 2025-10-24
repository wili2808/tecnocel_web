import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMail, FiPhone, FiShoppingCart } from 'react-icons/fi';
import styles from './CTASection.module.css';

/**
 * Props para el componente CTASection
 */
interface CTASectionProps {
    /** Título principal del CTA */
    title: string;
    /** Descripción o subtítulo del CTA */
    description: string;
    /** Texto del botón principal */
    buttonText: string;
    /** Ruta o URL del botón principal */
    buttonLink: string;
    /** Variante visual del CTA */
    variant?: 'primary' | 'secondary' | 'accent' | 'gradient';
    /** Icono a mostrar en el botón (opcional) */
    icon?: 'arrow' | 'cart' | 'mail' | 'phone' | 'none';
    /** Texto del botón secundario (opcional) */
    secondaryButtonText?: string;
    /** Ruta del botón secundario (opcional) */
    secondaryButtonLink?: string;
    /** Si el enlace es externo */
    external?: boolean;
    /** Clases CSS adicionales */
    className?: string;
}

/**
 * CTASection - Componente de Call To Action optimizado
 *
 * Sección estratégica diseñada para convertir visitantes en clientes
 * mediante una acción específica y directa.
 *
 * @component
 * @example
 * ```tsx
 * <CTASection
 *   title="¿Listo para mejorar tu tecnología?"
 *   description="Contáctanos para una cotización personalizada"
 *   buttonText="Solicitar Cotización"
 *   buttonLink="/contacto"
 *   variant="gradient"
 *   icon="arrow"
 * />
 * ```
 */
export const CTASection: React.FC<CTASectionProps> = ({
    title,
    description,
    buttonText,
    buttonLink,
    variant = 'primary',
    icon = 'arrow',
    secondaryButtonText,
    secondaryButtonLink,
    external = false,
    className = ''
}) => {
    // Selección de icono
    const renderIcon = () => {
        switch (icon) {
            case 'cart':
                return <FiShoppingCart className={styles.buttonIcon} />;
            case 'mail':
                return <FiMail className={styles.buttonIcon} />;
            case 'phone':
                return <FiPhone className={styles.buttonIcon} />;
            case 'arrow':
                return <FiArrowRight className={styles.buttonIcon} />;
            default:
                return null;
        }
    };

    // Props para enlaces externos
    const externalProps = external ? {
        target: '_blank',
        rel: 'noopener noreferrer'
    } : {};

    // Renderizar botón principal
    const renderPrimaryButton = () => {
        const content = (
            <>
                <span>{buttonText}</span>
                {renderIcon()}
            </>
        );

        if (external) {
            return (
                <a
                    href={buttonLink}
                    className={`${styles.button} ${styles.primary}`}
                    {...externalProps}
                >
                    {content}
                </a>
            );
        }

        return (
            <Link
                to={buttonLink}
                className={`${styles.button} ${styles.primary}`}
            >
                {content}
            </Link>
        );
    };

    // Renderizar botón secundario (opcional)
    const renderSecondaryButton = () => {
        if (!secondaryButtonText || !secondaryButtonLink) return null;

        if (external) {
            return (
                <a
                    href={secondaryButtonLink}
                    className={`${styles.button} ${styles.secondary}`}
                    {...externalProps}
                >
                    {secondaryButtonText}
                </a>
            );
        }

        return (
            <Link
                to={secondaryButtonLink}
                className={`${styles.button} ${styles.secondary}`}
            >
                {secondaryButtonText}
            </Link>
        );
    };

    return (
        <section
            className={`${styles.ctaSection} ${styles[variant]} ${className}`}
            aria-labelledby="cta-title"
        >
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.textContent}>
                        <h2 id="cta-title" className={styles.title}>
                            {title}
                        </h2>
                        <p className={styles.description}>
                            {description}
                        </p>
                    </div>

                    <div className={styles.buttonGroup}>
                        {renderPrimaryButton()}
                        {renderSecondaryButton()}
                    </div>
                </div>

                {/* Elementos decorativos */}
                <div className={styles.decorativeCircle} aria-hidden="true" />
                <div className={styles.decorativeCircle2} aria-hidden="true" />
            </div>
        </section>
    );
};

export default CTASection; 