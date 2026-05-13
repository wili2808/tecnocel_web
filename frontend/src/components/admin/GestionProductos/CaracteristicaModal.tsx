import React, { useState, useEffect, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { TipoCaracteristica } from '../../../types/product';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './ProductoModals.module.css';

interface CaracteristicaModalProps {
  tipo?: TipoCaracteristica | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

const INITIAL_FORM = {
  nombre_tipo: '',
  descripcion: '',
  tipo_dato: 'texto' as TipoCaracteristica['tipo_dato'],
  unidad_medida: '',
  opciones_seleccion: [] as string[],
};

const TIPO_DATO_LABELS: Record<TipoCaracteristica['tipo_dato'], string> = {
  texto: 'Texto',
  numero: 'Número',
  booleano: 'Booleano (Sí/No)',
  seleccion: 'Selección',
};

const parseOpciones = (opciones: unknown): string[] => {
  if (!opciones) return [];
  if (Array.isArray(opciones)) return opciones.filter((item): item is string => typeof item === 'string');
  if (typeof opciones !== 'string') return [];

  try {
    const parsed = JSON.parse(opciones);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const CaracteristicaModal: React.FC<CaracteristicaModalProps> = memo(({ tipo, isOpen, onClose, onGuardado }) => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  
  const puedeEditar = tienePermiso('editar_caracteristica');
  const puedeEliminar = tienePermiso('eliminar_caracteristica');
  const puedeCrear = tienePermiso('crear_caracteristica');

  const modoEdicion = !!tipo;
  
  const [form, setForm] = useState(INITIAL_FORM);
  const [nuevaOpcion, setNuevaOpcion] = useState('');
  
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (tipo) {
        setForm({
          nombre_tipo: tipo.nombre_tipo,
          descripcion: tipo.descripcion || '',
          tipo_dato: tipo.tipo_dato,
          unidad_medida: tipo.unidad_medida || '',
          opciones_seleccion: parseOpciones(tipo.opciones_seleccion),
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setNuevaOpcion('');
      setShowConfirmDelete(false);
    }
  }, [isOpen, tipo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'tipo_dato') {
      setForm((f) => ({
        ...f,
        tipo_dato: value as TipoCaracteristica['tipo_dato'],
        opciones_seleccion: [],
        unidad_medida: '',
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const agregarOpcion = () => {
    const opcion = nuevaOpcion.trim();
    if (!opcion) return;
    if (form.opciones_seleccion.includes(opcion)) {
      showNotification('Esa opción ya fue agregada', 'error');
      return;
    }
    setForm((f) => ({ ...f, opciones_seleccion: [...f.opciones_seleccion, opcion] }));
    setNuevaOpcion('');
  };

  const quitarOpcion = (opcion: string) => {
    setForm((f) => ({ ...f, opciones_seleccion: f.opciones_seleccion.filter((o) => o !== opcion) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    if (!form.nombre_tipo.trim()) {
      showNotification('El nombre del tipo es obligatorio', 'error');
      return;
    }
    if (form.tipo_dato === 'seleccion' && form.opciones_seleccion.length === 0) {
      showNotification('Debe agregar al menos una opción para el tipo "Selección"', 'error');
      return;
    }

    const payload: Partial<TipoCaracteristica> = {
      nombre_tipo: form.nombre_tipo.trim(),
      descripcion: form.descripcion.trim() || undefined,
      tipo_dato: form.tipo_dato,
      unidad_medida: form.tipo_dato === 'numero' ? form.unidad_medida.trim() || undefined : undefined,
      opciones_seleccion: form.tipo_dato === 'seleccion' ? (form.opciones_seleccion as any) : undefined,
    };

    setGuardando(true);
    try {
      if (modoEdicion) {
        await adminProductService.actualizarTipoCaracteristica(tipo!.id_tipo, payload);
        showNotification('Tipo de característica actualizado exitosamente', 'success');
      } else {
        await adminProductService.crearTipoCaracteristica({
          nombre_tipo: payload.nombre_tipo!,
          descripcion: payload.descripcion ?? undefined,
          tipo_dato: payload.tipo_dato!,
          unidad_medida: payload.unidad_medida ?? undefined,
          opciones_seleccion: payload.opciones_seleccion as any ?? undefined,
        });
        showNotification('Tipo de característica creado exitosamente', 'success');
      }
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al guardar el tipo de característica',
        'error'
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!tipo) return;
    setEliminando(true);
    try {
      if (tipo.activo) {
        await adminProductService.eliminarTipoCaracteristica(tipo.id_tipo);
        showNotification('Tipo de característica desactivado exitosamente', 'success');
      } else {
        await adminProductService.actualizarTipoCaracteristica(tipo.id_tipo, { activo: true });
        showNotification('Tipo de característica reactivado exitosamente', 'success');
      }
      setShowConfirmDelete(false);
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al procesar la solicitud',
        'error'
      );
    } finally {
      setEliminando(false);
    }
  };

  const readonly = modoEdicion ? !puedeEditar : !puedeCrear;

  return (
    <>
      <PremiumModal
        isOpen={isOpen}
        onClose={onClose}
        title={modoEdicion ? 'Editar Tipo de Característica' : 'Nuevo Tipo'}
        icon={modoEdicion ? 'edit' : 'add_circle'}
        maxWidth="550px"
      >
        <form id="caracteristica-form" onSubmit={handleSubmit}>
          <div className="modalBodyPremium">
            <div className="modalFormGridPremium">
              <Input
                id="nombre_tipo"
                name="nombre_tipo"
                label="Nombre"
                value={form.nombre_tipo}
                onChange={handleInputChange}
                placeholder="Ej: RAM, Procesador..."
                disabled={guardando || readonly}
                required
                autoFocus
              />

              <Select
                id="tipo_dato"
                name="tipo_dato"
                label="Tipo de dato"
                value={form.tipo_dato}
                onChange={handleInputChange}
                disabled={guardando || readonly}
                required
                options={(Object.entries(TIPO_DATO_LABELS) as [TipoCaracteristica['tipo_dato'], string][]).map(
                  ([val, label]) => ({ value: val, label: label })
                )}
              />
            </div>

            <div className="modalFormGroupFullPremium">
              <TextArea
                id="descripcion"
                name="descripcion"
                label="Descripción"
                value={form.descripcion}
                onChange={handleInputChange}
                placeholder="Descripción opcional"
                disabled={guardando || readonly}
                rows={2}
              />
            </div>

            {form.tipo_dato === 'numero' && (
              <div className="modalFormGroupFullPremium">
                <Input
                  id="unidad_medida"
                  name="unidad_medida"
                  label="Unidad de medida"
                  value={form.unidad_medida}
                  onChange={handleInputChange}
                  placeholder="Ej: GB, GHz, pulgadas..."
                  disabled={guardando || readonly}
                />
              </div>
            )}

            {form.tipo_dato === 'seleccion' && (
              <div className={`modalFormGroupFullPremium ${styles.selectionGroup}`}>
                <label className="modalFormLabelPremium">
                  Opciones de selección <span className="text-error">*</span>
                </label>
                <div className={styles.selectionInputContainer}>
                  <Input
                    label=""
                    id="nuevaOpcion"
                    name="nuevaOpcion"
                    value={nuevaOpcion}
                    onChange={(e) => setNuevaOpcion(e.target.value)}
                    placeholder="Agregar opción..."
                    disabled={guardando || readonly}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!readonly) agregarOpcion();
                      }
                    }}
                  />
                  {!readonly && (
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={agregarOpcion}
                      disabled={!nuevaOpcion.trim() || guardando}
                    >
                      <span className="material-icons">add</span>
                    </button>
                  )}
                </div>
                {form.opciones_seleccion.length > 0 && (
                  <div className={styles.tagsContainer}>
                    {form.opciones_seleccion.map((op) => (
                      <div key={op} className={styles.tag}>
                        {op}
                        {!readonly && (
                          <button 
                            type="button" 
                            className={styles.removeTagBtn}
                            onClick={() => quitarOpcion(op)} 
                          >
                            <span className="material-icons" style={{ fontSize: 14 }}>close</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modalFooterPremium">
            {modoEdicion && puedeEliminar && (
              <button 
                type="button" 
                className={`btnPremium ${tipo?.activo ? 'btnDangerPremium' : 'btnSuccessPremium'} mr-auto`} 
                onClick={() => setShowConfirmDelete(true)} 
                disabled={guardando}
              >
                <span className="material-icons">{tipo?.activo ? 'visibility_off' : 'visibility'}</span>
                {tipo?.activo ? 'Desactivar' : 'Reactivar'}
              </button>
            )}
            
            {!readonly && (
              <button type="submit" form="caracteristica-form" className="btnPremium btnPrimaryPremium" disabled={guardando}>
                <span className="material-icons">
                  {guardando ? 'hourglass_empty' : 'save'}
                </span>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </form>
      </PremiumModal>

      {/* Sub-modal Confirmar Acción de Estado */}
      <PremiumModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title={tipo?.activo ? '¿Desactivar tipo de característica?' : '¿Reactivar tipo de característica?'}
        icon={tipo?.activo ? 'warning' : 'info'}
        maxWidth="400px"
        titleStyle={{ color: tipo?.activo ? 'var(--color-error)' : 'var(--color-success)' }}
      >
        <div className="modalBodyPremium">
          <p className={styles.deleteConfirmText}>
            {tipo?.activo 
              ? `Estás a punto de desactivar ${tipo?.nombre_tipo}.`
              : `Estás a punto de reactivar ${tipo?.nombre_tipo}.`
            }
          </p>
        </div>
        <div className="modalFooterPremium">
          <button 
            type="button"
            className={`btnPremium ${tipo?.activo ? 'btnDangerPremium' : 'btnSuccessPremium'}`} 
            onClick={handleEliminar} 
            disabled={eliminando}
          >
            <span className="material-icons">{eliminando ? 'sync' : (tipo?.activo ? 'delete_forever' : 'check_circle')}</span>
            {eliminando ? 'Procesando...' : (tipo?.activo ? 'Sí, desactivar tipo' : 'Sí, reactivar tipo')}
          </button>
        </div>
      </PremiumModal>
    </>
  );
});

CaracteristicaModal.displayName = 'CaracteristicaModal';

export default CaracteristicaModal;
