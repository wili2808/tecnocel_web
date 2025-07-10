import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import styles from './GoogleMap.module.css';

interface GoogleMapProps {
    center: {
        lat: number;
        lng: number;
    };
    zoom?: number;
    title?: string;
    onMarkerClick?: () => void;
}

const GoogleMap = ({
    center,
    zoom = 16,
    title = "Ubicación",
    onMarkerClick
}: GoogleMapProps) => {
    return (
        <div className={styles.mapContainer}>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                <Map
                    zoom={zoom}
                    center={center}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    className={styles.map}
                >
                    <Marker
                        position={center}
                        onClick={onMarkerClick}
                        title={title}
                    />
                </Map>
            </APIProvider>
        </div>
    );
};

export default GoogleMap; 