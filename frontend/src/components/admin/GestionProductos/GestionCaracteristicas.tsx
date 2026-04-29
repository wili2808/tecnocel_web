/**
 * GestionCaracteristicas — CRUD de tipos de características desde el panel admin
 * Tabla con panel de formulario lateral para crear/editar (por complejidad de campos).
 * Refactorizado con TanStack Table v8 y dnd-kit.
 */
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { TipoCaracteristica } from '../../../types/product';
import CaracteristicaModal from './CaracteristicaModal';
import styles from './GestionCaracteristicas.module.css';

const TIPO_DATO_LABELS: Record<TipoCaracteristica['tipo_dato'], string> = {
  texto: 'Texto',
  numero: 'Número',
  booleano: 'Booleano (Sí/No)',
  seleccion: 'Selección',
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { error?: string; message?: string; mensaje?: string } };
    message?: string;
  };
  return (
    err.response?.data?.error || err.response?.data?.message || err.response?.data?.mensaje || err.message || fallback
  );
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

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>(['nombre', 'tipo', 'unidad', 'estado']);

  const cargarTipos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductService.obtenerTiposCaracteristicas();
      setTipos(data);
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Error al cargar tipos de características'), 'error');
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

  const renderUnidadOpciones = (tipo: TipoCaracteristica) => {
    if (tipo.tipo_dato === 'numero' && tipo.unidad_medida) {
      return <span className={styles.unidadBadge}>{tipo.unidad_medida}</span>;
    }
    if (tipo.tipo_dato === 'seleccion') {
      const opciones = parseOpciones(tipo.opciones_seleccion);
      if (!opciones.length) return <span className={styles.emptyValue}>—</span>;
      return (
        <div className={styles.opcionesList}>
          {opciones.slice(0, 3).map((op) => (
            <span key={op} className={styles.opcionChip}>
              {op}
            </span>
          ))}
          {opciones.length > 3 && <span className={styles.opcionChipMore}>+{opciones.length - 3}</span>}
        </div>
      );
    }
    return <span className={styles.emptyValue}>—</span>;
  };

  // --- Columnas ---
  const columns = useMemo<ColumnDef<TipoCaracteristica>[]>(() => [
    {
      accessorKey: 'nombre_tipo',
      id: 'nombre',
      header: 'Nombre',
      cell: info => {
        const tipo = info.row.original;
        return (
          <>
            <span className={styles.tipoNombre}>{tipo.nombre_tipo}</span>
            {tipo.descripcion && <span className={styles.tipoDescripcion}>{tipo.descripcion}</span>}
          </>
        );
      }
    },
    {
      accessorKey: 'tipo_dato',
      id: 'tipo',
      header: 'Tipo de dato',
      cell: info => (
        <span className={styles.tipoDatoBadge}>{TIPO_DATO_LABELS[info.getValue() as TipoCaracteristica['tipo_dato']]}</span>
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
          <span className={activo ? styles.badgeActivo : styles.badgeInactivo}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        );
      }
    },
  ], []);

  const table = useReactTable({
    data: tipos,
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

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <span className="material-icons" style={{ fontSize: 48, opacity: 0.5 }}>
            lock
          </span>
          <p style={{ marginTop: 16 }}>No tienes permisos para ver características</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <button className={styles.addButton} onClick={abrirFormCrear} disabled={!puedeCrear}>
          <span className="material-icons">add</span>
          Nuevo tipo
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando tipos de características...</div>
      ) : (
        <>
          <div className={styles.mainContent}>
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
                          No hay tipos de características registrados
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => {
                        const tipo = row.original;
                        return (
                          <tr 
                            key={row.id} 
                            onClick={puedeEditar ? () => abrirFormEditar(tipo) : undefined}
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
          </div>

          <CaracteristicaModal
            isOpen={modalOpen}
            tipo={tipoSeleccionado}
            onClose={() => setModalOpen(false)}
            onGuardado={cargarTipos}
          />
        </>
      )}
    </div>
  );
});

export default GestionCaracteristicas;
