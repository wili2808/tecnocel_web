## Refactor Completo del Shell Admin y Primitivas Reutilizables

### Resumen
Se hará un refactor estructural del panel admin para eliminar duplicación visual y de código, con dos objetivos cerrados:

- Resolver la doble cabecera actual usando una estrategia **mixta**:
  - `AdminPanel` conservará una cabecera superior **mínima y contextual**.
  - Los módulos conservarán solo la parte **funcional** de su header cuando aporte acciones, tabs, filtros o controles propios.
  - Los títulos/subtítulos duplicados dentro de módulos se eliminarán o se convertirán en bloques funcionales sin repetir jerarquía visual.
- Extraer una **base completa** de componentes reutilizables del admin para unificar presentación y reducir repetición.

El resultado esperado es un panel más consistente, más fácil de mantener y listo para seguir creciendo sin volver a duplicar layouts.

### Cambios de implementación
#### 1. Shell del panel admin
- Mantener en `AdminPanel` una cabecera superior ligera con:
  - contexto de sección activa
  - descripción breve
  - badges de rol/módulos
- Reducir su protagonismo visual para que no compita con el contenido.
- Convertirla en un patrón fijo del shell, no en un header “de página completa”.

#### 2. Estrategia de cabeceras por módulo
- Quitar de módulos grandes la repetición de:
  - título principal
  - subtítulo descriptivo
  - bloque visual equivalente al header del shell
- Conservar dentro de los módulos solo bloques funcionales, por ejemplo:
  - acciones primarias (`Crear`, `Exportar`, `Registrar`)
  - tabs internas
  - filtros
  - stats operativas cuando son propias del módulo
- Aplicar esta limpieza al menos en:
  - ventas
  - compras
  - productos
  - usuarios
  - clientes
  - ofertas
  - reportes
- Regla explícita:
  - el shell comunica “dónde estoy”
  - el módulo comunica “qué puedo hacer aquí”

#### 3. Primitivas reutilizables del admin
Crear una pequeña base reusable para el área admin, con componentes pensados para componer, no para rigidizar:

- `AdminSectionActions`
  - contenedor estándar para acciones del módulo
  - soporta botón principal, acciones secundarias y alineación responsive
- `AdminEmptyState`
  - para estados de vacío
  - variantes: vacío, error, sin resultados, sin permisos
  - recibe icono, título, texto y acción opcional
- `AdminStatCard`
  - tarjeta KPI/indicador para barras de métricas
  - soporta label, valor, subtítulo, icono y tono
- `AdminSurface` o `AdminPanelCard`
  - contenedor visual base para bloques de contenido del admin
  - mismo radio, borde, padding y separación
- `AdminModuleIntro` opcional solo si hace falta
  - no como header duplicado
  - solo para casos donde una sección interna necesita una microintroducción funcional

No se extraerá todavía una tabla genérica compleja si eso obliga a forzar demasiado la implementación actual. Las tablas seguirán locales, pero se apoyarán en superficies/estados comunes.

#### 4. Normalización visual del admin
- Unificar espaciado, bordes, densidad y jerarquía entre módulos.
- Definir una convención visual estable:
  - shell header: contexto
  - actions row: operaciones
  - stats row: indicadores
  - table/content surface: trabajo principal
- Reusar tokens actuales (`variables.css`, `themes.css`) sin crear un sistema paralelo.
- Mantener estética minimal/elegante ya alineada con el dashboard refactorizado.

#### 5. Aplicación por fases dentro del mismo refactor
Orden recomendado para implementación real:
1. Crear primitivas base.
2. Adaptar `AdminPanel` al header mixto definitivo.
3. Migrar primero módulos grandes y visibles:
   - ventas
   - compras
   - productos
   - reportes
4. Migrar luego:
   - usuarios
   - clientes
   - ofertas
5. Reemplazar estados repetidos de “sin permisos”, “error”, “vacío” por `AdminEmptyState`.
6. Reemplazar KPIs repetidos por `AdminStatCard` donde encaje sin perder claridad.

### APIs, interfaces y tipos
- No se requieren cambios de backend ni contratos API.
- Se agregarán props reutilizables para componentes admin base, por ejemplo:
  - `AdminEmptyState`: `icon`, `title`, `message`, `actionLabel`, `onAction`, `tone`
  - `AdminStatCard`: `label`, `value`, `detail`, `icon`, `tone`
  - `AdminSectionActions`: `children`, variantes de alineación/responsive
- No se modifican tipos de negocio (`ventas`, `compras`, `usuarios`, etc.), solo composición UI.

### Plan de pruebas
- Verificar que el panel no muestre doble cabecera en:
  - ventas
  - compras
  - productos
  - usuarios
  - clientes
  - ofertas
  - reportes
- Verificar que cada módulo mantenga sus acciones visibles y funcionales.
- Verificar responsive en mobile/tablet:
  - shell header no invade el contenido
  - acciones se apilan correctamente
  - tabs/filtros siguen usables
- Verificar estados:
  - sin permisos
  - vacío
  - error
  - carga
- Correr `eslint` al menos sobre:
  - `AdminPanel`
  - nuevos componentes admin base
  - módulos migrados
- Validar visualmente que dashboard + shell + módulos compartan la misma jerarquía.

### Supuestos y decisiones fijadas
- Se adopta la estrategia de header **mixta** elegida:
  - cabecera global mínima en shell
  - headers locales solo si cumplen función operativa
- El alcance será **base completa** en esta fase:
  - headers funcionales
  - empty/error/no-permission states
  - KPI/stat cards
  - superficies comunes
- No se hace aún un refactor profundo de tablas a un componente único genérico.
- No se tocan endpoints ni lógica de negocio; es un refactor de estructura UI y composición del panel.
