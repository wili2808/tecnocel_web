import React, { memo } from 'react';
import type { ClienteListItem } from '../../../types/usuario';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './ClienteModals.module.css';

interface Props {
  cliente: ClienteListItem;
  onClose: () => void;
  onEdit?: () => void;
}

const DetalleClienteModal: React.FC<Props> = memo(({ cliente, onClose, onEdit }) => {

  const formatFecha = (date: Date | string | null) =>
    date
      ? new Date(date).toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';

  const activo = cliente.email_verified && cliente.is_web_enabled;

  return (
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title={`${cliente.nombre_cliente} ${cliente.apellido_cliente}`}
      icon="account_circle"
    >
      <div className="modalBodyPremium">
        <h4 className="sectionTitleWithDividerPremium">Información Personal</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>ID del Cliente</span>
            <span className={styles.detailValue}>#{cliente.id_cliente}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Nombre Completo</span>
            <span className={styles.detailValue}>{cliente.nombre_cliente} {cliente.apellido_cliente}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Correo Electrónico</span>
            <span className={styles.detailValue} style={{ color: 'var(--color-primary)' }}>{cliente.email_cliente}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Celular / WhatsApp</span>
            <span className={styles.detailValue}>{cliente.celular_cliente || '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>NIT / CI</span>
            <span className={styles.detailValue}>{cliente.nit_ci_cliente || '—'}</span>
          </div>
        </div>

        <h4 className="sectionTitleWithDividerPremium mt-8">Estado de la Cuenta</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Estado Global</span>
            <span className={`${styles.statusBadge} ${activo ? styles.statusActive : styles.statusInactive}`}>
              <span className="material-icons" style={{ fontSize: 16 }}>{activo ? 'check_circle' : 'error'}</span>
              {activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Verificación de Email</span>
            <span className={`${styles.statusBadge} ${cliente.email_verified ? styles.statusActive : styles.statusInactive}`}>
              {cliente.email_verified ? 'Sí' : 'No'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Acceso Web Habilitado</span>
            <span className={`${styles.statusBadge} ${cliente.is_web_enabled ? styles.statusActive : styles.statusInactive}`}>
              {cliente.is_web_enabled ? 'Sí' : 'No'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Fecha de Registro</span>
            <span className={styles.detailValue}>{formatFecha(cliente.fyh_creacion)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Última Actividad</span>
            <span className={styles.detailValue}>{formatFecha(cliente.last_login)}</span>
          </div>
        </div>
      </div>

      <div className="modalFooterPremium">
        {onEdit && (
          <button className="btnPremium btnPrimaryPremium mr-auto" onClick={onEdit}>
            <span className="material-icons">edit</span>
            Editar Cliente
          </button>
        )}
        <button className="btnPremium btnSecondaryPremium" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </PremiumModal>
  );
});

DetalleClienteModal.displayName = 'DetalleClienteModal';

export default DetalleClienteModal;
