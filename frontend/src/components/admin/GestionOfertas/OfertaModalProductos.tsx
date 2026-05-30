import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import type { OfertaConProductos, ProductoEnOferta, Product } from '../../../types';
import { AdminSearch, AdminDataTable } from '../common';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS } from '../../../utils/formatPrecio';
import styles from './OfertaModals.module.css';

interface OfertaModalProductosProps {
  oferta: OfertaConProductos;
  onProductosChanged: () => void;
}

interface ProductoSeleccionado {
  id_producto: number;
  precio_oferta?: number;
}

// ── Sub-componente memoizado para el input de precio manual ──────────────────
// Usa input NO CONTROLADO (defaultValue) + custom memo comparator:
// - Solo re-renderiza cuando cambia isSelected o idProducto (no al tipear)
// - onCommit se guarda en ref para evitar closure stale sin disparar re-renders
// Esto permite poner `seleccionados` de vuelta en los deps de columnsBusqueda
// (checkbox funciona) sin que el input pierda el foco en cada keystroke.
interface PrecioManualInputProps {
  idProducto: number;
  isSelected: boolean;
  onCommit: (idProducto: number, precio: string) => void;
}

const PrecioManualInput = memo(
  ({ idProducto, isSelected, onCommit }: PrecioManualInputProps) => {
    // Ref estable para onCommit — siempre apunta a la versión más reciente
    // sin convertirlo en dep del componente
    const onCommitRef = useRef(onCommit);
    onCommitRef.current = onCommit;

    return (
      <div className={styles.precioManualCell} onClick={(e) => e.stopPropagation()}>
        <input
          id={`precio-manual-${idProducto}`}
          type="number"
          placeholder="Precio manual"
          defaultValue=""
          onChange={(e) => onCommitRef.current(idProducto, e.target.value)}
          className={styles.precioManualInput}
          style={{
            opacity: isSelected ? 1 : 0.35,
            pointerEvents: isSelected ? 'all' : 'none',
            cursor: isSelected ? 'text' : 'not-allowed',
          }}
          step="1"
          min="0"
          disabled={!isSelected}
          aria-label={`Precio manual para producto ${idProducto}`}
          aria-disabled={!isSelected}
        />
      </div>
    );
  },
  // Custom comparator: solo re-renderiza si cambia isSelected o el id del producto.
  // Ignorar cambios de onCommit (manejado por ref) y del precio (input no controlado).
  (prev, next) =>
    prev.isSelected === next.isSelected && prev.idProducto === next.idProducto,
);
PrecioManualInput.displayName = 'PrecioManualInput';


const OfertaModalProductos = ({ oferta, onProductosChanged }: OfertaModalProductosProps) => {
  const { showNotification } = useNotification();
  const { tipoCambio } = useTipoCambio();

  // Productos asignados
  const [productosAsignados, setProductosAsignados] = useState<ProductoEnOferta[]>(
    oferta.productos || []
  );

  // Modal buscador
  const [showBuscador, setShowBuscador] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [productosDisponibles, setProductosDisponibles] = useState<Product[]>([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Map<number, ProductoSeleccionado>>(new Map());
  // Ref que siempre apunta al Map actual — las células lo leen sin estar en deps
  const seleccionadosRef = useRef<Map<number, ProductoSeleccionado>>(new Map());
  // Contador que SOLO incrementa al seleccionar/deseleccionar (no al tipear precio)
  // Esto fuerza re-render del checkbox sin regenerar las columnas al tipear
  const [seleccionadosVersion, setSeleccionadosVersion] = useState(0);
  const [asignando, setAsignando] = useState(false);

  // Mantener ref sincronizado con el estado
  useEffect(() => {
    seleccionadosRef.current = seleccionados;
  }, [seleccionados]);

  // ── Estados para Tabla Principal (Asignados) ───────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'imagen', 'codigo', 'nombre', 'precio_original', 'precio_oferta', 'tipo_precio', 'acciones'
  ]);

  // ── Estados para Tabla de Búsqueda ──────────────────────────────────
  const [searchSorting, setSearchSorting] = useState<SortingState>([]);
  const [searchPagination, setSearchPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchColumnOrder, setSearchColumnOrder] = useState<string[]>([
    'seleccion', 'producto', 'precio_original', 'precio_oferta', 'precio_personalizado'
  ]);

  // Sincronizar productos cuando cambia la oferta
  useEffect(() => {
    setProductosAsignados(oferta.productos || []);
  }, [oferta]);

  // Buscar productos con debounce
  const buscarProductos = useCallback(async (termino: string) => {
    try {
      setLoadingBusqueda(true);
      const resultados = await adminOfertaService.buscarProductos(termino || undefined);
      setProductosDisponibles(resultados);
    } catch {
      showNotification('Error al buscar productos', 'error');
    } finally {
      setLoadingBusqueda(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (!showBuscador) return;
    buscarProductos(searchTerm);
  }, [searchTerm, showBuscador, buscarProductos]);

  const productosNoAsignados = useMemo(() => 
    productosDisponibles.filter(p => !productosAsignados.some(pa => pa.id_producto === p.id_producto)),
    [productosDisponibles, productosAsignados]
  );

  const handleToggleSeleccion = useCallback((producto: Product) => {
    setSeleccionados(prev => {
      const next = new Map(prev);
      if (next.has(producto.id_producto)) {
        next.delete(producto.id_producto);
      } else {
        next.set(producto.id_producto, { id_producto: producto.id_producto });
      }
      seleccionadosRef.current = next;
      return next;
    });
    // Incrementar versión SOLO al seleccionar/deseleccionar (no al tipear)
    // Esto actualiza el checkbox sin regenerar toda la columna al escribir precio
    setSeleccionadosVersion(v => v + 1);
  }, []);

  const handlePrecioOfertaChange = useCallback((idProducto: number, precio: string) => {
    setSeleccionados(prev => {
      const next = new Map(prev);
      const item = next.get(idProducto);
      if (item) {
        next.set(idProducto, {
          ...item,
          precio_oferta: precio ? parseFloat(precio) : undefined,
        });
      }
      return next;
    });
  }, []);

  const handleAsignarProductos = useCallback(async () => {
    if (seleccionados.size === 0) return;

    try {
      setAsignando(true);
      const productos = Array.from(seleccionados.values()).map(p => ({
        ...p,
        precio_oferta: p.precio_oferta ? p.precio_oferta / tipoCambio : undefined
      }));
      
      await adminOfertaService.asignarProductos(oferta.id_oferta, productos);
      showNotification(
        `${productos.length} producto${productos.length > 1 ? 's' : ''} asignado${productos.length > 1 ? 's' : ''} exitosamente`,
        'success'
      );
      setSeleccionados(new Map());
      setShowBuscador(false);
      setSearchTerm('');
      onProductosChanged();
    } catch (err: any) {
      showNotification(err.message || 'Error al asignar productos', 'error');
    } finally {
      setAsignando(false);
    }
  }, [seleccionados, tipoCambio, oferta.id_oferta, showNotification, onProductosChanged]);

  const handleRemoverProducto = useCallback(async (idProducto: number, nombre: string) => {
    if (!confirm(`¿Remover "${nombre}" de esta oferta?`)) return;

    try {
      await adminOfertaService.removerProducto(oferta.id_oferta, idProducto);
      showNotification('Producto removido de la oferta', 'success');
      onProductosChanged();
    } catch (err: any) {
      showNotification(err.message || 'Error al remover producto', 'error');
    }
  }, [oferta.id_oferta, showNotification, onProductosChanged]);

  const handleAbrirBuscador = useCallback(() => {
    setShowBuscador(true);
    setSeleccionados(new Map());
    setSearchTerm('');
    setProductosDisponibles([]);
  }, []);

  const handleCerrarBuscador = useCallback(() => {
    setShowBuscador(false);
    setSeleccionados(new Map());
    setSearchTerm('');
  }, []);

  const calcularPrecioDescuento = useCallback((precioVenta: string) => {
    const precio = parseFloat(precioVenta);
    if (oferta.tipo_descuento === 'porcentaje') {
      return (precio * (1 - oferta.valor_descuento / 100)).toFixed(2);
    }
    return Math.max(0, precio - oferta.valor_descuento).toFixed(2);
  }, [oferta.tipo_descuento, oferta.valor_descuento]);

  // ── Columnas para AdminDataTable (Tabla Principal) ────────────────
  const columns = useMemo<ColumnDef<ProductoEnOferta>[]>(() => [
    {
      id: 'imagen',
      header: 'Imagen',
      cell: (info) => (
        <div className={styles.thumbnailWrapper}>
          {info.row.original.imagen_url ? (
            <img
              src={info.row.original.imagen_url}
              alt={info.row.original.nombre}
              className={styles.thumbnail}
            />
          ) : (
            <div className={styles.thumbnailPlaceholder}>
              <span className="material-icons">image</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'codigo',
      id: 'codigo',
      header: 'Código',
      cell: (info) => <span className="font-mono text-xs">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'nombre',
      id: 'nombre',
      header: 'Nombre',
      cell: (info) => <span className="font-bold">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'precio_venta',
      id: 'precio_original',
      header: () => <div className="text-right">Precio Original</div>,
      cell: (info) => (
        <div className="text-right text-secondary">
          {formatARS(parseFloat(info.getValue() as string), tipoCambio)}
        </div>
      ),
    },
    {
      id: 'precio_oferta',
      header: () => <div className="text-right">Precio Oferta</div>,
      cell: (info) => {
        const producto = info.row.original;
        const precioOferta = producto.ProductoOferta?.es_precio_personalizado
          && producto.ProductoOferta?.precio_oferta != null
          ? producto.ProductoOferta.precio_oferta.toString()
          : calcularPrecioDescuento(producto.precio_venta);
        
        return (
          <div className="text-right font-bold text-primary">
            {formatARS(Number(precioOferta), tipoCambio)}
          </div>
        );
      },
    },
    {
      id: 'tipo_precio',
      header: () => <div className="text-center">Tipo Precio</div>,
      cell: (info) => (
        <div className="text-center">
          {info.row.original.ProductoOferta?.es_precio_personalizado ? (
            <span className={`${styles.badgePremium} ${styles.personalizadoBadge}`}>Manual</span>
          ) : (
            <span className={`${styles.badgePremium} ${styles.calculadoBadge}`}>Auto</span>
          )}
        </div>
      ),
    },
    {
      id: 'acciones',
      header: () => <div className="text-right">Acción</div>,
      enableSorting: false,
      cell: (info) => (
        <div className="text-right">
          <button
            className={styles.removeButton}
            title="Remover de la oferta"
            onClick={() => handleRemoverProducto(info.row.original.id_producto, info.row.original.nombre)}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>
      ),
    },
  ], [tipoCambio, oferta.tipo_descuento, oferta.valor_descuento, handleRemoverProducto, calcularPrecioDescuento]);

  const columnsBusqueda = useMemo<ColumnDef<Product>[]>(() => [
    {
      id: 'seleccion',
      header: '',
      enableSorting: false,
      cell: (info) => {
        // Lee el ref — siempre actualizado, sin necesitar seleccionados en deps
        const isSelected = seleccionadosRef.current.has(info.row.original.id_producto);
        return (
          <div className="flex justify-center">
            <span className={`material-icons ${isSelected ? 'text-primary' : 'text-secondary opacity-30'}`} style={{ fontSize: '20px' }}>
              {isSelected ? 'check_box' : 'check_box_outline_blank'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'producto',
      header: 'Producto',
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm">{info.row.original.nombre}</span>
          <span className="font-mono text-xxs text-secondary">SKU: {info.row.original.codigo}</span>
        </div>
      )
    },
    {
      id: 'precio_original',
      header: () => <div className="text-right">Precio Base</div>,
      cell: (info) => (
        <div className="text-right text-secondary text-xs line-through">
          {formatARS(parseFloat(info.row.original.precio_venta), tipoCambio)}
        </div>
      )
    },
    {
      id: 'precio_oferta',
      header: () => <div className="text-right">Precio Promo</div>,
      cell: (info) => {
        const precioCalculado = calcularPrecioDescuento(info.row.original.precio_venta);
        return (
          <div className="text-right font-bold text-primary">
            {formatARS(Number(precioCalculado), tipoCambio)}
          </div>
        );
      }
    },
    {
      id: 'precio_personalizado',
      header: () => <div className="text-center">Precio Manual (ARS)</div>,
      enableSorting: false,
      cell: (info) => {
        const producto = info.row.original;
        // Lee el ref — no deps → las columnas NO se regeneran al tipear
        const isSelected = seleccionadosRef.current.has(producto.id_producto);
        return (
          <PrecioManualInput
            idProducto={producto.id_producto}
            isSelected={isSelected}
            onCommit={handlePrecioOfertaChange}
          />
        );
      }
    }
  // seleccionadosVersion en deps: solo cambia al clic (no al tipear precio)
  // → columnsBusqueda se regenera para actualizar checkboxes, pero NO al tipear
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [seleccionadosVersion, tipoCambio, handlePrecioOfertaChange, calcularPrecioDescuento]);


  return (
    <div className={styles.modalBodyContent}>
      <div className={styles.assignedHeader}>
        <h3 className="m-0 text-sm font-bold flex items-center gap-sm">
          <span className="material-icons text-primary" style={{ fontSize: '18px' }}>inventory_2</span>
          Productos en esta Oferta ({productosAsignados.length})
        </h3>
        <button className="btnPremium btnPrimaryPremium btnSmPremium" onClick={handleAbrirBuscador}>
          <span className="material-icons">add</span>
          <span>Agregar Productos</span>
        </button>
      </div>

      <div className="mt-2" style={{ margin: '0 var(--spacing-lg)' }}>
        <AdminDataTable
          data={productosAsignados}
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalItems={productosAsignados.length}
          itemLabel="productos"
          manualPagination={false}
          emptyMessage="No hay productos asignados a esta oferta"
        />
      </div>

      <PremiumModal
        isOpen={showBuscador}
        onClose={handleCerrarBuscador}
        title="Agregar Productos a la Oferta"
        icon="add_shopping_cart"
        maxWidth="800px"
      >
        <div className="modalBodyPremium">
          <div className="mb-4">
            <AdminSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre, marca o modelo..."
              delay={300}
            />
          </div>

          <div style={{ minHeight: '300px', position: 'relative' }}>
            {loadingBusqueda && (
              <div className="modalLoadingPremium">
                <span className="material-icons">autorenew</span>
                <p>Buscando productos...</p>
              </div>
            )}

            {!loadingBusqueda && productosNoAsignados.length === 0 && productosDisponibles.length > 0 && (
              <div className="modalEmptyStateSimplePremium">
                <p>Todos los productos encontrados ya están asignados</p>
              </div>
            )}

            {!loadingBusqueda && productosDisponibles.length === 0 && searchTerm && (
              <div className="modalEmptyStateSimplePremium">
                <span className="material-icons opacity-30" style={{ fontSize: '48px' }}>search_off</span>
                <p>No se encontraron productos para "{searchTerm}"</p>
              </div>
            )}

            {!loadingBusqueda && productosNoAsignados.length > 0 && (
              <div className="mt-2">
                <AdminDataTable
                  data={productosNoAsignados}
                  columns={columnsBusqueda}
                  sorting={searchSorting}
                  onSortingChange={setSearchSorting}
                  columnOrder={searchColumnOrder}
                  onColumnOrderChange={setSearchColumnOrder}
                  pagination={searchPagination}
                  onPaginationChange={setSearchPagination}
                  totalItems={productosNoAsignados.length}
                  itemLabel="productos"
                  manualPagination={false}
                  onRowClick={(row) => handleToggleSeleccion(row)}
                  emptyMessage="Busca productos para agregar a la oferta"
                />
              </div>
            )}
          </div>
        </div>

        <div className="modalFooterPremium">
          <div className="mr-auto text-sm text-secondary">
            {seleccionados.size} producto{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
          </div>
          <button
            className="btnPremium btnPrimaryPremium"
            onClick={handleAsignarProductos}
            disabled={seleccionados.size === 0 || asignando}
          >
            <span className="material-icons">{asignando ? 'hourglass_empty' : 'check'}</span>
            {asignando ? 'Asignando...' : 'Asignar Seleccionados'}
          </button>
        </div>
      </PremiumModal>
    </div>
  );
};

export default OfertaModalProductos;
