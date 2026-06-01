import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import envioAdminService from '../../../services/envioAdminService';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import { AdminEntitySearchBar, AdminFilterPanel, AdminDataTable, AdminLoading } from '../common';
import GestionEnviosModal from './GestionEnviosModal';
import styles from './GestionVentas.module.css';
import controlStyles from '../common/AdminControlStyles.module.css';
import type { EnvioAdminListItem, FiltrosEnviosAdmin, EstadoEnvio } from '../../../types/envio';

import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';


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
}

const GestionEnvios: React.FC<GestionEnviosProps> = memo(({ onPendientesChange }) => {
  const { showNotification } = useNotification();

  const [envios, setEnvios] = useState<EnvioAdminListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);

  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosEnviosAdmin>({});
  const [envioSeleccionado, setEnvioSeleccionado] = useState<EnvioAdminListItem | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nro_venta', 'cliente', 'direccion', 'fecha', 'estado', 'seguimiento'
  ]);

  const cargandoRef = useRef(false);

  const cargarEnvios = useCallback(
    async (f: FiltrosEnviosAdmin, pag: PaginationState, sort: SortingState) => {
      if (cargandoRef.current) return;
      cargandoRef.current = true;
      setCargando(true);
      setError(null);
      try {
        const off = pag.pageIndex * pag.pageSize;
        
        // Mapeo de columnas para el backend
        let sortBy = 'fyh_creacion';
        let order: 'ASC' | 'DESC' = 'DESC';
        
        if (sort.length > 0) {
          const s = sort[0];
          order = s.desc ? 'DESC' : 'ASC';
          switch (s.id) {
            case 'nro_venta': sortBy = 'nro_venta'; break;
            case 'fecha': sortBy = 'fyh_creacion'; break;
            case 'estado': sortBy = 'estado_envio'; break;
            case 'seguimiento': sortBy = 'nro_seguimiento'; break;
            default: sortBy = 'fyh_creacion';
          }
        }

        const result = await envioAdminService.listarEnvios({ 
          ...f, 
          limit: pag.pageSize, 
          offset: off,
          sortBy,
          order
        });
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
    cargarEnvios(filtros, pagination, sorting);
  }, [filtros, pagination, sorting, cargarEnvios]);



  const limpiarFiltros = () => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    setFiltros({});
  };

  const handleEstadoActualizado = () => {
    setEnvioSeleccionado(null);
    cargarEnvios(filtros, pagination, sorting);
  };

  // === Columnas TanStack ===
  const columns = useMemo<ColumnDef<EnvioAdminListItem>[]>(() => [
    {
      accessorKey: 'nro_venta',
      id: 'nro_venta',
      header: 'Nro. Venta',
      cell: info => <strong>#{info.getValue() as string}</strong>,
    },
    {
      accessorKey: 'nombre_cliente',
      id: 'cliente',
      header: 'Cliente',
      cell: info => info.getValue() ? (info.getValue() as string) : <em className={styles.sinDatos}>Sin cliente</em>,
    },
    {
      id: 'direccion',
      header: 'Dirección destino',
      cell: info => {
        const e = info.row.original;
        return (
          <span className={styles.direccion}>
            {[e.envio_calle, e.envio_numero, e.envio_ciudad, e.envio_provincia]
              .filter(Boolean)
              .join(', ') || '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'fyh_creacion',
      id: 'fecha',
      header: 'Fecha venta',
      cell: info => formatFecha(info.getValue() as string),
    },
    {
      accessorKey: 'estado_envio',
      id: 'estado',
      header: 'Estado envío',
      cell: info => {
        const estado = info.getValue() as EstadoEnvio;
        return (
          <span className={`${styles.estadoBadge} ${ESTADO_COLORS[estado]}`}>
            {ESTADO_ENVIO_LABELS[estado]}
          </span>
        );
      },
    },
    {
      accessorKey: 'nro_seguimiento',
      id: 'seguimiento',
      header: 'Nro. seguimiento',
      cell: info => (
        <span className={styles.nroSeguimiento}>
          {info.getValue() ? (info.getValue() as string) : <em className={styles.sinDatos}>—</em>}
        </span>
      ),
    },
  ], []);


  return (
    <div>
      {/* Filtros - Usando Sistema Global */}
      <AdminFilterPanel>
        <AdminFilterPanel.Row variant="top">
          <AdminFilterPanel.Group>
            <AdminFilterPanel.Label>Desde</AdminFilterPanel.Label>
              <input
                type="date"
                value={filtros.fecha_inicio ?? ''}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
                className={controlStyles.field}
              />
          </AdminFilterPanel.Group>
          <AdminFilterPanel.Group>
            <AdminFilterPanel.Label>Hasta</AdminFilterPanel.Label>
              <input
                type="date"
                value={filtros.fecha_fin ?? ''}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }))}
                className={controlStyles.field}
              />
          </AdminFilterPanel.Group>
          <AdminFilterPanel.Group>
            <AdminFilterPanel.Label>Estado</AdminFilterPanel.Label>
              <select
                value={filtros.estado_envio ?? ''}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, estado_envio: (e.target.value as EstadoEnvio) || undefined }))
                }
                className={controlStyles.field}
              >
                <option value="">Todos los estados</option>
                {(Object.keys(ESTADO_ENVIO_LABELS) as EstadoEnvio[]).map((est) => (
                  <option key={est} value={est}>
                    {ESTADO_ENVIO_LABELS[est]}
                  </option>
                ))}
              </select>
          </AdminFilterPanel.Group>
        </AdminFilterPanel.Row>

        <AdminFilterPanel.Row variant="bottom">
          <AdminFilterPanel.Grow>
            <AdminEntitySearchBar
              searchValue={filtros.search || ''}
              searchPlaceholder="Buscar por nro. venta o cliente..."
              onSearchChange={(val) => {
                setFiltros((prev) => ({ ...prev, search: val || undefined }));
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
              }}
              searchLabel="Búsqueda"
              primaryActionHidden
            />
          </AdminFilterPanel.Grow>
          <AdminFilterPanel.Actions>
            <button onClick={limpiarFiltros} className={controlStyles.secondaryButton}>
              <span className="material-icons">backspace</span>
              <span>Limpiar</span>
            </button>
          </AdminFilterPanel.Actions>
        </AdminFilterPanel.Row>
      </AdminFilterPanel>

      {/* Estado de carga inicial */}
      {cargando && envios.length === 0 && !error && (
        <AdminLoading
          variant="panel"
          title="Cargando envíos"
          message="Estamos obteniendo el listado de envíos a domicilio y sus estados..."
        />
      )}

      {/* Error */}
      {!cargando && error && (
        <div className={styles.errorMsg}>{error}</div>
      )}

      {/* Tabla (siempre montada una vez que hay data) */}
      {!error && (envios.length > 0 || !cargando) && (
        <AdminDataTable
          data={envios}
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalItems={total}
          itemLabel="envíos"
          onRowClick={(row) => setEnvioSeleccionado(row)}
          isLoading={cargando}
          manualPagination={true}
          manualSorting={true}
          emptyMessage="No se encontraron pedidos de envío a domicilio."
        />
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
