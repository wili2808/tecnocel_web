# TecnoCel Web - Frontend

Aplicación cliente de la plataforma TecnoCel Web. Se trata de una Single Page Application (SPA) construida con React 18 y TypeScript, empaquetada mediante Vite. Su enfoque principal es proveer una experiencia de usuario fluida, modular y escalable.

---

## Tabla de Contenidos

- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Inicio Rápido](#inicio-rápido)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura y Estado](#arquitectura-y-estado)
- [Desarrollo y Scripts](#desarrollo-y-scripts)

---

## Tecnologías Utilizadas

- **Core:** React 18.2.0, TypeScript 5.3.3
- **Build & Server:** Vite 5.0.12
- **Navegación:** React Router 6.21.3
- **Comunicaciones HTTP:** Axios 1.9.0
- **Estilos:** CSS Modules y variables CSS personalizadas

---

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (definir VITE_API_URL y VITE_GOOGLE_CLIENT_ID)
cp .env.example .env

# Iniciar el entorno de desarrollo
npm run dev
```

El servidor estará disponible en: `http://localhost:5173`

---

## Estructura del Proyecto

El código fuente se organiza bajo `src/` agrupado por dominio y responsabilidad:

- `components/`: Componentes modulares, separados por funcionalidad (cart, product, user, layout).
- `contexts/`: Estados globales utilizando Context API.
- `hooks/`: Lógica reutilizable encapsulada en custom hooks.
- `pages/`: Vistas principales gestionadas por el router.
- `services/`: Funciones de comunicación con la API.
- `styles/`: Sistema centralizado de estilos (temas, variables globales).
- `types/`: Definiciones estrictas de interfaces de TypeScript.

---

## Arquitectura y Estado

El proyecto no depende de gestores de estado externos complejos (como Redux), optando por **Context API** combinado con custom hooks para mantener la ligereza y el rendimiento:
- `AuthContext`: Gestión de sesión y autenticación.
- `CarritoContext`: Estado del carrito de compras.
- `ThemeContext`: Manejo del esquema de colores (claro/oscuro).

El consumo de datos externos se realiza a través de **servicios encapsulados** (ej. `productService`, `authService`) e interceptores de Axios para manejar tokens JWT y errores globales de red de forma centralizada.

---

## Desarrollo y Scripts

Se proveen los siguientes comandos npm para el flujo de trabajo de desarrollo y despliegue:

- `npm run dev`: Inicia el servidor Vite con Hot Module Replacement (HMR).
- `npm run build`: Genera los archivos estáticos de producción.
- `npm run preview`: Sirve localmente la carpeta `dist/` para probar el build de producción.
- `npm run lint`: Ejecuta ESLint para mantener la calidad y convenciones del código.

---

## Documentación de Referencia

Para consultar detalles específicos sobre la arquitectura y directrices del frontend, revisa los siguientes documentos:

- **Componentes:** [Catálogo de componentes](../docs/frontend/COMPONENTS.md)
- **Estado Global:** [Contextos](../docs/frontend/CONTEXTS.md) y [Hooks personalizados](../docs/frontend/HOOKS.md)
- **Servicios:** [Integración con API](../docs/frontend/SERVICES.md)
- **Sistema de Diseño:** [Estilos y Theming (CSS Modules)](../docs/frontend/STYLING_AND_THEMING.md)
- **Rutas:** [Navegación (React Router)](../docs/frontend/ROUTING.md)
- **Guías de Desarrollo:** [Guía General](../docs/guides/DEVELOPMENT.md)

---

[Volver al Inicio](../README.md)
