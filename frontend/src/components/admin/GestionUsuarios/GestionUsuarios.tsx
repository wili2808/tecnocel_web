import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { ROLES } from '../../../constants/roles';
import { AdminEmptyState, AdminSectionActions } from '../common';
import usuarioService from '../../../services/usuarioService';
import styles from './GestionUsuarios.module.css';
import type { UsuarioListItem, RolItem, ActualizarUsuarioData } from '../../../types/usuario';

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

interface CrearUsuarioFormData {
  nombres: string;
  email: string;
  password: string;
  confirmPassword: string;
  id_rol: number;
}

interface EditarUsuarioFormData {
  nombres: string;
  email: string;
  id_rol: number;
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM_DATA: CrearUsuarioFormData = {
  nombres: '',
  email: '',
  password: '',
  confirmPassword: '',
  id_rol: 0,
};

const INITIAL_EDIT_FORM: EditarUsuarioFormData = {
  nombres: '',
  email: '',
  id_rol: 0,
  password: '',
  confirmPassword: '',
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

const GestionUsuarios = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_usuarios');
  const puedeCrear = tienePermiso('crear_usuario');
  const puedeEditar = tienePermiso('editar_usuario');
  const puedeEliminar = tienePermiso('eliminar_usuario');
  const { showNotification } = useNotification();

  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCrearForm, setShowCrearForm] = useState(false);
  const [creando, setCreando] = useState(false);
  const creandoRef = useRef(false);
  const [formData, setFormData] = useState<CrearUsuarioFormData>(INITIAL_FORM_DATA);
  const [editandoUsuario, setEditandoUsuario] = useState<UsuarioListItem | null>(null);
  const [editando, setEditando] = useState(false);
  const editandoRef = useRef(false);
  const [editFormData, setEditFormData] = useState<EditarUsuarioFormData>(INITIAL_EDIT_FORM);

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id_usuario', desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'id_usuario', 'nombres', 'email', 'rol', 'fecha', 'ultimo_login', 'acciones'
  ]);

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usuarioService.listarUsuarios();
      setUsuarios(data.usuarios || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
      showNotification(err.message || 'Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const cargarRoles = useCallback(async () => {
    try {
      const data = await usuarioService.listarRoles();
      setRoles(data);
    } catch (err: any) {
      showNotification(err.message || 'Error al cargar roles', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, [cargarRoles, cargarUsuarios]);

  const handleEliminar = useCallback(async (id: number) => {
    if (!puedeEliminar) {
      showNotification('No tienes permisos para eliminar usuarios', 'error');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      await usuarioService.eliminarUsuario(id);
      showNotification('Usuario eliminado exitosamente', 'success');
      cargarUsuarios();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar usuario', 'error');
    }
  }, [puedeEliminar, showNotification, cargarUsuarios]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'id_rol' ? parseInt(value) : value,
    }));
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (creandoRef.current) return;

    if (!formData.nombres || !formData.email || !formData.password || !formData.id_rol) {
      showNotification('Todos los campos son requeridos', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      creandoRef.current = true;
      setCreando(true);
      await usuarioService.crearUsuario({
        nombres: formData.nombres,
        email: formData.email,
        password: formData.password,
        id_rol: formData.id_rol,
      });

      showNotification('Usuario creado exitosamente', 'success');
      setFormData(INITIAL_FORM_DATA);
      setShowCrearForm(false);
      cargarUsuarios();
    } catch (err: any) {
      showNotification(err.message || 'Error al crear usuario', 'error');
    } finally {
      creandoRef.current = false;
      setCreando(false);
    }
  };

  const handleCancelarCrear = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowCrearForm(false);
  };

  const handleEditarClick = useCallback((usuario: UsuarioListItem) => {
    setEditandoUsuario(usuario);
    setEditFormData({
      nombres: usuario.nombres,
      email: usuario.email,
      id_rol: usuario.id_rol,
      password: '',
      confirmPassword: '',
    });
  }, []);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'id_rol' ? parseInt(value) : value,
    }));
  };

  const handleEditarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editandoRef.current || !editandoUsuario) return;

    if (!editFormData.nombres || !editFormData.email || !editFormData.id_rol) {
      showNotification('Nombre, email y rol son requeridos', 'error');
      return;
    }

    if (editFormData.password) {
      if (editFormData.password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
      if (editFormData.password !== editFormData.confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
      }
    }

    const dataToSend: ActualizarUsuarioData = {};
    if (editFormData.nombres !== editandoUsuario.nombres) dataToSend.nombres = editFormData.nombres;
    if (editFormData.email !== editandoUsuario.email) dataToSend.email = editFormData.email;
    if (editFormData.id_rol !== editandoUsuario.id_rol) dataToSend.id_rol = editFormData.id_rol;
    if (editFormData.password) dataToSend.password = editFormData.password;

    if (Object.keys(dataToSend).length === 0) {
      showNotification('No hay cambios para guardar', 'info');
      return;
    }

    try {
      editandoRef.current = true;
      setEditando(true);
      await usuarioService.actualizarUsuario(editandoUsuario.id_usuario, dataToSend);

      showNotification('Usuario actualizado exitosamente', 'success');
      setEditandoUsuario(null);
      setEditFormData(INITIAL_EDIT_FORM);
      cargarUsuarios();
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar usuario', 'error');
    } finally {
      editandoRef.current = false;
      setEditando(false);
    }
  };

  const handleCancelarEditar = () => {
    setEditandoUsuario(null);
    setEditFormData(INITIAL_EDIT_FORM);
  };

  // --- Columnas ---
  const columns = useMemo<ColumnDef<UsuarioListItem>[]>(() => [
    {
      accessorKey: 'id_usuario',
      id: 'id_usuario',
      header: 'ID',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'nombres',
      id: 'nombres',
      header: 'Nombre',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'email',
      id: 'email',
      header: 'Email',
      cell: info => info.getValue() as string,
    },
    {
      accessorFn: row => row.id_rol,
      id: 'rol',
      header: 'Rol',
      cell: info => {
        const usuario = info.row.original;
        const rolName = usuario.Rol?.rol || usuarioService.getRolName(usuario.id_rol, roles);
        return (
          <span
            className={`${styles.badge} ${
              usuario.id_rol === ROLES.ADMIN
                ? styles.badgeAdmin
                : usuario.id_rol === ROLES.VENDEDOR
                  ? styles.badgeVendedor
                  : styles.badgeGerente
            }`}
          >
            {rolName}
          </span>
        );
      }
    },
    {
      accessorFn: row => row.fyh_creacion ? new Date(row.fyh_creacion).getTime() : 0,
      id: 'fecha',
      header: 'Fecha de Creación',
      cell: info => {
        const fyh_creacion = info.row.original.fyh_creacion;
        return fyh_creacion ? new Date(fyh_creacion).toLocaleDateString('es-AR') : '-';
      }
    },
    {
      accessorFn: row => row.fyh_ultimo_login ? new Date(row.fyh_ultimo_login).getTime() : 0,
      id: 'ultimo_login',
      header: 'Último Login',
      cell: info => {
        const fyh_ultimo_login = info.row.original.fyh_ultimo_login;
        return fyh_ultimo_login ? (
          new Date(fyh_ultimo_login).toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>Nunca</span>
        );
      }
    },
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: (info) => {
        const usuario = info.row.original;
        return (
          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              title={!puedeEditar ? 'Sin permisos para editar usuarios' : 'Editar usuario'}
              onClick={() => handleEditarClick(usuario)}
              disabled={!puedeEditar}
            >
              <span className="material-icons">edit</span>
            </button>
            <button
              className={`${styles.actionButton} ${styles.actionButtonDanger}`}
              title={!puedeEliminar ? 'Sin permisos para eliminar usuarios' : 'Eliminar'}
              onClick={() => handleEliminar(usuario.id_usuario)}
              disabled={!puedeEliminar}
            >
              <span className="material-icons">delete</span>
            </button>
          </div>
        );
      }
    }
  ], [roles, puedeEditar, puedeEliminar, handleEditarClick, handleEliminar]);

  const table = useReactTable({
    data: usuarios,
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
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a usuarios"
          message="No cuentas con permisos para administrar usuarios internos ni sus roles."
          tone="warning"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="hourglass_empty"
          title="Cargando usuarios"
          message="Estamos obteniendo el listado interno y la configuración de roles."
          className={styles.stateBlock}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="error_outline"
          title="No pudimos cargar los usuarios"
          message={error}
          actionLabel="Reintentar"
          onAction={cargarUsuarios}
          tone="danger"
          className={styles.stateBlock}
        />
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <AdminSectionActions
          lead={null}
          actions={
            <button
              className={styles.crearButton}
              onClick={() => setShowCrearForm(true)}
              disabled={!puedeCrear}
              title={!puedeCrear ? 'Sin permisos para crear usuarios' : undefined}
            >
              <span className="material-icons">person_add</span>
              <span>Crear Usuario</span>
            </button>
          }
        />

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
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
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
      </div>

      {showCrearForm && (
        <div className={styles.modalOverlay} onClick={handleCancelarCrear}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className="material-icons">person_add</span>
                Crear Nuevo Usuario
              </h3>
              <button className={styles.closeButton} onClick={handleCancelarCrear} disabled={creando}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleCrearUsuario}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="nombres" className={styles.label}>
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="nombres"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleFormChange}
                      className={styles.input}
                      placeholder="Ej: Juan Pérez"
                      disabled={creando}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className={styles.input}
                      placeholder="Ej: juan@tecnocel.com"
                      disabled={creando}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="id_rol" className={styles.label}>
                      Rol *
                    </label>
                    <select
                      id="id_rol"
                      name="id_rol"
                      value={formData.id_rol}
                      onChange={handleFormChange}
                      className={styles.select}
                      disabled={creando}
                      required
                    >
                      <option value={0} disabled>
                        Seleccionar rol...
                      </option>
                      {roles.map((rol) => (
                        <option key={rol.id_rol} value={rol.id_rol}>
                          {rol.rol}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      className={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      disabled={creando}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    className={styles.input}
                    placeholder="Repite la contraseña"
                    disabled={creando}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={handleCancelarCrear} className={styles.cancelButton} disabled={creando}>
                  Cancelar
                </button>
                <button type="submit" disabled={creando} className={styles.submitButton}>
                  {creando ? (
                    <>
                      <span className="material-icons">hourglass_empty</span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">person_add</span>
                      Crear Usuario
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editandoUsuario && (
        <div className={styles.modalOverlay} onClick={handleCancelarEditar}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className="material-icons">edit</span>
                Editar Usuario
              </h3>
              <button className={styles.closeButton} onClick={handleCancelarEditar} disabled={editando}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleEditarUsuario}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit_nombres" className={styles.label}>
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="edit_nombres"
                      name="nombres"
                      value={editFormData.nombres}
                      onChange={handleEditFormChange}
                      className={styles.input}
                      placeholder="Ej: Juan Pérez"
                      disabled={editando}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="edit_email" className={styles.label}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="edit_email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      className={styles.input}
                      placeholder="Ej: juan@tecnocel.com"
                      disabled={editando}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit_id_rol" className={styles.label}>
                      Rol *
                    </label>
                    <select
                      id="edit_id_rol"
                      name="id_rol"
                      value={editFormData.id_rol}
                      onChange={handleEditFormChange}
                      className={styles.select}
                      disabled={editando}
                      required
                    >
                      <option value={0} disabled>
                        Seleccionar rol...
                      </option>
                      {roles.map((rol) => (
                        <option key={rol.id_rol} value={rol.id_rol}>
                          {rol.rol}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="edit_password" className={styles.label}>
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      id="edit_password"
                      name="password"
                      value={editFormData.password}
                      onChange={handleEditFormChange}
                      className={styles.input}
                      placeholder="Dejar vacío para no cambiar"
                      disabled={editando}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {editFormData.password && (
                  <div className={styles.formGroup}>
                    <label htmlFor="edit_confirmPassword" className={styles.label}>
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      id="edit_confirmPassword"
                      name="confirmPassword"
                      value={editFormData.confirmPassword}
                      onChange={handleEditFormChange}
                      className={styles.input}
                      placeholder="Repite la nueva contraseña"
                      disabled={editando}
                      autoComplete="new-password"
                    />
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCancelarEditar}
                  className={styles.cancelButton}
                  disabled={editando}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={editando} className={styles.submitButton}>
                  {editando ? (
                    <>
                      <span className="material-icons">hourglass_empty</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">save</span>
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GestionUsuarios;
