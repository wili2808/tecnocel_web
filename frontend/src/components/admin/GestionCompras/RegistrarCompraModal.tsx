import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import proveedorAdminService from '../../../services/proveedorAdminService';
import adminProductService from '../../../services/adminProductService';
import ProductoNuevoModalRapido from './ProductoNuevoModalRapido';
import ProveedorModal from './ProveedorModal';
import { useNotification } from '../../../contexts/NotificationContext';
import styles from './GestionCompras.module.css';
import type { RegistrarCompraData, ProveedorListItem, Category, Marca } from '../../../types';
import type { ProductoStockBajo } from '../../../types/reporte';
import { AdminSearch, AdminEmptyState } from '../common';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import TextArea from '../../common/TextArea/TextArea';

// ── Tipos locales ────────────────────────────────────────────────────────────

interface RegistrarCompraModalProps {
  onClose: () => void;
  onRegistrada: () => void;
  /** Productos con stock bajo pre-seleccionados para cargar como ítems iniciales */
  productosIniciales?: ProductoStockBajo[];
}

interface ItemForm {
  id_producto?: number;
  es_nuevo?: boolean;
  nuevo_codigo?: string;
  nuevo_nombre?: string;
  nuevo_precio_venta?: number;
  nuevo_id_categoria?: number;
  nuevo_id_marca?: number;
  cantidad: number;
  precio_unitario: number;
  nombre_producto?: string;
  precio_venta: number;
}

interface ProductoParaBuscar {
  id_producto: number;
  nombre: string;
  codigo: string;
  precio_venta: number;
  precio_compra: number;
  stock: number;
}

// ── Componente ───────────────────────────────────────────────────────────────

const RegistrarCompraModal: React.FC<RegistrarCompraModalProps> = memo(({ onClose, onRegistrada, productosIniciales }) => {
  const { showNotification } = useNotification();

  // Estado general
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proveedor
  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [idProveedor, setIdProveedor] = useState<number | ''>('');
  const [mostrarCrearProveedor, setMostrarCrearProveedor] = useState(false);

  // Datos de compra
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [comprobante, setComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Búsqueda de productos
  const [busqProducto, setBusqProducto] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState<ProductoParaBuscar[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const productoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Items y producto nuevo
  const [items, setItems] = useState<ItemForm[]>([]);
  const [mostrarProductoNuevo, setMostrarProductoNuevo] = useState(false);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarProveedores();
    cargarCategoriasMarcas();
  }, []);

  // Pre-cargar ítems desde productos con stock bajo seleccionados
  useEffect(() => {
    if (!productosIniciales?.length) return;
    const itemsIniciales: ItemForm[] = productosIniciales.map((p) => {
      const pc = Number(p.precio_compra) || 0;
      const pv = Number(p.precio_venta) || 0;
      return {
        id_producto: p.id_producto,
        nombre_producto: `${p.nombre}${p.codigo ? ` (${p.codigo})` : ''}`,
        cantidad: Math.max(1, p.stock_minimo - p.stock),
        precio_unitario: pc > 0 ? pc : pv,
        precio_venta: pv,
      };
    });
    setItems(itemsIniciales);
  }, [productosIniciales]);

  const cargarProveedores = async () => {
    try {
      const res = await proveedorAdminService.listarProveedores();
      setProveedores(res.data || []);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
    }
  };

  const cargarCategoriasMarcas = async () => {
    try {
      const resCat = await adminProductService.obtenerCategorias();
      setCategorias(resCat);
      const resMar = await adminProductService.obtenerMarcas();
      setMarcas(resMar);
    } catch (err) {
      console.error('Error cargando categorías/marcas:', err);
    }
  };

  const buscarProductos = useCallback((q: string) => {
    if (productoTimerRef.current) clearTimeout(productoTimerRef.current);
    if (!q.trim()) {
      setProductosEncontrados([]);
      return;
    }
    productoTimerRef.current = setTimeout(async () => {
      setBuscandoProducto(true);
      try {
        const res = await adminProductService.listarProductos(q.trim());
        setProductosEncontrados(
          res.map((p: any) => {
            const pv = parseFloat(p.precio_venta);
            const pc = parseFloat(p.precio_compra || 0);
            return {
              id_producto: p.id_producto,
              nombre: p.nombre,
              codigo: p.codigo || '',
              precio_venta: isNaN(pv) ? 0 : pv,
              precio_compra: isNaN(pc) ? 0 : pc,
              stock: p.stock ?? 0,
            };
          }),
        );
      } catch {
        setProductosEncontrados([]);
      } finally {
        setBuscandoProducto(false);
      }
    }, 400);
  }, []);

  const handleBusqProductoChange = (v: string) => {
    setBusqProducto(v);
    buscarProductos(v);
  };

  const agregarProducto = (p: ProductoParaBuscar) => {
    if (items.some((i) => i.id_producto === p.id_producto && !i.es_nuevo)) {
      showNotification('El producto ya fue agregado', 'warning');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id_producto: p.id_producto,
        nombre_producto: p.nombre,
        cantidad: 1,
        precio_unitario: p.precio_compra || p.precio_venta,
        precio_venta: p.precio_venta || 0,
      },
    ]);
    setBusqProducto('');
    setProductosEncontrados([]);
  };

  const handleProductoNuevo = (productoData: any) => {
    setItems((prev) => [
      ...prev,
      {
        es_nuevo: true,
        nuevo_codigo: productoData.codigo,
        nuevo_nombre: productoData.nombre,
        nuevo_precio_venta: productoData.precio_venta,
        nuevo_id_categoria: productoData.id_categoria,
        nuevo_id_marca: productoData.id_marca,
        cantidad: 1,
        precio_unitario: productoData.precio_compra || 0,
        precio_venta: productoData.precio_venta || 0,
      },
    ]);
    setMostrarProductoNuevo(false);
  };

  const actualizarItem = (index: number, field: string, value: any) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const eliminarItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const registrarCompra = async () => {
    if (!idProveedor) {
      setError('Seleccione un proveedor');
      return;
    }
    if (!fechaCompra || !comprobante.trim()) {
      setError('Fecha y comprobante son requeridos');
      return;
    }
    if (items.length === 0) {
      setError('Agregue al menos un producto');
      return;
    }

    for (const item of items) {
      if (!item.cantidad || item.cantidad < 1) {
        setError(`${item.nombre_producto || 'Producto'} requiere cantidad >= 1`);
        return;
      }
      if (!item.precio_unitario || item.precio_unitario < 0) {
        setError(`${item.nombre_producto || 'Producto'} requiere precio válido`);
        return;
      }
      if (item.es_nuevo && (!item.nuevo_codigo || !item.nuevo_nombre || !item.nuevo_precio_venta)) {
        setError('Producto nuevo requiere código, nombre y precio venta');
        return;
      }
    }

    setRegistrando(true);
    setError(null);

    try {
      const data: RegistrarCompraData = {
        id_proveedor: Number(idProveedor),
        fecha_compra: fechaCompra,
        comprobante: comprobante.trim(),
        observaciones: observaciones || undefined,
        items: items.map((item) => ({
          id_producto: item.id_producto,
          es_nuevo: item.es_nuevo,
          nuevo_codigo: item.nuevo_codigo,
          nuevo_nombre: item.nuevo_nombre,
          nuevo_precio_venta: item.nuevo_precio_venta,
          nuevo_id_categoria: item.nuevo_id_categoria,
          nuevo_id_marca: item.nuevo_id_marca,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        })),
      };

      await adminCompraService.registrarCompra(data);
      showNotification('Compra registrada exitosamente', 'success');
      onRegistrada();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar compra');
    } finally {
      setRegistrando(false);
    }
  };

  const totalCompra = items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
  const proveedorSeleccionado = proveedores.find((p) => p.id_proveedor === idProveedor);

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalPremium} style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
          
          {/* Header Premium */}
          <div className={styles.modalHeaderPremium}>
            <h2 className={styles.modalTitlePremium}>
              <span className="material-icons">shopping_cart_checkout</span>
              Registrar Compra a Proveedor
            </h2>
            <button className={styles.closeButtonPremium} onClick={onClose} disabled={registrando}>
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Cuerpo - Dos columnas optimizadas */}
          <div className={styles.registrarCompraGrid}>
            
            {/* Columna Izquierda - Formulario y Items */}
            <div className={styles.registrarCompraLeft} style={{ padding: '24px' }}>
              
              <div className={styles.formGrid} style={{ marginBottom: '24px' }}>
                <div className={styles.formGroupPremium} style={{ gridColumn: '1 / span 2' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <Select
                      id="idProveedor"
                      name="idProveedor"
                      label="Proveedor"
                      value={String(idProveedor)}
                      onChange={(e) => setIdProveedor(Number(e.target.value) || '')}
                      required
                      options={[
                        { value: '', label: '-- Seleccionar Proveedor --', disabled: true },
                        ...proveedores.map((p) => ({
                          value: String(p.id_proveedor),
                          label: `${p.nombre_proveedor} (${p.empresa})`
                        }))
                      ]}
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={() => setMostrarCrearProveedor(true)}
                      className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`}
                      style={{ padding: '8px 14px', whiteSpace: 'nowrap', marginBottom: '8px' }}
                      title="Agregar nuevo proveedor"
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>person_add</span>
                      Nuevo
                    </button>
                  </div>
                </div>

                <Input
                  id="fechaCompra"
                  name="fechaCompra"
                  type="date"
                  label="Fecha de Compra"
                  value={fechaCompra}
                  onChange={(e) => setFechaCompra(e.target.value)}
                  required
                />
                
                <Input
                  id="comprobante"
                  name="comprobante"
                  label="Comprobante / Nro. Factura"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Ej: FAC-001-1234"
                  required
                />

                <div className={styles.formGroupFullPremium}>
                  <TextArea
                    id="observaciones"
                    name="observaciones"
                    label="Observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales sobre esta compra..."
                    rows={1}
                  />
                </div>
              </div>

              <div className={styles.formDivider} style={{ margin: '20px 0' }} />

              {/* Búsqueda de productos */}
              <div style={{ marginBottom: '24px' }}>
                <span className={styles.sectionTitlePremium}>Agregar Productos</span>
                <div style={{ position: 'relative' }}>
                  <AdminSearch
                    value={busqProducto}
                    onChange={handleBusqProductoChange}
                    placeholder="Escriba código o nombre para buscar..."
                    delay={400}
                  />
                  {buscandoProducto && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                      <span className="material-icons" style={{ animation: 'spin 1s linear infinite', fontSize: '20px', color: 'var(--color-primary)' }}>autorenew</span>
                    </div>
                  )}
                </div>

                {/* Dropdown de Resultados */}
                {buscandoProducto && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px' }}>Buscando...</p>}
                {productosEncontrados.length > 0 && (
                  <div style={{ 
                    position: 'absolute', 
                    zIndex: 100, 
                    width: '100%', 
                    maxWidth: '500px',
                    background: 'var(--background-elevated)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    boxShadow: 'var(--shadow-lg)',
                    marginTop: '4px',
                    maxHeight: '250px',
                    overflowY: 'auto'
                  }}>
                    {productosEncontrados.map((p) => (
                      <div
                        key={p.id_producto}
                        onClick={() => agregarProducto(p)}
                        style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--background-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.nombre}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          SKU: {p.codigo} • Stock: {p.stock} • Últ. Costo: ${p.precio_compra.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {busqProducto && !buscandoProducto && productosEncontrados.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', background: 'var(--background-neutral)', borderRadius: '8px', marginTop: '8px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>No se encontró el producto</p>
                    <button onClick={() => setMostrarProductoNuevo(true)} className={`${styles.btnPremium} ${styles.btnPrimaryPremium}`} style={{ margin: '0 auto', fontSize: '12px' }}>
                      <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
                      Crear como Producto Nuevo
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de Items Agregados */}
              {items.length > 0 ? (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--background-primary)', boxShadow: 'var(--shadow-sm)' }}>
                  <table className={styles.table} style={{ margin: 0, fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '16px' }}>Producto</th>
                        <th className={styles.textRight} style={{ width: '80px' }}>Cant.</th>
                        <th className={styles.textRight} style={{ width: '100px' }}>P. Costo</th>
                        <th className={styles.textRight} style={{ width: '100px' }}>Subtotal</th>
                        <th className={styles.textRight} style={{ width: '80px' }}>Margen</th>
                        <th style={{ width: '40px', paddingRight: '16px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const pc = Number(item.precio_unitario) || 0;
                        const pv = Number(item.precio_venta) || 0;
                        const margen = pc > 0 ? ((pv - pc) / pc) * 100 : 0;

                        return (
                          <tr key={idx}>
                            <td style={{ paddingLeft: '16px' }}>
                              <div style={{ fontWeight: 600 }}>{item.nombre_producto || item.nuevo_nombre}</div>
                              {item.es_nuevo && <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>NUEVO</span>}
                            </td>
                            <td className={styles.textRight}>
                              <input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => actualizarItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                                className={styles.formInputPremium}
                                style={{ padding: '6px 8px', textAlign: 'right', minHeight: '32px' }}
                              />
                            </td>
                            <td className={styles.textRight}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.precio_unitario}
                                onChange={(e) => actualizarItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                className={styles.formInputPremium}
                                style={{ padding: '6px 8px', textAlign: 'right', minHeight: '32px' }}
                              />
                            </td>
                            <td className={styles.textRight} style={{ fontWeight: 700 }}>
                              ${(item.cantidad * item.precio_unitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className={styles.textRight} style={{ color: margen > 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
                              {margen.toFixed(1)}%
                            </td>
                            <td style={{ paddingRight: '16px' }}>
                              <button 
                                onClick={() => eliminarItem(idx)} 
                                style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-error-100)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                title="Quitar producto"
                              >
                                <span className="material-icons" style={{ fontSize: '18px' }}>delete_outline</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <AdminEmptyState
                  icon="inventory"
                  title="Sin productos"
                  message="Busca y agrega productos para iniciar el registro de la compra."
                />
              )}
            </div>

            {/* Columna Derecha - Resumen Dinámico */}
            <div className={styles.registrarCompraRight} style={{ padding: '24px' }}>
              <span className={styles.sectionTitlePremium}>Resumen de la Operación</span>
              
              <div className={styles.resumenBodyPremium}>
                <div className={styles.infoCardPremium}>
                  <div className={styles.detalleRowPremium}>
                    <span className={styles.detalleLabelPremium}>Proveedor</span>
                    <span className={styles.detalleValuePremium} style={{ color: proveedorSeleccionado ? 'var(--color-primary)' : 'var(--color-error)' }}>
                      {proveedorSeleccionado ? proveedorSeleccionado.nombre_proveedor : 'No seleccionado'}
                    </span>
                  </div>
                  
                  <div className={styles.resumenSplitMobile}>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Productos</span>
                      <span className={styles.detalleValuePremium}>{items.length} tipo(s)</span>
                    </div>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Total Unidades</span>
                      <span className={styles.detalleValuePremium}>{items.reduce((sum, i) => sum + i.cantidad, 0)}</span>
                    </div>
                  </div>

                  {proveedorSeleccionado && (
                    <div className={styles.detalleRowPremium} style={{ borderTop: '1px dashed var(--border-color)', borderBottom: 'none', marginTop: '4px', paddingTop: '8px' }}>
                      <span className={styles.detalleLabelPremium}>Empresa</span>
                      <span className={styles.detalleValuePremium} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{proveedorSeleccionado.empresa}</span>
                    </div>
                  )}
                </div>

                <div className={styles.totalBoxPremium}>
                  <span className={styles.totalLabelPremium}>Total a Pagar</span>
                  <span className={styles.totalValuePremium}>
                    ${totalCompra.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {error && (
                  <div style={{ padding: '12px 16px', background: 'var(--color-error-100)', border: '1px solid var(--color-error)', borderRadius: '12px', color: 'var(--color-error)', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="material-icons" style={{ fontSize: '20px' }}>error_outline</span>
                      {error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Premium */}
          <div className={styles.modalFooterPremium}>
            <button className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={onClose} disabled={registrando}>
              Cancelar
            </button>
            <button 
              className={`${styles.btnPremium} ${styles.btnPrimaryPremium}`} 
              onClick={registrarCompra}
              disabled={registrando || items.length === 0 || !idProveedor}
              style={{ minWidth: '180px' }}
            >
              <span className="material-icons">{registrando ? 'hourglass_empty' : 'check_circle'}</span>
              {registrando ? 'Procesando...' : 'Confirmar Registro'}
            </button>
          </div>
        </div>
      </div>

      {/* Modales Secundarios */}
      {mostrarCrearProveedor && (
        <ProveedorModal
          onClose={() => setMostrarCrearProveedor(false)}
          onGuardado={(p) => { setIdProveedor(p.id_proveedor); cargarProveedores(); }}
        />
      )}

      {mostrarProductoNuevo && (
        <ProductoNuevoModalRapido
          categorias={categorias}
          marcas={marcas}
          onClose={() => setMostrarProductoNuevo(false)}
          onGuardado={handleProductoNuevo}
        />
      )}
    </>
  );
});

RegistrarCompraModal.displayName = 'RegistrarCompraModal';

export default RegistrarCompraModal;
