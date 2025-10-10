# Migraciones de Base de Datos

> Guía para gestionar migraciones del esquema de `db_tecnocel_v4`.

---

## Estructura

- Carpeta de migraciones SQL: `database/migrations/`
- Backups: `database/backups/`

## Migraciones existentes (SQL)

- `create_comentarios_sistema.sql`
- `update_featured_products.sql`

## Flujo recomendado

1. Crear archivo SQL descriptivo en `database/migrations/`.
2. Probar localmente contra una base de datos de desarrollo.
3. Generar backup previo (`database/backups/`).
4. Aplicar migración en staging/producción siguiendo orden cronológico.

## Convenciones

- Nombres en snake_case y verbo al inicio (e.g., `add_index_productos_nombre.sql`).
- Idempotencia cuando sea posible (usar `IF NOT EXISTS`).

## Rollback

- Incluir el script de rollback cuando aplique.
- Mantener registro de migraciones aplicadas (tabla `migrations` si se usa herramienta ORM).

---

Última actualización: 9 de Octubre, 2025
