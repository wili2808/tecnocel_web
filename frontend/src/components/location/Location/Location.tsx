import { useMemo } from 'react';
import styles from './Location.module.css';
import GoogleMap from '../GoogleMap';
import HistorySection from '../HistorySection';

const Location = () => {
    // Coordenadas de MAC WIL en Ituzaingó, Corrientes
    const center = useMemo(() => ({ lat: -27.5906, lng: -56.6909 }), []);

    const handleMarkerClick = () => {
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`,
            '_blank'
        );
    };

    return (
        <div className={styles.locationContainer}>
            <HistorySection />

            <div className={styles.mapSection}>
                <h3>Encuéntranos Aquí</h3>
                <GoogleMap
                    center={center}
                    title="MAC WIL - Creaciones e Impresiones"
                    onMarkerClick={handleMarkerClick}
                />
            </div>
        </div>
    );
};

export default Location; 