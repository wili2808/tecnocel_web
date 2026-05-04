import React, { useState, useRef, useCallback, useMemo } from 'react';
import usuarioService from '../../../services/usuarioService';
import adminVentaService from '../../../services/adminVentaService';
import adminProductService from '../../../services/adminProductService';
import { useNotification } from '../../../contexts/NotificationContext';
import type { ItemVentaManual, ProductoParaVenta } from '../../../types/venta';
import { AdminSearch, AdminDataTable } from '../common';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import Select from '../../common/Select/Select';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './VentaModals.module.css';

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

  // ── Estados para AdminDataTable (Carrito) ─────────────────────────
  const [cartSorting, setCartSorting] = useState<SortingState>([]);
  const [cartPagination, setCartPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [cartColumnOrder, setCartColumnOrder] = useState<string[]>(['nombre', 'cantidad', 'precio', 'subtotal', 'accion']);

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
    setEsMostrador((prev: boolean) => {
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
        res.items.map((p: any) => ({
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
    if (items.some((i: ItemVentaManual) => i.id_producto === p.id_producto)) {
      showNotification('El producto ya fue agregado', 'warning');
      return;
    }
    setItems((prev: ItemVentaManual[]) => [
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

  const quitarProducto = (id: number) => setItems((prev: ItemVentaManual[]) => prev.filter((i: ItemVentaManual) => i.id_producto !== id));

  const cambiarCantidad = (id: number, delta: number) => {
    setItems((prev: ItemVentaManual[]) =>
      prev.map((i: ItemVentaManual) => {
        if (i.id_producto !== id) return i;
        const nuevaCantidad = Math.max(1, Math.min(i.cantidad + delta, i.stock));
        return { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * i.precio_unitario };
      }),
    );
  };

  // ── Columnas Carrito ─────────────────────────────────────
  const cartColumns = useMemo<ColumnDef<ItemVentaManual>[]>(() => [
    {
      accessorKey: 'nombre',
      id: 'nombre',
      header: 'Producto',
      cell: (info) => <span className="font-bold text-sm">{info.getValue() as string}</span>,
    },
    {
      id: 'cantidad',
      header: () => <div className="text-center">Cantidad</div>,
      cell: (info) => {
        const item = info.row.original;
        return (
          <div className="flex justify-center" onClick={e => e.stopPropagation()}>
            <div className="modalQtyControlPremium">
              <button 
                className="modalQtyBtnPremium" 
                onClick={() => cambiarCantidad(item.id_producto, -1)} 
                disabled={item.cantidad <= 1}
              >−</button>
              <span className="modalQtyValuePremium">{item.cantidad}</span>
              <button 
                className="modalQtyBtnPremium" 
                onClick={() => cambiarCantidad(item.id_producto, 1)} 
                disabled={item.cantidad >= item.stock}
              >+</button>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'precio_unitario',
      id: 'precio',
      header: () => <div className="text-right">P. Unit</div>,
      cell: (info) => <div className="text-right text-xs">{formatUSD(info.getValue() as number)}</div>,
    },
    {
      accessorKey: 'subtotal',
      id: 'subtotal',
      header: () => <div className="text-right">Subtotal</div>,
      cell: (info) => <div className="text-right font-bold text-primary">{formatUSD(info.getValue() as number)}</div>,
    },
    {
      id: 'accion',
      header: '',
      enableSorting: false,
      cell: (info) => (
        <div className="text-right">
          <button 
            className="modalIconButtonPremium" 
            style={{ color: 'var(--color-error)' }} 
            onClick={(e) => { e.stopPropagation(); quitarProducto(info.row.original.id_producto); }}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
          </button>
        </div>
      )
    }
  ], [cambiarCantidad, quitarProducto]);

  // ── Totales y formato ─────────────────────────────────────────────────────
  const totalVenta = items.reduce((s: number, i: ItemVentaManual) => s + i.subtotal, 0);

  const formatUSD = (n: number) =>
    `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatARSNum = (n: number) => `ARS ${Math.round(n).toLocaleString('es-AR')}`;

  const totalDisplay = moneda === 'ARS' ? totalVenta * tipoCambioUsd : totalVenta;

  const puedeAvanzar = (): boolean => {
    if (paso === 0) return esMostrador || clienteSeleccionado !== null;
    if (paso === 1) return items.length > 0;
    return true;
  };

  const handleConfirmar = async () => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      await adminVentaService.registrarVentaManual({
        id_cliente: clienteSeleccionado?.id_cliente ?? null,
        items: items.map((i: ItemVentaManual) => ({
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

  return (
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title="Registrar Venta Manual"
      icon="add_shopping_cart"
      maxWidth="1000px"
    >
      <div className="modalBodyPremium">
        
        {/* Stepper Premium */}
        <div className={`stepperPremium ${styles.stepper}`}>
          {PASOS.map((label, idx) => (
            <React.Fragment key={idx}>
              <div className={`stepItemPremium ${paso === idx ? 'stepActivePremium' : ''} ${paso > idx ? 'stepCompletedPremium' : ''}`}>
                <div className="stepCirclePremium">
                  {paso > idx ? <span className={`material-icons ${styles.stepIcon}`}>check</span> : idx + 1}
                </div>
                <span className="stepLabelPremium">{label}</span>
              </div>
              {idx < PASOS.length - 1 && (
                <div className={`stepLinePremium ${paso > idx ? 'stepLineActivePremium' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ─── PASO 1: CLIENTE ───────────────────────────────────────── */}
        {paso === 0 && (
          <div className="animate-fade-in">
            <div 
              className={`modalToggleCardPremium ${esMostrador ? 'modalToggleCardActivePremium' : ''} ${styles.toggleCard}`}
              onClick={toggleMostrador}
            >
              <div className="modalToggleIconBoxPremium">
                <span className={`material-icons ${styles.toggleIcon}`}>{esMostrador ? 'check_circle' : 'storefront'}</span>
              </div>
              <div className="modalToggleContentPremium">
                <p className="modalToggleTitlePremium">Venta de mostrador</p>
                <p className="modalToggleDescPremium">Transacción rápida sin registro de cliente en base de datos</p>
              </div>
              <div className="modalToggleCheckPremium">
                {esMostrador && <span className="material-icons" style={{ fontSize: '16px' }}>check</span>}
              </div>
            </div>

            {!esMostrador && (
              <div className="animate-slide-down">
                <span className="modalSectionTitlePremium">Identificar Cliente</span>
                {clienteSeleccionado ? (
                  <div className="modalAlertWarningPremium mb-4" style={{ background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200)', color: 'var(--color-primary)' }}>
                    <span className="material-icons">person</span>
                    <div className="flex-1">
                      <p className="m-0 font-bold">{clienteSeleccionado.nombre_cliente} {clienteSeleccionado.apellido_cliente}</p>
                      <p className="m-0 text-xxs opacity-80">{clienteSeleccionado.correo}</p>
                    </div>
                    <button 
                      className="modalIconButtonPremium"
                      onClick={() => setClienteSeleccionado(null)}
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.clientSearchWrapper}>
                      <AdminSearch
                        value={busqCliente}
                        onChange={handleBusqClienteChange}
                        placeholder="Buscar cliente por nombre o correo..."
                        delay={400}
                      />
                      {buscandoCliente && (
                        <div className={styles.searchLoading}>
                          <span className="material-icons">autorenew</span>
                        </div>
                      )}
                    </div>

                    {clientesEncontrados.length > 0 && (
                      <div className={`modalTablePremium ${styles.resultsTable}`}>
                        {clientesEncontrados.map((c: ClienteOption) => (
                          <div
                            key={c.id_cliente}
                            onClick={() => seleccionarCliente(c)}
                            className={styles.resultItem}
                          >
                            <div className="flex items-center gap-md">
                              <p className="m-0 font-bold text-sm" style={{ minWidth: '150px' }}>{c.nombre_cliente} {c.apellido_cliente}</p>
                              <p className="m-0 text-xxs text-secondary whitespace-nowrap">{c.correo}</p>
                            </div>
                            <span className={`material-icons text-primary ${styles.resultItemIcon}`}>arrow_forward</span>
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

        {paso === 1 && (
          <div className="animate-fade-in">
            {/* Buscador de Productos */}
            <div className="mb-6">
              <span className="modalSectionTitlePremium">Agregar Productos al Carrito</span>
              <div className={styles.clientSearchWrapper}>
                <AdminSearch
                  value={busqProducto}
                  onChange={handleBusqProductoChange}
                  placeholder="Nombre o código del producto..."
                  delay={400}
                />
                {buscandoProducto && (
                  <div className={styles.searchLoading}>
                    <span className="material-icons">autorenew</span>
                  </div>
                )}
              </div>

              {productosEncontrados.length > 0 && (
                <div className={`modalTablePremium ${styles.resultsTable}`} style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '10px' }}>
                  {productosEncontrados.map((p: ProductoParaVenta) => (
                    <div
                      key={p.id_producto}
                      className={styles.resultItem}
                      style={{ opacity: p.stock <= 0 ? 0.6 : 1, cursor: p.stock > 0 ? 'pointer' : 'default' }}
                      onClick={() => p.stock > 0 && agregarProducto(p)}
                    >
                      <div className="flex-1 flex items-center gap-md">
                        <p className="m-0 font-bold text-sm" style={{ minWidth: '150px' }}>{p.nombre}</p>
                        <div className="flex items-center gap-md">
                          <span className="text-xxs text-secondary whitespace-nowrap">Cód: {p.codigo || '—'}</span>
                          <span className="text-xxs font-bold text-primary whitespace-nowrap">{formatUSD(p.precio_venta)}</span>
                          <span className={`text-xxs whitespace-nowrap ${p.stock <= 0 ? 'text-primary' : 'text-secondary'}`} style={{ color: p.stock <= 0 ? 'var(--color-error)' : '' }}>Stock: {p.stock}</span>
                        </div>
                      </div>
                      {p.stock > 0 ? (
                        <span className="material-icons text-primary" style={{ fontSize: '24px' }}>add_circle</span>
                      ) : (
                        <span className="text-xxs font-bold" style={{ color: 'var(--color-error)', textTransform: 'uppercase' }}>Sin Stock</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Carrito de Venta - Tabla Estándar */}
            <div className="mt-8">
              <span className="modalSectionTitlePremium">Carrito de Venta ({items.length})</span>
              <div className="mt-2 mb-4">
                  <AdminDataTable
                    data={items}
                    columns={cartColumns}
                    sorting={cartSorting}
                    onSortingChange={setCartSorting}
                    columnOrder={cartColumnOrder}
                    onColumnOrderChange={setCartColumnOrder}
                    pagination={cartPagination}
                    onPaginationChange={setCartPagination}
                    totalItems={items.length}
                    itemLabel="items"
                    manualPagination={false}
                    emptyMessage="El carrito está vacío. Agrega productos arriba."
                  />
              </div>

              <div className="flex">
                <div className={`modalTotalBoxPremium ml-auto ${styles.totalBox}`} style={{ minWidth: '250px' }}>
                  <span className="modalTotalLabelPremium">Total Operación (USD)</span>
                  <span className={`modalTotalValuePremium ${styles.totalValue}`}>{formatUSD(totalVenta)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── PASO 3: PAGO ─────────────────────────────────────────── */}
        {paso === 2 && (
          <div className="animate-fade-in">
            <div className="modalSplitLayoutPremium">
              
              {/* Formulario de Pago */}
              <div className="modalMainColumnPremium">
                <span className="modalSectionTitlePremium">Configuración del Pago</span>
                
                <div className="modalFormGridPremium">
                  <Select
                    id="metodoPago"
                    name="metodoPago"
                    label="Método de Pago"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as any)}
                    options={[
                      { value: 'efectivo', label: 'Efectivo' },
                      { value: 'tarjeta', label: 'Tarjeta' },
                      { value: 'transferencia', label: 'Transferencia' },
                      { value: 'qr', label: 'QR' }
                    ]}
                  />
                  <Select
                    id="moneda"
                    name="moneda"
                    label="Moneda"
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value as any)}
                    options={[
                      { value: 'ARS', label: 'Pesos (ARS)' },
                      { value: 'USD', label: 'Dólares (USD)' }
                    ]}
                  />
                </div>

                {moneda === 'ARS' && (
                  <div className={`modalAlertWarningPremium ${styles.infoAlert}`}>
                    <span className="material-icons">info</span>
                    <div>
                      <p className="m-0 text-sm">
                        Conversión aplicada: <strong>1 USD = {tipoCambioUsd.toLocaleString('es-AR')} ARS</strong>
                      </p>
                      <p className="m-0 text-xxs opacity-70">Calculado según el tipo de cambio del sistema vigente hoy.</p>
                    </div>
                  </div>
                )}

                <TextArea
                  id="observaciones"
                  name="observaciones"
                  label="Notas Internas"
                  placeholder="Observaciones adicionales sobre la venta..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Resumen Final */}
              <div className="modalSideColumnPremium">
                <span className="modalSectionTitlePremium">Resumen de Confirmación</span>
                
                <div className={`modalResumenCardPremium ${styles.resumenCard}`}>
                  <div className="modalResumenRowPremium">
                    <span className="text-secondary">Cliente</span>
                    <span className="font-bold">{esMostrador ? 'Mostrador' : `${clienteSeleccionado?.nombre_cliente}`}</span>
                  </div>
                  <div className="modalResumenRowPremium">
                    <span className="text-secondary">Items</span>
                    <span className="font-bold">{items.length}</span>
                  </div>
                  <div className="modalResumenRowPremium">
                    <span className="text-secondary">Pago</span>
                    <span className="font-bold" style={{ textTransform: 'capitalize' }}>{metodoPago}</span>
                  </div>
                </div>

                <div className="modalTotalBoxPremium">
                  <span className="modalTotalLabelPremium">Total a Cobrar</span>
                  <span className="modalTotalValuePremium">
                    {moneda === 'ARS' ? formatARSNum(totalDisplay) : formatUSD(totalDisplay)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="modalFooterPremium">
        {paso > 0 ? (
          <button className="btnPremium btnSecondaryPremium" onClick={() => setPaso((p) => p - 1)} disabled={enviando}>
            <span className="material-icons">arrow_back</span>
            Atrás
          </button>
        ) : (
          <button className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
        )}

        <div className="flex-1" />

        {paso < PASOS.length - 1 ? (
          <button 
            className="btnPremium btnPrimaryPremium" 
            onClick={() => setPaso((p) => p + 1)} 
            disabled={!puedeAvanzar()}
          >
            Siguiente Paso
            <span className="material-icons">arrow_forward</span>
          </button>
        ) : (
          <button 
            className="btnPremium btnPrimaryPremium" 
            onClick={handleConfirmar} 
            disabled={enviando}
          >
            <span className="material-icons">{enviando ? 'hourglass_empty' : 'check_circle'}</span>
            {enviando ? 'Registrando...' : 'Finalizar Venta'}
          </button>
        )}
      </div>
    </PremiumModal>
  );
};

export default RegistrarVentaModal;
