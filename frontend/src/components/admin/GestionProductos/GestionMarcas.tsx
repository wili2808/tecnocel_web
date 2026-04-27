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
import styles from './GestionMarcas.module.css';

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

interface EditMarcaForm {
  nombre_marca: string;
  descripcion_marca: string;
}

interface NuevaMarcaForm {
  nombre_marca: string;
  descripcion_marca: string;
}

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
  const puedeEliminar = tienePermiso('eliminar_marca');

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditMarcaForm>({ nombre_marca: '', descripcion_marca: '' });
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevoForm, setNuevoForm] = useState<NuevaMarcaForm>({ nombre_marca: '', descripcion_marca: '' });
  const [nuevoLogoFile, setNuevoLogoFile] = useState<File | null>(null);
  const [nuevoLogoPreview, setNuevoLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>(['logo', 'nombre', 'descripcion', 'estado', 'fecha', 'acciones']);

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

  const handleLogoFileChange = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void,
  ) => {
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const iniciarEdicion = useCallback((marca: Marca) => {
    setEditandoId(marca.id_marca);
    setEditForm({
      nombre_marca: marca.nombre_marca,
      descripcion_marca: marca.descripcion_marca || '',
    });
    setEditLogoFile(null);
    setEditLogoPreview(null);
    setEliminandoId(null);
  }, []);

  const cancelarEdicion = useCallback(() => {
    setEditandoId(null);
    setEditForm({ nombre_marca: '', descripcion_marca: '' });
    setEditLogoFile(null);
    setEditLogoPreview(null);
  }, []);

  const guardarEdicion = async (id: number) => {
    if (!editForm.nombre_marca.trim()) {
      showNotification('El nombre de la marca no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminProductService.actualizarMarca(id, {
        nombre_marca: editForm.nombre_marca.trim(),
        descripcion_marca: editForm.descripcion_marca.trim() || undefined,
      });
      if (editLogoFile) {
        await adminProductService.uploadMarcaLogo(id, editLogoFile);
      }
      showNotification('Marca actualizada exitosamente', 'success');
      setEditandoId(null);
      setEditLogoFile(null);
      setEditLogoPreview(null);
      await cargarMarcas();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al actualizar la marca',
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
      await adminProductService.eliminarMarca(id);
      showNotification('Marca eliminada exitosamente', 'success');
      setEliminandoId(null);
      await cargarMarcas();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al eliminar la marca',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const iniciarCreacion = useCallback(() => {
    setCreando(true);
    setNuevoForm({ nombre_marca: '', descripcion_marca: '' });
    setNuevoLogoFile(null);
    setNuevoLogoPreview(null);
    setEditandoId(null);
    setEliminandoId(null);
  }, []);

  const cancelarCreacion = useCallback(() => {
    setCreando(false);
    setNuevoForm({ nombre_marca: '', descripcion_marca: '' });
    setNuevoLogoFile(null);
    setNuevoLogoPreview(null);
  }, []);

  const guardarNueva = async () => {
    if (!nuevoForm.nombre_marca.trim()) {
      showNotification('El nombre de la marca no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      const nuevaMarca = await adminProductService.crearMarca({
        nombre_marca: nuevoForm.nombre_marca.trim(),
        descripcion_marca: nuevoForm.descripcion_marca.trim() || undefined,
      });
      if (nuevoLogoFile) {
        await adminProductService.uploadMarcaLogo(nuevaMarca.id_marca, nuevoLogoFile);
      }
      showNotification('Marca creada exitosamente', 'success');
      setCreando(false);
      setNuevoLogoFile(null);
      setNuevoLogoPreview(null);
      await cargarMarcas();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al crear la marca',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

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
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: (info) => {
        const marca = info.row.original;
        return (
          <div className={styles.rowActions}>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
              onClick={() => iniciarEdicion(marca)}
              title={puedeEditar ? 'Editar' : 'Sin permisos'}
              disabled={!puedeEditar}
            >
              <span className="material-icons">edit</span>
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={() => iniciarEliminacion(marca.id_marca)}
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
    data: marcas,
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
          disabled={!puedeCrear || creando}
          title={!puedeCrear ? 'Sin permisos para crear marcas' : undefined}
        >
          <span className="material-icons">add</span>
          Nueva Marca
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando marcas...</div>
      ) : (
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
                {creando && (
                  <tr className={styles.newRow}>
                    <td className={styles.td}>
                      <div className={styles.logoCell}>
                        {nuevoLogoPreview && <img src={nuevoLogoPreview} alt="Preview" className={styles.logoPreview} />}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className={styles.logoFileInput}
                          onChange={(e) =>
                            handleLogoFileChange(e.target.files?.[0] ?? null, setNuevoLogoFile, setNuevoLogoPreview)
                          }
                        />
                      </div>
                    </td>
                    <td className={styles.td}>
                      <input
                        className={styles.editInput}
                        value={nuevoForm.nombre_marca}
                        onChange={(e) => setNuevoForm((f) => ({ ...f, nombre_marca: e.target.value }))}
                        placeholder="Nombre de la marca"
                        autoFocus
                      />
                    </td>
                    <td className={styles.td}>
                      <input
                        className={styles.editInput}
                        value={nuevoForm.descripcion_marca}
                        onChange={(e) => setNuevoForm((f) => ({ ...f, descripcion_marca: e.target.value }))}
                        placeholder="Descripción (opcional)"
                      />
                    </td>
                    <td className={styles.td}>—</td>
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
                      No hay marcas registradas
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const marca = row.original;
                    
                    if (eliminandoId === marca.id_marca) {
                      return (
                        <tr key={row.id} className={styles.confirmRow}>
                          <td colSpan={5} className={styles.td}>
                            <span className={styles.confirmText}>
                              ¿Eliminar <strong>«{marca.nombre_marca}»</strong>? Esta acción no se puede deshacer.
                            </span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.rowActions}>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => confirmarEliminacion(marca.id_marca)}
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

                    if (editandoId === marca.id_marca) {
                      return (
                        <tr key={row.id} className={styles.editRow}>
                          <td className={styles.td}>
                            <div className={styles.logoCell}>
                              {(editLogoPreview || marca.logo_marca) && (
                                <img
                                  src={editLogoPreview || marca.logo_marca!}
                                  alt={marca.nombre_marca}
                                  className={styles.logoPreview}
                                />
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className={styles.logoFileInput}
                                onChange={(e) =>
                                  handleLogoFileChange(e.target.files?.[0] ?? null, setEditLogoFile, setEditLogoPreview)
                                }
                              />
                            </div>
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.editInput}
                              value={editForm.nombre_marca}
                              onChange={(e) => setEditForm((f) => ({ ...f, nombre_marca: e.target.value }))}
                              autoFocus
                            />
                          </td>
                          <td className={styles.td}>
                            <input
                              className={styles.editInput}
                              value={editForm.descripcion_marca}
                              onChange={(e) => setEditForm((f) => ({ ...f, descripcion_marca: e.target.value }))}
                              placeholder="Descripción (opcional)"
                            />
                          </td>
                          <td className={styles.td}>
                            <span className={marca.activo ? styles.badgeActivo : styles.badgeInactivo}>
                              {marca.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className={styles.td}>{formatearFecha(marca.fyh_creacion)}</td>
                          <td className={styles.td}>
                            <div className={styles.rowActions}>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                onClick={() => guardarEdicion(marca.id_marca)}
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

export default GestionMarcas;
