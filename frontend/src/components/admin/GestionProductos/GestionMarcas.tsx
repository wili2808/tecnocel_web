/**
 * GestionMarcas — CRUD completo de marcas desde el panel admin
 * Tabla con edición inline, creación inline y confirmación de eliminación inline.
 * Refactorizado con TanStack Table v8 y dnd-kit.
 */
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Marca } from '../../../types/product';
import MarcaModal from './MarcaModal';
import { AdminPagination } from '../common';
import styles from './GestionMarcas.module.css';

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



const DraggableTableHeader = ({ header, className }: { header: any; className?: string }) => {
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
    <th ref={setNodeRef} style={style} className={className || styles.sortableHeader}>
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

  // Estados TanStack
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

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // --- Columnas ---
  const columns = useMemo<ColumnDef<Marca>[]>(() => [
    {
      id: 'logo',
      header: 'Logo',
      enableSorting: false,
      cell: (info) => {
        const marca = info.row.original;
        return marca.logo_marca ? (
          <img src={marca.logo_marca} alt={marca.nombre_marca} className={styles.logoThumb} />
        ) : (
          <span className={`material-icons ${styles.logoPlaceholder}`}>image_not_supported</span>
        );
      }
    },
    {
      accessorKey: 'nombre_marca',
      id: 'nombre',
      header: 'Nombre',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'descripcion_marca',
      id: 'descripcion',
      header: 'Descripción',
      enableSorting: false,
      cell: info => info.getValue() ? (info.getValue() as string) : <span className={styles.emptyValue}>—</span>,
    },
    {
      accessorFn: row => row.activo ? 1 : 0,
      id: 'estado',
      header: 'Estado',
      cell: info => {
        const activo = info.row.original.activo;
        return (
          <span className={activo ? styles.badgeActivo : styles.badgeInactivo}>
            {activo ? 'Activa' : 'Inactiva'}
          </span>
        );
      }
    },
    {
      accessorFn: row => new Date(row.fyh_creacion).getTime(),
      id: 'fecha',
      header: 'Creación',
      cell: info => formatearFecha(info.row.original.fyh_creacion),
    },
  ], []);

  const table = useReactTable({
    data: marcas,
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
          <p style={{ marginTop: 16 }}>No tienes permisos para ver marcas</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <button
          className={styles.addButton}
          onClick={iniciarCreacion}
          disabled={!puedeCrear}
          title={!puedeCrear ? 'Sin permisos para crear marcas' : undefined}
        >
          <span className="material-icons">add</span>
          Nueva Marca
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando marcas...</div>
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
                          <DraggableTableHeader 
                            key={header.id} 
                            header={header} 
                            className={header.column.getCanSort() ? styles.sortableHeader : styles.th}
                          />
                        ))}
                      </SortableContext>
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className={styles.emptyMessage}>
                        No hay marcas registradas
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const marca = row.original;
                      return (
                        <tr 
                          key={row.id}
                          onClick={puedeEditar ? () => iniciarEdicion(marca) : undefined}
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
            total={marcas.length}
            limit={pagination.pageSize}
            offset={pagination.pageIndex * pagination.pageSize}
            onPageChange={(newOffset) => {
              setPagination(prev => ({
                ...prev,
                pageIndex: Math.floor(newOffset / prev.pageSize)
              }));
            }}
            itemLabel="marcas"
          />
        </>
      )}

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
