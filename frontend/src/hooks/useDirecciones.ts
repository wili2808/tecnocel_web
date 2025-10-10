import { useState, useEffect } from 'react';
import { direccionService } from '../services/direccionService';
import type { CreateDireccionData } from '../services/direccionService';
import type { Direccion } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseDireccionesReturn {
  direcciones: Direccion[];
  loading: boolean;
  error: string | null;
  createDireccion: (data: CreateDireccionData) => Promise<void>;
  updateDireccion: (id: number, data: Partial<CreateDireccionData>) => Promise<void>;
  deleteDireccion: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useDirecciones = (): UseDireccionesReturn => {
  const { user } = useAuth();
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDirecciones = async () => {
    if (!user?.id_cliente) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await direccionService.getDirecciones(user.id_cliente);
      setDirecciones(data);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Error al cargar las direcciones');
    } finally {
      setLoading(false);
    }
  };

  const createDireccion = async (data: CreateDireccionData) => {
    if (!user?.id_cliente) throw new Error('Usuario no autenticado');
    
    try {
      await direccionService.createDireccion(user.id_cliente, data);
      await fetchDirecciones();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Error al crear la dirección');
      throw error;
    }
  };

  const updateDireccion = async (id: number, data: Partial<CreateDireccionData>) => {
    try {
      await direccionService.updateDireccion(id, data);
      await fetchDirecciones();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Error al actualizar la dirección');
      throw error;
    }
  };

  const deleteDireccion = async (id: number) => {
    try {
      await direccionService.deleteDireccion(id);
      await fetchDirecciones();
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Error al eliminar la dirección');
      throw error;
    }
  };

  useEffect(() => {
    fetchDirecciones();
  }, [user?.id_cliente]);

  return {
    direcciones,
    loading,
    error,
    createDireccion,
    updateDireccion,
    deleteDireccion,
    refetch: fetchDirecciones,
  };
};