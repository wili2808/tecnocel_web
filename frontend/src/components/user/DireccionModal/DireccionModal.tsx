/**
 * Componente DireccionModal - Modal para crear/editar direcciones
 * Formulario completo de dirección con validación
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';

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

    return createPortal(
        <div className="modalOverlayPremium" onClick={handleOverlayClick}>
            <div className="modalPremium" style={{ maxWidth: '750px' }}>
                <div className="modalHeaderPremium">
                    <h2 className="modalTitlePremium">
                        <span className="material-icons">location_on</span>
                        {title}
                    </h2>
                    <button onClick={onClose} className="closeButtonPremium" aria-label="Cerrar">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="modalBodyPremium">
                    <form id="direccion-form" onSubmit={handleSubmit} className={styles.form}>
                        
                        <span className={styles.sectionTitlePremium}>Ubicación Principal</span>
                        <div className={styles.formGridPremium}>
                            <Input
                                id="nombre_direccion"
                                name="nombre_direccion"
                                label="Nombre de Dirección"
                                value={formData.nombre_direccion}
                                onChange={handleChange}
                                error={errors.nombre_direccion}
                                required
                                disabled={loading}
                                placeholder="Ej: Casa, Trabajo, etc."
                            />

                            <Input
                                id="calle"
                                name="calle"
                                label="Calle"
                                value={formData.calle}
                                onChange={handleChange}
                                error={errors.calle}
                                required
                                disabled={loading}
                                placeholder="Nombre de la calle"
                            />

                            <Input
                                id="numero"
                                name="numero"
                                label="Número"
                                value={formData.numero}
                                onChange={handleChange}
                                error={errors.numero}
                                required
                                disabled={loading}
                                placeholder="Ej: 123"
                            />

                            <Input
                                id="barrio"
                                name="barrio"
                                label="Barrio/Zona"
                                value={formData.barrio}
                                onChange={handleChange}
                                error={errors.barrio}
                                required
                                disabled={loading}
                                placeholder="Nombre del barrio o zona"
                            />

                            <Input
                                id="ciudad"
                                name="ciudad"
                                label="Ciudad"
                                value={formData.ciudad}
                                onChange={handleChange}
                                error={errors.ciudad}
                                required
                                disabled={loading}
                                placeholder="Ciudad"
                            />

                            <Input
                                id="provincia"
                                name="provincia"
                                label="Departamento/Provincia"
                                value={formData.provincia}
                                onChange={handleChange}
                                error={errors.provincia}
                                required
                                disabled={loading}
                                placeholder="Ej: Santa Cruz"
                            />
                        </div>

                        <div className={styles.formDivider} style={{ margin: '8px 0', borderBottom: '1px solid var(--border-color)' }} />

                        <span className={styles.sectionTitlePremium}>Detalles Adicionales</span>
                        <div className={styles.formGridPremium}>
                            <Input
                                id="piso"
                                name="piso"
                                label="Piso (Opcional)"
                                value={formData.piso}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="Ej: 3"
                            />

                            <Input
                                id="departamento"
                                name="departamento"
                                label="Departamento/Apto (Opcional)"
                                value={formData.departamento}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="Ej: 3A"
                            />

                            <Input
                                id="codigo_postal"
                                name="codigo_postal"
                                label="Código Postal"
                                value={formData.codigo_postal}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="Ej: 3000"
                            />

                            <Input
                                id="telefono_contacto"
                                name="telefono_contacto"
                                type="tel"
                                label="Teléfono de Contacto"
                                value={formData.telefono_contacto}
                                onChange={handleChange}
                                error={errors.telefono_contacto}
                                required
                                disabled={loading}
                                placeholder="Ej: 70123456"
                            />

                            <div className={styles.formGroupFullPremium}>
                                <TextArea
                                    id="referencia"
                                    name="referencia"
                                    label="Referencia / Indicaciones"
                                    value={formData.referencia}
                                    onChange={handleChange}
                                    placeholder="Ej: Portón azul, frente a la plaza, etc."
                                    disabled={loading}
                                    rows={3}
                                />
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
                    </form>
                </div>

                <div className="modalFooterPremium">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btnPremium btnSecondaryPremium"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="direccion-form"
                        className="btnPremium btnPrimaryPremium"
                        disabled={loading}
                    >
                        <span className="material-icons" style={{ fontSize: '18px' }}>
                            {loading ? 'hourglass_empty' : 'save'}
                        </span>
                        {loading ? 'Guardando...' : 'Guardar Dirección'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DireccionModal;

