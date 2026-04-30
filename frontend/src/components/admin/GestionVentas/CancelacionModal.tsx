/**
 * @file CancelacionModal.tsx
 *
 * Modal de confirmación para cancelar una venta.
 * Muestra una advertencia, permite ingresar un motivo opcional (máx. 300 chars)
 * y llama al servicio de cancelación al confirmar.
 *
 * Reutiliza los estilos de GestionVentas.module.css.
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import adminVentaService from '../../../services/adminVentaService';

interface CancelacionModalProps {
  idVenta: number;
  nroVenta: string;
  onClose: () => void;
  onCancelada: () => void;
}

const CancelacionModal: React.FC<CancelacionModalProps> = ({ idVenta, nroVenta, onClose, onCancelada }) => {
  const { showNotification } = useNotification();
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const procesandoRef = useRef(false);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !procesando) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, procesando]);

  const handleConfirmar = async () => {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    setProcesando(true);
    try {
      await adminVentaService.cancelarVenta(idVenta, motivo.trim() || undefined);
      showNotification('Venta cancelada y stock restaurado exitosamente', 'success');
      onCancelada();
      onClose();
    } catch (err: any) {
      showNotification(err.message || 'Error al cancelar la venta', 'error');
      procesandoRef.current = false;
      setProcesando(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !procesando) onClose();
      }}
    >
      <div className={styles.modalPremium} style={{ maxWidth: '450px' }}>
        
        {/* Header Premium */}
        <div className={styles.modalHeaderPremium}>
          <h2 className={styles.modalTitlePremium} style={{ color: 'var(--color-error)' }}>
            <span className="material-icons">warning_amber</span>
            Confirmar Anulación
          </h2>
          <button className={styles.closeButtonPremium} onClick={onClose} disabled={procesando} title="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body Premium */}
        <div className={styles.modalBodyPremium}>
          <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-error-100)', borderRadius: '12px', border: '1px solid var(--color-error-200)', display: 'flex', gap: '12px' }}>
            <span className="material-icons" style={{ color: 'var(--color-error)', fontSize: '24px' }}>report_problem</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Estás por anular la venta <strong>{nroVenta}</strong>. Esta acción restaurará el stock de los productos automáticamente y **no se puede deshacer**.
            </p>
          </div>

          <div className={styles.formGroupPremium}>
            <label className={styles.formLabelPremium}>Motivo de la Anulación <span style={{ fontWeight: 400 }}>(opcional)</span></label>
            <textarea
              style={{ 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1.5px solid var(--border-color)', 
                background: 'var(--background-primary)', 
                minHeight: '100px', 
                fontSize: '13.5px', 
                color: 'var(--text-primary)', 
                transition: 'border-color 0.2s', 
                width: '100%',
                resize: 'none'
              }}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Error en el pedido, duplicado, etc..."
              maxLength={300}
              disabled={procesando}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{motivo.length}/300 caracteres</span>
            </div>
          </div>
        </div>

        {/* Footer Premium */}
        <div className={styles.modalFooterPremium}>
          <button className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={onClose} disabled={procesando}>
            Volver
          </button>
          <button 
            className={`${styles.btnPremium} ${styles.btnDangerPremium}`} 
            onClick={handleConfirmar} 
            disabled={procesando}
          >
            <span className="material-icons">{procesando ? 'hourglass_empty' : 'delete_forever'}</span>
            {procesando ? 'Procesando...' : 'Confirmar Anulación'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CancelacionModal;
