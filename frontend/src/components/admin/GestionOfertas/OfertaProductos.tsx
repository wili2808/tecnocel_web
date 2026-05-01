/**
 * Componente OfertaProductos - Asignación y gestión de productos en una oferta
 * Muestra productos asignados y permite agregar/remover productos con precio personalizado
 */
import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import type { OfertaConProductos, ProductoEnOferta, Product } from '../../../types';
import { AdminSearch } from '../common';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS } from '../../../utils/formatPrecio';
import styles from './OfertaProductos.module.css';

interface OfertaProductosProps {
  oferta: OfertaConProductos;
  onProductosChanged: () => void;
}

interface ProductoSeleccionado {
  id_producto: number;
  precio_oferta?: number;
}

const OfertaProductos = ({ oferta, onProductosChanged }: OfertaProductosProps) => {
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
  const [asignando, setAsignando] = useState(false);

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

  // Filtrar productos ya asignados del resultado de búsqueda
  const productosNoAsignados = productosDisponibles.filter(
    p => !productosAsignados.some(pa => pa.id_producto === p.id_producto)
  );

  const handleToggleSeleccion = (producto: Product) => {
    setSeleccionados(prev => {
      const next = new Map(prev);
      if (next.has(producto.id_producto)) {
        next.delete(producto.id_producto);
      } else {
        next.set(producto.id_producto, { id_producto: producto.id_producto });
      }
      return next;
    });
  };

  const handlePrecioOfertaChange = (idProducto: number, precio: string) => {
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
  };

  const handleAsignarProductos = async () => {
    if (seleccionados.size === 0) return;

    try {
      setAsignando(true);
      // Convertir precios personalizados de ARS a USD antes de enviar
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
  };

  const handleRemoverProducto = async (idProducto: number, nombre: string) => {
    if (!confirm(`¿Remover "${nombre}" de esta oferta?`)) return;

    try {
      await adminOfertaService.removerProducto(oferta.id_oferta, idProducto);
      showNotification('Producto removido de la oferta', 'success');
      onProductosChanged();
    } catch (err: any) {
      showNotification(err.message || 'Error al remover producto', 'error');
    }
  };

  const handleAbrirBuscador = () => {
    setShowBuscador(true);
    setSeleccionados(new Map());
    setSearchTerm('');
    setProductosDisponibles([]);
  };

  const handleCerrarBuscador = () => {
    setShowBuscador(false);
    setSeleccionados(new Map());
    setSearchTerm('');
  };

  /** Calcula el precio con descuento para mostrar en la tabla */
  const calcularPrecioDescuento = (precioVenta: string) => {
    const precio = parseFloat(precioVenta);
    if (oferta.tipo_descuento === 'porcentaje') {
      return (precio * (1 - oferta.valor_descuento / 100)).toFixed(2);
    }
    return Math.max(0, precio - oferta.valor_descuento).toFixed(2);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className="material-icons">inventory_2</span>
          Productos en esta Oferta ({productosAsignados.length})
        </h3>
        <button className="btnPremium btnPrimaryPremium btnSmPremium" onClick={handleAbrirBuscador}>
          <span className="material-icons">add</span>
          <span>Agregar Productos</span>
        </button>
      </div>

      {/* Tabla de productos asignados */}
      <div className="modalTableWrapperPremium">
        <table className="modalTablePremium">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Código</th>
              <th>Nombre</th>
              <th className="text-right">Precio Original</th>
              <th className="text-right">Precio Oferta</th>
              <th className="text-center">Tipo Precio</th>
              <th className="text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {productosAsignados.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-secondary">
                  No hay productos asignados a esta oferta
                </td>
              </tr>
            ) : (
              productosAsignados.map((producto) => {
                const precioOferta = producto.ProductoOferta?.es_precio_personalizado
                  && producto.ProductoOferta?.precio_oferta != null
                  ? producto.ProductoOferta.precio_oferta.toString()
                  : calcularPrecioDescuento(producto.precio_venta);

                return (
                  <tr key={producto.id_producto}>
                    <td>
                      <div className={styles.thumbnailWrapper}>
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className={styles.thumbnail}
                          />
                        ) : (
                          <div className={styles.thumbnailPlaceholder}>
                            <span className="material-icons">image</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-xs">{producto.codigo}</td>
                    <td className="font-bold">{producto.nombre}</td>
                    <td className="text-right text-secondary">
                      {formatARS(parseFloat(producto.precio_venta), tipoCambio)}
                    </td>
                    <td className="text-right font-bold text-primary">
                      {formatARS(Number(precioOferta), tipoCambio)}
                    </td>
                    <td className="text-center">
                      {producto.ProductoOferta?.es_precio_personalizado ? (
                        <span className="modalBadgePremium error badgeSmallPremium">Manual</span>
                      ) : (
                        <span className="modalBadgePremium success badgeSmallPremium">Auto</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        className="modalIconButtonPremium text-error"
                        title="Remover de la oferta"
                        onClick={() => handleRemoverProducto(producto.id_producto, producto.nombre)}
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal buscador de productos */}
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

          <div className={styles.searchContainer}>
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
                <span className={`material-icons ${styles.emptyIcon}`}>search_off</span>
                <p>No se encontraron productos para "{searchTerm}"</p>
              </div>
            )}

            {!loadingBusqueda && productosNoAsignados.length > 0 && (
              <div className="modalSearchListPremium">
                {productosNoAsignados.map((producto) => {
                  const isSelected = seleccionados.has(producto.id_producto);
                  const selItem = seleccionados.get(producto.id_producto);
                  const precioCalculado = calcularPrecioDescuento(producto.precio_venta);

                  return (
                    <div
                      key={producto.id_producto}
                      className={`modalSearchResultItemPremium ${isSelected ? 'active' : ''}`}
                      onClick={() => handleToggleSeleccion(producto)}
                    >
                      <div className="modalResultMainPremium">
                        <div className="flex items-center gap-md">
                          <span className="material-icons text-primary" style={{ fontSize: '20px' }}>
                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          <div className="flex flex-col">
                            <span className="modalResultTitlePremium">{producto.nombre}</span>
                            <span className="modalResultSubPremium">SKU: {producto.codigo}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xxs text-secondary">
                            Original: <span className="line-through">{formatARS(parseFloat(producto.precio_venta), tipoCambio)}</span>
                          </div>
                          <div className="text-sm font-bold text-primary">
                            Oferta: {formatARS(Number(precioCalculado), tipoCambio)}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div 
                          className="mt-3 pt-3 border-t flex items-center justify-between animate-fade-in" 
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex flex-col">
                            <span className="text-xxs font-bold text-primary uppercase">Precio Personalizado</span>
                            <span className="text-xxs text-secondary">Sobrescribe el cálculo automático</span>
                          </div>
                          <div className="flex items-center gap-sm">
                            <span className="text-xs font-bold">ARS $</span>
                            <input
                              type="number"
                              placeholder="Precio en pesos"
                              value={selItem?.precio_oferta ?? ''}
                              onChange={(e) => handlePrecioOfertaChange(producto.id_producto, e.target.value)}
                              className="modalTableInputPremium"
                              style={{ width: '120px', textAlign: 'right' }}
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modalFooterPremium">
          <div className="mr-auto text-sm text-secondary">
            {seleccionados.size} producto{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
          </div>
          <button
            className="btnPremium btnSecondaryPremium"
            onClick={handleCerrarBuscador}
          >
            Cancelar
          </button>
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

export default OfertaProductos;
