import React, { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Category, Marca } from '../../../types';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import styles from './GestionCompras.module.css';

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
      <div className={styles.modalOverlayPremium} onClick={onClose}>
        <div className={styles.modalPremium} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeaderPremium}>
            <h2 className={styles.modalTitlePremium}>
              <span className="material-icons">add_box</span>
              Crear Producto Rápido
            </h2>
            <button className={styles.closeButtonPremium} onClick={onClose} disabled={guardando}>
              <span className="material-icons">close</span>
            </button>
          </div>

          <div className={styles.modalBodyPremium}>
            {error && (
              <div style={{ color: 'var(--color-error)', background: 'rgba(var(--color-error-rgb), 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 500, border: '1px solid rgba(var(--color-error-rgb), 0.2)' }}>
                <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '8px' }}>error</span>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                id="codigo"
                name="codigo"
                label="Código"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="SKU-001"
                required
                disabled={guardando}
              />
              <Input
                id="nombre"
                name="nombre"
                label="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: iPhone 15 Pro"
                required
                disabled={guardando}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                id="precioCompra"
                name="precioCompra"
                type="number"
                label="Precio Compra"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                placeholder="0.00"
                required
                disabled={guardando}
              />
              <Input
                id="precioVenta"
                name="precioVenta"
                type="number"
                label="Precio Venta"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                placeholder="0.00"
                required
                disabled={guardando}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                id="idCategoria"
                name="idCategoria"
                label="Categoría"
                value={String(idCategoria)}
                onChange={(e) => setIdCategoria(e.target.value ? Number(e.target.value) : '')}
                required
                disabled={guardando}
                options={[
                  { value: '', label: '-- Seleccionar --', disabled: true },
                  ...categorias.map((cat) => ({
                    value: String(cat.id_categoria),
                    label: cat.nombre_categoria
                  }))
                ]}
              />
              <Select
                id="idMarca"
                name="idMarca"
                label="Marca (opcional)"
                value={String(idMarca)}
                onChange={(e) => setIdMarca(e.target.value ? Number(e.target.value) : '')}
                disabled={guardando}
                options={[
                  { value: '', label: '-- Ninguna --' },
                  ...marcas.map((marca) => ({
                    value: String(marca.id_marca),
                    label: marca.nombre_marca
                  }))
                ]}
              />
            </div>
          </div>

          <div className={styles.modalFooterPremium}>
            <button className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button className={`${styles.btnPremium} ${styles.btnPrimaryPremium}`} onClick={handleGuardar} disabled={guardando}>
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
