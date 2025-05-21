import React from 'react';

const CTASection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="mx-auto max-w-3xl rounded-2xl bg-secondary p-12 text-center">
        <h2 className="mb-6 text-3xl font-semibold text-primary">
          ¿Listo para personalizar tu pedido?
        </h2>
        <p className="mb-8 text-lg text-secondary">
          Contáctanos para obtener una cotización personalizada para tu proyecto.
        </p>
        <button className="btn btn-primary">
          Solicitar Cotización
        </button>
      </div>
    </div>
  </section>
);

export default CTASection; 