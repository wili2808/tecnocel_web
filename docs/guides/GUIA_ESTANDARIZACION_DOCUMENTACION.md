# Guía de Estandarización de Documentación

> Directrices y estándares para la creación y mantenimiento de documentación técnica en el proyecto TecnoCel Web.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Estructura de Documento](#estructura-de-documento)
- [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
- [Cuándo Incluir Tabla de Contenidos](#cuándo-incluir-tabla-de-contenidos)
- [Títulos y Anchors](#títulos-y-anchors)
- [Sistema de Navegación](#sistema-de-navegación)
- [Uso de Emojis](#uso-de-emojis)
- [Enlaces](#enlaces)
- [Metadata](#metadata)
- [Formato y Estilo](#formato-y-estilo)
- [Checklist de Creación](#checklist-de-creación)
- [Herramientas y Automatización](#herramientas-y-automatización)
- [Reglas de Oro](#reglas-de-oro)
- [Ejemplos](#ejemplos)

---

## Introducción

Este documento establece las directrices para mantener una documentación técnica consistente, navegable y de alta calidad en todo el proyecto. Todos los documentos markdown deben seguir estos estándares.

### Objetivos

1. Mantener consistencia en formato y estructura
2. Facilitar la navegación entre documentos relacionados
3. Asegurar que todos los enlaces funcionen correctamente
4. Mejorar la experiencia de lectura y búsqueda
5. Simplificar el mantenimiento de la documentación

### Alcance

Aplica a todos los archivos markdown en el proyecto:

- READMEs principales y secundarios
- Documentación técnica (API, base de datos, deployment)
- Guías y tutoriales
- Documentación de componentes
- Notas de implementación

---

## Estructura de Documento

Todo documento debe seguir esta estructura base:

```markdown
**[Documentación](ruta/relativa)** | **[Inicio](ruta/relativa)**

---

# Título Principal

> Descripción breve del documento (1-2 líneas)

---

## Tabla de Contenidos

- [Sección 1](#seccion-1)
- [Sección 2](#seccion-2)
- [Sección 3](#seccion-3)

---

## Sección 1

Contenido de la sección...

---

## Sección 2

Contenido de la sección...

---

## Sección 3

Contenido de la sección...

---

**Última actualización**: [Fecha]
**Versión**: [X.X]
**Estado**: [En desarrollo | Completado | Deprecado]

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](ruta/relativa)** | **[Inicio](ruta/relativa)**
```

> **Nota**: El documento termina con los botones de navegación, sin separador adicional al final.

### Elementos Obligatorios

1. **Título principal** (h1) - Solo uno por documento
2. **Descripción breve** - Ubicada justo después del título
3. **Separadores** - Usar `---` entre secciones principales
4. **Tabla de contenidos** - Para documentos con 3+ secciones
5. **Metadata** - Al final del documento
6. **Navegación** - Botones a principiop y final del documento

### Elementos Opcionales

- Emojis en el título principal (solo si aportan valor)
- Imágenes y diagramas
- Bloques de código
- Tablas
- Listas de tareas

---

## Convenciones de Nomenclatura

### Archivos

- **READMEs principales**: `README.md` (mayúsculas)
- **Documentación general**: `SCREAMING_SNAKE_CASE.md`
- **Endpoints y recursos**: `kebab-case.md` (minúsculas con guiones)
- **Componentes**: `PascalCase.md` (mismo nombre del componente)

#### Ejemplos

```
✅ README.md
✅ GETTING_STARTED.md
✅ API_ENDPOINTS.md
✅ productos.md
✅ carrito.md
✅ ProductCard.md

❌ readme.md
❌ getting-started.md
❌ Productos.md
❌ CARRITO.MD
```

### Directorios

- Usar `kebab-case` para carpetas
- Nombres descriptivos y concisos
- Agrupar por funcionalidad o tipo

```
✅ api/
✅ database/
✅ getting-started/
✅ deployment/

❌ API/
❌ Database/
❌ Getting_Started/
```

---

## Cuándo Incluir Tabla de Contenidos

### Cuándo Incluirla

Agregar tabla de contenidos cuando el documento cumple alguno de estos criterios:

- Tiene 3 o más secciones principales (h2)
- Supera las 100 líneas de contenido
- Es un README principal
- Es documentación de referencia

### Formato

```markdown
## Tabla de Contenidos

- [Sección Principal](#seccion-principal)
  - [Subsección](#subseccion)
  - [Otra Subsección](#otra-subseccion)
- [Segunda Sección](#segunda-seccion)
- [Tercera Sección](#tercera-seccion)

---
```

### Reglas

1. Usar título "Tabla de Contenidos" sin emoji
2. Listar solo secciones h2 y h3
3. No incluir h4 o niveles inferiores
4. Usar indentación (2 espacios) para subsecciones
5. Finalizar con separador `---`
6. Anchors sin emojis, pero **conservando acentos**

---

## Títulos y Anchors

### Jerarquía de Títulos

```markdown
# h1 - Título del Documento (solo uno)

## h2 - Sección Principal

### h3 - Subsección

#### h4 - Subsección Menor (usar con moderación)
```

### Generación de Anchors

Los anchors se generan automáticamente por markdown siguiendo estas reglas:

1. Convertir a minúsculas
2. Eliminar emojis y caracteres especiales
3. Reemplazar espacios con guiones
4. **Conservar acentos** - Mantener caracteres con tilde en las tablas de contenido

#### Ejemplos de Conversión

| Título                         | Anchor                       |
| ------------------------------ | ---------------------------- |
| `## API Endpoints`             | `#api-endpoints`             |
| `## Instalación Rápida`        | `#instalación-rápida`        |
| `## Base de Datos`             | `#base-de-datos`             |
| `## Configuración del Entorno` | `#configuración-del-entorno` |

### Reglas para Títulos

1. Usar capitalización tipo título (primera letra mayúscula)
2. Evitar emojis en h2 y h3 (mantener limpio)
3. Ser descriptivo pero conciso
4. No terminar con punto
5. Usar verbos en infinitivo para acciones

```markdown
✅ ## Instalación
✅ ## Configurar Variables de Entorno
✅ ## Crear Nueva Base de Datos

❌ ## Instalación.
❌ ## configuración
❌ ## CONFIGURAR EL PROYECTO
```

---

## Sistema de Navegación

Cada documento debe incluir navegación contextual según su ubicación en la estructura del proyecto.

### Niveles de Navegación

#### Nivel 0 - Raíz del Proyecto

**Ubicación**: `README.md`

**Navegación**:

```markdown
**[Documentación](docs/README.md)**
```

#### Nivel 1 - Carpetas Principales

**Ubicación**: `docs/README.md`, `backend/README.md`, `frontend/README.md`

**Navegación**:

```markdown
**[Volver arriba](#tabla-de-contenidos)** | **[Inicio](../README.md)**
```

#### Nivel 2 - Subcarpetas

**Ubicación**: `docs/api/README.md`, `docs/database/README.md`

**Navegación**:

```markdown
**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../README.md)** | **[Inicio](../../README.md)**
```

#### Nivel 3+ - Documentos Profundos

**Ubicación**: `docs/api/endpoints/productos.md`

**Navegación**:

```markdown
**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
```

### Botones de Navegación

Los botones deben ir:

1. Al final del documento
2. Después de la metadata
3. Después del último separador `---`
4. No incluir separador adicional después de los botones

---

## Uso de Emojis

### Directrices

1. **Usar con moderación** - Solo cuando aportan valor semántico
2. **Solo en h1** - Evitar en h2, h3 y h4
3. **Nunca en anchors** - Los enlaces no funcionarán correctamente
4. **Consistencia** - Usar el mismo emoji para el mismo concepto

### Emojis Recomendados

| Contexto      | Emoji | Uso                              |
| ------------- | ----- | -------------------------------- |
| E-commerce    | 🛍️    | Título principal del proyecto    |
| API           | 🔌    | Documentación de API             |
| Base de datos | 🗄️    | Documentación de BD              |
| Seguridad     | 🔒    | Temas de autenticación/seguridad |
| Documentación | 📚    | Índices y guías                  |
| Configuración | ⚙️    | Setup y configuración            |
| Guías         | 📖    | Tutoriales y getting started     |

### Ejemplos

```markdown
✅ # 🛍️ TecnoCel Web
✅ # 🔌 API REST

✅ ## Instalación
✅ ## Configuración
✅ ## Endpoints

❌ ## 📦 Instalación
❌ ## ⚙️ Configuración
❌ ### 🔌 Endpoint de Productos
```

---

## Enlaces

### Enlaces Internos (Anchors)

Siempre usar anchors sin emojis, conservando los acentos:

```markdown
✅ [Ver API Endpoints](#api-endpoints)
✅ [Instalación](#instalación)
✅ [Configuración del Entorno](#configuración-del-entorno)

❌ [🔌 API Endpoints](#🔌-api-endpoints)
❌ [Instalación](#instalacion) // Sin acento
❌ [Ver API](#API) // En mayúsculas
```

### Enlaces Relativos

Usar rutas relativas, nunca absolutas:

```markdown
✅ [Documentación](../README.md)
✅ [API](../../api/README.md)
✅ [Endpoints](./endpoints/README.md)

❌ [Documentación](/docs/README.md)
❌ [API](C:/proyecto/docs/api/README.md)
❌ [API](https://github.com/user/repo/docs/api)
```

### Enlaces Externos

Incluir texto descriptivo, no solo la URL:

```markdown
✅ [Documentación de React](https://react.dev)
✅ [TypeScript Handbook](https://www.typescriptlang.org/docs/)

❌ https://react.dev
❌ [Click aquí](https://react.dev)
```

### Enlaces a Líneas de Código

Usar formato de referencia de línea:

```markdown
Consultar la función `handleSubmit` en [AuthController.ts:127](../../backend/src/controllers/AuthController.ts#L127)
```

---

## Metadata

### Información Estándar

Todo documento debe incluir metadata al final:

```markdown
---

**Última actualización**: 8 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado
**Autor**: Equipo TecnoCel Web

---
```

### Campos Opcionales

```markdown
**Responsable**: [Nombre]
**Revisado por**: [Nombre]
**Fecha de creación**: [Fecha]
**Relacionado con**: [Enlaces a docs relacionados]
```

### Estados Válidos

- **En desarrollo** - Documento en construcción
- **En revisión** - Pendiente de aprobación
- **Completado** - Finalizado y actualizado
- **Deprecado** - Obsoleto, mantener por referencia
- **Archivado** - Movido a archivo histórico

---

## Formato y Estilo

### Separadores

Usar `---` para separar secciones principales:

```markdown
## Sección 1

Contenido...

---

## Sección 2

Contenido...

---
```

### Espaciado

- Una línea en blanco entre párrafos
- Una línea en blanco antes y después de:
  - Títulos
  - Bloques de código
  - Listas
  - Tablas
  - Separadores

### Listas

**Listas sin orden**:

```markdown
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3
```

**Listas ordenadas**:

```markdown
1. Primer paso
2. Segundo paso
3. Tercer paso
```

**Listas de tareas**:

```markdown
- [ ] Tarea pendiente
- [x] Tarea completada
```

### Bloques de Código

Siempre especificar el lenguaje:

````markdown
```typescript
interface Usuario {
  id: number;
  nombre: string;
}
```

```bash
npm install
npm run dev
```

```json
{
  "name": "tecnocel-web",
  "version": "1.0.0"
}
```
````

### Citas y Alertas

```markdown
> Nota importante sobre el comportamiento del sistema.

> ⚠️ **Advertencia**: Esta operación es irreversible.

> 💡 **Tip**: Usar variables de entorno para configuración sensible.
```

### Tablas

```markdown
| Columna 1 | Columna 2 | Columna 3 |
| --------- | --------- | --------- |
| Dato 1    | Dato 2    | Dato 3    |
| Dato 4    | Dato 5    | Dato 6    |
```

---

## Checklist de Creación

Al crear un nuevo documento, verificar:

### Estructura

- [ ] Título principal único (h1)
- [ ] Descripción breve después del título
- [ ] Separador después de la descripción
- [ ] Tabla de contenidos (si aplica)
- [ ] Separador después del índice

### Contenido

- [ ] Secciones principales con h2
- [ ] Subsecciones con h3
- [ ] Separadores entre secciones
- [ ] Código con sintaxis especificada
- [ ] Imágenes con texto alternativo

### Enlaces

- [ ] Anchors sin emojis, conservando acentos
- [ ] Enlaces relativos, no absolutos
- [ ] Todos los enlaces probados

### Footer

- [ ] Metadata completa
- [ ] Botones de navegación
- [ ] Separador final

### Validación

- [ ] Ejecutar script de estandarización
- [ ] Verificar funcionamiento de anchors
- [ ] Probar navegación
- [ ] Revisar ortografía

---

## Herramientas y Automatización

### Script de Estandarización

**Ubicación**: `scripts/fix-markdown-docs.js`

**Uso**:

```bash
node scripts/fix-markdown-docs.js
```

**Funcionalidades**:

- Detecta y corrige enlaces con emojis en anchors
- Genera tabla de contenidos automática
- Agrega navegación según nivel de profundidad
- Estandariza formato de separadores
- Limpia títulos para mejor legibilidad

### Ejecución Automática

Ejecutar el script antes de:

- Crear un commit
- Hacer push a remoto
- Crear pull request
- Publicar documentación

### Validación Manual

Después de ejecutar el script, verificar:

1. Tabla de contenidos generada correctamente
2. Enlaces de navegación funcionan
3. Anchors llevan a la sección correcta
4. Formato consistente en todo el documento

---

## Reglas de Oro

### 10 Mandamientos de la Documentación

1. **NUNCA incluir emojis en anchors** - Los enlaces no funcionarán
2. **CONSERVAR acentos en anchors** - Mantener tildes en las tablas de contenido
3. **EVITAR emojis innecesarios en títulos h2/h3** - Mantener limpio
4. **SIEMPRE usar rutas relativas** - Nunca rutas absolutas
5. **MANTENER consistencia en separadores** - Usar `---`
6. **AGREGAR tabla de contenidos** - En documentos con 3+ secciones
7. **INCLUIR navegación contextual** - Según nivel de profundidad
8. **ESPECIFICAR lenguaje en código** - Para resaltado de sintaxis
9. **PROBAR todos los enlaces** - Antes de commit
10. **INCLUIR metadata completa** - Fecha, versión, estado

---

## Ejemplos

### Ejemplo 1: README Principal

````markdown
# 🛍️ TecnoCel Web

> Plataforma de e-commerce moderna para productos tecnológicos.

---

## Tabla de Contenidos

- [Características](#características)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Documentación](#documentación)

---

## Características

- Catálogo de productos con filtros avanzados
- Carrito de compras en tiempo real
- Sistema de autenticación OAuth
- Panel de administración

---

## Instalación

Clonar el repositorio e instalar dependencias:

```bash
git clone https://github.com/usuario/tecnocel-web.git
cd tecnocel-web
npm install
```
````

---

## Configuración

Copiar archivo de variables de entorno:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales.

---

## Uso

Iniciar servidor de desarrollo:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Documentación

Para más información, consultar:

- [Documentación completa](docs/README.md)
- [Guía de inicio rápido](docs/guides/GETTING_STARTED.md)
- [API Reference](docs/api/README.md)

---

**Última actualización**: 8 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Documentación](docs/README.md)**

````

### Ejemplo 2: Documento de API

```markdown
# Endpoints de Productos

> Documentación de los endpoints para gestión de productos.

---

## Tabla de Contenidos

- [Listar Productos](#listar-productos)
- [Obtener Producto](#obtener-producto)
- [Crear Producto](#crear-producto)
- [Actualizar Producto](#actualizar-producto)
- [Eliminar Producto](#eliminar-producto)

---

## Listar Productos

Obtiene la lista de productos disponibles.

**Endpoint**: `GET /api/productos`

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `categoria` | string | No | Filtrar por categoría |
| `marca` | string | No | Filtrar por marca |
| `limit` | number | No | Límite de resultados (default: 20) |

**Respuesta**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "iPhone 15",
      "precio": 999.99,
      "stock": 10
    }
  ]
}
````

---

## Obtener Producto

Obtiene los detalles de un producto específico.

**Endpoint**: `GET /api/productos/:id`

**Parámetros de Ruta**:

| Parámetro | Tipo   | Descripción     |
| --------- | ------ | --------------- |
| `id`      | number | ID del producto |

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "iPhone 15",
    "precio": 999.99,
    "descripcion": "Smartphone de última generación",
    "stock": 10,
    "imagenes": ["/uploads/iphone15.jpg"]
  }
}
```

---

## Crear Producto

Crea un nuevo producto.

**Endpoint**: `POST /api/productos`

**Autenticación**: Requerida (Admin)

**Body**:

```json
{
  "nombre": "iPhone 15",
  "precio": 999.99,
  "descripcion": "Smartphone de última generación",
  "stock": 10,
  "categoria_id": 1,
  "marca_id": 2
}
```

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "iPhone 15"
  }
}
```

---

## Actualizar Producto

Actualiza un producto existente.

**Endpoint**: `PUT /api/productos/:id`

**Autenticación**: Requerida (Admin)

**Body**: Campos a actualizar (parcial permitido)

---

## Eliminar Producto

Elimina un producto.

**Endpoint**: `DELETE /api/productos/:id`

**Autenticación**: Requerida (Admin)

---

**Última actualización**: 8 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

**Relacionado con**:

- [API Reference](../README.md)
- [Modelos de Base de Datos](../../database/SCHEMA.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**

````

### Ejemplo 3: Guía de Componente

```markdown
# Button Component

> Componente de botón reutilizable con soporte para variantes y tamaños.

---

## Tabla de Contenidos

- [Uso Básico](#uso-básico)
- [Props](#props)
- [Variantes](#variantes)
- [Ejemplos](#ejemplos)
- [Accesibilidad](#accesibilidad)

---

## Uso Básico

```tsx
import { Button } from '@/components/common/Button';

function App() {
  return (
    <Button onClick={() => alert('Clicked!')}>
      Click me
    </Button>
  );
}
````

---

## Props

| Prop       | Tipo                                   | Default     | Descripción             |
| ---------- | -------------------------------------- | ----------- | ----------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Estilo del botón        |
| `size`     | `'sm' \| 'md' \| 'lg'`                 | `'md'`      | Tamaño del botón        |
| `disabled` | `boolean`                              | `false`     | Deshabilitar botón      |
| `loading`  | `boolean`                              | `false`     | Mostrar estado de carga |
| `onClick`  | `() => void`                           | -           | Handler de click        |

---

## Variantes

### Primary

```tsx
<Button variant="primary">Primary Button</Button>
```

### Secondary

```tsx
<Button variant="secondary">Secondary Button</Button>
```

### Danger

```tsx
<Button variant="danger">Delete</Button>
```

---

## Ejemplos

### Con Loading

```tsx
<Button loading>Saving...</Button>
```

### Deshabilitado

```tsx
<Button disabled>Disabled Button</Button>
```

### Tamaños

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

---

## Accesibilidad

El componente incluye:

- Atributos ARIA apropiados
- Soporte para teclado
- Estados de foco visibles
- Roles semánticos

---

**Última actualización**: 8 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

**Código fuente**: [Button.tsx](../../../src/components/common/Button/Button.tsx)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Componentes](../README.md)** | **[Inicio](../../../../README.md)**

```

---

**Responsable**: Equipo TecnoCel Web
**Versión**: 1.1
**Última actualización**: 8 de Octubre, 2025
**Estado**: Completado

**Documentos relacionados**:
- [Plan de Documentación](PLAN_DOCUMENTACION.md)
- [Documentación Principal](../README.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../README.md)** | **[Inicio](../../README.md)**
```
