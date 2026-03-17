# Diseño: Comprobante de Venta PDF

**Fecha:** 2026-03-16
**Estado:** Aprobado
**Proyecto:** TecnoCel Web — Panel de Administración

---

## Contexto

El panel de administración de ventas (`GestionVentas`) tiene un modal de detalle (`DetalleVentaModal`) que muestra toda la información de una venta. Actualmente no existe forma de generar ni compartir un comprobante formal con el cliente.

Se requiere agregar la capacidad de:
1. Descargar un comprobante de venta en PDF desde el modal de detalle
2. Enviar ese comprobante por email al cliente registrado (si la venta tiene uno)

---

## Alcance

- **Tipo de documento:** Comprobante de venta de aspecto profesional, **sin validez fiscal**
- **Generación:** Backend (Node.js con `pdfkit`)
- **Acceso:** Todos los roles del sistema (admin, gerente, vendedor)
- **Email:** Opcional, solo disponible si la venta tiene cliente con correo registrado

---

## Contenido del PDF

1. **Encabezado:** Nombre de la empresa (TecnoCel), teléfono placeholder, dirección placeholder, sitio web placeholder
2. **Identificación:** Número de venta (`nro_venta`), fecha y hora de creación, estado de la venta
3. **Datos del cliente:** `cliente.nombre_cliente`, `cliente.apellido_cliente` y `cliente.correo` — o "Venta de mostrador (sin cliente registrado)" si `cliente` es null. El endpoint `obtenerDetalleAdmin` ya retorna el cliente como objeto anidado con estos tres campos.
4. **Datos de la venta:** Método de pago, tipo de entrega (envío / retiro en tienda), moneda, vendedor (`nombre_vendedor` si aplica), observaciones (si las hay)
5. **Dirección de envío:** Incluida si `detalle.envio?.tipo_entrega === 'envio'` y hay dirección registrada
6. **Tabla de productos:** Nombre, código, cantidad, precio unitario, subtotal por fila
7. **Total general**
8. **Pie de página:** "Este comprobante no tiene validez fiscal"

---

## Arquitectura

### Backend

#### Nuevo servicio: `backend/src/services/comprobanteService.ts`

- **Patrón:** Funciones exportadas (igual que `emailService`, `ofertaService`)
- **Función principal:** `generarComprobantePDF(detalle: DetalleParaComprobante): Promise<Buffer>` donde `DetalleParaComprobante` es un tipo local definido en el servicio que refleja la forma real de `obtenerDetalleAdmin`: `cliente: { nombre_cliente, apellido_cliente, correo } | null` (objeto anidado). **No usar `VentaAdminDetalle`** del archivo de tipos, ya que ese tipo tiene `nombre_cliente`/`email_cliente` planos (forma del listado, no del detalle).
  - Construye el PDF usando `pdfkit`
  - `pdfkit` trabaja con streams Node.js — el Buffer se obtiene colectando eventos `data` y resolviendo en `end`, envuelto en `new Promise<Buffer>`:
    ```ts
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.end();
    ```
  - Retorna un Buffer listo para enviar como respuesta HTTP o adjuntar en email
- **Constantes de negocio (placeholders fácilmente editables):**
  ```ts
  const EMPRESA = {
    nombre: 'TecnoCel',
    telefono: '(0000) 000-0000',
    direccion: 'A definir',
    web: 'tecnocel.com.ar',
  };
  ```

#### Nuevos métodos en `AdminVentaController`

Los nuevos endpoints pertenecen a `AdminVentaController` (no a `VentaController`, que solo maneja rutas de clientes).

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/ventas/admin/:id_venta/comprobante` | Genera y descarga el PDF |
| `POST` | `/api/ventas/admin/:id_venta/enviar-comprobante` | Genera el PDF y lo envía por email al cliente |

**GET `/admin/:id_venta/comprobante`:**
- Carga el detalle completo de la venta desde la BD
- Llama a `generarComprobantePDF(detalle)`
- Responde con:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="comprobante-{nro_venta}.pdf"`
  - Body: el Buffer del PDF

**POST `/admin/:id_venta/enviar-comprobante`:**
- Verifica que la venta tenga cliente con correo registrado (400 si no)
- Genera el PDF con `comprobanteService`
- Envía email con `emailService` (Resend), usando el formato de attachment de Resend:
  `attachments: [{ filename: 'comprobante-{nro_venta}.pdf', content: buffer }]`
- Responde: `{ mensaje: 'Comprobante enviado a {correo}' }`

#### Rutas

Agregadas en `ventaRoutes.ts` **antes** de `router.use(verificarTokenCliente)` (línea 143) y **antes** de `GET /admin/:id_venta` (línea 131) por convención: rutas con paths más específicos/largos van antes que las parametrizadas genéricas. Siguen el mismo patrón de roles que las rutas admin existentes:

```ts
// GET /api/ventas/admin/:id_venta/comprobante
router.get('/admin/:id_venta/comprobante',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  AdminVentaController.descargarComprobante.bind(AdminVentaController)
);

// POST /api/ventas/admin/:id_venta/enviar-comprobante
router.post('/admin/:id_venta/enviar-comprobante',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  AdminVentaController.enviarComprobante.bind(AdminVentaController)
);
```

---

### Frontend

#### Nuevos métodos en `ventaAdminService.ts`

```ts
descargarComprobante(id_venta: number): Promise<void>
```
- Llama a `GET /api/ventas/admin/:id_venta/comprobante` con `responseType: 'blob'`
- Crea un object URL (`URL.createObjectURL`) y dispara la descarga programáticamente con un `<a>` temporal
- Limpia el object URL después de la descarga con `URL.revokeObjectURL`

```ts
enviarComprobante(id_venta: number): Promise<{ mensaje: string }>
```
- Llama a `POST /api/ventas/admin/:id_venta/enviar-comprobante`
- Retorna el mensaje de confirmación

#### Cambios en `DetalleVentaModal.tsx`

**Estado local nuevo:**
- `descargando: boolean` — bloquea el botón durante la descarga
- `enviando: boolean` — bloquea el botón durante el envío por email

**Dos botones nuevos en el footer** (entre "Cancelar Venta" y "Cerrar"):
- **"Descargar PDF"** — visible cuando `detalle` está cargado. Ícono: `download`. Llama a `descargarComprobante`. Deshabilitado mientras `descargando`.
- **"Enviar por email"** — visible solo si `detalle.cliente?.correo` existe (venta con cliente registrado). Ícono: `email`. Llama a `enviarComprobante` y muestra notificación de éxito/error con `showNotification`. Deshabilitado mientras `enviando`.

Ambos botones muestran estado de carga (ícono o texto cambiado) mientras procesan.

---

## Dependencias nuevas

| Paquete | Lado | Motivo |
|---------|------|--------|
| `pdfkit` | backend | Generación de PDF |
| `@types/pdfkit` | backend (devDependency) | Tipos TypeScript |

No se agregan dependencias al frontend.

---

## Manejo de errores

| Caso | Comportamiento |
|------|---------------|
| Venta no encontrada | 404 con `{ error: 'Venta no encontrada' }` |
| Venta sin cliente al enviar email | 400 con `{ error: 'Esta venta no tiene cliente con correo registrado' }` |
| Error de Resend | 500 con log de error, respuesta `{ error: 'Error al enviar el email' }` |
| Error de generación PDF | 500 con log de error |
| Error en frontend | `showNotification(mensaje, 'error')` |

---

## Lo que NO incluye este diseño

- Validez fiscal (AFIP, factura A/B/C) — fuera de alcance
- Generación automática al confirmar una venta — posible mejora futura
- Historial de comprobantes enviados — posible mejora futura
- Código QR en el PDF — posible mejora futura
