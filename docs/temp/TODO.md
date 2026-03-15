# TODO - TecnoCel Web

## 🔴 CRÍTICO (Bugs que afectan funcionalidad)

- [x] **Llamada doble en backend en página de producto** - ✅ INVESTIGADO: El GET al producto anterior con status 304 es comportamiento normal del browser (revalidación de caché HTTP). Se agregó AbortController para cancelar el procesamiento JS de requests anteriores y se refactorizó el useEffect con refs estables para evitar re-renders.

## 🟠 ALTA PRIORIDAD (Funcionalidades esenciales)

- [✅] **Restablecimiento/Recuperación de contraseña** - Implementar endpoint y flujo frontend (token temporal, email, validación)
- [✅] **Email de activación de cuenta** - Verificación de email al registrarse (con token, link de confirmación)
- [✅] **Sistema de emailing transaccional** - Implementar envíos para:
  - Confirmación de compra ✅
  - Cambio de estado de venta (procesando, envío, entregado, cancelado)
  - Recuperación de contraseña ✅
  - Activación de cuenta ✅
  - Nuevas respuestas a comentarios ✅
- [ ] **Sistema de mensajería de clientes** - Nueva tabla `tb_mensajes_cliente` + controlador para:
  - Formulario de contacto (cliente → admin)
  - Respuestas de admin
  - Historial en panel de cliente

## 🟡 PRIORIDAD MEDIA (Mejoras significativas)

- [ ] **Permisos/RBAC mejorado en gestión de negocio** - Revisar y refinar permisos por rol en panel admin
- [ ] **Avatar de cliente y usuario** - Subida y gestión de fotos de perfil
- [✅] **Google Auth - Botones diferenciados + fix bug cancelación** - Estilos diferentes para login vs register + arreglar bug de botones bugueados al cancelar
- [ ] **Calificación de producto más visible** - Mostrar rating cerca del nombre en ProductPage y ProductCard
- [✅] **Imágenes de marcas** - Agregar soporte para logos/imágenes de marcas (crear tabla `tb_marca_imagen` o campo en Marca)
- [✅] **Categorías y redirecciones en footer** - Revisar links rotos/redirecciones incorrectas en footer
- [ ] **Burbuja de detalles del home en otras páginas** - Hacerla más visible y reutilizable en ProductPage y Catalog
- [✅] **Administración de Favoritos (módulo admin)** - Vista admin para gestionar favoritos de clientes (ver, eliminar, estadísticas)

## 🟢 BAJA PRIORIDAD (Mejoras UI/UX menores)

- [ ] **Eliminar ID de cliente en panel "Datos de cuenta"** - Ocultarlo o eliminarlo (es redundante)
- [ ] **Reducir tamaño del mapa** - Ajustar altura/ancho del componente OpenStreetMap en LocationSection
- [ ] **Eliminar contador de productos** - Si no se usa, eliminar display de cantidad

## 🔐 SEGURIDAD (Fixes pendientes)

- [ ] **Refresh Tokens** - Rediseño del sistema de sesiones. Access token de corta duración (15-30 min) + refresh token de larga duración en cookie HttpOnly. Afecta backend (nueva tabla `tb_refresh_tokens`), middleware, controladores de login/logout y frontend (renovación silenciosa antes de expiración). Hacer junto con el fix de localStorage.
- [ ] **Tokens de admin fuera de localStorage** - Mover el `admin_token` de localStorage a memoria (variable de estado React) para evitar robo por XSS. Depende de refresh tokens en cookie HttpOnly para recuperar sesión al recargar. Hacer junto con el fix de refresh tokens.

---

## Notas de Contexto

- **Email**: Usar nodemailer + templates HTML. Considerar servicio externo (SendGrid, Mailgun) para producción
- **Mensajería**: Crear tabla `tb_mensajes_cliente` con campos: id, id_cliente, asunto, mensaje, estado (sin_leer/leído), id_admin_respuesta, respuesta, fecha_creacion, fecha_respuesta
- **Avatar**: Reutilizar lógica de `imageService` + subida Multer. Limitar tamaño a 2MB, redimensionar a 256x256
- **Google Auth**: Revisar bug en cancelación del flujo OAuth (probablemente en token state)
- **RBAC**: Verificar permisos por rol en endpoints sensibles (reportes, cambio de estado ventas, etc.)
