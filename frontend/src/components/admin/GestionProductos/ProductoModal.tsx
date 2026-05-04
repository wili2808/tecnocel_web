import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Product, Marca, Category, TipoCaracteristica, ProductoFormData } from '../../../types/product';
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';
import Select from '../../common/Select/Select';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './ProductoModals.module.css';

interface ProductoModalProps {
  producto?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardado: (nuevoProducto?: Product) => void;
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

const ProductoModal: React.FC<ProductoModalProps> = memo(({ producto, isOpen, onClose, onGuardado }) => {

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
        const exist = (producto.imagenes || []).map((img: any) => {
          const absoluteUrl = img.url || (img.url_imagen?.startsWith('http') ? img.url_imagen : null);
          const filename = img.url_imagen || (img.url?.split('/').pop()) || '';
          
          return {
            id: img.id_imagen || img.id,
            url_imagen: filename,
            alt_text: img.alt_text || '',
            preview: absoluteUrl || `${apiBaseUrl}/images/${filename}`,
            esNuevo: false
          };
        }).filter(img => !!img.url_imagen || !!img.preview);
        
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
        onGuardado();
      } else {
        const nuevoProd = await adminProductService.crearProducto(payload);
        showNotification('Producto creado correctamente', 'success');
        onGuardado(nuevoProd);
      }
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
    <>
      <PremiumModal
        isOpen={isOpen}
        onClose={onClose}
        title={modoEdicion ? `Editando: ${producto?.nombre}` : 'Nuevo Producto en Almacén'}
        icon={modoEdicion ? 'edit_note' : 'add_box'}
        maxWidth="900px"
      >
        <div className="modalTabsPremium">
          {[
            { id: 'general', icon: 'inventory_2', label: 'General' },
            { id: 'precios', icon: 'payments', label: 'Costos y Stock' },
            { id: 'imagenes', icon: 'image', label: 'Imágenes' },
            { id: 'especificaciones', icon: 'settings_input_component', label: 'Ficha Técnica' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`modalTabBtnPremium ${activeTab === tab.id ? 'modalTabActivePremium' : ''}`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              <span className="material-icons">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modalBodyPremium">
          <form id="product-form" onSubmit={handleSubmit}>
            {activeTab === 'general' && (
              <div className="fade-in">
                <div className="modalFormGroupFullPremium">
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
                </div>

                <div className="modalFormGroupFullPremium">
                  <Input
                    id="codigo"
                    name="codigo"
                    label="Código de Producto (SKU)"
                    value={form.codigo}
                    onChange={handleInputChange}
                    placeholder="Ej: TC-S23U-001"
                    disabled={modoEdicion || readonly}
                    required
                    className="font-mono font-bold"
                  />
                </div>

                <div className="modalFormGridPremium">
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

                <div className="modalFormGroupFullPremium">
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
                </div>

                <div className="modalFormGroupPremium mt-sm">
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" name="es_destacado" checked={form.es_destacado} onChange={handleCheckboxChange} disabled={readonly} />
                    Destacar en Portada
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'precios' && (
              <div className="fade-in">
                <div className="modalFormGridPremium">
                  <Input
                    id="precio_compra"
                    name="precio_compra"
                    label="Precio Compra (Costo)"
                    icon="payments"
                    value={String(form.precio_compra)}
                    onChange={handleInputChange}
                    disabled={modoEdicion || readonly}
                    placeholder="0.00"
                    className="font-mono text-center"
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
                    className="font-mono text-center font-bold text-primary"
                  />
                </div>

                <div className="modalFormGridPremium">
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
                    className="text-center font-bold"
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
                    className="text-center"
                  />
                </div>

                <div className="modalFormGridPremium">
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
                    className="text-center"
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
                    className="text-center"
                  />
                </div>
              </div>
            )}

            {activeTab === 'imagenes' && (
              <div className="fade-in">
                <label className="modalFormLabelPremium">Galería de Imágenes (Máx. 5)</label>
                <p className={styles.galleryHint}>
                  La primera imagen será la portada. Haz clic en <span className={`material-icons ${styles.starIcon}`}>star</span> para elegir la portada.
                </p>
                
                <div className="modalGalleryPremium">
                  {galeria.map((item, idx) => (
                    <div key={idx} className={`modalImageItemPremium ${idx === 0 ? 'isPortada' : ''}`}>
                      <img src={item.preview} alt="Preview" className="modalImagePreviewPremium" />
                      {!readonly && (
                        <div className="modalImageActionsPremium">
                          {idx !== 0 && (
                            <button 
                              type="button" 
                              className="modalImageBtnPremium primary"
                              onClick={() => establecerComoPortada(idx)}
                              title="Establecer como portada"
                            >
                              <span className="material-icons">star</span>
                            </button>
                          )}
                          <button 
                            type="button" 
                            className="modalImageBtnPremium danger"
                            onClick={() => removerImagen(idx)}
                            title="Eliminar imagen"
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </div>
                      )}
                      {idx === 0 && <span className="modalImageBadgePremium">PORTADA</span>}
                    </div>
                  ))}
                  
                  {galeria.length < 5 && !readonly && (
                    <label className="modalImageUploadPremium">
                      <span className="material-icons">add_a_photo</span>
                      <span className="text-xxs font-bold">Añadir Foto</span>
                      <input type="file" hidden accept="image/*" multiple onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'especificaciones' && (
              <div className="fade-in">
                <div className={styles.specsSearchContainer}>
                  <Input
                    id="search-specs"
                    name="search-specs"
                    label="Buscar especificaciones"
                    placeholder="Buscar especificación técnica..."
                    value={searchSpecs}
                    onChange={(e) => setSearchSpecs(e.target.value)}
                    icon="search"
                  />
                </div>
                
                <div className={styles.specsGrid}>
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
                        <div className="modalFormGroupPremium">
                          <label className="modalFormLabelPremium">
                            {tipo.nombre_tipo}{tipo.unidad_medida ? ` (${tipo.unidad_medida})` : ''}
                          </label>
                          <div className={styles.booleanGroup}>
                            <button 
                              type="button" 
                              className={`${styles.booleanBtn} ${(caracteristicas[tipo.id_tipo] === true || caracteristicas[tipo.id_tipo] === 'true' || caracteristicas[tipo.id_tipo] === '1') ? styles.booleanBtnActivePrimary : ''}`}
                              onClick={() => handleCaracteristicaChange(tipo.id_tipo, true)}
                              disabled={readonly}
                            >SÍ</button>
                            <button 
                              type="button" 
                              className={`${styles.booleanBtn} ${(caracteristicas[tipo.id_tipo] === false || caracteristicas[tipo.id_tipo] === 'false' || caracteristicas[tipo.id_tipo] === '0') ? styles.booleanBtnActiveDanger : ''}`}
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
              className="btnPremium btnDangerPremium mr-auto" 
              onClick={() => setShowConfirmDelete(true)}
              disabled={guardando}
            >
              <span className="material-icons">delete</span>
              Eliminar Producto
            </button>
          )}
          <button type="button" className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          {!readonly && (
            <button type="submit" form="product-form" className="btnPremium btnPrimaryPremium" disabled={guardando}>
              <span className="material-icons">{guardando ? 'sync' : 'save'}</span>
              {guardando ? 'Procesando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </PremiumModal>

      {/* Sub-modal de Confirmación de Eliminación */}
      <PremiumModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Confirmar eliminación"
        icon="warning"
        maxWidth="400px"
        titleStyle={{ color: 'var(--color-error)' }}
      >
        <div className={styles.deleteConfirmBody}>
          <p className="text-secondary">Esta acción borrará permanentemente el producto del catálogo.</p>
        </div>
        <div className="modalFooterPremium">
          <button className="btnPremium btnSecondaryPremium" onClick={() => setShowConfirmDelete(false)}>Cancelar</button>
          <button 
            className="btnPremium btnDangerPremium" 
            onClick={handleEliminar}
            disabled={eliminando}
          >
            <span className="material-icons">{eliminando ? 'sync' : 'delete_forever'}</span>
            {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </PremiumModal>
    </>
  );
});

ProductoModal.displayName = 'ProductoModal';

export default ProductoModal;
