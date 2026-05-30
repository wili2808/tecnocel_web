/**
 * Componente GestionProductos - CRUD completo de productos desde el admin
 * Lista, busca, crea, edita y elimina productos del catálogo
 * Implementación limpia con TanStack Table v8 y Dnd-kit para drag & drop de columnas.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS } from '../../../utils/formatPrecio';
import adminProductService from '../../../services/adminProductService';
import ProductoModal from './ProductoModal';
import GestionMarcas from './GestionMarcas';
import GestionCategorias from './GestionCategorias';
import GestionCaracteristicas from './GestionCaracteristicas';
import {
  AdminEmptyState,
  AdminLoading,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminDataTable,
  AdminTabs,
} from '../common';
import type { AdminTabConfig } from '../common';
import type { Product } from '../../../types/product';
import styles from './GestionProductos.module.css';

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

// --- Tipos ---
type TabProductos = 'productos' | 'marcas' | 'categorias' | 'caracteristicas';

const GestionProductos = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_productos');
  const puedeCrear = tienePermiso('crear_producto');

  const { showNotification } = useNotification();
  const { tipoCambio } = useTipoCambio();

  // Estado de la vista
  const [activeTab, setActiveTab] = useState<TabProductos>('productos');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Estado de la lista
  const [allProductos, setAllProductos] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro de destacados
  const [soloDestacados, setSoloDestacados] = useState(false);
  const [soloInactivos, setSoloInactivos] = useState(false);

  // --- Estados de TanStack Table ---
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'imagen', 'codigo', 'nombre', 'categoria', 'marca', 'precio_venta', 'precio_venta_ars', 'stock'
  ]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const cargarProductos = useCallback(async (p: PaginationState, s: SortingState, sd: boolean, si: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const page = p.pageIndex + 1;
      let sortBy = 'fyh_creacion';
      let order: 'ASC' | 'DESC' = 'DESC';

      if (s.length > 0) {
        const st = s[0];
        order = st.desc ? 'DESC' : 'ASC';
        switch (st.id) {
          case 'codigo': sortBy = 'codigo'; break;
          case 'nombre': sortBy = 'nombre'; break;
          case 'precio_venta': sortBy = 'precio_venta'; break;
          case 'stock': sortBy = 'stock'; break;
          default: sortBy = 'fyh_creacion';
        }
      }

      const data = await adminProductService.listarProductos(
        searchTerm || undefined, 
        p.pageSize, 
        page, 
        sortBy, 
        order,
        sd,
        false, // No ver inactivos por defecto
        si     // solo_inactivos
      );
      setAllProductos(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
      showNotification(err.message || 'Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showNotification]);

  useEffect(() => {
    cargarProductos(pagination, sorting, soloDestacados, soloInactivos);
  }, [cargarProductos, pagination, sorting, soloDestacados, soloInactivos]);

  const handleToggleDestacados = () => {
    setSoloDestacados((prev) => !prev);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleToggleInactivos = () => {
    setSoloInactivos((prev) => !prev);
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
    cargarProductos(pagination, sorting, soloDestacados, soloInactivos);
  };

  const handleCancelar = () => {
    setModalOpen(false);
    setProductoSeleccionado(null);
  };

  // 1. Filtrar por destacados

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
        const formatoUSD = new Intl.NumberFormat('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val);
        return (
          <div className={`${styles.precioCell} ${styles.textLeft}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
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
              <span>$ {formatoUSD}</span>
            </span>
          </div>
        );
      },
    },
    {
      id: 'precio_venta_ars',
      accessorFn: (row) => Math.round(parseFloat(row.precio_venta) * tipoCambio),
      header: 'Precio ARS',
      cell: (info) => {
        const valUSD = parseFloat(info.row.original.precio_venta) || 0;
        return (
          <div className={`${styles.precioCell} ${styles.textLeft}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  marginLeft: '0px',
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: '#e0f2e9',
                  color: '#0d6636',
                  fontWeight: '500',
                  flexShrink: 0,
                }}
              >
                ARS
              </span>
              <span>{formatARS(valUSD, tipoCambio)}</span>
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
          <div className={styles.textLeft}>
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
          </div>
        );
      },
    },
    {
      accessorKey: 'activo',
      id: 'estado',
      header: 'Estado',
      cell: (info) => {
        const activo = info.getValue() as boolean;
        return (
          <span className={`modalBadgePremium ${activo ? 'success' : 'error'}`}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        );
      }
    }
  ], [tipoCambio]);


  const productTabs = useMemo<AdminTabConfig[]>(() => [
    { id: 'productos', icon: 'inventory_2', label: 'Productos' },
    { id: 'marcas', icon: 'branding_watermark', label: 'Marcas' },
    { id: 'categorias', icon: 'category', label: 'Categorías' },
    { id: 'caracteristicas', icon: 'tune', label: 'Características' },
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
      <AdminTabs 
        tabs={productTabs} 
        activeTab={activeTab} 
        onChange={(id) => setActiveTab(id as TabProductos)} 
      />

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
                  Destacados
                </button>

                <button
                  type="button"
                  className={`${styles.toggleBtn} ${soloInactivos ? styles.toggleBtnActive : ''}`}
                  onClick={handleToggleInactivos}
                  title={soloInactivos ? 'Ver todos los productos' : 'Ver solo productos inactivos'}
                >
                  <span className="material-icons">{soloInactivos ? 'visibility' : 'visibility_off'}</span>
                  Inactivos
                </button>
              </AdminFilterPanel.Actions>
            </AdminFilterPanel.Row>
          </AdminFilterPanel>

          {/* Estado de carga */}
          {loading && (
            <AdminLoading
              variant="panel"
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
              onAction={() => cargarProductos(pagination, sorting, soloDestacados, soloInactivos)}
              tone="danger"
              className={styles.stateBlock}
            />
          )}

          {/* Tabla de productos (AdminDataTable) */}
          {!loading && !error && (
            <AdminDataTable
              data={allProductos}
              columns={columns}
              sorting={sorting}
              onSortingChange={setSorting}
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
              pagination={pagination}
              onPaginationChange={setPagination}
              totalItems={total}
              itemLabel="productos"
              onRowClick={(row) => handleEditar(row.id_producto)}
              isLoading={loading}
              manualPagination={true}
              manualSorting={true}
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
