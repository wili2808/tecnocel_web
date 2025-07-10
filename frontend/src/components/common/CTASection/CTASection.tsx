import React from 'react';
import styles from './CTASection.module.css';

const CTASection = () => (
    <section className={styles.section}>
        <div className={styles.container}>
            <div className={styles.ctaCard}>
                <h2 className={styles.title}>
                    ¿Listo para personalizar tu pedido?
                </h2>
                <p className={styles.description}>
                    Contáctanos para obtener una cotización personalizada para tu proyecto.
                </p>
                <button className={styles.button}>
                    Solicitar Cotización
                </button>
            </div>
        </div>
    </section>
);

export default CTASection; 