/**
 * Componente DatosCuenta - Muestra información de la cuenta del usuario (solo lectura)
 * Información como email, tipo de cuenta, fecha de registro, etc.
 */
import { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import clienteService from '../../../services/clienteService';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from './DatosCuenta.module.css';

interface PerfilCompleto {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  celular: string | null;
  nitCi: string | null;
  isGoogleAccount: boolean;
  isEmailVerified: boolean;
  miembroDesde: string | null;
  ultimoIngreso: string | null;
}

const DatosCuenta = () => {
  const { showNotification } = useNotification();
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const data = await clienteService.obtenerPerfil();
      const perfilData: PerfilCompleto = {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        celular: data.celular || null,
        nitCi: data.nitCi || null,
        isGoogleAccount: data.isGoogleAccount || false,
        isEmailVerified: data.isEmailVerified || false,
        miembroDesde: data.miembroDesde || null,
        ultimoIngreso: data.ultimoIngreso || null,
      };
      setPerfil(perfilData);
    } catch (error: any) {
      showNotification('Error al cargar datos de cuenta', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className={styles.errorContainer}>
        <p>No se pudo cargar la información de la cuenta</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Datos de Cuenta</h2>
        <p className={styles.subtitle}>Información general de tu cuenta</p>
      </div>

      <div className={styles.content}>
        {/* Email */}
        <div className={styles.infoRow}>
          <span className={styles.label}>
            <span className="material-icons">email</span>
            Email
          </span>
          <span className={styles.value}>{perfil.email}</span>
        </div>

        {/* Tipo de cuenta */}
        <div className={styles.infoRow}>
          <span className={styles.label}>
            <span className="material-icons">account_circle</span>
            Tipo de cuenta
          </span>
          <span className={`${styles.value} ${styles.badge} ${perfil.isGoogleAccount ? styles.google : styles.normal}`}>
            {perfil.isGoogleAccount ? 'Google OAuth' : 'Cuenta Normal'}
          </span>
        </div>

        {/* ID Cliente */}
        <div className={styles.infoRow}>
          <span className={styles.label}>
            <span className="material-icons">badge</span>
            ID de Cliente
          </span>
          <span className={styles.value}>#{perfil.id}</span>
        </div>

        {/* Estado */}
        <div className={styles.infoRow}>
          <span className={styles.label}>
            <span className="material-icons">check_circle</span>
            Estado
          </span>
          <span className={`${styles.value} ${styles.badge} ${styles.activo}`}>Activo</span>
        </div>

        {/* Fecha de registro */}
        <div className={styles.infoRow}>
          <span className={styles.label}>
            <span className="material-icons">calendar_today</span>
            Fecha de registro
          </span>
          <span className={styles.value}>{formatearFecha(perfil.miembroDesde)}</span>
        </div>

        {/* Último acceso */}
        <div className={styles.infoRow}>
          <span className={styles.label}>
            <span className="material-icons">schedule</span>
            Último acceso
          </span>
          <span className={styles.value}>{formatearFecha(perfil.ultimoIngreso)}</span>
        </div>
      </div>

      <div className={styles.infoBox}>
        <span className="material-icons">info</span>
        <p>
          Esta información es de solo lectura. Para modificar tus datos personales, ve a la sección "Información
          Personal".
        </p>
      </div>
    </div>
  );
};

export default DatosCuenta;
