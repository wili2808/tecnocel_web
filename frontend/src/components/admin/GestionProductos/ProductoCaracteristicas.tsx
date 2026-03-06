/**
 * Componente ProductoCaracteristicas - Gestión de especificaciones técnicas en formulario de producto
 * Permite agregar, editar y eliminar características, y crear tipos nuevos inline
 */
import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminProductService from '../../../services/adminProductService';
import type { TipoCaracteristica, CaracteristicaLocal } from '../../../types/product';
import styles from './ProductoCaracteristicas.module.css';

interface ProductoCaracteristicasProps {
  modo: 'crear' | 'editar';
  idProducto?: number;
  caracteristicas: CaracteristicaLocal[];
  onCaracteristicasChange: (caracteristicas: CaracteristicaLocal[]) => void;
}

interface NuevoTipoForm {
  nombre_tipo: string;
  descripcion: string;
  tipo_dato: 'texto' | 'numero' | 'booleano' | 'seleccion';
  unidad_medida: string;
  opciones_seleccion: string[];
}

const normalizeOpcionesSeleccion = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    // Admite payload JSON serializado en BD/API: '["Android","iOS"]'
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        // Fallback: sigue abajo para tratarlo como string simple
      }
    }

    // Fallback tolerante: "Android, iOS"
    return trimmed
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeTipo = (tipo: TipoCaracteristica): TipoCaracteristica => ({
  ...tipo,
  opciones_seleccion: normalizeOpcionesSeleccion(tipo.opciones_seleccion),
});

const INITIAL_NUEVO_TIPO: NuevoTipoForm = {
  nombre_tipo: '',
  descripcion: '',
  tipo_dato: 'texto',
  unidad_medida: '',
  opciones_seleccion: [],
};

const ProductoCaracteristicas = ({
  modo,
  idProducto,
  caracteristicas,
  onCaracteristicasChange,
}: ProductoCaracteristicasProps) => {
  const { showNotification } = useNotification();
  const [tipos, setTipos] = useState<TipoCaracteristica[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para agregar característica
  const [selectedTipoId, setSelectedTipoId] = useState<number | ''>('');
  const [nuevoValor, setNuevoValor] = useState('');

  // Estado para edición inline
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Estado para crear tipo rápido
  const [showNuevoTipo, setShowNuevoTipo] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState<NuevoTipoForm>(INITIAL_NUEVO_TIPO);
  const [nuevaOpcion, setNuevaOpcion] = useState('');
  const [savingTipo, setSavingTipo] = useState(false);

  const cargarTipos = useCallback(async () => {
    try {
      const data = await adminProductService.obtenerTiposCaracteristicas();
      setTipos(data.map(normalizeTipo));
    } catch {
      showNotification('Error al cargar tipos de características', 'error');
    }
  }, [showNotification]);

  // Cargar tipos disponibles y características existentes
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const tiposData = await adminProductService.obtenerTiposCaracteristicas();
        const tiposNormalizados = tiposData.map(normalizeTipo);
        setTipos(tiposNormalizados);

        // En modo editar, cargar características existentes del producto
        if (modo === 'editar' && idProducto) {
          const caracData = await adminProductService.obtenerCaracteristicasProducto(idProducto);
          const caracLocales: CaracteristicaLocal[] = caracData
            .filter(c => c.tipo)
            .map(c => ({
              id_tipo: c.id_tipo,
              valor: c.valor,
              nombre_tipo: c.tipo!.nombre_tipo,
              tipo_dato: c.tipo!.tipo_dato,
              unidad_medida: c.tipo!.unidad_medida,
              opciones_seleccion: normalizeOpcionesSeleccion(c.tipo!.opciones_seleccion),
            }));
          onCaracteristicasChange(caracLocales);
        }
      } catch {
        showNotification('Error al cargar datos de características', 'error');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [modo, idProducto, onCaracteristicasChange, showNotification]);

  // Tipos disponibles (filtrar los ya asignados)
  const tiposDisponibles = tipos.filter(
    t => !caracteristicas.some(c => c.id_tipo === t.id_tipo)
  );

  const selectedTipo = tipos.find(t => t.id_tipo === selectedTipoId);

  // --- Agregar característica ---
  const handleAgregar = () => {
    if (!selectedTipoId || !selectedTipo) {
      showNotification('Selecciona un tipo de característica', 'error');
      return;
    }

    const valorTrimmed = nuevoValor.trim();
    if (!valorTrimmed) {
      showNotification('Ingresa un valor para la característica', 'error');
      return;
    }

    const nueva: CaracteristicaLocal = {
      id_tipo: selectedTipo.id_tipo,
      valor: valorTrimmed,
      nombre_tipo: selectedTipo.nombre_tipo,
      tipo_dato: selectedTipo.tipo_dato,
      unidad_medida: selectedTipo.unidad_medida,
      opciones_seleccion: selectedTipo.opciones_seleccion,
    };

    onCaracteristicasChange([...caracteristicas, nueva]);
    setSelectedTipoId('');
    setNuevoValor('');
  };

  // --- Eliminar característica ---
  const handleEliminar = (index: number) => {
    const updated = caracteristicas.filter((_, i) => i !== index);
    onCaracteristicasChange(updated);
  };

  // --- Edición inline ---
  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(caracteristicas[index].valor);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      showNotification('El valor no puede estar vacío', 'error');
      return;
    }

    const updated = [...caracteristicas];
    updated[index] = { ...updated[index], valor: trimmed };
    onCaracteristicasChange(updated);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  // --- Crear tipo rápido ---
  const handleCrearTipo = async () => {
    if (!nuevoTipo.nombre_tipo.trim()) {
      showNotification('El nombre del tipo es requerido', 'error');
      return;
    }

    if (nuevoTipo.tipo_dato === 'seleccion' && nuevoTipo.opciones_seleccion.length < 2) {
      showNotification('El tipo selección requiere al menos 2 opciones', 'error');
      return;
    }

    try {
      setSavingTipo(true);
      const created = await adminProductService.crearTipoCaracteristica({
        nombre_tipo: nuevoTipo.nombre_tipo.trim(),
        descripcion: nuevoTipo.descripcion.trim() || undefined,
        tipo_dato: nuevoTipo.tipo_dato,
        unidad_medida: nuevoTipo.tipo_dato === 'numero' ? nuevoTipo.unidad_medida.trim() || undefined : undefined,
        opciones_seleccion: nuevoTipo.tipo_dato === 'seleccion' ? nuevoTipo.opciones_seleccion : undefined,
      });

      showNotification(`Tipo "${created.nombre_tipo}" creado exitosamente`, 'success');
      await cargarTipos();
      setSelectedTipoId(created.id_tipo);
      setShowNuevoTipo(false);
      setNuevoTipo(INITIAL_NUEVO_TIPO);
      setNuevaOpcion('');
    } catch (err: unknown) {
      const errorWithResponse = err as { response?: { data?: { message?: string } }; message?: string };
      const mensaje = errorWithResponse.response?.data?.message || errorWithResponse.message || 'Error al crear tipo';
      showNotification(mensaje, 'error');
    } finally {
      setSavingTipo(false);
    }
  };

  const handleAddOpcion = () => {
    const opcion = nuevaOpcion.trim();
    if (!opcion) return;
    if (nuevoTipo.opciones_seleccion.includes(opcion)) {
      showNotification('Esta opción ya existe', 'error');
      return;
    }
    setNuevoTipo(prev => ({
      ...prev,
      opciones_seleccion: [...prev.opciones_seleccion, opcion],
    }));
    setNuevaOpcion('');
  };

  const handleRemoveOpcion = (index: number) => {
    setNuevoTipo(prev => ({
      ...prev,
      opciones_seleccion: prev.opciones_seleccion.filter((_, i) => i !== index),
    }));
  };

  // --- Renderizar valor formateado ---
  const renderValor = (carac: CaracteristicaLocal) => {
    if (carac.tipo_dato === 'booleano') {
      return carac.valor === 'true' ? 'Sí' : 'No';
    }
    if (carac.tipo_dato === 'numero' && carac.unidad_medida) {
      return (
        <>
          {carac.valor}
          <span className={styles.caracteristicaUnidad}>{carac.unidad_medida}</span>
        </>
      );
    }
    return carac.valor;
  };

  // --- Renderizar input según tipo de dato ---
  const renderValueInput = (
    tipoDato: string,
    value: string,
    onChange: (val: string) => void,
    opciones?: string[] | null,
    unidad?: string | null,
    className?: string,
  ) => {
    const inputClass = className || styles.addFormInput;

    switch (tipoDato) {
      case 'numero':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number"
              value={value}
              onChange={e => onChange(e.target.value)}
              className={inputClass}
              placeholder="Valor numérico"
              step="any"
            />
            {unidad && <span className={styles.caracteristicaUnidad}>{unidad}</span>}
          </div>
        );
      case 'booleano':
        return (
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className={className || styles.addFormSelect}
          >
            <option value="">Seleccionar...</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );
      case 'seleccion':
        return (
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className={className || styles.addFormSelect}
          >
            <option value="">Seleccionar...</option>
            {opciones?.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
            placeholder="Valor de la característica"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingSmall}>
        <p>Cargando características...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Lista de características actuales */}
      {caracteristicas.length > 0 && (
        <div className={styles.caracteristicasList}>
          {caracteristicas.map((carac, index) => (
            <div key={`${carac.id_tipo}-${index}`} className={styles.caracteristicaCard}>
              <div className={styles.caracteristicaInfo}>
                <span className={styles.caracteristicaNombre}>{carac.nombre_tipo}</span>
                {editingIndex === index ? (
                  renderValueInput(
                    carac.tipo_dato,
                    editValue,
                    setEditValue,
                    carac.opciones_seleccion,
                    carac.unidad_medida,
                    styles.editInput,
                  )
                ) : (
                  <span className={styles.caracteristicaValor}>{renderValor(carac)}</span>
                )}
                <span className={styles.tipoBadge}>{carac.tipo_dato}</span>
              </div>

              <div className={styles.cardActions}>
                {editingIndex === index ? (
                  <>
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Guardar"
                      onClick={() => handleSaveEdit(index)}
                    >
                      <span className="material-icons">check</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                      title="Cancelar"
                      onClick={handleCancelEdit}
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Editar valor"
                      onClick={() => handleStartEdit(index)}
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                      title="Eliminar"
                      onClick={() => handleEliminar(index)}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {caracteristicas.length === 0 && (
        <div className={styles.emptyState}>
          <span className="material-icons">info_outline</span>
          <p>No hay características asignadas a este producto</p>
        </div>
      )}

      {/* Formulario para agregar nueva característica */}
      <div className={styles.addForm}>
        <p className={styles.addFormTitle}>
          <span className="material-icons">add_circle</span>
          Agregar característica
        </p>

        <div className={styles.addFormRow}>
          <div className={styles.addFormGroup}>
            <label className={styles.addFormLabel}>Tipo de característica</label>
            <select
              value={selectedTipoId}
              onChange={e => {
                setSelectedTipoId(e.target.value ? parseInt(e.target.value) : '');
                setNuevoValor('');
              }}
              className={styles.addFormSelect}
            >
              <option value="">Seleccionar tipo...</option>
              {tiposDisponibles.map(tipo => (
                <option key={tipo.id_tipo} value={tipo.id_tipo}>
                  {tipo.nombre_tipo}
                  {tipo.unidad_medida ? ` (${tipo.unidad_medida})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedTipo && (
            <div className={styles.addFormGroup}>
              <label className={styles.addFormLabel}>
                Valor
                {selectedTipo.unidad_medida ? ` (${selectedTipo.unidad_medida})` : ''}
              </label>
              {renderValueInput(
                selectedTipo.tipo_dato,
                nuevoValor,
                setNuevoValor,
                selectedTipo.opciones_seleccion,
                selectedTipo.unidad_medida,
              )}
            </div>
          )}

          <button
            type="button"
            className={styles.addButton}
            onClick={handleAgregar}
            disabled={!selectedTipoId || !nuevoValor.trim()}
          >
            <span className="material-icons">add</span>
            Agregar
          </button>
        </div>

        {/* Crear tipo rápido */}
        <div className={styles.newTypeSection}>
          <button
            type="button"
            className={styles.newTypeToggle}
            onClick={() => setShowNuevoTipo(!showNuevoTipo)}
          >
            <span className="material-icons">
              {showNuevoTipo ? 'expand_less' : 'expand_more'}
            </span>
            {showNuevoTipo ? 'Ocultar' : '¿No encuentras el tipo? Crear uno nuevo'}
          </button>

          {showNuevoTipo && (
            <div className={styles.newTypeForm}>
              <div className={styles.newTypeFormRow}>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Nombre del tipo *</label>
                  <input
                    type="text"
                    value={nuevoTipo.nombre_tipo}
                    onChange={e => setNuevoTipo(prev => ({ ...prev, nombre_tipo: e.target.value }))}
                    className={styles.addFormInput}
                    placeholder="Ej: RAM, Pantalla, Color..."
                  />
                </div>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Tipo de dato *</label>
                  <select
                    value={nuevoTipo.tipo_dato}
                    onChange={e => setNuevoTipo(prev => ({
                      ...prev,
                      tipo_dato: e.target.value as NuevoTipoForm['tipo_dato'],
                      unidad_medida: '',
                      opciones_seleccion: [],
                    }))}
                    className={styles.addFormSelect}
                  >
                    <option value="texto">Texto</option>
                    <option value="numero">Número</option>
                    <option value="booleano">Booleano (Sí/No)</option>
                    <option value="seleccion">Selección (opciones)</option>
                  </select>
                </div>
              </div>

              <div className={styles.newTypeFormRow}>
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Descripción</label>
                  <input
                    type="text"
                    value={nuevoTipo.descripcion}
                    onChange={e => setNuevoTipo(prev => ({ ...prev, descripcion: e.target.value }))}
                    className={styles.addFormInput}
                    placeholder="Descripción opcional..."
                  />
                </div>

                {nuevoTipo.tipo_dato === 'numero' && (
                  <div className={styles.addFormGroup}>
                    <label className={styles.addFormLabel}>Unidad de medida</label>
                    <input
                      type="text"
                      value={nuevoTipo.unidad_medida}
                      onChange={e => setNuevoTipo(prev => ({ ...prev, unidad_medida: e.target.value }))}
                      className={styles.addFormInput}
                      placeholder="Ej: GB, pulgadas, MP..."
                    />
                  </div>
                )}
              </div>

              {nuevoTipo.tipo_dato === 'seleccion' && (
                <div className={styles.addFormGroup}>
                  <label className={styles.addFormLabel}>Opciones de selección</label>
                  <div className={styles.opcionesContainer}>
                    {nuevoTipo.opciones_seleccion.map((op, i) => (
                      <span key={i} className={styles.opcionTag}>
                        {op}
                        <button
                          type="button"
                          className={styles.opcionRemove}
                          onClick={() => handleRemoveOpcion(i)}
                        >
                          <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
                        </button>
                      </span>
                    ))}
                    <div className={styles.opcionInputRow}>
                      <input
                        type="text"
                        value={nuevaOpcion}
                        onChange={e => setNuevaOpcion(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOpcion(); } }}
                        className={styles.opcionInput}
                        placeholder="Nueva opción..."
                      />
                      <button
                        type="button"
                        className={styles.opcionAddBtn}
                        onClick={handleAddOpcion}
                        title="Agregar opción"
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.newTypeActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowNuevoTipo(false);
                    setNuevoTipo(INITIAL_NUEVO_TIPO);
                    setNuevaOpcion('');
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.saveTypeButton}
                  onClick={handleCrearTipo}
                  disabled={savingTipo || !nuevoTipo.nombre_tipo.trim()}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>
                    {savingTipo ? 'hourglass_empty' : 'save'}
                  </span>
                  {savingTipo ? 'Guardando...' : 'Crear tipo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductoCaracteristicas;



