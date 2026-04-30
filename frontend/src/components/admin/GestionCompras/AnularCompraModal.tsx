import React, { memo, useState } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import styles from './GestionCompras.module.css';
import TextArea from '../../common/TextArea/TextArea';

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
      <div className={styles.modalOverlayPremium} onClick={onClose}>
        <div className={styles.modalPremium} style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
          
          <div className={styles.modalHeaderPremium}>
            <h2 className={styles.modalTitlePremium} style={{ color: 'var(--color-error)' }}>
              <span className="material-icons">warning_amber</span>
              Anular Compra
            </h2>
            <button className={styles.closeButtonPremium} onClick={onClose} disabled={anulando}>
              <span className="material-icons">close</span>
            </button>
          </div>

          <div className={styles.modalBodyPremium}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                ¿Está seguro que desea anular la compra <strong style={{ color: 'var(--text-primary)' }}>{nroCompra}</strong>?
              </p>

              <div style={{ 
                padding: '12px 16px', 
                background: 'rgba(var(--color-error-rgb), 0.1)', 
                borderLeft: '4px solid var(--color-error)', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-error)', fontWeight: 600 }}>
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
                <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(var(--color-error-rgb), 0.1)', borderRadius: '6px', color: 'var(--color-error)', fontSize: '12px', fontWeight: 600 }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooterPremium}>
            <button className={styles.cancelButtonPremium} onClick={onClose} disabled={anulando}>
              Cancelar
            </button>
            <button 
              className={styles.saveButtonPremium} 
              style={{ background: 'var(--color-error)' }}
              onClick={handleAnular} 
              disabled={anulando}
            >
              <span className="material-icons">{anulando ? 'hourglass_empty' : 'block'}</span>
              {anulando ? 'Anulando...' : 'Confirmar Anulación'}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

AnularCompraModal.displayName = 'AnularCompraModal';

export default AnularCompraModal;
