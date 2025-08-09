# Migración de Imágenes de Productos

## Descripción General

Este documento detalla el proceso de migración de imágenes de productos desde la tabla `tb_almacen` a la nueva estructura utilizando `tb_producto_imagenes`. Esta migración mejora el manejo de imágenes permitiendo múltiples imágenes por producto y mejor organización de las mismas.

## Estructura Actual vs Nueva

### Estructura Actual

```sql
-- tb_almacen
imagen TEXT NULL
```

### Nueva Estructura

```sql
-- tb_producto_imagenes
id_imagen INT PRIMARY KEY AUTO_INCREMENT,
id_producto INT NOT NULL,
url_imagen TEXT NOT NULL,
alt_text VARCHAR(255) NULL,
es_principal BOOLEAN DEFAULT false,
orden INT DEFAULT 0,
fyh_creacion DATETIME NOT NULL
```

## Beneficios de la Nueva Estructura

1. **Múltiples Imágenes**: Permite asociar varias imágenes a un mismo producto
2. **Mejor Organización**: Incluye campos para orden y tipo de imagen (principal/secundaria)
3. **Accesibilidad**: Campo alt_text para mejorar SEO y accesibilidad
4. **Trazabilidad**: Registro de fecha de creación para cada imagen
5. **Flexibilidad**: Facilita la adición de nuevas imágenes sin modificar el producto

## Implementación Frontend

### Servicio de Productos (productService.tsx)

El servicio unificado incluye las siguientes funcionalidades:

1. **Gestión de Imágenes**:

   - `getProductImages`: Obtener imágenes de un producto
   - `uploadProductImage`: Subir nueva imagen
   - `updateProductImage`: Actualizar información de imagen
   - `deleteProductImage`: Eliminar imagen
   - `reorderProductImages`: Reordenar imágenes

2. **Operaciones de Productos**:
   - `getProducts`: Lista paginada con filtros
   - `getProductById`: Detalles de producto
   - `getFeaturedProducts`: Productos destacados
   - `getCategorias`: Categorías disponibles

### Componentes Actualizados

1. **ProductImage**:

   - Soporte para múltiples imágenes
   - Carousel y miniaturas
   - Lazy loading optimizado
   - Manejo de errores mejorado

2. **ProductCard**:

   - Integración con nuevo sistema de imágenes
   - Soporte para imagen principal
   - Fallback a imagen por defecto
   - Optimización de carga

3. **ProductCardExtensive**:

   - Vista detallada con múltiples imágenes
   - Miniaturas y navegación
   - Información completa del producto
   - Manejo de ofertas y descuentos

4. **CartItem**:
   - Integración con sistema de imágenes
   - Visualización de imagen principal
   - Manejo de estados de carga
   - Actualización en tiempo real

### Tipos TypeScript

```typescript
interface ImageData {
  url: string;
  alt_text?: string;
  es_principal?: boolean;
  orden?: number;
}

interface ProductoImagen {
  id_imagen: number;
  id_producto: number;
  url_imagen: string;
  alt_text?: string | null;
  es_principal: boolean;
  orden: number;
}
```

## Optimizaciones Implementadas

1. **Lazy Loading**:

   - Carga diferida de imágenes
   - Priorización de imágenes principales
   - Precarga de imágenes adyacentes

2. **Gestión de Cache**:

   - Cache de imágenes en navegador
   - Revalidación inteligente
   - Manejo de versiones

3. **Rendimiento**:

   - Compresión de imágenes
   - Formatos optimizados (WebP)
   - Dimensiones responsivas

4. **UX/UI**:
   - Previsualización de imágenes
   - Navegación intuitiva
   - Feedback visual de estados

## Monitoreo y Mantenimiento

1. **Logs y Métricas**:

   - Registro de operaciones de imágenes
   - Métricas de rendimiento
   - Monitoreo de errores

2. **Optimización Continua**:

   - Análisis de uso
   - Mejoras de rendimiento
   - Actualizaciones de componentes

3. **Mantenimiento**:
   - Limpieza periódica
   - Verificación de integridad
   - Actualización de dependencias

## Próximos Pasos

1. **Mejoras Planificadas**:

   - Implementar CDN para imágenes
   - Optimización automática de imágenes
   - Sistema de tags y categorización
   - Galería avanzada de productos

2. **Características Futuras**:

   - Zoom de imágenes
   - Vista 360° de productos
   - Edición de imágenes integrada
   - Importación masiva de imágenes

3. **Optimizaciones Técnicas**:
   - Mejora de algoritmos de compresión
   - Implementación de WebP dinámico
   - Cache distribuido
   - Balanceo de carga de imágenes
