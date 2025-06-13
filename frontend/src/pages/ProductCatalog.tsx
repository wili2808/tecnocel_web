import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/product/ProductCard';
import styles from '../styles/Product.module.css';
import productService from '../services/productService';
import type { ProductCardProps } from '../components/product/ProductCard';

// Categorías personalizadas
const CATEGORIES = [
  { key: 'android', label: 'Android' },
  { key: 'iphone', label: 'iPhone' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'notebook', label: 'Notebook' },
  { key: 'sonido', label: 'Sonido' },
];

// Función para categorizar productos
function getProductCategory(product: ProductCardProps): string[] {
  const name = (product.nombre || '').toLowerCase();
  const desc = (product.descripcion || '').toLowerCase();
  const categories: string[] = [];

  // Palabras clave para celulares Android (marcas y términos comunes)
  const androidBrands = [
    'samsung', 'xiaomi', 'motorola', 'huawei', 'oppo', 'vivo', 'realme', 'oneplus', 'nokia', 'sony', 'lg', 'alcatel', 'zte', 'lenovo', 'google pixel', 'redmi', 'poco', 'honor', 'infinix', 'tecno', 'celular', 'smartphone', 'android'
  ];

  // iPhone
  if (name.includes('iphone') || name.includes('ios') || desc.includes('iphone') || desc.includes('ios')) {
    categories.push('iphone');
  } else {
    // Si es un celular de marca Android y NO es iPhone, es Android
    if (androidBrands.some(brand => name.includes(brand) || desc.includes(brand))) {
      categories.push('android');
    }
  }

  // Gaming
  if (
    name.includes('gaming') || name.includes('juego') || name.includes('ps4') || name.includes('xbox') || name.includes('nintendo') ||
    desc.includes('gaming') || desc.includes('juego') || desc.includes('ps4') || desc.includes('xbox') || desc.includes('nintendo')
  ) {
    categories.push('gaming');
  }
  // Notebook
  if (
    name.includes('notebook') || name.includes('laptop') || name.includes('macbook') ||
    desc.includes('notebook') || desc.includes('laptop') || desc.includes('macbook')
  ) {
    categories.push('notebook');
  }
  // Sonido
  if (
    name.includes('sonido') || name.includes('audifon') || name.includes('auricular') || name.includes('parlante') || name.includes('bocina') ||
    desc.includes('sonido') || desc.includes('audifon') || desc.includes('auricular') || desc.includes('parlante') || desc.includes('bocina')
  ) {
    categories.push('sonido');
  }
  return categories;
}

const ORDER_OPTIONS = [
  { value: 'name-asc', label: 'Nombre (A-Z)' },
  { value: 'name-desc', label: 'Nombre (Z-A)' },
  { value: 'price-asc', label: 'Precio (menor a mayor)' },
  { value: 'price-desc', label: 'Precio (mayor a menor)' },
];

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id_categoria: number; nombre_categoria: string }[]>([]);

  // Recuperar filtros guardados del localStorage
  const [filtros, setFiltros] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('catalogoFiltros') || '{}');
    } catch {
      return {};
    }
  });

  const actualizarFiltros = (nuevosFiltros: any) => {
    setFiltros(nuevosFiltros);
    localStorage.setItem('catalogoFiltros', JSON.stringify(nuevosFiltros));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getProducts();
        const mappedProducts = data.map((prod: any) => ({
          id_producto: prod.id_producto,
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          imagen: prod.imagen,
          precio_venta: prod.precio_venta,
          stock: prod.stock,
          id_categoria: prod.id_categoria,
        }));
        setProducts(mappedProducts);
      } catch (error: any) {
        setError(error.response?.data?.message || error.message || 'Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Obtener categorías del backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getCategorias();
        setCategories(data);
      } catch (e) {
        // No bloquear la UI si falla, solo dejar vacío
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Filtrado y ordenamiento memoizados
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // 1. Buscador: prioridad máxima
    if ((filtros.search || '').trim()) {
      const s = (filtros.search || '').trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(s) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(s))
      );
      // Si hay resultados, aplicar los demás filtros SOLO sobre estos
      if (filtros.selectedDropdownCategory) {
        filtered = filtered.filter(p => String((p as any).id_categoria) === filtros.selectedDropdownCategory);
      }
      if (filtros.selectedCategory) {
        filtered = filtered.filter(p => getProductCategory(p).includes(filtros.selectedCategory));
      }
      if (filtros.onlyStock) {
        filtered = filtered.filter(p => p.stock > 0);
      }
    } else {
      // 2. Si no hay búsqueda, aplicar filtros de categoría y stock sobre todos
      if (filtros.selectedDropdownCategory) {
        filtered = filtered.filter(p => String((p as any).id_categoria) === filtros.selectedDropdownCategory);
      }
      if (filtros.selectedCategory) {
        filtered = filtered.filter(p => getProductCategory(p).includes(filtros.selectedCategory));
      }
      if (filtros.onlyStock) {
        filtered = filtered.filter(p => p.stock > 0);
      }
    }

    // 3. Ordenamiento siempre al final
    switch (filtros.order) {
      case 'name-asc':
        filtered = [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'name-desc':
        filtered = [...filtered].sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'price-asc':
        filtered = [...filtered].sort((a, b) => Number(a.precio_venta) - Number(b.precio_venta));
        break;
      case 'price-desc':
        filtered = [...filtered].sort((a, b) => Number(b.precio_venta) - Number(a.precio_venta));
        break;
    }
    return filtered;
  }, [products, filtros]);

  if (loading) {
    return (
      <div className={styles.productsSection}>
        <div className={styles.productsContainer}>
          <div className="text-center py-20">
            <span className="material-icons animate-spin text-4xl text-primary">refresh</span>
            <p className="mt-4 text-secondary">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.productsSection}>
        <div className={styles.productsContainer}>
          <div className="text-center py-20">
            <span className="material-icons text-4xl text-error">error_outline</span>
            <p className="mt-4 text-error">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.productsSection}>
      <div className={styles.productsContainer}>
        <h1 className={styles.sectionTitle}>
          Catálogo de Productos
        </h1>
        {/* Barra superior de filtros y buscador */}
        <div className={styles.filtersBar}>
          {/* Buscador */}
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar productos..."
            value={filtros.search || ''}
            onChange={e => {
              actualizarFiltros({
                ...filtros,
                search: e.target.value,
              });
            }}
            aria-label="Buscar productos"
          />
          {/* Desplegable de categorías del backend */}
          <select
            className={styles.orderSelect}
            value={filtros.selectedDropdownCategory || ''}
            onChange={e => {
              actualizarFiltros({
                ...filtros,
                selectedDropdownCategory: e.target.value,
              });
            }}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>
            ))}
          </select>
          {/* Chips de categorías destacadas */}
          <div className={styles.chipsContainer}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={
                  styles.chip +
                  (filtros.selectedCategory === cat.key ? ' ' + styles.chipActive : '')
                }
                onClick={() => {
                  const newSelectedCategory = filtros.selectedCategory === cat.key ? null : cat.key;
                  actualizarFiltros({
                    ...filtros,
                    selectedCategory: newSelectedCategory,
                  });
                }}
                aria-pressed={filtros.selectedCategory === cat.key}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* Ordenamiento */}
          <select
            className={styles.orderSelect}
            value={filtros.order || ''}
            onChange={e => {
              actualizarFiltros({
                ...filtros,
                order: e.target.value,
              });
            }}
            aria-label="Ordenar productos"
          >
            {ORDER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Toggle de stock disponible */}
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={!!filtros.onlyStock}
              onChange={e => {
                actualizarFiltros({
                  ...filtros,
                  onlyStock: e.target.checked,
                });
              }}
              className={styles.toggleCheckbox}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleText}>Solo stock disponible</span>
          </label>
        </div>
        {/* Grid de productos filtrados */}
        <div className={styles.productsGrid}>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 w-full">
              <span className="material-icons text-4xl text-secondary">search_off</span>
              <p className="mt-4 text-secondary">No se encontraron productos.</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <ProductCard
                key={product.id_producto}
                {...product}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductCatalog;
