import { useMemo } from 'react';
import { useConfig } from '../../../contexts/ConfigContext';
import styles from './Location.module.css';
import OpenStreetMap from '../OpenStreetMap';
import HistorySection from '../HistorySection';

const Location = () => {
    const { getConfig } = useConfig();
    
    // Obtener configuración dinámica
    const lat = parseFloat(getConfig('map_lat', '-27.5906'));
    const lng = parseFloat(getConfig('map_lng', '-56.6909'));
    const mapTitle = getConfig('map_title', 'TecnoCel - Nuestra Tienda');

    // Coordenadas
    const center = useMemo(() => ({ lat, lng }), [lat, lng]);

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
                <OpenStreetMap
                    center={center}
                    title={mapTitle}
                    onMarkerClick={handleMarkerClick}
                />
            </div>
        </div>
    );
};

export default Location;
