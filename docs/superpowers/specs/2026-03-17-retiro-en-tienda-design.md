# Spec: Pestaña "Retiro en Tienda" en Gestión de Ventas

**Fecha:** 2026-03-17
**Branch:** feature/gestionEnvios
**Estado:** Aprobado

---

## Contexto

La tabla `tb_envios` contiene registros con `tipo_entrega = 'retiro_en_tienda'` para ventas donde el cliente eligió retirar el pedido en el local. `EnvioController.listarEnvios` filtra hardcodeado con `tipo_entrega: 'envio'`, por lo que estos registros no tienen interfaz de gestión.

Los registros de retiro se crean con `estado_envio = 'pendiente'` desde el momento de la venta. El filtro `estado_envio != 'no_aplica'` del controller aplica igual para ambos tipos.

---

## Flujo de estados

```
pendiente → entregado  (directo, sin pasos intermedios)
```

Los estados `en_preparacion` y `en_camino` no aplican para retiros.

---

## Cambios Backend

### 1. `backend/src/types/envio.types.ts`

- Agregar `tipo_entrega?: 'envio' | 'retiro_en_tienda'` en `EnvioAdminListItem`
- Agregar `tipo_entrega?: 'envio' | 'retiro_en_tienda'` en `FiltrosEnviosAdmin`
- `ActualizarEstadoEnvioBody` no cambia: `'entregado'` ya está incluido

### 2. `EnvioController.listarEnvios`

- Leer `tipo_entrega` del query, default `'envio'`
- **Eliminar el hardcode** `tipo_entrega: 'envio'` en `whereEnvio` y reemplazarlo por el valor recibido del query
- Sin otro cambio en la lógica

### 3. `EnvioController.actualizarEstado`

Reestructurar la validación para bifurcar por `tipo_entrega` del envío encontrado en BD.

**Flujo nuevo:**
1. Parsear y validar `id_envio`
2. Buscar el envío en BD (con sus relaciones)
3. Si no existe → 404
4. Leer `tipo_entrega` del envío encontrado
5. **Si `tipo_entrega === 'retiro_en_tienda'`:**
   - Solo aceptar `estado_envio = 'entregado'` como destino; si viene otro valor → 400 `"Solo se puede marcar como entregado un retiro en tienda"`
   - Si `estado_envio` actual ya es `'entregado'` → 400 `"Este retiro ya fue entregado"`
   - Si `estado_envio` actual no es `'pendiente'` → 400 `"Estado inválido para retiro"`
   - Hacer `update({ estado_envio: 'entregado', fyh_actualizacion: new Date() })`
   - No enviar emails, no registrar `fyh_despacho` ni `nro_seguimiento`
6. **Si `tipo_entrega === 'envio'`:**
   - Mantener la lógica existente completa (validación `estadosValidos`, `TRANSICIONES_ENVIO`, emails, `fyh_despacho`)
   - La validación `estadosValidos = ['en_preparacion', 'en_camino', 'entregado']` aplica solo a este branch
7. Responder `{ success: true, mensaje: ... }`

---

## Cambios Frontend

### 1. `frontend/src/types/envio.ts`

- Agregar `tipo_entrega?: 'envio' | 'retiro_en_tienda'` en `EnvioAdminListItem`
- `ActualizarEstadoEnvioBody` no cambia

### 2. `frontend/src/services/envioAdminService.ts`

Agregar función `listarRetiros(params: FiltrosEnviosAdmin)` que llama al mismo endpoint `GET /api/envios/admin` con `tipo_entrega=retiro_en_tienda` forzado.

### 3. `GestionVentas.tsx`

- Ampliar `activeTab` a `'ventas' | 'envios' | 'retiros'`
- Agregar pestaña "Retiro en tienda" con ícono `store` y badge de pendientes
- Agregar estado `retirosPendientes` con setter `setRetirosPendientes`
- **Badge inicial:** Hacer fetch independiente en el `useEffect` de carga inicial (junto a `cargarStats` y `cargarTipoCambio`) para obtener el conteo de retiros pendientes. No depender del montaje del componente hijo.
- Renderizar `<GestionRetiros onPendientesChange={setRetirosPendientes} />` cuando `activeTab === 'retiros'`

### 4. `GestionRetiros.tsx` (nuevo — `frontend/src/components/admin/GestionVentas/`)

- Importa estilos de `GestionVentas.module.css` (sin CSS Module propio, igual que `GestionEnvios.tsx`)
- Filtros: estado (`pendiente` / `entregado`), búsqueda por nro. venta o cliente, rango de fechas
- Columnas: N° Venta, Cliente, Fecha venta, Estado, Acciones
- Sin columnas de dirección ni nro. seguimiento
- Paginación (LIMIT = 20)
- `ESTADO_COLORS` local con solo las dos claves relevantes:
  ```ts
  const ESTADO_COLORS: Partial<Record<EstadoEnvio, string>> = {
    pendiente: styles.estadoPendiente,
    entregado: styles.estadoEntregado,
  };
  ```
- Prop `onPendientesChange?: (count: number) => void` — notifica el total al padre igual que `GestionEnvios`
- Botón de acción: "Gestionar" si pendiente, "Ver detalle" si entregado → abre `GestionRetirosModal`

### 5. `GestionRetirosModal.tsx` (nuevo — mismo directorio)

- Importa estilos de `GestionVentas.module.css` (sin CSS Module propio)
- Header: "Retiro en tienda #NRO_VENTA" + badge de estado actual
- Carga detalle con `envioAdminService.obtenerDetalle` al montar
- Sección cliente: nombre, email, teléfono (si existe)
- Tabla productos: nombre, cantidad, precio unitario, subtotal + fila total
- **Si estado = `pendiente`:**
  - Primera vista: botón "Marcar como Entregado"
  - Al clickear: muestra panel de confirmación inline (Cancelar / Confirmar)
  - Al confirmar: llama `envioAdminService.actualizarEstado(id_envio, { estado_envio: 'entregado' })`
  - Muestra notificación de éxito y llama `onActualizado`
  - **Lógica propia:** no usa `SIGUIENTE_ESTADO`; hardcodea que el único avance posible es `'entregado'`
- **Si estado = `entregado`:** solo info, sin panel de acciones
- Manejo de errores de red: `showNotification('Error al marcar como entregado', 'error')`

---

## Restricciones

- No romper el comportamiento del tab "Envíos a domicilio" (default `tipo_entrega='envio'`)
- Los componentes nuevos reutilizan `GestionVentas.module.css` sin CSS Module propio
- No crear nuevos endpoints: reutilizar `GET /api/envios/admin`, `GET /api/envios/admin/:id`, `PATCH /api/envios/admin/:id/estado`
