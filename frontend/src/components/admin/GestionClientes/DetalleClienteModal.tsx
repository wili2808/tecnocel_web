/**
 * @file DetalleClienteModal.tsx
 *
 * Modal de solo lectura para ver el detalle completo de un cliente.
 * Disponible para todos los roles del sistema (admin, empleado, vendedor).
 * No realiza ninguna llamada API adicional: usa los datos ya cargados en la lista.
 */

import React, { useEffect } from 'react';
import styles from './GestionClientes.module.css';
import type { ClienteListItem } from '../../../types/usuario';

interface Props {
  cliente: ClienteListItem;
  onClose: () => void;
}

const DetalleClienteModal: React.FC<Props> = ({ cliente, onClose }) => {

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const formatFecha = (date: Date | string | null) =>
    date
      ? new Date(date).toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';

  const activo = cliente.email_verified && cliente.is_web_enabled;

  const BadgeSiNo = ({ valor }: { valor: boolean }) => (
    <span className={`${styles.badge} ${valor ? styles.badgeActive : styles.badgeInactive}`}>
      {valor ? 'Sí' : 'No'}
    </span>
  );

  return (
    <div
      className={styles.modalOverlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>

        {/* Encabezado */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className="material-icons">person</span>
            {cliente.nombre_cliente} {cliente.apellido_cliente}
          </h2>
          <button className={styles.closeButton} onClick={onClose} title="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Cuerpo */}
        <div className={styles.modalBody}>
          <div className={styles.detalleGrid}>

            {/* Columna izq: información personal */}
            <div className={styles.detalleSection}>
              <p className={styles.detalleSectionTitle}>Información Personal</p>

              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>ID</span>
                <span className={styles.detalleValue}>#{cliente.id_cliente}</span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Nombre</span>
                <span className={styles.detalleValue}>{cliente.nombre_cliente}</span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Apellido</span>
                <span className={styles.detalleValue}>{cliente.apellido_cliente}</span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Email</span>
                <span className={styles.detalleValue}>{cliente.email_cliente}</span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Celular</span>
                <span className={styles.detalleValue}>{cliente.celular_cliente || '—'}</span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>NIT/CI</span>
                <span className={styles.detalleValue}>{cliente.nit_ci_cliente || '—'}</span>
              </div>
            </div>

            {/* Columna der: estado de cuenta */}
            <div className={styles.detalleSection}>
              <p className={styles.detalleSectionTitle}>Estado de la Cuenta</p>

              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Estado</span>
                <span className={styles.detalleValue}>
                  <span className={`${styles.badge} ${activo ? styles.badgeActive : styles.badgeInactive}`}>
                    {activo ? 'Activo' : 'Inactivo'}
                  </span>
                </span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Email verificado</span>
                <span className={styles.detalleValue}>
                  <BadgeSiNo valor={cliente.email_verified} />
                </span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Web habilitado</span>
                <span className={styles.detalleValue}>
                  <BadgeSiNo valor={cliente.is_web_enabled} />
                </span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Registrado</span>
                <span className={styles.detalleValue}>{formatFecha(cliente.fyh_creacion)}</span>
              </div>
              <div className={styles.detalleRow}>
                <span className={styles.detalleLabel}>Último login</span>
                <span className={styles.detalleValue}>{formatFecha(cliente.last_login)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>
  );
};

export default DetalleClienteModal;
