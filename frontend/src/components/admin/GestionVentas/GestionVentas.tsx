/**
 * @file GestionVentas.tsx
 *
 * Sección "Gestión de Ventas" del panel de administración.
 *
 * Funcionalidades:
 * - Stats bar: ventas hoy, esta semana, este mes, ingresos del mes
 * - Filtros por fecha, estado, tipo_venta, metodo_pago y búsqueda libre
 * - Tabla sortable con paginación
 * - Modal de detalle de venta
 * - Modal wizard para registrar venta manual
 * - Cancelación rápida de venta (solo admin rol 1)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './GestionVentas.module.css';
import DetalleVentaModal from './DetalleVentaModal';
import RegistrarVentaModal from './RegistrarVentaModal';
import CancelacionModal from './CancelacionModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { ventaAdminService } from '../../../services/ventaAdminService';
import type {
  VentaListItem,
  EstadisticasVentas,
  FiltrosVentasAdmin
} from '../../../types/venta';

// ── Tipos internos ───────────────────────────────────────────────────────────

type SortKey = 'nro_venta' | 'fyh_creacion' | 'nombre_cliente' | 'total_pagado' | 'estado';
type SortDir = 'asc' | 'desc';

const LIMIT = 20;

// ── Utilidades ────────────────────────────────────────────────────────────────

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

const formatMonto = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatIngreso = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)    return `$${(n / 1_000).toFixed(1)}K`;
  return formatMonto(n);
};

// ── Componente ────────────────────────────────────────────────────────────────

const GestionVentas: React.FC = () => {
  const { isAdmin, isGerente, isVendedor } = useAuth();
  const { showNotification } = useNotification();

  // ── Estado de datos ────────────────────────────────────────────────────────
  const [ventas, setVentas] = useState<VentaListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<EstadisticasVentas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoStats, setCargandoStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Estado de filtros ──────────────────────────────────────────────────────
  const [filtros, setFiltros] = useState<FiltrosVentasAdmin>({});
  const [filtrosTmp, setFiltrosTmp] = useState<FiltrosVentasAdmin>({});

  // ── Paginación y ordenación ────────────────────────────────────────────────
  const [offset, setOffset] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('fyh_creacion');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ── Cotización USD ─────────────────────────────────────────────────────────
  const [tipoCambio, setTipoCambio]           = useState<number>(1200);
  const [tipoCambioFecha, setTipoCambioFecha] = useState<string | null>(null);
  const [editandoCambio, setEditandoCambio]   = useState(false);
  const [tipoCambioInput, setTipoCambioInput] = useState('');
  const [guardandoCambio, setGuardandoCambio] = useState(false);

  // ── Modales ────────────────────────────────────────────────────────────────
  const [idDetalleAbierto, setIdDetalleAbierto] = useState<number | null>(null);
  const [mostrarRegistrar, setMostrarRegistrar] = useState(false);
  const [cancelacionModal, setCancelacionModal] = useState<{ id: number; nro: string } | null>(null);

  // ── Guards de carga ────────────────────────────────────────────────────────
  const cargandoRef = useRef(false);

  // ── Cargar tipo de cambio ──────────────────────────────────────────────────
  const cargarTipoCambio = useCallback(async () => {
    try {
      const data = await ventaAdminService.getTipoCambio();
      setTipoCambio(data.valor);
      setTipoCambioFecha(data.fyh_actualizacion);
    } catch { /* no crítico */ }
  }, []);

  // ── Guardar tipo de cambio ─────────────────────────────────────────────────
  const guardarCambio = async () => {
    const valor = parseFloat(tipoCambioInput);
    if (isNaN(valor) || valor < 1) {
      showNotification('Ingrese un valor válido mayor a 0', 'warning');
      return;
    }
    setGuardandoCambio(true);
    try {
      await ventaAdminService.updateTipoCambio(valor);
      setTipoCambio(valor);
      setTipoCambioFecha(new Date().toISOString());
      setEditandoCambio(false);
      showNotification('Cotización actualizada correctamente', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar cotización', 'error');
    } finally {
      setGuardandoCambio(false);
    }
  };

  // ── Cargar estadísticas ────────────────────────────────────────────────────
  const cargarStats = useCallback(async () => {
    setCargandoStats(true);
    try {
      const data = await ventaAdminService.obtenerEstadisticas();
      setStats(data);
    } catch {
      // no es crítico, se puede omitir
    } finally {
      setCargandoStats(false);
    }
  }, []);

  // ── Cargar ventas ──────────────────────────────────────────────────────────
  const cargarVentas = useCallback(async (
    f: FiltrosVentasAdmin,
    off: number
  ) => {
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    setCargando(true);
    setError(null);
    try {
      const res = await ventaAdminService.listarVentas(f, LIMIT, off);
      setVentas(res.ventas);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Error al obtener ventas');
      showNotification(err.message || 'Error al obtener ventas', 'error');
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }, [showNotification]);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    cargarStats();
    cargarTipoCambio();
  }, [cargarStats, cargarTipoCambio]);

  useEffect(() => {
    cargarVentas(filtros, offset);
  }, [cargarVentas, filtros, offset]);

  // ── Aplicar filtros ────────────────────────────────────────────────────────
  const aplicarFiltros = () => {
    setFiltros(filtrosTmp);
    setOffset(0);
  };

  const limpiarFiltros = () => {
    const vacios: FiltrosVentasAdmin = {};
    setFiltrosTmp(vacios);
    setFiltros(vacios);
    setOffset(0);
  };

  // ── Ordenación local (sobre la página actual) ──────────────────────────────
  const ventasOrdenadas = useMemo(() => {
    const copia = [...ventas];
    copia.sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (sortKey) {
        case 'nro_venta':      va = a.nro_venta;      vb = b.nro_venta;      break;
        case 'fyh_creacion':   va = a.fyh_creacion;   vb = b.fyh_creacion;   break;
        case 'nombre_cliente': va = a.nombre_cliente || ''; vb = b.nombre_cliente || ''; break;
        case 'total_pagado':   va = a.total_pagado;   vb = b.total_pagado;   break;
        case 'estado':         va = a.estado;         vb = b.estado;         break;
        default:               return 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return copia;
  }, [ventas, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key: SortKey) => (
    <span className={`material-icons ${styles.sortIcon} ${sortKey === key ? styles.sortIconActive : ''}`}>
      {sortKey === key ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
    </span>
  );

  // ── Paginación ─────────────────────────────────────────────────────────────
  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));
  const paginaActual = Math.floor(offset / LIMIT) + 1;

  const irPagina = (nueva: number) => {
    const nuevoOffset = (nueva - 1) * LIMIT;
    setOffset(nuevoOffset);
  };

  // ── Cancelar venta rápido (desde fila de tabla) ────────────────────────────
  const cancelarVentaFila = (id: number, nro: string) => {
    setCancelacionModal({ id, nro });
  };

  // ── Badges ─────────────────────────────────────────────────────────────────
  const badgeEstado = (estado: VentaListItem['estado']) => {
    const map: Record<string, string> = {
      completada: styles.badgeCompletada,
      cancelada:  styles.badgeCancelada,
      pendiente:  styles.badgePendiente
    };
    return `${styles.badge} ${map[estado] || ''}`;
  };

  const badgeTipo = (tipo: VentaListItem['tipo_venta']) =>
    `${styles.badge} ${tipo === 'web' ? styles.badgeWeb : styles.badgeManual}`;

  // ── Refresh tras acciones ──────────────────────────────────────────────────
  const refreshTodo = () => {
    cargarVentas(filtros, offset);
    cargarStats();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>

      {/* Encabezado */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>
              <span className="material-icons">receipt_long</span>
              Gestión de Ventas
            </h1>
            <p className={styles.subtitle}>
              Listado de ventas web y manuales · {total} venta(s) en total
            </p>
          </div>
          <button className={styles.crearButton} onClick={() => setMostrarRegistrar(true)}>
            <span className="material-icons">add</span>
            Registrar Venta
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        {cargandoStats ? (
          <>
            {[0,1,2,3].map(i => <div key={i} className={styles.statsLoading} />)}
          </>
        ) : (
          <>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                <span className="material-icons">today</span>
                Ventas Hoy
              </span>
              <span className={styles.statValue}>{stats?.ventas_hoy ?? 0}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                <span className="material-icons">date_range</span>
                Esta Semana
              </span>
              <span className={styles.statValue}>{stats?.ventas_semana ?? 0}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                <span className="material-icons">calendar_month</span>
                Este Mes
              </span>
              <span className={styles.statValue}>{stats?.ventas_mes ?? 0}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                <span className="material-icons">payments</span>
                Ingresos del Mes
              </span>
              <span className={styles.statValue}>
                {formatIngreso(stats?.ingresos_mes ?? 0)}
              </span>
              <span className={styles.statSub}>
                {stats ? formatMonto(stats.ingresos_mes) : '—'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Cotización del dólar */}
      <div className={styles.cotizacionCard}>
        <div className={styles.cotizacionHeader}>
          <span className="material-icons">attach_money</span>
          <span className={styles.cotizacionTitle}>Cotización USD</span>
          {tipoCambioFecha && (
            <span className={styles.cotizacionFecha}>
              Actualizada: {new Date(tipoCambioFecha).toLocaleString('es-AR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          )}
        </div>

        {editandoCambio ? (
          <div className={styles.cotizacionEdit}>
            <span className={styles.cotizacionPrefix}>1 USD =</span>
            <input
              type="number"
              min={1}
              step={0.01}
              className={styles.cotizacionInput}
              value={tipoCambioInput}
              onChange={e => setTipoCambioInput(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter')  guardarCambio();
                if (e.key === 'Escape') setEditandoCambio(false);
              }}
            />
            <span className={styles.cotizacionSuffix}>ARS</span>
            <button
              className={styles.cotizacionSave}
              onClick={guardarCambio}
              disabled={guardandoCambio}
            >
              <span className="material-icons">
                {guardandoCambio ? 'hourglass_empty' : 'check'}
              </span>
            </button>
            <button
              className={styles.cotizacionCancel}
              onClick={() => setEditandoCambio(false)}
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        ) : (
          <div className={styles.cotizacionDisplay}>
            <span className={styles.cotizacionValor}>
              1 USD = {tipoCambio.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
            </span>
            {(isAdmin || isGerente) && (
              <button
                className={styles.cotizacionEditBtn}
                onClick={() => { setTipoCambioInput(tipoCambio.toString()); setEditandoCambio(true); }}
                title="Modificar cotización"
              >
                <span className="material-icons">edit</span>
                Modificar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Barra de filtros */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Desde</label>
          <input
            type="date"
            className={styles.filterInput}
            value={filtrosTmp.fecha_inicio || ''}
            onChange={e => setFiltrosTmp(prev => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Hasta</label>
          <input
            type="date"
            className={styles.filterInput}
            value={filtrosTmp.fecha_fin || ''}
            onChange={e => setFiltrosTmp(prev => ({ ...prev, fecha_fin: e.target.value || undefined }))}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Estado</label>
          <select
            className={styles.filterSelect}
            value={filtrosTmp.estado || ''}
            onChange={e => setFiltrosTmp(prev => ({ ...prev, estado: e.target.value as FiltrosVentasAdmin['estado'] }))}
          >
            <option value="">Todos</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Tipo</label>
          <select
            className={styles.filterSelect}
            value={filtrosTmp.tipo_venta || ''}
            onChange={e => setFiltrosTmp(prev => ({ ...prev, tipo_venta: e.target.value as FiltrosVentasAdmin['tipo_venta'] }))}
          >
            <option value="">Todos</option>
            <option value="web">Web</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Método pago</label>
          <select
            className={styles.filterSelect}
            value={filtrosTmp.metodo_pago || ''}
            onChange={e => setFiltrosTmp(prev => ({ ...prev, metodo_pago: e.target.value as FiltrosVentasAdmin['metodo_pago'] }))}
          >
            <option value="">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="qr">QR</option>
          </select>
        </div>
        <div className={`${styles.filterGroup} ${styles.filterGroupWide}`}>
          <label className={styles.filterLabel}>Búsqueda</label>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="N° venta, cliente..."
            value={filtrosTmp.search || ''}
            onChange={e => setFiltrosTmp(prev => ({ ...prev, search: e.target.value || undefined }))}
            onKeyDown={e => { if (e.key === 'Enter') aplicarFiltros(); }}
          />
        </div>
        <div className={styles.filterActions}>
          <button className={styles.filterButton} onClick={aplicarFiltros}>
            <span className="material-icons">filter_list</span>
            Filtrar
          </button>
          <button className={styles.clearButton} onClick={limpiarFiltros}>
            <span className="material-icons">clear</span>
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className={styles.loading}>
          <span className="material-icons">hourglass_empty</span>
          Cargando ventas...
        </div>
      ) : error ? (
        <div className={styles.error}>
          <span className="material-icons">error_outline</span>
          {error}
          <button className={styles.retryButton} onClick={() => cargarVentas(filtros, offset)}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th
                    className={`${styles.sortableHeader}`}
                    onClick={() => toggleSort('nro_venta')}
                  >
                    <span className={styles.sortableHeaderContent}>
                      N° Venta {sortIcon('nro_venta')}
                    </span>
                  </th>
                  <th
                    className={styles.sortableHeader}
                    onClick={() => toggleSort('fyh_creacion')}
                  >
                    <span className={styles.sortableHeaderContent}>
                      Fecha {sortIcon('fyh_creacion')}
                    </span>
                  </th>
                  <th
                    className={styles.sortableHeader}
                    onClick={() => toggleSort('nombre_cliente')}
                  >
                    <span className={styles.sortableHeaderContent}>
                      Cliente {sortIcon('nombre_cliente')}
                    </span>
                  </th>
                  <th>Items</th>
                  <th
                    className={styles.sortableHeader}
                    onClick={() => toggleSort('total_pagado')}
                  >
                    <span className={styles.sortableHeaderContent}>
                      Total {sortIcon('total_pagado')}
                    </span>
                  </th>
                  <th>Método</th>
                  <th>Tipo</th>
                  <th
                    className={styles.sortableHeader}
                    onClick={() => toggleSort('estado')}
                  >
                    <span className={styles.sortableHeaderContent}>
                      Estado {sortIcon('estado')}
                    </span>
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.emptyMessage}>
                      No hay ventas que coincidan con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  ventasOrdenadas.map(venta => (
                    <tr key={venta.id_venta}>
                      <td>
                        <span className={styles.nroVenta}>{venta.nro_venta}</span>
                      </td>
                      <td>{formatFecha(venta.fyh_creacion)}</td>
                      <td>
                        {venta.nombre_cliente
                          ? <span className={styles.clienteNombre}>{venta.nombre_cliente}</span>
                          : <span className={styles.sinCliente}>Mostrador</span>
                        }
                      </td>
                      <td>{venta.cantidad_items}</td>
                      <td>
                        <span className={styles.totalCell}>
                          {formatMonto(venta.total_pagado)}
                        </span>
                      </td>
                      <td>{ventaAdminService.formatearMetodoPago(venta.metodo_pago)}</td>
                      <td>
                        <span className={badgeTipo(venta.tipo_venta)}>
                          {ventaAdminService.formatearTipoVenta(venta.tipo_venta)}
                        </span>
                      </td>
                      <td>
                        <span className={badgeEstado(venta.estado)}>
                          {ventaAdminService.formatearEstado(venta.estado)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionButton}
                            onClick={() => setIdDetalleAbierto(venta.id_venta)}
                            title="Ver detalle"
                          >
                            <span className="material-icons">visibility</span>
                          </button>
                          {venta.estado === 'completada' && (
                            <button
                              className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                              onClick={() => cancelarVentaFila(venta.id_venta, venta.nro_venta)}
                              title={!(isAdmin || isVendedor) ? 'Sin permisos para cancelar ventas' : 'Cancelar venta'}
                              disabled={!(isAdmin || isVendedor)}
                            >
                              <span className="material-icons">cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {total > LIMIT && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Mostrando {offset + 1}–{Math.min(offset + LIMIT, total)} de {total}
              </span>
              <div className={styles.paginationControls}>
                <button
                  className={styles.paginationButton}
                  onClick={() => irPagina(paginaActual - 1)}
                  disabled={paginaActual <= 1}
                >
                  <span className="material-icons">chevron_left</span>
                  Anterior
                </button>
                <span className={styles.paginationPage}>
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  className={styles.paginationButton}
                  onClick={() => irPagina(paginaActual + 1)}
                  disabled={paginaActual >= totalPaginas}
                >
                  Siguiente
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal detalle */}
      {idDetalleAbierto !== null && (
        <DetalleVentaModal
          idVenta={idDetalleAbierto}
          onClose={() => setIdDetalleAbierto(null)}
          onCancelada={refreshTodo}
        />
      )}

      {/* Modal registrar venta */}
      {mostrarRegistrar && (
        <RegistrarVentaModal
          onClose={() => setMostrarRegistrar(false)}
          onRegistrada={refreshTodo}
          tipoCambioUsd={tipoCambio}
        />
      )}

      {/* Modal cancelar venta (desde tabla) */}
      {cancelacionModal && (
        <CancelacionModal
          idVenta={cancelacionModal.id}
          nroVenta={cancelacionModal.nro}
          onClose={() => setCancelacionModal(null)}
          onCancelada={() => { setCancelacionModal(null); refreshTodo(); }}
        />
      )}

    </div>
  );
};

export default GestionVentas;
