import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './OpenStreetMap.module.css';

const MapCenterUpdater = ({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 1 });
  }, [map, center.lat, center.lng, zoom]);
  return null;
};

interface OpenStreetMapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  title?: string;
  description?: string;
  onMarkerClick?: () => void;
}

/**
 * Componente de mapa mejorado usando OpenStreetMap y Leaflet
 * Versión moderna con diseño personalizado y animaciones
 *
 * @param center - Coordenadas del centro del mapa
 * @param zoom - Nivel de zoom (por defecto 16)
 * @param title - Título del marcador
 * @param description - Descripción adicional del marcador
 * @param onMarkerClick - Callback al hacer click en el marcador
 */
const OpenStreetMap = ({ center, zoom = 16, title = 'Ubicación', description, onMarkerClick }: OpenStreetMapProps) => {
  const mapRef = useRef(null);

  // Crear marcador personalizado con estilo TecnoCel
  const createCustomIcon = () => {
    return L.divIcon({
      className: 'custom-marker-tecnocel',
      html: `
                <div class="marker-container">
                    <div class="marker-pin">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/>
                        </svg>
                    </div>
                    <div class="marker-pulse"></div>
                </div>
            `,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });
  };

  // Detectar el tema actual
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    // Inyectar estilos CSS para los marcadores personalizados
    const style = document.createElement('style');
    style.textContent = `
            .custom-marker-tecnocel {
                position: relative;
            }

            .marker-container {
                position: relative;
                width: 50px;
                height: 50px;
            }

            .marker-pin {
                position: absolute;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.4),
                            0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
                animation: markerBounce 0.6s ease-out;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .marker-container:hover .marker-pin {
                box-shadow: 0 6px 24px rgba(var(--color-primary-rgb), 0.6),
                            0 0 0 6px rgba(var(--color-primary-rgb), 0.15);
                transform: scale(1.1);
            }

            .marker-pulse {
                position: absolute;
                width: 50px;
                height: 50px;
                border: 2px solid rgba(var(--color-primary-rgb), 0.6);
                border-radius: 50%;
                animation: markerPulse 2s infinite;
            }

            @keyframes markerBounce {
                0% {
                    transform: scale(0) translateY(20px);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.1);
                }
                100% {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
            }

            @keyframes markerPulse {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                100% {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }

            /* Popup personalizado */
            .leaflet-popup-content-wrapper {
                background: var(--background-elevated);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                box-shadow: var(--shadow-xl);
                padding: 0;
                transition: var(--theme-transition);
            }

            .leaflet-popup-content {
                margin: 16px;
                color: var(--text-primary);
                font-family: inherit;
            }

            .leaflet-popup-content strong {
                color: var(--color-primary);
                font-size: 16px;
                display: block;
                margin-bottom: 6px;
            }

            .leaflet-popup-content-wrapper .popup-description {
                font-size: 13px;
                color: var(--text-secondary);
                margin-top: 6px;
                line-height: 1.4;
            }

            .leaflet-popup-tip {
                background: var(--background-elevated);
                border: 1px solid var(--border-color);
            }

            /* Mejorar botones de zoom */
            .leaflet-control-zoom-in,
            .leaflet-control-zoom-out {
                background: var(--background-primary) !important;
                color: var(--text-primary) !important;
                border: 1px solid var(--border-color) !important;
                box-shadow: var(--shadow-sm);
                transition: var(--theme-transition);
            }

            .leaflet-control-zoom-in:hover,
            .leaflet-control-zoom-out:hover {
                background: var(--background-secondary) !important;
                color: var(--color-primary) !important;
            }
        `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  // Seleccionar mosaico según el tema
  const tileUrl = isDarkMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        ref={mapRef}
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className={styles.map}
        zoomControl={true}
        key={isDarkMode ? 'dark-map' : 'light-map'} // Forzar re-renderizado al cambiar de tema para actualizar Tiles
      >
        <MapCenterUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/" target="_blank">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url={tileUrl}
          maxZoom={19}
        />

        {/* Marcador personalizado */}
        <Marker
          key={`${center.lat}-${center.lng}-${title}-${description}`}
          position={[center.lat, center.lng]}
          icon={createCustomIcon()}
          eventHandlers={{
            click: () => {
              if (onMarkerClick) {
                onMarkerClick();
              }
            },
          }}
        >
          <Popup>
            <strong>{title}</strong>
            {description && <div className="popup-description">{description}</div>}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default OpenStreetMap;
