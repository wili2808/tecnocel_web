# 📜 Scripts del Backend

Scripts de utilidad para desarrollo, testing y mantenimiento de la base de datos.

## 📁 Estructura

```
scripts/
├── config/                           # Configuración de scripts
│   ├── database.js                   # Configuración de DB
│   └── logger.js                     # Logger para scripts
├── ejemplos-api-productos.js         # Ejemplos de uso de API de productos
├── test-product-creation.js          # Script de prueba para creación de productos
└── implement-database-improvements.js # Script de mejoras de BD (referencia)
```

## 🚀 Scripts Disponibles

### ejemplos-api-productos.js

**Descripción**: Ejemplos de uso de la API de productos con diferentes casos de uso.

**Uso**:
```bash
node scripts/ejemplos-api-productos.js
```

**Características**:
- Ejemplos de GET, POST, PUT, DELETE
- Casos de uso comunes
- Validación de responses

---

### test-product-creation.js

**Descripción**: Script de prueba para creación de productos en la base de datos.

**Uso**:
```bash
node scripts/test-product-creation.js
```

**Características**:
- Crea productos de prueba
- Valida la estructura de datos
- Verifica relaciones

---

### implement-database-improvements.js

**Descripción**: Script de referencia con mejoras implementadas en la base de datos.

**Nota**: Este script YA FUE EJECUTADO. Se mantiene como referencia histórica.

**Características**:
- Creación de tablas de marcas, características, ofertas
- Migración de datos existentes
- Índices y optimizaciones

---

## ⚙️ Configuración

Los scripts utilizan la configuración en `config/`:

- **database.js**: Conexión a MySQL
- **logger.js**: Sistema de logging

## 📝 Notas

- Todos los scripts requieren las variables de entorno configuradas en `.env`
- Asegúrate de ejecutar los scripts desde la raíz del backend
- Los scripts de migración se mantienen como referencia histórica
