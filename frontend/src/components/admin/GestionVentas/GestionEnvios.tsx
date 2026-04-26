import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import envioAdminService from '../../../services/envioAdminService';
import { useDebounce } from '../../../hooks/useDebounce';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import GestionEnviosModal from './GestionEnviosModal';
import styles from './GestionVentas.module.css';
import type { EnvioAdminListItem, FiltrosEnviosAdmin, EstadoEnvio } from '../../../types/envio';

const LIMIT = 20;

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const ESTADO_COLORS: Record<EstadoEnvio, string> = {
  pendiente: styles.estadoPendiente,
  en_preparacion: styles.estadoEnPreparacion,
  en_camino: styles.estadoEnCamino,
  entregado: styles.estadoEntregado,
};

interface GestionEnviosProps {
  onPendientesChange?: (count: number) => void;
  puedeGestionar?: boolean;
}

const GestionEnvios: React.FC<GestionEnviosProps> = memo(({ onPendientesChange, puedeGestionar = true }) => {
  const { showNotification } = useNotification();

  const [envios, setEnvios] = useState<EnvioAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [filtros, setFiltros] = useState<FiltrosEnviosAdmin>({});
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  const [envioSeleccionado, setEnvioSeleccionado] = useState<EnvioAdminListItem | null>(null);

  const cargandoRef = useRef(false);

  const cargarEnvios = useCallback(
    async (f: FiltrosEnviosAdmin, off: number) => {
      if (cargandoRef.current) return;
      cargandoRef.current = true;
      setCargando(true);
      setError(null);
      try {
        const result = await envioAdminService.listarEnvios({ ...f, limit: LIMIT, offset: off });
        setEnvios(result.data);
        setTotal(result.total);

        if (f.estado_envio === 'pendiente') {
          onPendientesChange?.(result.total);
        } else {
          envioAdminService
            .listarEnvios({ estado_envio: 'pendiente', limit: 1, offset: 0 })
            .then((r) => onPendientesChange?.(r.total))
            .catch(() => {
              /* no crítico */
            });
        }
      } catch {
        setError('Error al cargar los envíos');
        showNotification('Error al cargar los envíos', 'error');
      } finally {
        setCargando(false);
        cargandoRef.current = false;
      }
    },
    [onPendientesChange, showNotification],
  );

  useEffect(() => {
    cargarEnvios(filtros, offset);
  }, [filtros, offset, cargarEnvios]);

  // ── Actualizar búsqueda con debounce ────────────────────────────────────
  useEffect(() => {
    setFiltros((prev) => ({ ...prev, search: debouncedSearch || undefined }));
    setOffset(0);
  }, [debouncedSearch]);

  const limpiarFiltros = () => {
    setSearchInput('');
    setOffset(0);
    setFiltros({});
  };

  const handleEstadoActualizado = () => {
    setEnvioSeleccionado(null);
    cargarEnvios(filtros, offset);
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
          onChange={(e) =>
            setFiltros((prev) => ({ ...prev, estado_envio: (e.target.value as EstadoEnvio) || undefined }))
          }
          className={styles.filtroSelect}
        >
          <option value="">Todos los estados</option>
          {(Object.keys(ESTADO_ENVIO_LABELS) as EstadoEnvio[]).map((est) => (
            <option key={est} value={est}>
              {ESTADO_ENVIO_LABELS[est]}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por nro. venta o cliente..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.filtroInput}
        />

        <input
          type="date"
          value={filtros.fecha_inicio ?? ''}
          onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />
        <input
          type="date"
          value={filtros.fecha_fin ?? ''}
          onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />

        <button onClick={limpiarFiltros} className={styles.btnLimpiar}>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className={styles.loadingMsg}>Cargando envíos...</div>
      ) : envios.length === 0 ? (
        <div className={styles.emptyMsg}>No se encontraron envíos a domicilio.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nro. Venta</th>
                <th>Cliente</th>
                <th>Dirección destino</th>
                <th>Fecha venta</th>
                <th>Estado envío</th>
                <th>Nro. seguimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {envios.map((envio) => (
                <tr key={envio.id_envio}>
                  <td>
                    <strong>#{envio.nro_venta}</strong>
                  </td>
                  <td>{envio.nombre_cliente ?? <em className={styles.sinDatos}>Sin cliente</em>}</td>
                  <td className={styles.direccion}>
                    {[envio.envio_calle, envio.envio_numero, envio.envio_ciudad, envio.envio_provincia]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td>{formatFecha(envio.fyh_creacion)}</td>
                  <td>
                    <span className={`${styles.estadoBadge} ${ESTADO_COLORS[envio.estado_envio]}`}>
                      {ESTADO_ENVIO_LABELS[envio.estado_envio]}
                    </span>
                  </td>
                  <td className={styles.nroSeguimiento}>
                    {envio.nro_seguimiento ?? <em className={styles.sinDatos}>—</em>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className={envio.estado_envio !== 'entregado' ? styles.btnPrimario : styles.btnSecundario}
                        onClick={() => setEnvioSeleccionado(envio)}
                        disabled={envio.estado_envio !== 'entregado' && !puedeGestionar}
                        title={
                          envio.estado_envio !== 'entregado'
                            ? !puedeGestionar
                              ? 'Sin permisos para gestionar envíos'
                              : 'Gestionar estado'
                            : 'Ver detalle del envío'
                        }
                      >
                        {envio.estado_envio !== 'entregado' ? 'Gestionar' : 'Ver detalle'}
                      </button>
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
          <span>
            Página {currentPage} de {totalPages} ({total} envíos)
          </span>
          <div className={styles.paginacionBtns}>
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className={styles.btnPag}
            >
              ← Anterior
            </button>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset(offset + LIMIT)}
              className={styles.btnPag}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {envioSeleccionado && (
        <GestionEnviosModal
          envio={envioSeleccionado}
          onClose={() => setEnvioSeleccionado(null)}
          onActualizado={handleEstadoActualizado}
        />
      )}
    </div>
  );
});

export default GestionEnvios;
