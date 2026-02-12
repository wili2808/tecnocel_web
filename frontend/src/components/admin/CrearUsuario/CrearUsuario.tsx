/**
 * Componente CrearUsuario - Formulario para crear nuevos usuarios del sistema
 * Solo accesible para administradores
 */
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { usuarioService } from '../../../services/usuarioService';
import styles from './CrearUsuario.module.css';

interface FormData {
  nombres: string;
  email: string;
  password: string;
  confirmPassword: string;
  id_rol: number;
}

const CrearUsuario = () => {
  const { isAdmin } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    email: '',
    password: '',
    confirmPassword: '',
    id_rol: 2, // Por defecto empleado
  });

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className="material-icons">block</span>
          <h3>Acceso Denegado</h3>
          <p>Solo los administradores pueden crear usuarios</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'id_rol' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
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
      setLoading(true);
      await usuarioService.crearUsuario({
        nombres: formData.nombres,
        email: formData.email,
        password: formData.password,
        id_rol: formData.id_rol
      });

      showNotification('Usuario creado exitosamente', 'success');

      // Limpiar formulario
      setFormData({
        nombres: '',
        email: '',
        password: '',
        confirmPassword: '',
        id_rol: 2
      });
    } catch (err: any) {
      showNotification(err.message || 'Error al crear usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className="material-icons">person_add</span>
          Crear Nuevo Usuario
        </h2>
        <p className={styles.subtitle}>
          Crea una nueva cuenta de administrador o empleado
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nombres" className={styles.label}>
            Nombre Completo *
          </label>
          <input
            type="text"
            id="nombres"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
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
            onChange={handleChange}
            className={styles.input}
            placeholder="Ej: juan@tecnocel.com"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="id_rol" className={styles.label}>
            Rol *
          </label>
          <select
            id="id_rol"
            name="id_rol"
            value={formData.id_rol}
            onChange={handleChange}
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
            onChange={handleChange}
            className={styles.input}
            placeholder="Mínimo 6 caracteres"
            required
          />
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
            onChange={handleChange}
            className={styles.input}
            placeholder="Repite la contraseña"
            required
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? (
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
  );
};

export default CrearUsuario;
