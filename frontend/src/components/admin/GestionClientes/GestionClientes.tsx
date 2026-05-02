import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminEmptyState, AdminSurface, AdminSearch, AdminPagination } from '../common';
import usuarioService from '../../../services/usuarioService';
import DetalleClienteModal from './DetalleClienteModal';
import EditarClienteModal from './EditarClienteModal';
import CrearClienteModal from './CrearClienteModal';
import styles from './GestionClientes.module.css';
import type { ClienteListItem } from '../../../types/usuario';

const LIMIT = 10;

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';

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

const GestionClientes = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_clientes');
  const puedeCrear = tienePermiso('crear_cliente');
  const { showNotification } = useNotification();

  const [clientes, setClientes] = useState<ClienteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Paginación
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id_cliente', desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'id_cliente', 'nombre', 'email', 'celular', 'nit_ci', 'estado', 'fecha'
  ]);

  // Modal state
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteListItem | null>(null);
  const [tipoModal, setTipoModal] = useState<'detalle' | 'editar' | null>(null);
  const [showCrearModal, setShowCrearModal] = useState(false);

  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usuarioService.listarClientes(LIMIT, offset, searchTerm || undefined);
      setClientes(data.clientes || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes');
      showNotification(err.message || 'Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [offset, searchTerm, showNotification]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // ── Handlers de modal ──────────────────────────────────────────────────────
  const handleVerDetalle = useCallback((cliente: ClienteListItem) => {
    setClienteSeleccionado(cliente);
    setTipoModal('detalle');
  }, []);

  const handleEditar = useCallback((cliente: ClienteListItem) => {
    setClienteSeleccionado(cliente);
    setTipoModal('editar');
  }, []);

  const handleCerrarModal = () => {
    setClienteSeleccionado(null);
    setTipoModal(null);
  };

  // ── Columnas ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<ClienteListItem>[]>(() => [
    {
      accessorKey: 'id_cliente',
      id: 'id_cliente',
      header: 'ID',
      cell: info => info.getValue(),
    },
    {
      accessorFn: row => `${row.nombre_cliente} ${row.apellido_cliente}`,
      id: 'nombre',
      header: 'Nombre Completo',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'email_cliente',
      id: 'email',
      header: 'Email',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'celular_cliente',
      id: 'celular',
      header: 'Celular',
      cell: info => info.getValue() ? (info.getValue() as string) : '-',
    },
    {
      accessorKey: 'nit_ci_cliente',
      id: 'nit_ci',
      header: 'NIT/CI',
      enableSorting: false,
      cell: info => info.getValue() ? (info.getValue() as string) : '-',
    },
    {
      accessorFn: row => row.email_verified && row.is_web_enabled ? 1 : 0,
      id: 'estado',
      header: 'Estado',
      cell: info => {
        const cliente = info.row.original;
        const isActive = cliente.email_verified && cliente.is_web_enabled;
        return (
          <span
            className={`${styles.badge} ${
              isActive ? styles.badgeActive : styles.badgeInactive
            }`}
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        );
      }
    },
    {
      accessorFn: row => row.fyh_creacion ? new Date(row.fyh_creacion).getTime() : 0,
      id: 'fecha',
      header: 'Fecha de Registro',
      cell: info => {
        const fyh_creacion = info.row.original.fyh_creacion;
        return fyh_creacion ? new Date(fyh_creacion).toLocaleDateString('es-AR') : '-';
      }
    },
  ], [handleEditar, handleVerDetalle]);

  const table = useReactTable({
    data: clientes,
    columns,
    state: {
      sorting,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a clientes"
          message="Tu usuario no tiene permisos para consultar ni administrar la base de clientes."
          tone="warning"
        />
      </div>
    );
  }

  if (loading && clientes.length === 0) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="hourglass_empty"
          title="Cargando clientes"
          message="Estamos preparando el padrón de clientes registrados."
          className={styles.stateBlock}
        />
      </div>
    );
  }

  if (error && clientes.length === 0) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="error_outline"
          title="No pudimos cargar los clientes"
          message={error}
          actionLabel="Reintentar"
          onAction={cargarClientes}
          tone="danger"
          className={styles.stateBlock}
        />
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <AdminSurface className="admin-filter-shell" tone="muted">
          <div className="admin-search-form">
            <div className="admin-search-wrapper">
              <AdminSearch
                value={searchTerm}
                placeholder="Buscar por nombre, email o celular..."
                onChange={(val) => {
                  setSearchTerm(val);
                  setOffset(0);
                }}
              />
            </div>
            <div className="admin-action-row">
              <button
                className={styles.crearButton}
                onClick={() => setShowCrearModal(true)}
                disabled={!puedeCrear}
                title={!puedeCrear ? 'Sin permisos para crear clientes' : undefined}
              >
                <span className="material-icons">person_add</span>
                <span>Crear Cliente</span>
              </button>
            </div>
          </div>
        </AdminSurface>

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
                          className={header.column.getCanSort() ? styles.sortableHeader : undefined}
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
                      {loading ? 'Cargando...' : 'No se encontraron clientes'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr 
                      key={row.id}
                      onClick={() => handleVerDetalle(row.original)}
                      className={styles.clickableRow}
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

        {/* Paginación */}
        <AdminPagination
          total={total}
          limit={LIMIT}
          offset={offset}
          onPageChange={setOffset}
          itemLabel="clientes"
        />
      </div>

      {/* Modal de detalle (solo lectura) */}
      {tipoModal === 'detalle' && clienteSeleccionado && (
        <DetalleClienteModal 
          cliente={clienteSeleccionado} 
          onClose={handleCerrarModal} 
          onEdit={() => handleEditar(clienteSeleccionado)}
        />
      )}

      {/* Modal de edición (solo admin) */}
      {tipoModal === 'editar' && clienteSeleccionado && (
        <EditarClienteModal cliente={clienteSeleccionado} onClose={handleCerrarModal} onGuardado={cargarClientes} />
      )}

      {/* Modal de creación de cliente */}
      {showCrearModal && <CrearClienteModal onClose={() => setShowCrearModal(false)} onCreado={cargarClientes} />}
    </>
  );
};

export default GestionClientes;
