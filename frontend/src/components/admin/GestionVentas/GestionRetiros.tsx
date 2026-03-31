import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import { envioAdminService } from '../../../services/envioAdminService';
import { useDebounce } from '../../../hooks/useDebounce';
import type { EnvioAdminListItem, FiltrosEnviosAdmin, EstadoEnvio } from '../../../types/envio';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import GestionRetirosModal from './GestionRetirosModal';

const LIMIT = 20;

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const ESTADO_COLORS: Partial<Record<string, string>> = {
  pendiente: styles.estadoPendiente,
  no_aplica: styles.estadoPendiente,
  entregado: styles.estadoEntregado,
};

// 'no_aplica' es el estado legacy de retiros creados antes de la feature;
// se muestra como "Pendiente" para el personal del local
const getEstadoLabel = (estado: string): string => {
  if (estado === 'no_aplica') return ESTADO_ENVIO_LABELS.pendiente;
  return ESTADO_ENVIO_LABELS[estado as EstadoEnvio] ?? estado;
};

interface GestionRetirosProps {
  onPendientesChange?: (count: number) => void;
  puedeGestionar?: boolean;
}

const GestionRetiros: React.FC<GestionRetirosProps> = memo(({ onPendientesChange, puedeGestionar = true }) => {
  const { showNotification } = useNotification();

  const [retiros, setRetiros] = useState<EnvioAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [filtros, setFiltros] = useState<Omit<FiltrosEnviosAdmin, 'tipo_entrega'>>({});
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  const [retiroSeleccionado, setRetiroSeleccionado] = useState<EnvioAdminListItem | null>(null);

  const cargandoRef = useRef(false);

  const cargarRetiros = useCallback(async (f: Omit<FiltrosEnviosAdmin, 'tipo_entrega'>, off: number) => {
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    setCargando(true);
    setError(null);
    try {
      const result = await envioAdminService.listarRetiros({ ...f, limit: LIMIT, offset: off });
      setRetiros(result.data);
      setTotal(result.total);

      if (f.estado_envio === 'pendiente') {
        onPendientesChange?.(result.total);
      } else {
        envioAdminService.listarRetiros({ estado_envio: 'pendiente', limit: 1, offset: 0 })
          .then(r => onPendientesChange?.(r.total))
          .catch(() => {/* no crítico */});
      }
    } catch {
      setError('Error al cargar los retiros');
      showNotification('Error al cargar los retiros', 'error');
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }, [onPendientesChange, showNotification]);

  useEffect(() => {
    cargarRetiros(filtros, offset);
  }, [filtros, offset, cargarRetiros]);

  // ── Actualizar búsqueda con debounce ────────────────────────────────────
  useEffect(() => {
    setFiltros(prev => ({ ...prev, search: debouncedSearch || undefined }));
    setOffset(0);
  }, [debouncedSearch]);

  const limpiarFiltros = () => {
    setSearchInput('');
    setOffset(0);
    setFiltros({});
  };

  const handleEntregado = () => {
    setRetiroSeleccionado(null);
    cargarRetiros(filtros, offset);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  if (error) return <div className={styles.errorMsg}>{error}</div>;

  return (
    <div>
      {/* Filtros */}
      <div className={styles.filtrosBar}>
        <select
          value={filtros.estado_envio ?? ''}
          onChange={e => setFiltros(prev => ({ ...prev, estado_envio: (e.target.value as EstadoEnvio) || undefined }))}
          className={styles.filtroSelect}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">{ESTADO_ENVIO_LABELS.pendiente}</option>
          <option value="entregado">{ESTADO_ENVIO_LABELS.entregado}</option>
        </select>

        <input
          type="text"
          placeholder="Buscar por nro. venta o cliente..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className={styles.filtroInput}
        />

        <input
          type="date"
          value={filtros.fecha_inicio ?? ''}
          onChange={e => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />
        <input
          type="date"
          value={filtros.fecha_fin ?? ''}
          onChange={e => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />

        <button onClick={limpiarFiltros} className={styles.btnLimpiar}>Limpiar</button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className={styles.loadingMsg}>Cargando retiros...</div>
      ) : retiros.length === 0 ? (
        <div className={styles.emptyMsg}>No se encontraron pedidos de retiro en tienda.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nro. Venta</th>
                <th>Cliente</th>
                <th>Fecha venta</th>
                <th>Estado retiro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {retiros.map(retiro => (
                <tr key={retiro.id_envio}>
                  <td><strong>#{retiro.nro_venta}</strong></td>
                  <td>{retiro.nombre_cliente ?? <em className={styles.sinDatos}>Sin cliente</em>}</td>
                  <td>{formatFecha(retiro.fyh_creacion)}</td>
                  <td>
                    <span className={`${styles.estadoBadge} ${ESTADO_COLORS[retiro.estado_envio] ?? ''}`}>
                      {getEstadoLabel(retiro.estado_envio)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className={styles.btnSecundario}
                        onClick={() => setRetiroSeleccionado(retiro)}
                        title="Ver detalle del retiro"
                      >
                        Ver detalle
                      </button>
                      {retiro.estado_envio !== 'entregado' && (
                        <button
                          className={styles.btnPrimario}
                          onClick={() => puedeGestionar && setRetiroSeleccionado(retiro)}
                          disabled={!puedeGestionar}
                          title={!puedeGestionar ? 'Sin permisos para gestionar retiros' : 'Gestionar estado'}
                        >
                          Gestionar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {total > LIMIT && (
        <div className={styles.paginacion}>
          <span>Página {currentPage} de {totalPages} ({total} retiros)</span>
          <div className={styles.paginacionBtns}>
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className={styles.btnPag}
            >← Anterior</button>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset(offset + LIMIT)}
              className={styles.btnPag}
            >Siguiente →</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {retiroSeleccionado && (
        <GestionRetirosModal
          retiro={retiroSeleccionado}
          onClose={() => setRetiroSeleccionado(null)}
          onEntregado={handleEntregado}
        />
      )}
    </div>
  );
});

export default GestionRetiros;
