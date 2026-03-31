/**
 * GestionMarcas — CRUD completo de marcas desde el panel admin
 * Tabla con edición inline, creación inline y confirmación de eliminación inline.
 */
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Marca } from '../../../types/product';
import styles from './GestionMarcas.module.css';

type SortKey = 'nombre' | 'estado' | 'fecha';
type SortDir = 'asc' | 'desc';

interface EditMarcaForm {
  nombre_marca: string;
  descripcion_marca: string;
}

interface NuevaMarcaForm {
  nombre_marca: string;
  descripcion_marca: string;
}

const GestionMarcas: React.FC = memo(() => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_marcas');
  const puedeCrear = tienePermiso('crear_marca');
  const puedeEditar = tienePermiso('editar_marca');
  const puedeEliminar = tienePermiso('eliminar_marca');

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditMarcaForm>({ nombre_marca: '', descripcion_marca: '' });
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevoForm, setNuevoForm] = useState<NuevaMarcaForm>({ nombre_marca: '', descripcion_marca: '' });
  const [nuevoLogoFile, setNuevoLogoFile] = useState<File | null>(null);
  const [nuevoLogoPreview, setNuevoLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const cargarMarcas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductService.obtenerMarcas();
      setMarcas(data);
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message || 'Error al cargar marcas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    cargarMarcas();
  }, [cargarMarcas]);

  const handleLogoFileChange = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const iniciarEdicion = useCallback((marca: Marca) => {
    setEditandoId(marca.id_marca);
    setEditForm({
      nombre_marca: marca.nombre_marca,
      descripcion_marca: marca.descripcion_marca || '',
    });
    setEditLogoFile(null);
    setEditLogoPreview(null);
    setEliminandoId(null);
  }, []);

  const cancelarEdicion = useCallback(() => {
    setEditandoId(null);
    setEditForm({ nombre_marca: '', descripcion_marca: '' });
    setEditLogoFile(null);
    setEditLogoPreview(null);
  }, []);

  const guardarEdicion = async (id: number) => {
    if (!editForm.nombre_marca.trim()) {
      showNotification('El nombre de la marca no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminProductService.actualizarMarca(id, {
        nombre_marca: editForm.nombre_marca.trim(),
        descripcion_marca: editForm.descripcion_marca.trim() || undefined,
      });
      if (editLogoFile) {
        await adminProductService.uploadMarcaLogo(id, editLogoFile);
      }
      showNotification('Marca actualizada exitosamente', 'success');
      setEditandoId(null);
      setEditLogoFile(null);
      setEditLogoPreview(null);
      await cargarMarcas();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al actualizar la marca',
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
      await adminProductService.eliminarMarca(id);
      showNotification('Marca eliminada exitosamente', 'success');
      setEliminandoId(null);
      await cargarMarcas();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al eliminar la marca',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const iniciarCreacion = useCallback(() => {
    setCreando(true);
    setNuevoForm({ nombre_marca: '', descripcion_marca: '' });
    setNuevoLogoFile(null);
    setNuevoLogoPreview(null);
    setEditandoId(null);
    setEliminandoId(null);
  }, []);

  const cancelarCreacion = useCallback(() => {
    setCreando(false);
    setNuevoForm({ nombre_marca: '', descripcion_marca: '' });
    setNuevoLogoFile(null);
    setNuevoLogoPreview(null);
  }, []);

  const guardarNueva = async () => {
    if (!nuevoForm.nombre_marca.trim()) {
      showNotification('El nombre de la marca no puede estar vacío', 'error');
      return;
    }
    setSaving(true);
    try {
      const nuevaMarca = await adminProductService.crearMarca({
        nombre_marca: nuevoForm.nombre_marca.trim(),
        descripcion_marca: nuevoForm.descripcion_marca.trim() || undefined,
      });
      if (nuevoLogoFile) {
        await adminProductService.uploadMarcaLogo(nuevaMarca.id_marca, nuevoLogoFile);
      }
      showNotification('Marca creada exitosamente', 'success');
      setCreando(false);
      setNuevoLogoFile(null);
      setNuevoLogoPreview(null);
      await cargarMarcas();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al crear la marca',
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

  const sortedMarcas = useMemo(() => {
    const sorted = [...marcas];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'nombre':
          valA = a.nombre_marca.toLowerCase();
          valB = b.nombre_marca.toLowerCase();
          break;
        case 'estado':
          valA = a.activo ? 1 : 0;
          valB = b.activo ? 1 : 0;
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
  }, [marcas, sortKey, sortDir]);

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <span className="material-icons" style={{ fontSize: 48, opacity: 0.5 }}>lock</span>
          <p style={{ marginTop: 16 }}>No tienes permisos para ver marcas</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            <span className="material-icons">branding_watermark</span>
            Marcas
          </h3>
          <p className={styles.panelSubtitle}>Administra las marcas del catálogo</p>
        </div>
          <button 
            className={styles.addButton} 
            onClick={iniciarCreacion} 
            disabled={!puedeCrear || creando}
            title={!puedeCrear ? 'Sin permisos para crear marcas' : undefined}
          >
            <span className="material-icons">add</span>
            Nueva Marca
          </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Cargando marcas...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Logo</th>
                <th className={styles.sortableHeader} onClick={() => handleSort('nombre')}>
                  <span className={styles.sortableHeaderContent}>
                    Nombre
                    <span className={`material-icons ${styles.sortIcon} ${sortKey === 'nombre' ? styles.sortIconActive : ''}`}>{getSortIcon('nombre')}</span>
                  </span>
                </th>
                <th className={styles.th}>Descripción</th>
                <th className={styles.sortableHeader} onClick={() => handleSort('estado')}>
                  <span className={styles.sortableHeaderContent}>
                    Estado
                    <span className={`material-icons ${styles.sortIcon} ${sortKey === 'estado' ? styles.sortIconActive : ''}`}>{getSortIcon('estado')}</span>
                  </span>
                </th>
                <th className={styles.sortableHeader} onClick={() => handleSort('fecha')}>
                  <span className={styles.sortableHeaderContent}>
                    Creación
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
                    <div className={styles.logoCell}>
                      {nuevoLogoPreview && (
                        <img src={nuevoLogoPreview} alt="Preview" className={styles.logoPreview} />
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className={styles.logoFileInput}
                        onChange={e => handleLogoFileChange(
                          e.target.files?.[0] ?? null,
                          setNuevoLogoFile,
                          setNuevoLogoPreview
                        )}
                      />
                    </div>
                  </td>
                  <td className={styles.td}>
                    <input
                      className={styles.editInput}
                      value={nuevoForm.nombre_marca}
                      onChange={e => setNuevoForm(f => ({ ...f, nombre_marca: e.target.value }))}
                      placeholder="Nombre de la marca"
                      autoFocus
                    />
                  </td>
                  <td className={styles.td}>
                    <input
                      className={styles.editInput}
                      value={nuevoForm.descripcion_marca}
                      onChange={e => setNuevoForm(f => ({ ...f, descripcion_marca: e.target.value }))}
                      placeholder="Descripción (opcional)"
                    />
                  </td>
                  <td className={styles.td}>—</td>
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

              {sortedMarcas.length === 0 && !creando ? (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>No hay marcas registradas</td>
                </tr>
              ) : (
                sortedMarcas.map(marca => {
                  if (eliminandoId === marca.id_marca) {
                    return (
                      <tr key={marca.id_marca} className={styles.confirmRow}>
                        <td colSpan={5} className={styles.td}>
                          <span className={styles.confirmText}>
                            ¿Eliminar <strong>«{marca.nombre_marca}»</strong>? Esta acción no se puede deshacer.
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.rowActions}>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                              onClick={() => confirmarEliminacion(marca.id_marca)}
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

                  if (editandoId === marca.id_marca) {
                    return (
                      <tr key={marca.id_marca} className={styles.editRow}>
                        <td className={styles.td}>
                          <div className={styles.logoCell}>
                            {(editLogoPreview || marca.logo_marca) && (
                              <img
                                src={editLogoPreview || marca.logo_marca!}
                                alt={marca.nombre_marca}
                                className={styles.logoPreview}
                              />
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className={styles.logoFileInput}
                              onChange={e => handleLogoFileChange(
                                e.target.files?.[0] ?? null,
                                setEditLogoFile,
                                setEditLogoPreview
                              )}
                            />
                          </div>
                        </td>
                        <td className={styles.td}>
                          <input
                            className={styles.editInput}
                            value={editForm.nombre_marca}
                            onChange={e => setEditForm(f => ({ ...f, nombre_marca: e.target.value }))}
                            autoFocus
                          />
                        </td>
                        <td className={styles.td}>
                          <input
                            className={styles.editInput}
                            value={editForm.descripcion_marca}
                            onChange={e => setEditForm(f => ({ ...f, descripcion_marca: e.target.value }))}
                            placeholder="Descripción (opcional)"
                          />
                        </td>
                        <td className={styles.td}>
                          <span className={marca.activo ? styles.badgeActivo : styles.badgeInactivo}>
                            {marca.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className={styles.td}>{formatearFecha(marca.fyh_creacion)}</td>
                        <td className={styles.td}>
                          <div className={styles.rowActions}>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                              onClick={() => guardarEdicion(marca.id_marca)}
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
                    <tr key={marca.id_marca}>
                      <td className={styles.td}>
                        {marca.logo_marca ? (
                          <img src={marca.logo_marca} alt={marca.nombre_marca} className={styles.logoThumb} />
                        ) : (
                          <span className={`material-icons ${styles.logoPlaceholder}`}>image_not_supported</span>
                        )}
                      </td>
                      <td className={styles.td}>{marca.nombre_marca}</td>
                      <td className={styles.td}>{marca.descripcion_marca || <span className={styles.emptyValue}>—</span>}</td>
                      <td className={styles.td}>
                        <span className={marca.activo ? styles.badgeActivo : styles.badgeInactivo}>
                          {marca.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className={styles.td}>{formatearFecha(marca.fyh_creacion)}</td>
                      <td className={styles.td}>
                        <div className={styles.rowActions}>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                            onClick={() => iniciarEdicion(marca)}
                            title={puedeEditar ? 'Editar' : 'Sin permisos'}
                            disabled={!puedeEditar}
                          >
                            <span className="material-icons">edit</span>
                          </button>
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                              onClick={() => iniciarEliminacion(marca.id_marca)}
                              disabled={!puedeEliminar}
                              title={!puedeEliminar ? 'Sin permisos para eliminar' : 'Eliminar'}
                            >
                              <span className="material-icons">delete</span>
                            </button>
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

export default GestionMarcas;
