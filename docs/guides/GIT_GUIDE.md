# 🧭 GIT_GUIDE.md — Guía profesional de commits y flujo de trabajo

## 📘 1. Convenciones de mensajes de commit

Usa el formato **Conventional Commits**, que ayuda a mantener un historial claro y automatizable.

### 🔤 Estructura general
```
<tipo>(<área>): <resumen breve>

<detalles opcionales>

<footer opcional>
```

### 💡 Tipos más comunes
| Tipo | Uso | Ejemplo |
|------|-----|----------|
| **feat** | Nueva funcionalidad | `feat(auth): agregar login con JWT` |
| **fix** | Corrección de bug | `fix(cart): corregir cálculo de total con descuento` |
| **docs** | Cambios en documentación | `docs(readme): agregar sección de instalación` |
| **style** | Formato o estilo de código (sin lógica) | `style(app): aplicar prettier` |
| **refactor** | Reescritura sin cambiar comportamiento | `refactor(api): simplificar validaciones` |
| **perf** | Mejoras de rendimiento | `perf(db): optimizar consulta de productos` |
| **test** | Agregar o modificar tests | `test(product): agregar test unitario para precio` |
| **chore** | Tareas de mantenimiento | `chore(deps): actualizar dependencias` |
| **ci** | Cambios en pipelines o integración continua | `ci(actions): agregar workflow de despliegue` |

### 🧠 Reglas básicas
- Usa **verbos en presente** y modo imperativo: "agregar", "corregir", no "agregado" o "corrigiendo".  
- Máximo 72 caracteres en el título.  
- Deja una línea en blanco antes del cuerpo.  
- En el cuerpo explica **qué** y **por qué**, no solo **cómo**.

#### 📌 Ejemplo completo:
```
feat(cart): permitir aplicar cupones de descuento

Se agregó una función que valida y aplica cupones en el carrito.
Esto mejora la experiencia de usuario y facilita futuras promociones.

Closes #24
```

---

## 🧩 2. Flujo de trabajo profesional (Git Flow adaptado)

### 🌱 Ramas principales
| Rama | Propósito |
|-------|------------|
| **main** | Código en producción (estable) |
| **develop** | Rama de integración para nuevas features |

### 🌿 Ramas auxiliares
| Rama | Prefijo | Uso |
|-------|----------|-----|
| **feature/** | `feature/` | Nueva funcionalidad |
| **fix/** | `fix/` | Corrección de bug |
| **hotfix/** | `hotfix/` | Urgencias en producción |
| **release/** | `release/` | Preparación de nueva versión |

### 🔄 Flujo típico
1. Crear rama desde `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/login
   ```
2. Hacer commits pequeños y significativos.
3. Mergear con `develop` mediante *Pull Request* o *merge squash*.
4. Cuando `develop` esté estable, mergear a `main`.

---

## 🕓 3. Cuándo hacer commits

Haz commits:
- Cuando terminas una **unidad lógica de trabajo** (una función o componente completo).  
- Cuando cambias de contexto (por ejemplo, pasas de diseñar la UI a configurar la API).  
- Nunca mezcles distintos tipos de cambio (ej. diseño + lógica + docs juntos).  

**Evita:**
- Commits enormes tipo “update project” o “fix all”.
- Commits por cada línea o prueba mínima.

---

## 🧱 4. Planificación de funcionalidades

### 📋 Buen enfoque
1. Divide el proyecto en **módulos o features** (por ejemplo: productos, carrito, clientes, ventas).
2. Crea una *tarea o issue* por cada subfuncionalidad.
3. Desarrolla una a la vez.
4. Nombra tu rama y tus commits según esa tarea.

**Ejemplo:**
```
feature/product-crud
│
├── feat(product): crear componente ProductForm
├── feat(product): conectar formulario con API
└── fix(product): validar precio mínimo
```

---

## 📜 5. Ejemplo de flujo diario profesional

```bash
# 1. Sincronizás tu rama principal
$ git checkout develop
$ git pull

# 2. Creás una rama nueva para tu tarea
$ git checkout -b feature/user-auth

# 3. Trabajás y hacés commits claros
$ git add .
$ git commit -m "feat(auth): agregar validación de token"

# 4. Subís tu rama
$ git push origin feature/user-auth

# 5. Hacés PR → merge a develop

# 6. Cuando develop está listo para deploy
$ git checkout main
$ git merge develop
$ git tag -a v1.0.0 -m "Versión inicial estable"
$ git push origin main --tags
```

---

## 💬 6. Recomendaciones finales
- Commits pequeños, claros y con propósito.  
- Una rama = una funcionalidad o corrección.  
- Siempre actualizar `develop` antes de crear nuevas ramas.  
- Documentar decisiones relevantes en el cuerpo del commit.  
- Usar etiquetas (`v1.0.0`, `v1.1.0`, etc.) para releases estables.  

---

✨ **Bonus:** herramientas que te ayudan a mantener disciplina
- **Commitizen** → guía para escribir commits estándar.
- **Husky + lint-staged** → ejecutan validaciones antes de cada commit.
- **Conventional Changelog** → genera changelogs automáticamente desde los commits.

---

> 💬 *Esta guía puede adaptarse para proyectos personales, académicos o equipos profesionales bajo Scrum o Kanban.*
