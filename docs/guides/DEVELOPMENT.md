**[Documentación](../README.md#estructura-de-documentación)** | **[Inicio](../README.md)**

---

# Guía de Desarrollo

> Flujo de trabajo recomendado para desarrollo local, depuración y buenas prácticas en el proyecto TecnoCel Web.

---

## Tabla de Contenidos

- [Prerrequisitos](#prerrequisitos)
- [Configuración del Entorno](#configuración-del-entorno)
- [Ejecutar en Desarrollo](#ejecutar-en-desarrollo)
- [Convenciones de Código](#convenciones-de-código)
- [Depuración](#depuración)
- [Logs y Monitoreo Local](#logs-y-monitoreo-local)
- [Pruebas Manuales de API](#pruebas-manuales-de-api)
- [Flujo de Git](#flujo-de-git)
- [Checklist antes de Commit](#checklist-antes-de-commit)

---

## Prerrequisitos

- Node.js 18+
- PNPM o NPM
- MySQL/MariaDB en local

---

## Configuración del Entorno

1. Backend: copiar `.env` siguiendo `docs/deployment/ENVIRONMENT.md`.
2. Frontend: copiar `frontend/.env.example` a `.env` y ajustar `VITE_API_BASE_URL`.
3. Base de datos: crear esquema y aplicar migraciones iniciales si corresponde.

---

## Ejecutar en Desarrollo

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## Convenciones de Código

- TypeScript estricto en backend y frontend.
- Mantener nombres descriptivos y evitar abreviaturas.
- Seguir la guía de estandarización de documentación en `docs/guides/GUIA_ESTANDARIZACION_DOCUMENTACION.md`.

---

## Depuración

- Backend: usar `loggerService` (niveles `debug`, `info`, `warn`, `error`).
- Agregar `res.locals.skipHttpLog = true` cuando una ruta ya generó respuesta/log para evitar ruido duplicado.
- Breakpoints con VS Code/Node (inspección en `npm run dev`).

---

## Logs y Monitoreo Local

Archivos en `backend/dist/logs/` (según configuración del logger):

- `api.log`, `error.log`, `combined*.log`.

Recomendación:

```bash
tail -f backend/dist/logs/combined.log
```

---

## Pruebas Manuales de API

- Usar curl o Postman. Ejemplos en `backend/scripts/ejemplos-api-productos.js` y `backend/scripts/test-product-creation.js`.
- Autenticación: enviar `Authorization: Bearer <JWT>` para rutas protegidas.
- Referencias:
  - `docs/api/ENDPOINTS.md`
  - `docs/api/guides/AUTHENTICATION.md`
  - `docs/api/reference/IMAGES_SERVICE.md`

---

## Flujo de Git

- Rama principal protegida.
- Trabajar en ramas feature: `feat/nombre-corto`.
- Commits semánticos siguiendo `docs/guides/COMMIT_JUSTIFICATION.md`.

---

## Checklist antes de Commit

- [ ] Compila y corre en local
- [ ] Sin errores de lint
- [ ] Documentación actualizada si aplica
- [ ] Ejecutado `node scripts/fix-markdown-docs.js` para estandarización
- [ ] Enlaces internos probados en docs

---

**Última actualización**: 9 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](README.md)** | **[Inicio](../README.md)**
