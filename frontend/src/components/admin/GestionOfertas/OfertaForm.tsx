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
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import TextArea from '../../common/TextArea/TextArea';

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

const OfertaForm = ({ modo, oferta, onGuardado, onCancelar, onEliminar, isModal = false }: OfertaFormProps) => {
  const { showNotification } = useNotification();
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

  // Renderizado optimizado para Modal (Estilo Premium)
  if (isModal) {
    return (
      <div className="modalOverlayPremium" onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}>
        <div className="modalPremium" style={{ maxWidth: activeTab === 'productos' ? '950px' : '750px' }} onClick={(e) => e.stopPropagation()}>
          
          {/* Header del Modal */}
          <div className="modalHeaderPremium">
            <h2 className="modalTitlePremium">
              <span className="material-icons">
                {modo === 'crear' ? 'add_circle' : 'local_offer'}
              </span>
              {modo === 'crear' ? 'Nueva Oferta' : `Editar Oferta: ${formData.nombre_oferta}`}
            </h2>
            <button className="closeButtonPremium" onClick={onCancelar} title="Cerrar">
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Navegación por Tabs (Solo en edición) */}
          {modo === 'editar' && (
            <div className={styles.tabsPremium} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--background-secondary)' }}>
              <button 
                type="button"
                className={`${styles.tabBtnPremium} ${activeTab === 'general' ? styles.tabActivePremium : ''}`}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: activeTab === 'general' ? 'var(--color-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'general' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => setActiveTab('general')}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>settings</span>
                Configuración General
              </button>
              <button 
                type="button"
                className={`${styles.tabBtnPremium} ${activeTab === 'productos' ? styles.tabActivePremium : ''}`}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: activeTab === 'productos' ? 'var(--color-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'productos' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => setActiveTab('productos')}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>inventory_2</span>
                Productos Asignados ({ofertaActual?.productos?.length || 0})
              </button>
            </div>
          )}

          {/* Cuerpo del Modal */}
          <div className="modalBodyPremium" style={{ padding: activeTab === 'productos' ? '0' : '24px' }}>
            {activeTab === 'general' ? (
              <form id="oferta-form" onSubmit={handleSubmit}>
                
                <span className={styles.sectionTitlePremium}>Información de la Oferta</span>
                <div className={styles.formGridPremium} style={{ gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
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
                  />
                </div>

                <div className={styles.formDivider} style={{ margin: '24px 0' }} />

                <span className={styles.sectionTitlePremium}>Configuración y Vigencia</span>
                <div className={styles.formGridPremium} style={{ marginBottom: '24px' }}>
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

                <div className={styles.formDivider} style={{ margin: '24px 0' }} />

                <span className={styles.sectionTitlePremium}>Restricciones y Límites</span>
                <div className={styles.formGridPremium} style={{ marginBottom: '24px' }}>
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
                  <div style={{ marginTop: '24px', padding: '16px', background: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Oferta Activa</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Define si el descuento es aplicable en el sitio</p>
                      </div>
                      <button
                        type="button"
                        className={`${styles.toggle} ${formData.activo ? styles.toggleOn : styles.toggleOff}`}
                        style={{ 
                          width: '44px', 
                          height: '24px', 
                          borderRadius: '12px', 
                          border: 'none', 
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          background: formData.activo ? 'var(--color-success)' : 'var(--background-neutral)'
                        }}
                        onClick={() => setFormData(p => ({ ...p, activo: !p.activo }))}
                      >
                        <div style={{ 
                          width: '18px', 
                          height: '18px', 
                          borderRadius: '50%', 
                          background: 'white', 
                          position: 'absolute', 
                          top: '3px', 
                          left: formData.activo ? '23px' : '3px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div style={{ padding: '20px' }}>
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
                className="btnPremium btnDangerPremium" 
                onClick={onEliminar}
                title="Eliminar esta oferta permanentemente"
                style={{ marginRight: 'auto' }}
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
        </div>
      </div>
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
};

export default OfertaForm;
