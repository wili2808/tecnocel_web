import type { Product, ProductUIFilters } from '../types';

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

  // ✅ NOTA: La búsqueda ya se aplica en el contexto, solo aplicar filtros adicionales
  // 1. Filtro por categoría del backend
  if (filters.selectedDropdownCategory) {
    filtered = filtered.filter(product => 
      String(product.id_categoria) === filters.selectedDropdownCategory
    );
  }

  // 2. Filtro por marca del backend
  if (filters.selectedDropdownBrand) {
    filtered = filtered.filter(product => 
      String(product.id_marca) === filters.selectedDropdownBrand
    );
  }

  // 3. Filtro por stock disponible
  if (filters.onlyStock) {
    filtered = filtered.filter(product => product.stock > 0);
  }

  // 4. Ordenamiento
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