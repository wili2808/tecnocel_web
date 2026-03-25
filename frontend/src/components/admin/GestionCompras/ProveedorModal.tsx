import React, { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CreateProveedorData, ProveedorListItem } from '../../../types';

interface ProveedorModalProps {
  proveedor?: ProveedorListItem;
  onClose: () => void;
  onGuardado: (proveedor: ProveedorListItem) => void;
}

const ProveedorModal: React.FC<ProveedorModalProps> = memo(({ proveedor, onClose, onGuardado }) => {
  const [formData, setFormData] = useState<CreateProveedorData & { id_proveedor?: number }>({
    nombre_proveedor: proveedor?.nombre_proveedor || '',
    empresa: proveedor?.empresa || '',
    celular: proveedor?.celular || '',
    telefono: proveedor?.telefono || '',
    email: proveedor?.email || '',
    direccion: proveedor?.direccion || '',
    id_proveedor: proveedor?.id_proveedor
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    setError(null);

    if (!formData.nombre_proveedor.trim()) {
      setError('El nombre del proveedor es requerido');
      return;
    }
    if (!formData.empresa.trim()) {
      setError('El nombre de empresa es requerido');
      return;
    }
    if (!formData.celular.trim()) {
      setError('El celular es requerido');
      return;
    }
    if (!formData.direccion.trim()) {
      setError('La dirección es requerida');
      return;
    }

    setGuardando(true);

    try {
      const { proveedorAdminService } = await import('../../../services/proveedorAdminService');

      let response;
      if (proveedor) {
        response = await proveedorAdminService.actualizarProveedor(proveedor.id_proveedor, formData);
      } else {
        response = await proveedorAdminService.crearProveedor(formData);
      }

      onGuardado(response.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar proveedor');
    } finally {
      setGuardando(false);
    }
  };

  const isEditing = !!proveedor;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--background-primary)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideDown 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isEditing ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'}
          </h2>
          <button
            onClick={onClose}
            disabled={guardando}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Empresa - Protagonista */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Empresa *
            </label>
            <input
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              placeholder="Ej: Distribuidora XYZ"
              disabled={guardando}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid var(--color-primary)',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'var(--font-family-primary)',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--color-primary)',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
            />
          </div>

          {/* Nombre Proveedor */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Nombre del Proveedor *
            </label>
            <input
              type="text"
              name="nombre_proveedor"
              value={formData.nombre_proveedor}
              onChange={handleChange}
              placeholder="Ej: Juan García"
              disabled={guardando}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'var(--font-family-primary)',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Canales de Contacto */}
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Canales de Contacto
            </p>

            {/* Celular */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>📱</span>
                Celular *
              </label>
              <input
                type="tel"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                placeholder="+54 9 11 23456789"
                disabled={guardando}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-family-primary)',
                  backgroundColor: 'var(--background-primary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Teléfono */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>☎️</span>
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="(011) 4123-4567"
                disabled={guardando}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-family-primary)',
                  backgroundColor: 'var(--background-primary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>✉️</span>
                Email (opcional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contacto@distribuidor.com"
                disabled={guardando}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-family-primary)',
                  backgroundColor: 'var(--background-primary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Dirección */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>📍</span>
              Dirección *
            </label>
            <textarea
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Calle 123, Piso 5, Ciudad"
              disabled={guardando}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'var(--font-family-primary)',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '90px'
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: '12px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '16px'
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--background-secondary)'
          }}
        >
          <button
            onClick={onClose}
            disabled={guardando}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-primary)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-family-primary)',
              transition: 'background-color 0.2s',
              opacity: guardando ? 0.5 : 1
            }}
            onMouseEnter={(e) => !guardando && (e.currentTarget.style.backgroundColor = 'var(--background-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-primary)')}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-family-primary)',
              transition: 'background-color 0.2s',
              opacity: guardando ? 0.7 : 1
            }}
            onMouseEnter={(e) => !guardando && (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
          >
            {guardando ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Proveedor'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
});

ProveedorModal.displayName = 'ProveedorModal';

export default ProveedorModal;
