/**
 * Componente GestionProductos - CRUD completo de productos desde el admin
 * Lista, busca, crea, edita y elimina productos del catálogo
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useDebounce } from '../../../hooks/useDebounce';
import adminProductService from '../../../services/adminProductService';
import ProductoForm from './ProductoForm';
import GestionMarcas from './GestionMarcas';
import GestionCategorias from './GestionCategorias';
import GestionCaracteristicas from './GestionCaracteristicas';
import { AdminEmptyState, AdminSectionActions, AdminSurface } from '../common';
import type { Product } from '../../../types/product';
import styles from './GestionProductos.module.css';

type Vista = 'lista' | 'crear' | 'editar';
type TabProductos = 'productos' | 'marcas' | 'categorias' | 'caracteristicas';
type SortKey = 'codigo' | 'nombre' | 'categoria' | 'marca' | 'precio_venta' | 'stock';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

const GestionProductos = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_productos');
  const puedeCrear = tienePermiso('crear_producto');
  const puedeEditar = tienePermiso('editar_producto');
  const puedeEliminar = tienePermiso('eliminar_producto');
  const isReadOnly = !puedeEditar;
  const { showNotification } = useNotification();

  // Estado de la vista
  const [vista, setVista] = useState<Vista>('lista');
  const [activeTab, setActiveTab] = useState<TabProductos>('productos');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);

  // Estado de la lista (todos los productos cargados)
  const [allProductos, setAllProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [page, setPage] = useState(1);

  // Ordenamiento
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Filtro de destacados
  const [soloDestacados, setSoloDestacados] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  // 1. Filtrar por destacados si el switch está activo
  const filteredProductos = useMemo(() => {
    if (!soloDestacados) return allProductos;
    return allProductos.filter((p) => p.es_destacado);
  }, [allProductos, soloDestacados]);

  // 2. Ordenar los productos filtrados
  const sortedProductos = useMemo(() => {
    if (!sortKey) return filteredProductos;

    return [...filteredProductos].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortKey) {
        case 'codigo':
          valA = (a.codigo || '').toLowerCase();
          valB = (b.codigo || '').toLowerCase();
          break;
        case 'nombre':
          valA = (a.nombre || '').toLowerCase();
          valB = (b.nombre || '').toLowerCase();
          break;
        case 'categoria':
          valA = (a.Categoria?.nombre_categoria || '').toLowerCase();
          valB = (b.Categoria?.nombre_categoria || '').toLowerCase();
          break;
        case 'marca':
          valA = (a.marca?.nombre_marca || '').toLowerCase();
          valB = (b.marca?.nombre_marca || '').toLowerCase();
          break;
        case 'precio_venta':
          valA = parseFloat(a.precio_venta) || 0;
          valB = parseFloat(b.precio_venta) || 0;
          break;
        case 'stock':
          valA = a.stock;
          valB = b.stock;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProductos, sortKey, sortDir]);

  // 3. Paginar los productos ya ordenados
  const total = sortedProductos.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const paginatedProductos = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedProductos.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProductos, page]);

  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminProductService.listarProductos(searchTerm || undefined);
      setAllProductos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
      showNotification(err.message || 'Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showNotification]);

  useEffect(() => {
    if (vista === 'lista') {
      cargarProductos();
    }
  }, [cargarProductos, vista]);

  // ── Actualizar búsqueda con debounce ────────────────────────────────────
  useEffect(() => {
    setPage(1);
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch]);

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
  };

  const handleToggleDestacados = () => {
    setSoloDestacados((prev) => !prev);
    setPage(1);
  };

  const handleEditar = async (id: number) => {
    try {
      const producto = await adminProductService.obtenerProducto(id);
      setProductoSeleccionado(producto);
      setVista('editar');
    } catch {
      showNotification('Error al cargar producto para editar', 'error');
    }
  };

  const handleEliminar = async (id: number, nombre: string) => {
    if (!puedeEliminar) {
      showNotification('No tienes permisos para eliminar productos', 'error');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await adminProductService.eliminarProducto(id);
      showNotification('Producto eliminado exitosamente', 'success');
      cargarProductos();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar producto', 'error');
    }
  };

  const handleGuardado = () => {
    setVista('lista');
    setProductoSeleccionado(null);
    cargarProductos();
  };

  const handleCancelar = () => {
    setVista('lista');
    setProductoSeleccionado(null);
  };

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a productos"
          message="No tienes permisos para administrar catálogo, marcas, categorías ni características."
          tone="warning"
        />
      </div>
    );
  }

  // Renderizar formulario si estamos en crear/editar
  if (vista === 'crear' || vista === 'editar') {
    return (
      <ProductoForm
        modo={vista}
        producto={productoSeleccionado}
        onGuardado={handleGuardado}
        onCancelar={handleCancelar}
      />
    );
  }

  // Vista de lista
  return (
    <div className={styles.container}>
      <AdminSectionActions
        lead={null}
        actions={
          <button
            className={styles.crearButton}
            onClick={() => setVista('crear')}
            disabled={!puedeCrear}
            title={!puedeCrear ? 'Sin permisos para crear productos' : undefined}
          >
            <span className="material-icons">add_box</span>
            <span>Agregar Producto</span>
          </button>
        }
      />

      {/* Barra de tabs */}
      <div className={styles.tabsBar}>
        {[
          { key: 'productos', icon: 'inventory_2', label: 'Productos' },
          { key: 'marcas', icon: 'branding_watermark', label: 'Marcas' },
          { key: 'categorias', icon: 'category', label: 'Categorías' },
          { key: 'caracteristicas', icon: 'tune', label: 'Características' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key as TabProductos)}
          >
            <span className="material-icons">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Pestañas secundarias */}
      {activeTab === 'marcas' && <GestionMarcas />}
      {activeTab === 'categorias' && <GestionCategorias />}
      {activeTab === 'caracteristicas' && <GestionCaracteristicas />}

      {activeTab === 'productos' && (
        <>
          {/* Barra de búsqueda */}
          <AdminSurface className={styles.filterShell} tone="muted">
            <div className={styles.searchForm}>
              <div className={styles.searchInputWrapper}>
                <span className="material-icons">search</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={styles.searchInput}
                />
                {searchInput && (
                  <button type="button" onClick={handleClearSearch} className={styles.clearButton}>
                    <span className="material-icons">close</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                className={`${styles.toggleBtn} ${soloDestacados ? styles.toggleBtnActive : ''}`}
                onClick={handleToggleDestacados}
                title={soloDestacados ? 'Mostrando solo destacados' : 'Mostrar solo destacados'}
              >
                <span className="material-icons">star</span>
                <span>Solo destacados</span>
              </button>
            </div>
          </AdminSurface>

          {/* Estado de carga */}
          {loading && (
            <AdminEmptyState
              icon="hourglass_empty"
              title="Cargando productos"
              message="Estamos armando el catálogo para que puedas trabajar sobre inventario y precios."
              className={styles.stateBlock}
            />
          )}

          {/* Error */}
          {error && !loading && (
            <AdminEmptyState
              icon="error_outline"
              title="No pudimos cargar el catálogo"
              message={error}
              actionLabel="Reintentar"
              onAction={cargarProductos}
              tone="danger"
              className={styles.stateBlock}
            />
          )}

          {/* Tabla de productos */}
          {!loading && !error && (
            <>
              <div className={styles.tableInfo}>
                <span>
                  {total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                  {soloDestacados && <span className={styles.filterBadge}>Solo destacados</span>}
                </span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th className={styles.sortableHeader} onClick={() => handleSort('codigo')}>
                        <span className={styles.sortableHeaderContent}>
                          <span>Código</span>
                          <span
                            className={`material-icons ${styles.sortIcon} ${sortKey === 'codigo' ? styles.sortIconActive : ''}`}
                          >
                            {getSortIcon('codigo')}
                          </span>
                        </span>
                      </th>
                      <th className={styles.sortableHeader} onClick={() => handleSort('nombre')}>
                        <span className={styles.sortableHeaderContent}>
                          <span>Nombre</span>
                          <span
                            className={`material-icons ${styles.sortIcon} ${sortKey === 'nombre' ? styles.sortIconActive : ''}`}
                          >
                            {getSortIcon('nombre')}
                          </span>
                        </span>
                      </th>
                      <th className={styles.sortableHeader} onClick={() => handleSort('categoria')}>
                        <span className={styles.sortableHeaderContent}>
                          <span>Categoría</span>
                          <span
                            className={`material-icons ${styles.sortIcon} ${sortKey === 'categoria' ? styles.sortIconActive : ''}`}
                          >
                            {getSortIcon('categoria')}
                          </span>
                        </span>
                      </th>
                      <th className={styles.sortableHeader} onClick={() => handleSort('marca')}>
                        <span className={styles.sortableHeaderContent}>
                          <span>Marca</span>
                          <span
                            className={`material-icons ${styles.sortIcon} ${sortKey === 'marca' ? styles.sortIconActive : ''}`}
                          >
                            {getSortIcon('marca')}
                          </span>
                        </span>
                      </th>
                      <th className={styles.sortableHeader} onClick={() => handleSort('precio_venta')}>
                        <span className={styles.sortableHeaderContent}>
                          <span>Precio Venta</span>
                          <span
                            className={`material-icons ${styles.sortIcon} ${sortKey === 'precio_venta' ? styles.sortIconActive : ''}`}
                          >
                            {getSortIcon('precio_venta')}
                          </span>
                        </span>
                      </th>
                      <th className={styles.sortableHeader} onClick={() => handleSort('stock')}>
                        <span className={styles.sortableHeaderContent}>
                          <span>Stock</span>
                          <span
                            className={`material-icons ${styles.sortIcon} ${sortKey === 'stock' ? styles.sortIconActive : ''}`}
                          >
                            {getSortIcon('stock')}
                          </span>
                        </span>
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProductos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={styles.emptyMessage}>
                          {searchTerm && soloDestacados
                            ? `No se encontraron productos destacados para "${searchTerm}"`
                            : searchTerm
                              ? `No se encontraron productos para "${searchTerm}"`
                              : soloDestacados
                                ? 'No hay productos destacados'
                                : 'No hay productos registrados'}
                        </td>
                      </tr>
                    ) : (
                      paginatedProductos.map((producto) => {
                        const imagenUrl =
                          producto.imagen_url ||
                          (producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0].url : null);
                        const stockBajo = producto.stock_minimo != null && producto.stock <= producto.stock_minimo;

                        return (
                          <tr key={producto.id_producto}>
                            <td>
                              <div className={styles.thumbnailWrapper}>
                                {imagenUrl ? (
                                  <img src={imagenUrl} alt={producto.nombre} className={styles.thumbnail} />
                                ) : (
                                  <div className={styles.thumbnailPlaceholder}>
                                    <span className="material-icons">image</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className={styles.codigoCell}>{producto.codigo}</td>
                            <td>
                              <div className={styles.nombreCell}>
                                <span>{producto.nombre}</span>
                                {producto.es_destacado && (
                                  <span className={styles.badgeDestacado} title="Producto destacado">
                                    <span className="material-icons">star</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{producto.Categoria?.nombre_categoria || '-'}</td>
                            <td>{producto.marca?.nombre_marca || '-'}</td>
                            <td className={`${styles.precioCell} ${styles.textRight}`}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span>$ {parseFloat(producto.precio_venta).toFixed(2)}</span>
                                <span
                                  style={{
                                    marginLeft: '0px',
                                    fontSize: '0.75rem',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    backgroundColor: '#dbeafe',
                                    color: '#1e40af',
                                    fontWeight: '500',
                                    flexShrink: 0,
                                  }}
                                >
                                  USD
                                </span>
                              </span>
                            </td>
                            <td>
                              <span
                                className={`${styles.stockBadge} ${
                                  producto.stock === 0
                                    ? styles.stockAgotado
                                    : stockBajo
                                      ? styles.stockBajoStyle
                                      : styles.stockNormal
                                }`}
                              >
                                {producto.stock}
                              </span>
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  className={styles.actionButton}
                                  title={isReadOnly ? 'Sin permisos para editar' : 'Editar'}
                                  onClick={() => handleEditar(producto.id_producto)}
                                  disabled={isReadOnly}
                                >
                                  <span className="material-icons">edit</span>
                                </button>
                                <button
                                  className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                                  title={!puedeEliminar ? 'Sin permisos para eliminar' : 'Eliminar'}
                                  onClick={() => handleEliminar(producto.id_producto, producto.nombre)}
                                  disabled={!puedeEliminar}
                                >
                                  <span className="material-icons">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={styles.pageButton}
                  >
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <span className={styles.pageInfo}>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={styles.pageButton}
                  >
                    <span className="material-icons">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GestionProductos;
