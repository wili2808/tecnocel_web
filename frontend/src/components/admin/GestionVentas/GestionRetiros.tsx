import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import envioAdminService from '../../../services/envioAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import { AdminEntitySearchBar, AdminFilterPanel, AdminDataTable } from '../common';
import GestionRetirosModal from './GestionRetirosModal';
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
}

const GestionRetiros: React.FC<GestionRetirosProps> = memo(({ onPendientesChange }) => {
  const { showNotification } = useNotification();

  const [retiros, setRetiros] = useState<EnvioAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Omit<FiltrosEnviosAdmin, 'tipo_entrega'>>({});
  const [retiroSeleccionado, setRetiroSeleccionado] = useState<EnvioAdminListItem | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nro_venta', 'cliente', 'fecha', 'estado'
  ]);

  const cargandoRef = useRef(false);

  const cargarRetiros = useCallback(
    async (f: Omit<FiltrosEnviosAdmin, 'tipo_entrega'>, pag: PaginationState, sort: SortingState) => {
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
            default: sortBy = 'fyh_creacion';
          }
        }

        const result = await envioAdminService.listarRetiros({ 
          ...f, 
          limit: pag.pageSize, 
          offset: off,
          sortBy,
          order
        });
        setRetiros(result.data);
        setTotal(result.total);

        if (f.estado_envio === 'pendiente') {
          onPendientesChange?.(result.total);
        } else {
          envioAdminService
            .listarRetiros({ estado_envio: 'pendiente', limit: 1, offset: 0 })
            .then((r) => onPendientesChange?.(r.total))
            .catch(() => {
              /* no crítico */
            });
        }
      } catch {
        setError('Error al cargar los retiros');
        showNotification('Error al cargar los retiros', 'error');
      } finally {
        setCargando(false);
        cargandoRef.current = false;
      }
    },
    [onPendientesChange, showNotification],
  );

  useEffect(() => {
    cargarRetiros(filtros, pagination, sorting);
  }, [filtros, pagination, sorting, cargarRetiros]);

  const limpiarFiltros = () => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    setFiltros({});
  };

  const handleEntregado = () => {
    setRetiroSeleccionado(null);
    cargarRetiros(filtros, pagination, sorting);
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
      accessorKey: 'fyh_creacion',
      id: 'fecha',
      header: 'Fecha venta',
      cell: info => formatFecha(info.getValue() as string),
    },
    {
      accessorKey: 'estado_envio',
      id: 'estado',
      header: 'Estado retiro',
      cell: info => {
        const estado = info.getValue() as string;
        return (
          <span className={`${styles.estadoBadge} ${ESTADO_COLORS[estado] ?? ''}`}>
            {getEstadoLabel(estado)}
          </span>
        );
      },
    },
  ], []);


  if (error) return <div className={styles.errorMsg}>{error}</div>;

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
                <option value="pendiente">{ESTADO_ENVIO_LABELS.pendiente}</option>
                <option value="entregado">{ESTADO_ENVIO_LABELS.entregado}</option>
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

      {/* Tabla */}
        <AdminDataTable
          data={retiros}
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalItems={total}
          itemLabel="retiros"
          onRowClick={(row) => setRetiroSeleccionado(row)}
          isLoading={cargando}
          manualPagination={true}
          manualSorting={true}
          emptyMessage="No se encontraron pedidos de retiro en tienda."
        />

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
