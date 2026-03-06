/**
 * Componente DireccionModal - Modal para crear/editar direcciones
 * Formulario completo de dirección con validación
 */
import { useState, useEffect } from 'react';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from './DireccionModal.module.css';

export interface DireccionFormData {
    nombre_direccion: string;
    calle: string;
    numero: string;
    barrio: string;
    ciudad: string;
    provincia: string; // Departamento/Estado/Provincia
    piso?: string; // Piso del edificio
    departamento?: string; // Depto del edificio (ej: 3A)
    codigo_postal?: string;
    referencia?: string;
    telefono_contacto: string;
    es_predeterminada: boolean;
    es_facturacion: boolean;
}

interface DireccionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (direccion: DireccionFormData) => Promise<void>;
    direccion?: DireccionFormData & { id_direccion?: number };
    title: string;
}

const initialFormData: DireccionFormData = {
    nombre_direccion: '',
    calle: '',
    numero: '',
    barrio: '',
    ciudad: '',
    provincia: '',
    piso: '',
    departamento: '',
    codigo_postal: '',
    referencia: '',
    telefono_contacto: '',
    es_predeterminada: false,
    es_facturacion: false
};

const DireccionModal = ({ isOpen, onClose, onSave, direccion, title }: DireccionModalProps) => {
    const [formData, setFormData] = useState<DireccionFormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<DireccionFormData>>({});

    useEffect(() => {
        if (direccion) {
            setFormData({
                nombre_direccion: direccion.nombre_direccion,
                calle: direccion.calle,
                numero: direccion.numero,
                barrio: direccion.barrio,
                ciudad: direccion.ciudad,
                provincia: direccion.provincia,
                piso: direccion.piso || '',
                departamento: direccion.departamento || '',
                codigo_postal: direccion.codigo_postal || '',
                referencia: direccion.referencia || '',
                telefono_contacto: direccion.telefono_contacto,
                es_predeterminada: direccion.es_predeterminada,
                es_facturacion: direccion.es_facturacion
            });
        } else {
            setFormData(initialFormData);
        }
        setErrors({});
    }, [direccion, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpiar error del campo
        if (errors[name as keyof DireccionFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validarFormulario = (): boolean => {
        const newErrors: Partial<DireccionFormData> = {};

        if (!formData.nombre_direccion.trim()) {
            newErrors.nombre_direccion = 'Nombre de dirección es requerido';
        }

        if (!formData.calle.trim()) {
            newErrors.calle = 'Calle es requerida';
        }

        if (!formData.numero.trim()) {
            newErrors.numero = 'Número es requerido';
        }

        if (!formData.barrio.trim()) {
            newErrors.barrio = 'Barrio es requerido';
        }

        if (!formData.ciudad.trim()) {
            newErrors.ciudad = 'Ciudad es requerida';
        }

        if (!formData.provincia.trim()) {
            newErrors.provincia = 'Departamento/Provincia es requerido';
        }

        if (!formData.telefono_contacto.trim()) {
            newErrors.telefono_contacto = 'Teléfono es requerido';
        } else if (!/^\d{8,15}$/.test(formData.telefono_contacto)) {
            newErrors.telefono_contacto = 'Teléfono inválido (8-15 dígitos)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        try {
            setLoading(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error al guardar dirección:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        {/* Nombre de dirección */}
                        <div className={styles.formGroup}>
                            <label htmlFor="nombre_direccion" className={styles.label}>
                                Nombre de Dirección *
                            </label>
                            <input
                                type="text"
                                id="nombre_direccion"
                                name="nombre_direccion"
                                value={formData.nombre_direccion}
                                onChange={handleChange}
                                placeholder="Ej: Casa, Trabajo, etc."
                                className={`${styles.input} ${errors.nombre_direccion ? styles.inputError : ''}`}
                            />
                            {errors.nombre_direccion && (
                                <span className={styles.error}>{errors.nombre_direccion}</span>
                            )}
                        </div>

                        {/* Calle */}
                        <div className={styles.formGroup}>
                            <label htmlFor="calle" className={styles.label}>
                                Calle *
                            </label>
                            <input
                                type="text"
                                id="calle"
                                name="calle"
                                value={formData.calle}
                                onChange={handleChange}
                                placeholder="Nombre de la calle"
                                className={`${styles.input} ${errors.calle ? styles.inputError : ''}`}
                            />
                            {errors.calle && (
                                <span className={styles.error}>{errors.calle}</span>
                            )}
                        </div>

                        {/* Número */}
                        <div className={styles.formGroup}>
                            <label htmlFor="numero" className={styles.label}>
                                Número *
                            </label>
                            <input
                                type="text"
                                id="numero"
                                name="numero"
                                value={formData.numero}
                                onChange={handleChange}
                                placeholder="Número de casa/edificio"
                                className={`${styles.input} ${errors.numero ? styles.inputError : ''}`}
                            />
                            {errors.numero && (
                                <span className={styles.error}>{errors.numero}</span>
                            )}
                        </div>

                        {/* Barrio */}
                        <div className={styles.formGroup}>
                            <label htmlFor="barrio" className={styles.label}>
                                Barrio/Zona *
                            </label>
                            <input
                                type="text"
                                id="barrio"
                                name="barrio"
                                value={formData.barrio}
                                onChange={handleChange}
                                placeholder="Nombre del barrio o zona"
                                className={`${styles.input} ${errors.barrio ? styles.inputError : ''}`}
                            />
                            {errors.barrio && (
                                <span className={styles.error}>{errors.barrio}</span>
                            )}
                        </div>

                        {/* Ciudad */}
                        <div className={styles.formGroup}>
                            <label htmlFor="ciudad" className={styles.label}>
                                Ciudad *
                            </label>
                            <input
                                type="text"
                                id="ciudad"
                                name="ciudad"
                                value={formData.ciudad}
                                onChange={handleChange}
                                placeholder="Ciudad"
                                className={`${styles.input} ${errors.ciudad ? styles.inputError : ''}`}
                            />
                            {errors.ciudad && (
                                <span className={styles.error}>{errors.ciudad}</span>
                            )}
                        </div>

                        {/* Provincia/Departamento */}
                        <div className={styles.formGroup}>
                            <label htmlFor="provincia" className={styles.label}>
                                Departamento/Provincia *
                            </label>
                            <input
                                type="text"
                                id="provincia"
                                name="provincia"
                                value={formData.provincia}
                                onChange={handleChange}
                                placeholder="Ej: Santa Cruz"
                                className={`${styles.input} ${errors.provincia ? styles.inputError : ''}`}
                            />
                            {errors.provincia && (
                                <span className={styles.error}>{errors.provincia}</span>
                            )}
                        </div>

                        {/* Piso (opcional) */}
                        <div className={styles.formGroup}>
                            <label htmlFor="piso" className={styles.label}>
                                Piso
                            </label>
                            <input
                                type="text"
                                id="piso"
                                name="piso"
                                value={formData.piso}
                                onChange={handleChange}
                                placeholder="Ej: 3"
                                className={styles.input}
                            />
                        </div>

                        {/* Departamento/Apto (opcional) */}
                        <div className={styles.formGroup}>
                            <label htmlFor="departamento" className={styles.label}>
                                Departamento/Apto
                            </label>
                            <input
                                type="text"
                                id="departamento"
                                name="departamento"
                                value={formData.departamento}
                                onChange={handleChange}
                                placeholder="Ej: 3A"
                                className={styles.input}
                            />
                        </div>

                        {/* Código Postal */}
                        <div className={styles.formGroup}>
                            <label htmlFor="codigo_postal" className={styles.label}>
                                Código Postal
                            </label>
                            <input
                                type="text"
                                id="codigo_postal"
                                name="codigo_postal"
                                value={formData.codigo_postal}
                                onChange={handleChange}
                                placeholder="Opcional"
                                className={styles.input}
                            />
                        </div>

                        {/* Referencia */}
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label htmlFor="referencia" className={styles.label}>
                                Referencia
                            </label>
                            <textarea
                                id="referencia"
                                name="referencia"
                                value={formData.referencia}
                                onChange={handleChange}
                                placeholder="Ej: Cerca del parque, portón azul, etc."
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>

                        {/* Teléfono de contacto */}
                        <div className={styles.formGroup}>
                            <label htmlFor="telefono_contacto" className={styles.label}>
                                Teléfono de Contacto *
                            </label>
                            <input
                                type="tel"
                                id="telefono_contacto"
                                name="telefono_contacto"
                                value={formData.telefono_contacto}
                                onChange={handleChange}
                                placeholder="70123456"
                                className={`${styles.input} ${errors.telefono_contacto ? styles.inputError : ''}`}
                            />
                            {errors.telefono_contacto && (
                                <span className={styles.error}>{errors.telefono_contacto}</span>
                            )}
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="es_predeterminada"
                                checked={formData.es_predeterminada}
                                onChange={handleChange}
                            />
                            <span>Establecer como dirección predeterminada</span>
                        </label>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="es_facturacion"
                                checked={formData.es_facturacion}
                                onChange={handleChange}
                            />
                            <span>Usar para facturación</span>
                        </label>
                    </div>

                    {/* Botones */}
                    <div className={styles.actions}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.btnSecondary}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="sm" className={styles.buttonSpinner} />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Dirección'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DireccionModal;

