# Filtro de Vendedor en Reporte de Ventas — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un dropdown de selección de vendedor en el filtro del reporte de ventas, que filtre todos los queries y la exportación CSV.

**Architecture:** El backend valida y parsea el parámetro `id_vendedor` de query string, construye el fragmento SQL correspondiente (IS NULL para ventas web, valor numérico para un vendedor específico), y lo inyecta en todas las queries de `reporteVentas` y el export CSV. El frontend carga la lista de usuarios con `adminApi` al montar, mantiene un estado separado `vendedorSeleccionado`, y lo combina con `filtros` al llamar al servicio.

**Tech Stack:** Node.js/Express + Sequelize + TypeScript (backend); React 18 + TypeScript + CSS Modules + adminApi (axios) (frontend)

**Spec:** `docs/superpowers/specs/2026-03-17-filtro-vendedor-reportes-design.md`

---

## Chunk 1: Backend

### Task 1: Actualizar `reporteVentas` y `buildWhere` en ReporteController

**Files:**
- Modify: `backend/src/controllers/ReporteController.ts`

- [ ] **Step 1: Agregar parseo de `id_vendedor` y fragmentos SQL**

  En `reporteVentas`, después de la destructuración de `req.query` (línea ~51), agregar:

  ```typescript
  // Parsear id_vendedor con validación explícita
  const idVendedorRaw = req.query.id_vendedor as string | undefined;
  let filtroVendedor = '';
  let filtroVendedorV = '';
  let idVendedorNum: number | undefined;

  if (idVendedorRaw === 'null') {
    filtroVendedor  = 'AND id_vendedor IS NULL';
    filtroVendedorV = 'AND v.id_vendedor IS NULL';
  } else {
    const parsed = parseInt(idVendedorRaw ?? '', 10);
    if (parsed > 0) {
      idVendedorNum   = parsed;
      filtroVendedor  = 'AND id_vendedor = :id_vendedor';
      filtroVendedorV = 'AND v.id_vendedor = :id_vendedor';
    }
  }
  ```

- [ ] **Step 2: Agregar `id_vendedor` a los `replacements`**

  En el objeto `replacements` (línea ~65):

  ```typescript
  const replacements = {
    fecha_inicio: fecha_inicio as string,
    fecha_fin_full: `${fecha_fin as string} 23:59:59`,
    metodo_pago: metodo_pago as string,
    tipo_venta: tipo_venta as string,
    ...(idVendedorNum !== undefined && { id_vendedor: idVendedorNum }),
  };
  ```

- [ ] **Step 3: Inyectar `filtroVendedor`/`filtroVendedorV` en los WHERE del resumen**

  En la query del resumen (línea ~82):
  ```sql
  WHERE v.estado = 'completada' ${filtroFechasV} ${filtroMetodoV} ${filtroTipoV} ${filtroVendedorV}
  ```

  En la query de `metodoPagoResult` (línea ~90):
  ```sql
  WHERE estado = 'completada' ${filtroFechas} ${filtroMetodo} ${filtroTipo} ${filtroVendedor}
    AND metodo_pago IS NOT NULL
  ```

  En la query de datos agrupados (línea ~117):
  ```sql
  WHERE v.estado = 'completada' ${filtroFechasV} ${filtroMetodoV} ${filtroTipoV} ${filtroVendedorV}
  ```

- [ ] **Step 4: Actualizar `buildWhere` para soportar `id_vendedor`**

  Actualizar la firma y el cuerpo de `buildWhere` (línea ~570):

  ```typescript
  function buildWhere(opts: {
    estado?: string;
    fecha_inicio?: unknown;
    fecha_fin?: unknown;
    metodo_pago?: unknown;
    tipo_venta?: string;
    id_vendedor?: number | null;
  }): Record<string, unknown> {
    const w: Record<string, unknown> = {};
    if (opts.estado) w['estado'] = opts.estado;
    if (opts.tipo_venta) w['tipo_venta'] = opts.tipo_venta;
    if (opts.metodo_pago) w['metodo_pago'] = opts.metodo_pago;
    if (opts.fecha_inicio && opts.fecha_fin) {
      w['fyh_creacion'] = {
        [Op.between]: [opts.fecha_inicio as string, `${opts.fecha_fin as string} 23:59:59`]
      };
    }
    if (opts.id_vendedor !== undefined) {
      w['id_vendedor'] = opts.id_vendedor === null
        ? { [Op.is]: null }
        : opts.id_vendedor;
    }
    return w;
  }
  ```

- [ ] **Step 5: Pasar `id_vendedor` a los conteos `ventasWeb` y `ventasManual`**

  Las líneas ~85-86 usan `buildWhere`. Actualizar para pasar el valor correcto:

  ```typescript
  // Determinar el valor para buildWhere: null (IS NULL), número, o undefined (sin filtro)
  const vendedorParaBuildWhere =
    idVendedorRaw === 'null' ? null :
    idVendedorNum !== undefined ? idVendedorNum :
    undefined;

  const [resumenRows, ventasWeb, ventasManual, metodoPagoResult] = await Promise.all([
    // ... resumen query sin cambios ...
    Venta.count({ where: buildWhere({ estado: 'completada', fecha_inicio, fecha_fin, metodo_pago, tipo_venta: 'web',    id_vendedor: vendedorParaBuildWhere }) }),
    Venta.count({ where: buildWhere({ estado: 'completada', fecha_inicio, fecha_fin, metodo_pago, tipo_venta: 'manual', id_vendedor: vendedorParaBuildWhere }) }),
    // ... metodoPago query sin cambios ...
  ]);
  ```

- [ ] **Step 6: Verificar que el backend compila sin errores**

  Desde `backend/`:
  ```bash
  npm run build
  ```
  Resultado esperado: compilación exitosa sin errores TypeScript.

- [ ] **Step 7: Commit**

  ```bash
  git add backend/src/controllers/ReporteController.ts
  git commit -m "feat(backend): agregar filtro id_vendedor en reporteVentas"
  ```

---

### Task 2: Agregar filtro de vendedor al exportarCSV

**Files:**
- Modify: `backend/src/controllers/ReporteController.ts`

- [ ] **Step 1: Parsear `id_vendedor` en `exportarCSV`**

  Al inicio del método `exportarCSV`, **después** de la declaración del `const replacements` existente (línea ~425), agregar:

  ```typescript
  const idVendedorRawCsv = req.query.id_vendedor as string | undefined;
  let filtroVendedorCsv = '';

  if (idVendedorRawCsv === 'null') {
    filtroVendedorCsv = 'AND v.id_vendedor IS NULL';
  } else {
    const parsed = parseInt(idVendedorRawCsv ?? '', 10);
    if (parsed > 0) {
      filtroVendedorCsv = 'AND v.id_vendedor = :id_vendedor';
      replacements['id_vendedor'] = parsed;  // mutar el objeto existente (tipado como Record<string, unknown>)
    }
  }
  ```

  > **No renombrar** `replacements`. Los cases `productos`, `clientes` y `cancelaciones` siguen usando el mismo objeto sin cambios. Solo el case `ventas` inyecta el campo adicional cuando corresponde.

- [ ] **Step 2: Actualizar el case `'ventas'` del switch**

  Reemplazar la query actual del case `'ventas'` para:
  - Usar `replacementsCsv` en lugar de `replacements`
  - Agregar LEFT JOIN a `tb_usuarios`
  - Agregar columna `"Vendedor"`
  - Inyectar `filtroVendedorCsv` en el WHERE

  ```typescript
  case 'ventas': {
    const datos = await sequelize.query<Record<string, unknown>>(
      `SELECT
         v.id_venta AS "ID",
         CONCAT('V-', LPAD(v.nro_venta, 5, '0')) AS "Nro Venta",
         DATE_FORMAT(v.fyh_creacion, '%Y-%m-%d') AS "Fecha",
         COALESCE(v.moneda, 'ARS') AS "Moneda",
         v.total_pagado AS "Total (Moneda Original)",
         ${SQL_ARS('v')} AS "Total ARS",
         ${SQL_USD('v')} AS "Total USD",
         COALESCE(v.valor_dolar, '') AS "Tipo de Cambio",
         COALESCE(v.metodo_pago, 'N/A') AS "Metodo Pago",
         v.tipo_venta AS "Tipo",
         v.estado AS "Estado",
         COALESCE(CONCAT(c.nombre_cliente, ' ', c.apellido_cliente), 'Venta manual') AS "Cliente",
         COALESCE(u.nombres, 'Venta Web') AS "Vendedor"
       FROM tb_ventas v
       LEFT JOIN tb_clientes c ON c.id_cliente = v.id_cliente
       LEFT JOIN tb_usuarios u ON u.id_usuario = v.id_vendedor
       WHERE v.estado = 'completada' ${fechaCondition} ${filtroVendedorCsv}
       ORDER BY v.fyh_creacion DESC`,
      { replacements, type: QueryTypes.SELECT }
    );
    csvContent = ReporteController.arrayToCSV(datos);
    filename = 'reporte_ventas';
    break;
  }
  ```

- [ ] **Step 3: Verificar compilación**

  ```bash
  npm run build
  ```
  Resultado esperado: sin errores.

- [ ] **Step 4: Commit**

  ```bash
  git add backend/src/controllers/ReporteController.ts
  git commit -m "feat(backend): agregar columna Vendedor y filtro en exportarCSV de ventas"
  ```

---

## Chunk 2: Frontend

### Task 3: Agregar `id_vendedor` al tipo `FiltrosReporteVentas`

**Files:**
- Modify: `frontend/src/types/reporte.ts`

- [ ] **Step 1: Agregar el campo al interface**

  Modificar `FiltrosReporteVentas` (líneas 12-15):

  ```typescript
  export interface FiltrosReporteVentas extends FiltrosReporte {
    metodo_pago?: string;
    tipo_venta?: string;
    id_vendedor?: number | 'null';
  }
  ```

  El valor `'null'` (string) se serializa como `?id_vendedor=null` en la URL, que el backend interpreta como `IS NULL`.

- [ ] **Step 2: Verificar que el frontend compila**

  Desde `frontend/`:
  ```bash
  npm run build
  ```
  Resultado esperado: sin errores TypeScript.

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/types/reporte.ts
  git commit -m "feat(frontend): agregar id_vendedor a FiltrosReporteVentas"
  ```

---

### Task 4: Agregar estado de vendedores y lógica en Reportes.tsx

**Files:**
- Modify: `frontend/src/components/admin/Reportes/Reportes.tsx`

- [ ] **Step 1: Agregar imports necesarios**

  Al inicio del archivo, agregar los imports que faltan:

  ```typescript
  import adminApi from '../../../api/axiosAdminConfig';
  import type { FiltrosReporteVentas } from '../../../types/reporte';
  ```

  `FiltrosReporteVentas` se agrega al import de tipos ya existente del archivo:
  ```typescript
  import type {
    ReporteTab,
    FiltrosReporte,
    FiltrosReporteVentas,      // ← agregar
    ReporteVentasResponse,
    ReporteProductosResponse,
    ReporteClientesResponse,
    ReporteCancelacionesResponse,
  } from '../../../types/reporte';
  ```

- [ ] **Step 2: Agregar estados de vendedor**

  Dentro del componente `Reportes`, después del estado `cancelacionesData` (línea ~126):

  ```typescript
  // Vendedores para el filtro
  const [vendedores, setVendedores] = useState<{ id_usuario: number; nombres: string }[]>([]);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<number | 'null' | undefined>(undefined);
  ```

- [ ] **Step 3: Agregar useEffect para cargar vendedores**

  Después del `useEffect` que llama a `cargarDatos` (línea ~165):

  ```typescript
  // Cargar lista de vendedores al montar (una sola vez)
  useEffect(() => {
    adminApi.get('/usuarios/admin/usuarios')
      .then((res) => {
        const lista = res.data?.data?.usuarios ?? res.data?.usuarios ?? [];
        setVendedores(lista);
      })
      .catch(() => {
        // No bloqueante: si falla, el dropdown queda sin opciones de usuario
      });
  }, []);
  ```

  > El endpoint `GET /api/usuarios/admin/usuarios` devuelve `{ success: true, data: { count, usuarios: [...] } }`. Los dos fallbacks (`res.data?.data?.usuarios ?? res.data?.usuarios`) cubren variaciones menores en la estructura de respuesta.

- [ ] **Step 4: Actualizar `cargarDatos` para el case `'ventas'`**

  Reemplazar el case `'ventas'` dentro de `cargarDatos` (línea ~135-138):

  ```typescript
  case 'ventas': {
    const filtrosVentas: FiltrosReporteVentas = {
      ...filtros,
      ...(vendedorSeleccionado !== undefined && { id_vendedor: vendedorSeleccionado }),
    };
    const data = await reporteService.obtenerReporteVentas(filtrosVentas);
    setVentasData(data);
    break;
  }
  ```

  Agregar `vendedorSeleccionado` al array de dependencias del `useCallback`:
  ```typescript
  }, [activeTab, filtros, vendedorSeleccionado]);
  ```

- [ ] **Step 5: Actualizar `handleExportar` para incluir vendedor**

  Reemplazar la llamada a `exportarCSV` dentro de `handleExportar` (línea ~182):

  ```typescript
  const handleExportar = useCallback(async () => {
    setExporting(true);
    try {
      const filtrosExportar = activeTab === 'ventas'
        ? { ...filtros, ...(vendedorSeleccionado !== undefined && { id_vendedor: vendedorSeleccionado }) }
        : filtros;
      // Cast necesario: exportarCSV acepta FiltrosReporte, pero el objeto puede incluir id_vendedor
      // en runtime Axios lo serializa correctamente como query param
      await reporteService.exportarCSV(activeTab, filtrosExportar as FiltrosReporte);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  }, [activeTab, filtros, vendedorSeleccionado]);
  ```

- [ ] **Step 6: Actualizar `handleLimpiarFiltros` para resetear vendedor**

  Reemplazar la función (línea ~175):

  ```typescript
  const handleLimpiarFiltros = useCallback(() => {
    setFiltros({ ...getDefaultDates(), agrupacion: 'dia' });
    setVendedorSeleccionado(undefined);
  }, []);
  ```

- [ ] **Step 7: Verificar compilación**

  ```bash
  npm run build
  ```
  Resultado esperado: sin errores.

- [ ] **Step 8: Commit**

  ```bash
  git add frontend/src/components/admin/Reportes/Reportes.tsx
  git commit -m "feat(frontend): agregar estado vendedores y lógica de filtro en Reportes"
  ```

---

### Task 5: Agregar dropdown de vendedor en la barra de filtros

**Files:**
- Modify: `frontend/src/components/admin/Reportes/Reportes.tsx`

- [ ] **Step 1: Agregar el dropdown en el JSX del filterBar**

  Dentro del bloque `{activeTab === 'ventas' && (...)}` que ya contiene el selector de agrupación (líneas ~243-256), agregar el dropdown de vendedor **después** del `filterGroup` de agrupación:

  ```tsx
  {activeTab === 'ventas' && (
    <>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Agrupacion</label>
        <select
          className={styles.filterSelect}
          value={filtros.agrupacion || 'dia'}
          onChange={(e) => handleFiltroChange('agrupacion', e.target.value)}
        >
          <option value="dia">Por dia</option>
          <option value="semana">Por semana</option>
          <option value="mes">Por mes</option>
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Vendedor</label>
        <select
          className={styles.filterSelect}
          value={vendedorSeleccionado === undefined ? '' : String(vendedorSeleccionado)}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') setVendedorSeleccionado(undefined);
            else if (val === 'null') setVendedorSeleccionado('null');
            else setVendedorSeleccionado(parseInt(val, 10));
          }}
        >
          <option value="">Todos los vendedores</option>
          <option value="null">Venta Web</option>
          {vendedores.map((v) => (
            <option key={v.id_usuario} value={String(v.id_usuario)}>
              {v.nombres}
            </option>
          ))}
        </select>
      </div>
    </>
  )}
  ```

  > **Importante:** el bloque original era `{activeTab === 'ventas' && (<div ...>...</div>)}`. Al agregar el segundo filterGroup, se necesita envolver ambos en un `<>...</>` (Fragment).

- [ ] **Step 2: Verificar compilación final**

  ```bash
  npm run build
  ```
  Resultado esperado: sin errores TypeScript ni Vite.

- [ ] **Step 3: Verificar en el navegador**

  1. Iniciar backend: `npm run dev` desde `backend/`
  2. Iniciar frontend: `npm run dev` desde `frontend/`
  3. Ir a `http://localhost:5173/admin/panel` → sección Reportes → pestaña Ventas
  4. Verificar que el dropdown "Vendedor" aparece al lado de "Agrupacion"
  5. Seleccionar "Venta Web" → filtrar → verificar que el reporte solo muestra ventas sin vendedor
  6. Seleccionar un usuario → filtrar → verificar que el reporte filtra por ese usuario
  7. Seleccionar "Todos los vendedores" → filtrar → verificar que muestra todo
  8. Hacer clic en "Limpiar" → verificar que el dropdown vuelve a "Todos los vendedores"
  9. Con un filtro de vendedor activo, hacer clic en "Exportar CSV" → verificar que el CSV incluye la columna "Vendedor" y solo contiene ventas del vendedor seleccionado

- [ ] **Step 4: Commit final**

  ```bash
  git add frontend/src/components/admin/Reportes/Reportes.tsx
  git commit -m "feat(frontend): agregar dropdown de vendedor en filtros del reporte de ventas"
  ```
