# Implementación de Productos Destacados - TecnoCel Web

## 📋 Resumen de la Implementación

Se ha implementado un sistema de productos destacados que permite marcar productos específicos como destacados directamente desde la base de datos. Los productos destacados se muestran automáticamente en el frontend cuando se cambia el campo `es_destacado` en la tabla `tb_almacen`.

## 🗄️ Cambios en la Base de Datos

### Nuevas Columnas en `tb_almacen`

```sql
ALTER TABLE tb_almacen
ADD COLUMN es_destacado BOOLEAN DEFAULT FALSE COMMENT 'Indica si el producto es destacado',
ADD COLUMN orden_destacado INT DEFAULT 0 COMMENT 'Orden de aparición en productos destacados';

-- Crear índice para optimizar consultas
CREATE INDEX idx_almacen_destacado ON tb_almacen(es_destacado, orden_destacado);
```

### Script de Migración

Se creó el archivo `database/migrations/update_featured_products.sql` para marcar productos como destacados:

```sql
-- Marcar productos como destacados (ajustar IDs según tu base de datos)
UPDATE tb_almacen SET es_destacado = true, orden_destacado = 1 WHERE id_producto = 1;
UPDATE tb_almacen SET es_destacado = true, orden_destacado = 2 WHERE id_producto = 2;
-- ... más productos
```

## 🔧 Backend - Cambios Implementados

### 1. Modelo Almacen Actualizado

**Archivo**: `backend/src/models/Almacen.ts`

```typescript
class Almacen extends Model {
  // ... propiedades existentes
  declare es_destacado: boolean;
  declare orden_destacado: number;
}

Almacen.init({
  // ... configuración existente
  es_destacado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  orden_destacado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});
```

### 2. Controlador Actualizado

**Archivo**: `backend/src/controllers/AlmacenController.ts`

#### Método `getFeaturedProducts` Mejorado

```typescript
async getFeaturedProducts(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 6;

    const productos = await Almacen.findAll({
      where: {
        stock: { [Op.gt]: 0 },
        es_destacado: true  // Solo productos marcados como destacados
      },
      include: [
        { model: Categoria, attributes: ['nombre_categoria'] },
        { model: Usuario, attributes: ['nombres'] },
        {
          model: ProductoImagen,
          as: 'imagenes',
          attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
        }
      ],
      order: [
        ['orden_destacado', 'ASC'],      // Primero por orden
        ['fyh_actualizacion', 'DESC']    // Luego por fecha
      ],
      limit
    });
    // ... resto del código
  }
}
```

### 3. Rutas

**Archivo**: `backend/src/routes/almacenRoutes.ts`

```typescript
// Ruta pública para obtener productos destacados
router.get(
  "/productos/destacados",
  almacenController.getFeaturedProducts.bind(almacenController)
);
```

## 🎨 Frontend - Cambios Implementados

### 1. Tipos Actualizados

**Archivo**: `frontend/src/types/product.ts`

```typescript
export interface Product {
  // ... propiedades existentes
  es_destacado: boolean;
  orden_destacado: number;
}
```

### 2. Servicio de Productos

**Archivo**: `frontend/src/services/productService.tsx`

```typescript
// Obtener productos destacados
getFeaturedProducts: async (limit: number = 6): Promise<Product[]> => {
  try {
    const response = await axiosInstance.get('/almacen/productos/destacados', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
},
```

### 3. Hook para Productos Destacados

**Archivo**: `frontend/src/hooks/useFeaturedProducts.ts`

```typescript
export const useFeaturedProducts = (): UseFeaturedProductsReturn => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getFeaturedProducts();
      setFeaturedProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching featured products:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Error al cargar los productos destacados"
      );
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return {
    featuredProducts,
    loading,
    error,
    refetch: fetchFeaturedProducts,
  };
};
```

### 4. Componente FeaturedProducts

**Archivo**: `frontend/src/components/product/FeaturedProducts/FeaturedProducts.tsx`

El componente recibe los productos destacados como prop y los renderiza:

```typescript
const FeaturedProducts: React.FC<FeaturedProductsProps> = memo(
  ({
    products,
    title = "Productos Destacados",
    className,
    loading = false,
    error = null,
  }) => {
    // Renderiza los productos destacados
    return (
      <section className={`${styles.productsSection} ${className || ""}`}>
        <div className={styles.productsContainer}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard
                key={product.id_producto}
                id_producto={product.id_producto}
                nombre={product.nombre}
                descripcion={product.descripcion}
                imagen_url={product.imagen_url}
                precio_venta={String(product.precio_venta)}
                stock={product.stock}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }
);
```

## 🚀 Cómo Usar el Sistema

### 1. Marcar Productos como Destacados

Para marcar un producto como destacado, simplemente actualiza la base de datos:

```sql
-- Marcar producto como destacado
UPDATE tb_almacen
SET es_destacado = true, orden_destacado = 1
WHERE id_producto = 123;

-- Desmarcar producto como destacado
UPDATE tb_almacen
SET es_destacado = false, orden_destacado = 0
WHERE id_producto = 123;
```

### 2. Controlar el Orden

El campo `orden_destacado` controla el orden de aparición:

```sql
-- Establecer orden específico
UPDATE tb_almacen
SET orden_destacado = 1
WHERE id_producto = 123;

UPDATE tb_almacen
SET orden_destacado = 2
WHERE id_producto = 456;
```

### 3. Ver Resultados

Los productos destacados aparecerán automáticamente en el frontend en la sección "Productos Destacados", ordenados por `orden_destacado` y luego por fecha de actualización.

## 📊 Características del Sistema

### ✅ Funcionalidades Implementadas

- **Filtrado automático**: Solo productos con `es_destacado = true` se muestran
- **Ordenamiento**: Por `orden_destacado` ASC, luego por `fyh_actualizacion` DESC
- **Límite configurable**: Parámetro `limit` en la API (por defecto 6)
- **Stock requerido**: Solo productos con stock > 0
- **Optimización**: Índice en base de datos para consultas rápidas
- **Gestión directa**: Cambios en base de datos se reflejan automáticamente

### 🔧 Configuración

- **Endpoint**: `GET /almacen/productos/destacados`
- **Parámetros**: `limit` (opcional, default: 6)
- **Respuesta**: Array de productos con información completa
- **Orden**: `orden_destacado ASC, fyh_actualizacion DESC`

## 🎯 Ventajas de esta Implementación

1. **Simplicidad**: Gestión directa desde la base de datos
2. **Performance**: Índices optimizados para consultas rápidas
3. **Flexibilidad**: Control total sobre qué productos mostrar
4. **Escalabilidad**: Fácil agregar más productos destacados
5. **Mantenimiento**: Sin interfaces administrativas complejas

## 📝 Notas Importantes

- Los cambios en `es_destacado` y `orden_destacado` se reflejan inmediatamente en el frontend
- Solo productos con stock disponible se muestran como destacados
- El sistema es completamente automático una vez configurado en la base de datos
- No se requieren permisos especiales para gestionar productos destacados

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../docs/README.md)** | **[🏠 Inicio](../../../README.md)**
