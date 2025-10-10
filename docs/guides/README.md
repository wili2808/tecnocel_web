[Documentación](../README.md#estructura-de-documentación) | [Inicio](../../README.md)

---

# Guías de Desarrollo

**Última actualización**: 7 de Octubre, 2025

Guías prácticas para desarrolladores que trabajan en el proyecto TecnoCel Web.

---

## Tabla de Contenidos

- [Guías Planificadas](#guías-planificadas)
- [Recursos Útiles](#recursos-útiles)

---

## Guías Planificadas

### GETTING_STARTED.md _(próximamente)_
Guía de inicio rápido para nuevos desarrolladores.

**Contenido planificado**:

#### Requisitos
- Node.js 18+
- MySQL 8.0+
- npm o yarn
- Git

#### Instalación
```bash
# Clonar repositorio
git clone https://github.com/usuario/tecnocel_web.git
cd tecnocel_web

# Configurar backend
cd backend
cp env.example .env
# Editar .env con tus credenciales
npm install
npm run dev

# Configurar frontend (nueva terminal)
cd ../frontend
cp env.example .env
# Editar .env con VITE_API_URL=http://localhost:3000/api
npm install
npm run dev
```

#### Base de Datos
```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE db_tecnocel_v4;

# Importar esquema
mysql -u root -p db_tecnocel_v4 < database/backups/db_tecnocel_v4.sql
```

#### Verificación
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- API: http://localhost:3000/api

---

### DEVELOPMENT.md _(próximamente)_
Guía de desarrollo diario.

**Contenido planificado**:

#### Estructura del Proyecto
```
tecnocel_web/
├── backend/          # API REST Node.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   └── scripts/
├── frontend/         # React App
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── contexts/
│       ├── hooks/
│       └── services/
├── database/         # Scripts y migraciones
└── docs/            # Documentación
```

#### Flujo de Desarrollo
1. Crear rama desde `develop`
2. Desarrollar feature
3. Ejecutar tests
4. Crear Pull Request
5. Code review
6. Merge a `develop`
7. Deploy a staging
8. Merge a `main` (producción)

#### Comandos Útiles
```bash
# Backend
npm run dev          # Desarrollo con nodemon
npm run build        # Build para producción
npm run start        # Iniciar en producción

# Frontend
npm run dev          # Desarrollo con Vite
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Ejecutar ESLint
```

---

### TESTING.md _(próximamente)_
Guía de testing del proyecto.

**Contenido planificado**:

#### Testing Backend
- Jest + Supertest
- Tests unitarios de servicios
- Tests de integración de endpoints
- Tests de modelos

**Ejemplo**:
```typescript
describe('AlmacenController', () => {
  test('GET /api/almacen debe retornar productos', async () => {
    const response = await request(app)
      .get('/api/almacen')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

#### Testing Frontend
- Jest + React Testing Library
- Tests de componentes
- Tests de hooks
- Tests de utilidades

**Ejemplo**:
```typescript
import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';

test('renderiza el nombre del producto', () => {
  const product = { id: 1, nombre: 'iPhone 13' };
  render(<ProductCard product={product} />);
  expect(screen.getByText('iPhone 13')).toBeInTheDocument();
});
```

#### Coverage
```bash
npm run test:coverage
```

---

### CODING_STANDARDS.md _(próximamente)_
Estándares de código del proyecto.

**Contenido planificado**:

#### TypeScript
- Strict mode habilitado
- Tipado explícito
- Evitar `any`
- Interfaces para props

#### Naming Conventions
- **Componentes**: PascalCase (`ProductCard.tsx`)
- **Archivos**: camelCase (`productService.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)
- **Funciones**: camelCase (`fetchProducts`)

#### Estructura de Archivos
```typescript
// Imports
import React from 'react';
import { Product } from '@/types';

// Types/Interfaces
interface ProductCardProps {
  product: Product;
}

// Component
export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Hooks
  const [loading, setLoading] = useState(false);

  // Functions
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

#### ESLint
```bash
npm run lint          # Verificar
npm run lint:fix      # Corregir automáticamente
```

#### Comentarios
```typescript
/**
 * Obtiene un producto por su ID
 * @param id - ID del producto
 * @returns Promise con el producto
 * @throws Error si el producto no existe
 */
export const getProductById = async (id: number): Promise<Product> => {
  // ...
};
```

---

### GIT_WORKFLOW.md _(próximamente)_
Flujo de trabajo con Git.

**Contenido planificado**:

#### Branching Strategy
```
main          # Producción
└── develop   # Desarrollo
    ├── feature/nombre-feature
    ├── bugfix/nombre-bug
    └── hotfix/nombre-hotfix
```

#### Commits
Formato: `<tipo>: <descripción>`

Tipos:
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato (no afecta código)
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Mantenimiento

**Ejemplos**:
```bash
git commit -m "feat: agregar sistema de favoritos"
git commit -m "fix: corregir cálculo de descuentos en carrito"
git commit -m "docs: actualizar README con instrucciones de instalación"
```

#### Pull Requests
1. Título descriptivo
2. Descripción del cambio
3. Screenshots si aplica
4. Tests pasando
5. Code review aprobado

---

## Recursos Útiles

### Documentación Técnica
- [Documentación de API](../api/README.md)
- [Documentación de Frontend](../frontend/README.md)
- [Documentación de Base de Datos](../database/README.md)

### Herramientas
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)

### Comunidad
- Issues: GitHub Issues
- Discusiones: GitHub Discussions

---

[Volver arriba](#tabla-de-contenidos) | [Documentación](../README.md) | [Inicio](../../README.md)
