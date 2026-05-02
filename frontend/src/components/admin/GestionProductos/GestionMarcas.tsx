import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Marca } from '../../../types/product';
import MarcaModal from './MarcaModal';
import { 
  AdminEntitySearchBar, 
  AdminFilterPanel, 
  AdminDataTable,
  AdminEmptyState 
} from '../common';
import styles from './GestionProductos.module.css';

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

const GestionMarcas: React.FC = memo(() => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_marcas');
  const puedeCrear = tienePermiso('crear_marca');
  const puedeEditar = tienePermiso('editar_marca');

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<Marca | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados Tabla
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['logo', 'nombre', 'descripcion', 'estado', 'fecha']);

  const cargarMarcas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductService.obtenerMarcas();
      setMarcas(data);
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message || 'Error al cargar marcas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    cargarMarcas();
  }, [cargarMarcas]);

  const iniciarEdicion = useCallback((marca: Marca) => {
    setMarcaSeleccionada(marca);
    setModalOpen(true);
  }, []);

  const iniciarCreacion = useCallback(() => {
    setMarcaSeleccionada(null);
    setModalOpen(true);
  }, []);

  // --- Columnas ---
  const columns = useMemo<ColumnDef<Marca>[]>(() => [
    {
      id: 'logo',
      header: 'Logo',
      enableSorting: false,
      cell: (info) => {
        const marca = info.row.original;
        return marca.logo_marca ? (
          <div className={styles.logoContainer}>
            <img src={marca.logo_marca} alt={marca.nombre_marca} className={styles.logoThumb} />
          </div>
        ) : (
          <div className={styles.logoPlaceholder}>
            <span className="material-icons">image_not_supported</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'nombre_marca',
      id: 'nombre',
      header: 'Nombre',
      cell: info => <span className="font-bold">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'descripcion_marca',
      id: 'descripcion',
      header: 'Descripción',
      enableSorting: false,
      cell: info => info.getValue() ? (info.getValue() as string) : <span className="text-muted">—</span>,
    },
    {
      accessorFn: row => row.activo ? 1 : 0,
      id: 'estado',
      header: 'Estado',
      cell: info => {
        const activo = info.row.original.activo;
        return (
          <span className={`modalBadgePremium ${activo ? 'success' : 'error'}`}>
            {activo ? 'Activa' : 'Inactiva'}
          </span>
        );
      }
    },
    {
      accessorFn: row => new Date(row.fyh_creacion).getTime(),
      id: 'fecha',
      header: 'Creación',
      cell: info => new Date(info.row.original.fyh_creacion).toLocaleDateString('es-AR'),
    },
  ], []);

  // Filtrado local por nombre
  const marcasFiltradas = useMemo(() => {
    if (!searchTerm) return marcas;
    const lowerSearch = searchTerm.toLowerCase();
    return marcas.filter(m => 
      m.nombre_marca.toLowerCase().includes(lowerSearch) || 
      (m.descripcion_marca && m.descripcion_marca.toLowerCase().includes(lowerSearch))
    );
  }, [marcas, searchTerm]);

  if (!puedeVer) {
    return (
      <div>
        <AdminEmptyState
          icon="lock"
          title="Acceso restringido"
          message="No tienes permisos para visualizar ni administrar las marcas del sistema."
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
              searchPlaceholder="Buscar marcas..."
              onSearchChange={(val) => {
                setSearchTerm(val);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              primaryActionLabel="Nueva Marca"
              primaryActionIcon="add"
              onPrimaryAction={iniciarCreacion}
              primaryActionDisabled={!puedeCrear}
            />
          </AdminFilterPanel.Grow>
        </AdminFilterPanel.Row>
      </AdminFilterPanel>

      <AdminDataTable
        data={marcasFiltradas}
        columns={columns}
        isLoading={loading}
        sorting={sorting}
        onSortingChange={setSorting}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalItems={marcasFiltradas.length}
        onRowClick={puedeEditar ? iniciarEdicion : undefined}
        itemLabel="marcas"
        emptyMessage={loading ? 'Cargando marcas...' : 'No se encontraron marcas'}
      />

      <MarcaModal
        isOpen={modalOpen}
        marca={marcaSeleccionada}
        onClose={() => setModalOpen(false)}
        onGuardado={cargarMarcas}
      />
    </div>
  );
});

export default GestionMarcas;
