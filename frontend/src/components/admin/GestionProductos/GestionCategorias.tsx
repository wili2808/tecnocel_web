/**
 * GestionCategorias — CRUD completo de categorías desde el panel admin
 * Tabla con edición inline, creación inline y confirmación de eliminación inline.
 */
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Category } from '../../../types/product';
import styles from './GestionCategorias.module.css';

type SortKey = 'nombre' | 'fecha';
type SortDir = 'asc' | 'desc';

interface EditCategoriaForm {
  nombre_categoria: string;
}

const GestionCategorias: React.FC = memo(() => {
  const { showNotification } = useNotification();
  const { isAdmin } = useAuth();

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditCategoriaForm>({ nombre_categoria: '' });
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const cargarCategorias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductService.obtenerCategorias();
      setCategorias(data);
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message || 'Error al cargar categorías', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  const iniciarEdicion = useCallback((cat: Category) => {
    setEditandoId(cat.id_categoria);
    setEditForm({ nombre_categoria: cat.nombre_categoria });
    setEliminandoId(null);
  }, []);

  const cancelarEdicion = useCallback(() => {
    setEditandoId(null);
    setEditForm({ nombre_categoria: '' });
  }, []);

  const guardarEdicion = async (id: number) => {
    if (!editForm.nombre_categoria.trim()) {
      showNotification('El nombre de la categoría no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminProductService.actualizarCategoria(id, {
        nombre_categoria: editForm.nombre_categoria.trim(),
      });
      showNotification('Categoría actualizada exitosamente', 'success');
      setEditandoId(null);
      await cargarCategorias();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al actualizar la categoría',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const iniciarEliminacion = useCallback((id: number) => {
    setEliminandoId(id);
    setEditandoId(null);
  }, []);

  const cancelarEliminacion = useCallback(() => {
    setEliminandoId(null);
  }, []);

  const confirmarEliminacion = async (id: number) => {
    setSaving(true);
    try {
      await adminProductService.eliminarCategoria(id);
      showNotification('Categoría eliminada exitosamente', 'success');
      setEliminandoId(null);
      await cargarCategorias();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al eliminar la categoría',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const iniciarCreacion = useCallback(() => {
    setCreando(true);
    setNuevoNombre('');
    setEditandoId(null);
    setEliminandoId(null);
  }, []);

  const cancelarCreacion = useCallback(() => {
    setCreando(false);
    setNuevoNombre('');
  }, []);

  const guardarNueva = async () => {
    if (!nuevoNombre.trim()) {
      showNotification('El nombre de la categoría no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminProductService.crearCategoria({ nombre_categoria: nuevoNombre.trim() });
      showNotification('Categoría creada exitosamente', 'success');
      setCreando(false);
      await cargarCategorias();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al crear la categoría',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

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

  const sortedCategorias = useMemo(() => {
    const sorted = [...categorias];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'nombre':
          valA = a.nombre_categoria.toLowerCase();
          valB = b.nombre_categoria.toLowerCase();
          break;
        case 'fecha':
          valA = new Date(a.fyh_creacion).getTime();
          valB = new Date(b.fyh_creacion).getTime();
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [categorias, sortKey, sortDir]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            <span className="material-icons">category</span>
            Categorías
          </h3>
          <p className={styles.panelSubtitle}>Administra las categorías de productos</p>
        </div>
        {isAdmin && (
          <button className={styles.addButton} onClick={iniciarCreacion} disabled={creando}>
            <span className="material-icons">add</span>
            Nueva Categoría
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando categorías...</div>
      ) : (
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
                <th className={styles.sortableHeader} onClick={() => handleSort('fecha')}>
                  <span className={styles.sortableHeaderContent}>
                    Fecha creación
                    <span className={`material-icons ${styles.sortIcon} ${sortKey === 'fecha' ? styles.sortIconActive : ''}`}>{getSortIcon('fecha')}</span>
                  </span>
                </th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {creando && (
                <tr className={styles.newRow}>
                  <td className={styles.td}>
                    <input
                      className={styles.editInput}
                      value={nuevoNombre}
                      onChange={e => setNuevoNombre(e.target.value)}
                      placeholder="Nombre de la categoría"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') guardarNueva(); }}
                    />
                  </td>
                  <td className={styles.td}>—</td>
                  <td className={styles.td}>
                    <div className={styles.rowActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                        onClick={guardarNueva}
                        disabled={saving}
                        title="Guardar"
                      >
                        <span className="material-icons">check</span>
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnNeutral}`}
                        onClick={cancelarCreacion}
                        disabled={saving}
                        title="Cancelar"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {sortedCategorias.length === 0 && !creando ? (
                <tr>
                  <td colSpan={3} className={styles.emptyMessage}>No hay categorías registradas</td>
                </tr>
              ) : (
                sortedCategorias.map(cat => {
                  if (eliminandoId === cat.id_categoria) {
                    return (
                      <tr key={cat.id_categoria} className={styles.confirmRow}>
                        <td colSpan={2} className={styles.td}>
                          <span className={styles.confirmText}>
                            ¿Eliminar <strong>«{cat.nombre_categoria}»</strong>? Esta acción no se puede deshacer.
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.rowActions}>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                              onClick={() => confirmarEliminacion(cat.id_categoria)}
                              disabled={saving}
                              title="Confirmar eliminación"
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

                  if (editandoId === cat.id_categoria) {
                    return (
                      <tr key={cat.id_categoria} className={styles.editRow}>
                        <td className={styles.td}>
                          <input
                            className={styles.editInput}
                            value={editForm.nombre_categoria}
                            onChange={e => setEditForm({ nombre_categoria: e.target.value })}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(cat.id_categoria); }}
                          />
                        </td>
                        <td className={styles.td}>{formatearFecha(cat.fyh_creacion)}</td>
                        <td className={styles.td}>
                          <div className={styles.rowActions}>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                              onClick={() => guardarEdicion(cat.id_categoria)}
                              disabled={saving}
                              title="Guardar"
                            >
                              <span className="material-icons">check</span>
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnNeutral}`}
                              onClick={cancelarEdicion}
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
                    <tr key={cat.id_categoria}>
                      <td className={styles.td}>{cat.nombre_categoria}</td>
                      <td className={styles.td}>{formatearFecha(cat.fyh_creacion)}</td>
                      <td className={styles.td}>
                        <div className={styles.rowActions}>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                            onClick={() => iniciarEdicion(cat)}
                            title="Editar"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          {isAdmin && (
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                              onClick={() => iniciarEliminacion(cat.id_categoria)}
                              title="Eliminar"
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
      )}
    </div>
  );
});

export default GestionCategorias;
