import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { proveedorAdminService } from '../../../services/proveedorAdminService';
import type { ProveedorListItem } from '../../../types';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useDebounce } from '../../../hooks/useDebounce';
import ProveedorModal from './ProveedorModal';
import styles from './GestionCompras.module.css';

const GestionProveedores: React.FC = memo(() => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_proveedores');
  const puedeCrear = tienePermiso('crear_proveedor');
  const puedeEditar = tienePermiso('editar_proveedor');
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

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className="material-icons">local_shipping</span>
            Gestión de Proveedores
          </h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <span className="material-icons" style={{ fontSize: 48, opacity: 0.5 }}>lock</span>
          <p style={{ marginTop: 16 }}>No tienes permisos para ver proveedores</p>
        </div>
      </div>
    );
  }

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
            disabled={!puedeCrear}
            title={!puedeCrear ? 'Sin permisos para crear proveedores' : undefined}
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
                        title={!puedeEditar ? 'Sin permisos para editar' : 'Editar'}
                        onClick={() => setModalProveedor(proveedor)}
                        disabled={!puedeEditar}
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
