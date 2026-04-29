import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { TipoCaracteristica } from '../../../types/product';
import styles from './GestionProductos.module.css';

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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <span className="material-icons">{modoEdicion ? 'edit' : 'add_circle'}</span>
            {modoEdicion ? 'Editar Tipo de Característica' : 'Nuevo Tipo'}
          </h3>
          <button className={styles.closeButton} onClick={onClose} disabled={guardando || eliminando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {showConfirmDelete ? (
          <div className={styles.modalBody}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span className="material-icons" style={{ fontSize: 48, color: 'var(--color-error)', marginBottom: 16 }}>
                warning
              </span>
              <h4 style={{ margin: '0 0 8px', fontSize: 18 }}>¿Desactivar tipo de característica?</h4>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Estás a punto de desactivar <strong>{tipo?.nombre_tipo}</strong>. 
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton} 
                onClick={() => setShowConfirmDelete(false)} 
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton} 
                style={{ backgroundColor: 'var(--color-error)' }} 
                onClick={handleEliminar} 
                disabled={eliminando}
              >
                {eliminando ? 'Desactivando...' : 'Sí, desactivar tipo'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Nombre <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    className={styles.formInput}
                    value={form.nombre_tipo}
                    onChange={(e) => setForm({ ...form, nombre_tipo: e.target.value })}
                    placeholder="Ej: RAM, Procesador, Color..."
                    disabled={guardando || readonly}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Tipo de dato <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <select
                    className={styles.formInput}
                    value={form.tipo_dato}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tipo_dato: e.target.value as TipoCaracteristica['tipo_dato'],
                        opciones_seleccion: [],
                        unidad_medida: '',
                      }))
                    }
                    disabled={guardando || readonly}
                  >
                    {(Object.entries(TIPO_DATO_LABELS) as [TipoCaracteristica['tipo_dato'], string][]).map(
                      ([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: 16 }}>
                <label className={styles.formLabel}>Descripción</label>
                <input
                  className={styles.formInput}
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción opcional"
                  disabled={guardando || readonly}
                />
              </div>

              {form.tipo_dato === 'numero' && (
                <div className={styles.formGroup} style={{ marginTop: 16 }}>
                  <label className={styles.formLabel}>Unidad de medida</label>
                  <input
                    className={styles.formInput}
                    value={form.unidad_medida}
                    onChange={(e) => setForm((f) => ({ ...f, unidad_medida: e.target.value }))}
                    placeholder="Ej: GB, GHz, pulgadas..."
                    disabled={guardando || readonly}
                  />
                </div>
              )}

              {form.tipo_dato === 'seleccion' && (
                <div className={styles.formGroup} style={{ marginTop: 16 }}>
                  <label className={styles.formLabel}>
                    Opciones de selección <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      className={styles.formInput}
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

            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: modoEdicion && puedeEliminar && tipo?.activo ? 'space-between' : 'flex-end' }}>
              {modoEdicion && puedeEliminar && tipo?.activo && (
                <button 
                  type="button" 
                  className={styles.cancelButton} 
                  style={{ color: 'var(--color-error)', border: '1px solid var(--color-error)', backgroundColor: 'transparent' }} 
                  onClick={() => setShowConfirmDelete(true)} 
                  disabled={guardando}
                >
                  <span className="material-icons" style={{ fontSize: 18, marginRight: 4, verticalAlign: 'text-bottom' }}>delete</span>
                  Desactivar
                </button>
              )}
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className={styles.cancelButton} onClick={onClose} disabled={guardando}>
                  Cancelar
                </button>
                {!readonly && (
                  <button type="submit" className={styles.saveButton} disabled={guardando}>
                    <span className="material-icons" style={{ fontSize: 18, marginRight: 6, verticalAlign: 'text-bottom' }}>
                      {guardando ? 'hourglass_empty' : 'save'}
                    </span>
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CaracteristicaModal;
