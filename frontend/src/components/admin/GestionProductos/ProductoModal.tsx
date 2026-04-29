import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Product, Marca, Category, TipoCaracteristica, ProductoFormData } from '../../../types/product';
import styles from './GestionProductos.module.css';

interface ProductoModalProps {
  producto?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

type TabType = 'general' | 'precios' | 'imagenes' | 'especificaciones';

const INITIAL_FORM: ProductoFormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  id_categoria: 0,
  id_marca: 0,
  modelo: '',
  precio_compra: '0',
  precio_venta: '0',
  stock: 0,
  stock_minimo: 0,
  stock_maximo: 0,
  fecha_ingreso: new Date().toISOString().split('T')[0],
  es_destacado: false,
};

const ProductoModal: React.FC<ProductoModalProps> = ({ producto, isOpen, onClose, onGuardado }) => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  
  const puedeEditar = tienePermiso('editar_producto');
  const puedeEliminar = tienePermiso('eliminar_producto');
  const puedeCrear = tienePermiso('crear_producto');

  const modoEdicion = !!producto;
  const [activeTab, setActiveTab] = useState<TabType>('general');
  
  // Datos maestros para selects
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [tiposCaracteristicas, setTiposCaracteristicas] = useState<TipoCaracteristica[]>([]);

  // Formulario
  const [form, setForm] = useState<ProductoFormData>(INITIAL_FORM);
  const [galeria, setGaleria] = useState<{
    id?: number | string;
    url_imagen: string;
    alt_text: string;
    file?: File;
    preview: string;
    esNuevo: boolean;
  }[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<Record<number, string | number | boolean>>({});
  const [searchSpecs, setSearchSpecs] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Cargar datos maestros
  const cargarDatosMaestros = useCallback(async () => {
    try {
      const [m, c, t] = await Promise.all([
        adminProductService.obtenerMarcas(),
        adminProductService.obtenerCategorias(),
        adminProductService.obtenerTiposCaracteristicas()
      ]);
      setMarcas(m);
      setCategorias(c);
      setTiposCaracteristicas(t);
    } catch (err) {
      console.error('Error cargando datos maestros:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      cargarDatosMaestros();
      if (producto) {
        setForm({
          codigo: producto.codigo || '',
          nombre: producto.nombre,
          descripcion: producto.descripcion || '',
          id_categoria: producto.id_categoria,
          id_marca: producto.id_marca || 0,
          modelo: producto.modelo || '',
          precio_compra: producto.precio_compra,
          precio_venta: producto.precio_venta,
          stock: producto.stock,
          stock_minimo: producto.stock_minimo || 0,
          stock_maximo: producto.stock_maximo || 0,
          fecha_ingreso: producto.fecha_ingreso ? producto.fecha_ingreso.split('T')[0] : INITIAL_FORM.fecha_ingreso,
          es_destacado: producto.es_destacado,
        });
        
        // Galería Unificada - Cargamos existentes
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const exist = (producto.imagenes || []).map((img: any) => ({
          id: img.id_imagen || img.id,
          url_imagen: img.url_imagen || img.url,
          alt_text: img.alt_text || '',
          preview: (img.url_imagen || img.url).startsWith('http') 
            ? (img.url_imagen || img.url) 
            : `${apiBaseUrl}/images/${img.url_imagen || img.url}`,
          esNuevo: false
        })).filter(img => !!img.url_imagen);
        
        setGaleria(exist);
        
        // Mapear características existentes - Validación estricta de IDs
        const mapping: Record<number, any> = {};
        const caracs = producto.caracteristicas || producto.productosCaracteristicas || [];
        caracs.forEach((c: any) => {
          if (c.id_tipo && c.id_tipo !== null) {
            mapping[c.id_tipo] = c.valor;
          }
        });
        setCaracteristicas(mapping);
      } else {
        setForm(INITIAL_FORM);
        setGaleria([]);
        setCaracteristicas({});
      }
      setActiveTab('general');
      setShowConfirmDelete(false);
    }
  }, [isOpen, producto, cargarDatosMaestros]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? Number(value) : value;
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (galeria.length + files.length > 5) {
      showNotification('Máximo 5 imágenes por producto', 'warning');
      return;
    }

    const newItems = files.map(file => ({
      url_imagen: '',
      alt_text: file.name,
      file: file,
      preview: URL.createObjectURL(file),
      esNuevo: true
    }));

    setGaleria(prev => [...prev, ...newItems]);
  };

  const removerImagen = (index: number) => {
    setGaleria(prev => prev.filter((_, i) => i !== index));
  };

  const establecerComoPortada = (index: number) => {
    if (index === 0) return;
    setGaleria(prev => {
      const items = [...prev];
      const [item] = items.splice(index, 1);
      return [item, ...items];
    });
  };

  const handleCaracteristicaChange = (id_tipo: number, valor: string | number | boolean) => {
    setCaracteristicas(prev => ({ ...prev, [id_tipo]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    if (!form.nombre.trim() || form.id_categoria === 0) {
      showNotification('Nombre y Categoría son obligatorios', 'error');
      setActiveTab('general');
      return;
    }

    setGuardando(true);
    try {
      // 1. Subir imágenes nuevas primero
      const nuevosArchivos = galeria.filter(item => item.esNuevo && item.file).map(item => item.file!);
      let resultadosSubida: { url_imagen: string; alt_text: string }[] = [];
      
      if (nuevosArchivos.length > 0) {
        resultadosSubida = await adminProductService.subirImagenes(nuevosArchivos);
      }

      // 2. Recomponer el array final respetando el orden de la galería
      let subidaIdx = 0;
      const imagenesFinales = galeria.map(item => {
        if (item.esNuevo) {
          return resultadosSubida[subidaIdx++] || { url_imagen: '', alt_text: '' };
        }
        return { url_imagen: item.url_imagen, alt_text: item.alt_text };
      }).filter(img => img.url_imagen !== '');

      // 3. Preparar payload final con limpieza de datos
      const payload: ProductoFormData = {
        ...form,
        id_marca: form.id_marca === 0 ? null : form.id_marca,
        id_categoria: form.id_categoria === 0 ? null : form.id_categoria,
        caracteristicas: Object.entries(caracteristicas)
          .filter(([id_tipo, valor]) => {
            const id = Number(id_tipo);
            const tieneValor = valor !== '' && valor !== null && valor !== undefined;
            return !isNaN(id) && id > 0 && tieneValor;
          })
          .map(([id_tipo, valor]) => ({
            id_tipo: Number(id_tipo),
            valor: String(valor)
          })),
        imagenes: imagenesFinales
      };

      if (modoEdicion) {
        await adminProductService.actualizarProducto(producto!.id_producto, payload);
        showNotification('Producto actualizado correctamente', 'success');
      } else {
        await adminProductService.crearProducto(payload);
        showNotification('Producto creado correctamente', 'success');
      }
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message || 'Error al guardar el producto', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!producto) return;
    setEliminando(true);
    try {
      await adminProductService.eliminarProducto(producto.id_producto);
      showNotification('Producto eliminado correctamente', 'success');
      onGuardado();
      onClose();
    } catch (err) {
      showNotification('Error al eliminar el producto', 'error');
    } finally {
      setEliminando(false);
    }
  };

  const readonly = modoEdicion ? !puedeEditar : !puedeCrear;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-icons" style={{ color: 'var(--color-primary)' }}>
              {modoEdicion ? 'inventory_2' : 'add_box'}
            </span>
            <div>
              <h3 className={styles.modalTitle}>{modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
                {modoEdicion ? `ID: ${producto?.id_producto} | SKU: ${producto?.codigo || 'N/A'}` : 'Complete la información técnica del producto'}
              </p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} disabled={guardando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar Tabs */}
          <div style={{ 
            width: '180px', 
            background: 'var(--background-secondary)', 
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 0'
          }}>
            {[
              { id: 'general', icon: 'info', label: 'General' },
              { id: 'precios', icon: 'payments', label: 'Precio y Stock' },
              { id: 'imagenes', icon: 'collections', label: 'Imágenes' },
              { id: 'especificaciones', icon: 'settings_input_component', label: 'Especificaciones' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '12px 20px', 
                  width: '100%', 
                  borderBottom: 'none',
                  borderLeft: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                  marginBottom: 0
                }}
                onClick={() => setActiveTab(tab.id as TabType)}
              >
                <span className="material-icons" style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={styles.modalBody} style={{ padding: '24px' }}>
            <form id="product-form" onSubmit={handleSubmit}>
              {activeTab === 'general' && (
                <div className="fade-in">
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nombre del Producto *</label>
                    <input
                      className={styles.formInput}
                      name="nombre"
                      value={form.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej: Samsung Galaxy S23 Ultra"
                      disabled={readonly}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Código de Producto (SKU) *</label>
                    <input
                      className={styles.formInput}
                      style={{ 
                        backgroundColor: modoEdicion ? 'rgba(255,255,255,0.03)' : '',
                        cursor: modoEdicion ? 'not-allowed' : '',
                        color: modoEdicion ? 'var(--text-muted)' : '',
                        fontFamily: 'monospace',
                        fontWeight: 'bold'
                      }}
                      name="codigo"
                      value={form.codigo}
                      onChange={handleInputChange}
                      placeholder="Ej: TC-S23U-001"
                      readOnly={modoEdicion || readonly}
                      required
                    />
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Marca</label>
                      <select 
                        className={styles.formInput} 
                        name="id_marca" 
                        value={form.id_marca ?? 0} 
                        onChange={handleInputChange}
                        disabled={readonly}
                      >
                        <option value={0}>Seleccionar marca...</option>
                        {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre_marca}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Categoría *</label>
                      <select 
                        className={styles.formInput} 
                        name="id_categoria" 
                        value={form.id_categoria ?? 0} 
                        onChange={handleInputChange}
                        disabled={readonly}
                      >
                        <option value={0}>Seleccionar categoría...</option>
                        {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Descripción Corta</label>
                    <textarea
                      className={styles.formInput}
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleInputChange}
                      placeholder="Breve descripción del producto para el listado..."
                      rows={4}
                      style={{ resize: 'none' }}
                      disabled={readonly}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" name="es_destacado" checked={form.es_destacado} onChange={handleCheckboxChange} disabled={readonly} />
                      Destacar en Portada
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'precios' && (
                <div className="fade-in">
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Precio Compra (Costo)</label>
                      <div className={styles.formInput} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '12px', 
                        backgroundColor: (modoEdicion || readonly) ? 'rgba(255,255,255,0.03)' : '', 
                        cursor: (modoEdicion || readonly) ? 'not-allowed' : 'text' 
                      }}>
                        <span style={{ color: (modoEdicion || readonly) ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 16, width: '20px', textAlign: 'right' }}>$</span>
                        <input
                          type="text"
                          style={{ 
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'center', 
                            color: (modoEdicion || readonly) ? 'var(--text-muted)' : 'var(--text-primary)',
                            fontFamily: 'monospace',
                            fontSize: 16,
                            outline: 'none',
                            width: '100%',
                            padding: 0
                          }}
                          name="precio_compra"
                          value={form.precio_compra}
                          onChange={handleInputChange}
                          readOnly={modoEdicion || readonly}
                        />
                        <span style={{ width: '20px' }}></span>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Precio Venta (Público) *</label>
                      <div className={styles.formInput} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderColor: 'var(--color-primary-300)' }}>
                        <span style={{ color: 'var(--color-primary)', fontSize: 16, fontWeight: 'bold', width: '20px', textAlign: 'right' }}>$</span>
                        <input
                          type="text"
                          style={{ 
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'center', 
                            fontWeight: 'bold', 
                            color: 'var(--color-primary)', 
                            fontFamily: 'monospace',
                            fontSize: 18,
                            outline: 'none',
                            width: '100%',
                            padding: 0
                          }}
                          name="precio_venta"
                          value={form.precio_venta}
                          onChange={handleInputChange}
                          disabled={readonly}
                          required
                        />
                        <span style={{ width: '20px' }}></span> {/* Espaciador para centrar el texto respecto al $ */}
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Stock Actual</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        style={{ 
                          textAlign: 'center', 
                          backgroundColor: (modoEdicion || readonly) ? 'rgba(255,255,255,0.03)' : '', 
                          cursor: (modoEdicion || readonly) ? 'not-allowed' : 'text', 
                          color: (modoEdicion || readonly) ? 'var(--text-muted)' : 'var(--text-primary)',
                          fontSize: 16,
                          fontWeight: 'bold',
                          width: '100%'
                        }}
                        name="stock"
                        value={form.stock}
                        onChange={handleInputChange}
                        readOnly={modoEdicion || readonly}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Modelo / Referencia</label>
                      <input
                        className={styles.formInput}
                        style={{ textAlign: 'center', width: '100%' }}
                        name="modelo"
                        value={form.modelo}
                        onChange={handleInputChange}
                        disabled={readonly}
                        placeholder="Ej: SM-S918B"
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Stock Mínimo (Alerta)</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        style={{ textAlign: 'center', fontSize: 16, width: '100%' }}
                        name="stock_minimo"
                        value={form.stock_minimo}
                        onChange={handleInputChange}
                        disabled={readonly}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Stock Máximo (Capacidad)</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        style={{ textAlign: 'center', fontSize: 16, width: '100%' }}
                        name="stock_maximo"
                        value={form.stock_maximo}
                        onChange={handleInputChange}
                        disabled={readonly}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'imagenes' && (
                <div className="fade-in">
                  <label className={styles.formLabel}>Galería de Imágenes (Máx. 5)</label>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 15 }}>
                    La primera imagen será la portada. Haz clic en <span className="material-icons" style={{ fontSize: 14, verticalAlign: 'middle' }}>star</span> para elegir la portada.
                  </p>
                  <div className={styles.opcionesList} style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                    {galeria.map((item, idx) => (
                      <div key={idx} className={styles.logoPreviewWrapper} style={{ 
                        width: 120, 
                        height: 120,
                        border: idx === 0 ? '2px solid var(--color-success)' : '1px solid var(--border-color)',
                        padding: 4
                      }}>
                        <img src={item.preview} alt="Preview" className={styles.logoImg} style={{ borderRadius: 4 }} />
                        {!readonly && (
                          <div style={{ 
                            position: 'absolute', 
                            bottom: -8, 
                            right: -8, 
                            display: 'flex', 
                            gap: 6,
                            zIndex: 20 
                          }}>
                            {idx !== 0 && (
                              <button 
                                type="button" 
                                className={styles.logoEditBtn} 
                                style={{ 
                                  position: 'static', // Evitar que el CSS global lo posicione absolutamente
                                  backgroundColor: 'var(--color-primary)', 
                                  width: 28, 
                                  height: 28,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                }}
                                onClick={() => establecerComoPortada(idx)}
                                title="Establecer como portada"
                              >
                                <span className="material-icons" style={{ fontSize: 18 }}>star</span>
                              </button>
                            )}
                            <button 
                              type="button" 
                              className={styles.logoEditBtn} 
                              style={{ 
                                position: 'static', // Evitar que el CSS global lo posicione absolutamente
                                backgroundColor: 'var(--color-error)', 
                                width: 28, 
                                height: 28,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                              }}
                              onClick={() => removerImagen(idx)}
                              title="Eliminar imagen"
                            >
                              <span className="material-icons" style={{ fontSize: 18 }}>delete</span>
                            </button>
                          </div>
                        )}
                        {idx === 0 && (
                          <span style={{ 
                            position: 'absolute', 
                            top: -8, 
                            left: -8, 
                            background: 'var(--color-success)', 
                            color: '#fff', 
                            fontSize: 9, 
                            padding: '3px 8px', 
                            borderRadius: 12, 
                            fontWeight: 800,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            zIndex: 10
                          }}>PORTADA</span>
                        )}
                      </div>
                    ))}
                    
                    {galeria.length < 5 && !readonly && (
                      <label className={styles.logoPreviewWrapper} style={{ width: 120, height: 120, cursor: 'pointer', borderStyle: 'dashed' }}>
                        <div className={styles.logoPlaceholder}>
                          <span className="material-icons">add_a_photo</span>
                          <span style={{ fontSize: 10 }}>Añadir Foto</span>
                        </div>
                        <input type="file" hidden accept="image/*" multiple onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'especificaciones' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ marginBottom: 20, position: 'relative' }}>
                    <span className="material-icons" style={{ position: 'absolute', left: 12, top: 10, fontSize: 20, color: 'var(--text-muted)' }}>search</span>
                    <input 
                      type="text"
                      className={styles.formInput}
                      style={{ paddingLeft: 40 }}
                      placeholder="Buscar especificación técnica (ej: RAM, Batería, Almacenamiento...)"
                      value={searchSpecs}
                      onChange={(e) => setSearchSpecs(e.target.value)}
                    />
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '16px',
                    overflowY: 'auto',
                    paddingRight: 8,
                    maxHeight: '400px'
                  }}>
                    {tiposCaracteristicas
                      .filter(t => t.nombre_tipo.toLowerCase().includes(searchSpecs.toLowerCase()))
                      .map(tipo => (
                        <div 
                          key={tipo.id_tipo} 
                          className={`${styles.specCard} ${caracteristicas[tipo.id_tipo] ? styles.specCardActive : ''}`}
                        >
                        <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                          <span>{tipo.nombre_tipo}</span>
                          {tipo.unidad_medida && <span style={{ opacity: 0.6, fontSize: 11 }}>{tipo.unidad_medida}</span>}
                        </label>
                        
                        {tipo.tipo_dato === 'seleccion' ? (
                          <select 
                            className={styles.formInput}
                            style={{ height: '36px', fontSize: '13px' }}
                            value={(caracteristicas[tipo.id_tipo] as string) || ''}
                            onChange={(e) => handleCaracteristicaChange(tipo.id_tipo, e.target.value)}
                            disabled={readonly}
                          >
                            <option value="">No definido</option>
                            {(typeof tipo.opciones_seleccion === 'string' ? JSON.parse(tipo.opciones_seleccion) : tipo.opciones_seleccion)?.map((op: string) => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        ) : tipo.tipo_dato === 'booleano' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              type="button" 
                              className={styles.cancelButton} 
                              style={{ 
                                flex: 1, 
                                padding: '6px', 
                                fontSize: '11px',
                                fontWeight: 700,
                                background: (caracteristicas[tipo.id_tipo] === true || caracteristicas[tipo.id_tipo] === 'true' || caracteristicas[tipo.id_tipo] === '1') ? 'var(--color-primary)' : 'var(--background-neutral)',
                                color: (caracteristicas[tipo.id_tipo] === true || caracteristicas[tipo.id_tipo] === 'true' || caracteristicas[tipo.id_tipo] === '1') ? 'white' : 'var(--text-secondary)',
                                borderColor: (caracteristicas[tipo.id_tipo] === true || caracteristicas[tipo.id_tipo] === 'true' || caracteristicas[tipo.id_tipo] === '1') ? 'var(--color-primary)' : 'var(--border-color)',
                                opacity: 1
                              }}
                              onClick={() => handleCaracteristicaChange(tipo.id_tipo, true)}
                              disabled={readonly}
                            >SÍ</button>
                            <button 
                              type="button" 
                              className={styles.cancelButton} 
                              style={{ 
                                flex: 1, 
                                padding: '6px', 
                                fontSize: '11px',
                                fontWeight: 700,
                                background: (caracteristicas[tipo.id_tipo] === false || caracteristicas[tipo.id_tipo] === 'false' || caracteristicas[tipo.id_tipo] === '0') ? 'var(--color-error)' : 'var(--background-neutral)',
                                color: (caracteristicas[tipo.id_tipo] === false || caracteristicas[tipo.id_tipo] === 'false' || caracteristicas[tipo.id_tipo] === '0') ? 'white' : 'var(--text-secondary)',
                                borderColor: (caracteristicas[tipo.id_tipo] === false || caracteristicas[tipo.id_tipo] === 'false' || caracteristicas[tipo.id_tipo] === '0') ? 'var(--color-error)' : 'var(--border-color)',
                                opacity: 1
                              }}
                              onClick={() => handleCaracteristicaChange(tipo.id_tipo, false)}
                              disabled={readonly}
                            >NO</button>
                          </div>
                        ) : (
                          <input
                            type={tipo.tipo_dato === 'numero' ? 'number' : 'text'}
                            className={styles.formInput}
                            style={{ height: '36px', fontSize: '13px' }}
                            value={(caracteristicas[tipo.id_tipo] as any) || ''}
                            onChange={(e) => handleCaracteristicaChange(tipo.id_tipo, tipo.tipo_dato === 'numero' ? Number(e.target.value) : e.target.value)}
                            disabled={readonly}
                            placeholder={tipo.tipo_dato === 'numero' ? '0' : 'Escribir...'}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className={styles.modalFooter}>
          {modoEdicion && puedeEliminar && (
            <button 
              type="button" 
              className={styles.cancelButton} 
              style={{ marginRight: 'auto', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
              onClick={() => setShowConfirmDelete(true)}
              disabled={guardando}
            >
              <span className="material-icons" style={{ fontSize: 18 }}>delete</span>
              Eliminar Producto
            </button>
          )}
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          {!readonly && (
            <button type="submit" form="product-form" className={styles.saveButton} disabled={guardando}>
              <span className="material-icons">{guardando ? 'sync' : 'save'}</span>
              {guardando ? 'Procesando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>

        {showConfirmDelete && (
          <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
             <div className={styles.modal} style={{ maxWidth: '400px' }}>
                <div className={styles.modalBody} style={{ textAlign: 'center', padding: '30px' }}>
                  <span className="material-icons" style={{ fontSize: 48, color: 'var(--color-error)', marginBottom: 16 }}>warning</span>
                  <h4 style={{ margin: '0 0 10px' }}>¿Confirmar eliminación?</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Esta acción borrará permanentemente el producto del catálogo.</p>
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.cancelButton} onClick={() => setShowConfirmDelete(false)}>Cancelar</button>
                  <button 
                    className={styles.saveButton} 
                    style={{ background: 'var(--color-error)' }}
                    onClick={handleEliminar}
                    disabled={eliminando}
                  >
                    {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductoModal;
