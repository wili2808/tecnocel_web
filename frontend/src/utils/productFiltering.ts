import type { Product } from '../types/product';
import type { ProductUIFilters } from '../hooks/useProductFilters';
import { getProductCustomCategories } from './productCategorization';

export const ORDER_OPTIONS = [
  { value: '', label: 'Sin ordenar' },
  { value: 'name-asc', label: 'Nombre (A-Z)' },
  { value: 'name-desc', label: 'Nombre (Z-A)' },
  { value: 'price-asc', label: 'Precio (menor a mayor)' },
  { value: 'price-desc', label: 'Precio (mayor a menor)' },
] as const;

/**
 * Filtra productos basándose en los criterios seleccionados
 */
export function filterProducts(
  products: Product[], 
  filters: ProductUIFilters
): Product[] {
  let filtered = [...products];

  // 1. Filtro de búsqueda (prioridad máxima)
  if (filters.search.trim()) {
    const searchTerm = filters.search.trim().toLowerCase();
    filtered = filtered.filter(product =>
      product.nombre.toLowerCase().includes(searchTerm) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm))
    );
  }

  // 2. Filtro por categoría del backend
  if (filters.selectedDropdownCategory) {
    filtered = filtered.filter(product => 
      String(product.id_categoria) === filters.selectedDropdownCategory
    );
  }

  // 3. Filtro por categoría personalizada
  if (filters.selectedCategory) {
    filtered = filtered.filter(product => 
      getProductCustomCategories(product).includes(filters.selectedCategory as any)
    );
  }

  // 4. Filtro por stock disponible
  if (filters.onlyStock) {
    filtered = filtered.filter(product => product.stock > 0);
  }

  // 5. Ordenamiento
  return sortProducts(filtered, filters.order);
}

/**
 * Ordena productos según el criterio especificado
 */
function sortProducts(products: Product[], orderBy: string): Product[] {
  if (!orderBy) return products;

  const sorted = [...products];

  switch (orderBy) {
    case 'name-asc':
      return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    case 'name-desc':
      return sorted.sort((a, b) => b.nombre.localeCompare(a.nombre));
    
    case 'price-asc':
      return sorted.sort((a, b) => Number(a.precio_venta) - Number(b.precio_venta));
    
    case 'price-desc':
      return sorted.sort((a, b) => Number(b.precio_venta) - Number(a.precio_venta));
    
    default:
      return sorted;
  }
}

/**
 * Cuenta productos por categoría personalizada
 */
export function getProductCountByCustomCategory(
  products: Product[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  products.forEach(product => {
    const categories = getProductCustomCategories(product);
    categories.forEach(category => {
      counts[category] = (counts[category] || 0) + 1;
    });
  });
  
  return counts;
} 