import { useState, useEffect } from 'react';
import marcaService from '../services/marcaService';
import type { Marca } from '../types/product';

interface UseMarcasReturn {
  marcas: Marca[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMarcas = (): UseMarcasReturn => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarcas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marcaService.getMarcas();
      setMarcas(data);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Error al cargar las marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  return {
    marcas,
    loading,
    error,
    refetch: fetchMarcas,
  };
};