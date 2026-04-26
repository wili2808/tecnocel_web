import { useState, useEffect } from 'react';
import ofertaService from '../services/ofertaService';
import type { Product, Oferta } from '../types';

interface UseOfertasReturn {
  ofertas: Oferta[];
  productosEnOferta: Product[];
  loading: boolean;
  error: string | null;
  totalProductos: number;
  paginaActual: number;
  totalPaginas: number;
  cargarMasProductos: () => void;
  hayMasProductos: boolean;
  refetch: () => void;
}

export const useOfertas = (): UseOfertasReturn => {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [productosEnOferta, setProductosEnOferta] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProductos, setTotalProductos] = useState<number>(0);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);

  const cargarOfertas = async () => {
    try {
      setError(null);
      const [ofertasData, productosData] = await Promise.all([
        ofertaService.getOfertasActivas(),
        ofertaService.getProductosEnOferta(20, 0) // 20 productos por página
      ]);

      setOfertas(ofertasData);
      setProductosEnOferta(productosData.data);
      setTotalProductos(productosData.pagination.total);
      setPaginaActual(Math.floor(productosData.pagination.offset / productosData.pagination.limit) + 1);
      setTotalPaginas(productosData.pagination.pages);
    } catch (err) {
      console.error('Error cargando ofertas:', err);
      setError('Error al cargar las ofertas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const cargarMasProductos = async () => {
    if (paginaActual >= totalPaginas) return;

    try {
      setLoading(true);
      const offset = paginaActual * 20;
      const productosData = await ofertaService.getProductosEnOferta(20, offset);
      
      setProductosEnOferta(prev => [...prev, ...productosData.data]);
      setPaginaActual(Math.floor(productosData.pagination.offset / productosData.pagination.limit) + 1);
    } catch (err) {
      console.error('Error cargando más productos:', err);
      setError('Error al cargar más productos.');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setLoading(true);
    setProductosEnOferta([]);
    setPaginaActual(1);
    cargarOfertas();
  };

  useEffect(() => {
    cargarOfertas();
  }, []);

  const hayMasProductos = paginaActual < totalPaginas;

  return {
    ofertas,
    productosEnOferta,
    loading,
    error,
    totalProductos,
    paginaActual,
    totalPaginas,
    cargarMasProductos,
    hayMasProductos,
    refetch
  };
};