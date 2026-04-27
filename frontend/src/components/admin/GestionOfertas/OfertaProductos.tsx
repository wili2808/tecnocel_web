/**
 * Componente OfertaProductos - Asignación y gestión de productos en una oferta
 * Muestra productos asignados y permite agregar/remover productos con precio personalizado
 */
import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import type { OfertaConProductos, ProductoEnOferta, Product } from '../../../types';
import { AdminSearch } from '../common';
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
  }, []);

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
      const productos = Array.from(seleccionados.values());
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
        <button className={styles.addButton} onClick={handleAbrirBuscador}>
          <span className="material-icons">add</span>
          <span>Agregar Productos</span>
        </button>
      </div>

      {/* Tabla de productos asignados */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>Precio Original</th>
              <th>Precio Oferta</th>
              <th>Tipo Precio</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productosAsignados.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyMessage}>
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
                    <td className={styles.codigoCell}>{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td className={styles.precioCell}>
                      {parseFloat(producto.precio_venta).toFixed(2)} ARS
                    </td>
                    <td className={styles.precioCell}>
                      {precioOferta} ARS
                    </td>
                    <td>
                      {producto.ProductoOferta?.es_precio_personalizado ? (
                        <span className={styles.personalizadoBadge}>Personalizado</span>
                      ) : (
                        <span className={styles.calculadoBadge}>Calculado</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={styles.removeButton}
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
      {showBuscador && (
        <div className={styles.overlay} onClick={handleCerrarBuscador}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className="material-icons">add_shopping_cart</span>
                Agregar Productos a la Oferta
              </h3>
              <button className={styles.closeButton} onClick={handleCerrarBuscador}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className={styles.modalSearch} style={{ display: 'block' }}>
              <AdminSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar producto por nombre o código..."
                className={styles.modalSearchInput}
                delay={300}
              />
            </div>

            <div className={styles.modalBody}>
              {loadingBusqueda && (
                <div className={styles.loadingSmall}>
                  <p>Buscando productos...</p>
                </div>
              )}

              {!loadingBusqueda && productosNoAsignados.length === 0 && productosDisponibles.length > 0 && (
                <div className={styles.emptySearch}>
                  <p>Todos los productos encontrados ya están asignados</p>
                </div>
              )}

              {!loadingBusqueda && productosDisponibles.length === 0 && searchTerm && (
                <div className={styles.emptySearch}>
                  <p>No se encontraron productos</p>
                </div>
              )}

              {!loadingBusqueda && productosNoAsignados.map((producto) => {
                const isSelected = seleccionados.has(producto.id_producto);
                const selItem = seleccionados.get(producto.id_producto);

                return (
                  <div
                    key={producto.id_producto}
                    className={`${styles.productoItem} ${isSelected ? styles.productoItemSelected : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSeleccion(producto)}
                      className={styles.productoCheckbox}
                    />
                    <div className={styles.productoInfo}>
                      <div className={styles.productoNombre}>{producto.nombre}</div>
                      <div className={styles.productoCodigo}>{producto.codigo}</div>
                    </div>
                    <div className={styles.productoPrecio}>
                      {parseFloat(producto.precio_venta).toFixed(2)} ARS
                    </div>
                    {isSelected && (
                      <input
                        type="number"
                        placeholder="Precio (opc.)"
                        value={selItem?.precio_oferta ?? ''}
                        onChange={(e) => handlePrecioOfertaChange(producto.id_producto, e.target.value)}
                        className={styles.precioOfertaInput}
                        step="0.01"
                        min="0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.modalFooter}>
              <span className={styles.seleccionInfo}>
                {seleccionados.size} producto{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
              </span>
              <button
                className={styles.asignarButton}
                onClick={handleAsignarProductos}
                disabled={seleccionados.size === 0 || asignando}
              >
                <span className="material-icons">check</span>
                {asignando ? 'Asignando...' : 'Asignar Seleccionados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfertaProductos;
