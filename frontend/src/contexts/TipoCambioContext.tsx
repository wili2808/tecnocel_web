import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import axiosInstance from '../api/axiosConfig';

// --- TIPOS ---

export type TipoCambioOrigen = 'api' | 'cache' | 'fallback';

interface TipoCambioContextType {
  tipoCambio: number;
  lastUpdated: Date | null;
  cargando: boolean;
  origen: TipoCambioOrigen;
  esConfiable: boolean;
}

const TIPO_CAMBIO_DEFAULT = 1200;
const TIPO_CAMBIO_CACHE_KEY = 'tipo_cambio_usd_cache';
const TIPO_CAMBIO_REFRESH_MS = 5 * 60 * 1000;

const readCachedTipoCambio = (): number | null => {
  const cached = localStorage.getItem(TIPO_CAMBIO_CACHE_KEY);
  const parsed = cached ? parseFloat(cached) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const cachedAtBoot = readCachedTipoCambio();

// --- CONTEXTO ---

const TipoCambioContext = createContext<TipoCambioContextType>({
  tipoCambio: cachedAtBoot ?? TIPO_CAMBIO_DEFAULT,
  lastUpdated: null,
  cargando: true,
  origen: cachedAtBoot ? 'cache' : 'fallback',
  esConfiable: !!cachedAtBoot,
});

// --- PROVIDER PRINCIPAL ---

export const TipoCambioProvider = ({ children }: { children: ReactNode }) => {
  const [tipoCambio, setTipoCambio] = useState<number>(cachedAtBoot ?? TIPO_CAMBIO_DEFAULT);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cargando, setCargando] = useState(true);
  const [origen, setOrigen] = useState<TipoCambioOrigen>(cachedAtBoot ? 'cache' : 'fallback');

  useEffect(() => {
    const fetchTipoCambio = async () => {
      try {
        const { data: responseData } = await axiosInstance.get('/almacen/tipo-cambio');
        const payload = responseData?.data || responseData;
        const valor = typeof payload?.valor === 'number' ? payload.valor : parseFloat(String(payload?.valor));

        if (!Number.isFinite(valor) || valor <= 0) {
          throw new Error('Tipo de cambio inválido en respuesta');
        }

        setTipoCambio(valor);
        setOrigen('api');
        localStorage.setItem(TIPO_CAMBIO_CACHE_KEY, String(valor));
        setLastUpdated(payload?.fyh_actualizacion ? new Date(payload.fyh_actualizacion) : null);
      } catch (error) {
        const cached = readCachedTipoCambio();

        if (cached) {
          setTipoCambio(cached);
          setOrigen('cache');
        } else {
          setTipoCambio(TIPO_CAMBIO_DEFAULT);
          setOrigen('fallback');
        }

        console.warn('No se pudo actualizar el tipo de cambio desde /almacen/tipo-cambio', error);
      } finally {
        setCargando(false);
      }
    };

    void fetchTipoCambio();

    const onFocus = () => {
      void fetchTipoCambio();
    };

    const onOnline = () => {
      void fetchTipoCambio();
    };

    const intervalId = window.setInterval(() => {
      void fetchTipoCambio();
    }, TIPO_CAMBIO_REFRESH_MS);

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      window.clearInterval(intervalId);
    };
  }, []);

  const value = useMemo(
    () => ({
      tipoCambio,
      lastUpdated,
      cargando,
      origen,
      esConfiable: origen !== 'fallback',
    }),
    [tipoCambio, lastUpdated, cargando, origen],
  );

  return <TipoCambioContext.Provider value={value}>{children}</TipoCambioContext.Provider>;
};

export const useTipoCambio = () => useContext(TipoCambioContext);
