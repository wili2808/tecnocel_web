
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { 
  ColumnDef, 
  SortingState, 
  PaginationState, 
  OnChangeFn 
} from '@tanstack/react-table';

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
} from '@dnd-kit/sortable';

import DraggableTableHeader from './DraggableTableHeader';
import AdminPagination from './AdminPagination';
import AdminLoading from './AdminLoading';
import styles from './AdminDataTable.module.css';

interface AdminDataTableProps<T> {
  /** Los datos a mostrar en la tabla */
  data: T[];
  /** Definición de columnas de TanStack Table */
  columns: ColumnDef<T>[];
  /** Estado de ordenamiento (controlado) */
  sorting: SortingState;
  /** Callback cuando cambia el ordenamiento */
  onSortingChange: OnChangeFn<SortingState>;
  /** Orden de las columnas (controlado) */
  columnOrder: string[];
  /** Callback cuando cambia el orden de las columnas */
  onColumnOrderChange: OnChangeFn<string[]>;
  /** Estado de paginación (controlado) */
  pagination: PaginationState;
  /** Callback cuando cambia la paginación */
  onPaginationChange: OnChangeFn<PaginationState>;
  /** Total de items (para la paginación) */
  totalItems: number;
  /** Etiqueta de los items (ej: "usuarios", "productos") */
  itemLabel?: string;
  /** Callback opcional al hacer clic en una fila */
  onRowClick?: (row: T) => void;
  /** Estado de carga */
  isLoading?: boolean;
  /** Mensaje cuando la tabla está vacía */
  emptyMessage?: string;
  /** Clase CSS adicional para la fila */
  getRowClassName?: (row: T) => string;
  /** Si la paginación es manejada manualmente (API) o localmente */
  manualPagination?: boolean;
  /** Si el ordenamiento es manejado manualmente (API) o localmente */
  manualSorting?: boolean;
}

/**
 * Componente unificado de tabla administrativa que encapsula:
 * - TanStack Table (Sorting, Pagination, Core)
 * - dnd-kit (Reordenamiento de columnas)
 * - DraggableTableHeader integrado
 * - AdminPagination integrado
 * - Estilos Premium y Responsivos
 */
const AdminDataTable = <T,>({
  data,
  columns,
  sorting,
  onSortingChange,
  columnOrder,
  onColumnOrderChange,
  pagination,
  onPaginationChange,
  totalItems,
  itemLabel = 'registros',
  onRowClick,
  isLoading = false,
  emptyMessage = 'No se encontraron resultados',
  getRowClassName,
  manualPagination = false,
  manualSorting = false,
}: AdminDataTableProps<T>) => {
  
  // 1. Configuración de TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      columnOrder,
    },
    onSortingChange,
    onPaginationChange,
    onColumnOrderChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination,
    manualSorting,
    ...(manualPagination ? { rowCount: totalItems } : {}),
  });

  // 2. Sensores para el Drag & Drop de columnas
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      onColumnOrderChange(newOrder as any);
    }
  };
  const reserveMinHeightForOverlay = isLoading && data.length === 0;

  return (
    <div
      className={[
        styles.tableWrapper,
        reserveMinHeightForOverlay ? styles.wrapperMinForOverlay : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading ? (
        <AdminLoading variant="overlay" title="Cargando datos" message="Sincronizando con el servidor…" />
      ) : null}

      <div className={styles.tableContainer}>
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
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={styles.emptyMessage}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={`${onRowClick ? styles.clickableRow : ''} ${getRowClassName ? getRowClassName(row.original) : ''}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      <AdminPagination
        total={manualPagination ? totalItems : data.length}
        limit={pagination.pageSize}
        offset={pagination.pageIndex * pagination.pageSize}
        onPageChange={(newOffset) => {
          onPaginationChange({
            ...pagination,
            pageIndex: Math.floor(newOffset / pagination.pageSize)
          } as any);
        }}
        itemLabel={itemLabel}
      />
    </div>
  );
};

export default AdminDataTable;
