import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './OpenStreetMap.module.css';

// Fix para los iconos de Leaflet (necesario en React)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface OpenStreetMapProps {
    center: {
        lat: number;
        lng: number;
    };
    zoom?: number;
    title?: string;
    onMarkerClick?: () => void;
}

/**
 * Componente de mapa usando OpenStreetMap y Leaflet
 * Versión 100% gratuita y open source
 *
 * @param center - Coordenadas del centro del mapa
 * @param zoom - Nivel de zoom (por defecto 16)
 * @param title - Título del marcador
 * @param onMarkerClick - Callback al hacer click en el marcador
 */
const OpenStreetMap = ({
    center,
    zoom = 16,
    title = "Ubicación",
    onMarkerClick
}: OpenStreetMapProps) => {
    useEffect(() => {
        // Forzar recarga de tiles al montar
        window.dispatchEvent(new Event('resize'));
    }, []);

    return (
        <div className={styles.mapContainer}>
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={zoom}
                scrollWheelZoom={true}
                className={styles.map}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />
                <Marker
                    position={[center.lat, center.lng]}
                    eventHandlers={{
                        click: () => {
                            if (onMarkerClick) {
                                onMarkerClick();
                            }
                        }
                    }}
                >
                    <Popup>
                        <strong>{title}</strong>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default OpenStreetMap;
