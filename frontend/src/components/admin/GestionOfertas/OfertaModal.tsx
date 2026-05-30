import React, { useState, useEffect, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import OfertaModalProductos from './OfertaModalProductos';
import type { OfertaFormData, OfertaConProductos } from '../../../types';
import styles from './OfertaModals.module.css';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { useFormDirty } from '../../../hooks/useFormDirty';

interface OfertaModalProps {
  modo: 'crear' | 'editar';
  oferta?: OfertaConProductos | null;
  onGuardado: () => void;
  onCancelar: () => void;
  onEliminar?: () => void;
  /** Recarga la lista principal sin cerrar el modal (para actualizar contadores) */
  onRefreshLista?: () => void;
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

const OfertaModal: React.FC<OfertaModalProps> = memo(({ modo, oferta, onGuardado, onCancelar, onEliminar, onRefreshLista }) => {
  const { showNotification } = useNotification();
  const { tipoCambio } = useTipoCambio();
  const [formData, setFormData] = useState<OfertaFormState>(INITIAL_FORM);
  const [ofertaActual, setOfertaActual] = useState<OfertaConProductos | null>(oferta || null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { setInitialValues, isDirty } = useFormDirty<OfertaFormState>();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Cargar datos de la oferta en modo edición
  useEffect(() => {
    if (modo === 'editar' && oferta) {
      const vals = {
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
      };
      setFormData(vals);
      setInitialValues(vals);
      setOfertaActual(oferta);
    }
  }, [modo, oferta, tipoCambio]);

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

  const handleProductosChanged = async () => {
    if (oferta) {
      try {
        const ofertaActualizada = await adminOfertaService.obtenerOferta(oferta.id_oferta);
        setOfertaActual(ofertaActualizada);
      } catch {
        /* no crítico */
      }
    }
    // Recarga la tabla de GestionOfertas para actualizar productos_count
    // sin cerrar el modal (onGuardado lo cerraría)
    onRefreshLista?.();
  };

  const handleEliminarClick = () => {
    setShowConfirmDelete(true);
  };

  const handleEliminarConfirm = async () => {
    if (!onEliminar) return;
    setIsDeleting(true);
    try {
      await onEliminar();
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
          <form id="oferta-form" onSubmit={handleSubmit} className={styles.modalBodyContent}>
            
            <h4 className={styles.sectionTitle}>Información de la Oferta</h4>
            <div className="modalFormGridPremium" style={{ gridTemplateColumns: '1fr' }}>
              <Input
                id="nombre_oferta"
                name="nombre_oferta"
                label="Nombre de la Oferta"
                value={formData.nombre_oferta}
                onChange={handleChange}
                placeholder="Ej: Ofertas de Verano"
                required
                disabled={loading || isDeleting}
              />
              <TextArea
                id="descripcion"
                name="descripcion"
                label="Descripción Corta"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Breve descripción para control interno..."
                rows={2}
                disabled={loading || isDeleting}
                className="mt-4"
              />
            </div>

            <h4 className={`${styles.sectionTitle} mt-12`}>Configuración y Vigencia</h4>
            <div className="modalFormGridPremium">
              <Select
                id="tipo_descuento"
                name="tipo_descuento"
                label="Tipo de Descuento"
                value={formData.tipo_descuento}
                onChange={handleChange}
                disabled={loading || isDeleting}
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
                disabled={loading || isDeleting}
                icon={formData.tipo_descuento === 'porcentaje' ? 'percent' : 'payments'}
              />
            </div>

            <div className="modalFormGridPremium">
              <Input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                label="Inicia el..."
                value={formData.fecha_inicio}
                onChange={handleChange}
                required
                disabled={loading || isDeleting}
              />
              <Input
                id="fecha_fin"
                name="fecha_fin"
                type="date"
                label="Termina el..."
                value={formData.fecha_fin}
                onChange={handleChange}
                required
                disabled={loading || isDeleting}
                min={formData.fecha_inicio}
              />
            </div>

            <h4 className={`${styles.sectionTitle} mt-12`}>Restricciones y Límites</h4>
            <div className="modalFormGridPremium">
              <Input
                id="precio_minimo"
                name="precio_minimo"
                type="number"
                label="Precio Mínimo ($)"
                value={formData.precio_minimo}
                onChange={handleChange}
                placeholder="Sin mínimo"
                disabled={loading || isDeleting}
              />
              <Input
                id="precio_maximo"
                name="precio_maximo"
                type="number"
                label="Precio Máximo ($)"
                value={formData.precio_maximo}
                onChange={handleChange}
                placeholder="Sin máximo"
                disabled={loading || isDeleting}
              />
              <Input
                id="limite_uso"
                name="limite_uso"
                type="number"
                label="Límite de Uso"
                value={formData.limite_uso}
                onChange={handleChange}
                placeholder="Ilimitado"
                disabled={loading || isDeleting}
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
                  disabled={loading || isDeleting}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className={styles.modalBodyContent}>
            {ofertaActual && (
              <OfertaModalProductos
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
            onClick={handleEliminarClick}
            disabled={loading || isDeleting}
            title="Eliminar esta oferta permanentemente"
          >
            <span className="material-icons">{isDeleting ? 'hourglass_empty' : 'delete'}</span>
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        )}
        {activeTab === 'general' && (
          <button 
            type="submit" 
            form="oferta-form" 
            disabled={loading || isDeleting || !isDirty(formData)} 
            className="btnPremium btnPrimaryPremium"
          >
            <span className="material-icons">{loading ? 'hourglass_empty' : 'save'}</span>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </div>
    </PremiumModal>
      {/* Sub-modal Confirmar Eliminación */}
      <PremiumModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="¿Desactivar oferta?"
        icon="warning"
        maxWidth="400px"
        titleStyle={{ color: 'var(--color-error)' }}
      >
        <div className="modalBodyPremium">
          <p className={styles.deleteConfirmText}>
            Estás a punto de desactivar la oferta <strong>{formData.nombre_oferta}</strong>. 
            Esta acción impedirá que se apliquen los descuentos asociados.
          </p>
        </div>
        <div className="modalFooterPremium">
          <button 
            type="button"
            className="btnPremium btnDangerPremium" 
            onClick={handleEliminarConfirm} 
            disabled={isDeleting}
          >
            <span className="material-icons">{isDeleting ? 'sync' : 'delete_forever'}</span>
            {isDeleting ? 'Desactivando...' : 'Sí, desactivar oferta'}
          </button>
        </div>
      </PremiumModal>
    </>
  );
});

OfertaModal.displayName = 'OfertaModal';

export default OfertaModal;
