import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import proveedorAdminService from '../../../services/proveedorAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import ProveedorModal from './ProveedorModal';
import { AdminSearch, AdminPagination, AdminSurface, AdminEmptyState } from '../common';
import styles from './GestionCompras.module.css';
import type { ProveedorListItem } from '../../../types';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>
      </div>
    </th>
  );
};

const GestionProveedores: React.FC = memo(() => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_proveedores');
  const puedeCrear = tienePermiso('crear_proveedor');
  const puedeEditar = tienePermiso('editar_proveedor');
  const { showNotification } = useNotification();

  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProveedor, setModalProveedor] = useState<ProveedorListItem | null | 'new'>(null);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nombre', 'empresa', 'celular', 'email', 'direccion'
  ]);

  const cargarProveedores = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const response = await proveedorAdminService.listarProveedores(searchTerm || undefined, limit, offset);
      setProveedores(response.data);
      setTotal(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
      setProveedores([]);
    } finally {
      setCargando(false);
    }
  }, [searchTerm, limit, offset]);

  // Ejecutar búsqueda cuando cambia debouncedSearch (500ms después de dejar de escribir)
  // Ejecutar búsqueda cuando cambia searchTerm (ya viene debounced de AdminSearch)
  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  const handleGuardado = () => {
    cargarProveedores();
    setModalProveedor(null);
    showNotification('Proveedor guardado exitosamente', 'success');
  };

  // === Columnas TanStack ===
  const columns = useMemo<ColumnDef<ProveedorListItem>[]>(() => [
    {
      accessorKey: 'nombre_proveedor',
      id: 'nombre',
      header: 'Nombre',
      cell: info => <span style={{ fontWeight: 600 }}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'empresa',
      id: 'empresa',
      header: 'Empresa',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'celular',
      id: 'celular',
      header: 'Celular',
      cell: info => <span style={{ fontSize: '12px' }}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'email',
      id: 'email',
      header: 'Email',
      cell: info => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {(info.getValue() as string) || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'direccion',
      id: 'direccion',
      header: 'Dirección',
      cell: info => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '200px', display: 'inline-block', whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {(info.getValue() as string)}
        </span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: proveedores,
    columns,
    state: {
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
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
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className="material-icons">local_shipping</span>
            Gestión de Proveedores
          </h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <span className="material-icons" style={{ fontSize: 48, opacity: 0.5 }}>
            lock
          </span>
          <p style={{ marginTop: 16 }}>No tienes permisos para ver proveedores</p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <AdminEmptyState
        icon="hourglass_empty"
        title="Cargando proveedores"
        message="Estamos obteniendo la lista de proveedores registrados..."
        className={styles.loadingState}
      />
    );
  }

  if (error) {
    return (
      <AdminEmptyState
        icon="error_outline"
        title="No pudimos cargar los proveedores"
        message={error}
        actionLabel="Reintentar"
        onAction={cargarProveedores}
        tone="danger"
        className={styles.errorState}
      />
    );
  }

  return (
    <>
      {/* Buscador y botón crear - Usando Sistema Global */}
      <AdminSurface className="admin-filter-shell" tone="muted">
        <div className="admin-search-form">
          <div className="admin-search-wrapper">
            <AdminSearch
              value={searchTerm}
              placeholder="Nombre, empresa, celular..."
              onChange={(val) => {
                setSearchTerm(val);
                setOffset(0);
              }}
            />
          </div>
          <div className="admin-action-row">
            <button
              className={styles.crearButton}
              onClick={() => setModalProveedor('new')}
              disabled={!puedeCrear}
              title={!puedeCrear ? 'Sin permisos para crear proveedores' : undefined}
            >
              <span className="material-icons">person_add</span>
              <span>Nuevo Proveedor</span>
            </button>
          </div>
        </div>
      </AdminSurface>

      {/* Tabla */}
      {proveedores.length === 0 ? (
        <AdminEmptyState
          icon="inventory_2"
          title="No hay proveedores"
          message={searchTerm ? `No se encontraron resultados para "${searchTerm}"` : "No hay proveedores registrados aún."}
          className={styles.loadingState}
        />
      ) : (
        <div className={styles.tableContainer}>
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
                          />
                        ))}
                      </SortableContext>
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr 
                      key={row.id}
                      onClick={() => {
                        if (puedeEditar) {
                          setModalProveedor(row.original);
                        } else {
                          showNotification('No tienes permisos para editar proveedores', 'info');
                        }
                      }}
                      className={styles.clickableRow}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </DndContext>
          </div>
          <AdminPagination
            total={total}
            limit={limit}
            offset={offset}
            onPageChange={setOffset}
            itemLabel="proveedores"
          />
        </div>
      )}

      {/* Modal */}
      {modalProveedor && (
        <ProveedorModal
          proveedor={modalProveedor === 'new' ? undefined : modalProveedor}
          onClose={() => setModalProveedor(null)}
          onGuardado={handleGuardado}
        />
      )}
    </>
  );
});

GestionProveedores.displayName = 'GestionProveedores';

export default GestionProveedores;
