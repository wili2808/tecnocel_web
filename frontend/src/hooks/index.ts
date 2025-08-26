// Hooks de autenticación
export { useAuthActions } from './useAuthActions';
export { useAuthForm, authValidationConfigs } from './useAuthForm';
export { useAutoLogout } from './useAutoLogout';

// Hooks de productos (CONSOLIDADO - ProductContext)
export { useProductActions } from './useProductActions';

// Hooks de carrito
export { useCarrito } from './useCarrito';
export { useCarritoOperations } from './useCarritoOperations';
export { useCarritoUtils } from './useCarritoUtils';

// Hooks de ofertas
export { useOfertas } from './useOfertas';
export { useOfertasGlobal, useOfertasProducto } from './useOfertasGlobal';
export { useOfertasPagination } from './useOfertasPagination';

// Hooks de favoritos
export { useFavoritos } from './useFavoritos';
export { useFavoritosProductos } from './useFavoritosProductos';

// Hooks de componentes
// useProductCardLogic eliminado - lógica integrada en ProductCard.tsx

// Hooks de utilidad
export { useEscapeKey } from './useEscapeKey';

// Hooks de direcciones
export { useDirecciones } from './useDirecciones'; 