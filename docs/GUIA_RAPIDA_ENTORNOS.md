# ⚡ Guía Rápida: Alternar entre XAMPP Local y Aiven Cloud

## 🎯 Uso Rápido

### Opción 1: Trabajar con XAMPP Local (Gratis, Offline)

```bash
cd backend
npm run dev:local
```

✅ Se conecta a `localhost:3306` (XAMPP)
✅ No requiere Internet
✅ Baja latencia (~1ms)

**Requisito**: XAMPP MySQL debe estar corriendo

---

### Opción 2: Trabajar con Aiven Cloud (30 días trial)

```bash
cd backend
npm run dev:aiven
```

✅ Se conecta a Aiven Cloud
✅ Accesible desde cualquier lugar
✅ Backups automáticos

**Requisito**: Conexión a Internet

---

## 🔄 Cambiar Configuración Sin Iniciar el Servidor

```bash
# Solo cambiar a local (sin iniciar servidor)
npm run switch:local

# Solo cambiar a Aiven (sin iniciar servidor)
npm run switch:aiven

# Luego iniciar manualmente:
npm run dev
```

---

## 📁 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `.env` | Archivo activo (se sobrescribe automáticamente) |
| `.env.local` | Configuración XAMPP local |
| `.env.aiven` | Configuración Aiven cloud |
| `switch-env.js` | Script que cambia entre entornos |
| `README_ENTORNOS.md` | Documentación detallada |

---

## ❓ ¿Cuál Usar Cuándo?

### Usa **Local (XAMPP)** para:
- Desarrollo diario
- Probar cambios rápidamente
- Trabajar sin Internet
- Evitar costos

### Usa **Aiven (Cloud)** para:
- Compartir base de datos con equipo
- Probar desde dispositivos móviles
- Simular entorno de producción
- Desarrollo desde múltiples ubicaciones

---

## 🔍 Verificar Configuración Actual

```bash
# Ver qué configuración está activa
cat backend/.env | head -n 15

# En Windows PowerShell:
Get-Content backend\.env | Select-Object -First 15
```

Busca la línea `DB_HOST`:
- Si dice `localhost` → Estás en **local**
- Si dice `db-tecnocel-tecnocel.l.aivencloud.com` → Estás en **Aiven**

---

## 🆘 Solución Rápida de Problemas

### Error: "Cannot connect to database" con `dev:local`

```bash
# 1. Verifica que XAMPP MySQL esté corriendo
# Abre Panel de Control XAMPP > MySQL > Start

# 2. Verifica que la base de datos existe
# http://localhost/phpmyadmin
# Debe existir: db_tecnocel_v4
```

### Error: "Cannot connect to database" con `dev:aiven`

```bash
# 1. Verifica tu conexión a Internet

# 2. Verifica que existe el certificado SSL
ls backend/ca-certificate.pem

# 3. Si no existe, descárgalo desde Aiven Dashboard
```

---

## 📚 Documentación Completa

- [docs/MIGRACION_AIVEN.md](docs/MIGRACION_AIVEN.md) - Guía completa de migración
- [backend/README_ENTORNOS.md](backend/README_ENTORNOS.md) - Documentación detallada de entornos

---

## 🎉 ¡Listo!

Ahora puedes alternar fácilmente entre XAMPP local y Aiven cloud con un solo comando.

**Ejemplo de workflow:**

```bash
# Lunes a Viernes: Desarrollo local
npm run dev:local

# Viernes tarde: Probar en cloud antes de fin de semana
npm run dev:aiven

# Lunes: Volver a local
npm run dev:local
```

---

**Última actualización**: 30 de octubre de 2025
