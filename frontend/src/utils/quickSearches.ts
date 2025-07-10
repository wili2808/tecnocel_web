// Configuración de búsquedas rápidas - términos más buscados
export const QUICK_SEARCHES = [
  { key: 'samsung', label: 'Samsung', searchTerm: 'samsung' },
  { key: 'iphone', label: 'iPhone', searchTerm: 'iphone' },
  { key: 'xiaomi', label: 'Xiaomi', searchTerm: 'xiaomi' },
  { key: 'audifono', label: 'Audífonos', searchTerm: 'audifono' },
  { key: 'cargador', label: 'Cargadores', searchTerm: 'cargador' },
  { key: 'funda', label: 'Fundas', searchTerm: 'funda' },
  { key: 'protector', label: 'Protectores', searchTerm: 'protector' },
  { key: 'cable', label: 'Cables', searchTerm: 'cable' },
] as const;

export type QuickSearchKey = typeof QUICK_SEARCHES[number]['key'];

/**
 * Obtiene la etiqueta de una búsqueda rápida
 */
export function getQuickSearchLabel(searchKey: QuickSearchKey): string {
  const quickSearch = QUICK_SEARCHES.find(qs => qs.key === searchKey);
  return quickSearch?.label || searchKey;
}

/**
 * Obtiene el término de búsqueda de una búsqueda rápida
 */
export function getQuickSearchTerm(searchKey: QuickSearchKey): string {
  const quickSearch = QUICK_SEARCHES.find(qs => qs.key === searchKey);
  return quickSearch?.searchTerm || '';
}

/**
 * Cuenta productos que coinciden con cada término de búsqueda rápida
 */
export function getQuickSearchCounts(products: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  QUICK_SEARCHES.forEach(({ key, searchTerm }) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchingProducts = products.filter(product =>
      product.nombre.toLowerCase().includes(searchTermLower) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchTermLower))
    );
    counts[key] = matchingProducts.length;
  });
  
  return counts;
} 