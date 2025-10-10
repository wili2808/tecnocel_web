[Documentación](../README.md#estructura-de-documentación) | [Inicio](../../README.md)

---

# Documentación de Base de Datos

> Documentación completa del esquema de base de datos MariaDB/MySQL de TecnoCel Web.

**Última actualización**: 7 de Octubre, 2025
**Versión de la BD**: 4.0
**Base de datos**: `db_tecnocel_v4`
**Motor**: MariaDB 10.4.27 / MySQL 8.0+
**Total de tablas**: 26

---

## Tabla de Contenidos

- [Documentos Disponibles](#documentos-disponibles)
- [Documentos Planificados](#documentos-planificados)
- [Información de la Base de Datos](#información-de-la-base-de-datos)
- [Backups](#backups)
- [Migraciones](#migraciones)
- [Configuración Inicial](#configuración-inicial)
- [Herramientas Útiles](#herramientas-útiles)
- [Estadísticas](#estadísticas)
- [Relaciones Principales](#relaciones-principales)
- [Recursos Adicionales](#recursos-adicionales)
- [Notas Importantes](#notas-importantes)

---

## Documentos Disponibles

### SCHEMA.md

**[SCHEMA.md](SCHEMA.md)** - Documentación completa del esquema de la Base de datos

**Contenido**:
- 26 tablas documentadas con columnas, tipos de datos y constraints
- Índices completos (PRIMARY KEY, FOREIGN KEY, UNIQUE)
- Relaciones detalladas (N:1, 1:N, N:M)
- Categorización por sistema
- Ejemplos de datos y validaciones
- Lógica de negocio documentada

**Tablas principales**:
- `tb_almacen` - Productos del catálogo
- `tb_clientes` - Clientes con Google OAuth
- `tb_carritosweb` - Carritos de compra web
- `tb_comentarios_productos` - Reseñas y calificaciones
- `tb_ofertas` - Ofertas y descuentos
- `tb_usuarios` - Administradores del sistema

---

### DIAGRAMS.md

**[DIAGRAMS.md](DIAGRAMS.md)** - 5 diagramas Entity-Relationship en formato Mermaid

**Contenido**:
1. **Diagrama ER General** - Vista completa de las 26 tablas y todas sus relaciones
2. **Sistema de Productos** - Catálogo, imágenes, características y ofertas (8 tablas)
3. **Sistema de Clientes y Carrito Web** - Clientes, carritos, favoritos y comentarios (8 tablas)
4. **Sistema de Compras y Ventas** - Proveedores, ventas, presupuestos y devoluciones (12 tablas)
5. **Sistema de Usuarios Admin** - Administradores, roles y permisos (5 tablas)

**Características**:
- ✅ Formato Mermaid (visualización automática en GitHub/VSCode)
- ✅ Se versiona con Git (código, no imágenes binarias)
- ✅ Incluye columnas principales y tipos de datos
- ✅ Cardinalidad de relaciones claramente marcada
- ✅ Convenciones y leyenda explicada
- ✅ Guía de uso para desarrollo

**Cómo ver los diagramas**:
- En VSCode: Abrir DIAGRAMS.md → Click derecho → "Open Preview"
- En GitHub: Los diagramas se renderizan automáticamente
- Con extensión Markdown Preview Enhanced: Renderizado avanzado

---

### IMPROVEMENTS_PLAN.md

**[IMPROVEMENTS_PLAN.md](IMPROVEMENTS_PLAN.md)** - Historial de mejoras y optimizaciones

**Contenido**:
- Nuevas tablas agregadas (carritos web, comentarios, ofertas)
- Optimizaciones realizadas
- Índices agregados para mejorar rendimiento
- Mejoras de rendimiento
- Migraciones ejecutadas

---

## Documentos Planificados

### MODELS.md

_(próximamente)_ - Documentación de modelos Sequelize y sus relaciones.

**Contenido planificado**:
- Definición de cada modelo (26 modelos)
- Tipos de datos y validaciones
- Asociaciones entre modelos (hasMany, belongsTo, etc.)
- Métodos personalizados (getters, setters)
- Hooks (beforeCreate, afterUpdate, etc.)
- Scopes y queries predefinidos

---

### QUERIES.md

_(próximamente)_ - Queries SQL comunes y optimizaciones.

**Contenido planificado**:
- Queries más utilizadas en el sistema
- Joins comunes entre tablas
- Optimizaciones con índices
- Queries de reporting y estadísticas
- Análisis de performance con EXPLAIN
- Ejemplos de queries complejas

---

### MIGRATIONS.md

_(próximamente)_ - Guía de migraciones de la base de datos.

**Contenido planificado**:
- Historial de migraciones ejecutadas
- Cómo crear nuevas migraciones
- Cómo ejecutar migraciones
- Rollback de migraciones
- Scripts de migración disponibles
- Buenas prácticas

---

### SEEDS.md

_(próximamente)_ - Datos de prueba y seeding.

**Contenido planificado**:
- Scripts de seeding disponibles
- Datos de prueba para desarrollo
- Cómo ejecutar seeds
- Datos de ejemplo por tabla
- Seeders para testing

---

## Información de la Base de Datos

| Característica | Valor |
|----------------|-------|
| **Motor** | MariaDB 10.4.27 / MySQL 8.0+ |
| **ORM** | Sequelize |
| **Charset** | utf8mb4 / utf8 |
| **Collation** | utf8mb4_general_ci / utf8_spanish_ci |
| **Nombre DB** | `db_tecnocel_v4` |
| **Total de tablas** | 26 |
| **Total de relaciones** | 40+ Foreign Keys |

---

## Backups

### Ubicación de Backups

Los backups de la base de datos se encuentran en:
```
database/backups/
```

⚠️ **Nota importante**: Los backups NO se commitean a Git por seguridad y peso.

### Backups Disponibles (local)

| Archivo | Descripción |
|---------|-------------|
| `db_tecnocel_v4.sql` | ✅ Versión actual (v4) con todas las tablas |
| `db_tecnocel_v3.sql` | Versión anterior (v3) - legacy |
| `db_tecnocel_v4_YYYYMMDD.sql` | Backups adicionales por fecha |

### Crear Backup Manual

```bash
# Backup completo con datos
mysqldump -u root -p db_tecnocel_v4 > database/backups/db_tecnocel_v4_$(date +%Y%m%d).sql

# Backup solo estructura (sin datos)
mysqldump -u root -p --no-data db_tecnocel_v4 > database/backups/schema_only.sql

# Backup de una sola tabla
mysqldump -u root -p db_tecnocel_v4 tb_almacen > backup_almacen.sql
```

### Restaurar Backup

```bash
# Restaurar backup completo
mysql -u root -p db_tecnocel_v4 < database/backups/db_tecnocel_v4.sql

# Restaurar una sola tabla
mysql -u root -p db_tecnocel_v4 < backup_almacen.sql
```

---

## Migraciones

### Ubicación de Migraciones

Las migraciones SQL se encuentran en:
```
database/migrations/
```

### Migraciones Disponibles

| Archivo | Descripción |
|---------|-------------|
| `create_comentarios_sistema.sql` | Sistema de comentarios y reseñas |
| `update_featured_products.sql` | Actualización de productos destacados |
| `add_google_oauth_fields.sql` | Campos para Google OAuth 2.0 |
| `create_ofertas_sistema.sql` | Sistema de ofertas y descuentos |

### Ejecutar Migraciones

```bash
# Ejecutar una migración específica
mysql -u root -p db_tecnocel_v4 < database/migrations/nombre_migracion.sql

# Ver historial de migraciones (si tienes tabla de control)
SELECT * FROM migrations ORDER BY executed_at DESC;
```

---

## Configuración Inicial

### 1. Crear la Base de Datos

```sql
CREATE DATABASE db_tecnocel_v4
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
```

### 2. Importar el Esquema

```bash
mysql -u root -p db_tecnocel_v4 < database/backups/db_tecnocel_v4.sql
```

### 3. Configurar Variables de Entorno

Editar `backend/.env`:

```env
# Base de datos
DB_NAME=db_tecnocel_v4
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306

# ORM Sequelize
DB_DIALECT=mysql
DB_TIMEZONE=America/La_Paz

# Logging
DB_LOGGING=false  # true para debug
```

### 4. Verificar Conexión

```bash
cd backend
npm run test:db  # Script de test de conexión (si existe)
```

O usando MySQL CLI:

```bash
mysql -u root -p db_tecnocel_v4 -e "SHOW TABLES;"
```

---

## Herramientas Útiles

### Gestión

| Herramienta | Uso |
|-------------|-----|
| **phpMyAdmin** | Interfaz web para gestión visual |
| **MySQL Workbench** | Cliente desktop oficial de MySQL |
| **DBeaver** | Cliente universal multiplataforma |
| **Sequel Pro / Sequel Ace** | Cliente para macOS |
| **HeidiSQL** | Cliente para Windows |

### Visualización de Diagramas

| Herramienta | Uso |
|-------------|-----|
| **VSCode + Extensión Mermaid** | Ver diagramas en DIAGRAMS.md |
| **GitHub** | Visualización automática de Mermaid |
| **MySQL Workbench** | Reverse Engineering para ER diagrams |
| **dbdocs.io** | Generación automática de documentación |

### Comandos Útiles

```bash
# Ver tamaño de la base de datos
mysql -u root -p -e "SELECT table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
    FROM information_schema.tables
    WHERE table_schema = 'db_tecnocel_v4';"

# Ver tablas y número de registros
mysql -u root -p db_tecnocel_v4 -e "SELECT table_name, table_rows
    FROM information_schema.tables
    WHERE table_schema = 'db_tecnocel_v4'
    ORDER BY table_rows DESC;"

# Ver foreign keys de una tabla
mysql -u root -p db_tecnocel_v4 -e "SHOW CREATE TABLE tb_almacen\G"
```

---

## Estadísticas

### Tablas por Sistema

| Sistema | Tablas | % |
|---------|:------:|:-:|
| Productos y Catálogo | 6 | 23% |
| Compras y Transacciones | 6 | 23% |
| Clientes y Carrito | 6 | 23% |
| Ofertas y Favoritos | 3 | 12% |
| Comentarios | 2 | 8% |
| Usuarios Admin | 2 | 8% |
| Legacy (POS) | 1 | 4% |
| **TOTAL** | **26** | **100%** |

### Tipos de Tablas

| Tipo | Cantidad | Descripción |
|------|:--------:|-------------|
| **Principales** | 8 | Entidades core del negocio |
| **Relacionales** | 10 | Tablas N:M intermedias |
| **Catálogos** | 6 | Marcas, categorías, roles, etc. |
| **Transaccionales** | 2 | Ventas, compras |

---

## Relaciones Principales

### Tabla Central: tb_almacen

**Relaciones salientes (N:1)**:
- → `tb_categorias` (categoría del producto)
- → `tb_marcas` (marca del producto)
- → `tb_usuarios` (usuario que registró)

**Relaciones entrantes (1:N)**:
- ← `tb_producto_imagenes` (imágenes del producto)
- ← `tb_producto_caracteristicas` (especificaciones)
- ← `tb_productos_ofertas` (ofertas aplicadas)
- ← `tb_carritoweb_items` (en carritos)
- ← `tb_comentarios_productos` (comentarios)
- ← `tb_favoritos` (favoritos)
- ← `tb_detalle_compras` (compras)
- ← `tb_detalle_ventas` (ventas)

### Tabla Central: tb_clientes

**Relaciones entrantes (1:N)**:
- ← `tb_carritosweb` (carritos del cliente)
- ← `tb_direcciones` (direcciones de envío)
- ← `tb_favoritos` (productos favoritos)
- ← `tb_comentarios_productos` (comentarios escritos)
- ← `tb_ventas` (compras realizadas)
- ← `tb_presupuestos` (cotizaciones solicitadas)

---

## Recursos Adicionales

### Código Fuente

- [Modelos Sequelize](../../backend/src/models/) - Definición de modelos ORM
- [Scripts de BD](../../backend/scripts/) - Scripts de utilidad
- [Controladores](../../backend/src/controllers/) - Lógica de negocio

### Documentación Relacionada

- [Documentación de API](../api/README.md) - Endpoints que usan estas tablas
- [ENDPOINTS.md](../api/ENDPOINTS.md) - Documentación completa de endpoints
- [Documentación del Proyecto](../project/README.md)

### Enlaces Externos

- [MariaDB Documentation](https://mariadb.com/kb/en/documentation/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Sequelize ORM Documentation](https://sequelize.org/docs/v6/)

---

## Notas Importantes

### Diferencias entre tb_clientes y tb_usuarios

| Tabla | Propósito | Autenticación |
|-------|-----------|---------------|
| `tb_clientes` | Clientes de la tienda web | Email/Password + Google OAuth |
| `tb_usuarios` | Administradores del sistema | Password + Token |

### Sistema de Carritos

| Tabla | Propósito |
|-------|-----------|
| `tb_carritosweb` | Carritos de la tienda web (nueva implementación) |
| `tb_carrito` | Carrito del punto de venta (legacy, deprecated) |

### Estados Importantes

**Carrito Web** (`tb_carritosweb.estado`):
- `activo` - Carrito en uso
- `completado` - Compra finalizada
- `abandonado` - Para remarketing

**Comentarios** (`tb_comentarios_productos.estado`):
- `activo` - Visible públicamente
- `oculto` - No visible (moderación)
- `eliminado` - Soft delete

**Presupuestos** (`tb_presupuestos.estado`):
- `pendiente` - Esperando aprobación
- `aprobado` - Aprobado
- `rechazado` - Rechazado

---

[Volver arriba](#tabla-de-contenidos) | [Documentación](../README.md) | [Inicio](../../README.md)
