/**
 * Componente InformacionPersonal - Formulario editable para datos personales del usuario
 * Permite actualizar nombre, apellido, celular y NIT/CI
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { authService } from '../../../services/authService';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from './InformacionPersonal.module.css';

interface DatosPersonales {
    nombre_cliente: string;
    apellido_cliente: string;
    celular_cliente: string;
    nit_ci_cliente: string;
}

const InformacionPersonal = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [guardando, setGuardando] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [formData, setFormData] = useState<DatosPersonales>({
        nombre_cliente: user?.nombre_cliente || '',
        apellido_cliente: user?.apellido_cliente || '',
        celular_cliente: user?.celular_cliente || '',
        nit_ci_cliente: user?.nit_ci_cliente || ''
    });

    const [errors, setErrors] = useState<Partial<DatosPersonales>>({});

    // Sincronizar formData cuando el usuario se actualice en el contexto
    useEffect(() => {
        if (user) {
            setFormData({
                nombre_cliente: user.nombre_cliente || '',
                apellido_cliente: user.apellido_cliente || '',
                celular_cliente: user.celular_cliente || '',
                nit_ci_cliente: user.nit_ci_cliente || ''
            });
        }
    }, [user]);

    // Detectar cambios
    useEffect(() => {
        const hasChanged =
            formData.nombre_cliente !== (user?.nombre_cliente || '') ||
            formData.apellido_cliente !== (user?.apellido_cliente || '') ||
            formData.celular_cliente !== (user?.celular_cliente || '') ||
            formData.nit_ci_cliente !== (user?.nit_ci_cliente || '');

        setHasChanges(hasChanged);
    }, [formData, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpiar error del campo
        if (errors[name as keyof DatosPersonales]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validarFormulario = (): boolean => {
        const newErrors: Partial<DatosPersonales> = {};

        if (!formData.nombre_cliente.trim()) {
            newErrors.nombre_cliente = 'El nombre es requerido';
        } else if (formData.nombre_cliente.length < 2) {
            newErrors.nombre_cliente = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!formData.apellido_cliente.trim()) {
            newErrors.apellido_cliente = 'El apellido es requerido';
        } else if (formData.apellido_cliente.length < 2) {
            newErrors.apellido_cliente = 'El apellido debe tener al menos 2 caracteres';
        }

        if (formData.celular_cliente && !/^\d{8,15}$/.test(formData.celular_cliente)) {
            newErrors.celular_cliente = 'Celular debe ser un número válido (8-15 dígitos)';
        }

        if (formData.nit_ci_cliente && formData.nit_ci_cliente.length < 5) {
            newErrors.nit_ci_cliente = 'NIT/CI debe tener al menos 5 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarFormulario()) {
            showNotification('Por favor corrige los errores en el formulario', 'error');
            return;
        }

        try {
            setGuardando(true);
            await authService.actualizarPerfil(formData);

            // Actualizar localStorage con los nuevos datos
            const userFromStorage = localStorage.getItem('auth_user');
            if (userFromStorage) {
                const currentUser = JSON.parse(userFromStorage);
                const updatedUser = {
                    ...currentUser,
                    ...formData
                };
                localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            }

            setHasChanges(false);
            showNotification('Información actualizada correctamente', 'success');

            // Recargar la página para sincronizar con el contexto
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error: any) {
            showNotification(
                error.response?.data?.error || 'Error al actualizar información',
                'error'
            );
        } finally {
            setGuardando(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            nombre_cliente: user?.nombre_cliente || '',
            apellido_cliente: user?.apellido_cliente || '',
            celular_cliente: user?.celular_cliente || '',
            nit_ci_cliente: user?.nit_ci_cliente || ''
        });
        setErrors({});
        setHasChanges(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Información Personal</h2>
                <p className={styles.subtitle}>Actualiza tus datos personales</p>
            </div>

            {hasChanges && (
                <div className={styles.warningBox}>
                    <span className="material-icons">warning</span>
                    <p>Tienes cambios sin guardar</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                    {/* Nombre */}
                    <div className={styles.formGroup}>
                        <label htmlFor="nombre_cliente" className={styles.label}>
                            <span className="material-icons">person</span>
                            Nombre *
                        </label>
                        <input
                            type="text"
                            id="nombre_cliente"
                            name="nombre_cliente"
                            value={formData.nombre_cliente}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.nombre_cliente ? styles.inputError : ''}`}
                            placeholder="Ingresa tu nombre"
                        />
                        {errors.nombre_cliente && (
                            <span className={styles.error}>{errors.nombre_cliente}</span>
                        )}
                    </div>

                    {/* Apellido */}
                    <div className={styles.formGroup}>
                        <label htmlFor="apellido_cliente" className={styles.label}>
                            <span className="material-icons">person_outline</span>
                            Apellido *
                        </label>
                        <input
                            type="text"
                            id="apellido_cliente"
                            name="apellido_cliente"
                            value={formData.apellido_cliente}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.apellido_cliente ? styles.inputError : ''}`}
                            placeholder="Ingresa tu apellido"
                        />
                        {errors.apellido_cliente && (
                            <span className={styles.error}>{errors.apellido_cliente}</span>
                        )}
                    </div>

                    {/* Celular */}
                    <div className={styles.formGroup}>
                        <label htmlFor="celular_cliente" className={styles.label}>
                            <span className="material-icons">phone</span>
                            Celular
                        </label>
                        <input
                            type="tel"
                            id="celular_cliente"
                            name="celular_cliente"
                            value={formData.celular_cliente}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.celular_cliente ? styles.inputError : ''}`}
                            placeholder="Ej: 70123456"
                        />
                        {errors.celular_cliente && (
                            <span className={styles.error}>{errors.celular_cliente}</span>
                        )}
                    </div>

                    {/* NIT/CI */}
                    <div className={styles.formGroup}>
                        <label htmlFor="nit_ci_cliente" className={styles.label}>
                            <span className="material-icons">badge</span>
                            NIT/CI
                        </label>
                        <input
                            type="text"
                            id="nit_ci_cliente"
                            name="nit_ci_cliente"
                            value={formData.nit_ci_cliente}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.nit_ci_cliente ? styles.inputError : ''}`}
                            placeholder="Ingresa tu NIT o CI"
                        />
                        {errors.nit_ci_cliente && (
                            <span className={styles.error}>{errors.nit_ci_cliente}</span>
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className={styles.btnSecondary}
                        disabled={!hasChanges || guardando}
                    >
                        <span className="material-icons">close</span>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={styles.btnPrimary}
                        disabled={!hasChanges || guardando}
                    >
                        {guardando ? (
                            <>
                                <LoadingSpinner />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons">save</span>
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className={styles.infoBox}>
                <span className="material-icons">info</span>
                <p>
                    * Campos obligatorios. Tus datos están protegidos y solo se usan para
                    gestionar tu cuenta y pedidos.
                </p>
            </div>
        </div>
    );
};

export default InformacionPersonal;
