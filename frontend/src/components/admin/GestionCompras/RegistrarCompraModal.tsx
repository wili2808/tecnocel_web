import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import proveedorAdminService from '../../../services/proveedorAdminService';
import adminProductService from '../../../services/adminProductService';
import ProductoModal from '../GestionProductos/ProductoModal';
import ProveedorModal from './ProveedorModal';
import { useNotification } from '../../../contexts/NotificationContext';
import type { RegistrarCompraData, ProveedorListItem } from '../../../types';
import type { ProductoStockBajo } from '../../../types/reporte';
import { AdminSearch, AdminEmptyState, AdminDataTable } from '../common';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS, formatUSD } from '../../../utils/formatPrecio';

import styles from './CompraModals.module.css';

// ── Tipos locales ────────────────────────────────────────────────────────────
// ... (rest of imports and types remain the same)

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
  const { tipoCambio, cargando: cargandoTC, esConfiable } = useTipoCambio();

  // ── Estados de Formulario ──────────────────────────────────────────
  const [idProveedor, setIdProveedor] = useState<number>(0);
  const [comprobante, setComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemForm[]>([]);
  
  // ── Estados de UI ──────────────────────────────────────────────────
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ── Catálogos y Búsqueda ──────────────────────────────────────────
  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [busqProducto, setBusqProducto] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState<ProductoParaBuscar[]>([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  
  // ── Modales Secundarios ────────────────────────────────────────────
  const [mostrarCrearProveedor, setMostrarCrearProveedor] = useState(false);
  const [mostrarProductoNuevo, setMostrarProductoNuevo] = useState(false);

  // ── Estados para AdminDataTable ────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'producto', 'cantidad', 'costo', 'venta', 'subtotal', 'margen', 'acciones'
  ]);

  // ── Cargar Catálogos ───────────────────────────────────────────────
  const cargarProveedores = useCallback(async () => {
    try {
      const response = await proveedorAdminService.listarProveedores();
      setProveedores(response.data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  }, []);

  const cargarCatalogoProductos = useCallback(async () => {
    // ProductoModal carga sus propios catálogos
  }, []);

  useEffect(() => {
    cargarProveedores();
    cargarCatalogoProductos();
  }, [cargarProveedores, cargarCatalogoProductos]);

  // Cargar productos iniciales si existen (desde Stock Bajo)
  useEffect(() => {
    if (productosIniciales && productosIniciales.length > 0 && items.length === 0) {
      const initialItems: ItemForm[] = productosIniciales.map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre,
        cantidad: Math.max(1, (p.stock_minimo || 0) - (p.stock || 0)),
        precio_unitario: p.precio_compra || 0,
        precio_venta: p.precio_venta || 0,
        es_nuevo: false
      }));
      setItems(initialItems);
    }
  }, [productosIniciales, items.length]);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleBuscarProducto = async (query: string) => {
    setBusqProducto(query);
    if (query.length < 2) {
      setProductosEncontrados([]);
      return;
    }
    setBuscandoProducto(true);
    try {
      const results = await adminProductService.listarProductos(query);
      setProductosEncontrados(results.items.map((p: any) => ({
        id_producto: p.id_producto,
        nombre: p.nombre,
        codigo: p.codigo,
        precio_venta: Number(p.precio_venta),
        precio_compra: Number(p.precio_compra) || 0,
        stock: p.stock
      })));
    } catch (err) {
      console.error('Error buscando productos:', err);
    } finally {
      setBuscandoProducto(false);
    }
  };

  const agregarProducto = (p: ProductoParaBuscar) => {
    // Evitar duplicados
    if (items.some(i => i.id_producto === p.id_producto)) {
      showNotification('Este producto ya está en la lista', 'warning');
      return;
    }

    setItems(prev => [
      ...prev,
      {
        id_producto: p.id_producto,
        nombre_producto: p.nombre,
        cantidad: 1,
        precio_unitario: p.precio_compra,
        precio_venta: p.precio_venta,
        es_nuevo: false
      }
    ]);
    setBusqProducto('');
    setProductosEncontrados([]);
  };

  const handleProductoNuevo = (p: any) => {
    if (!p) {
      setMostrarProductoNuevo(false);
      return;
    }

    // Extraer producto de forma robusta (por si viene envuelto en .data)
    const prod = p.id_producto ? p : (p.data || p);

    if (!prod.id_producto) {
      showNotification('Error: No se pudo obtener la información del producto creado', 'error');
      setMostrarProductoNuevo(false);
      return;
    }

    setItems(prev => [
      ...prev,
      {
        id_producto: prod.id_producto,
        nombre_producto: prod.nombre,
        cantidad: 1,
        precio_unitario: Number(prod.precio_compra) || 0,
        precio_venta: Number(prod.precio_venta) || 0,
        es_nuevo: false 
      }
    ]);
    setMostrarProductoNuevo(false);
  };

  const actualizarItem = (index: number, campo: keyof ItemForm, valor: any) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [campo]: valor };
      return newItems;
    });
  };

  const eliminarItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalCompra = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

  const registrarCompra = async () => {
    if (!idProveedor) {
      setError('Debes seleccionar un proveedor');
      return;
    }
    if (items.length === 0) {
      setError('Debes agregar al menos un producto');
      return;
    }

    setRegistrando(true);
    setError(null);
    try {
      const payload: RegistrarCompraData = {
        id_proveedor: idProveedor,
        comprobante: comprobante.trim() || 'S/N',
        fecha_compra: new Date().toISOString().split('T')[0],
        observaciones: observaciones.trim() || undefined,
        items: items.map(i => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          precio_venta: i.precio_venta,
          // Datos para producto nuevo
          es_nuevo: i.es_nuevo,
          nuevo_nombre: i.nuevo_nombre,
          nuevo_codigo: i.nuevo_codigo,
          nuevo_precio_venta: i.nuevo_precio_venta,
          nuevo_id_categoria: i.nuevo_id_categoria,
          nuevo_id_marca: i.nuevo_id_marca
        }))
      };

      console.log('Enviando registro de compra:', payload);
      await adminCompraService.registrarCompra(payload);
      
      showNotification('Compra registrada exitosamente', 'success');
      onRegistrada();
      onClose();
    } catch (err: any) {
      console.error('Error detallado al registrar compra:', err);
      setError(err.message || 'Error al registrar la compra');
    } finally {
      setRegistrando(false);
    }
  };

  const proveedorSeleccionado = proveedores.find(p => p.id_proveedor === idProveedor);

  // ── Columnas para AdminDataTable ───────────────────────────────────
  const columns = useMemo<ColumnDef<ItemForm>[]>(() => [
    {
      accessorKey: 'nombre_producto',
      id: 'producto',
      header: 'Producto',
      cell: (info) => {
        const item = info.row.original;
        return (
          <div className={styles.productCell}>
            <div className="font-bold">{item.nombre_producto || item.nuevo_nombre}</div>
            {item.es_nuevo && <span className={styles.newBadge}>NUEVO</span>}
            <div className={styles.arsSpacer}>&nbsp;</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'cantidad',
      id: 'cantidad',
      header: () => <div style={{ textAlign: 'center', width: '100%' }}>Cant.</div>,
      cell: (info) => (
        <div className="text-center">
          <input
            type="number"
            value={info.row.original.cantidad}
            onChange={(e) => actualizarItem(info.row.index, 'cantidad', parseInt(e.target.value) || 1)}
            className="modalTableInputPremium"
            style={{ width: '60px', margin: '0 auto' }}
          />
          <div className={styles.arsSpacer}>&nbsp;</div>
        </div>
      ),
    },
    {
      accessorKey: 'precio_unitario',
      id: 'costo',
      header: () => <div style={{ textAlign: 'center', width: '100%' }}>Costo (USD)</div>,
      cell: (info) => {
        const val = info.row.original.precio_unitario;
        return (
          <div className="text-center">
            <input
              type="number"
              step="0.01"
              value={val}
              onChange={(e) => actualizarItem(info.row.index, 'precio_unitario', parseFloat(e.target.value) || 0)}
              className="modalTableInputPremium"
              style={{ width: '100px', margin: '0 auto' }}
            />
            <div className={styles.arsReference}>
              {formatARS(val, tipoCambio)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'precio_venta',
      id: 'venta',
      header: () => <div style={{ textAlign: 'center', width: '100%' }}>Venta (USD)</div>,
      cell: (info) => {
        const val = info.row.original.precio_venta;
        return (
          <div className="text-center">
            <input
              type="number"
              step="0.01"
              value={val}
              onChange={(e) => actualizarItem(info.row.index, 'precio_venta', parseFloat(e.target.value) || 0)}
              className="modalTableInputPremium"
              style={{ width: '100px', margin: '0 auto' }}
            />
            <div className={styles.arsReference}>
              {formatARS(val, tipoCambio)}
            </div>
          </div>
        );
      },
    },
    {
      id: 'subtotal',
      header: () => <div style={{ textAlign: 'center', width: '100%' }}>Subtotal (USD)</div>,
      cell: (info) => {
        const item = info.row.original;
        const sub = item.cantidad * item.precio_unitario;
        return (
          <div className="text-center">
            <div className="font-bold">{formatUSD(sub)}</div>
            <div className={styles.arsReference}>{formatARS(sub, tipoCambio)}</div>
          </div>
        );
      },
    },
    {
      id: 'margen',
      header: () => <div style={{ textAlign: 'center', width: '100%' }}>Margen</div>,
      cell: (info) => {
        const item = info.row.original;
        const pc = Number(item.precio_unitario) || 0;
        const pv = Number(item.precio_venta) || 0;
        const margen = pc > 0 ? ((pv - pc) / pc) * 100 : 0;
        return (
          <div className="text-center font-bold">
            <span className={margen > 0 ? 'text-success' : 'text-error'}>
              {margen.toFixed(1)}%
            </span>
            <div className={styles.arsSpacer}>&nbsp;</div>
          </div>
        );
      },
    },
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: (info) => (
        <div className="flex justify-center">
          <button 
            onClick={() => eliminarItem(info.row.index)} 
            className="modalIconButtonPremium text-error"
            title="Quitar producto"
          >
            <span className="material-icons">delete_outline</span>
          </button>
        </div>
      ),
    },
  ], [tipoCambio, actualizarItem, eliminarItem]);

  return (
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title="Registrar Ingreso de Mercadería"
      icon="add_business"
      maxWidth="1200px"
    >
      <div className="modalBodyPremium p-0">
        <div className="modalSplitLayoutPremium">
          {/* Columna Izquierda - Formulario Principal */}
          <div className="modalMainColumnPremium">
            
            {/* 1. Proveedor y Datos de Factura */}
            <h4 className="modalSectionTitlePremium">Información del Proveedor</h4>
            <div className={`${styles.providerGrid} modalFormGridPremium`}>
              <div className="modalFormGroupPremium" style={{ width: '100%' }}>
                <div className={styles.providerActions}>
                  <div className={styles.selectWrapper}>
                    <Select
                      id="id_proveedor"
                      name="id_proveedor"
                      label="Proveedor"
                      value={String(idProveedor)}
                      onChange={(e) => { setIdProveedor(Number(e.target.value)); setError(null); }}
                      disabled={registrando}
                      required
                      options={[
                        { value: '0', label: 'Seleccionar proveedor...', disabled: true },
                        ...proveedores.map(p => ({ value: String(p.id_proveedor), label: p.nombre_proveedor }))
                      ]}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setMostrarCrearProveedor(true)}
                    className={`btnPremium btnSecondaryPremium ${styles.addButton}`}
                    title="Nuevo Proveedor"
                  >
                    <span className="material-icons">add</span>
                  </button>
                </div>
              </div>
              
              <Input
                id="comprobante"
                name="comprobante"
                label="Nº de Comprobante / Factura"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Ej: 0001-00001234"
                disabled={registrando}
                className="w-full"
              />

              <div className="modalFormGroupFullPremium mb-0">
                <TextArea
                  id="observaciones"
                  name="observaciones"
                  label="Notas de la Compra"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles internos, estado de los productos, etc."
                  rows={2}
                  disabled={registrando}
                />
              </div>
            </div>

            <div className="modalDividerPremium" />

            {/* 2. Búsqueda de Productos */}
            {/* 2. Búsqueda de Productos */}
            <h4 className="modalSectionTitlePremium">Selección de Productos</h4>
            <div className="flex gap-sm items-center w-full mb-lg" style={{ display: 'flex', width: '100%' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <AdminSearch
                  value={busqProducto}
                  onChange={handleBuscarProducto}
                  placeholder="Buscar por nombre o código de barras..."
                  delay={300}
                  className="w-full"
                />
                {buscandoProducto && (
                  <div className={styles.loadingIcon}>
                    <span className="material-icons">autorenew</span>
                  </div>
                )}
              </div>
              <button 
                type="button"
                className="btnPremium btnSecondaryPremium"
                style={{ height: '32px', padding: '0 16px', whiteSpace: 'nowrap' }}
                onClick={() => setMostrarProductoNuevo(true)}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>add_box</span>
                Nuevo
              </button>
            </div>
              
              {/* Resultados de búsqueda */}
              {productosEncontrados.length > 0 && (
                <div className="modalSearchListPremium">
                  {productosEncontrados.map(p => (
                    <div 
                      key={p.id_producto} 
                      className="modalSearchResultItemPremium"
                      onClick={() => agregarProducto(p)}
                    >
                      <div className="modalResultMainPremium">
                        <span className="modalResultTitlePremium">{p.nombre}</span>
                        <span className="modalResultBadgePremium">${p.precio_venta.toLocaleString()}</span>
                      </div>
                      <div className="modalResultSubPremium">
                        SKU: {p.codigo} • Stock: {p.stock} • Últ. Costo: {formatUSD(p.precio_compra)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* No se encontró producto eliminado por petición de usuario */}

            {/* Lista de Items Agregados */}
            {items.length > 0 ? (
              <div className="mt-4">
                <AdminDataTable
                  data={items}
                  columns={columns}
                  sorting={sorting}
                  onSortingChange={setSorting}
                  columnOrder={columnOrder}
                  onColumnOrderChange={setColumnOrder}
                  pagination={pagination}
                  onPaginationChange={setPagination}
                  totalItems={items.length}
                  itemLabel="productos"
                  manualPagination={false}
                  emptyMessage="Busca y agrega productos para iniciar el registro de la compra."
                />
              </div>
            ) : (
              <div className="mt-4">
                <AdminEmptyState
                  icon="inventory"
                  title="Sin productos"
                  message="Busca y agrega productos para iniciar el registro de la compra."
                />
              </div>
            )}
          </div>

          {/* Columna Derecha - Resumen Dinámico */}
          <div className="modalSideColumnPremium">
            <h4 className="modalSectionTitlePremium">Resumen de la Operación</h4>
            
            <div className="modalResumenCardPremium">
              <div className="modalResumenRowPremium">
                <span className="text-secondary">Proveedor</span>
                <span className={`font-bold ${proveedorSeleccionado ? 'text-primary' : 'text-error'}`}>
                  {proveedorSeleccionado ? proveedorSeleccionado.nombre_proveedor : 'No seleccionado'}
                </span>
              </div>
              
              <div className="modalResumenRowPremium">
                <span className="text-secondary">Productos</span>
                <span className="font-bold">{items.length} tipo(s)</span>
              </div>
              
              <div className="modalResumenRowPremium">
                <span className="text-secondary">Total Unidades</span>
                <span className="font-bold">{items.reduce((sum, i) => sum + i.cantidad, 0)}</span>
              </div>

              {proveedorSeleccionado && (
                <div className={`modalResumenRowPremium ${styles.resumenHeader}`}>
                  <span className="text-secondary">Empresa</span>
                  <span className="text-xs font-bold">{proveedorSeleccionado.empresa}</span>
                </div>
              )}

              <div className={styles.tipoCambioPanel}>
                <div className={styles.tcHeader}>
                  <span className="material-icons">currency_exchange</span>
                  <span>Tipo de Cambio</span>
                </div>
                <div className={styles.tcValue}>
                  {cargandoTC ? 'Cargando...' : formatARS(1, tipoCambio)}
                </div>
                {!esConfiable && (
                  <div className={styles.tcWarning}>
                    <span className="material-icons">warning</span>
                    Valor de referencia
                  </div>
                )}
              </div>
            </div>

            <div className="modalTotalBoxPremium">
              <span className="modalTotalLabelPremium">Total Operación (USD)</span>
              <span className="modalTotalValuePremium">
                {formatUSD(totalCompra)}
              </span>
              <div className={styles.totalARS}>
                Equivale a {formatARS(totalCompra, tipoCambio)}
              </div>
            </div>

            {error && (
              <div className="modalAlertErrorPremium mt-4">
                <span className="material-icons">error_outline</span>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Premium - FIJO */}
      <div className="modalFooterPremium">
        <button className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={registrando}>
          Cancelar
        </button>
        <button 
          type="button"
          className={`btnPremium btnPrimaryPremium ${styles.footerBtn}`} 
          onClick={registrarCompra}
          disabled={registrando || items.length === 0 || !idProveedor}
        >
          <span className="material-icons">{registrando ? 'hourglass_empty' : 'check_circle'}</span>
          {registrando ? 'Procesando...' : 'Confirmar Registro'}
        </button>
      </div>

      {/* Modales Secundarios */}
      <ProveedorModal
        isOpen={mostrarCrearProveedor}
        onClose={() => setMostrarCrearProveedor(false)}
        onGuardado={(p) => { setIdProveedor(p.id_proveedor); cargarProveedores(); }}
      />

      {mostrarProductoNuevo && (
        <ProductoModal
          isOpen={true}
          onClose={() => setMostrarProductoNuevo(false)}
          onGuardado={handleProductoNuevo}
        />
      )}
    </PremiumModal>
  );
});

RegistrarCompraModal.displayName = 'RegistrarCompraModal';

export default RegistrarCompraModal;
