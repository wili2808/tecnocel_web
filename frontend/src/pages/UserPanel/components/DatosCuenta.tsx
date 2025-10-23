/**
 * Componente DatosCuenta - Muestra información de la cuenta del usuario (solo lectura)
 * Información como email, tipo de cuenta, fecha de registro, etc.
 */
import { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { authService } from '../../../services/authService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import styles from './DatosCuenta.module.css';

interface PerfilCompleto {
    id_cliente: number;
    email_cliente: string;
    nombre_cliente: string;
    apellido_cliente: string;
    celular_cliente: string | null;
    nit_ci_cliente: string | null;
    is_google_account: boolean;
    email_verified: boolean;
    fyh_creacion: string;
    last_login: string | null;
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
            const data = await authService.obtenerPerfil();
            // Cast explícito para manejar la diferencia entre undefined y null
            const perfilData: PerfilCompleto = {
                id_cliente: data.id_cliente,
                email_cliente: data.email_cliente,
                nombre_cliente: data.nombre_cliente,
                apellido_cliente: data.apellido_cliente,
                celular_cliente: data.celular_cliente || null,
                nit_ci_cliente: data.nit_ci_cliente || null,
                is_google_account: data.is_google_account || false,
                email_verified: data.email_verified || false,
                fyh_creacion: data.fyh_creacion instanceof Date ? data.fyh_creacion.toISOString() : String(data.fyh_creacion),
                last_login: data.last_login instanceof Date ? data.last_login.toISOString() : (data.last_login ? String(data.last_login) : null)
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
            minute: '2-digit'
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
                    <span className={styles.value}>{perfil.email_cliente}</span>
                </div>

                {/* Tipo de cuenta */}
                <div className={styles.infoRow}>
                    <span className={styles.label}>
                        <span className="material-icons">account_circle</span>
                        Tipo de cuenta
                    </span>
                    <span className={`${styles.value} ${styles.badge} ${perfil.is_google_account ? styles.google : styles.normal}`}>
                        {perfil.is_google_account ? 'Google OAuth' : 'Cuenta Normal'}
                    </span>
                </div>

                {/* ID Cliente */}
                <div className={styles.infoRow}>
                    <span className={styles.label}>
                        <span className="material-icons">badge</span>
                        ID de Cliente
                    </span>
                    <span className={styles.value}>#{perfil.id_cliente}</span>
                </div>

                {/* Estado */}
                <div className={styles.infoRow}>
                    <span className={styles.label}>
                        <span className="material-icons">check_circle</span>
                        Estado
                    </span>
                    <span className={`${styles.value} ${styles.badge} ${styles.activo}`}>
                        Activo
                    </span>
                </div>

                {/* Fecha de registro */}
                <div className={styles.infoRow}>
                    <span className={styles.label}>
                        <span className="material-icons">calendar_today</span>
                        Fecha de registro
                    </span>
                    <span className={styles.value}>{formatearFecha(perfil.fyh_creacion)}</span>
                </div>

                {/* Último acceso */}
                <div className={styles.infoRow}>
                    <span className={styles.label}>
                        <span className="material-icons">schedule</span>
                        Último acceso
                    </span>
                    <span className={styles.value}>{formatearFecha(perfil.last_login)}</span>
                </div>
            </div>

            <div className={styles.infoBox}>
                <span className="material-icons">info</span>
                <p>
                    Esta información es de solo lectura. Para modificar tus datos personales,
                    ve a la sección "Información Personal".
                </p>
            </div>
        </div>
    );
};

export default DatosCuenta;
