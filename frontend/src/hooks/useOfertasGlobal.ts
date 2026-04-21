import { useOfertasGlobal as useOfertasContext } from '../contexts/OfertasGlobalContext';
import type { Oferta } from '../types';

/**
 * Hook optimizado para ProductCard - SOLO se re-renderiza cuando cambia la oferta del producto específico
 */
export const useOfertasProducto = (productId: number) => {
    const context = useOfertasContext();

    // SIMPLIFICACIÓN: Retornar directamente las funciones sin memoización innecesaria
    return {
        isProductoEnOferta: () => context.isProductoEnOferta(productId),
        getOfertaInfo: () => context.getOfertaInfo(productId)
    };
};

/**
 * Hook personalizado para el contexto global de ofertas
 * Proporciona métodos optimizados y estado centralizado
 */
export const useOfertasGlobal = () => {
    const context = useOfertasContext();

    // Métodos optimizados para uso común
    const getOfertaInfo = (productId: number) => {
        return context.getOfertaInfo(productId);
    };

    const isProductoEnOferta = (productId: number) => {
        return context.isProductoEnOferta(productId);
    };

    const getOfertasActivas = () => {
        return context.getOfertasActivas();
    };

    const getOfertasExpiradas = () => {
        return context.getOfertasExpiradas();
    };

    const getProductosPorOferta = (ofertaId: number) => {
        return context.getProductosPorOferta(ofertaId);
    };

    const getOfertaById = (id: number) => {
        return context.getOfertaById(id);
    };

    const calculateTimeRemaining = (oferta: Oferta) => {
        return context.calculateTimeRemaining(oferta);
    };

    const isOfertaActive = (oferta: Oferta) => {
        return context.isOfertaActive(oferta);
    };

    // Métodos de gestión
    const loadOfertas = context.loadOfertas;
    const refreshOfertas = context.refreshOfertas;
    const clearOfertas = context.clearOfertas;

    // Métodos de utilidad
    const getOfertasCount = context.getOfertasCount;
    const getProductosEnOfertaCount = context.getProductosEnOfertaCount;

    // Métodos de cache
    const isCacheValid = context.isCacheValid;
    const invalidateCache = context.invalidateCache;

    // Nuevos métodos del servicio mejorado
    const getEstadisticas = context.getEstadisticas;
    const buscarOfertas = context.buscarOfertas;
    const getOfertasProximasAExpirar = context.getOfertasProximasAExpirar;
    const verificarProductoEnOferta = context.verificarProductoEnOferta;

    return {
        // Estado
        ofertas: context.ofertas,
        productosEnOferta: context.productosEnOferta,
        ofertasActivas: context.ofertasActivas,
        ofertasExpiradas: context.ofertasExpiradas,
        loading: context.loading,
        error: context.error,
        lastUpdated: context.lastUpdated,

        // Métodos principales (optimizados)
        getOfertaInfo,
        isProductoEnOferta,
        getOfertasActivas,
        getOfertasExpiradas,
        getProductosPorOferta,
        getOfertaById,
        calculateTimeRemaining,
        isOfertaActive,

        // Métodos de gestión
        loadOfertas,
        refreshOfertas,
        clearOfertas,

        // Métodos de utilidad
        getOfertasCount,
        getProductosEnOfertaCount,

        // Métodos de cache
        isCacheValid,
        invalidateCache,

        // Nuevos métodos del servicio mejorado
        getEstadisticas,
        buscarOfertas,
        getOfertasProximasAExpirar,
        verificarProductoEnOferta
    };
};

export default useOfertasGlobal;
