/**
 * Componente GestionUsuarios - Lista y gestión de usuarios del sistema
 * Permite ver, editar y eliminar usuarios (admin/empleado)
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { usuarioService } from '../../../services/usuarioService';
import type { UsuarioListItem } from '../../../types/usuario';
import styles from './GestionUsuarios.module.css';

const GestionUsuarios = () => {
  const { isAdmin } = useAuth();
  const { showNotification } = useNotification();
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <h2 className={styles.title}>
          <span className="material-icons">group</span>
          Gestión de Usuarios
        </h2>
        <p className={styles.subtitle}>
          Administra los usuarios del sistema (administradores y empleados)
        </p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyMessage}>
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
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
