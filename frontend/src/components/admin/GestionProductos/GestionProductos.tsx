/**
 * Componente GestionProductos - CRUD completo de productos desde el admin
 * Lista, busca, crea, edita y elimina productos del catálogo
 * Implementación limpia con TanStack Table v8 y Dnd-kit para drag & drop de columnas.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import adminProductService from '../../../services/adminProductService';
import ProductoModal from './ProductoModal';
import GestionMarcas from './GestionMarcas';
import GestionCategorias from './GestionCategorias';
import GestionCaracteristicas from './GestionCaracteristicas';
import {
  AdminEmptyState,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminDataTable,
} from '../common';
import type { Product } from '../../../types/product';
import styles from './GestionProductos.module.css';

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

// --- Tipos ---
type TabProductos = 'productos' | 'marcas' | 'categorias' | 'caracteristicas';

const GestionProductos = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_productos');
  const puedeCrear = tienePermiso('crear_producto');
  const puedeEditar = tienePermiso('editar_producto');

  const isReadOnly = !puedeEditar;
  const { showNotification } = useNotification();

  // Estado de la vista
  const [activeTab, setActiveTab] = useState<TabProductos>('productos');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Estado de la lista
  const [allProductos, setAllProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro de destacados
  const [soloDestacados, setSoloDestacados] = useState(false);

  // --- Estados de TanStack Table ---
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'imagen', 'codigo', 'nombre', 'categoria', 'marca', 'precio_venta', 'stock'
  ]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

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
    cargarProductos();
  }, [cargarProductos]);

  const handleToggleDestacados = () => {
    setSoloDestacados((prev) => !prev);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleEditar = useCallback(async (id: number) => {
    try {
      const producto = await adminProductService.obtenerProducto(id);
      setProductoSeleccionado(producto);
      setModalOpen(true);
    } catch {
      showNotification('Error al cargar producto para editar', 'error');
    }
  }, [showNotification]);

  const handleCrear = useCallback(() => {
    setProductoSeleccionado(null);
    setModalOpen(true);
  }, []);

  const handleGuardado = () => {
    setModalOpen(false);
    setProductoSeleccionado(null);
    cargarProductos();
  };

  const handleCancelar = () => {
    setModalOpen(false);
    setProductoSeleccionado(null);
  };

  // 1. Filtrar por destacados
  const filteredProductos = useMemo(() => {
    if (!soloDestacados) return allProductos;
    return allProductos.filter((p) => p.es_destacado);
  }, [allProductos, soloDestacados]);

  // --- Definición de columnas para TanStack Table ---
  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      id: 'imagen',
      accessorFn: (row) => row.imagen_url || (row.imagenes?.length ? row.imagenes[0].url : null),
      header: 'Imagen',
      enableSorting: false,
      cell: (info) => {
        const url = info.getValue() as string | null;
        return (
          <div className={styles.thumbnailWrapper}>
            {url ? (
              <img src={url} alt="Producto" className={styles.thumbnail} />
            ) : (
              <div className={styles.thumbnailPlaceholder}>
                <span className="material-icons">image</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'codigo',
      id: 'codigo',
      header: 'Código',
      cell: (info) => <span className={styles.codigoCell}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'nombre',
      id: 'nombre',
      header: 'Nombre',
      cell: (info) => {
        const p = info.row.original;
        return (
          <div className={styles.nombreCell}>
            <span>{p.nombre}</span>
            {p.es_destacado && (
              <span className={styles.badgeDestacado} title="Producto destacado">
                <span className="material-icons">star</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'categoria',
      accessorFn: (row) => row.Categoria?.nombre_categoria || '-',
      header: 'Categoría',
    },
    {
      id: 'marca',
      accessorFn: (row) => row.marca?.nombre_marca || '-',
      header: 'Marca',
    },
    {
      accessorKey: 'precio_venta',
      id: 'precio_venta',
      header: 'Precio Venta',
      cell: (info) => {
        const val = parseFloat(info.getValue() as string) || 0;
        return (
          <div className={`${styles.precioCell} ${styles.textRight}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>$ {val.toFixed(2)}</span>
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
          </div>
        );
      },
    },
    {
      accessorKey: 'stock',
      id: 'stock',
      header: 'Stock',
      cell: (info) => {
        const p = info.row.original;
        const stockBajo = p.stock_minimo != null && p.stock <= p.stock_minimo;
        return (
          <span
            className={`${styles.stockBadge} ${
              p.stock === 0
                ? styles.stockAgotado
                : stockBajo
                  ? styles.stockBajoStyle
                  : styles.stockNormal
            }`}
          >
            {p.stock}
          </span>
        );
      },
    }
  ], []);


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

  // Renderizado principal
  return (
    <div className={styles.container}>

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

      {activeTab === 'marcas' && <GestionMarcas />}
      {activeTab === 'categorias' && <GestionCategorias />}
      {activeTab === 'caracteristicas' && <GestionCaracteristicas />}

      {activeTab === 'productos' && (
        <>
          <AdminFilterPanel>
            <AdminFilterPanel.Row variant="bottom">
              <AdminFilterPanel.Grow>
                <AdminEntitySearchBar
                  searchValue={searchTerm}
                  searchLabel="Búsqueda"
                  searchPlaceholder="Buscar por nombre o código..."
                  onSearchChange={(val) => {
                    setSearchTerm(val);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  primaryActionLabel="Agregar Producto"
                  primaryActionIcon="add_box"
                  onPrimaryAction={handleCrear}
                  primaryActionDisabled={!puedeCrear}
                />
              </AdminFilterPanel.Grow>
              <AdminFilterPanel.Actions>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${soloDestacados ? styles.toggleBtnActive : ''}`}
                  onClick={handleToggleDestacados}
                  title={soloDestacados ? 'Mostrando solo destacados' : 'Mostrar solo destacados'}
                >
                  <span className="material-icons">{soloDestacados ? 'star' : 'star_outline'}</span>
                </button>
              </AdminFilterPanel.Actions>
            </AdminFilterPanel.Row>
          </AdminFilterPanel>

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

          {/* Tabla de productos (AdminDataTable) */}
          {!loading && !error && (
            <AdminDataTable
              data={filteredProductos}
              columns={columns}
              sorting={sorting}
              onSortingChange={setSorting}
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
              pagination={pagination}
              onPaginationChange={setPagination}
              totalItems={filteredProductos.length}
              itemLabel="productos"
              onRowClick={(row) => !isReadOnly && handleEditar(row.id_producto)}
              isLoading={loading}
              manualPagination={false}
              emptyMessage={
                searchTerm && soloDestacados
                  ? `No se encontraron productos destacados para "${searchTerm}"`
                  : searchTerm
                    ? `No se encontraron productos para "${searchTerm}"`
                    : soloDestacados
                      ? 'No hay productos destacados'
                      : 'No hay productos registrados'
              }
            />
          )}
        </>
      )}

      {/* Modal de Producto */}
      <ProductoModal
        isOpen={modalOpen}
        producto={productoSeleccionado}
        onClose={handleCancelar}
        onGuardado={handleGuardado}
      />
    </div>
  );
};

export default GestionProductos;
