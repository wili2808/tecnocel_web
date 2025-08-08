import styles from './LocationSection.module.css';
import GoogleMap from '../GoogleMap/GoogleMap';
import HistorySection from '../HistorySection/HistorySection';

export const LocationSection: React.FC = () => {
    // Coordenadas de Ituzaingó, Corrientes
    const center = {
        lat: -27.5806,
        lng: -56.6881
    };

    return (
        <section className={styles.locationSection}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.mapContainer}>
                        <GoogleMap center={center} title="TecnoCel - Ituzaingó, Corrientes" />
                    </div>
                    <div className={styles.historyContainer}>
                        <HistorySection />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LocationSection; 