# Plan de Documentación - Proyecto de Tesis

## "Desarrollo de una API RESTful y su implementación en una aplicación web de ventas con modelo de gestión"

**Carrera:** Licenciatura en Sistemas
**Proyecto:** TecnoCel Web — Plataforma e-commerce full-stack
**Stack:** React 18 + TypeScript | Node.js + Express | MySQL | Sequelize ORM

---

## Índice del Plan

1. [Estructura del Documento Final](#1-estructura-del-documento-final)
2. [Fase 1 — Fundamentos y Marco Teórico](#2-fase-1--fundamentos-y-marco-teórico)
3. [Fase 2 — Análisis y Especificación de Requisitos](#3-fase-2--análisis-y-especificación-de-requisitos)
4. [Fase 3 — Diseño del Sistema](#4-fase-3--diseño-del-sistema)
5. [Fase 4 — Implementación y Patrones](#5-fase-4--implementación-y-patrones)
6. [Fase 5 — Pruebas y Calidad](#6-fase-5--pruebas-y-calidad)
7. [Fase 6 — Despliegue y Operación](#7-fase-6--despliegue-y-operación)
8. [Fase 7 — Resultados y Conclusiones](#8-fase-7--resultados-y-conclusiones)
9. [Herramientas Recomendadas](#9-herramientas-recomendadas)
10. [Cronograma Sugerido](#10-cronograma-sugerido)
11. [Métricas del Proyecto](#11-métricas-del-proyecto)

---

## 1. Estructura del Documento Final

```
PORTADA
DEDICATORIA / AGRADECIMIENTOS
ÍNDICE GENERAL
ÍNDICE DE FIGURAS Y TABLAS
RESUMEN / ABSTRACT

CAPÍTULO I    — Introducción
CAPÍTULO II   — Marco Teórico
CAPÍTULO III  — Análisis de Requisitos
CAPÍTULO IV   — Diseño del Sistema
CAPÍTULO V    — Implementación
CAPÍTULO VI   — Pruebas y Calidad
CAPÍTULO VII  — Despliegue
CAPÍTULO VIII — Resultados y Conclusiones

BIBLIOGRAFÍA
ANEXOS
  A. Manual de Usuario
  B. Manual Técnico
  C. Diccionario de Datos
  D. Código Fuente Relevante
```

---

## 2. Fase 1 — Fundamentos y Marco Teórico

### Capítulo I: Introducción

| Sección | Contenido | Cómo elaborarlo |
|---------|-----------|-----------------|
| **1.1 Planteamiento del problema** | Necesidad de digitalización de ventas en comercios de tecnología, problemas de gestión manual, falta de presencia web | Redacción propia basada en contexto del negocio |
| **1.2 Justificación** | Por qué una solución web full-stack, ventajas sobre sistemas existentes, impacto en el negocio | Investigación + datos del sector e-commerce en Argentina |
| **1.3 Objetivos** | General y específicos (4-6 objetivos específicos) | Derivar de las funcionalidades implementadas |
| **1.4 Alcance y limitaciones** | Qué cubre el sistema y qué queda fuera (pagos reales, logística, etc.) | Revisar `docs/project/ESTADO_AVANCE.md` |
| **1.5 Metodología de desarrollo** | Metodología ágil utilizada, ciclos de desarrollo | Documentar el proceso real seguido |

**Usar Claude para:**
```
"Basándote en el proyecto TecnoCel Web, redactame una sección de
planteamiento del problema para una tesis, enfocándote en la
problemática de la gestión manual de ventas en comercios de
tecnología y la necesidad de digitalización."
```

### Capítulo II: Marco Teórico

| Sección | Temas a cubrir | Fuentes recomendadas |
|---------|----------------|---------------------|
| **2.1 Arquitectura de software** | Cliente-servidor, SPA, API REST, MVC | Pressman, Sommerville, MDN Web Docs |
| **2.2 Tecnologías web modernas** | React, Node.js, TypeScript, Vite | Documentación oficial de cada tecnología |
| **2.3 Bases de datos relacionales** | MySQL, normalización, ORM (Sequelize) | Elmasri & Navathe, docs Sequelize |
| **2.4 Seguridad en aplicaciones web** | JWT, OAuth 2.0, OWASP, bcrypt, CORS | OWASP Foundation, RFC 7519 (JWT) |
| **2.5 Patrones de diseño** | Singleton, Observer, MVC, Repository, Factory | Gamma et al. (GoF), Fowler |
| **2.6 Metodologías ágiles** | Scrum/Kanban (la que hayas usado), CI/CD | Schwaber & Sutherland |
| **2.7 UX/UI y diseño responsive** | Mobile-first vs desktop-first, accesibilidad, sistemas de diseño | Nielsen Norman Group, W3C WCAG |
| **2.8 E-commerce** | Modelos de negocio, flujos de compra, gestión de inventario | Papers académicos del sector |

**Usar Claude para:**
```
"Explicame de forma académica el patrón MVC y cómo se implementa
en una arquitectura Node.js + Express, con referencias a autores
reconocidos de ingeniería de software."
```

**Otras herramientas:**
- **Google Scholar** — buscar papers y citas académicas
- **Zotero / Mendeley** — gestionar bibliografía
- **Sci-Hub / ResearchGate** — acceder a papers

---

## 3. Fase 2 — Análisis y Especificación de Requisitos

### Capítulo III: Análisis de Requisitos

#### 3.1 Requisitos Funcionales

Extraer del código fuente. El proyecto tiene **15 controladores** que mapean a módulos funcionales:

| Módulo | Controlador(es) | RF a documentar |
|--------|-----------------|------------------|
| Gestión de productos | AlmacenController, CaracteristicaController | CRUD productos, búsqueda, filtros, características dinámicas, imágenes múltiples |
| Autenticación | ClienteController, UsuarioController, GoogleAuthController | Login dual (cliente/admin), registro, OAuth 2.0, JWT, recuperación contraseña |
| Carrito de compras | CarritoController | Agregar/quitar items, validación stock, validación precios, límites |
| Ventas | VentaController, AdminVentaController | Checkout, confirmación, historial, gestión admin, cancelaciones |
| Ofertas | OfertaController | CRUD ofertas, asignación a productos, validación por fechas, precios personalizados |
| Usuarios del sistema | UsuarioAdminController | CRUD usuarios, roles dinámicos, gestión de clientes |
| Favoritos | FavoritoController | Agregar/quitar favoritos, sincronización |
| Comentarios | ComentarioController | Reseñas con estrellas, imágenes, moderación, respuestas admin |
| Direcciones | DireccionController | CRUD direcciones de envío |
| Marcas | MarcaController | CRUD marcas |
| Imágenes | UploadController | Subida, procesamiento Sharp, optimización |

**Usar Claude para:**
```
"Explorá todos los endpoints del archivo de rutas almacenRoutes.ts
y el AlmacenController.ts, y generame una tabla de requisitos
funcionales con ID, nombre, descripción, prioridad (alta/media/baja)
y estado (implementado/parcial/pendiente)."
```
> Repetir para cada módulo.

#### 3.2 Requisitos No Funcionales

Extraer de middleware, configuración y patrones implementados:

| Categoría | Requisitos a documentar | Dónde buscar en el código |
|-----------|------------------------|--------------------------|
| **Seguridad** | Autenticación JWT, bcrypt, CORS, validación de entrada, rate limiting | `authMiddleware.ts`, `validateCarrito.ts`, `.env` |
| **Rendimiento** | Lazy loading, caché, debounce 300ms, optimización imágenes, compresión | Contextos con caché, `vite.config.ts`, Sharp |
| **Usabilidad** | Responsive desktop-first, tema claro/oscuro, notificaciones toast | CSS Modules, ThemeContext, breakpoints |
| **Accesibilidad** | `prefers-reduced-motion`, semántica HTML | `variables.css`, componentes |
| **Escalabilidad** | Arquitectura modular, ORM, separación de responsabilidades | Estructura general del proyecto |
| **Mantenibilidad** | TypeScript estricto, CSS Modules, convenciones de código | `tsconfig.json`, estructura de archivos |

#### 3.3 Casos de Uso

Documentar los flujos principales con diagramas UML:

| Caso de Uso | Actor(es) | Flujo principal |
|-------------|-----------|-----------------|
| CU-01: Registrarse | Cliente | Formulario → validación → email verificación → cuenta activa |
| CU-02: Iniciar sesión | Cliente/Admin | Credenciales → JWT → redirección según rol |
| CU-03: Buscar productos | Cliente | Búsqueda por texto + filtros (categoría, marca, precio, oferta) |
| CU-04: Agregar al carrito | Cliente autenticado | Seleccionar producto → validar stock → agregar item → actualizar total |
| CU-05: Realizar compra | Cliente autenticado | Carrito → dirección → método envío → método pago → confirmar → factura |
| CU-06: Gestionar productos | Admin | CRUD completo con imágenes, características y ofertas |
| CU-07: Gestionar ventas | Admin | Ver ventas, cambiar estado, cancelar, ver detalle |
| CU-08: Escribir reseña | Cliente autenticado | Seleccionar producto → calificar → escribir → adjuntar imágenes |
| CU-09: Gestionar ofertas | Admin | Crear oferta → asignar productos → definir fechas y descuento |
| CU-10: Gestionar usuarios | Admin | CRUD usuarios sistema, gestión clientes, roles |

**Usar Claude para:**
```
"Generame un diagrama de casos de uso en PlantUML que incluya
los actores Cliente, Administrador y Sistema, con los 10 casos
de uso principales del sistema TecnoCel Web."
```

**Otras herramientas:**
- **PlantUML** (plugin VS Code o servidor online) — diagramas de casos de uso
- **Draw.io / diagrams.net** — diagramas más visuales si se prefiere
- **Lucidchart** — alternativa profesional (versión gratuita limitada)

#### 3.4 Historias de Usuario (opcional, si usaste metodología ágil)

Formato: "Como [actor], quiero [acción] para [beneficio]"

**Usar Claude para:**
```
"Basándote en los casos de uso del sistema, generame historias
de usuario en formato estándar con criterios de aceptación
para cada una."
```

---

## 4. Fase 3 — Diseño del Sistema

### Capítulo IV: Diseño

#### 4.1 Arquitectura General del Sistema

**Diagrama de arquitectura de alto nivel:**
- Frontend (React SPA) ↔ API REST (Express) ↔ MySQL
- Servicios externos: Google OAuth, SMTP (Nodemailer), Almacenamiento de imágenes

**Usar Claude para:**
```
"Generame un diagrama de arquitectura del sistema en Mermaid que
muestre: el navegador del cliente, el servidor frontend (Vite/React),
el servidor backend (Express), la base de datos MySQL, y los servicios
externos (Google OAuth, SMTP). Incluí las tecnologías en cada capa
y los protocolos de comunicación (HTTP, JWT, SQL)."
```

#### 4.2 Arquitectura del Backend (API REST)

**Documentar:**
- Patrón MVC implementado con Express
- Estructura de capas: Routes → Middleware → Controllers → Models → Database
- Sistema de middleware chain (auth → validation → handler)
- Servicios como capa transversal (logger, email, images)

**Diagrama de capas:**
```
"Generame un diagrama de capas del backend en Mermaid mostrando:
1. Capa de Rutas (12 archivos)
2. Capa de Middleware (7 middleware)
3. Capa de Controladores (15 controladores)
4. Capa de Servicios (5 servicios)
5. Capa de Modelos/ORM (32 modelos Sequelize)
6. Base de Datos (MySQL, 26 tablas)
Con flechas mostrando el flujo de una petición HTTP."
```

#### 4.3 Arquitectura del Frontend (SPA)

**Documentar:**
- Component-based architecture con React 18
- Context API como solución de estado global (9 contextos)
- Organización por dominio (10 categorías de componentes)
- Patrón de hooks personalizados (16 hooks)
- Patrón de servicios API (13 servicios)
- Sistema de rutas con protección (ProtectedRoute, PublicOnlyRoute)

**Diagrama de componentes:**
```
"Generame un diagrama en Mermaid que muestre la jerarquía de
Providers en App.tsx (AuthProvider → CarritoProvider → etc.)
y qué componentes consumen cada contexto."
```

#### 4.4 Diseño de Base de Datos

**Diagrama Entidad-Relación completo:**

**Usar Claude para:**
```
"Leé el archivo backend/src/models/relaciones.ts y todos los
modelos en backend/src/models/, y generame un diagrama ER completo
en Mermaid con todas las entidades, atributos clave, y relaciones
con cardinalidad. Organizá las entidades en clusters lógicos:
- Productos (almacen, categoria, marca, producto_imagen, etc.)
- Usuarios (cliente, usuario, rol)
- Ventas (venta, venta_item, carrito_web, carrito_web_items)
- Ofertas (oferta, producto_oferta)
- Otros (comentario, favorito, direccion, etc.)"
```

**Diccionario de datos:**
```
"Generame un diccionario de datos completo con todas las tablas,
campos, tipos de dato, restricciones (PK, FK, NOT NULL, UNIQUE,
DEFAULT) y descripción de cada campo. Formato tabla markdown."
```

**Herramientas para diagramas ER:**
- **MySQL Workbench** — generar diagrama ER directamente desde la BD existente (Reverse Engineering)
- **dbdiagram.io** — diagramas ER online con sintaxis simple
- **DBeaver** — alternativa con generación de diagramas ER

#### 4.5 Diseño de la API REST

**Documentar todos los endpoints:**

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/almacen` | Pública | Listar productos |
| POST | `/api/almacen` | Admin | Crear producto |
| ... | ... | ... | ... |

**Usar Claude para:**
```
"Explorá todos los archivos de rutas en backend/src/routes/ y
generame una tabla completa de endpoints de la API con: método HTTP,
ruta, middleware aplicado, controlador y método que lo maneja,
parámetros esperados, y ejemplo de respuesta."
```

**Herramientas:**
- **Swagger / OpenAPI** — generar documentación interactiva de la API
- **Postman** — exportar colección como documentación
- **REST Client (VS Code)** — ya existe `rest-client.env.json` en el proyecto

#### 4.6 Diagramas UML Adicionales

| Diagrama | Propósito | Herramienta sugerida |
|----------|-----------|---------------------|
| **Diagrama de secuencia** — Flujo de compra | Mostrar interacción entre componentes durante el checkout | Claude + PlantUML/Mermaid |
| **Diagrama de secuencia** — Autenticación JWT | Mostrar flujo login → token → request autenticado | Claude + PlantUML/Mermaid |
| **Diagrama de actividad** — Proceso de checkout | Mostrar decisiones y flujos alternativos | Draw.io |
| **Diagrama de clases** — Modelos del backend | Mostrar relaciones entre clases Sequelize | Claude + Mermaid |
| **Diagrama de estados** — Venta | Estados: pendiente → confirmada → enviada → entregada / cancelada | Claude + Mermaid |
| **Diagrama de despliegue** — Infraestructura | Servidor, BD, CDN, servicios externos | Draw.io |

**Usar Claude para cada diagrama:**
```
"Generame un diagrama de secuencia en Mermaid para el flujo completo
de checkout: desde que el cliente hace clic en 'Confirmar compra'
hasta que recibe la confirmación. Incluí: Frontend (React),
CarritoContext, carritoService, Backend API, CarritoController,
modelos (CarritoWeb, Venta, VentaItem), y emailService."
```

---

## 5. Fase 4 — Implementación y Patrones

### Capítulo V: Implementación

#### 5.1 Patrones de Diseño Aplicados

Documentar cada patrón con: definición teórica, justificación, ejemplo del código real.

| Patrón | Dónde se aplica | Archivo(s) de referencia |
|--------|----------------|-------------------------|
| **MVC** | Toda la arquitectura backend | routes/ → controllers/ → models/ |
| **Singleton** | LoggerService, ImageService | `loggerService.ts`, `imageService.ts` |
| **Observer** | React Context API (pub/sub de estado) | Todos los contextos (`*Context.tsx`) |
| **Repository** | Sequelize como abstracción de BD | Todos los modelos |
| **Factory** | `verificarRol()` retorna middleware configurable | `authMiddleware.ts` |
| **Strategy** | Validación configurable por tipo de carrito | Middleware de validación |
| **Decorator/HOC** | ProtectedRoute envuelve componentes | `ProtectedRoute.tsx` |
| **Module** | CSS Modules, ES Modules, servicios encapsulados | Toda la aplicación |
| **Facade** | Servicios API simplifican llamadas Axios | `carritoService.ts`, etc. |
| **Provider** | Context Providers de React | `App.tsx` con jerarquía de providers |

**Usar Claude para:**
```
"Analizá el código del proyecto y documentame formalmente cada
patrón de diseño implementado. Para cada uno incluí:
1. Nombre del patrón y categoría (creacional/estructural/comportamental)
2. Definición según GoF o Fowler
3. Problema que resuelve en el contexto del proyecto
4. Fragmento de código real que lo demuestra
5. Beneficios obtenidos"
```

#### 5.2 Sistema de Autenticación y Seguridad

Documentar en detalle:
- Flujo JWT dual (cliente 24h / admin 8h)
- Hashing con bcrypt
- OAuth 2.0 con Google
- Middleware chain de autorización
- RBAC con roles dinámicos desde BD
- Validación de entrada con express-validator
- Rate limiting en operaciones sensibles
- CORS configurado

**Usar Claude para:**
```
"Analizá authMiddleware.ts, ClienteController.ts,
UsuarioController.ts y GoogleAuthController.ts, y generame
una documentación técnica del sistema de autenticación con
diagramas de flujo en Mermaid."
```

#### 5.3 Gestión de Estado en Frontend

Documentar:
- Por qué Context API y no Redux/Zustand (justificación técnica)
- Jerarquía de providers
- Estrategias de persistencia (localStorage vs memoria)
- Caché inteligente en favoritos y ofertas
- Debounce en búsqueda (300ms)

#### 5.4 Sistema de Estilos y Diseño UI

Documentar:
- CSS Modules como estrategia de encapsulación
- Sistema de variables CSS (100+ variables)
- Tema claro/oscuro con ThemeContext
- Diseño responsive desktop-first con breakpoints
- Accesibilidad (prefers-reduced-motion)

**Usar Claude para:**
```
"Analizá variables.css, themes.css y el ThemeContext, y documentame
el sistema de diseño completo: paleta de colores, tipografía,
espaciado, breakpoints y estrategia de temas."
```

#### 5.5 Fragmentos de Código Relevantes

Seleccionar código que demuestre buenas prácticas:
- Un controlador completo como ejemplo de MVC
- Un contexto como ejemplo de gestión de estado
- Un hook personalizado como ejemplo de reutilización
- Un componente como ejemplo de estructura React
- Un servicio API como ejemplo de abstracción

> Tip: incluir fragmentos acotados (20-40 líneas) con explicación, no archivos completos.

---

## 6. Fase 5 — Pruebas y Calidad

### Capítulo VI: Pruebas

#### 6.1 Estrategia de Testing

| Tipo de prueba | Herramienta | Estado |
|---------------|-------------|--------|
| Pruebas manuales de API | REST Client / Postman | Implementado |
| Validación de entrada | express-validator | Implementado en middleware |
| Type checking estático | TypeScript strict mode | Implementado |
| Linting | ESLint | Implementado |
| Pruebas de subida de imágenes | Script personalizado | `npm run test:images` |
| Logging de errores | Winston con rotación | Implementado |

#### 6.2 Validación y Manejo de Errores

**Usar Claude para:**
```
"Explorá todos los middleware de validación y el manejo de errores
en los controladores. Documentame: qué se valida, cómo se manejan
los errores, formato de respuestas de error, y logging."
```

#### 6.3 Pruebas Funcionales (manuales)

Documentar escenarios de prueba por módulo:
- Flujo completo de registro → login → compra → confirmación
- Casos límite del carrito (stock agotado, precio cambiado, límites)
- Operaciones admin (CRUD productos, gestión ventas)

**Herramientas:**
- **Postman** — documentar colección de pruebas de API
- **Capturas de pantalla** — evidencia visual de la aplicación funcionando

---

## 7. Fase 6 — Despliegue y Operación

### Capítulo VII: Despliegue

| Tema | Contenido |
|------|-----------|
| Entorno de desarrollo | Node.js, MySQL local, Vite dev server, variables .env |
| Entorno de producción | Build TypeScript, Vite production, BD Aiven (cloud) |
| Variables de entorno | Configuración sensible separada del código |
| Estructura de logs | Winston con rotación, niveles error/warn/info/debug |
| Procesamiento de imágenes | Sharp en backend, optimización automática |
| Seguridad en producción | CORS, HTTPS, JWT, bcrypt, validación |

**Usar Claude para:**
```
"Analizá la configuración de producción del proyecto
(tsconfig.json, vite.config.ts, package.json scripts) y
documentame el proceso de build y despliegue paso a paso."
```

---

## 8. Fase 7 — Resultados y Conclusiones

### Capítulo VIII: Resultados y Conclusiones

#### 8.1 Resultados Alcanzados

| Métrica | Valor |
|---------|-------|
| Completitud del proyecto | ~90% |
| Controladores implementados | 15 |
| Modelos de datos | 32 |
| Componentes React | 79 |
| Páginas funcionales | 14 |
| Hooks personalizados | 16 |
| Contextos globales | 9 |
| Servicios API | 13 |
| Tablas en BD | 26 |
| Endpoints API | 60+ |
| Módulos CSS | 70 |
| Archivos de documentación | 44 |

#### 8.2 Objetivos Cumplidos

Mapear cada objetivo específico del Cap. I con la funcionalidad implementada.

#### 8.3 Conclusiones

- Viabilidad de la arquitectura full-stack moderna para e-commerce
- Beneficios de TypeScript en proyectos de escala media-grande
- Context API como alternativa viable a Redux para esta escala
- Importancia de la separación de responsabilidades
- Valor del ORM para abstracción de BD

#### 8.4 Trabajo Futuro

- Integración de pasarela de pagos (Stripe/MercadoPago)
- PWA (Progressive Web App)
- Sistema de envíos y logística
- Testing automatizado (Jest, Cypress)
- CI/CD pipeline
- Motor de recomendaciones

#### 8.5 Lecciones Aprendidas

Reflexión personal sobre el proceso de desarrollo.

---

## 9. Herramientas Recomendadas

### Para redacción y formato

| Herramienta | Uso | Recomendación |
|-------------|-----|---------------|
| **Microsoft Word** | Documento final con formato académico | Si la universidad requiere formato específico |
| **LaTeX (Overleaf)** | Documento profesional con formato automático | Si se permite, produce resultado más profesional |
| **Google Docs** | Redacción colaborativa | Para borradores y revisiones |
| **Notion** | Organizar secciones y borradores | Para planificación |

### Para diagramas

| Herramienta | Tipo de diagrama | Cómo usarla |
|-------------|-----------------|-------------|
| **Mermaid** (Mermaid Live Editor) | Todos los UML básicos | Claude genera el código, renderizar en editor online |
| **PlantUML** (plugin VS Code) | UML más detallado y formal | Claude genera el código, plugin lo renderiza |
| **Draw.io / diagrams.net** | Diagramas libres, arquitectura | Edición visual drag-and-drop, exporta a PNG/SVG |
| **MySQL Workbench** | Diagrama ER desde BD real | Reverse engineering de tu BD existente |
| **dbdiagram.io** | Diagrama ER con sintaxis simple | Alternativa rápida para ER |

### Para documentación técnica

| Herramienta | Uso |
|-------------|-----|
| **Swagger / OpenAPI** | Documentación interactiva de la API REST |
| **Postman** | Colección de endpoints con ejemplos |
| **Compodoc / Storybook** | Documentación de componentes (opcional) |

### Para bibliografía

| Herramienta | Uso |
|-------------|-----|
| **Zotero** (gratuito) | Gestión de referencias bibliográficas, genera citas automáticas |
| **Mendeley** | Alternativa a Zotero |
| **Google Scholar** | Búsqueda de papers y artículos académicos |

### Claude Code como asistente

| Tarea | Prompt sugerido |
|-------|-----------------|
| Extraer requisitos del código | "Explorá [controlador] y listame todos los requisitos funcionales que implementa" |
| Generar diagramas | "Generame un diagrama [tipo] en Mermaid/PlantUML de [componente]" |
| Documentar patrones | "Identificá y documentá los patrones de diseño en [archivo/módulo]" |
| Crear tablas técnicas | "Generame una tabla con todos los [endpoints/modelos/componentes] del sistema" |
| Explicar código | "Explicame el flujo de [funcionalidad] para incluir en la documentación técnica" |
| Redacción académica | "Reescribí este párrafo en tono académico formal para una tesis" |

---

## 10. Cronograma Sugerido

| Semana | Fase | Actividades principales | Entregable |
|--------|------|------------------------|------------|
| 1 | Fundamentos | Planteamiento del problema, justificación, objetivos | Cap. I borrador |
| 2 | Marco Teórico | Investigación bibliográfica, redacción marco teórico | Cap. II borrador |
| 3 | Requisitos | Extracción de RF/RNF del código, casos de uso | Cap. III borrador |
| 4 | Diseño — BD | Diagrama ER, diccionario de datos | Diagramas BD |
| 5 | Diseño — Arquitectura | Diagramas de arquitectura, capas, componentes | Diagramas arquitectura |
| 6 | Diseño — UML | Diagramas de secuencia, actividad, estados, clases | Diagramas UML |
| 7 | Implementación | Documentar patrones, seguridad, estado, estilos | Cap. V borrador |
| 8 | Pruebas + Despliegue | Documentar estrategia de testing y despliegue | Cap. VI y VII borrador |
| 9 | Resultados | Métricas, conclusiones, trabajo futuro | Cap. VIII borrador |
| 10 | Revisión | Revisión completa, correcciones, formato final | Documento final |
| 11 | Anexos | Manuales, diccionario de datos, código relevante | Anexos completos |
| 12 | Entrega | Revisión final, impresión/entrega | Tesis completa |

---

## 11. Métricas del Proyecto

### Inventario técnico actual (para incluir en resultados)

```
BACKEND
├── Controladores:     15 archivos
├── Modelos Sequelize:  32 archivos (28 entidades + 4 especiales)
├── Rutas:             12 archivos
├── Middleware:          7 archivos
├── Servicios:          5 archivos
├── Tipos TypeScript:   3 archivos
├── Dependencias:      48 (28 producción + 20 desarrollo)
└── Tablas BD:         26

FRONTEND
├── Componentes React: 79 (en 10 dominios)
├── Páginas:           14
├── Hooks:             16
├── Contextos:          9
├── Servicios API:     13
├── Tipos TypeScript:   9 archivos
├── Módulos CSS:       70
├── Estilos globales:   3
└── Dependencias:      35 (17 producción + 18 desarrollo)

DOCUMENTACIÓN EXISTENTE
├── Archivos .md:      44
├── API docs:          16
├── Frontend docs:      8
├── BD docs:            4
└── Guías:              5

BASE DE DATOS
├── Tablas:            26
├── Backups:            6
├── Migraciones:        5
└── Scripts seed:       6
```

---

## Notas Finales

- **Priorizar calidad sobre cantidad**: es mejor documentar bien 5 patrones que listar 15 superficialmente.
- **Capturas de pantalla**: incluir screenshots de la aplicación funcionando en cada sección relevante.
- **Código real, no genérico**: siempre mostrar fragmentos del código propio, no ejemplos inventados.
- **Coherencia**: mantener el mismo formato de tablas, diagramas y referencias en todo el documento.
- **Revisión con el tutor**: validar la estructura propuesta antes de avanzar con la redacción completa.
- **Cada diagrama debe tener**: título, descripción, fuente (elaboración propia), y explicación en el texto.
