# 🔄 Configuración de Múltiples Entornos

Este proyecto soporta múltiples configuraciones de base de datos para facilitar el desarrollo local y en la nube.

## 📁 Archivos de Entorno

- **`.env`** - Archivo activo (se copia automáticamente según el comando usado)
- **`.env.local`** - Configuración para XAMPP MySQL local
- **`.env.aiven`** - Configuración para Aiven MySQL cloud

⚠️ **IMPORTANTE**: Los archivos `.env`, `.env.local`, `.env.aiven` y `ca-certificate.pem` están en `.gitignore` y NO deben commitearse.

---

## 🚀 Comandos de Desarrollo

### Desarrollo con XAMPP Local

```bash
npm run dev:local
```

**Qué hace:**
- Copia `.env.local` a `.env`
- Se conecta a MySQL en `localhost:3306`
- No requiere SSL
- No requiere Internet

**Requisitos:**
- XAMPP MySQL corriendo
- Base de datos `db_tecnocel_v4` importada

---

### Desarrollo con Aiven Cloud

```bash
npm run dev:aiven
```

**Qué hace:**
- Copia `.env.aiven` a `.env`
- Se conecta a Aiven MySQL cloud
- Usa SSL/TLS
- Requiere Internet

**Requisitos:**
- Certificado SSL `ca-certificate.pem` en el directorio `backend/`
- Credenciales válidas de Aiven
- Conexión a Internet

---

### Desarrollo Normal (usa .env actual)

```bash
npm run dev
```

Usa el archivo `.env` tal como está, sin modificarlo.

---

## 🔧 Configuración Inicial

### 1. Para Desarrollo Local (XAMPP)

**Paso 1: Asegúrate de tener XAMPP corriendo**
```bash
# Iniciar MySQL desde Panel de Control XAMPP
```

**Paso 2: Verifica que `.env.local` existe**
```bash
# Ya está creado en: backend/.env.local
# Verifica que las credenciales sean correctas:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=  (vacío para XAMPP por defecto)
```

**Paso 3: Ejecuta el backend**
```bash
npm run dev:local
```

---

### 2. Para Desarrollo con Aiven Cloud

**Paso 1: Verifica que `.env.aiven` existe**
```bash
# Ya está creado en: backend/.env.aiven
# Verifica las credenciales de Aiven
```

**Paso 2: Asegúrate de tener el certificado SSL**
```bash
# Debe existir: backend/ca-certificate.pem
# Si no existe, descárgalo desde Aiven Dashboard:
# https://console.aiven.io > tu servicio > Overview > CA Certificate
```

**Paso 3: Ejecuta el backend**
```bash
npm run dev:aiven
```

---

## 📊 Diferencias Entre Entornos

| Característica | Local (XAMPP) | Cloud (Aiven) |
|---------------|---------------|---------------|
| **Comando** | `npm run dev:local` | `npm run dev:aiven` |
| **Host** | localhost | db-tecnocel-tecnocel.l.aivencloud.com |
| **Puerto** | 3306 | 24334 |
| **SSL** | ❌ No | ✅ Sí (requerido) |
| **Internet** | ❌ No necesario | ✅ Requerido |
| **Latencia** | ~1ms | 50-200ms |
| **Disponibilidad** | Solo local | Desde cualquier lugar |
| **Costo** | Gratis | Trial 30 días |

---

## 🛠️ Solución de Problemas

### Error: "Cannot connect to database"

**Con `dev:local`:**
- ✅ Verifica que XAMPP MySQL esté corriendo
- ✅ Verifica que la base de datos `db_tecnocel_v4` existe
- ✅ Verifica usuario/contraseña en `.env.local`

**Con `dev:aiven`:**
- ✅ Verifica tu conexión a Internet
- ✅ Verifica que `ca-certificate.pem` existe
- ✅ Verifica credenciales en `.env.aiven`

### Error: "ENOENT: no such file or directory, open './ca-certificate.pem'"

```bash
# El certificado SSL no está en la ubicación correcta
# Descárgalo desde Aiven Dashboard y colócalo en:
# backend/ca-certificate.pem
```

### Error: "Access denied for user"

**XAMPP:**
```bash
# Usuario por defecto: root
# Contraseña por defecto: (vacía)
# Verifica en .env.local:
DB_USER=root
DB_PASSWORD=
```

**Aiven:**
```bash
# Verifica en Aiven Dashboard > Overview
# Copia las credenciales exactas a .env.aiven
```

---

## 🔄 Alternando Entre Entornos

Puedes cambiar fácilmente entre configuraciones:

```bash
# Trabajar local toda la semana
npm run dev:local

# Viernes: probar en cloud antes de hacer push
npm run dev:aiven

# Lunes: volver a local
npm run dev:local
```

El archivo `.env` se sobrescribe automáticamente, pero `.env.local` y `.env.aiven` se mantienen intactos.

---

## 📝 Crear Nuevos Entornos

Puedes crear configuraciones adicionales:

```bash
# Ejemplo: entorno de staging
cp .env.aiven .env.staging

# Editar .env.staging con credenciales de staging

# Agregar script en package.json:
"dev:staging": "cp .env.staging .env && npm run dev"

# Usar:
npm run dev:staging
```

---

## 🔒 Seguridad

**Archivos que NUNCA deben commitearse:**

- ✅ `.env` (ignorado)
- ✅ `.env.local` (ignorado)
- ✅ `.env.aiven` (ignorado)
- ✅ `ca-certificate.pem` (ignorado)

**Archivos que SÍ deben commitearse:**

- ✅ `.env.example` (plantilla sin credenciales)
- ✅ `README_ENTORNOS.md` (esta documentación)

---

## 📚 Recursos

- **Documentación Completa**: [docs/MIGRACION_AIVEN.md](../docs/MIGRACION_AIVEN.md)
- **Aiven Dashboard**: https://console.aiven.io
- **XAMPP Download**: https://www.apachefriends.org

---

**Última actualización**: 30 de octubre de 2025
