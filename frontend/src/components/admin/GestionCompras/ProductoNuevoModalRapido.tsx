import React, { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Category, Marca } from '../../../types';

interface ProductoNuevoModalRapidoProps {
  precioCompraBase?: number;
  categorias?: Category[];
  marcas?: Marca[];
  onClose: () => void;
  onGuardado: (producto: {
    codigo: string;
    nombre: string;
    precio_venta: number;
    precio_compra: number;
    id_categoria?: number;
    id_marca?: number;
  }) => void;
}

const ProductoNuevoModalRapido: React.FC<ProductoNuevoModalRapidoProps> = memo(
  ({ precioCompraBase, categorias = [], marcas = [], onClose, onGuardado }) => {
    const [codigo, setCodigo] = useState('');
    const [nombre, setNombre] = useState('');
    const [precioVenta, setPrecioVenta] = useState('');
    const [precioCompra, setPrecioCompra] = useState(String(precioCompraBase || ''));
    const [idCategoria, setIdCategoria] = useState<number | ''>('');
    const [idMarca, setIdMarca] = useState<number | ''>('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGuardar = () => {
      setError(null);

      if (!codigo.trim()) {
        setError('Código es requerido');
        return;
      }
      if (!nombre.trim()) {
        setError('Nombre es requerido');
        return;
      }
      if (!precioVenta || parseFloat(precioVenta) <= 0) {
        setError('Precio venta debe ser mayor a 0');
        return;
      }
      if (!precioCompra || parseFloat(precioCompra) <= 0) {
        setError('Precio compra debe ser mayor a 0');
        return;
      }
      if (!idCategoria) {
        setError('Categoría es requerida');
        return;
      }

      setGuardando(true);
      onGuardado({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        precio_venta: parseFloat(precioVenta),
        precio_compra: parseFloat(precioCompra),
        id_categoria: idCategoria ? Number(idCategoria) : undefined,
        id_marca: idMarca ? Number(idMarca) : undefined
      });
      setGuardando(false);
    };

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
            maxWidth: '480px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out'
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
              ⊕ Crear Producto Rápido
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
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Código *
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="SKU-001"
                  disabled={guardando}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
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
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: iPhone 15 Pro"
                  disabled={guardando}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Precio Compra *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(e.target.value)}
                  placeholder="0.00"
                  disabled={guardando}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
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
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Precio Venta *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="0.00"
                  disabled={guardando}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Categoría *
                </label>
                <select
                  value={idCategoria}
                  onChange={(e) => setIdCategoria(e.target.value ? Number(e.target.value) : '')}
                  disabled={guardando}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-family-primary)',
                    backgroundColor: 'var(--background-primary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Seleccionar --</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Marca (opcional)
                </label>
                <select
                  value={idMarca}
                  onChange={(e) => setIdMarca(e.target.value ? Number(e.target.value) : '')}
                  disabled={guardando}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-family-primary)',
                    backgroundColor: 'var(--background-primary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Ninguna --</option>
                  {marcas.map((marca) => (
                    <option key={marca.id_marca} value={marca.id_marca}>
                      {marca.nombre_marca}
                    </option>
                  ))}
                </select>
              </div>
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
                  marginBottom: '12px'
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
              {guardando ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  }
);

ProductoNuevoModalRapido.displayName = 'ProductoNuevoModalRapido';

export default ProductoNuevoModalRapido;
