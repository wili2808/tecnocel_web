# 🛠️ Stack Tecnológico - TecnoCel Web

Documentación completa de todas las tecnologías, librerías y herramientas utilizadas.

---

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Backend - Node.js Stack](#backend---nodejs-stack)
- [Frontend - React Stack](#frontend---react-stack)
- [Base de Datos](#base-de-datos)
- [DevOps y Herramientas](#devops-y-herramientas)
- [Servicios Externos](#servicios-externos)

---

## Resumen Ejecutivo

### Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENTE / NAVEGADOR                    │
│                   React 18 + TypeScript                 │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/JSON
                      │ REST API
┌─────────────────────▼───────────────────────────────────┐
│                  WEB SERVICE - BACKEND                  │
│              Node.js + Express + TypeScript             │
└─────────────────────┬───────────────────────────────────┘
                      │ Sequelize ORM
                      │
┌─────────────────────▼────────────────────────────────────┐
│                   BASE DE DATOS                          │
│                     MySQL 8.0+                           │
└──────────────────────────────────────────────────────────┘
```

### Stack Principal

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Node.js + Express + TypeScript |
| **Base de Datos** | MySQL 8.0 + Sequelize ORM |
| **Autenticación** | JWT + Google OAuth 2.0 |
| **Estilos** | CSS Modules + Variables CSS |

---

## Backend - Node.js Stack

### Core Framework

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **Node.js** | 18+ | Runtime de JavaScript | [nodejs.org](https://nodejs.org/) |
| **TypeScript** | 5.3.3 | Superset de JavaScript con tipos | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Express.js** | 4.18.2 | Framework web minimalista | [expressjs.com](https://expressjs.com/) |
| **ts-node** | 10.9.2 | Ejecutar TypeScript directamente | [typestrong.org/ts-node](https://typestrong.org/ts-node/) |

**¿Por qué?**
- **Node.js**: Ecosistema robusto, alta performance para I/O
- **TypeScript**: Seguridad de tipos, mejor IDE support
- **Express**: Ligero, flexible, gran comunidad

---

### Base de Datos y ORM

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **MySQL** | 8.0+ | Base de datos relacional | [mysql.com](https://dev.mysql.com/doc/) |
| **Sequelize** | 6.35.2 | ORM para Node.js | [sequelize.org](https://sequelize.org/) |
| **mysql2** | 3.7.1 | Driver MySQL para Node.js | [npm: mysql2](https://www.npmjs.com/package/mysql2) |

**Características de Sequelize:**
- Modelos con TypeScript
- Relaciones (1:1, 1:N, N:M)
- Migraciones y seeders
- Validaciones
- Connection pooling

---

### Autenticación y Seguridad

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **jsonwebtoken** | 9.0.2 | Autenticación JWT | [jwt.io](https://jwt.io/) |
| **bcryptjs** | 2.4.3 | Hashing de contraseñas | [npm: bcryptjs](https://www.npmjs.com/package/bcryptjs) |
| **passport** | 0.7.0 | Middleware de autenticación | [passportjs.org](http://www.passportjs.org/) |
| **passport-google-oauth20** | 2.0.0 | Estrategia Google OAuth | [passport-google-oauth2](https://www.passportjs.org/packages/passport-google-oauth2/) |
| **google-auth-library** | 10.2.0 | Librería oficial de Google | [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs) |
| **cors** | 2.8.5 | Control de acceso cross-origin | [npm: cors](https://www.npmjs.com/package/cors) |

**Flujo de Autenticación:**
```
1. Usuario → Login/Register
2. Backend → Valida credenciales
3. Backend → Genera JWT token
4. Frontend → Almacena token
5. Frontend → Incluye token en headers (Authorization: Bearer <token>)
6. Backend → Middleware verifica token
```

---

### Gestión de Archivos e Imágenes

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **multer** | 2.0.2 | Upload de archivos multipart/form-data | [npm: multer](https://www.npmjs.com/package/multer) |
| **sharp** | 0.34.3 | Procesamiento de imágenes | [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com/) |
| **uuid** | 11.1.0 | Generación de IDs únicos | [npm: uuid](https://www.npmjs.com/package/uuid) |

**Procesamiento de Imágenes:**
```typescript
sharp(buffer)
  .resize(800, 800, { fit: 'inside' })  // Redimensionar
  .jpeg({ quality: 85 })                 // Optimizar calidad
  .toFile(destPath);                     // Guardar
```

---

### Validación y Utilidades

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **express-validator** | 7.2.1 | Validación de datos de entrada | [express-validator.github.io](https://express-validator.github.io/) |
| **dotenv** | 16.3.1 | Variables de entorno | [npm: dotenv](https://www.npmjs.com/package/dotenv) |
| **nodemailer** | 7.0.5 | Envío de emails | [nodemailer.com](https://nodemailer.com/) |

---

### Logging y Desarrollo

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **winston** | 3.17.0 | Sistema de logging estructurado | [github.com/winstonjs](https://github.com/winstonjs/winston) |
| **nodemon** | 3.0.2 | Auto-reload en desarrollo | [nodemon.io](https://nodemon.io/) |

**Niveles de Log (Winston):**
- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información general
- `debug` - Debugging detallado

---

## Frontend - React Stack

### Core Framework

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **React** | 18.2.0 | Librería UI declarativa | [react.dev](https://react.dev/) |
| **TypeScript** | 5.3.3 | Tipado estático | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Vite** | 5.0.12 | Build tool + dev server | [vitejs.dev](https://vitejs.dev/) |

**Características de React 18:**
- Concurrent rendering
- Automatic batching
- Suspense
- Server Components (preparado)

**¿Por qué Vite?**
- HMR (Hot Module Replacement) ultra-rápido
- Build optimizado con Rollup
- ESM nativo en desarrollo
- Configuración mínima

---

### Routing y Estado

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **react-router-dom** | 6.21.3 | Routing para SPA | [reactrouter.com](https://reactrouter.com/) |
| **Context API** | (React 18) | Gestión de estado global | [react.dev/reference/react/useContext](https://react.dev/reference/react/useContext) |

**Contextos Implementados:**
- `AuthContext` - Autenticación y sesión
- `CarritoContext` - Carrito de compras
- `FavoritosGlobalContext` - Favoritos
- `NotificationContext` - Notificaciones
- `SearchContext` - Búsqueda
- `ThemeContext` - Tema claro/oscuro

---

### HTTP Client

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **axios** | 1.9.0 | Cliente HTTP con interceptores | [axios-http.com](https://axios-http.com/) |

**Configuración de Axios:**
```typescript
// Interceptores para JWT automático
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### UI y Estilos

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **CSS Modules** | (Vite) | Estilos scoped | [vitejs.dev/guide/features#css-modules](https://vitejs.dev/guide/features#css-modules) |
| **react-icons** | 5.5.0 | Iconografía | [react-icons.github.io](https://react-icons.github.io/react-icons/) |
| **react-toastify** | 11.0.5 | Notificaciones toast | [fkhadra.github.io/react-toastify](https://fkhadra.github.io/react-toastify/) |

**Sistema de Diseño:**
- Variables CSS centralizadas (`variables.css`)
- Tema claro/oscuro (`themes.css`)
- Mobile-first responsive
- Breakpoints: 480px, 768px, 1024px, 1440px

---

### Integraciones Externas

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **@react-google-maps/api** | 2.20.4 | Google Maps integración | [react-google-maps-api](https://react-google-maps-api-docs.netlify.app/) |

---

### Desarrollo y Build

| Tecnología | Versión | Propósito | Documentación |
|------------|---------|-----------|---------------|
| **ESLint** | 8.55.0 | Linter para código | [eslint.org](https://eslint.org/) |
| **@vitejs/plugin-react-swc** | 3.5.0 | SWC para Fast Refresh | [github.com/vitejs/vite-plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) |

**ESLint Plugins:**
- `eslint-plugin-react` - Reglas de React
- `eslint-plugin-react-hooks` - Reglas de Hooks
- `eslint-plugin-react-refresh` - Hot reload

---

## Base de Datos

### MySQL 8.0+

| Característica | Implementación | Beneficio |
|----------------|----------------|-----------|
| **Transacciones ACID** | InnoDB engine | Integridad de datos |
| **Índices** | PRIMARY, FOREIGN, INDEX | Performance en queries |
| **UTF8MB4** | Charset para emojis y unicode | Soporte internacional |
| **Relaciones** | FOREIGN KEYS con CASCADE | Integridad referencial |

### Herramientas de Gestión

- **MySQL Workbench** - GUI oficial
- **phpMyAdmin** - Interfaz web (XAMPP)
- **DBeaver** - Cliente universal

---

## DevOps y Herramientas

### Control de Versiones

| Herramienta | Uso |
|-------------|-----|
| **Git** | Control de versiones |
| **GitHub** | Repositorio remoto |
| **.gitignore** | Archivos excluidos (.env, node_modules, dist) |

### Gestión de Dependencias

```json
// package.json - Gestión de dependencias
{
  "dependencies": { /* Producción */ },
  "devDependencies": { /* Desarrollo */ }
}
```

### Scripts de Desarrollo

**Backend:**
```bash
npm run dev      # Desarrollo con nodemon
npm run build    # Compilar TypeScript → dist/
npm start        # Ejecutar dist/index.js
```

**Frontend:**
```bash
npm run dev      # Vite dev server + HMR
npm run build    # Build optimizado
npm run preview  # Preview del build
npm run lint     # ESLint
```

---

## Servicios Externos

### Google Cloud Platform

| Servicio | Uso | Configuración |
|----------|-----|---------------|
| **Google OAuth 2.0** | Autenticación social | Console.cloud.google.com |
| **Google Maps API** | Mapas y ubicación | API Key requerida |

**Configuración OAuth 2.0:**
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### SMTP (Nodemailer)

| Proveedor | Uso | Configuración |
|-----------|-----|---------------|
| **Gmail SMTP** | Envío de emails | App Password requerida |

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=password_de_aplicacion
```

---

## Comparación de Versiones

### Backend Dependencies

| Dependencia | Versión Actual | Última Versión | Estado |
|-------------|----------------|----------------|--------|
| express | 4.18.2 | 4.19.x | ✅ Actualizado |
| sequelize | 6.35.2 | 6.37.x | ⚠️ Actualizable |
| jsonwebtoken | 9.0.2 | 9.0.2 | ✅ Latest |
| sharp | 0.34.3 | 0.33.x | ✅ Actualizado |

### Frontend Dependencies

| Dependencia | Versión Actual | Última Versión | Estado |
|-------------|----------------|----------------|--------|
| react | 18.2.0 | 18.3.x | ⚠️ Actualizable |
| vite | 5.0.12 | 5.4.x | ⚠️ Actualizable |
| axios | 1.9.0 | 1.7.x | ✅ Actualizado |
| react-router-dom | 6.21.3 | 6.26.x | ⚠️ Actualizable |

---

## Criterios de Selección

### ¿Por qué estas tecnologías?

**Backend:**
- Node.js + TypeScript: Type safety + ecosistema maduro
- Express: Minimalista, flexible, gran comunidad
- Sequelize: ORM robusto con soporte TypeScript
- JWT: Stateless, escalable, estándar de industria

**Frontend:**
- React 18: Ecosistema robusto, gran comunidad
- Vite: Build ultra-rápido, mejor DX
- TypeScript: Prevención de errores, mejor IDE support
- CSS Modules: Estilos scoped sin colisiones

**Base de Datos:**
- MySQL: Maduro, ACID, gran documentación
- InnoDB: Transacciones, foreign keys
- UTF8MB4: Soporte completo de caracteres

---

## Recursos y Documentación

### Documentación Oficial

- [Node.js Docs](https://nodejs.org/docs/latest/)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [Sequelize Docs](https://sequelize.org/docs/v6/)
- [MySQL Reference](https://dev.mysql.com/doc/refman/8.0/en/)

### Tutoriales y Guías

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [JWT Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## Actualización de Dependencias

### Comandos Útiles

```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar dependencias minor/patch
npm update

# Actualizar dependencias major (con cuidado)
npm install <package>@latest

# Auditoría de seguridad
npm audit
npm audit fix
```

---

[Volver arriba](#stack-tecnológico---tecnocel-web) | [Documentación](../README.md) | [Inicio](../../README.md)
