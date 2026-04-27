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
      // Cargar categorías
      const resCat = await adminProductService.obtenerCategorias();
      setCategorias(resCat);

      // Cargar marcas
      const resMar = await adminProductService.obtenerMarcas();
      setMarcas(resMar);
    } catch (err) {
      console.error('Error cargando categorías/marcas:', err);
    }
  };

  // Búsqueda de productos (debounce 400ms)
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

  // Agregar producto existente
  const agregarProducto = (p: ProductoParaBuscar) => {
    // Evitar duplicados
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

  // Agregar producto nuevo (abre modal)
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

  // Actualizar item
  const actualizarItem = (index: number, field: string, value: any) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  // Eliminar item
  const eliminarItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Registrar compra
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

    // Validar items
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

  // Cálculos
  const totalCompra = items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);

  const proveedorSeleccionado = proveedores.find((p) => p.id_proveedor === idProveedor);

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={`${styles.modalContent} ${styles.registrarCompraModal}`} onClick={(e) => e.stopPropagation()}>
          {/* Encabezado */}
          <div className={styles.modalHeader}>
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(14px, 5vw, 18px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              🛒 Nueva Compra a Proveedor
            </h2>
            <button
              onClick={onClose}
              disabled={registrando}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 'clamp(20px, 6vw, 24px)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0',
                width: 'clamp(28px, 8vw, 32px)',
                height: 'clamp(28px, 8vw, 32px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              ✕
            </button>
          </div>

          {/* Cuerpo - Dos columnas */}
          <div className={styles.registrarCompraGrid}>
            {/* Columna Izquierda - Formulario */}
            <div className={styles.registrarCompraLeft}>
              {/* Proveedor */}
              <div
                style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}
              >
                <label className={styles.formLabel} style={{ marginBottom: '8px' }}>
                  Proveedor *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={idProveedor}
                    onChange={(e) => setIdProveedor(Number(e.target.value) || '')}
                    className={styles.formSelect}
                    style={{ flex: 1 }}
                  >
                    <option value="">-- Seleccionar --</option>
                    {proveedores.map((p) => (
                      <option key={p.id_proveedor} value={p.id_proveedor}>
                        {p.nombre_proveedor} ({p.empresa})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setMostrarCrearProveedor(true)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              {/* Datos de compra */}
              <div className={styles.formRow2Cols}>
                <div className={styles.formGroupInput}>
                  <label className={styles.formLabel}>Fecha *</label>
                  <input
                    type="date"
                    value={fechaCompra}
                    onChange={(e) => setFechaCompra(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroupInput}>
                  <label className={styles.formLabel}>Comprobante *</label>
                  <input
                    type="text"
                    value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                    placeholder="FAC-001234"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroupInput} style={{ marginBottom: '16px' }}>
                <label className={styles.formLabel}>Observaciones (opcional)</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas sobre esta compra..."
                  className={styles.formTextarea}
                />
              </div>

              {/* Búsqueda de productos */}
              <div
                style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}
              >
                <label className={styles.formLabel} style={{ marginBottom: '8px' }}>
                  Buscar Producto
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={busqProducto}
                    onChange={(e) => handleBusqProductoChange(e.target.value)}
                    placeholder="Código o nombre..."
                    className={styles.formInput}
                    style={{ paddingLeft: 'clamp(24px, 8vw, 32px)' }}
                  />
                  <span
                    className="material-icons"
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 'clamp(16px, 4vw, 18px)',
                      color: 'var(--text-secondary)',
                      pointerEvents: 'none',
                    }}
                  >
                    search
                  </span>
                </div>

                {/* Resultados de búsqueda */}
                {buscandoProducto && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Buscando...</p>
                )}
                {productosEncontrados.length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {productosEncontrados.map((p) => (
                      <div
                        key={p.id_producto}
                        onClick={() => agregarProducto(p)}
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'background-color var(--transition-fast) var(--transition-curve)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-secondary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {p.codigo} • Stock: {p.stock} • Costo: ${p.precio_compra.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {busqProducto && !buscandoProducto && productosEncontrados.length === 0 && (
                  <div style={{ marginTop: '8px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>No encontrado</p>
                    <button
                      onClick={() => setMostrarProductoNuevo(true)}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: 'none',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      ⊕ Crear producto
                    </button>
                  </div>
                )}
              </div>

              {/* Items agregados */}
              {items.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Productos agregados ({items.length})
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr
                          style={{
                            backgroundColor: 'var(--background-secondary)',
                            borderBottom: '1px solid var(--border-color)',
                          }}
                        >
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Producto</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Cantidad</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>P. Unit.</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Margen</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>⊗</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const subtotal = item.cantidad * item.precio_unitario;
                          // Usar precio_venta si es válido (> 0), sino usar precio_unitario
                          const pv = Number(item.precio_venta) || 0;
                          const pc = Number(item.precio_unitario) || 0;
                          const precioVenta = pv > 0 ? pv : pc;

                          // Calcular margen: ((venta - compra) / compra) * 100
                          const margen = pc > 0 ? ((precioVenta - pc) / pc) * 100 : 0;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px' }}>
                                <div style={{ fontWeight: 500 }}>{item.nombre_producto || item.nuevo_nombre}</div>
                                {item.es_nuevo && (
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    nuevo: {item.nuevo_codigo}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.cantidad}
                                  onChange={(e) => actualizarItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                                  style={{
                                    width: 'clamp(45px, 12vw, 60px)',
                                    padding: '4px 6px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    textAlign: 'right',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.precio_unitario.toFixed(2)}
                                  onChange={(e) =>
                                    actualizarItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)
                                  }
                                  style={{
                                    width: 'clamp(55px, 15vw, 80px)',
                                    padding: '4px 6px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    textAlign: 'right',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                                ${subtotal.toFixed(2)}
                              </td>
                              <td
                                style={{
                                  padding: '8px',
                                  textAlign: 'right',
                                  color: margen > 0 ? '#166534' : '#991b1b',
                                  fontWeight: 500,
                                }}
                              >
                                {margen > 0 ? '+' : ''}
                                {margen.toFixed(1)}%
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <button
                                  onClick={() => eliminarItem(idx)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-error)',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                  }}
                                  title="Eliminar"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {items.length === 0 && (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                  }}
                >
                  <p>Busca y agrega productos para continuar</p>
                </div>
              )}
            </div>

            {/* Columna resumen (sticky) */}
            <div className={styles.registrarCompraRight}>
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    margin: '0 0 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  RESUMEN LIVE
                </p>
              </div>

              {/* Proveedor */}
              {idProveedor && proveedorSeleccionado ? (
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>Proveedor</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
                    {proveedorSeleccionado.nombre_proveedor}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {proveedorSeleccionado.empresa}
                  </p>
                </div>
              ) : (
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0', fontStyle: 'italic' }}>
                    Selecciona un proveedor
                  </p>
                </div>
              )}

              {/* Items y cantidades */}
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 600 }}>
                    Productos
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
                    {items.length}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 600 }}>
                    Unidades
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                    {items.reduce((sum, i) => sum + i.cantidad, 0)}
                  </p>
                </div>
              </div>

              {/* Total - Destacado */}
              <div
                style={{
                  padding: '14px',
                  background: 'var(--background-primary)',
                  borderRadius: '8px',
                  borderTop: '2px solid var(--color-primary)',
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    margin: '0 0 6px',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                >
                  Monto Total
                </p>
                <p
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--color-primary)',
                    fontFamily: 'monospace',
                  }}
                >
                  ${totalCompra.toFixed(2)}
                </p>
              </div>

              {/* Error si existe */}
              {error && (
                <div
                  style={{
                    padding: '12px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#991b1b',
                    fontSize: '12px',
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              onClick={onClose}
              disabled={registrando}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)',
                transition: 'background-color 0.2s',
                opacity: registrando ? 0.5 : 1,
              }}
              onMouseEnter={(e) =>
                !registrando && (e.currentTarget.style.backgroundColor = 'var(--background-secondary)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-primary)')}
            >
              Cancelar
            </button>
            <button
              onClick={registrarCompra}
              disabled={registrando || items.length === 0 || !idProveedor}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)',
                transition: 'background-color 0.2s',
                opacity: registrando || items.length === 0 || !idProveedor ? 0.5 : 1,
              }}
              onMouseEnter={(e) =>
                !registrando &&
                items.length > 0 &&
                idProveedor &&
                (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
            >
              {registrando ? 'Registrando...' : 'Registrar Compra'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de nuevo proveedor */}
      {mostrarCrearProveedor && (
        <ProveedorModal
          onClose={() => setMostrarCrearProveedor(false)}
          onGuardado={(proveedor) => {
            setIdProveedor(proveedor.id_proveedor);
            setMostrarCrearProveedor(false);
            cargarProveedores();
          }}
        />
      )}

      {/* Modal de nuevo producto */}
      {mostrarProductoNuevo && (
        <ProductoNuevoModalRapido
          precioCompraBase={0}
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
