# 🚀 Despliegue de Base de Datos con Docker y Front/Back en Railway

## Índice
1. Introducción
2. Ventajas y Desventajas
3. Requisitos Previos
4. Estructura Recomendada
5. Paso a Paso: Despliegue de la Base de Datos con Docker
6. Paso a Paso: Despliegue de Frontend y Backend en Railway
7. Migración de Datos
8. Comandos Útiles
9. Consejos de Seguridad
10. Recursos

---

## 1. Introducción

Este documento describe cómo desplegar la base de datos MySQL usando Docker en un servidor propio (PC o VPS) y cómo desplegar el frontend y backend en Railway. Es ideal para desarrollo, pruebas y proyectos personales.

---

## 2. Ventajas y Desventajas

### Ventajas
- **Control total** sobre la base de datos y los datos.
- **Portabilidad:** Puedes mover tu base de datos fácilmente a otro servidor.
- **phpMyAdmin incluido** para administración web.
- **Despliegue sencillo** de frontend y backend en Railway (automatizado desde GitHub).
- **Separación de responsabilidades:** Puedes escalar cada parte por separado.

### Desventajas
- **Tu PC/servidor debe estar siempre encendido** para que la base de datos esté disponible.
- **Exponer MySQL a internet es riesgoso** si no se toman medidas de seguridad.
- **La velocidad depende de tu conexión a internet**.
- **Railway no ofrece MySQL gratis gestionado** (solo PostgreSQL), por eso se usa Docker local.
- **Complejidad de red:** Puede requerir abrir puertos y configurar firewall/ISP.

---

## 3. Requisitos Previos
- Docker Desktop instalado ([descargar](https://www.docker.com/products/docker-desktop/))
- Acceso a tu router para abrir puertos (si quieres exponer la base de datos a internet)
- Cuenta en [Railway](https://railway.app)
- Repositorio en GitHub con tu proyecto
- Backup SQL de tu base de datos (ej: `database/backups/db_tecnocel.sql`)

---

## 4. Estructura Recomendada

```
tecnocel_web/
├── backend/
├── frontend/
├── database/
│   └── backups/
│       └── db_tecnocel.sql
├── Dockerfile.mysql
├── docker-compose.yml
└── DEPLOY_DB_DOCKER_RAILWAY.md
```

---

## 5. Paso a Paso: Despliegue de la Base de Datos con Docker

### 5.1. Crear el archivo `docker-compose.yml`

```yaml
docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: tecnocel_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: tecnocel_root_2024
      MYSQL_DATABASE: tecnocel_db_v1
      MYSQL_USER: tecnocel_user
      MYSQL_PASSWORD: tecnocel_pass_2024
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/backups/db_tecnocel.sql:/docker-entrypoint-initdb.d/01-init.sql
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - tecnocel_network

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: tecnocel_phpmyadmin
    restart: always
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: tecnocel_root_2024
    ports:
      - "8080:80"
    depends_on:
      - mysql
    networks:
      - tecnocel_network

volumes:
  mysql_data:
    driver: local

networks:
  tecnocel_network:
    driver: bridge
```

### 5.2. Iniciar los servicios

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

### 5.3. Acceso a la base de datos
- **phpMyAdmin:** http://localhost:8080 (usuario: root, contraseña: tecnocel_root_2024)
- **MySQL:** localhost:3306 (usuario: tecnocel_user, contraseña: tecnocel_pass_2024)

### 5.4. Exponer MySQL a internet (opcional y bajo tu propio riesgo)
- Abre el puerto 3306 en tu router/firewall y redirígelo a la IP de tu PC.
- Usa tu IP pública como `DB_HOST` en Railway.
- **¡No recomendado para producción!**

---

## 6. Paso a Paso: Despliegue de Frontend y Backend en Railway

### 6.1. Subir tu proyecto a GitHub

```bash
git add .
git commit -m "Proyecto listo para Railway"
git push origin main
```

### 6.2. Crear proyectos en Railway

#### **Backend**
1. "New Project" → "Deploy from GitHub repo"
2. Selecciona tu repo y elige la carpeta `backend` como root
3. Configura:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Variables de entorno:**
     ```env
     DB_HOST=TU_IP_PUBLICA_O_HOST
     DB_USER=tecnocel_user
     DB_PASSWORD=tecnocel_pass_2024
     DB_NAME=tecnocel_db_v1
     DB_PORT=3306
     JWT_SECRET=tu_clave_secreta
     ```

#### **Frontend**
1. "New Project" → "Deploy from GitHub repo"
2. Selecciona tu repo y la carpeta `frontend` como root
3. Configura:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Variables de entorno:**
     ```env
     VITE_API_URL=https://<TU_BACKEND_ON_RAILWAY>.railway.app/api
     ```

---

## 7. Migración de Datos

Si necesitas migrar datos a Railway u otro servicio en la nube:

```bash
# Hacer backup desde Docker
# (Asegúrate de tener mysqldump instalado)
docker exec tecnocel_mysql mysqldump -u root -p tecnocel_db_v1 > backup.sql

# Importar a Railway (si usas Railway MySQL)
mysql -h <host_railway> -u <user> -p < backup.sql
```

---

## 8. Comandos Útiles

```bash
# Iniciar servicios Docker
docker-compose up -d

# Detener servicios Docker
docker-compose down

# Ver logs
docker-compose logs -f mysql

# Acceder a MySQL desde terminal
docker exec -it tecnocel_mysql mysql -u root -p

# Hacer backup de la base de datos
docker exec tecnocel_mysql mysqldump -u root -p tecnocel_db_v1 > backup.sql

# Restaurar backup
docker exec -i tecnocel_mysql mysql -u root -p tecnocel_db_v1 < backup.sql
```

---

## 9. Consejos de Seguridad
- Cambia las contraseñas por otras más seguras en producción.
- No expongas el puerto 3306 a internet sin firewall y reglas estrictas.
- Considera usar VPN o túneles SSH para acceso remoto seguro.
- Haz backups periódicos de tu base de datos.
- No subas archivos `.env` ni backups con datos sensibles a GitHub.

---

## 10. Recursos
- [Documentación oficial de Docker](https://docs.docker.com/)
- [Documentación de Railway](https://docs.railway.app/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [phpMyAdmin Docker Hub](https://hub.docker.com/_/phpmyadmin)
- [Guía de port forwarding](https://www.noip.com/es/support/knowledgebase/guia-de-redireccionamiento-de-puertos/)

---

**¡Listo! Ahora tienes una guía completa para desplegar tu base de datos con Docker y tu frontend/backend en Railway.** 