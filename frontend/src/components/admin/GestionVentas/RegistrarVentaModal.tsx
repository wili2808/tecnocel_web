/**
 * @file RegistrarVentaModal.tsx
 *
 * Wizard de 3 pasos para registrar una venta manual desde el panel admin.
 *
 * Paso 1 — Cliente: buscar y seleccionar cliente, o marcar como "venta de mostrador".
 * Paso 2 — Productos: buscar productos, agregar, ajustar cantidad/precio.
 * Paso 3 — Pago: elegir método de pago, moneda y observaciones. Confirmar.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import { ventaAdminService } from '../../../services/ventaAdminService';
import { usuarioService } from '../../../services/usuarioService';
import adminApi from '../../../api/axiosAdminConfig';
import type { ItemVentaManual, ProductoParaVenta } from '../../../types/venta';

// ── Tipos locales ────────────────────────────────────────────────────────────

interface ClienteOption {
  id_cliente: number;
  nombre_cliente: string;
  apellido_cliente: string;
  correo: string;
}

interface RegistrarVentaModalProps {
  onClose: () => void;
  /** Llamado después de registrar exitosamente */
  onRegistrada?: () => void;
  /** Cotización USD/ARS vigente (desde el widget de GestionVentas) */
  tipoCambioUsd: number;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const PASOS = ['Cliente', 'Productos', 'Pago'];

// ── Componente ───────────────────────────────────────────────────────────────

const RegistrarVentaModal: React.FC<RegistrarVentaModalProps> = ({ onClose, onRegistrada, tipoCambioUsd }) => {
  const { showNotification } = useNotification();

  // ── Estado wizard ────────────────────────────────────────────────────────
  const [paso, setPaso] = useState(0);
  const enviandoRef = useRef(false);
  const [enviando, setEnviando] = useState(false);

  // ── Paso 1: Cliente ──────────────────────────────────────────────────────
  const [busqCliente, setBusqCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<ClienteOption[]>([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteOption | null>(null);
  const [esMostrador, setEsMostrador] = useState(false);
  const clienteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Paso 2: Productos ────────────────────────────────────────────────────
  const [busqProducto, setBusqProducto] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState<ProductoParaVenta[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [items, setItems] = useState<ItemVentaManual[]>([]);
  const productoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Paso 3: Pago ─────────────────────────────────────────────────────────
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'qr'>('efectivo');
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [observaciones, setObservaciones] = useState('');

  // ── Cierre con Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Búsqueda de clientes (debounce 400ms) ─────────────────────────────────
  const buscarClientes = useCallback((q: string) => {
    if (clienteTimerRef.current) clearTimeout(clienteTimerRef.current);
    if (!q.trim()) { setClientesEncontrados([]); return; }
    clienteTimerRef.current = setTimeout(async () => {
      setBuscandoCliente(true);
      try {
        const res = await usuarioService.listarClientes(10, 0, q.trim());
        setClientesEncontrados(res.clientes || []);
      } catch {
        setClientesEncontrados([]);
      } finally {
        setBuscandoCliente(false);
      }
    }, 400);
  }, []);

  const handleBusqClienteChange = (v: string) => {
    setBusqCliente(v);
    buscarClientes(v);
  };

  const seleccionarCliente = (c: ClienteOption) => {
    setClienteSeleccionado(c);
    setBusqCliente('');
    setClientesEncontrados([]);
    setEsMostrador(false);
  };

  const toggleMostrador = () => {
    setEsMostrador(prev => {
      if (!prev) {
        setClienteSeleccionado(null);
        setBusqCliente('');
        setClientesEncontrados([]);
      }
      return !prev;
    });
  };

  // ── Búsqueda de productos (debounce 400ms) ────────────────────────────────
  const buscarProductos = useCallback((q: string) => {
    if (productoTimerRef.current) clearTimeout(productoTimerRef.current);
    if (!q.trim()) { setProductosEncontrados([]); return; }
    productoTimerRef.current = setTimeout(async () => {
      setBuscandoProducto(true);
      try {
        const res = await adminApi.get('/almacen/productos/buscar', { params: { termino: q.trim() } });
        // El endpoint devuelve un array directamente
        const lista: any[] = Array.isArray(res.data) ? res.data : [];
        setProductosEncontrados(lista.map((p: any) => ({
          id_producto: p.id_producto,
          nombre: p.nombre,
          codigo: p.codigo || '',
          precio_venta: parseFloat(p.precio_venta),
          stock: p.stock ?? 0
        })));
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

  const agregarProducto = (p: ProductoParaVenta) => {
    if (p.stock <= 0) {
      showNotification('El producto no tiene stock disponible', 'warning');
      return;
    }
    // Evitar duplicados
    if (items.some(i => i.id_producto === p.id_producto)) {
      showNotification('El producto ya fue agregado', 'warning');
      return;
    }
    setItems(prev => [
      ...prev,
      {
        id_producto:     p.id_producto,
        nombre:          p.nombre,
        cantidad:        1,
        precio_unitario: p.precio_venta,
        precio_catalogo: p.precio_venta,
        es_precio_manual: false,
        subtotal:        p.precio_venta
      }
    ]);
    setBusqProducto('');
    setProductosEncontrados([]);
  };

  const quitarProducto = (id: number) =>
    setItems(prev => prev.filter(i => i.id_producto !== id));

  const cambiarCantidad = (id: number, delta: number, maxStock: number) => {
    setItems(prev => prev.map(i => {
      if (i.id_producto !== id) return i;
      const nuevaCantidad = Math.max(1, Math.min(i.cantidad + delta, maxStock));
      return { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * i.precio_unitario };
    }));
  };

  const cambiarPrecio = (id: number, valor: string) => {
    const precio = parseFloat(valor);
    setItems(prev => prev.map(i => {
      if (i.id_producto !== id) return i;
      if (isNaN(precio) || precio < 0) return i;
      return {
        ...i,
        precio_unitario: precio,
        es_precio_manual: precio !== i.precio_catalogo,
        subtotal: i.cantidad * precio
      };
    }));
  };

  // ── Totales y formato ─────────────────────────────────────────────────────
  const totalVenta = items.reduce((s, i) => s + i.subtotal, 0);

  /** Precio en USD (catálogo — paso 2) */
  const formatUSD = (n: number) =>
    `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /** Precio en ARS ya convertido (paso 3 resumen) */
  const formatARSNum = (n: number) =>
    `ARS ${Math.round(n).toLocaleString('es-AR')}`;

  /** Total en la moneda de la venta */
  const totalDisplay = moneda === 'ARS' ? totalVenta * tipoCambioUsd : totalVenta;

  // ── Validación de paso ────────────────────────────────────────────────────
  const puedeAvanzar = (): boolean => {
    if (paso === 0) return esMostrador || clienteSeleccionado !== null;
    if (paso === 1) return items.length > 0;
    return true;
  };

  // ── Confirmar venta ───────────────────────────────────────────────────────
  const handleConfirmar = async () => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      await ventaAdminService.registrarVentaManual({
        id_cliente: clienteSeleccionado?.id_cliente ?? null,
        items: items.map(i => ({
          id_producto: i.id_producto,
          cantidad:    i.cantidad,
          // ARS: todos los precios se convierten USD→ARS
          // USD: solo se envía si el vendedor modificó el precio manualmente
          precio_unitario_manual: moneda === 'ARS'
            ? i.precio_unitario * tipoCambioUsd
            : (i.es_precio_manual ? i.precio_unitario : null)
        })),
        metodo_pago: metodoPago,
        moneda,
        observaciones: observaciones.trim() || undefined,
        valor_dolar: tipoCambioUsd
      });
      showNotification('Venta registrada exitosamente', 'success');
      onRegistrada?.();
      onClose();
    } catch (err: any) {
      showNotification(err.message || 'Error al registrar la venta', 'error');
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  // ── Clases de paso ────────────────────────────────────────────────────────
  const stepClass = (idx: number) => {
    if (idx < paso) return styles.stepCompleted;
    if (idx === paso) return styles.stepActive;
    return '';
  };

  const connectorClass = (idx: number) =>
    idx < paso ? styles.stepConnectorCompleted : '';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`${styles.modal} ${styles.modalLarge}`}>

        {/* Encabezado */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className="material-icons">add_shopping_cart</span>
            Registrar Venta Manual
          </h2>
          <button className={styles.closeButton} onClick={onClose} title="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Cuerpo */}
        <div className={styles.modalBody}>

          {/* Indicador de pasos */}
          <div className={styles.steps}>
            {PASOS.map((label, idx) => (
              <React.Fragment key={idx}>
                <div className={`${styles.stepItem}`}>
                  <div className={`${styles.step} ${stepClass(idx)}`}>
                    <div className={styles.stepNumber}>
                      {idx < paso
                        ? <span className="material-icons" style={{ fontSize: 16 }}>check</span>
                        : idx + 1
                      }
                    </div>
                    <span className={styles.stepLabel}>{label}</span>
                  </div>
                </div>
                {idx < PASOS.length - 1 && (
                  <div className={`${styles.stepConnector} ${connectorClass(idx)}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ─── PASO 1: CLIENTE ───────────────────────────────────────── */}
          {paso === 0 && (
            <div>
              {/* Toggle mostrador */}
              <button
                className={`${styles.toggleMostrador} ${esMostrador ? styles.toggleMostradorActive : ''}`}
                onClick={toggleMostrador}
                type="button"
              >
                <span className="material-icons">{esMostrador ? 'check_circle' : 'storefront'}</span>
                Venta de mostrador (sin cliente registrado)
              </button>

              {!esMostrador && (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  {/* Cliente ya seleccionado */}
                  {clienteSeleccionado ? (
                    <div className={styles.clienteSeleccionado}>
                      <div className={styles.clienteSeleccionadoInfo}>
                        <span className={styles.clienteSeleccionadoNombre}>
                          {clienteSeleccionado.nombre_cliente} {clienteSeleccionado.apellido_cliente}
                        </span>
                        <span className={styles.clienteSeleccionadoEmail}>
                          {clienteSeleccionado.correo}
                        </span>
                      </div>
                      <button
                        className={styles.clienteRemoveButton}
                        onClick={() => setClienteSeleccionado(null)}
                        title="Quitar cliente"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Buscador de clientes */}
                      <div className={styles.searchWrapper}>
                        <span className={`material-icons ${styles.searchIcon}`}>search</span>
                        <input
                          type="text"
                          className={styles.searchInput}
                          placeholder="Buscar cliente por nombre o correo..."
                          value={busqCliente}
                          onChange={e => handleBusqClienteChange(e.target.value)}
                          autoFocus
                        />
                      </div>

                      {/* Resultados */}
                      {buscandoCliente && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', padding: '4px 0' }}>
                          Buscando...
                        </p>
                      )}
                      {clientesEncontrados.length > 0 && (
                        <div className={styles.clienteResults}>
                          {clientesEncontrados.map(c => (
                            <div
                              key={c.id_cliente}
                              className={styles.clienteResultItem}
                              onClick={() => seleccionarCliente(c)}
                            >
                              <span className={styles.clienteResultNombre}>
                                {c.nombre_cliente} {c.apellido_cliente}
                              </span>
                              <span className={styles.clienteResultEmail}>{c.correo}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {busqCliente && !buscandoCliente && clientesEncontrados.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
                          Sin resultados para "{busqCliente}"
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── PASO 2: PRODUCTOS ────────────────────────────────────── */}
          {paso === 1 && (
            <div>
              {/* Buscador de productos */}
              <div className={styles.searchWrapper} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <span className={`material-icons ${styles.searchIcon}`}>search</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar producto por nombre o código..."
                  value={busqProducto}
                  onChange={e => handleBusqProductoChange(e.target.value)}
                  autoFocus
                />
              </div>

              {buscandoProducto && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', padding: '4px 0' }}>
                  Buscando...
                </p>
              )}

              {productosEncontrados.length > 0 && (
                <div className={styles.productosResults}>
                  {productosEncontrados.map(p => (
                    <div
                      key={p.id_producto}
                      className={`${styles.productoResultItem} ${p.stock <= 0 ? '' : ''}`}
                      onClick={() => agregarProducto(p)}
                    >
                      <div>
                        <div className={styles.productoResultNombre}>{p.nombre}</div>
                        <div className={styles.productoResultMeta}>
                          <span>Cód: {p.codigo || '—'}</span>
                          <span>Precio: {formatUSD(p.precio_venta)}</span>
                          <span className={p.stock <= 0 ? styles.productoResultSinStock : ''}>
                            Stock: {p.stock}
                          </span>
                        </div>
                      </div>
                      <span className="material-icons" style={{ color: 'var(--color-primary)' }}>add_circle</span>
                    </div>
                  ))}
                </div>
              )}

              {busqProducto && !buscandoProducto && productosEncontrados.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic', marginBottom: 'var(--spacing-sm)' }}>
                  Sin resultados para "{busqProducto}"
                </p>
              )}

              {/* Lista de items agregados */}
              {items.length > 0 && (
                <div className={styles.itemsAgregados}>
                  <div className={styles.itemsAgregadosHeader}>
                    <span className={styles.itemsAgregadosTitle}>Productos ({items.length})</span>
                  </div>

                  {items.map(item => {
                    const productoEncontrado = productosEncontrados.find(p => p.id_producto === item.id_producto);
                    const maxStock = productoEncontrado?.stock ?? 50;
                    return (
                      <div key={item.id_producto} className={styles.itemRow}>
                        <span className={styles.itemNombre}>{item.nombre}</span>

                        {/* Controles de cantidad */}
                        <div className={styles.itemCantidadControls}>
                          <button
                            className={styles.cantidadButton}
                            onClick={() => cambiarCantidad(item.id_producto, -1, maxStock)}
                            disabled={item.cantidad <= 1}
                          >−</button>
                          <span className={styles.cantidadValue}>{item.cantidad}</span>
                          <button
                            className={styles.cantidadButton}
                            onClick={() => cambiarCantidad(item.id_producto, 1, maxStock)}
                            disabled={item.cantidad >= maxStock}
                          >+</button>
                        </div>

                        {/* Precio editable */}
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className={`${styles.precioInput} ${item.es_precio_manual ? styles.precioInputManual : ''}`}
                          value={item.precio_unitario}
                          onChange={e => cambiarPrecio(item.id_producto, e.target.value)}
                          title={item.es_precio_manual ? 'Precio personalizado' : 'Precio catálogo'}
                        />

                        <span className={styles.itemSubtotal}>{formatUSD(item.subtotal)}</span>

                        <button
                          className={styles.itemRemoveButton}
                          onClick={() => quitarProducto(item.id_producto)}
                          title="Quitar producto"
                        >
                          <span className="material-icons">delete_outline</span>
                        </button>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className={styles.totalBar}>
                    <span className={styles.totalLabel}>Total:</span>
                    <span className={styles.totalValue}>{formatUSD(totalVenta)}</span>
                  </div>
                </div>
              )}

              {items.length === 0 && !busqProducto && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic', padding: 'var(--spacing-xl) 0' }}>
                  Busca un producto para agregarlo a la venta
                </p>
              )}
            </div>
          )}

          {/* ─── PASO 3: PAGO ─────────────────────────────────────────── */}
          {paso === 2 && (
            <div className={styles.pagoForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="metodo-pago">Método de pago *</label>
                  <select
                    id="metodo-pago"
                    className={styles.select}
                    value={metodoPago}
                    onChange={e => setMetodoPago(e.target.value as typeof metodoPago)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="qr">QR</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="moneda">Moneda</label>
                  <select
                    id="moneda"
                    className={styles.select}
                    value={moneda}
                    onChange={e => setMoneda(e.target.value as 'ARS' | 'USD')}
                  >
                    <option value="ARS">Pesos (ARS)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>

              {moneda === 'ARS' && (
                <div className={styles.cotizacionAviso}>
                  <span className="material-icons">info</span>
                  Precios del catálogo en USD — cotización aplicada:&nbsp;
                  <strong>
                    1 USD = {tipoCambioUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                  </strong>
                  <span className={styles.cotizacionAvisoSub}>
                    Total en ARS: <strong>{formatARSNum(totalVenta * tipoCambioUsd)}</strong>
                  </span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="observaciones">Observaciones</label>
                <textarea
                  id="observaciones"
                  className={styles.textarea}
                  placeholder="Notas adicionales sobre la venta (opcional)..."
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  maxLength={500}
                />
              </div>

              {/* Resumen */}
              <div className={styles.resumenCard}>
                <div className={styles.resumenRow}>
                  <span className={styles.resumenLabel}>Cliente</span>
                  <span className={styles.resumenValue}>
                    {esMostrador
                      ? 'Mostrador (sin cliente)'
                      : clienteSeleccionado
                        ? `${clienteSeleccionado.nombre_cliente} ${clienteSeleccionado.apellido_cliente}`
                        : '—'
                    }
                  </span>
                </div>
                <div className={styles.resumenRow}>
                  <span className={styles.resumenLabel}>Productos</span>
                  <span className={styles.resumenValue}>{items.length} ítem(s)</span>
                </div>
                <div className={styles.resumenRow}>
                  <span className={styles.resumenLabel}>Método de pago</span>
                  <span className={styles.resumenValue}>
                    {ventaAdminService.formatearMetodoPago(metodoPago)}
                  </span>
                </div>
                <div className={styles.resumenRow}>
                  <span className={styles.resumenLabel}>Moneda</span>
                  <span className={styles.resumenValue}>{moneda}</span>
                </div>
                <div className={`${styles.resumenRow} ${styles.resumenTotal}`}>
                  <span className={styles.resumenLabel}>Total</span>
                  <span className={styles.resumenValue}>
                    {moneda === 'ARS' ? formatARSNum(totalDisplay) : formatUSD(totalDisplay)}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Pie */}
        <div className={`${styles.modalFooter} ${styles.modalFooterLeft}`}>
          {/* Izquierda: botón atrás o cancelar */}
          {paso > 0 ? (
            <button className={styles.backButton} onClick={() => setPaso(p => p - 1)} disabled={enviando}>
              <span className="material-icons">arrow_back</span>
              Atrás
            </button>
          ) : (
            <button className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
          )}

          {/* Derecha: siguiente o confirmar */}
          {paso < PASOS.length - 1 ? (
            <button
              className={styles.nextButton}
              onClick={() => setPaso(p => p + 1)}
              disabled={!puedeAvanzar()}
            >
              Siguiente
              <span className="material-icons">arrow_forward</span>
            </button>
          ) : (
            <button
              className={styles.submitButton}
              onClick={handleConfirmar}
              disabled={enviando}
            >
              <span className="material-icons">check_circle</span>
              {enviando ? 'Registrando...' : 'Confirmar Venta'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default RegistrarVentaModal;
