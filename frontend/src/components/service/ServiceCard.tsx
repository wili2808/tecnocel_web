import React, { memo } from 'react';
import styles from '../../styles/Service.module.css';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = memo(({ 
  title, 
  description, 
  icon,
  className 
}) => {
  return (
    <div className={`${styles.serviceCard} ${className || ''}`}>
      <div className={styles.icon}>
        {icon}
      </div>
      <h3 className={styles.title}>
        {title}
      </h3>
      <p className={styles.description}>
        {description}
      </p>
    </div>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;
