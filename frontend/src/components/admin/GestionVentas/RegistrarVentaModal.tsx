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
import usuarioService from '../../../services/usuarioService';
import adminVentaService from '../../../services/adminVentaService';
import adminProductService from '../../../services/adminProductService';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import type { ItemVentaManual, ProductoParaVenta } from '../../../types/venta';
import { AdminSearch } from '../common';

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
  const [busqProducto, setBusqProducto] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState<ProductoParaVenta[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [items, setItems] = useState<ItemVentaManual[]>([]);

  // ── Paso 3: Pago ─────────────────────────────────────────────────────────
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'qr'>('efectivo');
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [observaciones, setObservaciones] = useState('');

  // ── Cierre con Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Búsqueda de clientes ─────────────────────────────────
  const buscarClientes = useCallback(async (q: string) => {
    if (!q.trim()) {
      setClientesEncontrados([]);
      return;
    }
    setBuscandoCliente(true);
    try {
      const res = await usuarioService.listarClientes(10, 0, q.trim());
      setClientesEncontrados(res.clientes || []);
    } catch {
      setClientesEncontrados([]);
    } finally {
      setBuscandoCliente(false);
    }
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
    setEsMostrador((prev) => {
      if (!prev) {
        setClienteSeleccionado(null);
        setBusqCliente('');
        setClientesEncontrados([]);
      }
      return !prev;
    });
  };

  // ── Búsqueda de productos ────────────────────────────────
  const buscarProductos = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProductosEncontrados([]);
      return;
    }
    setBuscandoProducto(true);
    try {
      const res = await adminProductService.listarProductos(q.trim());
      setProductosEncontrados(
        res.map((p: any) => ({
          id_producto: p.id_producto,
          nombre: p.nombre,
          codigo: p.codigo || '',
          precio_venta: parseFloat(p.precio_venta),
          stock: p.stock ?? 0,
        })),
      );
    } catch {
      setProductosEncontrados([]);
    } finally {
      setBuscandoProducto(false);
    }
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
    if (items.some((i) => i.id_producto === p.id_producto)) {
      showNotification('El producto ya fue agregado', 'warning');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id_producto: p.id_producto,
        nombre: p.nombre,
        cantidad: 1,
        stock: p.stock,
        precio_unitario: p.precio_venta,
        subtotal: p.precio_venta,
      },
    ]);
    setBusqProducto('');
    setProductosEncontrados([]);
  };

  const quitarProducto = (id: number) => setItems((prev) => prev.filter((i) => i.id_producto !== id));

  const cambiarCantidad = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id_producto !== id) return i;
        const nuevaCantidad = Math.max(1, Math.min(i.cantidad + delta, i.stock));
        return { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * i.precio_unitario };
      }),
    );
  };


  // ── Totales y formato ─────────────────────────────────────────────────────
  const totalVenta = items.reduce((s, i) => s + i.subtotal, 0);

  /** Precio en USD (catálogo — paso 2) */
  const formatUSD = (n: number) =>
    `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /** Precio en ARS ya convertido (paso 3 resumen) */
  const formatARSNum = (n: number) => `ARS ${Math.round(n).toLocaleString('es-AR')}`;

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
      await adminVentaService.registrarVentaManual({
        id_cliente: clienteSeleccionado?.id_cliente ?? null,
        items: items.map((i) => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad,
        })),
        metodo_pago: metodoPago,
        moneda,
        observaciones: observaciones.trim() || undefined,
        valor_dolar: tipoCambioUsd,
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalPremium}>
        
        {/* Header Premium */}
        <div className={styles.modalHeaderPremium}>
          <h2 className={styles.modalTitlePremium}>
            <span className="material-icons">add_shopping_cart</span>
            Registrar Venta Manual
          </h2>
          <button className={styles.closeButtonPremium} onClick={onClose} title="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body Premium */}
        <div className={styles.modalBodyPremium}>
          
          {/* Stepper Premium */}
          <div className={styles.stepperPremium}>
            {PASOS.map((label, idx) => (
              <React.Fragment key={idx}>
                <div className={`${styles.stepItemPremium} ${paso === idx ? styles.stepActivePremium : ''} ${paso > idx ? styles.stepCompletedPremium : ''}`}>
                  <div className={styles.stepCirclePremium}>
                    {paso > idx ? <span className="material-icons" style={{ fontSize: '18px' }}>check</span> : idx + 1}
                  </div>
                  <span className={styles.stepLabelPremium}>{label}</span>
                </div>
                {idx < PASOS.length - 1 && (
                  <div className={`${styles.stepLinePremium} ${paso > idx ? styles.stepLineActivePremium : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ─── PASO 1: CLIENTE ───────────────────────────────────────── */}
          {paso === 0 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div 
                className={`${styles.toggleMostrador} ${esMostrador ? styles.toggleMostradorActive : ''}`}
                onClick={toggleMostrador}
                style={{ 
                  padding: '24px', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  background: 'var(--background-secondary)',
                  transition: 'all 0.3s ease',
                  marginBottom: '24px'
                }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: esMostrador ? 'var(--color-primary)' : 'var(--border-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: esMostrador ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.3s ease'
                }}>
                  <span className="material-icons" style={{ fontSize: '28px' }}>{esMostrador ? 'check_circle' : 'storefront'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: esMostrador ? 'var(--color-primary)' : 'var(--text-primary)' }}>Venta de mostrador</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Transacción rápida sin registro de cliente en base de datos</p>
                </div>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  border: '2px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: esMostrador ? 'var(--color-primary)' : 'transparent',
                  borderColor: esMostrador ? 'var(--color-primary)' : 'var(--border-color)'
                }}>
                  {esMostrador && <span className="material-icons" style={{ color: 'white', fontSize: '16px' }}>check</span>}
                </div>
              </div>

              {!esMostrador && (
                <div style={{ animation: 'slideDown 0.3s ease' }}>
                  <span className={styles.sectionTitlePremium} style={{ marginBottom: '12px' }}>Identificar Cliente</span>
                  {clienteSeleccionado ? (
                    <div style={{ padding: '20px', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <span className="material-icons">person</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-primary)' }}>{clienteSeleccionado.nombre_cliente} {clienteSeleccionado.apellido_cliente}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{clienteSeleccionado.correo}</p>
                      </div>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        onClick={() => setClienteSeleccionado(null)}
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.searchWrapper} style={{ position: 'relative' }}>
                        <AdminSearch
                          value={busqCliente}
                          onChange={handleBusqClienteChange}
                          placeholder="Buscar cliente por nombre o correo..."
                          delay={400}
                        />
                        {buscandoCliente && (
                          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                            <span className="material-icons" style={{ animation: 'spin 1s linear infinite', fontSize: '20px', color: 'var(--color-primary)' }}>autorenew</span>
                          </div>
                        )}
                      </div>

                      {clientesEncontrados.length > 0 && (
                        <div style={{ marginTop: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--background-secondary)' }}>
                          {clientesEncontrados.map((c) => (
                            <div
                              key={c.id_cliente}
                              onClick={() => seleccionarCliente(c)}
                              className={styles.clienteResultItem}
                            >
                              <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>{c.nombre_cliente} {c.apellido_cliente}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{c.correo}</p>
                              </div>
                              <span className="material-icons" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>arrow_forward</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── PASO 2: PRODUCTOS ────────────────────────────────────── */}
          {paso === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                
                {/* Columna Búsqueda */}
                <div>
                  <span className={styles.sectionTitlePremium} style={{ marginBottom: '12px' }}>Agregar Productos</span>
                  <div className={styles.searchWrapper} style={{ position: 'relative', marginBottom: '16px' }}>
                    <AdminSearch
                      value={busqProducto}
                      onChange={handleBusqProductoChange}
                      placeholder="Nombre o código del producto..."
                      delay={400}
                    />
                    {buscandoProducto && (
                      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        <span className="material-icons" style={{ animation: 'spin 1s linear infinite', fontSize: '20px', color: 'var(--color-primary)' }}>autorenew</span>
                      </div>
                    )}
                  </div>

                  {productosEncontrados.length > 0 && (
                    <div style={{ borderRadius: '12px', border: '1px solid var(--border-color)', overflowY: 'auto', maxHeight: '400px', background: 'var(--background-secondary)' }}>
                      {productosEncontrados.map((p) => (
                        <div
                          key={p.id_producto}
                          style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: p.stock > 0 ? 'pointer' : 'default', opacity: p.stock <= 0 ? 0.6 : 1 }}
                          onClick={() => p.stock > 0 && agregarProducto(p)}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '13.5px' }}>{p.nombre}</p>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cód: {p.codigo || '—'}</span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatUSD(p.precio_venta)}</span>
                              <span style={{ fontSize: '11px', color: p.stock <= 0 ? 'var(--color-error)' : 'var(--text-secondary)' }}>Stock: {p.stock}</span>
                            </div>
                          </div>
                          {p.stock > 0 ? (
                            <span className="material-icons" style={{ color: 'var(--color-primary)', fontSize: '24px' }}>add_circle</span>
                          ) : (
                            <span style={{ fontSize: '10px', color: 'var(--color-error)', fontWeight: 700, textTransform: 'uppercase' }}>Sin Stock</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Columna Items Agregados */}
                <div style={{ padding: '20px', background: 'var(--background-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.sectionTitlePremium} style={{ marginBottom: '16px' }}>Carrito de Venta ({items.length})</span>
                  
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', marginBottom: '20px' }}>
                    {items.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span className="material-icons" style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>shopping_basket</span>
                        <p style={{ margin: 0, fontSize: '13px' }}>Selecciona productos para iniciar la venta</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {items.map((item) => (
                          <div key={item.id_producto} style={{ padding: '12px', background: 'var(--background-primary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{item.nombre}</span>
                              <button style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '0' }} onClick={() => quitarProducto(item.id_producto)}>
                                <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                              </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background-secondary)', borderRadius: '8px', padding: '2px' }}>
                                <button style={{ width: '24px', height: '24px', border: 'none', background: 'var(--background-elevated)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onClick={() => cambiarCantidad(item.id_producto, -1)} disabled={item.cantidad <= 1}>−</button>
                                <span style={{ fontWeight: 700, fontSize: '13px', minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                                <button style={{ width: '24px', height: '24px', border: 'none', background: 'var(--background-elevated)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onClick={() => cambiarCantidad(item.id_producto, 1)} disabled={item.cantidad >= item.stock}>+</button>
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '14px' }}>{formatUSD(item.subtotal)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ paddingTop: '16px', borderTop: '2px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subtotal USD</span>
                      <span style={{ fontSize: '20px', fontWeight: 900 }}>{formatUSD(totalVenta)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── PASO 3: PAGO ─────────────────────────────────────────── */}
          {paso === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Formulario de Pago */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <span className={styles.sectionTitlePremium}>Configuración del Pago</span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className={styles.formGroupPremium}>
                      <label className={styles.formLabelPremium}>Método de Pago</label>
                      <select 
                        className={styles.formSelectPremium} 
                        value={metodoPago} 
                        onChange={(e) => setMetodoPago(e.target.value as any)}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="qr">QR</option>
                      </select>
                    </div>
                    <div className={styles.formGroupPremium}>
                      <label className={styles.formLabelPremium}>Moneda</label>
                      <select 
                        className={styles.formSelectPremium} 
                        value={moneda} 
                        onChange={(e) => setMoneda(e.target.value as any)}
                      >
                        <option value="ARS">Pesos (ARS)</option>
                        <option value="USD">Dólares (USD)</option>
                      </select>
                    </div>
                  </div>

                  {moneda === 'ARS' && (
                    <div style={{ padding: '16px', background: 'var(--color-info-100)', borderRadius: '12px', border: '1px solid var(--color-info-200)', display: 'flex', gap: '12px' }}>
                      <span className="material-icons" style={{ color: 'var(--color-info)', fontSize: '20px' }}>info</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          Conversión aplicada: <strong>1 USD = {tipoCambioUsd.toLocaleString('es-AR')} ARS</strong>
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Calculado según el tipo de cambio del sistema vigente hoy.</p>
                      </div>
                    </div>
                  )}

                  <div className={styles.formGroupPremium}>
                    <label className={styles.formLabelPremium}>Notas Internas</label>
                    <textarea
                      style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--background-primary)', minHeight: '100px', fontSize: '13.5px', color: 'var(--text-primary)', transition: 'border-color 0.2s', width: '100%' }}
                      placeholder="Observaciones adicionales sobre la venta..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    />
                  </div>
                </div>

                {/* Resumen Final */}
                <div style={{ padding: '24px', background: 'var(--background-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <span className={styles.sectionTitlePremium} style={{ marginBottom: '20px' }}>Resumen de Confirmación</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Cliente</span>
                      <span className={styles.detalleValuePremium}>{esMostrador ? 'Mostrador (Final)' : `${clienteSeleccionado?.nombre_cliente} ${clienteSeleccionado?.apellido_cliente}`}</span>
                    </div>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Productos</span>
                      <span className={styles.detalleValuePremium}>{items.length} ítem(s) agregados</span>
                    </div>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Forma de Pago</span>
                      <span className={styles.detalleValuePremium} style={{ textTransform: 'capitalize' }}>{metodoPago}</span>
                    </div>
                  </div>

                  <div style={{ padding: '24px', background: 'var(--background-primary)', borderRadius: '12px', border: '2px solid var(--color-primary-100)', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Total a Cobrar</span>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {moneda === 'ARS' ? formatARSNum(totalDisplay) : formatUSD(totalDisplay)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Premium */}
        <div className={styles.modalFooterPremium}>
          {paso > 0 ? (
            <button className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={() => setPaso((p) => p - 1)} disabled={enviando}>
              <span className="material-icons">arrow_back</span>
              Atrás
            </button>
          ) : (
            <button className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
          )}

          {paso < PASOS.length - 1 ? (
            <button 
              className={`${styles.btnPremium} ${styles.btnPrimaryPremium}`} 
              onClick={() => setPaso((p) => p + 1)} 
              disabled={!puedeAvanzar()}
            >
              Siguiente Paso
              <span className="material-icons">arrow_forward</span>
            </button>
          ) : (
            <button 
              className={`${styles.btnPremium} ${styles.btnPrimaryPremium}`} 
              onClick={handleConfirmar} 
              disabled={enviando}
              style={{ paddingLeft: '32px', paddingRight: '32px' }}
            >
              <span className="material-icons">{enviando ? 'hourglass_empty' : 'check_circle'}</span>
              {enviando ? 'Registrando...' : 'Finalizar Venta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrarVentaModal;
