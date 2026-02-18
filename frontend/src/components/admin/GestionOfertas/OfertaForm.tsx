/**
 * Componente OfertaForm - Formulario para crear/editar ofertas
 * Maneja campos de la oferta y en modo edición muestra la asignación de productos
 */
import { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import OfertaProductos from './OfertaProductos';
import type { OfertaFormData, OfertaConProductos } from '../../../types';
import styles from './OfertaForm.module.css';

interface OfertaFormProps {
  modo: 'crear' | 'editar';
  oferta?: OfertaConProductos | null;
  onGuardado: () => void;
  onCancelar: () => void;
}

interface OfertaFormState {
  nombre_oferta: string;
  descripcion: string;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_minimo: string;
  precio_maximo: string;
  limite_uso: string;
  activo: boolean;
}

const INITIAL_FORM: OfertaFormState = {
  nombre_oferta: '',
  descripcion: '',
  tipo_descuento: 'porcentaje',
  valor_descuento: '',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: '',
  precio_minimo: '',
  precio_maximo: '',
  limite_uso: '',
  activo: true,
};

const OfertaForm = ({ modo, oferta, onGuardado, onCancelar }: OfertaFormProps) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<OfertaFormState>(INITIAL_FORM);
  const [ofertaActual, setOfertaActual] = useState<OfertaConProductos | null>(oferta || null);
  const [loading, setLoading] = useState(false);

  // Cargar datos de la oferta en modo edición
  useEffect(() => {
    if (modo === 'editar' && oferta) {
      setFormData({
        nombre_oferta: oferta.nombre_oferta || '',
        descripcion: oferta.descripcion || '',
        tipo_descuento: oferta.tipo_descuento || 'porcentaje',
        valor_descuento: oferta.valor_descuento?.toString() || '',
        fecha_inicio: oferta.fecha_inicio ? oferta.fecha_inicio.split('T')[0] : '',
        fecha_fin: oferta.fecha_fin ? oferta.fecha_fin.split('T')[0] : '',
        precio_minimo: oferta.precio_minimo?.toString() || '',
        precio_maximo: oferta.precio_maximo?.toString() || '',
        limite_uso: oferta.limite_uso?.toString() || '',
        activo: oferta.activo ?? true,
      });
      setOfertaActual(oferta);
    }
  }, [modo, oferta]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre_oferta.trim()) {
      showNotification('El nombre de la oferta es requerido', 'error');
      return;
    }
    if (!formData.valor_descuento || parseFloat(formData.valor_descuento) <= 0) {
      showNotification('El valor del descuento debe ser mayor a 0', 'error');
      return;
    }
    if (formData.tipo_descuento === 'porcentaje' && parseFloat(formData.valor_descuento) > 100) {
      showNotification('El porcentaje de descuento no puede ser mayor a 100', 'error');
      return;
    }
    if (!formData.fecha_inicio) {
      showNotification('La fecha de inicio es requerida', 'error');
      return;
    }
    if (!formData.fecha_fin) {
      showNotification('La fecha de fin es requerida', 'error');
      return;
    }
    if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
      showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
      return;
    }

    try {
      setLoading(true);

      const payload: OfertaFormData = {
        nombre_oferta: formData.nombre_oferta.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        tipo_descuento: formData.tipo_descuento,
        valor_descuento: parseFloat(formData.valor_descuento),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        precio_minimo: formData.precio_minimo ? parseFloat(formData.precio_minimo) : null,
        precio_maximo: formData.precio_maximo ? parseFloat(formData.precio_maximo) : null,
        limite_uso: formData.limite_uso ? parseInt(formData.limite_uso) : null,
        activo: formData.activo,
      };

      if (modo === 'crear') {
        await adminOfertaService.crearOferta(payload);
        showNotification('Oferta creada exitosamente', 'success');
      } else if (oferta) {
        await adminOfertaService.actualizarOferta(oferta.id_oferta, payload);
        showNotification('Oferta actualizada exitosamente', 'success');
      }

      onGuardado();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al guardar oferta';
      showNotification(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /** Recargar datos de la oferta después de cambios en productos */
  const handleProductosChanged = async () => {
    if (oferta) {
      try {
        const ofertaActualizada = await adminOfertaService.obtenerOferta(oferta.id_oferta);
        setOfertaActual(ofertaActualizada);
      } catch {
        // Si falla, no hacer nada crítico
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h2 className={styles.title}>
              <span className="material-icons">
                {modo === 'crear' ? 'add_box' : 'edit'}
              </span>
              {modo === 'crear' ? 'Crear Nueva Oferta' : 'Editar Oferta'}
            </h2>
            <p className={styles.subtitle}>
              {modo === 'crear'
                ? 'Configura los detalles de la nueva oferta o descuento'
                : `Editando: ${oferta?.nombre_oferta || ''}`}
            </p>
          </div>
          <button className={styles.backButton} onClick={onCancelar} type="button">
            <span className="material-icons">arrow_back</span>
            <span>Volver a lista</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Sección: Información Básica */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">local_offer</span>
            Información Básica
          </legend>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre_oferta" className={styles.label}>Nombre de la Oferta *</label>
              <input
                type="text"
                id="nombre_oferta"
                name="nombre_oferta"
                value={formData.nombre_oferta}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ej: Black Friday 2026"
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroupFull}>
              <label htmlFor="descripcion" className={styles.label}>Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Descripción de la oferta (opcional)..."
                rows={3}
              />
            </div>
          </div>
        </fieldset>

        {/* Sección: Descuento */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">percent</span>
            Descuento
          </legend>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="tipo_descuento" className={styles.label}>Tipo de Descuento *</label>
              <select
                id="tipo_descuento"
                name="tipo_descuento"
                value={formData.tipo_descuento}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto Fijo (BOB)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="valor_descuento" className={styles.label}>
                Valor del Descuento *
              </label>
              <input
                type="number"
                id="valor_descuento"
                name="valor_descuento"
                value={formData.valor_descuento}
                onChange={handleChange}
                className={styles.input}
                placeholder="0"
                step="0.01"
                min="0"
                max={formData.tipo_descuento === 'porcentaje' ? '100' : undefined}
                required
              />
              <p className={styles.helpText}>
                {formData.tipo_descuento === 'porcentaje'
                  ? 'Ej: 20 = 20% de descuento sobre el precio de venta'
                  : 'Ej: 150 = Se restan 150 BOB del precio de venta'}
              </p>
            </div>
          </div>
        </fieldset>

        {/* Sección: Vigencia */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">date_range</span>
            Vigencia
          </legend>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="fecha_inicio" className={styles.label}>Fecha de Inicio *</label>
              <input
                type="date"
                id="fecha_inicio"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="fecha_fin" className={styles.label}>Fecha de Fin *</label>
              <input
                type="date"
                id="fecha_fin"
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleChange}
                className={styles.input}
                min={formData.fecha_inicio}
                required
              />
            </div>
          </div>
        </fieldset>

        {/* Sección: Restricciones */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>
            <span className="material-icons">tune</span>
            Restricciones (Opcional)
          </legend>
          <div className={styles.formRow3}>
            <div className={styles.formGroup}>
              <label htmlFor="precio_minimo" className={styles.label}>Precio Mínimo (BOB)</label>
              <input
                type="number"
                id="precio_minimo"
                name="precio_minimo"
                value={formData.precio_minimo}
                onChange={handleChange}
                className={styles.input}
                placeholder="Sin mínimo"
                step="0.01"
                min="0"
              />
              <p className={styles.helpText}>Solo aplicar a productos con precio mayor a este valor</p>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="precio_maximo" className={styles.label}>Precio Máximo (BOB)</label>
              <input
                type="number"
                id="precio_maximo"
                name="precio_maximo"
                value={formData.precio_maximo}
                onChange={handleChange}
                className={styles.input}
                placeholder="Sin máximo"
                step="0.01"
                min="0"
              />
              <p className={styles.helpText}>Solo aplicar a productos con precio menor a este valor</p>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="limite_uso" className={styles.label}>Límite de Uso</label>
              <input
                type="number"
                id="limite_uso"
                name="limite_uso"
                value={formData.limite_uso}
                onChange={handleChange}
                className={styles.input}
                placeholder="Sin límite"
                min="0"
              />
              <p className={styles.helpText}>Cantidad máxima de veces que se puede usar</p>
            </div>
          </div>
        </fieldset>

        {/* Sección: Estado (solo en edición) */}
        {modo === 'editar' && (
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>
              <span className="material-icons">toggle_on</span>
              Estado
            </legend>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <span>Oferta activa</span>
              </label>
            </div>
            <p className={styles.helpText}>
              Desactivar la oferta la ocultará de la tienda sin eliminarla
            </p>
          </fieldset>
        )}

        {/* Acciones del formulario */}
        <div className={styles.formFooter}>
          <button type="button" onClick={onCancelar} className={styles.cancelButton}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? (
              <>
                <span className="material-icons">hourglass_empty</span>
                {modo === 'crear' ? 'Creando...' : 'Guardando...'}
              </>
            ) : (
              <>
                <span className="material-icons">{modo === 'crear' ? 'add_box' : 'save'}</span>
                {modo === 'crear' ? 'Crear Oferta' : 'Guardar Cambios'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sección de productos (solo en edición) */}
      {modo === 'editar' && ofertaActual && (
        <OfertaProductos
          oferta={ofertaActual}
          onProductosChanged={handleProductosChanged}
        />
      )}
    </div>
  );
};

export default OfertaForm;
