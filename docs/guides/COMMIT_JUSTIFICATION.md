# 📄 COMMIT_JUSTIFICATION.md — Justificación profesional de commits y ramas

## 🎯 Objetivo
Esta guía sirve para **documentar y justificar los commits, ramas y decisiones de desarrollo** dentro de un proyecto técnico o académico. Su propósito es demostrar una metodología profesional y reflexiva sobre el uso de control de versiones (Git) como herramienta de gestión del ciclo de vida del software.

---

## 🧩 1. Estructura de justificación por commit
Cada commit puede documentarse (por ejemplo, en la bitácora del proyecto o memoria técnica) con la siguiente estructura:

| Campo | Descripción | Ejemplo |
|--------|--------------|----------|
| **ID del commit** | Hash o identificador corto (`git log --oneline`) | `a1b2c3d` |
| **Tipo y área** | Según convención (feat, fix, refactor, etc.) | `feat(product)` |
| **Descripción breve** | Resumen del cambio | `Agregar componente ProductList con render dinámico` |
| **Motivo / Justificación** | Por qué se realizó el cambio | `Se implementa para mostrar los productos desde la API y permitir futuras filtraciones.` |
| **Impacto o resultado esperado** | Qué mejora o corrige | `Permite que los usuarios visualicen productos de manera dinámica.` |
| **Relación con tarea o requerimiento** | ID de issue o historia | `REQ-12: Listado de productos` |

---

## 🧭 2. Estructura de justificación por rama
Cada **rama** representa una unidad funcional o etapa del desarrollo. Para justificar su existencia:

| Campo | Descripción | Ejemplo |
|--------|--------------|----------|
| **Nombre de la rama** | Prefijo + descripción | `feature/user-auth` |
| **Objetivo principal** | Qué funcionalidad o corrección aborda | `Desarrollar autenticación con JWT y roles de usuario.` |
| **Motivación** | Razón por la cual se crea como rama independiente | `Permite trabajar de forma aislada sin afectar el código estable.` |
| **Criterios de finalización** | Qué condiciones indican que la tarea está completa | `Login funcional, validación de token, manejo de errores implementado.` |
| **Resultado esperado** | Qué agrega o mejora al proyecto | `Seguridad y autenticación completa del usuario.` |

---

## 🕓 3. Ejemplo de registro en bitácora técnica
```
📅 Fecha: 2025-10-08
👩‍💻 Desarrolladora: Prisha

🔹 Rama: feature/product-crud
🔹 Objetivo: Crear sistema de gestión de productos.

🧱 Commits realizados:
1. feat(product): crear formulario de producto
   → Permite ingresar nuevos productos en la base de datos.

2. fix(product): corregir validación de precio
   → Se detectó que los valores negativos pasaban la validación.

3. refactor(product): simplificar lógica de render
   → Se mejora la legibilidad del componente y su rendimiento.

📈 Resultado:
La sección de productos quedó completamente funcional e integrada con la API. Los cambios están justificados en base a la modularización y mantenibilidad del código.
```

---

## 🧠 4. Recomendaciones para justificar de forma profesional
- Relacionar cada commit con un **requerimiento funcional o técnico**.
- Explicar los **motivos técnicos o de diseño** detrás del cambio.
- Resaltar si el cambio resuelve un bug, mejora el rendimiento o la usabilidad.
- Evitar frases genéricas como “actualización menor” o “ajustes varios”.
- Usar lenguaje técnico claro y conciso.

---

## 🧾 5. En documentación de tesis o informes
Puedes incluir una **sección específica** llamada “Gestión del control de versiones” o “Evidencia de proceso de desarrollo”, donde:

- Expliques el **flujo Git** utilizado (rama principal, develop, features, etc.).
- Incluyas un **resumen de commits representativos**, con su justificación y su impacto.
- Adjuntes capturas o fragmentos del historial (`git log --oneline --graph`).
- Describas cómo el uso de Git contribuyó a la **organización, trazabilidad y control del proyecto**.

---

## ✨ Ejemplo breve para documento de tesis
> Durante el desarrollo del proyecto se aplicó un flujo de trabajo basado en Git Flow.  
> Cada funcionalidad se desarrolló en una rama específica, integrándose posteriormente en la rama *develop*.  
> Los commits se realizaron siguiendo la convención *Conventional Commits*, lo que permitió mantener un historial ordenado y facilitar la trazabilidad del código.  
> A continuación se presentan algunos ejemplos representativos de commits y sus respectivas justificaciones.

---

💬 *Esta plantilla puede usarse como anexo o bitácora técnica dentro de la documentación final del proyecto o tesis.*
