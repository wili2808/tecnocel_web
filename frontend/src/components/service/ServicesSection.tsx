import React from 'react';
import ServiceCard from './ServiceCard';

const services = [
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

const ServicesSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <h2 className="mb-16 text-center text-4xl font-semibold text-primary">
        Nuestros Servicios
      </h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {services.map((service, idx) => (
          <ServiceCard key={idx} {...service} />
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection; 