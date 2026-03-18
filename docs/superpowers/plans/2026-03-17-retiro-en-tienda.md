# Retiro en Tienda — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar una pestaña "Retiro en tienda" en GestionVentas para gestionar ventas con `tipo_entrega='retiro_en_tienda'`, permitiendo marcar pedidos como entregados cuando el cliente los retira del local.

**Architecture:** Se parametriza el endpoint existente `GET /api/envios/admin` aceptando `tipo_entrega` como query param. Se bifurca `actualizarEstado` para manejar el flujo simplificado de retiros (`pendiente → entregado` directo). En el frontend se agregan dos componentes nuevos que reutilizan los estilos de `GestionVentas.module.css`.

**Tech Stack:** Node.js/Express/TypeScript (backend), React 18/TypeScript/CSS Modules (frontend), Sequelize ORM, adminApi (Axios).

**Spec:** `docs/superpowers/specs/2026-03-17-retiro-en-tienda-design.md`

---

## File Map

| Acción | Archivo |
|--------|---------|
| Modify | `backend/src/types/envio.types.ts` |
| Modify | `backend/src/controllers/EnvioController.ts` |
| Modify | `frontend/src/types/envio.ts` |
| Modify | `frontend/src/services/envioAdminService.ts` |
| Modify | `frontend/src/components/admin/GestionVentas/GestionVentas.tsx` |
| Create | `frontend/src/components/admin/GestionVentas/GestionRetiros.tsx` |
| Create | `frontend/src/components/admin/GestionVentas/GestionRetirosModal.tsx` |

---

## Task 1: Tipos backend — agregar `tipo_entrega`

**Files:**
- Modify: `backend/src/types/envio.types.ts`

- [ ] **Step 1: Agregar `tipo_entrega` a `EnvioAdminListItem` y `FiltrosEnviosAdmin`**

Abrir `backend/src/types/envio.types.ts`. Realizar los siguientes cambios:

En `EnvioAdminListItem`, agregar el campo después de `fyh_actualizacion`:
```typescript
  fyh_actualizacion: string;
  tipo_entrega?: 'envio' | 'retiro_en_tienda';
```

En `FiltrosEnviosAdmin`, agregar antes del cierre de la interfaz:
```typescript
  tipo_entrega?: 'envio' | 'retiro_en_tienda';
```

- [ ] **Step 2: Verificar compilación del backend**

```bash
cd backend && npm run build
```

Esperado: sin errores TypeScript.

- [ ] **Step 3: Commit**

```bash
cd backend
git add src/types/envio.types.ts
git commit -m "feat(envios): agregar tipo_entrega a tipos backend de envío"
```

---

## Task 2: Backend — parametrizar `listarEnvios`

**Files:**
- Modify: `backend/src/controllers/EnvioController.ts` (solo método `listarEnvios`)

- [ ] **Step 1: Agregar `tipo_entrega` al destructuring del query y reemplazar el hardcode**

En el método `listarEnvios`, el bloque de destructuring empieza en la línea con `const {`. Cambiarlo a:

```typescript
      const {
        estado_envio,
        fecha_inicio,
        fecha_fin,
        search,
        limit = 20,
        offset = 0,
        tipo_entrega = 'envio',
      } = req.query as unknown as FiltrosEnviosAdmin;
```

Luego, en la inicialización de `whereEnvio`, reemplazar el hardcode:

```typescript
      const whereEnvio: Record<string, unknown> = {
        tipo_entrega,
        estado_envio: { [Op.ne]: 'no_aplica' },
      };
```

- [ ] **Step 2: Verificar compilación**

```bash
cd backend && npm run build
```

Esperado: sin errores.

- [ ] **Step 3: Verificar manualmente con REST Client**

Crear o abrir el archivo de pruebas REST. Verificar que:
- `GET /api/envios/admin` (sin param) sigue devolviendo solo envíos a domicilio
- `GET /api/envios/admin?tipo_entrega=retiro_en_tienda` devuelve los registros de retiro

- [ ] **Step 4: Commit**

```bash
cd backend
git add src/controllers/EnvioController.ts
git commit -m "feat(envios): parametrizar listarEnvios con tipo_entrega query param"
```

---

## Task 3: Backend — bifurcar `actualizarEstado` para retiros

**Files:**
- Modify: `backend/src/controllers/EnvioController.ts` (solo método `actualizarEstado`)

- [ ] **Step 1: Reestructurar el método para mover el `findByPk` antes de las validaciones**

Reemplazar el método `actualizarEstado` completo con:

```typescript
  // PATCH /api/envios/admin/:id_envio/estado
  static async actualizarEstado(req: Request, res: Response) {
    try {
      const idEnvio = parseInt(req.params['id_envio']);
      if (isNaN(idEnvio)) return res.status(400).json({ error: 'ID inválido' });

      const { estado_envio, nro_seguimiento } = req.body as ActualizarEstadoEnvioBody;

      const envio = await Envio.findByPk(idEnvio, {
        include: [
          {
            model: Venta,
            as: 'venta',
            attributes: ['nro_venta', 'fyh_creacion'],
            include: [
              { model: Cliente, attributes: ['nombre_cliente', 'apellido_cliente', 'email_cliente'], required: false },
              {
                model: VentaItem,
                as: 'items',
                include: [{ model: Almacen, as: 'producto', attributes: ['nombre'] }],
              },
            ],
          },
        ],
      });

      if (!envio) return res.status(404).json({ error: 'Envío no encontrado' });

      const e = envio.toJSON() as Record<string, unknown>;
      const tipoEntrega = e['tipo_entrega'] as string;

      // ── Retiro en tienda: flujo simplificado ─────────────────────────────
      if (tipoEntrega === 'retiro_en_tienda') {
        if (estado_envio !== 'entregado') {
          return res.status(400).json({ error: 'Solo se puede marcar como entregado un retiro en tienda' });
        }
        if (envio.estado_envio === 'entregado') {
          return res.status(400).json({ error: 'Este retiro ya fue entregado' });
        }
        if (envio.estado_envio !== 'pendiente') {
          return res.status(400).json({ error: 'Estado inválido para retiro en tienda' });
        }

        await envio.update({ estado_envio: 'entregado', fyh_actualizacion: new Date() });
        logger.info('Retiro en tienda entregado', { id_envio: idEnvio, id_usuario: req.usuario?.id });
        return res.status(200).json({ success: true, mensaje: 'Retiro marcado como entregado' });
      }

      // ── Envío a domicilio: flujo secuencial existente ─────────────────────
      const estadosValidos = ['en_preparacion', 'en_camino', 'entregado'] as const;
      if (!estadosValidos.includes(estado_envio)) {
        return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` });
      }

      const transicionEsperada = TRANSICIONES_ENVIO[envio.estado_envio];
      if (transicionEsperada !== estado_envio) {
        return res.status(400).json({
          error: `Transición inválida: de '${envio.estado_envio}' solo se puede pasar a '${transicionEsperada ?? 'ningún estado (ya entregado)'}'`,
        });
      }

      const campos: Record<string, unknown> = { estado_envio, fyh_actualizacion: new Date() };
      if (estado_envio === 'en_camino') {
        campos['fyh_despacho'] = new Date();
        if (nro_seguimiento?.trim()) campos['nro_seguimiento'] = nro_seguimiento.trim();
      }

      await envio.update(campos);
      logger.info('Estado de envío actualizado', { id_envio: idEnvio, estado_envio, id_usuario: req.usuario?.id });

      // Enviar email (fire-and-forget)
      if (estado_envio === 'en_camino' || estado_envio === 'entregado') {
        const venta = e['venta'] as Record<string, unknown>;
        const cliente = venta?.['Cliente'] as Record<string, unknown> | undefined;
        const ventaItems = (venta?.['items'] ?? []) as Array<Record<string, unknown>>;

        if (cliente?.['email_cliente']) {
          const emailCliente = String(cliente['email_cliente']);
          const nombreCliente = `${cliente['nombre_cliente'] ?? ''} ${cliente['apellido_cliente'] ?? ''}`.trim();
          const nroVenta = `V-${String(venta?.['nro_venta']).padStart(5, '0')}`;
          const itemsEmail = ventaItems.map(item => {
            const producto = (item['producto'] ?? {}) as Record<string, unknown>;
            return { nombre: String(producto['nombre'] ?? 'Producto'), cantidad: item['cantidad'] as number };
          });

          if (estado_envio === 'en_camino') {
            const direccion = [e['envio_calle'], e['envio_numero'], e['envio_ciudad'], e['envio_provincia']]
              .filter(Boolean).join(', ');
            sendShippingInTransitEmail(emailCliente, {
              nombre_cliente: nombreCliente,
              nro_venta: nroVenta,
              nro_seguimiento: nro_seguimiento ?? null,
              direccion_destino: direccion,
              items: itemsEmail,
            }).catch(err => logger.error('Error enviando email en_camino:', { error: (err as Error).message }));
          } else {
            const fechaEntrega = new Date().toLocaleString('es-AR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            });
            sendShippingDeliveredEmail(emailCliente, {
              nombre_cliente: nombreCliente,
              nro_venta: nroVenta,
              fecha_entrega: fechaEntrega,
              items: itemsEmail,
            }).catch(err => logger.error('Error enviando email entregado:', { error: (err as Error).message }));
          }
        }
      }

      return res.status(200).json({ success: true, mensaje: `Estado actualizado a: ${estado_envio}` });
    } catch (error) {
      logger.error('Error en actualizarEstado (envio):', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
```

- [ ] **Step 2: Compilar**

```bash
cd backend && npm run build
```

Esperado: sin errores.

- [ ] **Step 3: Verificar manualmente**

Con el backend corriendo (`npm run dev`), usar REST Client o Insomnia para:
1. `PATCH /api/envios/admin/{id_retiro}/estado` con `{ "estado_envio": "entregado" }` → 200 OK
2. Mismo request de nuevo → 400 "Este retiro ya fue entregado"
3. `PATCH /api/envios/admin/{id_retiro}/estado` con `{ "estado_envio": "en_preparacion" }` → 400
4. `PATCH /api/envios/admin/{id_envio_domicilio}/estado` → sigue funcionando igual que antes

- [ ] **Step 4: Commit**

```bash
cd backend
git add src/controllers/EnvioController.ts
git commit -m "feat(envios): bifurcar actualizarEstado para retiro_en_tienda"
```

---

## Task 4: Frontend — tipos y servicio

**Files:**
- Modify: `frontend/src/types/envio.ts`
- Modify: `frontend/src/services/envioAdminService.ts`

- [ ] **Step 1: Agregar `tipo_entrega` al tipo `EnvioAdminListItem` en el frontend**

En `frontend/src/types/envio.ts`, en la interfaz `EnvioAdminListItem`, agregar después de `fyh_actualizacion`:

```typescript
  fyh_actualizacion: string;
  tipo_entrega?: 'envio' | 'retiro_en_tienda';
```

- [ ] **Step 2: Agregar `listarRetiros` al servicio**

En `frontend/src/services/envioAdminService.ts`, agregar la función después de `listarEnvios`:

```typescript
  listarRetiros: async (filtros: Omit<FiltrosEnviosAdmin, 'tipo_entrega'> = {}): Promise<ListarEnviosResponse> => {
    const { data } = await adminApi.get('/envios/admin', {
      params: { ...filtros, tipo_entrega: 'retiro_en_tienda' },
    });
    return data;
  },
```

- [ ] **Step 3: Verificar compilación del frontend**

```bash
cd frontend && npm run build
```

Esperado: sin errores TypeScript.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/types/envio.ts src/services/envioAdminService.ts
git commit -m "feat(envios): agregar tipo_entrega a tipos frontend y listarRetiros al servicio"
```

---

## Task 5: Frontend — pestaña en `GestionVentas.tsx`

**Files:**
- Modify: `frontend/src/components/admin/GestionVentas/GestionVentas.tsx`

- [ ] **Step 1: Ampliar el tipo de `activeTab` y agregar estado `retirosPendientes`**

Cambiar la línea donde se declara `activeTab`:
```typescript
  const [activeTab, setActiveTab] = useState<'ventas' | 'envios' | 'retiros'>('ventas');
```

Agregar el estado debajo de `enviosPendientes`:
```typescript
  const [retirosPendientes, setRetirosPendientes] = useState(0);
```

- [ ] **Step 2: Agregar los imports de `GestionRetiros` y `envioAdminService`**

Agregar el import del nuevo componente después de `import GestionEnvios`:
```typescript
import GestionRetiros from './GestionRetiros';
```

`GestionVentas.tsx` no importa `envioAdminService` actualmente. Agregarlo con los demás imports de servicios:
```typescript
import { envioAdminService } from '../../../services/envioAdminService';
```

- [ ] **Step 3: Agregar fetch inicial para conteo de retiros pendientes**

Agregar la función de carga junto a `cargarTipoCambio`:
```typescript
  const cargarRetirosPendientes = useCallback(async () => {
    try {
      const r = await envioAdminService.listarRetiros({ estado_envio: 'pendiente', limit: 1, offset: 0 });
      setRetirosPendientes(r.total);
    } catch { /* no crítico */ }
  }, []);
```

En el `useEffect` de carga inicial (donde se llama a `cargarStats` y `cargarTipoCambio`), agregar `cargarRetirosPendientes()`:
```typescript
  useEffect(() => {
    cargarStats();
    cargarTipoCambio();
    cargarRetirosPendientes();
  }, [cargarStats, cargarTipoCambio, cargarRetirosPendientes]);
```

- [ ] **Step 4: Agregar la pestaña en el JSX**

En el bloque de `<div className={styles.tabs}>`, agregar el tercer tab después del de envíos:
```tsx
        <button
          className={`${styles.tab} ${activeTab === 'retiros' ? styles.tabActivo : ''}`}
          onClick={() => setActiveTab('retiros')}
        >
          <span className="material-icons">store</span>
          Retiro en tienda
          {retirosPendientes > 0 && (
            <span className={styles.tabBadge}>{retirosPendientes}</span>
          )}
        </button>
```

- [ ] **Step 5: Renderizar `GestionRetiros` cuando el tab está activo**

Después del bloque `{activeTab === 'envios' && (...)}`, agregar:
```tsx
      {activeTab === 'retiros' && (
        <GestionRetiros onPendientesChange={setRetirosPendientes} />
      )}
```

- [ ] **Step 6: Verificar que compila (TypeScript puede quejarse del import hasta que se cree el componente)**

Si el componente `GestionRetiros` no existe aún, el build fallará — es esperado. Continuar con el Task 6.

- [ ] **Step 7: Commit (después de completar Task 6 y 7)**

Hacer el commit de este archivo junto con los componentes nuevos al final del Task 7.

---

## Task 6: Crear `GestionRetiros.tsx`

**Files:**
- Create: `frontend/src/components/admin/GestionVentas/GestionRetiros.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import { envioAdminService } from '../../../services/envioAdminService';
import type { EnvioAdminListItem, FiltrosEnviosAdmin, EstadoEnvio } from '../../../types/envio';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import GestionRetirosModal from './GestionRetirosModal';

const LIMIT = 20;

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const ESTADO_COLORS: Partial<Record<EstadoEnvio, string>> = {
  pendiente: styles.estadoPendiente,
  entregado: styles.estadoEntregado,
};

interface GestionRetirosProps {
  onPendientesChange?: (count: number) => void;
}

const GestionRetiros: React.FC<GestionRetirosProps> = memo(({ onPendientesChange }) => {
  const { showNotification } = useNotification();

  const [retiros, setRetiros] = useState<EnvioAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [filtrosTmp, setFiltrosTmp] = useState<Omit<FiltrosEnviosAdmin, 'tipo_entrega'>>({});
  const [filtros, setFiltros] = useState<Omit<FiltrosEnviosAdmin, 'tipo_entrega'>>({});

  const [retiroSeleccionado, setRetiroSeleccionado] = useState<EnvioAdminListItem | null>(null);

  const cargandoRef = useRef(false);

  const cargarRetiros = useCallback(async (f: Omit<FiltrosEnviosAdmin, 'tipo_entrega'>, off: number) => {
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    setCargando(true);
    setError(null);
    try {
      const result = await envioAdminService.listarRetiros({ ...f, limit: LIMIT, offset: off });
      setRetiros(result.data);
      setTotal(result.total);

      if (f.estado_envio === 'pendiente') {
        onPendientesChange?.(result.total);
      } else {
        envioAdminService.listarRetiros({ estado_envio: 'pendiente', limit: 1, offset: 0 })
          .then(r => onPendientesChange?.(r.total))
          .catch(() => {/* no crítico */});
      }
    } catch {
      setError('Error al cargar los retiros');
      showNotification('Error al cargar los retiros', 'error');
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }, [onPendientesChange, showNotification]);

  useEffect(() => {
    cargarRetiros(filtros, offset);
  }, [filtros, offset, cargarRetiros]);

  const aplicarFiltros = () => {
    setOffset(0);
    setFiltros(filtrosTmp);
  };

  const limpiarFiltros = () => {
    setFiltrosTmp({});
    setOffset(0);
    setFiltros({});
  };

  const handleEntregado = () => {
    setRetiroSeleccionado(null);
    cargarRetiros(filtros, offset);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  if (error) return <div className={styles.errorMsg}>{error}</div>;

  return (
    <div>
      {/* Filtros */}
      <div className={styles.filtrosBar}>
        <select
          value={filtrosTmp.estado_envio ?? ''}
          onChange={e => setFiltrosTmp(prev => ({ ...prev, estado_envio: (e.target.value as EstadoEnvio) || undefined }))}
          className={styles.filtroSelect}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">{ESTADO_ENVIO_LABELS.pendiente}</option>
          <option value="entregado">{ESTADO_ENVIO_LABELS.entregado}</option>
        </select>

        <input
          type="text"
          placeholder="Buscar por nro. venta o cliente..."
          value={filtrosTmp.search ?? ''}
          onChange={e => setFiltrosTmp(prev => ({ ...prev, search: e.target.value || undefined }))}
          className={styles.filtroInput}
        />

        <input
          type="date"
          value={filtrosTmp.fecha_inicio ?? ''}
          onChange={e => setFiltrosTmp(prev => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />
        <input
          type="date"
          value={filtrosTmp.fecha_fin ?? ''}
          onChange={e => setFiltrosTmp(prev => ({ ...prev, fecha_fin: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />

        <button onClick={aplicarFiltros} className={styles.btnFiltrar}>Filtrar</button>
        <button onClick={limpiarFiltros} className={styles.btnLimpiar}>Limpiar</button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className={styles.loadingMsg}>Cargando retiros...</div>
      ) : retiros.length === 0 ? (
        <div className={styles.emptyMsg}>No se encontraron pedidos de retiro en tienda.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nro. Venta</th>
                <th>Cliente</th>
                <th>Fecha venta</th>
                <th>Estado retiro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {retiros.map(retiro => (
                <tr key={retiro.id_envio}>
                  <td><strong>#{retiro.nro_venta}</strong></td>
                  <td>{retiro.nombre_cliente ?? <em className={styles.sinDatos}>Sin cliente</em>}</td>
                  <td>{formatFecha(retiro.fyh_creacion)}</td>
                  <td>
                    <span className={`${styles.estadoBadge} ${ESTADO_COLORS[retiro.estado_envio] ?? ''}`}>
                      {ESTADO_ENVIO_LABELS[retiro.estado_envio]}
                    </span>
                  </td>
                  <td>
                    <button
                      className={retiro.estado_envio === 'entregado' ? styles.btnSecundario : styles.btnPrimario}
                      onClick={() => setRetiroSeleccionado(retiro)}
                    >
                      {retiro.estado_envio === 'entregado' ? 'Ver detalle' : 'Gestionar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {total > LIMIT && (
        <div className={styles.paginacion}>
          <span>Página {currentPage} de {totalPages} ({total} retiros)</span>
          <div className={styles.paginacionBtns}>
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className={styles.btnPag}
            >← Anterior</button>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset(offset + LIMIT)}
              className={styles.btnPag}
            >Siguiente →</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {retiroSeleccionado && (
        <GestionRetirosModal
          retiro={retiroSeleccionado}
          onClose={() => setRetiroSeleccionado(null)}
          onEntregado={handleEntregado}
        />
      )}
    </div>
  );
});

export default GestionRetiros;
```

- [ ] **Step 2: Verificar que no hay errores TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sin errores relacionados a este archivo.

---

## Task 7: Crear `GestionRetirosModal.tsx`

**Files:**
- Create: `frontend/src/components/admin/GestionVentas/GestionRetirosModal.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import React, { useState, useEffect } from 'react';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import { envioAdminService } from '../../../services/envioAdminService';
import type { EnvioAdminListItem, EnvioAdminDetalle } from '../../../types/envio';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatMoneda = (n: number, moneda = 'ARS') =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(n);

interface GestionRetirosModalProps {
  retiro: EnvioAdminListItem;
  onClose: () => void;
  onEntregado: () => void;
}

const GestionRetirosModal: React.FC<GestionRetirosModalProps> = ({ retiro, onClose, onEntregado }) => {
  const { showNotification } = useNotification();

  const [detalle, setDetalle] = useState<EnvioAdminDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const esEntregado = retiro.estado_envio === 'entregado';

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    envioAdminService.obtenerDetalle(retiro.id_envio)
      .then(d => { if (!cancelled) setDetalle(d); })
      .catch(() => { if (!cancelled) showNotification('Error al cargar detalle del retiro', 'error'); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [retiro.id_envio, showNotification]);

  const handleMarcarEntregado = async () => {
    setGuardando(true);
    try {
      await envioAdminService.actualizarEstado(retiro.id_envio, { estado_envio: 'entregado' });
      showNotification('Retiro marcado como entregado', 'success');
      onEntregado();
    } catch {
      showNotification('Error al marcar como entregado', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.modalLarge}`}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className="material-icons">store</span>
            Retiro en tienda #{retiro.nro_venta}
            <span className={`${styles.estadoBadge} ${retiro.estado_envio === 'entregado' ? styles.estadoEntregado : styles.estadoPendiente}`}>
              {ESTADO_ENVIO_LABELS[retiro.estado_envio]}
            </span>
          </h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <span className="material-icons" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {cargando ? (
            <div className={styles.loadingMsg}>Cargando detalle...</div>
          ) : detalle ? (
            <>
              {/* Info del cliente y venta */}
              <div className={styles.detalleGrid}>
                <div className={styles.detalleSection}>
                  <h3 className={styles.detalleSectionTitle}>Cliente</h3>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Nombre</span>
                    <span className={styles.detalleRowValue}>{detalle.nombre_cliente ?? '—'}</span>
                  </div>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Email</span>
                    <span className={styles.detalleRowValue}>{detalle.email_cliente ?? '—'}</span>
                  </div>
                  {detalle.envio_telefono_contacto && (
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Teléfono</span>
                      <span className={styles.detalleRowValue}>{detalle.envio_telefono_contacto}</span>
                    </div>
                  )}
                </div>

                <div className={styles.detalleSection}>
                  <h3 className={styles.detalleSectionTitle}>Datos de la venta</h3>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Fecha</span>
                    <span className={styles.detalleRowValue}>{formatFecha(detalle.fyh_venta)}</span>
                  </div>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Total</span>
                    <span className={styles.detalleRowValue}>{formatMoneda(detalle.total_pagado, detalle.moneda)}</span>
                  </div>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Pago</span>
                    <span className={styles.detalleRowValue}>{detalle.metodo_pago}</span>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <h4 className={styles.itemsTitle}>Productos del pedido</h4>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.textRight}>Cant.</th>
                    <th className={styles.textRight}>Precio unit.</th>
                    <th className={styles.textRight}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.nombre_producto}</td>
                      <td className={styles.textRight}>{item.cantidad}</td>
                      <td className={styles.textRight}>{formatMoneda(item.precio_unitario, detalle.moneda)}</td>
                      <td className={styles.textRight}>{formatMoneda(item.cantidad * item.precio_unitario, detalle.moneda)}</td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td colSpan={3}><strong>Total</strong></td>
                    <td className={styles.textRight}><strong>{formatMoneda(detalle.total_pagado, detalle.moneda)}</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* Panel de acción */}
              {!esEntregado && (
                <div className={styles.envioAccionPanel}>
                  {!confirmando ? (
                    <button
                      className={styles.submitButton}
                      onClick={() => setConfirmando(true)}
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span>
                      Marcar como Entregado
                    </button>
                  ) : (
                    <div className={styles.envioConfirmar}>
                      <p className={styles.envioConfirmarTitulo}>
                        ¿Confirmás que el cliente retiró el pedido <strong>#{retiro.nro_venta}</strong>?
                      </p>
                      <div className={styles.envioConfirmarBtns}>
                        <button
                          className={styles.cancelButton}
                          onClick={() => setConfirmando(false)}
                          disabled={guardando}
                        >
                          Cancelar
                        </button>
                        <button
                          className={styles.submitButton}
                          onClick={handleMarcarEntregado}
                          disabled={guardando}
                        >
                          {guardando ? 'Guardando...' : 'Confirmar entrega'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.errorMsg}>No se pudo cargar el detalle del retiro.</div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default GestionRetirosModal;
```

- [ ] **Step 2: Verificar compilación completa frontend**

```bash
cd frontend && npm run build
```

Esperado: sin errores TypeScript ni de Vite.

- [ ] **Step 3: Verificar compilación completa backend**

```bash
cd backend && npm run build
```

Esperado: sin errores.

- [ ] **Step 4: Commit final de todos los archivos frontend**

```bash
cd ..
git add frontend/src/types/envio.ts \
        frontend/src/services/envioAdminService.ts \
        frontend/src/components/admin/GestionVentas/GestionVentas.tsx \
        frontend/src/components/admin/GestionVentas/GestionRetiros.tsx \
        frontend/src/components/admin/GestionVentas/GestionRetirosModal.tsx
git commit -m "feat(frontend): agregar pestaña Retiro en Tienda en GestionVentas"
```

---

## Verificación final

- [ ] Levantar backend y frontend en modo dev
- [ ] Ir al panel admin → Gestión de Ventas
- [ ] Verificar que aparecen las 3 pestañas: Ventas, Envíos a domicilio, Retiro en tienda
- [ ] El badge de retiros pendientes muestra el número correcto al cargar la página
- [ ] En la pestaña "Retiro en tienda": la tabla carga los registros con `tipo_entrega='retiro_en_tienda'`
- [ ] Filtrar por estado "Pendiente" y "Entregado" funciona
- [ ] Buscar por número de venta o nombre de cliente funciona
- [ ] Click en "Gestionar" abre el modal con info del cliente y productos
- [ ] Click en "Marcar como Entregado" muestra la confirmación
- [ ] Confirmar → estado cambia a Entregado, tabla se recarga, badge se actualiza
- [ ] Un retiro ya entregado muestra "Ver detalle" (sin panel de acción)
- [ ] La pestaña "Envíos a domicilio" sigue funcionando exactamente igual que antes
