import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Category } from '../../../types/product';
import CategoriaModal from './CategoriaModal';
import { 
  AdminEntitySearchBar, 
  AdminFilterPanel, 
  AdminDataTable,
  AdminEmptyState
} from '../common';


import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

const GestionCategorias: React.FC = memo(() => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_categorias');
  const puedeCrear = tienePermiso('crear_categoria');
  const puedeEditar = tienePermiso('editar_categoria');

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados Tabla
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['nombre', 'fecha']);

  const cargarCategorias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductService.obtenerCategorias();
      setCategorias(data);
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message || 'Error al cargar categorías', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  const iniciarEdicion = useCallback((cat: Category) => {
    setCategoriaSeleccionada(cat);
    setModalOpen(true);
  }, []);

  const iniciarCreacion = useCallback(() => {
    setCategoriaSeleccionada(null);
    setModalOpen(true);
  }, []);

  // --- Columnas ---
  const columns = useMemo<ColumnDef<Category>[]>(() => [
    {
      accessorKey: 'nombre_categoria',
      id: 'nombre',
      header: 'Nombre',
      cell: info => <span className="font-bold">{info.getValue() as string}</span>,
    },
    {
      accessorFn: row => new Date(row.fyh_creacion).getTime(),
      id: 'fecha',
      header: 'Fecha creación',
      cell: info => new Date(info.row.original.fyh_creacion).toLocaleDateString('es-AR'),
    },
  ], []);

  // Filtrado local por nombre
  const categoriasFiltradas = useMemo(() => {
    if (!searchTerm) return categorias;
    const lowerSearch = searchTerm.toLowerCase();
    return categorias.filter(c => 
      c.nombre_categoria.toLowerCase().includes(lowerSearch)
    );
  }, [categorias, searchTerm]);

  if (!puedeVer) {
    return (
      <div>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso"
          message="No tienes permisos para consultar ni administrar las categorías de productos."
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
              searchPlaceholder="Buscar categorías..."
              onSearchChange={(val) => {
                setSearchTerm(val);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              primaryActionLabel="Nueva Categoría"
              primaryActionIcon="add"
              onPrimaryAction={iniciarCreacion}
              primaryActionDisabled={!puedeCrear}
            />
          </AdminFilterPanel.Grow>
        </AdminFilterPanel.Row>
      </AdminFilterPanel>

      <AdminDataTable
        data={categoriasFiltradas}
        columns={columns}
        isLoading={loading}
        sorting={sorting}
        onSortingChange={setSorting}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalItems={categoriasFiltradas.length}
        onRowClick={puedeEditar ? iniciarEdicion : undefined}
        itemLabel="categorías"
        emptyMessage={loading ? 'Cargando categorías...' : 'No se encontraron categorías'}
      />

      <CategoriaModal
        isOpen={modalOpen}
        categoria={categoriaSeleccionada}
        onClose={() => setModalOpen(false)}
        onGuardado={cargarCategorias}
      />
    </div>
  );
});

export default GestionCategorias;
