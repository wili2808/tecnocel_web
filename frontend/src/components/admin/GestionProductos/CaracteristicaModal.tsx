import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { TipoCaracteristica } from '../../../types/product';
import styles from './GestionProductos.module.css';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';

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

const CaracteristicaModal: React.FC<CaracteristicaModalProps> = ({ tipo, isOpen, onClose, onGuardado }) => {
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

  if (!isOpen) return null;

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
      await adminProductService.eliminarTipoCaracteristica(tipo.id_tipo);
      showNotification('Tipo de característica desactivado exitosamente', 'success');
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al desactivar el tipo',
        'error'
      );
    } finally {
      setEliminando(false);
    }
  };

  const readonly = modoEdicion ? !puedeEditar : !puedeCrear;

  return (
    <div className={styles.modalOverlayPremium} onClick={onClose}>
      <div className={styles.modalPremium} style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderPremium}>
          <h3 className={styles.modalTitlePremium}>
            <span className="material-icons">{modoEdicion ? 'edit' : 'add_circle'}</span>
            {modoEdicion ? 'Editar Tipo de Característica' : 'Nuevo Tipo'}
          </h3>
          <button className={styles.closeButtonPremium} onClick={onClose} disabled={guardando || eliminando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {showConfirmDelete ? (
          <div className={styles.modalBodyPremium}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span className="material-icons" style={{ fontSize: 48, color: 'var(--color-error)', marginBottom: 16 }}>
                warning
              </span>
              <h4 style={{ margin: '0 0 8px', fontSize: 18 }}>¿Desactivar tipo de característica?</h4>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Estás a punto de desactivar <strong>{tipo?.nombre_tipo}</strong>. 
              </p>
            </div>
            <div className={styles.modalFooterPremium}>
              <button 
                type="button"
                className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} 
                onClick={() => setShowConfirmDelete(false)} 
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className={`${styles.btnPremium} ${styles.btnDangerSolidPremium}`} 
                onClick={handleEliminar} 
                disabled={eliminando}
              >
                {eliminando ? 'Desactivando...' : 'Sí, desactivar tipo'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBodyPremium}>
              <div className={styles.formGrid}>
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

              <Input
                id="descripcion"
                name="descripcion"
                label="Descripción"
                value={form.descripcion}
                onChange={handleInputChange}
                placeholder="Descripción opcional"
                disabled={guardando || readonly}
                style={{ marginTop: 16 }}
              />

              {form.tipo_dato === 'numero' && (
                <Input
                  id="unidad_medida"
                  name="unidad_medida"
                  label="Unidad de medida"
                  value={form.unidad_medida}
                  onChange={handleInputChange}
                  placeholder="Ej: GB, GHz, pulgadas..."
                  disabled={guardando || readonly}
                  style={{ marginTop: 16 }}
                />
              )}

              {form.tipo_dato === 'seleccion' && (
                <div className={styles.formGroupPremium} style={{ marginTop: 16 }}>
                  <label className={styles.formLabelPremium}>
                    Opciones de selección <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      className={styles.formInputPremium}
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
                        onClick={agregarOpcion}
                        disabled={!nuevaOpcion.trim() || guardando}
                        style={{
                          background: 'var(--color-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          width: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <span className="material-icons">add</span>
                      </button>
                    )}
                  </div>
                  {form.opciones_seleccion.length > 0 && (
                    <div className={styles.opcionesList}>
                      {form.opciones_seleccion.map((op) => (
                        <div key={op} className={styles.opcionTag}>
                          {op}
                          {!readonly && (
                            <button 
                              type="button" 
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

            <div className={styles.modalFooterPremium}>
              {modoEdicion && puedeEliminar && tipo?.activo && (
                <button 
                  type="button" 
                  className={`${styles.btnPremium} ${styles.btnDangerPremium}`} 
                  style={{ marginRight: 'auto' }}
                  onClick={() => setShowConfirmDelete(true)} 
                  disabled={guardando}
                >
                  <span className="material-icons" style={{ fontSize: 18 }}>delete</span>
                  Desactivar
                </button>
              )}
              
              <button type="button" className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={onClose} disabled={guardando}>
                Cancelar
              </button>
              {!readonly && (
                <button type="submit" className={`${styles.btnPremium} ${styles.btnPrimaryPremium}`} disabled={guardando}>
                  <span className="material-icons" style={{ fontSize: 18 }}>
                    {guardando ? 'hourglass_empty' : 'save'}
                  </span>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CaracteristicaModal;
