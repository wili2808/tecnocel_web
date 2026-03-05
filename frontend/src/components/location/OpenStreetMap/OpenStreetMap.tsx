import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './OpenStreetMap.module.css';

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
                background: linear-gradient(135deg, #00D9FF 0%, #0099CC 100%);
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(0, 217, 255, 0.4),
                            0 0 0 4px rgba(0, 217, 255, 0.1);
                animation: markerBounce 0.6s ease-out;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .marker-container:hover .marker-pin {
                box-shadow: 0 6px 24px rgba(0, 217, 255, 0.6),
                            0 0 0 6px rgba(0, 217, 255, 0.15);
                transform: scale(1.1);
            }

            .marker-pulse {
                position: absolute;
                width: 50px;
                height: 50px;
                border: 2px solid rgba(0, 217, 255, 0.6);
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
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(0, 217, 255, 0.3);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
                            0 0 20px rgba(0, 217, 255, 0.2);
                padding: 0;
            }

            .leaflet-popup-content {
                margin: 16px;
                color: #e0e0e0;
                font-family: inherit;
            }

            .leaflet-popup-content strong {
                color: #00D9FF;
                font-size: 16px;
                display: block;
                margin-bottom: 6px;
            }

            .leaflet-popup-content-wrapper .popup-description {
                font-size: 13px;
                color: #b0b0b0;
                margin-top: 6px;
                line-height: 1.4;
            }

            .leaflet-popup-tip {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(0, 217, 255, 0.3);
            }

            /* Mejorar botones de zoom */
            .leaflet-control-zoom-in,
            .leaflet-control-zoom-out {
                background: linear-gradient(135deg, #00D9FF 0%, #0099CC 100%);
                color: white !important;
                border: none;
                box-shadow: 0 4px 12px rgba(0, 217, 255, 0.3);
                transition: all 0.3s ease;
            }

            .leaflet-control-zoom-in:hover,
            .leaflet-control-zoom-out:hover {
                background: linear-gradient(135deg, #00E6FF 0%, #00B3FF 100%);
                box-shadow: 0 6px 16px rgba(0, 217, 255, 0.5);
            }
        `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        ref={mapRef}
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className={styles.map}
        zoomControl={true}
      >
        {/* Tileset CartoDB Positron (moderno y limpio) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/" target="_blank">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Marcador personalizado */}
        <Marker
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
