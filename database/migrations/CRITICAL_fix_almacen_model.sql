-- =====================================================
-- MIGRACIÓN CRÍTICA: Corregir Modelo Almacen
-- =====================================================
--
-- Este script NO modifica la base de datos (que ya tiene los campos correctos),
-- sino que documenta los cambios necesarios en el código TypeScript.
--
-- PROBLEMA:
-- El modelo TypeScript Almacen.ts NO incluye los campos 'modelo' e 'id_marca'
-- que SÍ existen en la tabla tb_almacen de la base de datos.
--
-- SOLUCIÓN:
-- Actualizar backend/src/models/Almacen.ts con los campos faltantes.
--
-- Fecha: 2025-10-30
-- Prioridad: CRÍTICA
-- =====================================================

-- Verificar que los campos existen en la base de datos
DESCRIBE tb_almacen;

-- Resultado esperado debe incluir:
-- - modelo: varchar(255) NULL
-- - id_marca: int NULL con FK a tb_marcas

-- =====================================================
-- CAMBIOS REQUERIDOS EN TYPESCRIPT
-- =====================================================

/*

Archivo: backend/src/models/Almacen.ts

1. Agregar declaraciones de campos en la clase:

   class Almacen extends Model {
     // ... campos existentes ...
     declare id_categoria: number;

     // ✅ AGREGAR ESTOS DOS CAMPOS:
     declare modelo: string | null;
     declare id_marca: number | null;

     declare es_destacado: boolean;
     // ... resto de campos ...
   }

2. Agregar definiciones en Almacen.init():

   Almacen.init({
     // ... campos existentes ...
     id_categoria: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
         model: 'tb_categorias',
         key: 'id_categoria'
       }
     },

     // ✅ AGREGAR ESTE CAMPO:
     modelo: {
       type: DataTypes.STRING(255),
       allowNull: true
     },

     // ✅ AGREGAR ESTE CAMPO:
     id_marca: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
         model: 'tb_marcas',
         key: 'id_marca'
       }
     },

     es_destacado: {
       type: DataTypes.BOOLEAN,
       allowNull: false,
       defaultValue: false
     },
     // ... resto de campos ...
   }, {
     sequelize,
     modelName: 'Almacen',
     tableName: 'tb_almacen',
     timestamps: false
   });

3. Actualizar interfaces TypeScript del frontend si existen (opcional):

   // frontend/src/types/product.ts (si existe)
   interface Product {
     id_producto: number;
     codigo: string;
     nombre: string;
     modelo?: string | null;        // ✅ AGREGAR
     descripcion?: string | null;
     // ... resto de campos ...
     id_marca?: number | null;      // ✅ AGREGAR
     marca?: {                      // Relación
       nombre_marca: string;
       logo_marca?: string;
     };
     // ... resto de campos ...
   }

*/

-- =====================================================
-- VERIFICACIÓN POST-CAMBIOS
-- =====================================================

-- Después de hacer los cambios en TypeScript, ejecutar:

-- 1. Reiniciar servidor backend
-- 2. Probar crear producto con marca:

/*
POST /api/almacen/productos
{
  "codigo": "TEST-001",
  "nombre": "Producto de Prueba",
  "modelo": "Modelo Test",
  "id_marca": 2,
  "id_categoria": 1,
  "stock": 10,
  "precio_compra": "100",
  "precio_venta": "150",
  "fecha_ingreso": "2025-10-30"
}
*/

-- 3. Verificar que el producto incluye marca en la respuesta:

/*
GET /api/almacen/productos/:id

Respuesta esperada:
{
  "id_producto": 1,
  "codigo": "TEST-001",
  "nombre": "Producto de Prueba",
  "modelo": "Modelo Test",     ✅
  "id_marca": 2,                ✅
  "marca": {                    ✅ Relación cargada
    "id_marca": 2,
    "nombre_marca": "Apple",
    "logo_marca": "apple.png"
  },
  ...
}
*/

-- =====================================================
-- VERIFICAR INTEGRIDAD DE DATOS
-- =====================================================

-- Productos con marca asignada
SELECT
  a.id_producto,
  a.nombre,
  a.modelo,
  m.nombre_marca
FROM tb_almacen a
LEFT JOIN tb_marcas m ON a.id_marca = m.id_marca
LIMIT 10;

-- Productos sin marca (NULL permitido)
SELECT COUNT(*) as sin_marca
FROM tb_almacen
WHERE id_marca IS NULL;

-- Marcas más usadas
SELECT
  m.nombre_marca,
  COUNT(a.id_producto) as cantidad_productos
FROM tb_marcas m
LEFT JOIN tb_almacen a ON m.id_marca = a.id_marca
GROUP BY m.id_marca, m.nombre_marca
ORDER BY cantidad_productos DESC;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

-- NOTA IMPORTANTE:
-- Esta migración NO requiere cambios en la base de datos.
-- Solo documenta los cambios necesarios en el código TypeScript.
-- Los campos 'modelo' e 'id_marca' ya existen en tb_almacen.
