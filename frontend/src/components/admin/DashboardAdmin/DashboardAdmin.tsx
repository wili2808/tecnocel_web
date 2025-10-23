/**
 * Componente DashboardAdmin - Panel principal de administración
 * Muestra estadísticas y métricas del sistema
 */
import { useAuth } from '../../../contexts/AuthContext';
import styles from './DashboardAdmin.module.css';

const DashboardAdmin = () => {
  const { user, isAdmin } = useAuth();

  const userName = user && 'nombres' in user ? user.nombres : 'Usuario';

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className="material-icons">dashboard</span>
          Dashboard de Administración
        </h2>
        <p className={styles.subtitle}>Bienvenido, {userName}</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <span className="material-icons">group</span>
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statTitle}>Usuarios del Sistema</h3>
            <p className={styles.statValue}>-</p>
            <p className={styles.statLabel}>Total de administradores y empleados</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <span className="material-icons">people</span>
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statTitle}>Clientes Registrados</h3>
            <p className={styles.statValue}>-</p>
            <p className={styles.statLabel}>Total de clientes en la plataforma</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <span className="material-icons">shopping_cart</span>
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statTitle}>Ventas del Mes</h3>
            <p className={styles.statValue}>-</p>
            <p className={styles.statLabel}>Ventas realizadas este mes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <span className="material-icons">inventory_2</span>
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statTitle}>Productos Activos</h3>
            <p className={styles.statValue}>-</p>
            <p className={styles.statLabel}>Total de productos en catálogo</p>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h3 className={styles.sectionTitle}>Acciones Rápidas</h3>
        <div className={styles.actionsGrid}>
          {isAdmin && (
            <button className={styles.actionButton}>
              <span className="material-icons">person_add</span>
              <span>Crear Usuario</span>
            </button>
          )}
          <button className={styles.actionButton}>
            <span className="material-icons">visibility</span>
            <span>Ver Clientes</span>
          </button>
          <button className={styles.actionButton}>
            <span className="material-icons">add_box</span>
            <span>Agregar Producto</span>
          </button>
          <button className={styles.actionButton}>
            <span className="material-icons">assessment</span>
            <span>Ver Reportes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
