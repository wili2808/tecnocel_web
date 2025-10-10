# Estructura del Frontend

> Guía de las carpetas y responsabilidades del frontend (React + Vite).

---

## Árbol principal (`frontend/src`)

```
components/          # Componentes por dominio (cart, common, layout, product, user)
contexts/            # Contextos globales (Auth, Carrito, Favoritos, Theme, Search)
hooks/               # Hooks personalizados (auth, carrito, ofertas, productos, etc.)
pages/               # Páginas de alto nivel / rutas
services/            # Acceso a API (axios) y capas de datos
styles/              # Sistema de diseño (variables, temas, global)
types/               # Tipos y contratos TS
utils/               # Utilidades compartidas
```

## Patrones

- Un componente por archivo; CSS Modules acompañando (e.g., `Foo.tsx` + `Foo.module.css`).
- Imports ordenados: React → terceros → locales.
- Tipado estricto de props y retornos.

## Navegación y rutas

- Ver `docs/frontend/ROUTING.md`.

## Estado global

- Ver `docs/frontend/CONTEXTS.md` y `docs/frontend/STATE_MANAGEMENT.md`.

---

Última actualización: 9 de Octubre, 2025
