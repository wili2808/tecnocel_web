/**
 * Componente GestionProductos - CRUD completo de productos desde el admin
 * Lista, busca, crea, edita y elimina productos del catálogo
 * Implementación limpia con TanStack Table v8 y Dnd-kit para drag & drop de columnas.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import adminProductService from '../../../services/adminProductService';
import ProductoForm from './ProductoForm';
import GestionMarcas from './GestionMarcas';
import GestionCategorias from './GestionCategorias';
import GestionCaracteristicas from './GestionCaracteristicas';
import { AdminEmptyState, AdminSectionActions, AdminSurface, AdminSearch } from '../common';
import type { Product } from '../../../types/product';
import styles from './GestionProductos.module.css';

// --- TanStack Table & Dnd-kit Imports ---
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Tipos ---
type Vista = 'lista' | 'crear' | 'editar';
type TabProductos = 'productos' | 'marcas' | 'categorias' | 'caracteristicas';

// --- Componente DraggableTableHeader ---
// Este componente abstrae la cabecera de la tabla para que pueda ser reordenada
const DraggableTableHeader = ({ header }: { header: any }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
    id: header.column.id,
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
    cursor: 'default',
  };

  return (
    <th ref={setNodeRef} style={style} className={styles.sortableHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Agarradera para drag & drop */}
        <span 
          {...attributes} 
          {...listeners} 
          className="material-icons" 
          style={{ fontSize: '16px', color: '#aaa', cursor: 'grab' }}
          title="Arrastrar para mover columna"
        >
          drag_indicator
        </span>
        
        {/* Contenido clickeable para ordenar */}
        <div
          className={header.column.getCanSort() ? styles.sortableHeaderContent : ''}
          onClick={header.column.getToggleSortingHandler()}
          style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          
          {/* Icono de ordenamiento de TanStack Table */}
          {header.column.getCanSort() && (
            <span
              className={`material-icons ${styles.sortIcon} ${header.column.getIsSorted() ? styles.sortIconActive : ''}`}
            >
              {{
                asc: 'arrow_upward',
                desc: 'arrow_downward',
              }[header.column.getIsSorted() as string] ?? 'unfold_more'}
            </span>
          )}
        </div>
      </div>
    </th>
  );
};

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
    'imagen', 'codigo', 'nombre', 'categoria', 'marca', 'precio_venta', 'stock', 'acciones'
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

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

  const handleToggleDestacados = () => {
    setSoloDestacados((prev) => !prev);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleEditar = useCallback(async (id: number) => {
    try {
      const producto = await adminProductService.obtenerProducto(id);
      setProductoSeleccionado(producto);
      setVista('editar');
    } catch {
      showNotification('Error al cargar producto para editar', 'error');
    }
  }, [showNotification]);

  const handleEliminar = useCallback(async (id: number, nombre: string) => {
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
  }, [puedeEliminar, showNotification, cargarProductos]);

  const handleGuardado = () => {
    setVista('lista');
    setProductoSeleccionado(null);
    cargarProductos();
  };

  const handleCancelar = () => {
    setVista('lista');
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
    },
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: (info) => {
        const p = info.row.original;
        return (
          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              title={isReadOnly ? 'Sin permisos para editar' : 'Editar'}
              onClick={() => handleEditar(p.id_producto)}
              disabled={isReadOnly}
            >
              <span className="material-icons">edit</span>
            </button>
            <button
              className={`${styles.actionButton} ${styles.actionButtonDanger}`}
              title={!puedeEliminar ? 'Sin permisos para eliminar' : 'Eliminar'}
              onClick={() => handleEliminar(p.id_producto, p.nombre)}
              disabled={!puedeEliminar}
            >
              <span className="material-icons">delete</span>
            </button>
          </div>
        );
      },
    },
  ], [isReadOnly, puedeEliminar, handleEditar, handleEliminar]);

  // --- Instancia de TanStack Table ---
  const table = useReactTable({
    data: filteredProductos,
    columns,
    state: {
      sorting,
      columnOrder,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // --- Sensores y Manejador para Dnd-kit (Reordenamiento de columnas) ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
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

      {activeTab === 'marcas' && <GestionMarcas />}
      {activeTab === 'categorias' && <GestionCategorias />}
      {activeTab === 'caracteristicas' && <GestionCaracteristicas />}

      {activeTab === 'productos' && (
        <>
          {/* Barra de búsqueda */}
          <AdminSurface className={styles.filterShell} tone="muted">
            <div className={styles.searchForm}>
              <AdminSearch
                value={searchTerm}
                placeholder="Buscar por nombre o código..."
                onChange={(val) => {
                  setSearchTerm(val);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              />
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

          {/* Tabla de productos (TanStack Table) */}
          {!loading && !error && (
            <>
              <div className={styles.tableInfo}>
                <span>
                  {filteredProductos.length} producto{filteredProductos.length !== 1 ? 's' : ''} encontrado{filteredProductos.length !== 1 ? 's' : ''}
                  {soloDestacados && <span className={styles.filterBadge}>Solo destacados</span>}
                </span>
              </div>

              <div className={styles.tableWrapper}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className={styles.table}>
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          <SortableContext
                            items={columnOrder}
                            strategy={horizontalListSortingStrategy}
                          >
                            {headerGroup.headers.map((header) => (
                              <DraggableTableHeader
                                key={header.id}
                                header={header}
                              />
                            ))}
                          </SortableContext>
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className={styles.emptyMessage}>
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
                        table.getRowModel().rows.map((row) => (
                          <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </DndContext>
              </div>

              {/* Paginación */}
              {table.getPageCount() > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className={styles.pageButton}
                  >
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <span className={styles.pageInfo}>
                    Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
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