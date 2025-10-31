/**
 * Componente que muestra información del local para retiro
 */
import { memo } from 'react';
import type { LocalInfo } from '../../../types/checkout';
import styles from './StorePickupInfo.module.css';

// Datos del local (luego esto podría venir de una API o contexto)
const LOCAL_INFO: LocalInfo = {
  nombre: 'TecnoCel - Local Principal',
  direccion: 'Av. Ejemplo #123, Zona Central',
  ciudad: 'Santa Cruz de la Sierra',
  telefono: '+591 3 123 4567',
  horario: 'Lunes a Viernes: 9:00 - 19:00 | Sábados: 9:00 - 14:00',
  referencia: 'Frente al parque central, edificio azul',
  mapa_url: 'https://maps.google.com/?q=TecnoCel'
};

export const StorePickupInfo = memo(() => {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <span className="material-icons">store</span>
        Información de Retiro
      </h3>

      <div className={styles.infoCard}>
        <div className={styles.infoHeader}>
          <span className={`material-icons ${styles.storeIcon}`}>
            location_on
          </span>
          <h4 className={styles.storeName}>{LOCAL_INFO.nombre}</h4>
        </div>

        <div className={styles.infoDetails}>
          {/* Dirección */}
          <div className={styles.infoRow}>
            <span className="material-icons">place</span>
            <div>
              <strong>Dirección:</strong>
              <p>{LOCAL_INFO.direccion}</p>
              <p>{LOCAL_INFO.ciudad}</p>
            </div>
          </div>

          {/* Horario */}
          <div className={styles.infoRow}>
            <span className="material-icons">schedule</span>
            <div>
              <strong>Horario de atención:</strong>
              <p>{LOCAL_INFO.horario}</p>
            </div>
          </div>

          {/* Teléfono */}
          <div className={styles.infoRow}>
            <span className="material-icons">phone</span>
            <div>
              <strong>Teléfono:</strong>
              <p>{LOCAL_INFO.telefono}</p>
            </div>
          </div>

          {/* Referencia */}
          {LOCAL_INFO.referencia && (
            <div className={styles.infoRow}>
              <span className="material-icons">info</span>
              <div>
                <strong>Referencia:</strong>
                <p>{LOCAL_INFO.referencia}</p>
              </div>
            </div>
          )}
        </div>

        {/* Botón de mapa */}
        {LOCAL_INFO.mapa_url && (
          <a
            href={LOCAL_INFO.mapa_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapButton}
          >
            <span className="material-icons">map</span>
            Ver en el mapa
          </a>
        )}

        {/* Alerta informativa */}
        <div className={styles.alert}>
          <span className="material-icons">info</span>
          <p>
            Tu pedido estará listo para retirar en <strong>24-48 horas</strong> después de
            confirmar la compra. Te notificaremos cuando esté disponible.
          </p>
        </div>
      </div>
    </div>
  );
});

StorePickupInfo.displayName = 'StorePickupInfo';

export default StorePickupInfo;
