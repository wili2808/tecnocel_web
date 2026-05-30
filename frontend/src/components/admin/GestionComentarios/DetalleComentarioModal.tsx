import React, { memo } from 'react';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import type { Comentario } from '../../../types/comentario';

interface DetalleComentarioModalProps {
  comentario: Comentario;
  onClose: () => void;
  onModerar: (id: number, estado: 'activo' | 'oculto' | 'eliminado') => void;
}

const DetalleComentarioModal: React.FC<DetalleComentarioModalProps> = memo(({
  comentario,
  onClose,
  onModerar
}) => {

  const renderStars = (rating: number | null | undefined) => {
    if (!rating) return <span className="text-secondary">Sin calif.</span>;
    return (
      <div className="flex gap-xs">
        {[...Array(5)].map((_, i) => (
          <span 
            key={i} 
            className="material-icons" 
            style={{ 
              fontSize: 18, 
              color: i < rating ? '#fbbf24' : 'rgba(255,255,255,0.1)' 
            }}
          >
            {i < rating ? 'star' : 'star_outline'}
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'activo': return { label: 'Aprobado', class: 'success', icon: 'check_circle' };
      case 'oculto': return { label: 'Oculto', class: 'neutral', icon: 'visibility_off' };
      case 'eliminado': return { label: 'Eliminado', class: 'error', icon: 'delete' };
      case 'pendiente': return { label: 'Pendiente', class: 'primary', icon: 'history' };
      default: return { label: estado, class: 'neutral', icon: 'info' };
    }
  };

  const badge = getStatusBadge(comentario.estado);

  return (
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title="Detalle de la Reseña"
      icon="reviews"
      maxWidth="750px"
      headerChildren={
        <div className="flex gap-sm">
          <span className={`modalBadgePremium ${badge.class}`}>
            <span className="material-icons" style={{ fontSize: 14 }}>{badge.icon}</span>
            {badge.label}
          </span>
          <span className="modalBadgePremium neutral">
            ID: #{comentario.id_comentario}
          </span>
        </div>
      }
    >
      <div className="modalBodyPremium">
        <div className="modalGrid2Premium">
          {/* Columna Izquierda: Información del Cliente */}
          <div>
            <span className="modalSectionTitlePremium">Información del Cliente</span>
            <div className="flex flex-col gap-sm mt-2">
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Cliente</span>
                  <span className="text-sm font-bold">
                    {comentario.cliente ? `${comentario.cliente.nombre_cliente} ${comentario.cliente.apellido_cliente}` : 'Usuario Invitado'}
                  </span>
                </div>
              </div>
              
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Correo Electrónico</span>
                  <span className="text-sm font-bold" style={{ wordBreak: 'break-all' }}>
                    {comentario.cliente?.email_cliente || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Producto y Calificación */}
          <div>
            <span className="modalSectionTitlePremium">Producto y Calificación</span>
            <div className="flex flex-col gap-sm mt-2">
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Producto</span>
                  <span className="text-sm font-bold">{comentario.producto?.nombre || 'Producto Desconocido'}</span>
                </div>
              </div>

              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Puntuación</span>
                  <div className="mt-1">{renderStars(comentario.calificacion)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comentario (Ancho completo) */}
        <div className="mt-4">
          <span className="modalSectionTitlePremium">Reseña del Cliente</span>
          <div className="modalInfoBoxPremium mt-2" style={{ minHeight: '100px', alignItems: 'flex-start' }}>
            <div className="text-sm leading-relaxed whitespace-pre-wrap w-full py-2">
              {comentario.comentario || <span className="italic text-secondary">Sin comentario escrito.</span>}
            </div>
          </div>
        </div>

        {/* Imágenes Adjuntas */}
        {comentario.imagenes && comentario.imagenes.length > 0 && (
          <div className="mt-6">
            <span className="modalSectionTitlePremium">Evidencia Fotográfica</span>
            <div className="modalGalleryPremium">
              {comentario.imagenes.map((img: any) => (
                <div key={img.id_imagen} className="modalImageItemPremium" style={{ cursor: 'pointer' }}>
                  <img 
                    src={img.url_imagen || img.imagen_url} 
                    alt="Evidencia" 
                    className="modalImagePreviewPremium"
                    onClick={() => window.open(img.url_imagen || img.imagen_url, '_blank')}
                  />
                  <div className="modalImageActionsPremium">
                    <button 
                      className="modalImageBtnPremium primary"
                      onClick={() => window.open(img.url_imagen || img.imagen_url, '_blank')}
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>visibility</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="modalFooterPremium">
        <div className="flex gap-sm mr-auto">
          {comentario.estado !== 'activo' && (
            <button 
              className="btnPremium btnPrimaryPremium" 
              onClick={() => { onModerar(comentario.id_comentario, 'activo'); onClose(); }}
            >
              <span className="material-icons">check_circle</span>
              Aprobar
            </button>
          )}
          {comentario.estado !== 'oculto' && (
            <button 
              className="btnPremium btnSecondaryPremium" 
              onClick={() => { onModerar(comentario.id_comentario, 'oculto'); onClose(); }}
            >
              <span className="material-icons">visibility_off</span>
              Ocultar
            </button>
          )}
        </div>

        <button 
          className="btnPremium btnDangerPremium" 
          onClick={() => { if(window.confirm('¿Eliminar esta reseña definitivamente?')) { onModerar(comentario.id_comentario, 'eliminado'); onClose(); } }}
        >
          <span className="material-icons">delete</span>
          Eliminar
        </button>

      </div>
    </PremiumModal>
  );
});

DetalleComentarioModal.displayName = 'DetalleComentarioModal';

export default DetalleComentarioModal;

