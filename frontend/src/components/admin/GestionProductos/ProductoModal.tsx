import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Product, Marca, Category, TipoCaracteristica, ProductoFormData } from '../../../types/product';
import styles from './GestionProductos.module.css';
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';
import Select from '../../common/Select/Select';

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
    let val: any = value;
    
    if (type === 'number') {
      val = Number(value);
    } else if (name === 'id_marca' || name === 'id_categoria') {
      val = value === '0' || value === '' ? null : Number(value);
    }
    
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
    <div className="modalOverlayPremium" onClick={onClose}>
      <div className="modalPremium" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
        
        <div className="modalHeaderPremium">
          <h3 className="modalTitlePremium">
            <span className="material-icons">{modoEdicion ? 'edit_note' : 'add_box'}</span>
            {modoEdicion ? `Editando Producto: ${producto?.nombre}` : 'Nuevo Producto en Almacén'}
          </h3>
          <button className="closeButtonPremium" onClick={onClose} disabled={guardando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className={styles.tabsPremium} style={{ display: 'flex', background: 'var(--background-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { id: 'general', icon: 'inventory_2', label: 'General' },
            { id: 'precios', icon: 'payments', label: 'Costos y Stock' },
            { id: 'imagenes', icon: 'image', label: 'Imágenes' },
            { id: 'especificaciones', icon: 'settings_input_component', label: 'Ficha Técnica' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtnPremium} ${activeTab === tab.id ? styles.tabActivePremium : ''}`}
              style={{ 
                flex: 1, 
                padding: '14px', 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.modalBodyPremium} style={{ minHeight: '400px' }}>
          <form id="product-form" onSubmit={handleSubmit}>
            {activeTab === 'general' && (
              <div className="fade-in">
                <Input
                  id="nombre"
                  name="nombre"
                  label="Nombre del Producto"
                  value={form.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Samsung Galaxy S23 Ultra"
                  disabled={readonly}
                  required
                  autoFocus
                />

                <Input
                  id="codigo"
                  name="codigo"
                  label="Código de Producto (SKU)"
                  value={form.codigo}
                  onChange={handleInputChange}
                  placeholder="Ej: TC-S23U-001"
                  disabled={modoEdicion || readonly}
                  required
                  style={{ 
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}
                />

                <div className={styles.formGridPremium}>
                  <Select
                    id="id_marca"
                    name="id_marca"
                    label="Marca"
                    value={String(form.id_marca ?? 0)}
                    onChange={handleInputChange}
                    disabled={readonly}
                    options={[
                      { value: '0', label: 'Seleccionar marca...' },
                      ...marcas.map(m => ({ value: String(m.id_marca), label: m.nombre_marca }))
                    ]}
                  />

                  <Select
                    id="id_categoria"
                    name="id_categoria"
                    label="Categoría"
                    value={String(form.id_categoria ?? 0)}
                    onChange={handleInputChange}
                    disabled={readonly}
                    required
                    options={[
                      { value: '0', label: 'Seleccionar categoría...' },
                      ...categorias.map(c => ({ value: String(c.id_categoria), label: c.nombre_categoria }))
                    ]}
                  />
                </div>

                <TextArea
                  id="descripcion"
                  name="descripcion"
                  label="Descripción Corta"
                  value={form.descripcion}
                  onChange={handleInputChange}
                  placeholder="Breve descripción del producto para el listado..."
                  rows={4}
                  disabled={readonly}
                />

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
                <div className={styles.formGridPremium}>
                  <Input
                    id="precio_compra"
                    name="precio_compra"
                    label="Precio Compra (Costo)"
                    icon="payments"
                    value={String(form.precio_compra)}
                    onChange={handleInputChange}
                    disabled={modoEdicion || readonly}
                    placeholder="0.00"
                    style={{ 
                      fontFamily: 'monospace',
                      textAlign: 'center'
                    }}
                  />

                  <Input
                    id="precio_venta"
                    name="precio_venta"
                    label="Precio Venta (Público)"
                    icon="payments"
                    value={String(form.precio_venta)}
                    onChange={handleInputChange}
                    disabled={readonly}
                    required
                    placeholder="0.00"
                    style={{ 
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: 'var(--color-primary)'
                    }}
                  />
                </div>

                <div className={styles.formGridPremium}>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    label="Stock Actual"
                    icon="inventory"
                    value={form.stock}
                    onChange={handleInputChange}
                    disabled={modoEdicion || readonly}
                    placeholder="0"
                    style={{ 
                      textAlign: 'center', 
                      fontWeight: 'bold'
                    }}
                  />

                  <Input
                    id="modelo"
                    name="modelo"
                    label="Modelo / Referencia"
                    icon="tag"
                    value={form.modelo}
                    onChange={handleInputChange}
                    disabled={readonly}
                    placeholder="Ej: SM-S918B"
                    style={{ textAlign: 'center' }}
                  />
                </div>

                <div className={styles.formGridPremium}>
                  <Input
                    id="stock_minimo"
                    name="stock_minimo"
                    type="number"
                    label="Stock Mínimo (Alerta)"
                    icon="warning"
                    value={form.stock_minimo}
                    onChange={handleInputChange}
                    disabled={readonly}
                    placeholder="0"
                    style={{ textAlign: 'center' }}
                  />

                  <Input
                    id="stock_maximo"
                    name="stock_maximo"
                    type="number"
                    label="Stock Máximo (Capacidad)"
                    icon="shutter_speed"
                    value={form.stock_maximo}
                    onChange={handleInputChange}
                    disabled={readonly}
                    placeholder="0"
                    style={{ textAlign: 'center' }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'imagenes' && (
              <div className="fade-in">
                <label className={styles.formLabelPremium}>Galería de Imágenes (Máx. 5)</label>
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
                                position: 'static',
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
                              position: 'static',
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
                <Input
                  id="search-specs"
                  name="search-specs"
                  label="Buscar especificaciones"
                  placeholder="Buscar especificación técnica (ej: RAM, Batería, Almacenamiento...)"
                  value={searchSpecs}
                  onChange={(e) => setSearchSpecs(e.target.value)}
                  icon="search"
                />
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  overflowY: 'auto',
                  paddingRight: 8,
                  maxHeight: '400px',
                  marginTop: '12px'
                }}>
                  {tiposCaracteristicas
                    .filter(t => t.nombre_tipo.toLowerCase().includes(searchSpecs.toLowerCase()))
                    .map(tipo => (
                      <div 
                        key={tipo.id_tipo} 
                        className={`${styles.specCard} ${caracteristicas[tipo.id_tipo] ? styles.specCardActive : ''}`}
                      >
                      {tipo.tipo_dato === 'seleccion' ? (
                        <Select 
                          id={`spec-${tipo.id_tipo}`}
                          name={`spec-${tipo.id_tipo}`}
                          label={`${tipo.nombre_tipo}${tipo.unidad_medida ? ` (${tipo.unidad_medida})` : ''}`}
                          value={(caracteristicas[tipo.id_tipo] as string) || ''}
                          onChange={(e) => handleCaracteristicaChange(tipo.id_tipo, e.target.value)}
                          disabled={readonly}
                          options={[
                            { value: '', label: 'No definido' },
                            ...(typeof tipo.opciones_seleccion === 'string' ? JSON.parse(tipo.opciones_seleccion) : tipo.opciones_seleccion || [])?.map((op: string) => (
                              { value: op, label: op }
                            ))
                          ]}
                        />
                      ) : tipo.tipo_dato === 'booleano' ? (
                        <div className={styles.formGroupPremium}>
                          <label className={styles.formLabelPremium}>
                            {tipo.nombre_tipo}{tipo.unidad_medida ? ` (${tipo.unidad_medida})` : ''}
                          </label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              type="button" 
                              className={styles.cancelButtonPremium} 
                              style={{ 
                                flex: 1, 
                                padding: '8px', 
                                fontSize: '11px',
                                fontWeight: 700,
                                background: (caracteristicas[tipo.id_tipo] === true || caracteristicas[tipo.id_tipo] === 'true' || caracteristicas[tipo.id_tipo] === '1') ? 'var(--color-primary)' : 'var(--background-neutral)',
                                color: (caracteristicas[tipo.id_tipo] === true || caracteristicas[tipo.id_tipo] === 'true' || caracteristicas[tipo.id_tipo] === '1') ? 'white' : 'var(--text-secondary)',
                                borderColor: (caracteristicas[tipo.id_tipo] === true || caracteristicas[tipo.id_tipo] === 'true' || caracteristicas[tipo.id_tipo] === '1') ? 'var(--color-primary)' : 'var(--border-color)',
                                opacity: 1,
                                borderRadius: 'var(--border-radius-md)'
                              }}
                              onClick={() => handleCaracteristicaChange(tipo.id_tipo, true)}
                              disabled={readonly}
                            >SÍ</button>
                            <button 
                              type="button" 
                              className={styles.cancelButtonPremium} 
                              style={{ 
                                flex: 1, 
                                padding: '8px', 
                                fontSize: '11px',
                                fontWeight: 700,
                                background: (caracteristicas[tipo.id_tipo] === false || caracteristicas[tipo.id_tipo] === 'false' || caracteristicas[tipo.id_tipo] === '0') ? 'var(--color-error)' : 'var(--background-neutral)',
                                color: (caracteristicas[tipo.id_tipo] === false || caracteristicas[tipo.id_tipo] === 'false' || caracteristicas[tipo.id_tipo] === '0') ? 'white' : 'var(--text-secondary)',
                                borderColor: (caracteristicas[tipo.id_tipo] === false || caracteristicas[tipo.id_tipo] === 'false' || caracteristicas[tipo.id_tipo] === '0') ? 'var(--color-error)' : 'var(--border-color)',
                                opacity: 1,
                                borderRadius: 'var(--border-radius-md)'
                              }}
                              onClick={() => handleCaracteristicaChange(tipo.id_tipo, false)}
                              disabled={readonly}
                            >NO</button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          id={`spec-${tipo.id_tipo}`}
                          name={`spec-${tipo.id_tipo}`}
                          type={tipo.tipo_dato === 'numero' ? 'number' : 'text'}
                          label={`${tipo.nombre_tipo}${tipo.unidad_medida ? ` (${tipo.unidad_medida})` : ''}`}
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

        <div className="modalFooterPremium">
          {modoEdicion && puedeEliminar && (
            <button 
              type="button" 
              className="btnPremium btnDangerPremium" 
              style={{ marginRight: 'auto' }}
              onClick={() => setShowConfirmDelete(true)}
              disabled={guardando}
            >
              <span className="material-icons" style={{ fontSize: 18 }}>delete</span>
              Eliminar Producto
            </button>
          )}
          <button type="button" className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          {!readonly && (
            <button type="submit" form="product-form" className="btnPremium btnPrimaryPremium" disabled={guardando}>
              <span className="material-icons" style={{ fontSize: 18 }}>{guardando ? 'sync' : 'save'}</span>
              {guardando ? 'Procesando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>

        {showConfirmDelete && (
          <div className="modalOverlayPremium" style={{ zIndex: 2100 }}>
             <div className="modalPremium" style={{ maxWidth: '400px' }}>
                <div className="modalBodyPremium" style={{ textAlign: 'center', padding: '30px' }}>
                  <span className="material-icons" style={{ fontSize: 48, color: 'var(--color-error)', marginBottom: 16 }}>warning</span>
                  <h4 style={{ margin: '0 0 10px' }}>¿Confirmar eliminación?</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Esta acción borrará permanentemente el producto del catálogo.</p>
                </div>
                <div className="modalFooterPremium">
                  <button className="btnPremium btnSecondaryPremium" onClick={() => setShowConfirmDelete(false)}>Cancelar</button>
                  <button 
                    className="btnPremium btnDangerSolidPremium" 
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
