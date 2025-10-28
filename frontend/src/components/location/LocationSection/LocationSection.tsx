import React from 'react';
import styles from './LocationSection.module.css';
import OpenStreetMap from '../OpenStreetMap/OpenStreetMap';
import HistorySection from '../HistorySection/HistorySection';

/**
 * Props para el componente LocationSection
 */
interface LocationSectionProps {
    /** Título de la sección (opcional) */
    title?: string;
    /** Subtítulo de la sección (opcional) */
    subtitle?: string;
    /** Coordenadas del mapa (opcional) */
    coordinates?: {
        lat: number;
        lng: number;
    };
    /** Nombre del lugar para el marcador (opcional) */
    locationName?: string;
    /** Mostrar información de contacto (opcional) */
    showContactInfo?: boolean;
    /** Historia/descripción personalizada (opcional) */
    description?: string;
    /** Clases CSS adicionales */
    className?: string;
}

/**
 * LocationSection - Componente de ubicación y contacto
 *
 * Muestra un mapa interactivo junto con información de la empresa,
 * historia y datos de contacto en un diseño moderno tipo grid.
 *
 * @component
 * @example
 * ```tsx
 * <LocationSection
 *   title="Encuéntranos"
 *   subtitle="Visítanos en nuestra tienda"
 *   coordinates={{ lat: -27.4514, lng: -58.9867 }}
 *   locationName="TecnoCel - Resistencia"
 *   showContactInfo={true}
 * />
 * ```
 */
export const LocationSection: React.FC<LocationSectionProps> = ({
    title = "Nuestra Ubicación",
    subtitle = "Visítanos y descubre nuestros productos",
    coordinates = {
        lat: -27.4514,
        lng: -58.9867
    },
    locationName = "TecnoCel - Resistencia, Chaco",
    showContactInfo = true,
    description,
    className = ''
}) => {
    return (
        <section className={`${styles.locationSection} ${className}`} aria-labelledby="location-title">
            <div className={styles.container}>
                {/* Header de la sección */}
                <div className={styles.sectionHeader}>
                    <h2 id="location-title" className={styles.sectionTitle}>
                        {title}
                    </h2>
                    <p className={styles.sectionSubtitle}>
                        {subtitle}
                    </p>
                </div>

                {/* Grid principal: Mapa + Info */}
                <div className={styles.gridContainer}>
                    {/* Mapa */}
                    <div className={styles.mapWrapper}>
                        <div className={styles.mapContainer}>
                            <OpenStreetMap
                                center={coordinates}
                                title={locationName}
                                zoom={16}
                            />
                        </div>
                        <div className={styles.mapLabel}>
                            <span className={styles.mapLabelIcon}>📍</span>
                            <span className={styles.mapLabelText}>{locationName}</span>
                        </div>
                    </div>

                    {/* Información de la empresa */}
                    <div className={styles.infoWrapper}>
                        <HistorySection
                            description={description}
                            showContactInfo={showContactInfo}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LocationSection;
