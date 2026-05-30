import React, { memo } from 'react';
import type { ClienteListItem } from '../../../types/usuario';
import PremiumModal from '../../common/PremiumModal/PremiumModal';

interface Props {
  cliente: ClienteListItem;
  onClose: () => void;
  onEdit?: () => void;
}

const DetalleClienteModal: React.FC<Props> = memo(({ cliente, onClose, onEdit }) => {

  const formatFecha = (date: Date | string | null) =>
    date
      ? new Date(date).toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';

  const activo = cliente.email_verified && cliente.is_web_enabled;

  return (
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title={`${cliente.nombre_cliente} ${cliente.apellido_cliente}`}
      icon="account_circle"
      headerChildren={
        <div className="flex gap-sm">
          <span className={`modalBadgePremium ${activo ? 'success' : 'error'}`}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
          <span className="modalBadgePremium neutral">
            ID: #{cliente.id_cliente}
          </span>
        </div>
      }
    >
      <div className="modalBodyPremium">
        <div className="modalGrid2Premium">
          {/* Columna Izquierda: Identidad y Contacto */}
          <div>
            <span className="modalSectionTitlePremium">Identidad y Contacto</span>
            <div className="flex flex-col gap-sm mt-2">
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Nombre Completo</span>
                  <span className="text-sm font-bold">{cliente.nombre_cliente} {cliente.apellido_cliente}</span>
                </div>
              </div>
              
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Correo Electrónico</span>
                  <span className="text-sm font-bold" style={{ wordBreak: 'break-all' }}>{cliente.email_cliente || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div className="modalInfoBoxPremium">
                  <div className="flex flex-col w-full">
                    <span className="text-xxs text-secondary uppercase font-bold">Celular / WhatsApp</span>
                    <span className="text-sm font-bold">{cliente.celular_cliente || '—'}</span>
                  </div>
                </div>
                <div className="modalInfoBoxPremium">
                  <div className="flex flex-col w-full">
                    <span className="text-xxs text-secondary uppercase font-bold">NIT / CI</span>
                    <span className="text-sm font-bold">{cliente.nit_ci_cliente || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Actividad y Seguridad */}
          <div>
            <span className="modalSectionTitlePremium">Actividad y Seguridad</span>
            <div className="flex flex-col gap-sm mt-2">
              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Fecha de Registro</span>
                  <span className="text-sm font-bold">{formatFecha(cliente.fyh_creacion)}</span>
                </div>
              </div>

              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold">Última Actividad</span>
                  <span className="text-sm font-bold">{formatFecha(cliente.last_login)}</span>
                </div>
              </div>

              <div className="modalInfoBoxPremium">
                <div className="flex flex-col w-full">
                  <span className="text-xxs text-secondary uppercase font-bold mb-2">Estados de Cuenta</span>
                  <div className="flex gap-sm">
                    <div className={`modalBadgePremium ${cliente.email_verified ? 'success' : 'error'}`}>
                      <span className="material-icons" style={{ fontSize: 14 }}>{cliente.email_verified ? 'verified' : 'pending'}</span>
                      Email {cliente.email_verified ? 'Verificado' : 'Pendiente'}
                    </div>
                    <div className={`modalBadgePremium ${cliente.is_web_enabled ? 'primary' : 'error'}`}>
                      <span className="material-icons" style={{ fontSize: 14 }}>{cliente.is_web_enabled ? 'language' : 'no_accounts'}</span>
                      Web {cliente.is_web_enabled ? 'Habilitada' : 'Bloqueada'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modalFooterPremium">
        {onEdit && (
          <button className="btnPremium btnPrimaryPremium mr-auto" onClick={onEdit}>
            <span className="material-icons">edit</span>
            Editar Cliente
          </button>
        )}
      </div>
    </PremiumModal>
  );
});

DetalleClienteModal.displayName = 'DetalleClienteModal';

export default DetalleClienteModal;
