/**
 * Componente DashboardAdmin - Panel principal de administración
 * Muestra estadísticas y métricas del sistema obtenidas desde la API.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import adminApi from '../../../api/axiosAdminConfig';
import styles from './DashboardAdmin.module.css';

interface DashboardAdminProps {
  onNavigate: (section: string) => void;
}

interface StatsGenerales {
  usuarios_sistema: number;
  clientes_registrados: number;
  productos_activos: number;
}

interface StatsVentas {
  ventas_mes: number;
}

const DashboardAdmin = ({ onNavigate }: DashboardAdminProps) => {
  const { user, isAdmin } = useAuth();

  const userName = user && 'nombres' in user ? user.nombres : 'Usuario';

  const [statsGenerales, setStatsGenerales] = useState<StatsGenerales | null>(null);
  const [statsVentas, setStatsVentas] = useState<StatsVentas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      setCargando(true);
      try {
        const [resGenerales, resVentas] = await Promise.all([
          adminApi.get<StatsGenerales>('/usuarios/admin/dashboard-stats'),
          adminApi.get<StatsVentas>('/ventas/admin/estadisticas')
        ]);
        if (activo) {
          setStatsGenerales(resGenerales.data);
          setStatsVentas(resVentas.data);
        }
      } catch {
        // Stats no críticas: si fallan, se muestran guiones
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => { activo = false; };
  }, []);

  const fmt = (n: number | null | undefined) =>
    cargando ? '...' : n != null ? n.toLocaleString('es-AR') : '-';

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
            <p className={styles.statValue}>{fmt(statsGenerales?.usuarios_sistema)}</p>
            <p className={styles.statLabel}>Total de administradores y empleados</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <span className="material-icons">people</span>
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statTitle}>Clientes Registrados</h3>
            <p className={styles.statValue}>{fmt(statsGenerales?.clientes_registrados)}</p>
            <p className={styles.statLabel}>Total de clientes en la plataforma</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <span className="material-icons">shopping_cart</span>
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statTitle}>Ventas del Mes</h3>
            <p className={styles.statValue}>{fmt(statsVentas?.ventas_mes)}</p>
            <p className={styles.statLabel}>Ventas realizadas este mes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <span className="material-icons">inventory_2</span>
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statTitle}>Productos Activos</h3>
            <p className={styles.statValue}>{fmt(statsGenerales?.productos_activos)}</p>
            <p className={styles.statLabel}>Total de productos en catálogo</p>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h3 className={styles.sectionTitle}>Acciones Rápidas</h3>
        <div className={styles.actionsGrid}>
          {isAdmin && (
            <button className={styles.actionButton} onClick={() => onNavigate('usuarios')}>
              <span className="material-icons">person_add</span>
              <span>Gestionar Usuarios</span>
            </button>
          )}
          <button className={styles.actionButton} onClick={() => onNavigate('clientes')}>
            <span className="material-icons">visibility</span>
            <span>Ver Clientes</span>
          </button>
          <button className={styles.actionButton} onClick={() => onNavigate('productos')}>
            <span className="material-icons">add_box</span>
            <span>Gestionar Productos</span>
          </button>
          <button className={styles.actionButton} onClick={() => onNavigate('ofertas')}>
            <span className="material-icons">local_offer</span>
            <span>Gestionar Ofertas</span>
          </button>
          <button className={styles.actionButton} onClick={() => onNavigate('ventas')}>
            <span className="material-icons">receipt_long</span>
            <span>Gestión de Ventas</span>
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
