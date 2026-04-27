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
import styles from './GestionCategorias.module.css';

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

interface EditCategoriaForm {
  nombre_categoria: string;
}

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
  const puedeEliminar = tienePermiso('eliminar_categoria');

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados inline edit
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditCategoriaForm>({ nombre_categoria: '' });
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>(['nombre', 'fecha', 'acciones']);

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
    setEditandoId(cat.id_categoria);
    setEditForm({ nombre_categoria: cat.nombre_categoria });
    setEliminandoId(null);
  }, []);

  const cancelarEdicion = useCallback(() => {
    setEditandoId(null);
    setEditForm({ nombre_categoria: '' });
  }, []);

  const guardarEdicion = async (id: number) => {
    if (!editForm.nombre_categoria.trim()) {
      showNotification('El nombre de la categoría no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminProductService.actualizarCategoria(id, {
        nombre_categoria: editForm.nombre_categoria.trim(),
      });
      showNotification('Categoría actualizada exitosamente', 'success');
      setEditandoId(null);
      await cargarCategorias();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al actualizar la categoría',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const iniciarEliminacion = useCallback((id: number) => {
    setEliminandoId(id);
    setEditandoId(null);
  }, []);

  const cancelarEliminacion = useCallback(() => {
    setEliminandoId(null);
  }, []);

  const confirmarEliminacion = async (id: number) => {
    setSaving(true);
    try {
      await adminProductService.eliminarCategoria(id);
      showNotification('Categoría eliminada exitosamente', 'success');
      setEliminandoId(null);
      await cargarCategorias();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al eliminar la categoría',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const iniciarCreacion = useCallback(() => {
    setCreando(true);
    setNuevoNombre('');
    setEditandoId(null);
    setEliminandoId(null);
  }, []);

  const cancelarCreacion = useCallback(() => {
    setCreando(false);
    setNuevoNombre('');
  }, []);

  const guardarNueva = async () => {
    if (!nuevoNombre.trim()) {
      showNotification('El nombre de la categoría no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminProductService.crearCategoria({ nombre_categoria: nuevoNombre.trim() });
      showNotification('Categoría creada exitosamente', 'success');
      setCreando(false);
      await cargarCategorias();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al crear la categoría',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

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
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: (info) => {
        const cat = info.row.original;
        return (
          <div className={styles.rowActions}>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
              onClick={() => iniciarEdicion(cat)}
              title={puedeEditar ? 'Editar' : 'Sin permisos'}
              disabled={!puedeEditar}
            >
              <span className="material-icons">edit</span>
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={() => iniciarEliminacion(cat.id_categoria)}
              disabled={!puedeEliminar}
              title={!puedeEliminar ? 'Sin permisos para eliminar' : 'Eliminar'}
            >
              <span className="material-icons">delete</span>
            </button>
          </div>
        );
      }
    }
  ], [iniciarEdicion, iniciarEliminacion, puedeEditar, puedeEliminar]);

  const table = useReactTable({
    data: categorias,
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
          <p style={{ marginTop: 16 }}>No tienes permisos para ver categorías</p>
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
          disabled={!puedeCrear || creando}
          title={!puedeCrear ? 'Sin permisos para crear categorías' : undefined}
        >
          <span className="material-icons">add</span>
          Nueva Categoría
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando categorías...</div>
      ) : (
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
                {creando && (
                  <tr className={styles.newRow}>
                    <td className={styles.td}>
                      <input
                        className={styles.editInput}
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        placeholder="Nombre de la categoría"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarNueva();
                        }}
                      />
                    </td>
                    <td className={styles.td}>—</td>
                    <td className={styles.td}>
                      <div className={styles.rowActions}>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                          onClick={guardarNueva}
                          disabled={saving}
                          title="Guardar"
                        >
                          <span className="material-icons">check</span>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnNeutral}`}
                          onClick={cancelarCreacion}
                          disabled={saving}
                          title="Cancelar"
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {table.getRowModel().rows.length === 0 && !creando ? (
                  <tr>
                    <td colSpan={columns.length} className={styles.emptyMessage}>
                      No hay categorías registradas
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const cat = row.original;
                    
                    if (eliminandoId === cat.id_categoria) {
                      return (
                        <tr key={row.id} className={styles.confirmRow}>
                          <td colSpan={2} className={styles.td}>
                            <span className={styles.confirmText}>
                              ¿Eliminar <strong>«{cat.nombre_categoria}»</strong>? Esta acción no se puede deshacer.
                            </span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.rowActions}>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => confirmarEliminacion(cat.id_categoria)}
                                disabled={saving}
                                title="Confirmar eliminación"
                              >
                                <span className="material-icons">delete</span>
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnNeutral}`}
                                onClick={cancelarEliminacion}
                                disabled={saving}
                                title="Cancelar"
                              >
                                <span className="material-icons">close</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    if (editandoId === cat.id_categoria) {
                      return (
                        <tr key={row.id} className={styles.editRow}>
                          <td className={styles.td}>
                            <input
                              className={styles.editInput}
                              value={editForm.nombre_categoria}
                              onChange={(e) => setEditForm({ nombre_categoria: e.target.value })}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') guardarEdicion(cat.id_categoria);
                              }}
                            />
                          </td>
                          <td className={styles.td}>{formatearFecha(cat.fyh_creacion)}</td>
                          <td className={styles.td}>
                            <div className={styles.rowActions}>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                onClick={() => guardarEdicion(cat.id_categoria)}
                                disabled={saving}
                                title="Guardar"
                              >
                                <span className="material-icons">check</span>
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnNeutral}`}
                                onClick={cancelarEdicion}
                                disabled={saving}
                                title="Cancelar"
                              >
                                <span className="material-icons">close</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={row.id}>
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
      )}
    </div>
  );
});

export default GestionCategorias;
