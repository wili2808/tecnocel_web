import { useState, useEffect, useCallback } from 'react';
import { direccionService, CreateDireccionData } from '../services/direccionService';
import { Direccion } from '../types/product';
import { useAuth } from '../contexts/AuthContext';

export const useDirecciones = () => {
  const { user } = useAuth();
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [direccionPredeterminada, setDireccionPredeterminada] = useState<Direccion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar direcciones del cliente
  const loadDirecciones = useCallback(async () => {
    if (!user?.id_cliente) return;

    try {
      setLoading(true);
      const data = await direccionService.getDirecciones(user.id_cliente);
      setDirecciones(data);
      
      // Encontrar la dirección predeterminada
      const predeterminada = data.find(d => d.es_predeterminada);
      setDireccionPredeterminada(predeterminada || null);
      
      setError(null);
    } catch (err) {
      setError('Error al cargar direcciones');
      console.error('Error loading direcciones:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id_cliente]);

  // Crear nueva dirección
  const createDireccion = useCallback(async (data: CreateDireccionData): Promise<Direccion | null> => {
    if (!user?.id_cliente) return null;

    try {
      const nuevaDireccion = await direccionService.createDireccion(user.id_cliente, data);
      setDirecciones(prev => [...prev, nuevaDireccion]);
      
      if (nuevaDireccion.es_predeterminada) {
        setDireccionPredeterminada(nuevaDireccion);
      }
      
      return nuevaDireccion;
    } catch (error) {
      console.error('Error al crear dirección:', error);
      setError('Error al crear dirección');
      return null;
    }
  }, [user?.id_cliente]);

  // Actualizar dirección
  const updateDireccion = useCallback(async (id: number, data: Partial<CreateDireccionData>): Promise<boolean> => {
    try {
      const direccionActualizada = await direccionService.updateDireccion(id, data);
      
      setDirecciones(prev => 
        prev.map(d => d.id_direccion === id ? direccionActualizada : d)
      );
      
      if (direccionActualizada.es_predeterminada) {
        setDireccionPredeterminada(direccionActualizada);
      }
      
      return true;
    } catch (error) {
      console.error('Error al actualizar dirección:', error);
      setError('Error al actualizar dirección');
      return false;
    }
  }, []);

  // Establecer como predeterminada
  const setPredeterminada = useCallback(async (id: number): Promise<boolean> => {
    try {
      const direccionActualizada = await direccionService.setPredeterminada(id);
      
      // Actualizar todas las direcciones (solo una puede ser predeterminada)
      setDirecciones(prev => 
        prev.map(d => ({
          ...d,
          es_predeterminada: d.id_direccion === id
        }))
      );
      
      setDireccionPredeterminada(direccionActualizada);
      return true;
    } catch (error) {
      console.error('Error al establecer dirección predeterminada:', error);
      setError('Error al establecer dirección predeterminada');
      return false;
    }
  }, []);

  // Eliminar dirección
  const deleteDireccion = useCallback(async (id: number): Promise<boolean> => {
    try {
      await direccionService.deleteDireccion(id);
      
      setDirecciones(prev => prev.filter(d => d.id_direccion !== id));
      
      // Si era la predeterminada, limpiar
      if (direccionPredeterminada?.id_direccion === id) {
        setDireccionPredeterminada(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      setError('Error al eliminar dirección');
      return false;
    }
  }, [direccionPredeterminada]);

  // Cargar direcciones cuando cambie el usuario
  useEffect(() => {
    loadDirecciones();
  }, [loadDirecciones]);

  return {
    direcciones,
    direccionPredeterminada,
    loading,
    error,
    loadDirecciones,
    createDireccion,
    updateDireccion,
    setPredeterminada,
    deleteDireccion
  };
};