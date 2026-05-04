import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { ROLES } from '../../../constants/roles';
import {
  AdminEmptyState,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminDataTable,
} from '../common';
import usuarioService from '../../../services/usuarioService';
import styles from './GestionUsuarios.module.css';
import type { UsuarioListItem, RolItem } from '../../../types/usuario';
import CrearUsuarioModal from './CrearUsuarioModal';
import EditarUsuarioModal from './EditarUsuarioModal';

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

const GestionUsuarios = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_usuarios');
  const puedeCrear = tienePermiso('crear_usuario');
  const puedeEditar = tienePermiso('editar_usuario');
  const puedeEliminar = tienePermiso('eliminar_usuario');
  const { showNotification } = useNotification();

  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState<UsuarioListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [sorting, setSorting] = useState<SortingState>([{ id: 'id_usuario', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'id_usuario', 'nombres', 'email', 'rol', 'fecha', 'ultimo_login'
  ]);

  const cargarUsuarios = useCallback(async (p: PaginationState, s: SortingState) => {
    try {
      setLoading(true);
      setError(null);
      
      const off = p.pageIndex * p.pageSize;
      let sortBy = 'fyh_creacion';
      let order: 'ASC' | 'DESC' = 'DESC';

      if (s.length > 0) {
        const st = s[0];
        order = st.desc ? 'DESC' : 'ASC';
        switch (st.id) {
          case 'id_usuario': sortBy = 'id_usuario'; break;
          case 'nombres': sortBy = 'nombres'; break;
          case 'email': sortBy = 'email'; break;
          case 'fecha': sortBy = 'fyh_creacion'; break;
          case 'ultimo_login': sortBy = 'fyh_ultimo_login'; break;
          default: sortBy = 'fyh_creacion';
        }
      }

      const data = await usuarioService.listarUsuarios(p.pageSize, off, sortBy, order);
      setUsuarios(data.usuarios || []);
      setTotal(data.total || 0);
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
    cargarUsuarios(pagination, sorting);
  }, [cargarRoles, cargarUsuarios, pagination, sorting]);

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
      cargarUsuarios(pagination, sorting);
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar usuario', 'error');
    }
  }, [puedeEliminar, showNotification, cargarUsuarios]);

  const handleEditarClick = useCallback((usuario: UsuarioListItem) => {
    if (!puedeEditar) return;
    setEditandoUsuario(usuario);
  }, [puedeEditar]);

  const handleSuccess = () => {
    setShowCrearModal(false);
    setEditandoUsuario(null);
    cargarUsuarios(pagination, sorting);
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
      cell: info => <span className="font-bold">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'email',
      id: 'email',
      header: 'Email',
      cell: info => <span className="text-secondary">{info.getValue() as string}</span>,
    },
    {
      accessorFn: row => row.id_rol,
      id: 'rol',
      header: 'Rol',
      cell: info => {
        const usuario = info.row.original;
        const rolName = usuario.Rol?.rol || usuarioService.getRolName(usuario.id_rol, roles);
        
        let badgeClass = styles.badgeVendedor;
        if (usuario.id_rol === ROLES.ADMIN) badgeClass = styles.badgeAdmin;
        else if (usuario.id_rol === ROLES.GERENTE) badgeClass = styles.badgeGerente;

        return (
          <span className={`${styles.badge} ${badgeClass}`}>
            {rolName}
          </span>
        );
      }
    },
    {
      accessorFn: row => row.fyh_creacion ? new Date(row.fyh_creacion).getTime() : 0,
      id: 'fecha',
      header: 'Alta',
      cell: info => {
        const fyh_creacion = info.row.original.fyh_creacion;
        return fyh_creacion ? new Date(fyh_creacion).toLocaleDateString('es-AR') : '-';
      }
    },
    {
      accessorFn: row => row.fyh_ultimo_login ? new Date(row.fyh_ultimo_login).getTime() : 0,
      id: 'ultimo_login',
      header: 'Último Acceso',
      cell: info => {
        const fyh_ultimo_login = info.row.original.fyh_ultimo_login;
        return fyh_ultimo_login ? (
          new Date(fyh_ultimo_login).toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })
        ) : (
          <span className="text-muted text-xs">Nunca</span>
        );
      }
    }
  ], [roles]);

  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm) return usuarios;
    const lowerSearch = searchTerm.toLowerCase();
    return usuarios.filter(u => 
      u.nombres.toLowerCase().includes(lowerSearch) || 
      u.email.toLowerCase().includes(lowerSearch) ||
      (u.Rol?.rol && u.Rol.rol.toLowerCase().includes(lowerSearch))
    );
  }, [usuarios, searchTerm]);

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

  return (
    <div className={styles.container}>
      <AdminFilterPanel>
        <AdminFilterPanel.Row variant="bottom">
          <AdminFilterPanel.Grow>
            <AdminEntitySearchBar
              searchValue={searchTerm}
              searchLabel="Búsqueda"
              searchPlaceholder="Buscar usuarios por nombre, email o rol..."
              onSearchChange={(val) => {
                setSearchTerm(val);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              primaryActionLabel="Crear Usuario"
              primaryActionIcon="person_add"
              onPrimaryAction={() => setShowCrearModal(true)}
              primaryActionDisabled={!puedeCrear}
            />
          </AdminFilterPanel.Grow>
        </AdminFilterPanel.Row>
      </AdminFilterPanel>

      {!loading && error && usuarios.length === 0 ? (
        <AdminEmptyState
          icon="error_outline"
          title="No pudimos cargar los usuarios"
          message={error}
          actionLabel="Reintentar"
          onAction={() => cargarUsuarios(pagination, sorting)}
          tone="danger"
          className={styles.stateBlock}
        />
      ) : (
        <AdminDataTable
          data={usuariosFiltrados}
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalItems={total}
          itemLabel="usuarios"
          onRowClick={handleEditarClick}
          isLoading={loading}
          emptyMessage={
            loading
              ? 'Cargando usuarios...'
              : searchTerm
                ? `No se encontraron usuarios para "${searchTerm}"`
                : 'No hay usuarios registrados'
          }
          manualPagination={true}
          manualSorting={true}
        />
      )}

      {/* Modales Separados */}
      <CrearUsuarioModal 
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onSuccess={handleSuccess}
        roles={roles}
      />

      <EditarUsuarioModal 
        usuario={editandoUsuario}
        onClose={() => setEditandoUsuario(null)}
        onSuccess={handleSuccess}
        onDelete={handleEliminar}
        roles={roles}
        puedeEliminar={puedeEliminar}
      />
    </div>
  );
};

export default GestionUsuarios;
