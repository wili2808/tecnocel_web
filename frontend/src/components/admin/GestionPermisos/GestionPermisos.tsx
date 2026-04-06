import { useState, useEffect, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { permisoService } from '../../../services/permisoService';
import type { RolesConPermisos, PermisoItem } from '../../../types/permiso';
import styles from './GestionPermisos.module.css';

interface PermisoCheck extends PermisoItem {
  asignado: boolean;
}

const ACCION_COLORES: Record<string, string> = {
  crear: '#22c55e',
  editar: '#3b82f6',
  eliminar: '#ef4444',
  ver: '#6b7280',
  exportar: '#8b5cf6',
  gestionar: '#f59e0b',
  subir: '#14b8a6',
  responder: '#0ea5e9',
  cancelar: '#f97316',
  descargar: '#7c3aed',
  enviar: '#06b6d4',
  moderar: '#ec4899',
};

const ACCION_ICONS: Record<string, string> = {
  crear: 'add_circle',
  editar: 'edit',
  eliminar: 'delete',
  ver: 'visibility',
  exportar: 'download',
  gestionar: 'settings',
  subir: 'cloud_upload',
  responder: 'reply',
  cancelar: 'cancel',
  descargar: 'picture_as_pdf',
  enviar: 'send',
  moderar: 'visibility_off',
};

const GestionPermisos = () => {
  const { showNotification } = useNotification();
  const [roles, setRoles] = useState<RolesConPermisos[]>([]);
  const [permisos, setPermisos] = useState<PermisoItem[]>([]);
  const [permisosAsignados, setPermisosAsignados] = useState<number[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [filtroModulo, setFiltroModulo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rolSeleccionado !== null) {
      cargarPermisosRol();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolSeleccionado]);

  const cargarRoles = async () => {
    try {
      setLoading(true);
      const data = await permisoService.getRoles();
      setRoles(data);
      if (data.length > 0) {
        setRolSeleccionado(data[0].id_rol);
      }
    } catch {
      showNotification('Error al cargar roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarPermisosRol = async () => {
    if (rolSeleccionado === null) return;
    try {
      const data = await permisoService.getPermisosConEstado(rolSeleccionado);
      setPermisos(data.permisos);
      setPermisosAsignados(data.asignados);
    } catch {
      showNotification('Error al cargar permisos del rol', 'error');
    }
  };

  const handleTogglePermiso = (idPermiso: number) => {
    if (rolSeleccionado === 1) {
      showNotification('No puedes modificar los permisos del administrador', 'warning');
      return;
    }
    setPermisosAsignados((prev) =>
      prev.includes(idPermiso) ? prev.filter((id) => id !== idPermiso) : [...prev, idPermiso],
    );
  };

  const handleGuardar = async () => {
    if (rolSeleccionado === null) return;
    if (rolSeleccionado === 1) {
      showNotification('No puedes modificar los permisos del administrador', 'warning');
      return;
    }
    try {
      setGuardando(true);
      await permisoService.syncPermisos({
        id_rol: rolSeleccionado,
        permisos: permisosAsignados,
      });
      showNotification('Permisos guardados correctamente', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showNotification(error.response?.data?.error || 'Error al guardar permisos', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const permisosFiltrados = useMemo(() => {
    return permisos.filter((p) => {
      const coincideModulo = filtroModulo === 'todos' || p.modulo === filtroModulo;
      const coincideBusqueda =
        busqueda === '' ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      return coincideModulo && coincideBusqueda;
    });
  }, [permisos, filtroModulo, busqueda]);

  const permisosPorModulo = useMemo(() => {
    const agrupados: Record<string, PermisoCheck[]> = {};
    permisosFiltrados.forEach((p) => {
      if (!agrupados[p.modulo]) {
        agrupados[p.modulo] = [];
      }
      agrupados[p.modulo].push({
        ...p,
        asignado: permisosAsignados.includes(p.id_permiso),
      });
    });
    return agrupados;
  }, [permisosFiltrados, permisosAsignados]);

  const modulos = useMemo(() => {
    const mods = new Set(permisos.map((p) => p.modulo));
    return ['todos', ...Array.from(mods).sort()];
  }, [permisos]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <span className="material-icons spin">sync</span>
          <span>Cargando permisos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          {rolSeleccionado !== 1 && (
            <button className={styles.guardarButton} onClick={handleGuardar} disabled={guardando}>
              {guardando ? (
                <>
                  <span className="material-icons spin">sync</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-icons">save</span>
                  Guardar Cambios
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Roles</h3>
          <div className={styles.rolesList}>
            {roles.map((rol) => (
              <button
                key={rol.id_rol}
                className={`${styles.rolButton} ${rol.id_rol === rolSeleccionado ? styles.rolButtonActive : ''}`}
                onClick={() => setRolSeleccionado(rol.id_rol)}
              >
                <span className="material-icons">
                  {rol.id_rol === 1 ? 'shield' : rol.id_rol === 2 ? 'supervisor_account' : 'person'}
                </span>
                <div className={styles.rolInfo}>
                  <span className={styles.rolNombre}>{rol.rol}</span>
                  <span className={styles.rolPermisos}>{rol.cantidad_permisos} permisos</span>
                </div>
                {rol.id_rol === 1 && <span className={styles.lockedBadge}>Bloqueado</span>}
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.content}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Módulo:</label>
              <select
                className={styles.filterSelect}
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
              >
                {modulos.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod === 'todos' ? 'Todos los módulos' : mod.charAt(0).toUpperCase() + mod.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.searchGroup}>
              <span className={`material-icons ${styles.searchIcon}`}>search</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar permiso..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {rolSeleccionado === 1 ? (
            <div className={styles.adminInfo}>
              <span className="material-icons">info</span>
              <div>
                <strong>Rol Administrador</strong>
                <p>El administrador tiene todos los permisos del sistema y no puede ser modificado.</p>
              </div>
            </div>
          ) : (
            <div className={styles.permisosGrid}>
              {Object.entries(permisosPorModulo).map(([modulo, perms]) => (
                <div key={modulo} className={styles.moduloCard}>
                  <div className={styles.moduloHeader}>
                    <span className={styles.moduloIcon}>
                      <span className="material-icons">
                        {modulo === 'usuarios'
                          ? 'group'
                          : modulo === 'productos'
                            ? 'inventory_2'
                            : modulo === 'ventas'
                              ? 'receipt'
                              : modulo === 'compras'
                                ? 'shopping_cart'
                                : modulo === 'reportes'
                                  ? 'assessment'
                                  : modulo === 'configuracion'
                                    ? 'settings'
                                    : modulo === 'caracteristicas'
                                      ? 'list_alt'
                                      : modulo === 'clientes'
                                        ? 'people'
                                        : modulo === 'marcas'
                                          ? 'branding_watermark'
                                          : modulo === 'categorias'
                                            ? 'category'
                                            : modulo === 'ofertas'
                                              ? 'local_offer'
                                              : modulo === 'proveedores'
                                                ? 'local_shipping'
                                                : modulo === 'envios'
                                                  ? 'local_shipping'
                                                  : modulo === 'imagenes'
                                                    ? 'image'
                                                    : modulo === 'comentarios'
                                                      ? 'comment'
                                                      : modulo === 'roles'
                                                        ? 'security'
                                                        : 'folder'}
                      </span>
                    </span>
                    <h4 className={styles.moduloTitle}>{modulo.charAt(0).toUpperCase() + modulo.slice(1)}</h4>
                    <span className={styles.moduloCount}>
                      {perms.filter((p) => p.asignado).length}/{perms.length}
                    </span>
                  </div>
                  <div className={styles.permisosList}>
                    {perms.map((perm) => (
                      <label key={perm.id_permiso} className={styles.permisoItem}>
                        <input
                          type="checkbox"
                          checked={perm.asignado}
                          onChange={() => handleTogglePermiso(perm.id_permiso)}
                          className={styles.permisoCheckbox}
                        />
                        <span
                          className={styles.accionBadge}
                          style={{ backgroundColor: ACCION_COLORES[perm.accion] || '#6b7280' }}
                        >
                          <span className="material-icons">{ACCION_ICONS[perm.accion] || 'check'}</span>
                          {perm.accion}
                        </span>
                        <span className={styles.permisoNombre}>
                          {perm.descripcion || perm.nombre.replace(`${perm.accion}_`, '')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {permisosFiltrados.length === 0 && (
            <div className={styles.emptyState}>
              <span className="material-icons">search_off</span>
              <span>No se encontraron permisos</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionPermisos;
