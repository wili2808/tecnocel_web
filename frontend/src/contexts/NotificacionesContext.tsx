import React, { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import notificacionService from '../services/notificacionService';
import type { Notificacion } from '../types/notificacion';

// --- CONSTANTES ---

/**
 * Intervalo de polling en milisegundos
 */
const POLLING_INTERVAL = 45000;

// --- INTERFAZ DEL CONTEXTO ---

/**
 * Interfaz del contexto de notificaciones
 */
export interface NotificacionesContextType {
  noLeidas: number;
  notificaciones: Notificacion[];
  cargando: boolean;
  panelAbierto: boolean;
  abrirPanel: () => void;
  cerrarPanel: () => void;
  marcarLeida: (id: number) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminarNotificacion: (id: number) => Promise<void>;
  eliminarTodas: () => Promise<void>;
}

// --- CREACIÓN DEL CONTEXTO ---

/**
 * Contexto de notificaciones
 */
export const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

// --- PROPS DEL PROVIDER ---

/**
 * Props del proveedor de notificaciones
 */
interface NotificacionesProviderProps {
  children: React.ReactNode;
}

// --- PROVIDER PRINCIPAL ---

/**
 * Proveedor del contexto global de notificaciones
 */
export const NotificacionesProvider: React.FC<NotificacionesProviderProps> = ({ children }) => {
  const { isCliente } = useAuth();

  const [noLeidas, setNoLeidas] = useState<number>(0);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [panelAbierto, setPanelAbierto] = useState<boolean>(false);

  const notificacionesRef = useRef<Notificacion[]>([]);

  useEffect(() => {
    notificacionesRef.current = notificaciones;
  }, [notificaciones]);

  /**
   * Obtiene el conteo de notificaciones no leídas desde el servidor
   */
  const fetchNoLeidas = useCallback(async () => {
    if (!isCliente) return;
    try {
      const response = await notificacionService.getNoLeidas();
      setNoLeidas(response.data.count);
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
    }
  }, [isCliente]);

  /**
   * Carga el listado completo de notificaciones (solo al abrir el panel)
   */
  const cargarNotificaciones = useCallback(async () => {
    if (!isCliente) return;
    setCargando(true);
    try {
      const response = await notificacionService.getNotificaciones();
      setNotificaciones(response.data.notificaciones);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  }, [isCliente]);

  /**
   * Abre el panel y carga el listado completo de notificaciones
   */
  const abrirPanel = useCallback(() => {
    setPanelAbierto(true);
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  /**
   * Cierra el panel de notificaciones
   */
  const cerrarPanel = useCallback(() => {
    setPanelAbierto(false);
  }, []);

  /**
   * Marca una notificación como leída de forma optimista (sin re-fetch)
   */
  const marcarLeida = useCallback(async (id: number) => {
    const notificacion = notificacionesRef.current.find((n) => n.id_notificacion === id);
    const eraNoLeida = notificacion ? !notificacion.leido : false;

    // Actualización optimista
    setNotificaciones((prev) =>
      prev.map((n) => (n.id_notificacion === id ? { ...n, leido: true, fyh_lectura: new Date().toISOString() } : n)),
    );
    if (eraNoLeida) {
      setNoLeidas((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificacionService.marcarLeida(id);
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      // Revertir actualización optimista en caso de error
      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id_notificacion === id
            ? { ...n, leido: notificacion?.leido ?? false, fyh_lectura: notificacion?.fyh_lectura ?? null }
            : n,
        ),
      );
      if (eraNoLeida) {
        setNoLeidas((prev) => prev + 1);
      }
    }
  }, []);

  /**
   * Marca todas las notificaciones como leídas
   */
  const marcarTodasLeidas = useCallback(async () => {
    // Actualización optimista
    const ahora = new Date().toISOString();
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true, fyh_lectura: n.fyh_lectura ?? ahora })));
    setNoLeidas(0);

    try {
      await notificacionService.marcarTodasLeidas();
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      // En caso de error, recargar desde el servidor
      await fetchNoLeidas();
      if (panelAbierto) {
        await cargarNotificaciones();
      }
    }
  }, [fetchNoLeidas, cargarNotificaciones, panelAbierto]);

  /**
   * Elimina una notificación y actualiza el estado localmente
   */
  const eliminarNotificacion = useCallback(async (id: number) => {
    const notificacion = notificacionesRef.current.find((n) => n.id_notificacion === id);

    // Actualización optimista
    setNotificaciones((prev) => prev.filter((n) => n.id_notificacion !== id));
    if (notificacion && !notificacion.leido) {
      setNoLeidas((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificacionService.eliminarNotificacion(id);
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      // Revertir en caso de error
      if (notificacion) {
        setNotificaciones((prev) => [...prev, notificacion]);
        if (!notificacion.leido) {
          setNoLeidas((prev) => prev + 1);
        }
      }
    }
  }, []);

  /**
   * Elimina todas las notificaciones del cliente
   */
  const eliminarTodas = useCallback(async () => {
    // Guardar estado anterior para rollback
    const notificacionesAnteriores = notificacionesRef.current;
    const noLeidasAnteriores = noLeidas;

    // Actualización optimista
    setNotificaciones([]);
    setNoLeidas(0);

    try {
      await notificacionService.eliminarTodas();
    } catch (error) {
      console.error('Error al eliminar todas las notificaciones:', error);
      // Revertir en caso de error
      setNotificaciones(notificacionesAnteriores);
      setNoLeidas(noLeidasAnteriores);
    }
  }, [noLeidas]);

  // Polling de notificaciones no leídas cada 45 segundos (solo para clientes)
  useEffect(() => {
    if (!isCliente) {
      setNoLeidas(0);
      setNotificaciones([]);
      setPanelAbierto(false);
      return;
    }

    // Carga inicial del conteo
    fetchNoLeidas();

    const intervalo = setInterval(fetchNoLeidas, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalo);
    };
  }, [isCliente, fetchNoLeidas]);

  const value = useMemo<NotificacionesContextType>(
    () => ({
      noLeidas,
      notificaciones,
      cargando,
      panelAbierto,
      abrirPanel,
      cerrarPanel,
      marcarLeida,
      marcarTodasLeidas,
      eliminarNotificacion,
      eliminarTodas,
    }),
    [
      noLeidas,
      notificaciones,
      cargando,
      panelAbierto,
      abrirPanel,
      cerrarPanel,
      marcarLeida,
      marcarTodasLeidas,
      eliminarNotificacion,
      eliminarTodas,
    ],
  );

  return <NotificacionesContext.Provider value={value}>{children}</NotificacionesContext.Provider>;
};
