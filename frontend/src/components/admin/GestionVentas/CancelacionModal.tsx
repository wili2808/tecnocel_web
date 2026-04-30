import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminVentaService from '../../../services/adminVentaService';
import TextArea from '../../common/TextArea/TextArea';

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
      className="modalOverlayPremium"
      onClick={(e) => {
        if (e.target === e.currentTarget && !procesando) onClose();
      }}
    >
      <div className="modalPremium" style={{ maxWidth: '450px' }}>
        
        <div className="modalHeaderPremium">
          <h2 className="modalTitlePremium" style={{ color: 'var(--color-error)' }}>
            <span className="material-icons">warning_amber</span>
            Confirmar Anulación
          </h2>
          <button className="closeButtonPremium" onClick={onClose} disabled={procesando} title="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modalBodyPremium">
          <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(var(--color-error-rgb), 0.1)', borderRadius: '12px', border: '1px solid rgba(var(--color-error-rgb), 0.2)', display: 'flex', gap: '12px' }}>
            <span className="material-icons" style={{ color: 'var(--color-error)', fontSize: '24px' }}>report_problem</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Estás por anular la venta <strong>{nroVenta}</strong>. Esta acción restaurará el stock de los productos automáticamente y **no se puede deshacer**.
            </p>
          </div>

          <TextArea
            id="motivo"
            name="motivo"
            label="Motivo de la Anulación (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Error en el pedido, duplicado, etc..."
            maxLength={300}
            disabled={procesando}
            rows={4}
          />
        </div>

        <div className="modalFooterPremium">
          <button className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={procesando}>
            Volver
          </button>
          <button 
            className="btnPremium btnDangerPremium" 
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
