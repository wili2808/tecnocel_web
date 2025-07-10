import React from 'react';
import styles from './LocationSection.module.css';

const LocationSection = () => (
    <section className={styles.section}>
        <div className={styles.container}>
            <h2 className={styles.title}>
                Nuestra Ubicación
            </h2>
            <div className={styles.locationCard}>
                <h3>
                    Visítanos en
                </h3>
                <p>
                    Ituzaingó Corrientes
                </p>
                <p>
                    Teléfono: 3786-421020 497492
                </p>
            </div>
        </div>
    </section>
);

export default LocationSection; 