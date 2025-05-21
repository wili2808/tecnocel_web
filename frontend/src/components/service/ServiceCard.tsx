import React from 'react';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon }) => {
  return (
    <div className="card bg-elevated rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300">
      <div className="text-4xl mb-6 text-primary">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold mb-4 text-primary">
        {title}
      </h3>
      <p className="text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default ServiceCard;
