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
  onEdit?: () => void;
}

const DetalleClienteModal: React.FC<Props> = ({ cliente, onClose, onEdit }) => {

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
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalPremium}>

        {/* Header Premium */}
        <div className={styles.modalHeaderPremium}>
          <h2 className={styles.modalTitlePremium}>
            <span className="material-icons">account_circle</span>
            {cliente.nombre_cliente} {cliente.apellido_cliente}
          </h2>
          <button className={styles.closeButtonPremium} onClick={onClose} title="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body Premium */}
        <div className={styles.modalBodyPremium}>
          <div className={styles.formGridPremium}>

            {/* Sección: Información Personal */}
            <div className={styles.formGroupFullPremium}>
              <span className={styles.sectionTitlePremium}>Información Personal</span>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>ID del Cliente</span>
                <span className={styles.detalleValuePremium}>#{cliente.id_cliente}</span>
              </div>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>Nombre Completo</span>
                <span className={styles.detalleValuePremium}>{cliente.nombre_cliente} {cliente.apellido_cliente}</span>
              </div>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>Correo Electrónico</span>
                <span className={styles.detalleValuePremium} style={{ color: 'var(--color-primary)' }}>{cliente.email_cliente}</span>
              </div>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>Celular / WhatsApp</span>
                <span className={styles.detalleValuePremium}>{cliente.celular_cliente || '—'}</span>
              </div>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>NIT / CI</span>
                <span className={styles.detalleValuePremium}>{cliente.nit_ci_cliente || '—'}</span>
              </div>
            </div>

            {/* Sección: Estado de Cuenta */}
            <div className={styles.formGroupFullPremium} style={{ marginTop: '12px' }}>
              <span className={styles.sectionTitlePremium}>Estado de la Cuenta</span>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>Estado Global</span>
                <span className={`${styles.badge} ${activo ? styles.badgeActive : styles.badgeInactive}`} style={{ margin: 0 }}>
                  {activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>Verificación de Email</span>
                <BadgeSiNo valor={cliente.email_verified} />
              </div>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>Acceso Web Habilitado</span>
                <BadgeSiNo valor={cliente.is_web_enabled} />
              </div>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>Fecha de Registro</span>
                <span className={styles.detalleValuePremium}>{formatFecha(cliente.fyh_creacion)}</span>
              </div>
              <div className={styles.detalleRowPremium}>
                <span className={styles.detalleLabelPremium}>Última Actividad</span>
                <span className={styles.detalleValuePremium}>{formatFecha(cliente.last_login)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Premium */}
        <div className={styles.modalFooterPremium}>
          {onEdit && (
            <button className={styles.editButtonPremium} onClick={onEdit}>
              <span className="material-icons">edit</span>
              Editar Cliente
            </button>
          )}
          <button className={styles.cancelButtonPremium} onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default DetalleClienteModal;
