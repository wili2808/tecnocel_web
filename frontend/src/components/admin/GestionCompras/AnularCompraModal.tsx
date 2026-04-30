import React, { memo, useState } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import styles from './GestionCompras.module.css';

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
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
          
          {/* Header Premium */}
          <div className={styles.modalHeaderPremium}>
            <h2 className={styles.modalTitlePremium} style={{ color: 'var(--color-error)' }}>
              <span className="material-icons">warning_amber</span>
              Anular Compra
            </h2>
            <button className={styles.closeButtonPremium} onClick={onClose} disabled={anulando}>
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Body Premium */}
          <div className={styles.modalBodyPremium}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                ¿Está seguro que desea anular la compra <strong style={{ color: 'var(--text-primary)' }}>{nroCompra}</strong>?
              </p>

              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--color-error-100)', 
                borderLeft: '4px solid var(--color-error)', 
                borderRadius: '8px', 
                marginBottom: '20px' 
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-error)', fontWeight: 600 }}>
                  Esta acción revertirá el stock de los productos ingresados y es irreversible.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabelPremium}>Motivo de la Anulación (Opcional)</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Error en carga de datos, devolución al proveedor..."
                  className={styles.formTextareaPremium}
                  rows={3}
                  disabled={anulando}
                />
              </div>

              {error && (
                <div style={{ marginTop: '16px', padding: '10px', background: 'var(--color-error-100)', borderRadius: '6px', color: 'var(--color-error)', fontSize: '12px', fontWeight: 600 }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer Premium */}
          <div className={styles.modalFooterPremium}>
            <button className={styles.cancelButtonPremium} onClick={onClose} disabled={anulando}>
              Cancelar
            </button>
            <button 
              className={styles.saveButton} 
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
