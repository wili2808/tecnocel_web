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
import styles from './GestionCaracteristicas.module.css';

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

interface TipoForm {
  nombre_tipo: string;
  descripcion: string;
  tipo_dato: TipoCaracteristica['tipo_dato'];
  unidad_medida: string;
  opciones_seleccion: string[];
}

const INITIAL_TIPO_FORM: TipoForm = {
  nombre_tipo: '',
  descripcion: '',
  tipo_dato: 'texto',
  unidad_medida: '',
  opciones_seleccion: [],
};

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

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { error?: string; message?: string; mensaje?: string } };
    message?: string;
  };
  return (
    err.response?.data?.error || err.response?.data?.message || err.response?.data?.mensaje || err.message || fallback
  );
};

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
  const puedeEliminar = tienePermiso('eliminar_caracteristica');

  const [tipos, setTipos] = useState<TipoCaracteristica[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tipoForm, setTipoForm] = useState<TipoForm>(INITIAL_TIPO_FORM);
  const [nuevaOpcion, setNuevaOpcion] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>(['nombre', 'tipo', 'unidad', 'estado', 'acciones']);

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
    setEditandoId(null);
    setTipoForm(INITIAL_TIPO_FORM);
    setNuevaOpcion('');
    setShowForm(true);
    setEliminandoId(null);
  }, []);

  const abrirFormEditar = useCallback((tipo: TipoCaracteristica) => {
    setEditandoId(tipo.id_tipo);
    setTipoForm({
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion || '',
      tipo_dato: tipo.tipo_dato,
      unidad_medida: tipo.unidad_medida || '',
      opciones_seleccion: parseOpciones(tipo.opciones_seleccion),
    });
    setNuevaOpcion('');
    setShowForm(true);
    setEliminandoId(null);
  }, []);

  const cancelarForm = useCallback(() => {
    setShowForm(false);
    setEditandoId(null);
    setTipoForm(INITIAL_TIPO_FORM);
    setNuevaOpcion('');
  }, []);

  const agregarOpcion = () => {
    const opcion = nuevaOpcion.trim();
    if (!opcion) return;
    if (tipoForm.opciones_seleccion.includes(opcion)) {
      showNotification('Esa opción ya fue agregada', 'error');
      return;
    }
    setTipoForm((f) => ({ ...f, opciones_seleccion: [...f.opciones_seleccion, opcion] }));
    setNuevaOpcion('');
  };

  const quitarOpcion = (opcion: string) => {
    setTipoForm((f) => ({ ...f, opciones_seleccion: f.opciones_seleccion.filter((o) => o !== opcion) }));
  };

  const guardarForm = async () => {
    if (!tipoForm.nombre_tipo.trim()) {
      showNotification('El nombre del tipo es obligatorio', 'error');
      return;
    }
    if (tipoForm.tipo_dato === 'seleccion' && tipoForm.opciones_seleccion.length === 0) {
      showNotification('Debe agregar al menos una opción para el tipo "Selección"', 'error');
      return;
    }

    const payload: Partial<TipoCaracteristica> = {
      nombre_tipo: tipoForm.nombre_tipo.trim(),
      descripcion: tipoForm.descripcion.trim() || undefined,
      tipo_dato: tipoForm.tipo_dato,
      unidad_medida: tipoForm.tipo_dato === 'numero' ? tipoForm.unidad_medida.trim() || undefined : undefined,
      opciones_seleccion: tipoForm.tipo_dato === 'seleccion' ? tipoForm.opciones_seleccion : undefined,
    };

    setSaving(true);
    try {
      if (editandoId !== null) {
        await adminProductService.actualizarTipoCaracteristica(editandoId, payload);
        showNotification('Tipo de característica actualizado exitosamente', 'success');
      } else {
        await adminProductService.crearTipoCaracteristica({
          nombre_tipo: payload.nombre_tipo!,
          descripcion: payload.descripcion ?? undefined,
          tipo_dato: payload.tipo_dato!,
          unidad_medida: payload.unidad_medida ?? undefined,
          opciones_seleccion: payload.opciones_seleccion ?? undefined,
        });
        showNotification('Tipo de característica creado exitosamente', 'success');
      }
      cancelarForm();
      await cargarTipos();
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Error al guardar'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const iniciarEliminacion = useCallback((id: number) => {
    setEliminandoId(id);
    setShowForm(false);
    setEditandoId(null);
  }, []);

  const cancelarEliminacion = useCallback(() => {
    setEliminandoId(null);
  }, []);

  const confirmarEliminacion = async (id: number) => {
    setSaving(true);
    try {
      await adminProductService.eliminarTipoCaracteristica(id);
      showNotification('Tipo de característica desactivado exitosamente', 'success');
      setEliminandoId(null);
      await cargarTipos();
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Error al eliminar'), 'error');
    } finally {
      setSaving(false);
    }
  };

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
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: (info) => {
        const tipo = info.row.original;
        return (
          <div className={styles.rowActions}>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
              onClick={() => abrirFormEditar(tipo)}
              title={puedeEditar ? 'Editar' : 'Sin permisos'}
              disabled={!puedeEditar}
            >
              <span className="material-icons">edit</span>
            </button>
            {tipo.activo && (
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={() => iniciarEliminacion(tipo.id_tipo)}
                disabled={!puedeEliminar}
                title={!puedeEliminar ? 'Sin permisos para eliminar' : 'Desactivar'}
              >
                <span className="material-icons">delete</span>
              </button>
            )}
          </div>
        );
      }
    }
  ], [abrirFormEditar, iniciarEliminacion, puedeEditar, puedeEliminar]);

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
        <button
          className={styles.addButton}
          onClick={abrirFormCrear}
          disabled={!puedeCrear || (showForm && editandoId === null)}
          title={!puedeCrear ? 'Sin permisos para crear características' : undefined}
        >
          <span className="material-icons">add</span>
          Nuevo Tipo
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando tipos de características...</div>
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
                        No hay tipos de características registrados
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const tipo = row.original;
                      
                      if (eliminandoId === tipo.id_tipo) {
                        return (
                          <tr key={row.id} className={styles.confirmRow}>
                            <td colSpan={4} className={styles.td}>
                              <span className={styles.confirmText}>
                                ¿Desactivar <strong>«{tipo.nombre_tipo}»</strong>? Se marcará como inactivo.
                              </span>
                            </td>
                            <td className={styles.td}>
                              <div className={styles.rowActions}>
                                <button
                                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                  onClick={() => confirmarEliminacion(tipo.id_tipo)}
                                  disabled={saving}
                                  title="Confirmar"
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

                      return (
                        <tr key={row.id} className={editandoId === tipo.id_tipo ? styles.editRow : undefined}>
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

          {/* Panel de formulario */}
          {showForm && (
            <div className={styles.formPanel}>
              <h4 className={styles.formTitle}>
                {editandoId !== null ? 'Editar tipo de característica' : 'Nuevo tipo de característica'}
              </h4>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre *</label>
                  <input
                    className={styles.input}
                    value={tipoForm.nombre_tipo}
                    onChange={(e) => setTipoForm((f) => ({ ...f, nombre_tipo: e.target.value }))}
                    placeholder="Ej: RAM, Procesador, Color..."
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de dato *</label>
                  <select
                    className={styles.select}
                    value={tipoForm.tipo_dato}
                    onChange={(e) =>
                      setTipoForm((f) => ({
                        ...f,
                        tipo_dato: e.target.value as TipoCaracteristica['tipo_dato'],
                        opciones_seleccion: [],
                        unidad_medida: '',
                      }))
                    }
                  >
                    {(Object.entries(TIPO_DATO_LABELS) as [TipoCaracteristica['tipo_dato'], string][]).map(
                      ([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Descripción</label>
                  <input
                    className={styles.input}
                    value={tipoForm.descripcion}
                    onChange={(e) => setTipoForm((f) => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Descripción opcional"
                  />
                </div>

                {tipoForm.tipo_dato === 'numero' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Unidad de medida</label>
                    <input
                      className={styles.input}
                      value={tipoForm.unidad_medida}
                      onChange={(e) => setTipoForm((f) => ({ ...f, unidad_medida: e.target.value }))}
                      placeholder="Ej: GB, GHz, pulgadas..."
                    />
                  </div>
                )}

                {tipoForm.tipo_dato === 'seleccion' && (
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.label}>Opciones de selección *</label>
                    <div className={styles.opcionesInput}>
                      <input
                        className={styles.input}
                        value={nuevaOpcion}
                        onChange={(e) => setNuevaOpcion(e.target.value)}
                        placeholder="Agregar opción..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarOpcion();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className={styles.addOpcionBtn}
                        onClick={agregarOpcion}
                        disabled={!nuevaOpcion.trim()}
                      >
                        <span className="material-icons">add</span>
                      </button>
                    </div>
                    {tipoForm.opciones_seleccion.length > 0 && (
                      <div className={styles.opcionesChips}>
                        {tipoForm.opciones_seleccion.map((op) => (
                          <span key={op} className={styles.opcionChipEditable}>
                            {op}
                            <button type="button" onClick={() => quitarOpcion(op)} className={styles.removeOpcionBtn}>
                              <span className="material-icons">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button className={styles.saveButton} onClick={guardarForm} disabled={saving}>
                  {saving ? 'Guardando...' : editandoId !== null ? 'Guardar cambios' : 'Crear tipo'}
                </button>
                <button className={styles.cancelButton} onClick={cancelarForm} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default GestionCaracteristicas;
