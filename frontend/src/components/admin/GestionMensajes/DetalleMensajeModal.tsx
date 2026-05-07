import React, { memo } from 'react';
import type { MensajeContacto } from '../../../types/mensaje';
import PremiumModal from '../../common/PremiumModal/PremiumModal';

interface Props {
  mensaje: MensajeContacto;
  onClose: () => void;
  onToggleLeido: () => void;
  onEliminar: () => void;
  isDeleting?: boolean;
  puedeGestionar?: boolean;
}

const DetalleMensajeModal: React.FC<Props> = memo(({ 
  mensaje, 
  onClose, 
  onToggleLeido, 
  onEliminar,
  isDeleting,
  puedeGestionar
}) => {

  const formatFecha = (date: string | null) =>
    date
      ? new Date(date).toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';

  return (
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title={mensaje.asunto}
      icon="email"
      maxWidth="700px"
      headerChildren={
        <div className="flex gap-sm">
          <span className={`modalBadgePremium ${mensaje.leido ? 'neutral' : 'primary'}`}>
            <span className="material-icons" style={{ fontSize: 14 }}>
              {mensaje.leido ? 'drafts' : 'mark_email_unread'}
            </span>
            {mensaje.leido ? 'Leído' : 'Nuevo'}
          </span>
          <span className="modalBadgePremium neutral">
            ID: #{mensaje.id_mensaje_contacto}
          </span>
        </div>
      }
    >
      <div className="modalBodyPremium">
        <div className="modalGrid2Premium">
          {/* Columna Izquierda: Información del Remitente */}
          <div>
            <span className="modalSectionTitlePremium">Información del Remitente</span>
            <div className="flex flex-col gap-sm mt-2">
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Nombre</span>
                  <span className="text-sm font-bold">{mensaje.nombre}</span>
                </div>
              </div>
              
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Correo Electrónico</span>
                  <span className="text-sm font-bold" style={{ wordBreak: 'break-all' }}>{mensaje.email}</span>
                </div>
              </div>

              {mensaje.telefono && (
                <div className="modalInfoBoxPremium">
                  <div className="flex flex-col w-full">
                    <span className="text-xxs text-secondary uppercase font-bold">Teléfono de Contacto</span>
                    <span className="text-sm font-bold">{mensaje.telefono}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Detalles del Envío */}
          <div>
            <span className="modalSectionTitlePremium">Detalles del Envío</span>
            <div className="flex flex-col gap-sm mt-2">
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Fecha y Hora</span>
                  <span className="text-sm font-bold">{formatFecha(mensaje.fyh_creacion)}</span>
                </div>
              </div>

              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Asunto</span>
                  <span className="text-sm font-bold">{mensaje.asunto}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección del Mensaje (Ancho completo) */}
        <div className="mt-4">
          <span className="modalSectionTitlePremium">Cuerpo del Mensaje</span>
          <div className="modalInfoBoxPremium mt-2" style={{ minHeight: '150px', alignItems: 'flex-start' }}>
            <div className="text-sm leading-relaxed whitespace-pre-wrap w-full">
              {mensaje.mensaje}
            </div>
          </div>
        </div>
      </div>

      <div className="modalFooterPremium">
        <button 
          className="btnPremium btnSecondaryPremium mr-auto" 
          onClick={onToggleLeido}
        >
          <span className="material-icons">
            {mensaje.leido ? 'mark_as_unread' : 'done_all'}
          </span>
          {mensaje.leido ? 'Marcar como no leído' : 'Marcar como leído'}
        </button>
        
        {puedeGestionar && (
          <button 
            className="btnPremium btnDangerPremium" 
            onClick={onEliminar}
            disabled={isDeleting}
          >
            <span className="material-icons">delete</span>
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        )}

        <button className="btnPremium btnPrimaryPremium" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </PremiumModal>
  );
});

DetalleMensajeModal.displayName = 'DetalleMensajeModal';

export default DetalleMensajeModal;
