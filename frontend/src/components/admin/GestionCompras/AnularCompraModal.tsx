import React, { memo, useState } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './AnularCompraModal.module.css';

interface AnularCompraModalProps {
  idCompra: number;
  nroCompra: string;
  onClose: () => void;
  onAnulada: () => void;
  onLoading?: (loading: boolean) => void;
}

const AnularCompraModal: React.FC<AnularCompraModalProps> = memo(
  ({ idCompra, nroCompra, onClose, onAnulada, onLoading }) => {
    const [motivo, setMotivo] = useState('');
    const [anulando, setAnulando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnular = async () => {
      setError(null);
      setAnulando(true);
      onLoading?.(true);

      try {
        await adminCompraService.anularCompra(idCompra, motivo);
        onAnulada();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al anular compra');
      } finally {
        setAnulando(false);
        onLoading?.(false);
      }
    };

    return (
      <PremiumModal
        isOpen={true}
        onClose={onClose}
        title="Anular Compra"
        icon="warning_amber"
        maxWidth="450px"
      >
        <div className="modalBodyPremium">
          <div>
            <p className={`text-sm text-secondary mb-4 ${styles.message}`}>
              ¿Está seguro que desea anular la compra <strong className="text-primary">{nroCompra}</strong>?
            </p>

            <div className={styles.warningBox}>
              <span className="material-icons">warning</span>
              <p>
                Esta acción revertirá el stock de los productos ingresados y es irreversible.
              </p>
            </div>

            <TextArea
              id="motivo"
              name="motivo"
              label="Motivo de la Anulación (Opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Error en carga de datos, devolución al proveedor..."
              rows={3}
              disabled={anulando}
            />

            {error && (
              <div className="modalAlertErrorPremium mt-4">
                <span className="material-icons">error_outline</span>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="modalFooterPremium">
          <button className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={anulando}>
            Cancelar
          </button>
          <button 
            className="btnPremium btnDangerPremium" 
            onClick={handleAnular} 
            disabled={anulando}
          >
            <span className="material-icons">{anulando ? 'hourglass_empty' : 'block'}</span>
            {anulando ? 'Anulando...' : 'Confirmar Anulación'}
          </button>
        </div>
      </PremiumModal>
    );
  },
);

AnularCompraModal.displayName = 'AnularCompraModal';

export default AnularCompraModal;
