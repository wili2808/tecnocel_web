/**
 * GestionCategorias — CRUD completo de categorías desde el panel admin
 * Tabla con edición inline, creación inline y confirmación de eliminación inline.
 * Refactorizado con TanStack Table v8 y dnd-kit.
 */
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Category } from '../../../types/product';
import CategoriaModal from './CategoriaModal';
import { AdminEntitySearchBar, AdminFilterPanel, AdminPagination } from '../common';
import styles from './GestionCategorias.module.css';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';



const DraggableTableHeader = ({ header }: { header: any }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
    id: header.column.id,
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
    cursor: 'default',
  };

  return (
    <th ref={setNodeRef} style={style} className={styles.sortableHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span 
          {...attributes} 
          {...listeners} 
          className="material-icons" 
          style={{ fontSize: '16px', color: '#aaa', cursor: 'grab' }}
          title="Arrastrar para mover columna"
        >
          drag_indicator
        </span>
        <div
          className={header.column.getCanSort() ? styles.sortableHeaderContent : ''}
          onClick={header.column.getToggleSortingHandler()}
          style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {header.column.getCanSort() && (
            <span
              className={`material-icons ${styles.sortIcon} ${header.column.getIsSorted() ? styles.sortIconActive : ''}`}
            >
              {{
                asc: 'arrow_upward',
                desc: 'arrow_downward',
              }[header.column.getIsSorted() as string] ?? 'unfold_more'}
            </span>
          )}
        </div>
      </div>
    </th>
  );
};

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

  // Estados TanStack
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

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // --- Columnas ---
  const columns = useMemo<ColumnDef<Category>[]>(() => [
    {
      accessorKey: 'nombre_categoria',
      id: 'nombre',
      header: 'Nombre',
      cell: info => info.getValue() as string,
    },
    {
      accessorFn: row => new Date(row.fyh_creacion).getTime(),
      id: 'fecha',
      header: 'Fecha creación',
      cell: info => formatearFecha(info.row.original.fyh_creacion),
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

  const table = useReactTable({
    data: categoriasFiltradas,
    columns,
    state: {
      sorting,
      pagination,
      columnOrder,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  };

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <span className="material-icons" style={{ fontSize: 48, opacity: 0.5 }}>
            lock
          </span>
          <p style={{ marginTop: 16 }}>No tienes permisos para ver categorías</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
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

      {loading ? (
        <div className={styles.loadingState}>Cargando categorías...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className={styles.table}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        {headerGroup.headers.map(header => (
                          <DraggableTableHeader key={header.id} header={header} />
                        ))}
                      </SortableContext>
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className={styles.emptyMessage}>
                        No hay categorías registradas
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const cat = row.original;
                      return (
                        <tr 
                          key={row.id}
                          onClick={puedeEditar ? () => iniciarEdicion(cat) : undefined}
                          style={{ cursor: puedeEditar ? 'pointer' : 'default' }}
                          className={puedeEditar ? styles.clickableRow : ''}
                        >
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className={styles.td}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>
          <AdminPagination
            total={categorias.length}
            limit={pagination.pageSize}
            offset={pagination.pageIndex * pagination.pageSize}
            onPageChange={(newOffset) => {
              setPagination(prev => ({
                ...prev,
                pageIndex: Math.floor(newOffset / prev.pageSize)
              }));
            }}
            itemLabel="categorías"
          />
        </>
      )}

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
