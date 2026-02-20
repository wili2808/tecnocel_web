/**
 * Componente GestionOfertas - CRUD completo de ofertas desde el admin
 * Lista, busca, crea, edita y elimina ofertas del sistema
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import OfertaForm from './OfertaForm';
import type { OfertaConConteo, OfertaConProductos } from '../../../types';
import styles from './GestionOfertas.module.css';

type Vista = 'lista' | 'crear' | 'editar';
type SortKey = 'nombre_oferta' | 'tipo_descuento' | 'valor_descuento' | 'fecha_inicio' | 'fecha_fin' | 'activo';
type SortDir = 'asc' | 'desc';
type FiltroEstado = 'todas' | 'activas' | 'inactivas' | 'expiradas';

const ITEMS_PER_PAGE = 20;

/** Determina el estado visual de una oferta basado en activo y fechas */
const getEstadoOferta = (oferta: OfertaConConteo) => {
  if (!oferta.activo) return { label: 'Inactiva', className: styles.estadoInactiva };
  const now = new Date();
  const inicio = new Date(oferta.fecha_inicio);
  const fin = new Date(oferta.fecha_fin);
  if (now < inicio) return { label: 'Programada', className: styles.estadoProgramada };
  if (now > fin) return { label: 'Expirada', className: styles.estadoExpirada };
  return { label: 'Activa', className: styles.estadoActiva };
};

/** Formatea una fecha ISO a formato legible */
const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const GestionOfertas = () => {
  const { isAdmin } = useAuth();
  const { showNotification } = useNotification();

  // Estado de la vista
  const [vista, setVista] = useState<Vista>('lista');
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<OfertaConProductos | null>(null);

  // Estado de la lista
  const [allOfertas, setAllOfertas] = useState<OfertaConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda, filtros y paginación
  const [searchInput, setSearchInput] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [page, setPage] = useState(1);

  // Ordenamiento
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  // 1. Filtrar por búsqueda y estado
  const filteredOfertas = useMemo(() => {
    let result = allOfertas;

    // Filtro por búsqueda (nombre)
    if (searchInput.trim()) {
      const term = searchInput.toLowerCase().trim();
      result = result.filter(o => o.nombre_oferta.toLowerCase().includes(term));
    }

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      const now = new Date();
      result = result.filter(o => {
        const estado = getEstadoOferta(o);
        switch (filtroEstado) {
          case 'activas': return estado.label === 'Activa';
          case 'inactivas': return estado.label === 'Inactiva';
          case 'expiradas': return estado.label === 'Expirada';
          default: return true;
        }
      });
    }

    return result;
  }, [allOfertas, searchInput, filtroEstado]);

  // 2. Ordenar
  const sortedOfertas = useMemo(() => {
    if (!sortKey) return filteredOfertas;

    return [...filteredOfertas].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortKey) {
        case 'nombre_oferta':
          valA = a.nombre_oferta.toLowerCase();
          valB = b.nombre_oferta.toLowerCase();
          break;
        case 'tipo_descuento':
          valA = a.tipo_descuento;
          valB = b.tipo_descuento;
          break;
        case 'valor_descuento':
          valA = a.valor_descuento;
          valB = b.valor_descuento;
          break;
        case 'fecha_inicio':
          valA = new Date(a.fecha_inicio).getTime();
          valB = new Date(b.fecha_inicio).getTime();
          break;
        case 'fecha_fin':
          valA = new Date(a.fecha_fin).getTime();
          valB = new Date(b.fecha_fin).getTime();
          break;
        case 'activo':
          valA = a.activo ? 1 : 0;
          valB = b.activo ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOfertas, sortKey, sortDir]);

  // 3. Paginar
  const total = sortedOfertas.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const paginatedOfertas = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedOfertas.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedOfertas, page]);

  const cargarOfertas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminOfertaService.listarOfertas();
      setAllOfertas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar ofertas');
      showNotification(err.message || 'Error al cargar ofertas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vista === 'lista') {
      cargarOfertas();
    }
  }, [cargarOfertas, vista]);

  const handleClearSearch = () => {
    setSearchInput('');
    setPage(1);
  };

  const handleEditar = async (id: number) => {
    try {
      const oferta = await adminOfertaService.obtenerOferta(id);
      setOfertaSeleccionada(oferta);
      setVista('editar');
    } catch (err: any) {
      showNotification('Error al cargar oferta para editar', 'error');
    }
  };

  const handleEliminar = async (id: number, nombre: string) => {
    if (!isAdmin) {
      showNotification('No tienes permisos para eliminar ofertas', 'error');
      return;
    }

    if (!confirm(`¿Estás seguro de desactivar la oferta "${nombre}"?`)) {
      return;
    }

    try {
      await adminOfertaService.eliminarOferta(id);
      showNotification('Oferta desactivada exitosamente', 'success');
      cargarOfertas();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar oferta', 'error');
    }
  };

  const handleGuardado = () => {
    setVista('lista');
    setOfertaSeleccionada(null);
    cargarOfertas();
  };

  const handleCancelar = () => {
    setVista('lista');
    setOfertaSeleccionada(null);
  };

  // Renderizar formulario si estamos en crear/editar
  if (vista === 'crear' || vista === 'editar') {
    return (
      <OfertaForm
        modo={vista}
        oferta={ofertaSeleccionada}
        onGuardado={handleGuardado}
        onCancelar={handleCancelar}
      />
    );
  }

  // Vista de lista
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h2 className={styles.title}>
              <span className="material-icons">local_offer</span>
              Gestión de Ofertas
            </h2>
            <p className={styles.subtitle}>
              Administra las ofertas y descuentos de la tienda
            </p>
          </div>
          <button
            className={styles.crearButton}
            onClick={() => setVista('crear')}
          >
            <span className="material-icons">add_box</span>
            <span>Nueva Oferta</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtro */}
      <div className={styles.filterRow}>
        <div className={styles.searchInputWrapper}>
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre de oferta..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className={styles.searchInput}
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className={styles.clearButton}
            >
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value as FiltroEstado); setPage(1); }}
          className={styles.filterSelect}
        >
          <option value="todas">Todas</option>
          <option value="activas">Activas</option>
          <option value="inactivas">Inactivas</option>
          <option value="expiradas">Expiradas</option>
        </select>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className={styles.loading}>
          <p>Cargando ofertas...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className={styles.error}>
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
          <button onClick={cargarOfertas} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla de ofertas */}
      {!loading && !error && (
        <>
          <div className={styles.tableInfo}>
            <span>{total} oferta{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortableHeader} onClick={() => handleSort('nombre_oferta')}>
                    <span className={styles.sortableHeaderContent}>
                      <span>Nombre</span>
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'nombre_oferta' ? styles.sortIconActive : ''}`}>{getSortIcon('nombre_oferta')}</span>
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('tipo_descuento')}>
                    <span className={styles.sortableHeaderContent}>
                      <span>Tipo</span>
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'tipo_descuento' ? styles.sortIconActive : ''}`}>{getSortIcon('tipo_descuento')}</span>
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('valor_descuento')}>
                    <span className={styles.sortableHeaderContent}>
                      <span>Valor</span>
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'valor_descuento' ? styles.sortIconActive : ''}`}>{getSortIcon('valor_descuento')}</span>
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('fecha_inicio')}>
                    <span className={styles.sortableHeaderContent}>
                      <span>Inicio</span>
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'fecha_inicio' ? styles.sortIconActive : ''}`}>{getSortIcon('fecha_inicio')}</span>
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('fecha_fin')}>
                    <span className={styles.sortableHeaderContent}>
                      <span>Fin</span>
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'fecha_fin' ? styles.sortIconActive : ''}`}>{getSortIcon('fecha_fin')}</span>
                    </span>
                  </th>
                  <th>Productos</th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('activo')}>
                    <span className={styles.sortableHeaderContent}>
                      <span>Estado</span>
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'activo' ? styles.sortIconActive : ''}`}>{getSortIcon('activo')}</span>
                    </span>
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOfertas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyMessage}>
                      {searchInput || filtroEstado !== 'todas'
                        ? 'No se encontraron ofertas con los filtros aplicados'
                        : 'No hay ofertas registradas'}
                    </td>
                  </tr>
                ) : (
                  paginatedOfertas.map((oferta) => {
                    const estado = getEstadoOferta(oferta);

                    return (
                      <tr key={oferta.id_oferta}>
                        <td>{oferta.nombre_oferta}</td>
                        <td>
                          <span className={styles.tipoBadge}>
                            {oferta.tipo_descuento === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                          </span>
                        </td>
                        <td className={styles.valorCell}>
                          {oferta.tipo_descuento === 'porcentaje'
                            ? `${oferta.valor_descuento}%`
                            : `$ ${oferta.valor_descuento}`
                          }
                        </td>
                        <td>{formatFecha(oferta.fecha_inicio)}</td>
                        <td>{formatFecha(oferta.fecha_fin)}</td>
                        <td>
                          <span className={styles.productosCount}>
                            {oferta.productos_count ?? '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.estadoBadge} ${estado.className}`}>
                            {estado.label}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.actionButton}
                              title="Editar"
                              onClick={() => handleEditar(oferta.id_oferta)}
                            >
                              <span className="material-icons">edit</span>
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                              title={!isAdmin ? 'Solo el administrador puede desactivar ofertas' : 'Desactivar'}
                              onClick={() => handleEliminar(oferta.id_oferta, oferta.nombre_oferta)}
                              disabled={!isAdmin}
                            >
                              <span className="material-icons">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={styles.pageButton}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <span className={styles.pageInfo}>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={styles.pageButton}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GestionOfertas;
