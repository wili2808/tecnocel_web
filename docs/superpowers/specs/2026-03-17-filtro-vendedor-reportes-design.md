# Spec: Filtro de Vendedor en Reporte de Ventas

**Fecha**: 2026-03-17
**Estado**: Aprobado
**Scope**: Módulo de Reportes — pestaña Ventas

---

## Contexto

El reporte de ventas actualmente acepta filtros por fecha, agrupación, método de pago y tipo de venta. Los administradores y gerentes necesitan poder filtrar las ventas por el vendedor que las registró, para analizar el rendimiento individual de cada usuario del sistema.

La tabla `tb_ventas` ya tiene el campo `id_vendedor` (FK nullable a `tb_usuarios`). Las ventas web tienen `id_vendedor = NULL`.

---

## Objetivo

Agregar un dropdown de selección de vendedor en el filtro del reporte de ventas, ubicado al lado del selector de agrupación. El filtro aplica a la consulta principal, los KPIs y la exportación CSV.

---

## Enfoque seleccionado

**Reutilizar endpoint existente** `GET /api/usuarios/admin/usuarios` para poblar el dropdown. No se crean endpoints nuevos.

---

## Cambios por capa

### 1. Backend — `ReporteController.ts`

#### `reporteVentas()`

Leer `id_vendedor` de `req.query`. **Validar y parsear** antes de ramificar:

1. Si el valor es exactamente la cadena `"null"` → fragmento `AND v.id_vendedor IS NULL` (constante hardcodeada, sin param)
2. Si `parseInt(valor, 10)` produce un entero positivo (`> 0`) → fragmento `AND v.id_vendedor = :id_vendedor` con el número en `replacements`
3. Cualquier otro valor (vacío, `"0"`, no numérico) → ignorar, sin fragmento

Esta validación previene que valores malformados produzcan SQL inválido o liguen `NaN`/`undefined` en `replacements`.

| Valor recibido | Acción | Fragmento SQL generado |
|---|---|---|
| `undefined` / `""` | ignorar | `''` (sin filtro) |
| `"null"` | IS NULL | `AND v.id_vendedor IS NULL` |
| `"3"` (entero positivo) | parseInt → 3 | `AND v.id_vendedor = :id_vendedor` |
| `"abc"`, `"0"`, `"-1"` | ignorar | `''` (sin filtro) |

Inyectar el fragmento en los tres `WHERE` de la función: resumen, datos agrupados, y query de métodos de pago.

Actualizar `buildWhere()` para aceptar `id_vendedor?: number | null` y aplicarlo al conteo de `ventasWeb` y `ventasManual`.

#### `exportarCSV()` — case `'ventas'`

- Leer `id_vendedor` de `req.query` con la misma lógica de fragmentos.
- Agregar LEFT JOIN a `tb_usuarios u ON u.id_usuario = v.id_vendedor`.
- Agregar columna `COALESCE(u.nombres, 'Venta Web') AS "Vendedor"` al SELECT.
- Inyectar el filtro en el WHERE.

---

### 2. Frontend — `frontend/src/types/reporte.ts`

Agregar campo a `FiltrosReporteVentas`:

```typescript
id_vendedor?: number | 'null';
```

El valor `'null'` (string) representa "Venta Web" y se serializa como query param `?id_vendedor=null`. El backend lo interpreta como `IS NULL`.

---

### 3. Frontend — `Reportes.tsx`

#### Estado nuevo
```typescript
const [vendedores, setVendedores] = useState<{ id_usuario: number; nombres: string }[]>([]);
```

Cargado en `useEffect` al montar, con `adminApi.get('/usuarios/admin/usuarios')`. Errores de carga del listado son no bloqueantes (el dropdown simplemente queda sin opciones de usuario).

#### Tipado del estado `filtros`

El estado `filtros` actual en `Reportes.tsx` es `FiltrosReporte` (base). Para soportar `id_vendedor`, la pestaña de ventas maneja un **estado separado**:

```typescript
const [vendedorSeleccionado, setVendedorSeleccionado] = useState<number | 'null' | undefined>(undefined);
```

Al llamar a `obtenerReporteVentas`, se construye el objeto de filtros de ventas combinando ambos estados:

```typescript
const filtrosVentas: FiltrosReporteVentas = {
  ...filtros,
  ...(vendedorSeleccionado !== undefined && { id_vendedor: vendedorSeleccionado })
};
```

Esto evita modificar el tipo del estado `filtros` compartido entre todas las pestañas y no requiere cambios en `handleFiltroChange`.

#### Dropdown en `filterBar`
- Visible **solo** en la pestaña `ventas`.
- Posición: al lado del selector de agrupación.
- Opciones:
  - `value=""` → "Todos los vendedores" (placeholder, default)
  - `value="null"` → "Venta Web"
  - `value={id_usuario}` → nombre del usuario (una opción por cada usuario)
- Al cambiar: llama a `setVendedorSeleccionado`.

#### Limpiar filtros
`vendedorSeleccionado` se resetea a `undefined` junto con el resto de filtros al presionar "Limpiar".

#### `reporteService`
Sin cambios. `exportarCSV` mantiene la firma `(tipo: string, filtros?: FiltrosReporte)`. En runtime, Axios serializa todos los campos del objeto pasado como query params (incluyendo `id_vendedor` aunque no esté en la firma de `FiltrosReporte`). TypeScript puede emitir una advertencia de tipo en el sitio de llamada — se acepta como limitación conocida dado que el comportamiento en runtime es correcto. No se actualiza la firma para evitar cambios en cascada innecesarios.

#### `handleExportar`
Cuando `activeTab === 'ventas'`, `handleExportar` debe construir el mismo objeto combinado antes de pasarlo a `exportarCSV`:

```typescript
const filtrosExportar = activeTab === 'ventas'
  ? { ...filtros, ...(vendedorSeleccionado !== undefined && { id_vendedor: vendedorSeleccionado }) }
  : filtros;
reporteService.exportarCSV(activeTab, filtrosExportar);
```

Esto garantiza que el filtro de vendedor activo también se aplique al CSV exportado.

---

## Flujo de datos

```
Usuario selecciona vendedor
  → filtros.id_vendedor = number | 'null' | undefined
  → reporteService.obtenerReporteVentas(filtros)
  → GET /api/reportes/ventas?...&id_vendedor=3
  → ReporteController inyecta AND v.id_vendedor = :id_vendedor en SQL
  → Respuesta filtrada → frontend renderiza KPIs y tabla actualizados
```

---

## Casos especiales

| Caso | Comportamiento |
|---|---|
| `id_vendedor` no enviado | Sin filtro, se muestran todas las ventas |
| `id_vendedor=null` (string) | Filtra `WHERE v.id_vendedor IS NULL` (ventas web) |
| `id_vendedor=5` (número) | Filtra `WHERE v.id_vendedor = 5` |
| Error al cargar vendedores | Dropdown sin opciones de usuario, no bloquea el reporte |
| Exportar CSV con filtro | El CSV respeta el filtro activo e incluye columna "Vendedor" |

---

## Archivos a modificar

| Archivo | Tipo de cambio |
|---|---|
| `backend/src/controllers/ReporteController.ts` | Agregar parámetro `id_vendedor`, fragmentos SQL, actualizar `buildWhere` |
| `frontend/src/types/reporte.ts` | Agregar `id_vendedor` a `FiltrosReporteVentas` |
| `frontend/src/components/admin/Reportes/Reportes.tsx` | Estado vendedores, useEffect carga, dropdown en filterBar |

**Archivos sin cambios**: `reporteRoutes.ts`, `reporteService.ts`, `Reportes.module.css` (el dropdown hereda estilos del select existente).
