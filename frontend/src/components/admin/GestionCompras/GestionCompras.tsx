import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { compraAdminService } from '../../../services/compraAdminService';
import type { CompraListItem, EstadisticasCompras, FiltrosComprasAdmin } from '../../../types';
import DetalleCompraModal from './DetalleCompraModal';
import AnularCompraModal from './AnularCompraModal';
import styles from './GestionCompras.module.css';

// Componentes que requieren lazy loading (más adelante)
const RegistrarCompraModal = React.lazy(() => import('./RegistrarCompraModal'));
const GestionProveedores = React.lazy(() => import('./GestionProveedores'));

const LIMIT = 20;

type TabType = 'compras' | 'proveedores';

const GestionCompras: React.FC = memo(() => {
  const { isAdmin, isGerente } = useAuth();
  const { showNotification } = useNotification();

  // === Estado principal ===
  const [activeTab, setActiveTab] = useState<TabType>('compras');
  const [compras, setCompras] = useState<CompraListItem[]>([]);
  const [stats, setStats] = useState<EstadisticasCompras | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === Filtros y búsqueda ===
  const [filtros, setFiltros] = useState<FiltrosComprasAdmin>({});
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // === Paginación ===
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // === Modales ===
  const [idDetalleAbierto, setIdDetalleAbierto] = useState<number | null>(null);
  const [mostrarRegistrar, setMostrarRegistrar] = useState(false);
  const [anularModal, setAnularModal] = useState<{ id: number; nro: string } | null>(null);

  // === Refs ===
  const cargandoRef = useRef(false);

  // === Efectos ===
  useEffect(() => {
    if (activeTab === 'compras') {
      cargarStats();
    }
  }, [activeTab]);

  useEffect(() => {
    setFiltros((prev) => ({
      ...prev,
      search: debouncedSearch || undefined
    }));
  }, [debouncedSearch]);

  useEffect(() => {
    if (activeTab === 'compras') {
      cargarCompras();
    }
  }, [filtros, offset, activeTab]);

  // === Funciones ===
  const cargarStats = useCallback(async () => {
    try {
      const response = await compraAdminService.obtenerEstadisticas();
      setStats(response.data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, []);

  const cargarCompras = useCallback(async () => {
    if (cargandoRef.current) return;
    cargandoRef.current = true;

    try {
      setCargando(true);
      setError(null);
      const response = await compraAdminService.listarCompras(filtros, LIMIT, offset);

      setCompras(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar compras');
      setCompras([]);
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }, [filtros, offset]);

  const handleRegistrada = () => {
    setMostrarRegistrar(false);
    setOffset(0);
    cargarCompras();
    cargarStats();
  };

  const handleAnulada = () => {
    setAnularModal(null);
    setOffset(0);
    cargarCompras();
    cargarStats();
    showNotification('Compra anulada exitosamente', 'success');
  };

  const handleLimpiarFiltros = () => {
    setFiltros({});
    setSearchInput('');
    setOffset(0);
  };

  // === Render ===
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>
              <span className="material-icons">shopping_cart</span>
              Gestión de Compras
            </h1>
            <p className={styles.subtitle}>Administra compras a proveedores y control de stock</p>
          </div>
          {activeTab === 'compras' && (
            <button
              className={styles.crearButton}
              onClick={() => setMostrarRegistrar(true)}
              disabled={cargando}
            >
              <span className="material-icons">add</span>
              Nueva Compra
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'compras' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('compras');
            setOffset(0);
          }}
        >
          <span className="material-icons">receipt_long</span>
          Compras
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'proveedores' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('proveedores')}
        >
          <span className="material-icons">business</span>
          Proveedores
        </button>
      </div>

      {/* Tab: Compras */}
      {activeTab === 'compras' && (
        <>
          {/* Estadísticas */}
          {stats ? (
            <div className={styles.statsBar}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>
                  <span className="material-icons">today</span>
                  Hoy
                </span>
                <span className={styles.statValue}>{stats.compras_hoy}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>
                  <span className="material-icons">date_range</span>
                  Últimos 7 días
                </span>
                <span className={styles.statValue}>{stats.compras_semana}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>
                  <span className="material-icons">calendar_month</span>
                  Este mes
                </span>
                <span className={styles.statValue}>{stats.compras_mes}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>
                  <span className="material-icons">attach_money</span>
                  Gasto mes
                </span>
                <span className={styles.statValue} style={{ fontSize: '18px' }}>
                  ${parseFloat(stats.gasto_mes).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.statsLoading} />
          )}

          {/* Filtros */}
          <div className={styles.filterBar}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Fecha Desde</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={filtros.fecha_inicio || ''}
                  onChange={(e) => {
                    setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }));
                    setOffset(0);
                  }}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Fecha Hasta</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={filtros.fecha_fin || ''}
                  onChange={(e) => {
                    setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }));
                    setOffset(0);
                  }}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Estado</label>
                <select
                  className={styles.filterSelect}
                  value={filtros.estado || ''}
                  onChange={(e) => {
                    setFiltros((prev) => ({
                      ...prev,
                      estado: (e.target.value as 'activa' | 'anulada') || undefined
                    }));
                    setOffset(0);
                  }}
                >
                  <option value="">Todas</option>
                  <option value="activa">Activa</option>
                  <option value="anulada">Anulada</option>
                </select>
              </div>
              <div className={styles.filterGroupWide}>
                <label className={styles.filterLabel}>Buscar (Nro. Compra)</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Ej: C-00001 o nombre proveedor"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setOffset(0);
                  }}
                />
              </div>
              <button className={styles.clearButton} onClick={handleLimpiarFiltros}>
                <span className="material-icons">clear</span>
                Limpiar
              </button>
            </div>
          </div>

          {/* Tabla */}
          {error ? (
            <div className={styles.error}>
              <span className="material-icons">error</span>
              <p>{error}</p>
              <button className={styles.retryButton} onClick={cargarCompras}>
                Reintentar
              </button>
            </div>
          ) : cargando ? (
            <div className={styles.loading}>
              <span className="material-icons">hourglass_empty</span>
              <p>Cargando compras...</p>
            </div>
          ) : compras.length === 0 ? (
            <div className={styles.loading}>
              <span className="material-icons">inbox</span>
              <p>No hay compras registradas</p>
            </div>
          ) : (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nro. Compra</th>
                      <th>Fecha</th>
                      <th>Proveedor</th>
                      <th>Comprobante</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                      <th style={{ textAlign: 'center' }}>Items</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compras.map((compra) => (
                      <tr key={compra.id_compra}>
                        <td style={{ fontWeight: 600 }}>{compra.nro_compra}</td>
                        <td>
                          {new Date(compra.fecha_compra).toLocaleDateString('es-AR', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td>{compra.nombre_proveedor}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{compra.comprobante}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${parseFloat(compra.precio_total).toLocaleString('es-AR')}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{compra.cantidad_items}</td>
                        <td>
                          <span
                            className={compra.estado === 'activa' ? styles.badgeActiva : styles.badgeAnulada}
                          >
                            {compra.estado === 'activa' ? 'Activa' : 'Anulada'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.actionBtn}
                              title="Ver detalle"
                              onClick={() => setIdDetalleAbierto(compra.id_compra)}
                            >
                              <span className="material-icons">visibility</span>
                            </button>
                            {compra.estado === 'activa' && (isAdmin || isGerente) && (
                              <button
                                className={styles.actionBtn}
                                title="Anular"
                                onClick={() => setAnularModal({ id: compra.id_compra, nro: compra.nro_compra })}
                              >
                                <span className="material-icons">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className={styles.pagination}>
                <span>
                  Mostrando {Math.min(compras.length, LIMIT)} de {total} compras
                </span>
                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                    disabled={offset === 0}
                  >
                    ← Anterior
                  </button>
                  <span>Página {Math.floor(offset / LIMIT) + 1}</span>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => setOffset(offset + LIMIT)}
                    disabled={offset + LIMIT >= total}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Tab: Proveedores */}
      {activeTab === 'proveedores' && (
        <React.Suspense fallback={<div className={styles.loading}>Cargando...</div>}>
          <GestionProveedores />
        </React.Suspense>
      )}

      {/* Modales */}
      {mostrarRegistrar && (
        <React.Suspense fallback={null}>
          <RegistrarCompraModal onClose={() => setMostrarRegistrar(false)} onRegistrada={handleRegistrada} />
        </React.Suspense>
      )}

      {idDetalleAbierto && (
        <DetalleCompraModal
          idCompra={idDetalleAbierto}
          onClose={() => setIdDetalleAbierto(null)}
          onAnularClick={(id, nro) => {
            setIdDetalleAbierto(null);
            setAnularModal({ id, nro });
          }}
          userRole={isAdmin ? 'admin' : isGerente ? 'gerente' : 'vendedor'}
        />
      )}

      {anularModal && (
        <AnularCompraModal
          idCompra={anularModal.id}
          nroCompra={anularModal.nro}
          onClose={() => setAnularModal(null)}
          onAnulada={handleAnulada}
        />
      )}
    </div>
  );
});

GestionCompras.displayName = 'GestionCompras';

export default GestionCompras;
