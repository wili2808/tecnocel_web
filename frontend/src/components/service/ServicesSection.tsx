import React, { memo } from 'react';
import ServiceCard from './ServiceCard';
import styles from '../../styles/Service.module.css';

interface Service {
  title: string;
  description: string;
  icon: string;
}

const services: Service[] = [
  {
    title: 'Uniformes Escolares',
    description: 'Confección de uniformes escolares de alta calidad para instituciones educativas.',
    icon: '🏫'
  },
  {
    title: 'Uniformes Deportivos',
    description: 'Diseño y fabricación de uniformes para todo tipo de deportes y equipos.',
    icon: '⚽'
  },
  {
    title: 'Sublimación',
    description: 'Servicios profesionales de sublimación para personalizar tus prendas.',
    icon: '🎨'
  },
  {
    title: 'Bordados',
    description: 'Bordados personalizados de alta calidad para todo tipo de prendas.',
    icon: '🧵'
  }
];

interface ServicesSectionProps {
  className?: string;
}

const ServicesSection: React.FC<ServicesSectionProps> = memo(({ className }) => {
  return (
    <section className={`${styles.servicesSection} ${className || ''}`}>
      <div className={styles.servicesContainer}>
        <h2 className={styles.sectionTitle}>
          Nuestros Servicios
        </h2>
        <div className={styles.servicesGrid}>
          {services.map((service, idx) => (
            <ServiceCard
              key={`service-${idx}`}
              {...service}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

ServicesSection.displayName = 'ServicesSection';

export default ServicesSection;