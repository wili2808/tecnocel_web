import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { TipoCaracteristica } from '../../../types/product';
import CaracteristicaModal from './CaracteristicaModal';
import { 
  AdminEntitySearchBar, 
  AdminFilterPanel, 
  AdminDataTable,
  AdminEmptyState 
} from '../common';
import styles from './GestionProductos.module.css';

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

const TIPO_DATO_LABELS: Record<TipoCaracteristica['tipo_dato'], string> = {
  texto: 'Texto',
  numero: 'Número',
  booleano: 'Booleano (Sí/No)',
  seleccion: 'Selección',
};

const parseOpciones = (opciones: unknown): string[] => {
  if (!opciones) return [];
  if (Array.isArray(opciones)) return opciones.filter((item): item is string => typeof item === 'string');
  if (typeof opciones !== 'string') return [];

  try {
    const parsed = JSON.parse(opciones);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const GestionCaracteristicas: React.FC = memo(() => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_caracteristicas');
  const puedeCrear = tienePermiso('crear_caracteristica');
  const puedeEditar = tienePermiso('editar_caracteristica');

  const [tipos, setTipos] = useState<TipoCaracteristica[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoCaracteristica | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados Tabla
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['nombre', 'tipo', 'unidad', 'estado']);

  const cargarTipos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductService.obtenerTiposCaracteristicas();
      setTipos(data);
    } catch (err: any) {
      showNotification(err.message || 'Error al cargar tipos de características', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    cargarTipos();
  }, [cargarTipos]);

  const abrirFormCrear = useCallback(() => {
    setTipoSeleccionado(null);
    setModalOpen(true);
  }, []);

  const abrirFormEditar = useCallback((tipo: TipoCaracteristica) => {
    setTipoSeleccionado(tipo);
    setModalOpen(true);
  }, []);

  const renderUnidadOpciones = useCallback((tipo: TipoCaracteristica) => {
    if (tipo.tipo_dato === 'numero' && tipo.unidad_medida) {
      return <span className="modalBadgePremium neutral">{tipo.unidad_medida}</span>;
    }
    if (tipo.tipo_dato === 'seleccion') {
      const opciones = parseOpciones(tipo.opciones_seleccion);
      if (!opciones.length) return <span className="text-muted">—</span>;
      return (
        <div className="flex gap-xs flex-wrap">
          {opciones.slice(0, 2).map((op) => (
            <span key={op} className="modalBadgePremium primary text-xxs">
              {op}
            </span>
          ))}
          {opciones.length > 2 && <span className="modalBadgePremium neutral text-xxs">+{opciones.length - 2}</span>}
        </div>
      );
    }
    return <span className="text-muted">—</span>;
  }, []);

  // --- Columnas ---
  const columns = useMemo<ColumnDef<TipoCaracteristica>[]>(() => [
    {
      accessorKey: 'nombre_tipo',
      id: 'nombre',
      header: 'Nombre',
      cell: info => {
        const tipo = info.row.original;
        return (
          <div className="flex flex-col">
            <span className={styles.tipoNombre}>{tipo.nombre_tipo}</span>
            {tipo.descripcion && <span className={styles.tipoDescripcion}>{tipo.descripcion}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: 'tipo_dato',
      id: 'tipo',
      header: 'Tipo de dato',
      cell: info => (
        <span className="modalBadgePremium neutral">{TIPO_DATO_LABELS[info.getValue() as TipoCaracteristica['tipo_dato']]}</span>
      )
    },
    {
      id: 'unidad',
      header: 'Unidad / Opciones',
      enableSorting: false,
      cell: info => renderUnidadOpciones(info.row.original)
    },
    {
      accessorFn: row => row.activo ? 1 : 0,
      id: 'estado',
      header: 'Estado',
      cell: info => {
        const activo = info.row.original.activo;
        return (
          <span className={`modalBadgePremium ${activo ? 'success' : 'error'}`}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        );
      }
    },
  ], [renderUnidadOpciones]);

  // Filtrado local
  const tiposFiltrados = useMemo(() => {
    if (!searchTerm) return tipos;
    const lowerSearch = searchTerm.toLowerCase();
    return tipos.filter(t => 
      t.nombre_tipo.toLowerCase().includes(lowerSearch) || 
      (t.descripcion && t.descripcion.toLowerCase().includes(lowerSearch))
    );
  }, [tipos, searchTerm]);

  if (!puedeVer) {
    return (
      <div>
        <AdminEmptyState
          icon="lock"
          title="Permisos insuficientes"
          message="No cuentas con la autorización necesaria para gestionar las características de productos."
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div>
      <AdminFilterPanel>
        <AdminFilterPanel.Row variant="bottom">
          <AdminFilterPanel.Grow>
            <AdminEntitySearchBar
              searchValue={searchTerm}
              searchLabel="Búsqueda"
              searchPlaceholder="Buscar características..."
              onSearchChange={(val) => {
                setSearchTerm(val);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              primaryActionLabel="Nueva Característica"
              primaryActionIcon="add"
              onPrimaryAction={abrirFormCrear}
              primaryActionDisabled={!puedeCrear}
            />
          </AdminFilterPanel.Grow>
        </AdminFilterPanel.Row>
      </AdminFilterPanel>

      <AdminDataTable
        data={tiposFiltrados}
        columns={columns}
        isLoading={loading}
        sorting={sorting}
        onSortingChange={setSorting}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalItems={tiposFiltrados.length}
        onRowClick={puedeEditar ? abrirFormEditar : undefined}
        itemLabel="características"
        emptyMessage={loading ? 'Cargando características...' : 'No se encontraron características'}
      />

      <CaracteristicaModal
        isOpen={modalOpen}
        tipo={tipoSeleccionado}
        onClose={() => setModalOpen(false)}
        onGuardado={cargarTipos}
      />
    </div>
  );
});

export default GestionCaracteristicas;
