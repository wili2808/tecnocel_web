import type { ProductCardProps } from '../components/product/ProductCard';

// Categorías personalizadas
export const CUSTOM_CATEGORIES = [
  { key: 'android', label: 'Android' },
  { key: 'iphone', label: 'iPhone' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'notebook', label: 'Notebook' },
  { key: 'sonido', label: 'Sonido' },
] as const;

export type CustomCategoryKey = typeof CUSTOM_CATEGORIES[number]['key'];

// Configuración de palabras clave para categorización
const CATEGORY_KEYWORDS = {
  android: [
    'samsung', 'xiaomi', 'motorola', 'huawei', 'oppo', 'vivo', 'realme', 
    'oneplus', 'nokia', 'sony', 'lg', 'alcatel', 'zte', 'lenovo', 
    'google pixel', 'redmi', 'poco', 'honor', 'infinix', 'tecno', 
    'celular', 'smartphone', 'android'
  ],
  iphone: ['iphone', 'ios'],
  gaming: ['gaming', 'juego', 'ps4', 'xbox', 'nintendo'],
  notebook: ['notebook', 'laptop', 'macbook'],
  sonido: ['sonido', 'audifon', 'auricular', 'parlante', 'bocina']
} as const;

/**
 * Determina las categorías personalizadas de un producto basándose en su nombre y descripción
 */
export function getProductCustomCategories(product: ProductCardProps): CustomCategoryKey[] {
  const name = (product.nombre || '').toLowerCase();
  const desc = (product.descripcion || '').toLowerCase();
  const categories: CustomCategoryKey[] = [];

  // iPhone tiene prioridad sobre Android
  if (containsKeywords(name, desc, CATEGORY_KEYWORDS.iphone)) {
    categories.push('iphone');
  } else if (containsKeywords(name, desc, CATEGORY_KEYWORDS.android)) {
    // Solo si NO es iPhone y contiene palabras clave de Android
    categories.push('android');
  }

  // Otras categorías pueden coexistir
  if (containsKeywords(name, desc, CATEGORY_KEYWORDS.gaming)) {
    categories.push('gaming');
  }
  
  if (containsKeywords(name, desc, CATEGORY_KEYWORDS.notebook)) {
    categories.push('notebook');
  }
  
  if (containsKeywords(name, desc, CATEGORY_KEYWORDS.sonido)) {
    categories.push('sonido');
  }

  return categories;
}

/**
 * Verifica si el nombre o descripción contienen alguna de las palabras clave
 */
function containsKeywords(name: string, description: string, keywords: readonly string[]): boolean {
  return keywords.some(keyword => 
    name.includes(keyword) || description.includes(keyword)
  );
}

/**
 * Obtiene la etiqueta de una categoría personalizada
 */
export function getCategoryLabel(categoryKey: CustomCategoryKey): string {
  const category = CUSTOM_CATEGORIES.find(cat => cat.key === categoryKey);
  return category?.label || categoryKey;
} 