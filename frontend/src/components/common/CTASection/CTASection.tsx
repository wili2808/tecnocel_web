import styles from './CTASection.module.css';

interface CTASectionProps {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    className?: string;
}

export const CTASection: React.FC<CTASectionProps> = ({
    title,
    description,
    buttonText,
    buttonLink,
    className = ''
}) => {
    return (
        <section className={`${styles.ctaSection} ${className}`}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.description}>{description}</p>
                    <a href={buttonLink} className={styles.button}>
                        {buttonText}
                    </a>
                </div>
            </div>
        </section>
    );
};

export default CTASection; 