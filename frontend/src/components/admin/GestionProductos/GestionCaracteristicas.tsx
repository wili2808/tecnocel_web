/**
 * GestionCaracteristicas — CRUD de tipos de características desde el panel admin
 * Tabla con panel de formulario lateral para crear/editar (por complejidad de campos).
 */
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { TipoCaracteristica } from '../../../types/product';
import styles from './GestionCaracteristicas.module.css';

type SortKey = 'nombre' | 'tipo' | 'estado';
type SortDir = 'asc' | 'desc';

interface TipoForm {
  nombre_tipo: string;
  descripcion: string;
  tipo_dato: TipoCaracteristica['tipo_dato'];
  unidad_medida: string;
  opciones_seleccion: string[];
}

const INITIAL_TIPO_FORM: TipoForm = {
  nombre_tipo: '',
  descripcion: '',
  tipo_dato: 'texto',
  unidad_medida: '',
  opciones_seleccion: [],
};

const TIPO_DATO_LABELS: Record<TipoCaracteristica['tipo_dato'], string> = {
  texto: 'Texto',
  numero: 'Número',
  booleano: 'Booleano (Sí/No)',
  seleccion: 'Selección',
};

/** Normaliza opciones_seleccion: puede llegar como JSON string o como array desde el backend */
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

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as { response?: { data?: { error?: string; message?: string; mensaje?: string } }; message?: string };
  return err.response?.data?.error || err.response?.data?.message || err.response?.data?.mensaje || err.message || fallback;
};

const GestionCaracteristicas: React.FC = memo(() => {
  const { showNotification } = useNotification();
  const { isAdmin } = useAuth();

  const [tipos, setTipos] = useState<TipoCaracteristica[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tipoForm, setTipoForm] = useState<TipoForm>(INITIAL_TIPO_FORM);
  const [nuevaOpcion, setNuevaOpcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const cargarTipos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductService.obtenerTiposCaracteristicas();
      setTipos(data);
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Error al cargar tipos de características'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    cargarTipos();
  }, [cargarTipos]);

  const abrirFormCrear = useCallback(() => {
    setEditandoId(null);
    setTipoForm(INITIAL_TIPO_FORM);
    setNuevaOpcion('');
    setShowForm(true);
    setEliminandoId(null);
  }, []);

  const abrirFormEditar = useCallback((tipo: TipoCaracteristica) => {
    setEditandoId(tipo.id_tipo);
    setTipoForm({
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion || '',
      tipo_dato: tipo.tipo_dato,
      unidad_medida: tipo.unidad_medida || '',
      opciones_seleccion: parseOpciones(tipo.opciones_seleccion),
    });
    setNuevaOpcion('');
    setShowForm(true);
    setEliminandoId(null);
  }, []);

  const cancelarForm = useCallback(() => {
    setShowForm(false);
    setEditandoId(null);
    setTipoForm(INITIAL_TIPO_FORM);
    setNuevaOpcion('');
  }, []);

  const agregarOpcion = () => {
    const opcion = nuevaOpcion.trim();
    if (!opcion) return;
    if (tipoForm.opciones_seleccion.includes(opcion)) {
      showNotification('Esa opción ya fue agregada', 'error');
      return;
    }
    setTipoForm((f) => ({ ...f, opciones_seleccion: [...f.opciones_seleccion, opcion] }));
    setNuevaOpcion('');
  };

  const quitarOpcion = (opcion: string) => {
    setTipoForm((f) => ({ ...f, opciones_seleccion: f.opciones_seleccion.filter((o) => o !== opcion) }));
  };

  const guardarForm = async () => {
    if (!tipoForm.nombre_tipo.trim()) {
      showNotification('El nombre del tipo es obligatorio', 'error');
      return;
    }
    if (tipoForm.tipo_dato === 'seleccion' && tipoForm.opciones_seleccion.length === 0) {
      showNotification('Debe agregar al menos una opción para el tipo "Selección"', 'error');
      return;
    }

    const payload: Partial<TipoCaracteristica> = {
      nombre_tipo: tipoForm.nombre_tipo.trim(),
      descripcion: tipoForm.descripcion.trim() || undefined,
      tipo_dato: tipoForm.tipo_dato,
      unidad_medida: tipoForm.tipo_dato === 'numero' ? tipoForm.unidad_medida.trim() || undefined : undefined,
      opciones_seleccion: tipoForm.tipo_dato === 'seleccion' ? tipoForm.opciones_seleccion : undefined,
    };

    setSaving(true);
    try {
      if (editandoId !== null) {
        await adminProductService.actualizarTipoCaracteristica(editandoId, payload);
        showNotification('Tipo de característica actualizado exitosamente', 'success');
      } else {
        await adminProductService.crearTipoCaracteristica({
          nombre_tipo: payload.nombre_tipo!,
          descripcion: payload.descripcion ?? undefined,
          tipo_dato: payload.tipo_dato!,
          unidad_medida: payload.unidad_medida ?? undefined,
          opciones_seleccion: payload.opciones_seleccion ?? undefined,
        });
        showNotification('Tipo de característica creado exitosamente', 'success');
      }
      cancelarForm();
      await cargarTipos();
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Error al guardar'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const iniciarEliminacion = useCallback((id: number) => {
    setEliminandoId(id);
    setShowForm(false);
    setEditandoId(null);
  }, []);

  const cancelarEliminacion = useCallback(() => {
    setEliminandoId(null);
  }, []);

  const confirmarEliminacion = async (id: number) => {
    setSaving(true);
    try {
      await adminProductService.eliminarTipoCaracteristica(id);
      showNotification('Tipo de característica desactivado exitosamente', 'success');
      setEliminandoId(null);
      await cargarTipos();
    } catch (err: unknown) {
      showNotification(getErrorMessage(err, 'Error al eliminar'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const sortedTipos = useMemo(() => {
    const sorted = [...tipos];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'nombre':
          valA = a.nombre_tipo.toLowerCase();
          valB = b.nombre_tipo.toLowerCase();
          break;
        case 'tipo':
          valA = a.tipo_dato.toLowerCase();
          valB = b.tipo_dato.toLowerCase();
          break;
        case 'estado':
          valA = a.activo ? 1 : 0;
          valB = b.activo ? 1 : 0;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [tipos, sortKey, sortDir]);

  const renderUnidadOpciones = (tipo: TipoCaracteristica) => {
    if (tipo.tipo_dato === 'numero' && tipo.unidad_medida) {
      return <span className={styles.unidadBadge}>{tipo.unidad_medida}</span>;
    }
    if (tipo.tipo_dato === 'seleccion') {
      const opciones = parseOpciones(tipo.opciones_seleccion);
      if (!opciones.length) return <span className={styles.emptyValue}>—</span>;
      return (
        <div className={styles.opcionesList}>
          {opciones.slice(0, 3).map((op) => (
            <span key={op} className={styles.opcionChip}>{op}</span>
          ))}
          {opciones.length > 3 && (
            <span className={styles.opcionChipMore}>+{opciones.length - 3}</span>
          )}
        </div>
      );
    }
    return <span className={styles.emptyValue}>—</span>;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            <span className="material-icons">tune</span>
            Tipos de Características
          </h3>
          <p className={styles.panelSubtitle}>Administra los tipos de atributos dinámicos de productos</p>
        </div>
        {isAdmin && (
          <button className={styles.addButton} onClick={abrirFormCrear} disabled={showForm && editandoId === null}>
            <span className="material-icons">add</span>
            Nuevo Tipo
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando tipos de características...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortableHeader} onClick={() => handleSort('nombre')}>
                    <span className={styles.sortableHeaderContent}>
                      Nombre
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'nombre' ? styles.sortIconActive : ''}`}>{getSortIcon('nombre')}</span>
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('tipo')}>
                    <span className={styles.sortableHeaderContent}>
                      Tipo de dato
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'tipo' ? styles.sortIconActive : ''}`}>{getSortIcon('tipo')}</span>
                    </span>
                  </th>
                  <th className={styles.th}>Unidad / Opciones</th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('estado')}>
                    <span className={styles.sortableHeaderContent}>
                      Estado
                      <span className={`material-icons ${styles.sortIcon} ${sortKey === 'estado' ? styles.sortIconActive : ''}`}>{getSortIcon('estado')}</span>
                    </span>
                  </th>
                  <th className={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedTipos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyMessage}>
                      No hay tipos de características registrados
                    </td>
                  </tr>
                ) : (
                  sortedTipos.map((tipo) => {
                    if (eliminandoId === tipo.id_tipo) {
                      return (
                        <tr key={tipo.id_tipo} className={styles.confirmRow}>
                          <td colSpan={4} className={styles.td}>
                            <span className={styles.confirmText}>
                              ¿Desactivar <strong>«{tipo.nombre_tipo}»</strong>? Se marcará como inactivo.
                            </span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.rowActions}>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => confirmarEliminacion(tipo.id_tipo)}
                                disabled={saving}
                                title="Confirmar"
                              >
                                <span className="material-icons">delete</span>
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnNeutral}`}
                                onClick={cancelarEliminacion}
                                disabled={saving}
                                title="Cancelar"
                              >
                                <span className="material-icons">close</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={tipo.id_tipo} className={editandoId === tipo.id_tipo ? styles.editRow : undefined}>
                        <td className={styles.td}>
                          <span className={styles.tipoNombre}>{tipo.nombre_tipo}</span>
                          {tipo.descripcion && <span className={styles.tipoDescripcion}>{tipo.descripcion}</span>}
                        </td>
                        <td className={styles.td}>
                          <span className={styles.tipoDatoBadge}>{TIPO_DATO_LABELS[tipo.tipo_dato]}</span>
                        </td>
                        <td className={styles.td}>{renderUnidadOpciones(tipo)}</td>
                        <td className={styles.td}>
                          <span className={tipo.activo ? styles.badgeActivo : styles.badgeInactivo}>
                            {tipo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.rowActions}>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                              onClick={() => abrirFormEditar(tipo)}
                              title="Editar"
                            >
                              <span className="material-icons">edit</span>
                            </button>
                            {isAdmin && tipo.activo && (
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() => iniciarEliminacion(tipo.id_tipo)}
                                title="Desactivar"
                              >
                                <span className="material-icons">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Panel de formulario */}
          {showForm && (
            <div className={styles.formPanel}>
              <h4 className={styles.formTitle}>
                {editandoId !== null ? 'Editar tipo de característica' : 'Nuevo tipo de característica'}
              </h4>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre *</label>
                  <input
                    className={styles.input}
                    value={tipoForm.nombre_tipo}
                    onChange={(e) => setTipoForm((f) => ({ ...f, nombre_tipo: e.target.value }))}
                    placeholder="Ej: RAM, Procesador, Color..."
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de dato *</label>
                  <select
                    className={styles.select}
                    value={tipoForm.tipo_dato}
                    onChange={(e) =>
                      setTipoForm((f) => ({
                        ...f,
                        tipo_dato: e.target.value as TipoCaracteristica['tipo_dato'],
                        opciones_seleccion: [],
                        unidad_medida: '',
                      }))
                    }
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

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Descripción</label>
                  <input
                    className={styles.input}
                    value={tipoForm.descripcion}
                    onChange={(e) => setTipoForm((f) => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Descripción opcional"
                  />
                </div>

                {tipoForm.tipo_dato === 'numero' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Unidad de medida</label>
                    <input
                      className={styles.input}
                      value={tipoForm.unidad_medida}
                      onChange={(e) => setTipoForm((f) => ({ ...f, unidad_medida: e.target.value }))}
                      placeholder="Ej: GB, GHz, pulgadas..."
                    />
                  </div>
                )}

                {tipoForm.tipo_dato === 'seleccion' && (
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.label}>Opciones de selección *</label>
                    <div className={styles.opcionesInput}>
                      <input
                        className={styles.input}
                        value={nuevaOpcion}
                        onChange={(e) => setNuevaOpcion(e.target.value)}
                        placeholder="Agregar opción..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarOpcion();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className={styles.addOpcionBtn}
                        onClick={agregarOpcion}
                        disabled={!nuevaOpcion.trim()}
                      >
                        <span className="material-icons">add</span>
                      </button>
                    </div>
                    {tipoForm.opciones_seleccion.length > 0 && (
                      <div className={styles.opcionesChips}>
                        {tipoForm.opciones_seleccion.map((op) => (
                          <span key={op} className={styles.opcionChipEditable}>
                            {op}
                            <button type="button" onClick={() => quitarOpcion(op)} className={styles.removeOpcionBtn}>
                              <span className="material-icons">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button className={styles.saveButton} onClick={guardarForm} disabled={saving}>
                  {saving ? 'Guardando...' : editandoId !== null ? 'Guardar cambios' : 'Crear tipo'}
                </button>
                <button className={styles.cancelButton} onClick={cancelarForm} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default GestionCaracteristicas;




