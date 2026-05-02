import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { ROLES } from '../../../constants/roles';
import {
  AdminEmptyState,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminPagination,
  DraggableTableHeader,
} from '../common';
import usuarioService from '../../../services/usuarioService';
import styles from './GestionUsuarios.module.css';
import type { UsuarioListItem, RolItem, ActualizarUsuarioData } from '../../../types/usuario';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import PremiumModal from '../../common/PremiumModal/PremiumModal';

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
} from '@dnd-kit/sortable';

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
  const [searchTerm, setSearchTerm] = useState('');

  const [sorting, setSorting] = useState<SortingState>([{ id: 'id_usuario', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'id_usuario', 'nombres', 'email', 'rol', 'fecha', 'ultimo_login'
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
    cargarRoles();
    cargarUsuarios();
  }, [cargarRoles, cargarUsuarios]);

  const handleEliminar = useCallback(async (id: number, nombre: string) => {
    if (!puedeEliminar) {
      showNotification('No tienes permisos para eliminar usuarios', 'error');
      return;
    }

    if (id === 1) {
      showNotification('No se puede eliminar el usuario administrador principal', 'warning');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"?`)) {
      return;
    }

    try {
      await usuarioService.eliminarUsuario(id);
      showNotification('Usuario eliminado exitosamente', 'success');
      setEditandoUsuario(null);
      cargarUsuarios();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar usuario', 'error');
    }
  }, [puedeEliminar, showNotification, cargarUsuarios]);

  const handleEditarClick = useCallback((usuario: UsuarioListItem) => {
    if (!puedeEditar) return;
    setEditandoUsuario(usuario);
    setEditFormData({
      nombres: usuario.nombres,
      email: usuario.email,
      id_rol: usuario.id_rol,
      password: '',
      confirmPassword: '',
    });
  }, [puedeEditar]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    }
  ], [roles]);

  // Filtrado local
  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm) return usuarios;
    const lowerSearch = searchTerm.toLowerCase();
    return usuarios.filter(u => 
      u.nombres.toLowerCase().includes(lowerSearch) || 
      u.email.toLowerCase().includes(lowerSearch) ||
      (u.Rol?.rol && u.Rol.rol.toLowerCase().includes(lowerSearch))
    );
  }, [usuarios, searchTerm]);

  const table = useReactTable({
    data: usuariosFiltrados,
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
        <AdminFilterPanel>
          <AdminFilterPanel.Row variant="bottom">
            <AdminFilterPanel.Grow>
              <AdminEntitySearchBar
                searchValue={searchTerm}
                searchLabel="Búsqueda"
                searchPlaceholder="Buscar usuarios..."
                onSearchChange={(val) => {
                  setSearchTerm(val);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                primaryActionLabel="Crear Usuario"
                primaryActionIcon="person_add"
                onPrimaryAction={() => setShowCrearForm(true)}
                primaryActionDisabled={!puedeCrear}
              />
            </AdminFilterPanel.Grow>
          </AdminFilterPanel.Row>
        </AdminFilterPanel>

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
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className={styles.emptyMessage}>
                      {searchTerm 
                        ? `No se encontraron usuarios para "${searchTerm}"`
                        : 'No hay usuarios registrados'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr 
                      key={row.id}
                      onClick={() => handleEditarClick(row.original)}
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
          <AdminPagination
          total={usuariosFiltrados.length}
          limit={pagination.pageSize}
          offset={pagination.pageIndex * pagination.pageSize}
          onPageChange={(newOffset) => {
            setPagination(prev => ({
              ...prev,
              pageIndex: Math.floor(newOffset / prev.pageSize)
            }));
          }}
          itemLabel="usuarios"
        />
      </div>
      </div>

      <PremiumModal
        isOpen={showCrearForm}
        onClose={handleCancelarCrear}
        title="Registrar Nuevo Usuario del Sistema"
        icon="person_add"
      >
        <form id="crear-usuario-form" onSubmit={handleCrearUsuario}>
          <div className="modalBodyPremium">
            <h4 className="sectionTitleWithDividerPremium">Información de Perfil</h4>
            
            <div className="modalFormGridPremium">
              <Input
                id="nombres"
                name="nombres"
                label="Nombre Completo"
                value={formData.nombres}
                onChange={handleFormChange}
                placeholder="Ej: Juan Pérez"
                disabled={creando}
                required
                autoFocus
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email de Acceso"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="Ej: juan@tecnocel.com"
                disabled={creando}
                required
              />

              <Select
                id="id_rol"
                name="id_rol"
                label="Rol de Sistema"
                value={String(formData.id_rol)}
                onChange={handleFormChange}
                disabled={creando}
                required
                options={[
                  { value: '0', label: 'Seleccionar rol...', disabled: true },
                  ...roles.map(rol => ({ value: String(rol.id_rol), label: rol.rol }))
                ]}
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Contraseña"
                value={formData.password}
                onChange={handleFormChange}
                placeholder="Mínimo 6 caracteres"
                disabled={creando}
                required
              />

              <div className="modalFormGroupFullPremium">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirmar Contraseña"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                  placeholder="Repite la contraseña"
                  disabled={creando}
                  required
                />
              </div>
            </div>

            <p className={styles.helpTextPremium}>
              <span className="material-icons">info</span>
              El usuario podrá iniciar sesión inmediatamente después de su creación.
            </p>
          </div>

          <div className="modalFooterPremium">
            <button type="button" onClick={handleCancelarCrear} className="btnPremium btnSecondaryPremium" disabled={creando}>
              Cancelar
            </button>
            <button type="submit" form="crear-usuario-form" disabled={creando} className="btnPremium btnPrimaryPremium">
              <span className="material-icons">{creando ? 'hourglass_empty' : 'person_add'}</span>
              {creando ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </PremiumModal>

      <PremiumModal
        isOpen={!!editandoUsuario}
        onClose={handleCancelarEditar}
        title={editandoUsuario ? `Editar Usuario: ${editandoUsuario.nombres}` : 'Editar Usuario'}
        icon="manage_accounts"
      >
        {editandoUsuario && (
          <form id="editar-usuario-form" onSubmit={handleEditarUsuario}>
            <div className="modalBodyPremium">
              <h4 className="sectionTitleWithDividerPremium">Información del Empleado</h4>
              
              <div className="modalFormGridPremium">
                <Input
                  id="edit_nombres"
                  name="nombres"
                  label="Nombre Completo"
                  value={editFormData.nombres}
                  onChange={handleEditFormChange}
                  placeholder="Ej: Juan Pérez"
                  disabled={editando}
                  required
                />

                <Input
                  id="edit_email"
                  name="email"
                  type="email"
                  label="Email de Acceso"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  placeholder="Ej: juan@tecnocel.com"
                  disabled={editando}
                  required
                />

                <Select
                  id="edit_id_rol"
                  name="id_rol"
                  label="Rol Actual"
                  value={String(editFormData.id_rol)}
                  onChange={handleEditFormChange}
                  disabled={editando}
                  required
                  options={[
                    { value: '0', label: 'Seleccionar rol...', disabled: true },
                    ...roles.map(rol => ({ value: String(rol.id_rol), label: rol.rol }))
                  ]}
                />

                <Input
                  id="edit_password"
                  name="password"
                  type="password"
                  label="Cambiar Contraseña"
                  value={editFormData.password}
                  onChange={handleEditFormChange}
                  placeholder="Dejar vacío para mantener"
                  disabled={editando}
                  autoComplete="new-password"
                />

                {editFormData.password && (
                  <div className="modalFormGroupFullPremium">
                    <Input
                      id="edit_confirmPassword"
                      name="confirmPassword"
                      type="password"
                      label="Confirmar Nueva Contraseña"
                      value={editFormData.confirmPassword}
                      onChange={handleEditFormChange}
                      placeholder="Repite la nueva contraseña"
                      disabled={editando}
                      autoComplete="new-password"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modalFooterPremium">
              {puedeEliminar && editandoUsuario.id_usuario !== 1 && (
                <button
                  type="button"
                  onClick={() => handleEliminar(editandoUsuario.id_usuario, editandoUsuario.nombres)}
                  className="btnPremium btnDangerPremium mr-auto"
                  title="Eliminar usuario"
                  disabled={editando}
                >
                  <span className="material-icons">delete</span>
                  Eliminar
                </button>
              )}
              <button type="button" onClick={handleCancelarEditar} className="btnPremium btnSecondaryPremium" disabled={editando}>
                Cancelar
              </button>
              <button type="submit" form="editar-usuario-form" disabled={editando} className="btnPremium btnPrimaryPremium">
                <span className="material-icons">{editando ? 'hourglass_empty' : 'save'}</span>
                {editando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </PremiumModal>
    </>
  );
};

export default GestionUsuarios;
