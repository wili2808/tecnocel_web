import { useState, useEffect } from 'react';
import { marcaService } from '../services/marcaService';
import { Marca } from '../types/product';

export const useMarcas = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        setLoading(true);
        const data = await marcaService.getMarcas();
        setMarcas(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar las marcas');
        console.error('Error fetching marcas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarcas();
  }, []);

  return { marcas, loading, error };
};