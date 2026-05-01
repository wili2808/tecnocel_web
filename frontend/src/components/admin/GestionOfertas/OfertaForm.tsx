import React, { useState, useEffect, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import OfertaProductos from './OfertaProductos';
import type { OfertaFormData, OfertaConProductos } from '../../../types';
import styles from './OfertaForm.module.css';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';

interface OfertaFormProps {
  modo: 'crear' | 'editar';
  oferta?: OfertaConProductos | null;
  onGuardado: () => void;
  onCancelar: () => void;
  onEliminar?: () => void;
  isModal?: boolean;
}

type TabType = 'general' | 'productos';

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

const OfertaForm: React.FC<OfertaFormProps> = memo(({ modo, oferta, onGuardado, onCancelar, onEliminar, isModal = false }) => {
  const { showNotification } = useNotification();
  const { tipoCambio } = useTipoCambio();
  const [formData, setFormData] = useState<OfertaFormState>(INITIAL_FORM);
  const [ofertaActual, setOfertaActual] = useState<OfertaConProductos | null>(oferta || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Cargar datos de la oferta en modo edición
  useEffect(() => {
    if (modo === 'editar' && oferta) {
      setFormData({
        nombre_oferta: oferta.nombre_oferta || '',
        descripcion: oferta.descripcion || '',
        tipo_descuento: oferta.tipo_descuento || 'porcentaje',
        valor_descuento: (oferta.tipo_descuento === 'monto_fijo' 
          ? Math.round(oferta.valor_descuento * tipoCambio) 
          : parseFloat(oferta.valor_descuento.toString()))?.toString() || '',
        fecha_inicio: oferta.fecha_inicio ? oferta.fecha_inicio.split('T')[0] : '',
        fecha_fin: oferta.fecha_fin ? oferta.fecha_fin.split('T')[0] : '',
        precio_minimo: oferta.precio_minimo ? Math.round(oferta.precio_minimo * tipoCambio).toString() : '',
        precio_maximo: oferta.precio_maximo ? Math.round(oferta.precio_maximo * tipoCambio).toString() : '',
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
        valor_descuento: formData.tipo_descuento === 'monto_fijo'
          ? parseFloat(formData.valor_descuento) / tipoCambio
          : parseFloat(formData.valor_descuento),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        precio_minimo: formData.precio_minimo ? parseFloat(formData.precio_minimo) / tipoCambio : null,
        precio_maximo: formData.precio_maximo ? parseFloat(formData.precio_maximo) / tipoCambio : null,
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

  if (isModal) {
    return (
      <PremiumModal
        isOpen={true}
        onClose={onCancelar}
        title={modo === 'crear' ? 'Nueva Oferta' : `Editar Oferta: ${formData.nombre_oferta}`}
        icon={modo === 'crear' ? 'add_circle' : 'local_offer'}
        maxWidth={activeTab === 'productos' ? '950px' : '750px'}
      >
        {/* Navegación por Tabs (Solo en edición) */}
        {modo === 'editar' && (
          <div className="modalTabsPremium">
            <button 
              type="button"
              className={`modalTabBtnPremium ${activeTab === 'general' ? 'modalTabActivePremium' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className="material-icons">settings</span>
              Configuración General
            </button>
            <button 
              type="button"
              className={`modalTabBtnPremium ${activeTab === 'productos' ? 'modalTabActivePremium' : ''}`}
              onClick={() => setActiveTab('productos')}
            >
              <span className="material-icons">inventory_2</span>
              Productos Asignados ({ofertaActual?.productos?.length || 0})
            </button>
          </div>
        )}

        {/* Cuerpo del Modal */}
        <div className="modalBodyPremium" style={{ padding: activeTab === 'productos' ? '0' : undefined }}>
          {activeTab === 'general' ? (
            <form id="oferta-form" onSubmit={handleSubmit}>
              
              <h4 className="sectionTitleWithDividerPremium">Información de la Oferta</h4>
              <div className="modalFormGridPremium" style={{ gridTemplateColumns: '1fr' }}>
                <Input
                  id="nombre_oferta"
                  name="nombre_oferta"
                  label="Nombre de la Oferta"
                  value={formData.nombre_oferta}
                  onChange={handleChange}
                  placeholder="Ej: Ofertas de Verano"
                  required
                  disabled={loading}
                />
                <TextArea
                  id="descripcion"
                  name="descripcion"
                  label="Descripción Corta"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Breve descripción para control interno..."
                  rows={2}
                  disabled={loading}
                  className="mt-4"
                />
              </div>

              <h4 className="sectionTitleWithDividerPremium mt-8">Configuración y Vigencia</h4>
              <div className="modalFormGridPremium">
                <Select
                  id="tipo_descuento"
                  name="tipo_descuento"
                  label="Tipo de Descuento"
                  value={formData.tipo_descuento}
                  onChange={handleChange}
                  disabled={loading}
                  options={[
                    { value: 'porcentaje', label: 'Porcentaje (%)' },
                    { value: 'monto_fijo', label: 'Monto Fijo ($)' }
                  ]}
                />
                <Input
                  id="valor_descuento"
                  name="valor_descuento"
                  type="number"
                  label="Valor del Descuento"
                  value={formData.valor_descuento}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  disabled={loading}
                  icon={formData.tipo_descuento === 'porcentaje' ? 'percent' : 'payments'}
                />
                <Input
                  id="fecha_inicio"
                  name="fecha_inicio"
                  type="date"
                  label="Inicia el..."
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <Input
                  id="fecha_fin"
                  name="fecha_fin"
                  type="date"
                  label="Termina el..."
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  min={formData.fecha_inicio}
                />
              </div>

              <h4 className="sectionTitleWithDividerPremium mt-8">Restricciones y Límites</h4>
              <div className="modalFormGridPremium">
                <Input
                  id="precio_minimo"
                  name="precio_minimo"
                  type="number"
                  label="Precio Mínimo ($)"
                  value={formData.precio_minimo}
                  onChange={handleChange}
                  placeholder="Sin mínimo"
                  disabled={loading}
                />
                <Input
                  id="precio_maximo"
                  name="precio_maximo"
                  type="number"
                  label="Precio Máximo ($)"
                  value={formData.precio_maximo}
                  onChange={handleChange}
                  placeholder="Sin máximo"
                  disabled={loading}
                />
                <Input
                  id="limite_uso"
                  name="limite_uso"
                  type="number"
                  label="Límite de Uso"
                  value={formData.limite_uso}
                  onChange={handleChange}
                  placeholder="Ilimitado"
                  disabled={loading}
                />
              </div>

              {modo === 'editar' && (
                <div className={styles.toggleCard}>
                  <div className={styles.toggleInfo}>
                    <p className={styles.toggleLabel}>Oferta Activa</p>
                    <p className={styles.toggleDesc}>Define si el descuento es aplicable en el sitio</p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.toggle} ${formData.activo ? styles.toggleOn : ''}`}
                    onClick={() => setFormData(p => ({ ...p, activo: !p.activo }))}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className={styles.productosContainer}>
              {ofertaActual && (
                <OfertaProductos
                  oferta={ofertaActual}
                  onProductosChanged={handleProductosChanged}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="modalFooterPremium">
          {modo === 'editar' && onEliminar && (
            <button 
              type="button"
              className="btnPremium btnDangerPremium mr-auto" 
              onClick={onEliminar}
              title="Eliminar esta oferta permanentemente"
            >
              <span className="material-icons">delete</span>
              Eliminar
            </button>
          )}
          <button type="button" className="btnPremium btnSecondaryPremium" onClick={onCancelar}>
            Cancelar
          </button>
          {activeTab === 'general' && (
            <button 
              type="submit" 
              form="oferta-form" 
              disabled={loading} 
              className="btnPremium btnPrimaryPremium"
            >
              <span className="material-icons">{loading ? 'hourglass_empty' : 'save'}</span>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </PremiumModal>
    );
  }

  // Modo página completa (no modal)
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
                <option value="monto_fijo">Monto Fijo ($)</option>
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
                  : 'Ej: 150 = Se restan $ 150 del precio de venta'}
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
              <label htmlFor="precio_minimo" className={styles.label}>Precio Mínimo ($)</label>
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
              <label htmlFor="precio_maximo" className={styles.label}>Precio Máximo ($)</label>
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
});

OfertaForm.displayName = 'OfertaForm';

export default OfertaForm;
