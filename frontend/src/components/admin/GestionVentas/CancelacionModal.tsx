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
import { ventaAdminService } from '../../../services/ventaAdminService';

interface CancelacionModalProps {
  idVenta: number;
  nroVenta: string;
  onClose: () => void;
  onCancelada: () => void;
}

const CancelacionModal: React.FC<CancelacionModalProps> = ({
  idVenta,
  nroVenta,
  onClose,
  onCancelada
}) => {
  const { showNotification } = useNotification();
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const procesandoRef = useRef(false);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !procesando) onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, procesando]);

  const handleConfirmar = async () => {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    setProcesando(true);
    try {
      await ventaAdminService.cancelarVenta(idVenta, motivo.trim() || undefined);
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
      onClick={e => { if (e.target === e.currentTarget && !procesando) onClose(); }}
    >
      <div className={styles.modal}>

        {/* Encabezado */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className="material-icons">cancel</span>
            Cancelar Venta {nroVenta}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={procesando}
            title="Cerrar"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Cuerpo */}
        <div className={styles.modalBody}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning, #f59e0b)', marginBottom: '16px' }}>
            <span className="material-icons">warning</span>
            Esta acción cancelará la venta y restaurará el stock de los productos. No se puede deshacer.
          </p>

          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Motivo de cancelación <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span>
          </label>
          <textarea
            className={styles.textarea}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: Error en el pedido, devolución solicitada por el cliente..."
            maxLength={300}
            rows={3}
            disabled={procesando}
          />
          <p style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {motivo.length}/300
          </p>
        </div>

        {/* Pie */}
        <div className={`${styles.modalFooter} ${styles.modalFooterLeft}`}>
          <button
            className={styles.dangerButton}
            onClick={handleConfirmar}
            disabled={procesando}
          >
            <span className="material-icons">cancel</span>
            {procesando ? 'Cancelando...' : 'Cancelar Venta'}
          </button>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={procesando}
          >
            Volver
          </button>
        </div>

      </div>
    </div>
  );
};

export default CancelacionModal;
