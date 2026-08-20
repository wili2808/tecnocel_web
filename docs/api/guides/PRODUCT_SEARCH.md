**[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
---

# Guía de Búsqueda y Filtrado de Productos

> Guía completa para implementar búsqueda avanzada, filtros y exploración del catálogo de productos en TecnoCel Web.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura del Sistema de Búsqueda](#arquitectura-del-sistema-de-búsqueda)
- [1. Listar Todos los Productos](#1-listar-todos-los-productos)
- [2. Búsqueda por Término](#2-búsqueda-por-término)
- [3. Filtrar por Categoría](#3-filtrar-por-categoría)
- [4. Filtrar por Marca](#4-filtrar-por-marca)
- [5. Productos en Oferta](#5-productos-en-oferta)
- [6. Productos Destacados](#6-productos-destacados)
- [7. Obtener Detalle de Producto](#7-obtener-detalle-de-producto)
- [8. Obtener Categorías y Marcas](#8-obtener-categorías-y-marcas)
- [Filtros Combinados Frontend](#filtros-combinados-frontend)
- [Ordenamiento y Paginación](#ordenamiento-y-paginación)
- [Implementación Frontend Completa](#implementación-frontend-completa)
- [Optimización y Performance](#optimización-y-performance)
- [Buenas Prácticas](#buenas-prácticas)

---

## Visión General

El sistema de búsqueda y filtrado de TecnoCel Web ofrece múltiples formas de explorar el catálogo:

### Capacidades del Sistema

- **Búsqueda por texto**: Busca por nombre o código de producto
- **Filtrado por categoría**: Smartphones, Laptops, Tablets, etc.
- **Filtrado por marca**: Apple, Samsung, Xiaomi, etc.
- **Productos en oferta**: Con cálculo automático de descuentos
- **Productos destacados**: Selección curada por el administrador
- **Filtros múltiples**: Combina filtros en el frontend
- **Ordenamiento**: Por precio, nombre, popularidad, etc.
- **Paginación**: Manejo eficiente de grandes cantidades de productos

### Estructura de Respuesta de Productos

Todos los endpoints retornan productos con esta estructura consistente:

```typescript
{
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio_venta: Decimal;
  stock: number;
  codigo: string;
  // Información de ofertas (si aplica)
  precio_original?: Decimal;
  precio_oferta?: Decimal;
  descuento_porcentaje?: number;
  en_oferta?: boolean;
  // Relaciones
  Categoria: { nombre_categoria: string };
  marca: { nombre_marca: string; logo_marca?: string };
  imagenes: Array<{
    url_imagen: string;
    alt_text: string;
    es_principal: boolean;
    orden: number;
  }>;
  // URL transformada (servida por imageService)
  imagen_url?: string;
}
```

---

## Arquitectura del Sistema de Búsqueda

### Endpoints Disponibles

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/api/almacen/productos` | GET | Listar todos los productos | No |
| `/api/almacen/productos/buscar` | GET | Buscar por término | No |
| `/api/almacen/productos/categoria/:id` | GET | Filtrar por categoría | No |
| `/api/almacen/productos/destacados` | GET | Productos destacados | No |
| `/api/almacen/productos/:id` | GET | Detalle de producto | No |
| `/api/ofertas/productos` | GET | Productos en oferta | No |
| `/api/almacen/categorias` | GET | Listar categorías | No |
| `/api/marcas` | GET | Listar marcas | No |

### Flujo de Búsqueda Típico

```
1. Usuario entra al sitio
   └─> GET /api/almacen/productos (listado inicial)

2. Usuario busca "iphone"
   └─> GET /api/almacen/productos/buscar?termino=iphone

3. Usuario filtra por "Smartphones"
   └─> GET /api/almacen/productos/categoria/2

4. Frontend combina filtros adicionales:
   ├─> Filtra por marca localmente
   ├─> Filtra por rango de precio localmente
   └─> Ordena por precio/relevancia localmente

5. Usuario hace clic en un producto
   └─> GET /api/almacen/productos/123 (detalle completo)
```

---

## 1. Listar Todos los Productos

### Endpoint

```
GET /api/almacen/productos
```

**Autenticación**: No requerida

**Descripción**: Retorna el catálogo completo de productos con toda su información:
- Categoría y marca
- Imágenes (con URLs transformadas)
- Ofertas activas aplicadas
- Características del producto

**Respuesta Exitosa (200)**:

```json
[
  {
    "id_producto": 45,
    "nombre": "iPhone 13 Pro",
    "descripcion": "Smartphone Apple de última generación con cámara profesional",
    "precio_venta": "999.99",
    "stock": 15,
    "codigo": "APL-IPH13PRO-128",
    "es_destacado": true,
    "Categoria": {
      "nombre_categoria": "Smartphones"
    },
    "Usuario": {
      "nombres": "Admin"
    },
    "marca": {
      "nombre_marca": "Apple",
      "logo_marca": "apple_logo.png"
    },
    "caracteristicas": [
      {
        "nombre_tipo": "Memoria RAM",
        "ProductoCaracteristica": {
          "valor": "6GB"
        }
      }
    ],
    "ofertas": [
      {
        "nombre_oferta": "Black Friday 2025",
        "tipo_descuento": "porcentaje",
        "valor_descuento": "10.00",
        "ProductoOferta": {
          "precio_oferta": "899.99"
        }
      }
    ],
    "imagenes": [
      {
        "url_imagen": "iPhone13_1234567890_abc.jpg",
        "alt_text": "iPhone 13 Pro frontal",
        "es_principal": true,
        "orden": 0
      }
    ],
    "imagen_url": "http://localhost:3000/api/uploads/productos/iPhone13_1234567890_abc.jpg",
    "imagen_disponible": true
  }
]
```

### Ejemplo con JavaScript

```javascript
async function listarProductos() {
  try {
    const response = await fetch('http://localhost:3000/api/almacen/productos');

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const productos = await response.json();
    return productos;
  } catch (error) {
    console.error('Error al listar productos:', error);
    throw error;
  }
}

// Uso
const productos = await listarProductos();
console.log(`Se encontraron ${productos.length} productos`);
```

---

## 2. Búsqueda por Término

### Endpoint

```
GET /api/almacen/productos/buscar
```

**Autenticación**: No requerida

**Query Parameters**:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `termino` | string | Sí | Término de búsqueda (min 1 carácter) |

**Descripción**: Busca productos cuyo nombre o código coincida parcialmente con el término (búsqueda LIKE %término%).

**Respuesta Exitosa (200)**:

```json
[
  {
    "id_producto": 45,
    "nombre": "iPhone 13 Pro",
    "codigo": "APL-IPH13PRO-128",
    // ... resto de campos
  },
  {
    "id_producto": 46,
    "nombre": "iPhone 13",
    "codigo": "APL-IPH13-128",
    // ... resto de campos
  }
]
```

**Error 400: Término vacío**:

```json
{
  "message": "Término de búsqueda requerido"
}
```

### Ejemplo con JavaScript

```javascript
async function buscarProductos(termino) {
  if (!termino || termino.trim().length === 0) {
    throw new Error('Término de búsqueda vacío');
  }

  try {
    const params = new URLSearchParams({ termino: termino.trim() });
    const response = await fetch(
      `http://localhost:3000/api/almacen/productos/buscar?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const productos = await response.json();
    return productos;
  } catch (error) {
    console.error('Error en búsqueda:', error);
    throw error;
  }
}

// Uso
const resultados = await buscarProductos('iphone');
console.log(`Se encontraron ${resultados.length} resultados`);
```

### Implementación con Debouncing

```javascript
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // 500ms delay
  const [resultados, setResultados] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      buscar(debouncedSearchTerm);
    } else {
      setResultados([]);
    }
  }, [debouncedSearchTerm]);

  async function buscar(termino) {
    setSearching(true);
    try {
      const productos = await buscarProductos(termino);
      setResultados(productos);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searching && <span>Buscando...</span>}
      <ResultadosList productos={resultados} />
    </div>
  );
}
```

---

## 3. Filtrar por Categoría

### Endpoint

```
GET /api/almacen/productos/categoria/:categoriaId
```

**Autenticación**: No requerida

**Params**: `categoriaId` - ID de la categoría (número entero)

**Descripción**: Retorna todos los productos de una categoría específica.

**Respuesta Exitosa (200)**:

```json
[
  {
    "id_producto": 45,
    "nombre": "iPhone 13 Pro",
    "Categoria": {
      "nombre_categoria": "Smartphones"
    },
    // ... resto de campos
  }
]
```

### Ejemplo con JavaScript

```javascript
async function obtenerProductosPorCategoria(categoriaId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/almacen/productos/categoria/${categoriaId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const productos = await response.json();
    return productos;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
const smartphones = await obtenerProductosPorCategoria(2);
```

---

## 4. Filtrar por Marca

**Nota**: No existe un endpoint directo para filtrar por marca. Se recomienda:

1. Obtener todos los productos
2. Filtrar por marca en el frontend

### Implementación Frontend

```javascript
function filtrarPorMarca(productos, nombreMarca) {
  return productos.filter(producto =>
    producto.marca?.nombre_marca === nombreMarca
  );
}

// Uso
const todosLosProductos = await listarProductos();
const productosApple = filtrarPorMarca(todosLosProductos, 'Apple');
```

---

## 5. Productos en Oferta

### Endpoint

```
GET /api/ofertas/productos
```

**Autenticación**: No requerida

**Query Parameters**:

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Límite de resultados |
| `offset` | number | 0 | Offset para paginación |

**Descripción**: Retorna productos con ofertas activas vigentes, incluyendo:
- Precio original y precio con descuento
- Porcentaje de descuento calculado
- Información de la oferta aplicada

**Respuesta Exitosa (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id_producto": 45,
      "nombre": "iPhone 13 Pro",
      "precio_original": 999.99,
      "precio_oferta": 899.99,
      "descuento_porcentaje": "10.0",
      "en_oferta": true,
      "ofertas": [
        {
          "id_oferta": 2,
          "nombre_oferta": "Black Friday 2025",
          "descripcion": "Descuentos increíbles",
          "tipo_descuento": "porcentaje",
          "valor_descuento": "10.00",
          "fecha_inicio": "2025-11-25T00:00:00.000Z",
          "fecha_fin": "2025-11-30T23:59:59.000Z",
          "activo": true
        }
      ],
      "imagen_url": "http://localhost:3000/api/uploads/productos/..."
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "pages": 3
  }
}
```

### Ejemplo con JavaScript

```javascript
async function obtenerProductosEnOferta(opciones = {}) {
  const { limit = 20, offset = 0 } = opciones;

  try {
    const params = new URLSearchParams({ limit, offset });
    const response = await fetch(
      `http://localhost:3000/api/ofertas/productos?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
const { data: ofertas, pagination } = await obtenerProductosEnOferta({ limit: 12 });
console.log(`Mostrando ${ofertas.length} de ${pagination.total} productos en oferta`);
```

---

## 6. Productos Destacados

### Endpoint

```
GET /api/almacen/productos/destacados
```

**Autenticación**: No requerida

**Query Parameters**:

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | number | 6 | Límite de productos destacados |

**Descripción**: Retorna productos marcados como destacados (es_destacado=true) con stock disponible, ordenados por orden_destacado.

**Respuesta Exitosa (200)**:

```json
[
  {
    "id_producto": 45,
    "nombre": "iPhone 13 Pro",
    "es_destacado": true,
    "orden_destacado": 1,
    "stock": 15,
    // ... resto de campos
  }
]
```

### Ejemplo con JavaScript

```javascript
async function obtenerDestacados(limit = 6) {
  try {
    const params = new URLSearchParams({ limit });
    const response = await fetch(
      `http://localhost:3000/api/almacen/productos/destacados?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const productos = await response.json();
    return productos;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso en página principal
const destacados = await obtenerDestacados(8);
```

---

## 7. Obtener Detalle de Producto

### Endpoint

```
GET /api/almacen/productos/:id
```

**Autenticación**: No requerida

**Params**: `id` - ID del producto

**Descripción**: Retorna información completa y detallada de un producto específico, incluyendo:
- Todas las características con tipos y opciones
- Todas las imágenes ordenadas
- Ofertas activas con descripción completa
- Marca con logo y descripción

**Respuesta Exitosa (200)**:

```json
{
  "id_producto": 45,
  "nombre": "iPhone 13 Pro",
  "descripcion": "Smartphone Apple de última generación...",
  "precio_venta": "999.99",
  "stock": 15,
  "codigo": "APL-IPH13PRO-128",
  "es_destacado": true,
  "Categoria": {
    "nombre_categoria": "Smartphones"
  },
  "marca": {
    "nombre_marca": "Apple",
    "logo_marca": "apple_logo.png",
    "descripcion_marca": "Innovación y calidad desde 1976"
  },
  "productosCaracteristicas": [
    {
      "id_caracteristica": 1,
      "valor": "6GB",
      "tipo": {
        "nombre_tipo": "Memoria RAM",
        "tipo_dato": "numero",
        "unidad_medida": "GB",
        "descripcion": "Memoria de acceso aleatorio",
        "opciones_seleccion": null
      }
    },
    {
      "id_caracteristica": 2,
      "valor": "128GB",
      "tipo": {
        "nombre_tipo": "Almacenamiento",
        "tipo_dato": "numero",
        "unidad_medida": "GB"
      }
    }
  ],
  "ofertas": [
    {
      "nombre_oferta": "Black Friday 2025",
      "tipo_descuento": "porcentaje",
      "valor_descuento": "10.00",
      "descripcion": "Descuentos increíbles en toda la tienda",
      "ProductoOferta": {
        "precio_oferta": "899.99"
      }
    }
  ],
  "imagenes": [
    {
      "url_imagen": "iPhone13_frontal.jpg",
      "alt_text": "iPhone 13 Pro vista frontal",
      "es_principal": true,
      "orden": 0
    },
    {
      "url_imagen": "iPhone13_trasera.jpg",
      "alt_text": "iPhone 13 Pro vista trasera",
      "es_principal": false,
      "orden": 1
    }
  ],
  "imagen_url": "http://localhost:3000/api/uploads/productos/iPhone13_frontal.jpg"
}
```

**Error 404: Producto no encontrado**:

```json
{
  "message": "Producto no encontrado"
}
```

### Ejemplo con JavaScript

```javascript
async function obtenerDetalleProducto(idProducto) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/almacen/productos/${idProducto}`
    );

    if (response.status === 404) {
      throw new Error('Producto no encontrado');
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const producto = await response.json();
    return producto;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
const producto = await obtenerDetalleProducto(45);
console.log(`Producto: ${producto.nombre}`);
console.log(`Stock: ${producto.stock} unidades`);
```

---

## 8. Obtener Categorías y Marcas

### Listar Categorías

```
GET /api/almacen/categorias
```

**Respuesta**:

```json
[
  { "id_categoria": 1, "nombre_categoria": "Smartphones" },
  { "id_categoria": 2, "nombre_categoria": "Laptops" },
  { "id_categoria": 3, "nombre_categoria": "Tablets" }
]
```

### Listar Marcas

```
GET /api/marcas
```

**Respuesta**:

```json
[
  {
    "id_marca": 1,
    "nombre_marca": "Apple",
    "logo_marca": "apple_logo.png",
    "descripcion_marca": "Innovación y calidad"
  },
  {
    "id_marca": 2,
    "nombre_marca": "Samsung",
    "logo_marca": "samsung_logo.png"
  }
]
```

### Ejemplo de Uso Conjunto

```javascript
async function cargarFiltros() {
  try {
    const [categorias, marcas] = await Promise.all([
      fetch('http://localhost:3000/api/almacen/categorias').then(r => r.json()),
      fetch('http://localhost:3000/api/marcas').then(r => r.json())
    ]);

    return { categorias, marcas };
  } catch (error) {
    console.error('Error al cargar filtros:', error);
    throw error;
  }
}

// Uso
const { categorias, marcas } = await cargarFiltros();
```

---

## Filtros Combinados Frontend

### Implementación de Motor de Filtrado

```javascript
class ProductFilter {
  constructor(productos) {
    this.productosOriginales = productos;
    this.productosFiltrados = productos;
  }

  // Filtrar por categoría
  porCategoria(idCategoria) {
    if (!idCategoria) return this;
    this.productosFiltrados = this.productosFiltrados.filter(
      p => p.Categoria?.id_categoria === idCategoria
    );
    return this;
  }

  // Filtrar por marca
  porMarca(nombreMarca) {
    if (!nombreMarca) return this;
    this.productosFiltrados = this.productosFiltrados.filter(
      p => p.marca?.nombre_marca === nombreMarca
    );
    return this;
  }

  // Filtrar por rango de precio
  porRangoPrecio(min, max) {
    this.productosFiltrados = this.productosFiltrados.filter(producto => {
      const precio = parseFloat(producto.precio_oferta || producto.precio_venta);
      return precio >= min && precio <= max;
    });
    return this;
  }

  // Filtrar solo productos en oferta
  soloOfertas() {
    this.productosFiltrados = this.productosFiltrados.filter(
      p => p.en_oferta === true
    );
    return this;
  }

  // Filtrar por stock disponible
  conStock() {
    this.productosFiltrados = this.productosFiltrados.filter(
      p => p.stock > 0
    );
    return this;
  }

  // Ordenar resultados
  ordenarPor(criterio) {
    switch (criterio) {
      case 'precio_asc':
        this.productosFiltrados.sort((a, b) => {
          const precioA = parseFloat(a.precio_oferta || a.precio_venta);
          const precioB = parseFloat(b.precio_oferta || b.precio_venta);
          return precioA - precioB;
        });
        break;
      case 'precio_desc':
        this.productosFiltrados.sort((a, b) => {
          const precioA = parseFloat(a.precio_oferta || a.precio_venta);
          const precioB = parseFloat(b.precio_oferta || b.precio_venta);
          return precioB - precioA;
        });
        break;
      case 'nombre_asc':
        this.productosFiltrados.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        break;
      case 'descuento_desc':
        this.productosFiltrados.sort((a, b) =>
          parseFloat(b.descuento_porcentaje || 0) - parseFloat(a.descuento_porcentaje || 0)
        );
        break;
      default:
        break;
    }
    return this;
  }

  // Obtener resultados
  obtener() {
    return this.productosFiltrados;
  }

  // Resetear filtros
  reset() {
    this.productosFiltrados = this.productosOriginales;
    return this;
  }
}

// Uso
const productos = await listarProductos();
const filtro = new ProductFilter(productos);

const resultados = filtro
  .porCategoria(1)
  .porMarca('Apple')
  .porRangoPrecio(500, 1500)
  .soloOfertas()
  .ordenarPor('precio_asc')
  .obtener();

console.log(`${resultados.length} productos encontrados`);
```

---

## Ordenamiento y Paginación

### Implementación de Paginación Frontend

```javascript
function paginarResultados(productos, page = 1, perPage = 12) {
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    productos: productos.slice(start, end),
    paginacion: {
      total: productos.length,
      page,
      perPage,
      totalPages: Math.ceil(productos.length / perPage),
      hasNext: end < productos.length,
      hasPrev: page > 1
    }
  };
}

// Uso
const { productos: productosPagina, paginacion } = paginarResultados(
  resultados,
  2,  // página 2
  12  // 12 productos por página
);
```

---

## Implementación Frontend Completa

### Componente de Catálogo con Filtros

```jsx
import React, { useState, useEffect } from 'react';
import { ProductFilter } from './ProductFilter';

function CatalogoProductos() {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros activos
  const [filtros, setFiltros] = useState({
    categoria: null,
    marca: null,
    precioMin: 0,
    precioMax: 10000,
    soloOfertas: false,
    ordenar: 'nombre_asc'
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 12;

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [productos, filtros]);

  async function cargarDatos() {
    setLoading(true);
    try {
      const [prods, cats, mrcs] = await Promise.all([
        listarProductos(),
        fetch('http://localhost:3000/api/almacen/categorias').then(r => r.json()),
        fetch('http://localhost:3000/api/marcas').then(r => r.json())
      ]);

      setProductos(prods);
      setCategorias(cats);
      setMarcas(mrcs);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function aplicarFiltros() {
    const filtro = new ProductFilter(productos);

    let resultados = filtro
      .porCategoria(filtros.categoria)
      .porMarca(filtros.marca)
      .porRangoPrecio(filtros.precioMin, filtros.precioMax);

    if (filtros.soloOfertas) {
      resultados = resultados.soloOfertas();
    }

    resultados = resultados
      .conStock()
      .ordenarPor(filtros.ordenar)
      .obtener();

    setProductosFiltrados(resultados);
    setPaginaActual(1); // Reset a primera página
  }

  function handleFiltroChange(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
  }

  // Calcular productos de la página actual
  const { productos: productosPagina, paginacion } = paginarResultados(
    productosFiltrados,
    paginaActual,
    productosPorPagina
  );

  if (loading) {
    return <div>Cargando productos...</div>;
  }

  return (
    <div className="catalogo-container">
      {/* Barra de filtros */}
      <aside className="filtros">
        <h3>Filtros</h3>

        {/* Filtro de categoría */}
        <div className="filtro-grupo">
          <label>Categoría</label>
          <select
            value={filtros.categoria || ''}
            onChange={(e) => handleFiltroChange('categoria', parseInt(e.target.value) || null)}
          >
            <option value="">Todas</option>
            {categorias.map(cat => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de marca */}
        <div className="filtro-grupo">
          <label>Marca</label>
          <select
            value={filtros.marca || ''}
            onChange={(e) => handleFiltroChange('marca', e.target.value || null)}
          >
            <option value="">Todas</option>
            {marcas.map(marca => (
              <option key={marca.id_marca} value={marca.nombre_marca}>
                {marca.nombre_marca}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de precio */}
        <div className="filtro-grupo">
          <label>Rango de Precio</label>
          <input
            type="number"
            placeholder="Mínimo"
            value={filtros.precioMin}
            onChange={(e) => handleFiltroChange('precioMin', parseFloat(e.target.value))}
          />
          <input
            type="number"
            placeholder="Máximo"
            value={filtros.precioMax}
            onChange={(e) => handleFiltroChange('precioMax', parseFloat(e.target.value))}
          />
        </div>

        {/* Solo ofertas */}
        <div className="filtro-grupo">
          <label>
            <input
              type="checkbox"
              checked={filtros.soloOfertas}
              onChange={(e) => handleFiltroChange('soloOfertas', e.target.checked)}
            />
            Solo ofertas
          </label>
        </div>
      </aside>

      {/* Lista de productos */}
      <main className="productos-main">
        {/* Barra de ordenamiento */}
        <div className="productos-header">
          <p>{productosFiltrados.length} productos encontrados</p>
          <select
            value={filtros.ordenar}
            onChange={(e) => handleFiltroChange('ordenar', e.target.value)}
          >
            <option value="nombre_asc">Nombre A-Z</option>
            <option value="precio_asc">Precio: Menor a Mayor</option>
            <option value="precio_desc">Precio: Mayor a Menor</option>
            <option value="descuento_desc">Mayor Descuento</option>
          </select>
        </div>

        {/* Grid de productos */}
        <div className="productos-grid">
          {productosPagina.map(producto => (
            <ProductoCard key={producto.id_producto} producto={producto} />
          ))}
        </div>

        {/* Paginación */}
        {paginacion.totalPages > 1 && (
          <div className="paginacion">
            <button
              disabled={!paginacion.hasPrev}
              onClick={() => setPaginaActual(paginaActual - 1)}
            >
              Anterior
            </button>
            <span>
              Página {paginacion.page} de {paginacion.totalPages}
            </span>
            <button
              disabled={!paginacion.hasNext}
              onClick={() => setPaginaActual(paginaActual + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## Optimización y Performance

### 1. Caché de Productos

```javascript
const CACHE_KEY = 'productos_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function listarProductosConCache() {
  const cache = localStorage.getItem(CACHE_KEY);

  if (cache) {
    const { data, timestamp } = JSON.parse(cache);
    const now = Date.now();

    if (now - timestamp < CACHE_DURATION) {
      console.log('Usando caché');
      return data;
    }
  }

  // Fetch del servidor
  const productos = await listarProductos();

  // Guardar en caché
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: productos,
    timestamp: Date.now()
  }));

  return productos;
}
```

### 2. Lazy Loading de Imágenes

```jsx
function ProductoCard({ producto }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="producto-card">
      {!imgLoaded && <div className="skeleton-image" />}
      <img
        src={producto.imagen_url}
        alt={producto.nombre}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        style={{ display: imgLoaded ? 'block' : 'none' }}
      />
      <h3>{producto.nombre}</h3>
      <p className="precio">Bs. {producto.precio_oferta || producto.precio_venta}</p>
    </div>
  );
}
```

### 3. Virtualización para Grandes Listas

```bash
npm install react-window
```

```jsx
import { FixedSizeGrid } from 'react-window';

function ProductosGrid({ productos }) {
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnas + columnIndex;
    if (index >= productos.length) return null;

    const producto = productos[index];
    return (
      <div style={style}>
        <ProductoCard producto={producto} />
      </div>
    );
  };

  return (
    <FixedSizeGrid
      columnCount={4}
      columnWidth={250}
      height={600}
      rowCount={Math.ceil(productos.length / 4)}
      rowHeight={350}
      width={1000}
    >
      {Cell}
    </FixedSizeGrid>
  );
}
```

---

## Buenas Prácticas

### 1. Indicadores de Carga

```jsx
function ProductosConLoading() {
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    setLoading(true);
    try {
      const prods = await listarProductos();
      setProductos(prods);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <SkeletonGrid count={12} />;
  }

  return <ProductosGrid productos={productos} />;
}
```

### 2. Manejo de Estados Vacíos

```jsx
function ResultadosBusqueda({ productos, termino }) {
  if (productos.length === 0) {
    return (
      <div className="no-resultados">
        <h3>No se encontraron resultados para "{termino}"</h3>
        <p>Intenta con otros términos de búsqueda</p>
      </div>
    );
  }

  return <ProductosGrid productos={productos} />;
}
```

### 3. URL con Parámetros de Búsqueda

```javascript
import { useSearchParams } from 'react-router-dom';

function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Leer filtros de la URL
  const filtros = {
    categoria: searchParams.get('categoria'),
    marca: searchParams.get('marca'),
    busqueda: searchParams.get('q')
  };

  function actualizarFiltro(campo, valor) {
    const newParams = new URLSearchParams(searchParams);
    if (valor) {
      newParams.set(campo, valor);
    } else {
      newParams.delete(campo);
    }
    setSearchParams(newParams);
  }

  // URL resultante: /catalogo?categoria=1&marca=Apple&q=iphone
}
```

---

**Última actualización**: 15 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

**Relacionado con**:
- [API Reference](../ENDPOINTS.md)
- [Endpoints de Productos](../endpoints/productos.md)
- [Endpoints de Ofertas](../endpoints/ofertas.md)
- [Guía del Carrito de Compras](./SHOPPING_CART.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
