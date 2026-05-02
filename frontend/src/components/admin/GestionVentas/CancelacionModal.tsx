import React, { useState, useRef } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminVentaService from '../../../services/adminVentaService';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './VentaModals.module.css';

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

  // ELIMINADO: Cierre con Escape manual (manejado por PremiumModal)

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
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title="Confirmar Anulación"
      icon="warning_amber"
      maxWidth="450px"
    >
      <div className="modalBodyPremium">
        <div className={styles.warningBox}>
          <span className="material-icons">report_problem</span>
          <p className="m-0 text-sm">
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
    </PremiumModal>
  );
};

export default CancelacionModal;
