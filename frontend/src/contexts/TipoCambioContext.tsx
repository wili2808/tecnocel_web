import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axiosInstance from '../api/axiosConfig';

interface TipoCambioContextType {
  tipoCambio: number;
  lastUpdated: Date | null;
  cargando: boolean;
}

const TipoCambioContext = createContext<TipoCambioContextType>({
  tipoCambio: 1200,
  lastUpdated: null,
  cargando: true,
});

export const TipoCambioProvider = ({ children }: { children: ReactNode }) => {
  const [tipoCambio, setTipoCambio] = useState<number>(1200);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchTipoCambio = async () => {
      try {
        const { data } = await axiosInstance.get('/almacen/tipo-cambio');
        setTipoCambio(data.valor);
        setLastUpdated(data.fyh_actualizacion ? new Date(data.fyh_actualizacion) : null);
      } catch {
        // Mantener valor por defecto 1200
      } finally {
        setCargando(false);
      }
    };
    fetchTipoCambio();
  }, []);

  return (
    <TipoCambioContext.Provider value={{ tipoCambio, lastUpdated, cargando }}>
      {children}
    </TipoCambioContext.Provider>
  );
};

export const useTipoCambio = () => useContext(TipoCambioContext);
