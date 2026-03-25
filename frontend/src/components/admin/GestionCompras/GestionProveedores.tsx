import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { proveedorAdminService } from '../../../services/proveedorAdminService';
import type { ProveedorListItem } from '../../../types';
import { useNotification } from '../../../contexts/NotificationContext';
import { useDebounce } from '../../../hooks/useDebounce';
import ProveedorModal from './ProveedorModal';
import styles from './GestionCompras.module.css';

const GestionProveedores: React.FC = memo(() => {
  const { showNotification } = useNotification();
  const inputRef = useRef<HTMLInputElement>(null);

  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [modalProveedor, setModalProveedor] = useState<ProveedorListItem | null | 'new'>(null);
  const debouncedSearch = useDebounce(searchInput, 500);

  const cargarProveedores = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const response = await proveedorAdminService.listarProveedores(debouncedSearch || undefined);
      setProveedores(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
      setProveedores([]);
    } finally {
      setCargando(false);
    }
  }, [debouncedSearch]);

  // Ejecutar búsqueda cuando cambia debouncedSearch (500ms después de dejar de escribir)
  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  // Mantener el foco en el input mientras se busca
  useEffect(() => {
    if (searchInput && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchInput, cargando]);

  const handleGuardado = () => {
    cargarProveedores();
    showNotification('Proveedor guardado exitosamente', 'success');
  };

  if (cargando) {
    return (
      <div className={styles.loading}>
        <span className="material-icons">hourglass_empty</span>
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span className="material-icons">error</span>
        <p>{error}</p>
        <button className={styles.retryButton} onClick={cargarProveedores}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Buscador y botón crear */}
      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroupWide}>
            <label className={styles.filterLabel}>Buscar Proveedor</label>
            <input
              ref={inputRef}
              type="text"
              className={styles.filterInput}
              placeholder="Nombre, empresa, celular..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            className={`${styles.crearButton} ${styles.filterButton}`}
            onClick={() => setModalProveedor('new')}
            style={{ marginTop: '20px' }}
          >
            <span className="material-icons">add</span>
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Tabla */}
      {proveedores.length === 0 ? (
        <div className={styles.loading}>
          <span className="material-icons">inbox</span>
          <p>No hay proveedores registrados</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Celular</th>
                <th>Email</th>
                <th>Dirección</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id_proveedor}>
                  <td style={{ fontWeight: 600 }}>{proveedor.nombre_proveedor}</td>
                  <td>{proveedor.empresa}</td>
                  <td style={{ fontSize: '12px' }}>{proveedor.celular}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {proveedor.email || '-'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                    {proveedor.direccion}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        title="Editar"
                        onClick={() => setModalProveedor(proveedor)}
                      >
                        <span className="material-icons">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalProveedor && (
        <ProveedorModal
          proveedor={modalProveedor === 'new' ? undefined : modalProveedor}
          onClose={() => setModalProveedor(null)}
          onGuardado={handleGuardado}
        />
      )}
    </>
  );
});

GestionProveedores.displayName = 'GestionProveedores';

export default GestionProveedores;
