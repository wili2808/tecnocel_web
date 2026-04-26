import React, { memo, useState } from 'react';
import adminCompraService from '../../../services/adminCompraService';

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
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Anular Compra</h2>
            <button className="modal-close" onClick={onClose} disabled={anulando}>
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div style={{ marginBottom: '16px' }}>
              <p style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
                <strong>Compra:</strong> {nroCompra}
              </p>

              <div
                style={{
                  padding: '12px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  color: '#991b1b',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '6px' }}>⚠️ Advertencia</strong>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Al anular esta compra, se revertirá el stock de los productos. Esta acción no se puede deshacer.
                </p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Motivo (opcional)
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Error en cantidad, producto defectuoso, etc."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-family-primary)',
                    backgroundColor: 'var(--background-primary)',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    minHeight: '80px',
                  }}
                  disabled={anulando}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#991b1b',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={anulando}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={handleAnular} disabled={anulando}>
              {anulando ? 'Anulando...' : 'Anular Compra'}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

AnularCompraModal.displayName = 'AnularCompraModal';

export default AnularCompraModal;
