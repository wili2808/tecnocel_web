/**
 * Componente GestionUsuarios - Lista y gestión de usuarios del sistema
 * Permite ver, crear y eliminar usuarios (admin/empleado)
 * Incluye formulario integrado de creación de usuario
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { usuarioService } from '../../../services/usuarioService';
import type { UsuarioListItem } from '../../../types/usuario';
import styles from './GestionUsuarios.module.css';

type SortKey = 'id_usuario' | 'nombres' | 'email' | 'rol' | 'fecha';
type SortDir = 'asc' | 'desc';

interface CrearUsuarioFormData {
  nombres: string;
  email: string;
  password: string;
  confirmPassword: string;
  id_rol: number;
}

const INITIAL_FORM_DATA: CrearUsuarioFormData = {
  nombres: '',
  email: '',
  password: '',
  confirmPassword: '',
  id_rol: 2,
};

const GestionUsuarios = () => {
  const { isAdmin } = useAuth();
  const { showNotification } = useNotification();
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('id_usuario');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showCrearForm, setShowCrearForm] = useState(false);
  const [creando, setCreando] = useState(false);
  const [formData, setFormData] = useState<CrearUsuarioFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
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
  };

  const handleEliminar = async (id: number) => {
    if (!isAdmin) {
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
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'id_rol' ? parseInt(value) : value
    }));
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombres || !formData.email || !formData.password) {
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
      setCreando(true);
      await usuarioService.crearUsuario({
        nombres: formData.nombres,
        email: formData.email,
        password: formData.password,
        id_rol: formData.id_rol
      });

      showNotification('Usuario creado exitosamente', 'success');
      setFormData(INITIAL_FORM_DATA);
      setShowCrearForm(false);
      cargarUsuarios();
    } catch (err: any) {
      showNotification(err.message || 'Error al crear usuario', 'error');
    } finally {
      setCreando(false);
    }
  };

  const handleCancelarCrear = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowCrearForm(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const sortedUsuarios = useMemo(() => {
    const sorted = [...usuarios];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'id_usuario':
          valA = a.id_usuario;
          valB = b.id_usuario;
          break;
        case 'nombres':
          valA = a.nombres.toLowerCase();
          valB = b.nombres.toLowerCase();
          break;
        case 'email':
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
          break;
        case 'rol':
          valA = a.id_rol;
          valB = b.id_rol;
          break;
        case 'fecha':
          valA = a.fyh_creacion || '';
          valB = b.fyh_creacion || '';
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [usuarios, sortKey, sortDir]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
          <button onClick={cargarUsuarios} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h2 className={styles.title}>
              <span className="material-icons">group</span>
              Gestión de Usuarios
            </h2>
            <p className={styles.subtitle}>
              Administra los usuarios del sistema (administradores y empleados)
            </p>
          </div>
          {isAdmin && !showCrearForm && (
            <button
              className={styles.crearButton}
              onClick={() => setShowCrearForm(true)}
            >
              <span className="material-icons">person_add</span>
              <span>Crear Usuario</span>
            </button>
          )}
        </div>
      </div>

      {showCrearForm && (
        <div className={styles.crearFormWrapper}>
          <div className={styles.crearFormHeader}>
            <h3 className={styles.crearFormTitle}>
              <span className="material-icons">person_add</span>
              Crear Nuevo Usuario
            </h3>
            <button
              className={styles.cerrarFormButton}
              onClick={handleCancelarCrear}
              aria-label="Cerrar formulario"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          <form onSubmit={handleCrearUsuario} className={styles.crearForm}>
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
                  required
                >
                  <option value={1}>Administrador</option>
                  <option value={2}>Empleado</option>
                </select>
                <p className={styles.helpText}>
                  {formData.id_rol === 1
                    ? 'Acceso completo al sistema'
                    : 'Acceso limitado a funcionalidades básicas'}
                </p>
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
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
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
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCancelarCrear}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className={styles.submitButton}
                >
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
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.sortableHeader} onClick={() => handleSort('id_usuario')}>
                <span className={styles.sortableHeaderContent}>
                  ID
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'id_usuario' ? styles.sortIconActive : ''}`}>{getSortIcon('id_usuario')}</span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('nombres')}>
                <span className={styles.sortableHeaderContent}>
                  Nombre
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'nombres' ? styles.sortIconActive : ''}`}>{getSortIcon('nombres')}</span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('email')}>
                <span className={styles.sortableHeaderContent}>
                  Email
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'email' ? styles.sortIconActive : ''}`}>{getSortIcon('email')}</span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('rol')}>
                <span className={styles.sortableHeaderContent}>
                  Rol
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'rol' ? styles.sortIconActive : ''}`}>{getSortIcon('rol')}</span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('fecha')}>
                <span className={styles.sortableHeaderContent}>
                  Fecha de Creación
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'fecha' ? styles.sortIconActive : ''}`}>{getSortIcon('fecha')}</span>
                </span>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyMessage}>
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              sortedUsuarios.map((usuario) => (
                <tr key={usuario.id_usuario}>
                  <td>{usuario.id_usuario}</td>
                  <td>{usuario.nombres}</td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={`${styles.badge} ${usuario.id_rol === 1 ? styles.badgeAdmin : styles.badgeEmpleado}`}>
                      {usuario.Rol?.rol || usuarioService.getRolName(usuario.id_rol)}
                    </span>
                  </td>
                  <td>
                    {usuario.fyh_creacion
                      ? new Date(usuario.fyh_creacion).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        title="Ver detalles"
                      >
                        <span className="material-icons">visibility</span>
                      </button>
                      {isAdmin && (
                        <button
                          className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                          title="Eliminar"
                          onClick={() => handleEliminar(usuario.id_usuario)}
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionUsuarios;
