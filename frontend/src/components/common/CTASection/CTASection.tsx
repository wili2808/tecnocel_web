import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMail, FiPhone, FiShoppingCart } from 'react-icons/fi';
import styles from './CTASection.module.css';

const ICONS = {
  arrow: FiArrowRight,
  cart:  FiShoppingCart,
  mail:  FiMail,
  phone: FiPhone,
  none:  null,
} as const;

interface CTASectionProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'gradient';
  icon?: keyof typeof ICONS;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  external?: boolean;
  className?: string;
}

const CTASection: React.FC<CTASectionProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
  variant = 'primary',
  icon = 'arrow',
  secondaryButtonText,
  secondaryButtonLink,
  external = false,
  className = '',
}) => {
  const Icon = ICONS[icon];
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  const primaryCls = `${styles.button} ${styles.primary}`;
  const secondaryCls = `${styles.button} ${styles.secondary}`;

  return (
    <section
      className={`${styles.ctaSection} ${styles[variant]} ${className}`}
      aria-labelledby="cta-title"
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <h2 id="cta-title" className={styles.title}>{title}</h2>
            <p className={styles.description}>{description}</p>
          </div>

          <div className={styles.buttonGroup}>
            {external ? (
              <a href={buttonLink} className={primaryCls} {...externalProps}>
                <span>{buttonText}</span>
                {Icon && <Icon className={styles.buttonIcon} />}
              </a>
            ) : (
              <Link to={buttonLink} className={primaryCls}>
                <span>{buttonText}</span>
                {Icon && <Icon className={styles.buttonIcon} />}
              </Link>
            )}

            {secondaryButtonText && secondaryButtonLink && (
              external ? (
                <a href={secondaryButtonLink} className={secondaryCls} {...externalProps}>
                  {secondaryButtonText}
                </a>
              ) : (
                <Link to={secondaryButtonLink} className={secondaryCls}>
                  {secondaryButtonText}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
