import type { Product, ProductUIFilters } from '../types';

export const ORDER_OPTIONS = [
  { value: '', label: 'Sin ordenar' },
  { value: 'name-asc', label: 'Nombre (A-Z)' },
  { value: 'name-desc', label: 'Nombre (Z-A)' },
  { value: 'price-asc', label: 'Precio (menor a mayor)' },
  { value: 'price-desc', label: 'Precio (mayor a menor)' },
  { value: 'discount-desc', label: 'Mayor descuento' },
  { value: 'newest', label: 'Más recientes' },
] as const;

export function filterProducts(
  products: Product[], 
  filters: ProductUIFilters
): Product[] {
  let filtered = [...products];

  const q = filters.search?.toLowerCase().trim();
  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean);
    filtered = filtered.filter(product => {
      const searchable = [
        product.nombre,
        product.descripcion,
        product.codigo,
        product.modelo,
      ].filter(Boolean).join(' ').toLowerCase();
      return tokens.some(token => searchable.includes(token));
    });
  }

  if (filters.selectedDropdownCategory) {
    filtered = filtered.filter(product => 
      String(product.id_categoria) === filters.selectedDropdownCategory
    );
  }

  if (filters.selectedDropdownBrand) {
    filtered = filtered.filter(product => 
      String(product.id_marca) === filters.selectedDropdownBrand
    );
  }

  if (filters.priceMin) {
    const min = Number(filters.priceMin);
    if (!isNaN(min)) {
      filtered = filtered.filter(product => Number(product.precio_venta) >= min);
    }
  }

  if (filters.priceMax) {
    const max = Number(filters.priceMax);
    if (!isNaN(max)) {
      filtered = filtered.filter(product => Number(product.precio_venta) <= max);
    }
  }

  if (filters.onlyStock) {
    filtered = filtered.filter(product => product.stock > 0);
  }

  if (filters.onlyOffers) {
    filtered = filtered.filter(product => product.en_oferta || (product.ofertas && product.ofertas.length > 0));
  }

  return sortProducts(filtered, filters.order);
}

export function getPriceRange(products: Product[]): [number, number] {
  if (products.length === 0) return [0, 0];
  const prices = products.map(p => Number(p.precio_venta)).filter(p => !isNaN(p));
  return [Math.min(...prices), Math.max(...prices)];
}

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
    case 'discount-desc': {
      return sorted.sort((a, b) => {
        const dA = a.descuento_porcentaje || 0;
        const dB = b.descuento_porcentaje || 0;
        return dB - dA;
      });
    }
    case 'newest':
      return sorted.sort((a, b) => new Date(b.fyh_creacion).getTime() - new Date(a.fyh_creacion).getTime());
    default:
      return sorted;
  }
}
