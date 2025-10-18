**[Documentación](../../README.md)** | **[Inicio](../../../README.md)**

---

# Guía del Sistema de Comentarios y Calificaciones

> Guía completa para implementar reseñas de productos con calificaciones, imágenes y estadísticas en TecnoCel Web.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [1. Obtener Comentarios de un Producto](#1-obtener-comentarios-de-un-producto)
- [2. Obtener Estadísticas de Calificaciones](#2-obtener-estadísticas-de-calificaciones)
- [3. Crear un Comentario](#3-crear-un-comentario)
- [4. Actualizar un Comentario](#4-actualizar-un-comentario)
- [5. Eliminar un Comentario](#5-eliminar-un-comentario)
- [6. Gestión de Imágenes en Comentarios](#6-gestión-de-imágenes-en-comentarios)
- [Flujo Completo de Reseña con Imágenes](#flujo-completo-de-reseña-con-imágenes)
- [Componente de Reseñas Frontend](#componente-de-reseñas-frontend)
- [Visualización de Estadísticas](#visualización-de-estadísticas)
- [Validación y Moderación](#validación-y-moderación)
- [Buenas Prácticas](#buenas-prácticas)

---

## Visión General

El sistema de comentarios y reseñas de TecnoCel Web permite a los clientes:

### Características del Sistema

- **Comentarios de texto**: Entre 10 y 2000 caracteres
- **Calificaciones**: Sistema de 1 a 5 estrellas (opcional)
- **Imágenes adjuntas**: Hasta 5 imágenes por comentario
- **Paginación y ordenamiento**: Flexibilidad en la visualización
- **Estadísticas agregadas**: Promedio de calificaciones y distribución
- **Edición y eliminación**: Los usuarios pueden gestionar sus propias reseñas
- **Soft delete**: Los comentarios eliminados se mantienen en BD

### Estados de Comentarios

| Estado | Descripción |
|--------|-------------|
| `activo` | Comentario visible públicamente |
| `eliminado` | Comentario eliminado por el usuario (soft delete) |
| `moderado` | Comentario oculto por moderación (futura implementación) |

---

## Arquitectura del Sistema

### Modelos de Base de Datos

**Comentario**:
```typescript
{
  id_comentario: number;
  id_producto: number;
  id_cliente: number;
  comentario: string;
  calificacion: number | null;  // 1-5 estrellas (opcional)
  es_verificado: boolean;
  estado: 'activo' | 'eliminado';
  id_admin_respuesta: number | null;  // Para respuestas de admin
  fyh_creacion: Date;
  fyh_actualizacion: Date;
}
```

**ComentarioImagen**:
```typescript
{
  id_imagen: number;
  id_comentario: number;
  url_imagen: string;
  alt_text: string;
  fyh_creacion: Date;
}
```

### Relaciones

- Un **Comentario** pertenece a un **Cliente** y un **Producto**
- Un **Comentario** puede tener múltiples **ComentarioImagen** (hasta 5)
- Un **Usuario** (admin) puede responder a un **Comentario**

---

## 1. Obtener Comentarios de un Producto

### Endpoint

```
GET /api/comentarios/producto/:id_producto
```

**Autenticación**: No requerida

**Params**: `id_producto` - ID del producto

**Query Parameters**:

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limite` | number | 10 | Límite de comentarios (1-50) |
| `offset` | number | 0 | Offset para paginación |
| `orden` | string | recientes | Ordenamiento: `recientes`, `antiguos`, `mejor_calificacion`, `peor_calificacion` |

**Descripción**: Retorna comentarios activos del producto con:
- Información del cliente autor
- Imágenes adjuntas con URLs transformadas
- Respuestas de administradores (si existen)
- Paginación y estadísticas

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Comentarios obtenidos exitosamente",
  "datos": {
    "comentarios": [
      {
        "id_comentario": 15,
        "id_producto": 45,
        "id_cliente": 3,
        "comentario": "Excelente producto, superó mis expectativas. La cámara es increíble y la batería dura todo el día.",
        "calificacion": 5,
        "es_verificado": false,
        "estado": "activo",
        "fyh_creacion": "2025-10-10T14:30:00.000Z",
        "fyh_actualizacion": "2025-10-10T14:30:00.000Z",
        "cliente": {
          "nombre_cliente": "Juan",
          "apellido_cliente": "Pérez"
        },
        "imagenes": [
          {
            "id_imagen": 42,
            "url_imagen": "comment_1710344521000_abc123.jpg",
            "alt_text": "Foto del producto en uso",
            "imagen_url": "http://localhost:3000/api/uploads/comentarios/comment_1710344521000_abc123.jpg"
          }
        ],
        "adminRespuesta": null
      },
      {
        "id_comentario": 14,
        "comentario": "Buen producto pero el precio es algo elevado.",
        "calificacion": 4,
        "cliente": {
          "nombre_cliente": "María",
          "apellido_cliente": "González"
        },
        "imagenes": [],
        "adminRespuesta": {
          "nombres": "Admin TecnoCel"
        }
      }
    ],
    "paginacion": {
      "total": 45,
      "limite": 10,
      "offset": 0,
      "paginas": 5
    },
    "estadisticas": {
      "total_comentarios": 45,
      "total_calificaciones": 40,
      "calificacion_promedio": 4.3,
      "distribucion_calificaciones": {
        "1": 2,
        "2": 3,
        "3": 5,
        "4": 15,
        "5": 15
      },
      "total_imagenes": 78
    }
  }
}
```

### Ejemplo con JavaScript

```javascript
async function obtenerComentarios(idProducto, opciones = {}) {
  const {
    limite = 10,
    offset = 0,
    orden = 'recientes'
  } = opciones;

  try {
    const params = new URLSearchParams({ limite, offset, orden });
    const response = await fetch(
      `http://localhost:3000/api/comentarios/producto/${idProducto}?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.datos;
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    throw error;
  }
}

// Uso
const { comentarios, paginacion, estadisticas } = await obtenerComentarios(45, {
  limite: 5,
  orden: 'mejor_calificacion'
});
```

---

## 2. Obtener Estadísticas de Calificaciones

### Endpoint

```
GET /api/comentarios/producto/:id_producto/estadisticas
```

**Autenticación**: No requerida

**Params**: `id_producto` - ID del producto

**Descripción**: Retorna estadísticas agregadas de los comentarios activos del producto.

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Estadísticas obtenidas exitosamente",
  "datos": {
    "total_comentarios": 45,
    "total_calificaciones": 40,
    "calificacion_promedio": 4.3,
    "distribucion_calificaciones": {
      "1": 2,
      "2": 3,
      "3": 5,
      "4": 15,
      "5": 15
    },
    "total_imagenes": 78
  }
}
```

### Ejemplo con JavaScript

```javascript
async function obtenerEstadisticas(idProducto) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/comentarios/producto/${idProducto}/estadisticas`
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.datos;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
const stats = await obtenerEstadisticas(45);
console.log(`Calificación promedio: ${stats.calificacion_promedio} ⭐`);
```

---

## 3. Crear un Comentario

### Endpoint

```
POST /api/comentarios
```

**Autenticación**: **Requerida** (verificarTokenCliente)

**Headers**: `Authorization: Bearer <JWT>`

**Body**:

```json
{
  "id_producto": 45,
  "id_cliente": 3,
  "comentario": "Excelente producto, superó mis expectativas. La cámara es increíble.",
  "calificacion": 5,
  "imagenes": [
    {
      "url_imagen": "comment_1710344521000_abc123.jpg",
      "alt_text": "Foto del producto en uso"
    }
  ]
}
```

**Validaciones**:
- ✅ `comentario`: 10-2000 caracteres
- ✅ `calificacion`: 1-5 (opcional)
- ✅ `imagenes`: Máximo 5 (opcional)
- ✅ Producto y cliente deben existir

**Respuesta Exitosa (201)**:

```json
{
  "mensaje": "Comentario creado exitosamente",
  "datos": {
    "comentario": {
      "id_comentario": 15,
      "id_producto": 45,
      "id_cliente": 3,
      "comentario": "Excelente producto, superó mis expectativas...",
      "calificacion": 5,
      "es_verificado": false,
      "estado": "activo",
      "fyh_creacion": "2025-10-15T14:30:00.000Z",
      "cliente": {
        "nombre_cliente": "Juan",
        "apellido_cliente": "Pérez"
      },
      "imagenes": [
        {
          "id_imagen": 42,
          "url_imagen": "comment_1710344521000_abc123.jpg",
          "imagen_url": "http://localhost:3000/api/uploads/comentarios/..."
        }
      ]
    }
  }
}
```

**Errores Comunes**:

```json
// 400: Comentario muy corto
{
  "mensaje": "Comentario inválido",
  "error": "El comentario debe tener entre 10 y 2000 caracteres"
}

// 400: Calificación inválida
{
  "mensaje": "Calificación inválida",
  "error": "La calificación debe estar entre 1 y 5"
}

// 400: Demasiadas imágenes
{
  "mensaje": "Demasiadas imágenes",
  "error": "Máximo 5 imágenes por comentario"
}

// 404: Producto no existe
{
  "mensaje": "Producto no encontrado",
  "error": "El producto especificado no existe"
}
```

### Ejemplo con JavaScript

```javascript
async function crearComentario(token, comentarioData) {
  try {
    const response = await fetch('http://localhost:3000/api/comentarios', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(comentarioData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear comentario');
    }

    const data = await response.json();
    return data.datos.comentario;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
const nuevoComentario = await crearComentario(miToken, {
  id_producto: 45,
  id_cliente: 3,
  comentario: "Excelente producto, muy recomendado",
  calificacion: 5,
  imagenes: [] // Sin imágenes por ahora
});
```

---

## 4. Actualizar un Comentario

### Endpoint

```
PUT /api/comentarios/:id_comentario
```

**Autenticación**: **Requerida** (solo el propietario puede actualizar)

**Headers**: `Authorization: Bearer <JWT>`

**Params**: `id_comentario` - ID del comentario a actualizar

**Body** (todos los campos son opcionales):

```json
{
  "comentario": "Actualizo mi opinión: el producto es aún mejor de lo que esperaba",
  "calificacion": 5,
  "imagenes_a_eliminar": [1, 2],
  "imagenes": [
    {
      "ruta_imagen": "nueva_imagen.jpg",
      "alt_text": "Nueva foto"
    }
  ]
}
```

**Validaciones**:
- Solo el propietario del comentario puede actualizarlo
- Si se actualiza `comentario`: 10-2000 caracteres
- Si se actualiza `calificacion`: 1-5

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Comentario actualizado exitosamente",
  "datos": {
    "comentario": {
      "id_comentario": 15,
      "comentario": "Actualizo mi opinión: el producto es aún mejor...",
      "calificacion": 5,
      "fyh_actualizacion": "2025-10-15T15:45:00.000Z",
      "imagenes": [
        {
          "id_imagen": 43,
          "url_imagen": "nueva_imagen.jpg",
          "imagen_url": "http://localhost:3000/api/uploads/comentarios/..."
        }
      ]
    }
  }
}
```

### Ejemplo con JavaScript

```javascript
async function actualizarComentario(token, idComentario, cambios) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/comentarios/${idComentario}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cambios)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar');
    }

    const data = await response.json();
    return data.datos.comentario;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
const actualizado = await actualizarComentario(miToken, 15, {
  calificacion: 5,
  comentario: "Después de usarlo más tiempo, confirmo que es excelente"
});
```

---

## 5. Eliminar un Comentario

### Endpoint

```
DELETE /api/comentarios/:id_comentario
```

**Autenticación**: **Requerida** (solo el propietario puede eliminar)

**Headers**: `Authorization: Bearer <JWT>`

**Params**: `id_comentario` - ID del comentario a eliminar

**Descripción**:
- Realiza soft delete (marca como "eliminado")
- Elimina archivos físicos de imágenes del servidor
- Elimina registros de imágenes de la BD

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Comentario eliminado exitosamente",
  "datos": {
    "imagenes_eliminadas": 3,
    "archivos_eliminados": 3
  }
}
```

### Ejemplo con JavaScript

```javascript
async function eliminarComentario(token, idComentario) {
  if (!confirm('¿Estás seguro de eliminar este comentario?')) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/comentarios/${idComentario}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al eliminar comentario');
    }

    const data = await response.json();
    console.log(data.mensaje);
    return data.datos;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
await eliminarComentario(miToken, 15);
```

---

## 6. Gestión de Imágenes en Comentarios

### Eliminar Imagen Individual

```
DELETE /api/comentarios/:id_comentario/imagenes/:id_imagen
```

**Autenticación**: **Requerida** (solo el propietario del comentario)

**Headers**: `Authorization: Bearer <JWT>`

**Params**:
- `id_comentario` - ID del comentario
- `id_imagen` - ID de la imagen a eliminar

**Respuesta Exitosa (200)**:

```json
{
  "mensaje": "Imagen eliminada exitosamente",
  "datos": {
    "id_imagen": 42,
    "archivo_eliminado": true
  }
}
```

### Ejemplo con JavaScript

```javascript
async function eliminarImagenComentario(token, idComentario, idImagen) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/comentarios/${idComentario}/imagenes/${idImagen}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al eliminar imagen');
    }

    const data = await response.json();
    return data.datos;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## Flujo Completo de Reseña con Imágenes

### Paso a Paso

```javascript
// 1. Subir imágenes primero
async function publicarReseñaCompleta(token, idProducto, idCliente, comentarioTexto, calificacion, archivosImagenes) {
  try {
    // Paso 1: Subir imágenes
    let imagenesSubidas = [];
    if (archivosImagenes && archivosImagenes.length > 0) {
      const formData = new FormData();
      archivosImagenes.forEach(archivo => {
        formData.append('imagenes', archivo);
      });

      const responseImagenes = await fetch(
        'http://localhost:3000/api/upload/comment-images',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (responseImagenes.ok) {
        const dataImagenes = await responseImagenes.json();
        imagenesSubidas = dataImagenes.datos.imagenes;
      }
    }

    // Paso 2: Crear comentario con las imágenes
    const comentarioData = {
      id_producto: idProducto,
      id_cliente: idCliente,
      comentario: comentarioTexto,
      calificacion: calificacion,
      imagenes: imagenesSubidas
    };

    const comentario = await crearComentario(token, comentarioData);
    return comentario;
  } catch (error) {
    console.error('Error en flujo completo:', error);
    throw error;
  }
}

// Uso
const nuevaReseña = await publicarReseñaCompleta(
  miToken,
  45,  // ID del producto
  3,   // ID del cliente
  "Excelente producto, muy satisfecho con la compra",
  5,   // 5 estrellas
  [archivo1, archivo2]  // Archivos File del input
);
```

---

## Componente de Reseñas Frontend

### Componente React Completo

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

function ReviewsSection({ productoId }) {
  const { token, user } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [orden, setOrden] = useState('recientes');

  // Estado del formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [calificacion, setCalificacion] = useState(0);
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarComentarios();
  }, [productoId, paginaActual, orden]);

  async function cargarComentarios() {
    setLoading(true);
    try {
      const data = await obtenerComentarios(productoId, {
        limite: 5,
        offset: (paginaActual - 1) * 5,
        orden: orden
      });

      setComentarios(data.comentarios);
      setEstadisticas(data.estadisticas);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();

    if (nuevoComentario.length < 10) {
      alert('El comentario debe tener al menos 10 caracteres');
      return;
    }

    setEnviando(true);
    try {
      await publicarReseñaCompleta(
        token,
        productoId,
        user.id_cliente,
        nuevoComentario,
        calificacion || null,
        imagenesSeleccionadas
      );

      // Limpiar formulario
      setNuevoComentario('');
      setCalificacion(0);
      setImagenesSeleccionadas([]);
      setMostrarFormulario(false);

      // Recargar comentarios
      await cargarComentarios();
      alert('¡Reseña publicada exitosamente!');
    } catch (error) {
      alert('Error al publicar reseña: ' + error.message);
    } finally {
      setEnviando(false);
    }
  }

  function handleImagenesChange(e) {
    const archivos = Array.from(e.target.files);
    if (archivos.length > 5) {
      alert('Máximo 5 imágenes por comentario');
      return;
    }
    setImagenesSeleccionadas(archivos);
  }

  function renderEstrellas(rating) {
    return (
      <div className="estrellas">
        {[1, 2, 3, 4, 5].map(estrella => (
          <span
            key={estrella}
            className={estrella <= rating ? 'estrella-llena' : 'estrella-vacia'}
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  if (loading) {
    return <div>Cargando reseñas...</div>;
  }

  return (
    <div className="reviews-section">
      <h2>Opiniones de Clientes</h2>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="reviews-stats">
          <div className="promedio">
            <h3>{estadisticas.calificacion_promedio}</h3>
            {renderEstrellas(Math.round(estadisticas.calificacion_promedio))}
            <p>{estadisticas.total_calificaciones} calificaciones</p>
          </div>

          <div className="distribucion">
            {[5, 4, 3, 2, 1].map(estrella => (
              <div key={estrella} className="barra-distribucion">
                <span>{estrella}★</span>
                <div className="barra">
                  <div
                    className="barra-fill"
                    style={{
                      width: `${(estadisticas.distribucion_calificaciones[estrella] / estadisticas.total_calificaciones) * 100}%`
                    }}
                  />
                </div>
                <span>{estadisticas.distribucion_calificaciones[estrella]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de nueva reseña */}
      {token && (
        <div className="nueva-review">
          {!mostrarFormulario ? (
            <button onClick={() => setMostrarFormulario(true)}>
              Escribir una reseña
            </button>
          ) : (
            <form onSubmit={handleSubmitReview}>
              <h3>Tu opinión</h3>

              {/* Selector de calificación */}
              <div className="rating-selector">
                <label>Calificación (opcional):</label>
                <div className="estrellas-input">
                  {[1, 2, 3, 4, 5].map(estrella => (
                    <button
                      key={estrella}
                      type="button"
                      className={estrella <= calificacion ? 'seleccionada' : ''}
                      onClick={() => setCalificacion(estrella)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Área de texto */}
              <textarea
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Comparte tu experiencia con este producto (mínimo 10 caracteres)"
                minLength={10}
                maxLength={2000}
                rows={5}
                required
              />
              <small>{nuevoComentario.length} / 2000 caracteres</small>

              {/* Subir imágenes */}
              <div className="imagenes-input">
                <label>Adjuntar imágenes (opcional, máx 5):</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleImagenesChange}
                />
                {imagenesSeleccionadas.length > 0 && (
                  <p>{imagenesSeleccionadas.length} imagen(es) seleccionada(s)</p>
                )}
              </div>

              <div className="form-buttons">
                <button type="submit" disabled={enviando}>
                  {enviando ? 'Publicando...' : 'Publicar Reseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setNuevoComentario('');
                    setCalificacion(0);
                    setImagenesSeleccionadas([]);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Ordenamiento */}
      <div className="reviews-controls">
        <label>Ordenar por:</label>
        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
          <option value="mejor_calificacion">Mejor calificación</option>
          <option value="peor_calificacion">Peor calificación</option>
        </select>
      </div>

      {/* Lista de comentarios */}
      <div className="reviews-list">
        {comentarios.map(comentario => (
          <div key={comentario.id_comentario} className="review-card">
            <div className="review-header">
              <div>
                <strong>
                  {comentario.cliente.nombre_cliente} {comentario.cliente.apellido_cliente}
                </strong>
                {comentario.es_verificado && (
                  <span className="badge-verificado">✓ Compra verificada</span>
                )}
              </div>
              {comentario.calificacion && renderEstrellas(comentario.calificacion)}
              <small>{new Date(comentario.fyh_creacion).toLocaleDateString()}</small>
            </div>

            <p className="review-text">{comentario.comentario}</p>

            {/* Imágenes del comentario */}
            {comentario.imagenes && comentario.imagenes.length > 0 && (
              <div className="review-images">
                {comentario.imagenes.map(imagen => (
                  <img
                    key={imagen.id_imagen}
                    src={imagen.imagen_url}
                    alt={imagen.alt_text}
                    onClick={() => abrirImagenModal(imagen.imagen_url)}
                  />
                ))}
              </div>
            )}

            {/* Respuesta del admin */}
            {comentario.adminRespuesta && (
              <div className="admin-response">
                <strong>Respuesta de {comentario.adminRespuesta.nombres}:</strong>
                <p>{comentario.respuesta_admin}</p>
              </div>
            )}

            {/* Acciones del usuario */}
            {user && user.id_cliente === comentario.id_cliente && (
              <div className="review-actions">
                <button onClick={() => editarComentario(comentario)}>
                  Editar
                </button>
                <button onClick={() => eliminarComentario(token, comentario.id_comentario)}>
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paginación */}
      {estadisticas && estadisticas.total_comentarios > 5 && (
        <div className="paginacion">
          <button
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual(paginaActual - 1)}
          >
            Anterior
          </button>
          <span>Página {paginaActual}</span>
          <button
            disabled={paginaActual * 5 >= estadisticas.total_comentarios}
            onClick={() => setPaginaActual(paginaActual + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewsSection;
```

---

## Visualización de Estadísticas

### Componente de Rating Summary

```jsx
function RatingSummary({ estadisticas }) {
  if (!estadisticas) return null;

  const { calificacion_promedio, total_calificaciones, distribucion_calificaciones } = estadisticas;

  return (
    <div className="rating-summary">
      <div className="rating-main">
        <h2>{calificacion_promedio.toFixed(1)}</h2>
        <div className="estrellas">
          {renderEstrellas(Math.round(calificacion_promedio))}
        </div>
        <p>{total_calificaciones} opiniones</p>
      </div>

      <div className="rating-bars">
        {[5, 4, 3, 2, 1].map(estrella => {
          const cantidad = distribucion_calificaciones[estrella] || 0;
          const porcentaje = total_calificaciones > 0
            ? (cantidad / total_calificaciones) * 100
            : 0;

          return (
            <div key={estrella} className="rating-bar-row">
              <span className="star-label">{estrella}⭐</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <span className="count">{cantidad}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Validación y Moderación

### Validación de Contenido (Cliente)

```javascript
function validarComentario(texto) {
  const errores = [];

  // Longitud
  if (texto.length < 10) {
    errores.push('El comentario debe tener al menos 10 caracteres');
  }
  if (texto.length > 2000) {
    errores.push('El comentario no puede exceder 2000 caracteres');
  }

  // Contenido ofensivo básico (mejora con lista más completa)
  const palabrasProhibidas = ['spam', 'ofensa', 'etc'];
  const contieneProhibidas = palabrasProhibidas.some(palabra =>
    texto.toLowerCase().includes(palabra)
  );
  if (contieneProhibidas) {
    errores.push('El comentario contiene palabras no permitidas');
  }

  return errores;
}

// Uso
const errores = validarComentario(nuevoComentario);
if (errores.length > 0) {
  alert('Errores:\n' + errores.join('\n'));
  return;
}
```

### Moderación (Futuro - Admin)

```javascript
// Endpoints futuros para administradores

// Marcar como verificado
// POST /api/comentarios/:id/verificar

// Responder a comentario
// POST /api/comentarios/:id/respuesta

// Moderar (ocultar)
// PATCH /api/comentarios/:id/moderar
```

---

## Buenas Prácticas

### 1. Prevenir Spam

```javascript
// Limitar frecuencia de comentarios por usuario
const COOLDOWN_MINUTOS = 5;

function puedeComentarDeNuevo(ultimoComentario) {
  if (!ultimoComentario) return true;

  const ahora = new Date();
  const ultimo = new Date(ultimoComentario.fyh_creacion);
  const diferencia = (ahora - ultimo) / 1000 / 60; // minutos

  return diferencia >= COOLDOWN_MINUTOS;
}
```

### 2. Optimistic UI Updates

```javascript
async function eliminarComentarioOptimista(idComentario) {
  // Actualizar UI inmediatamente
  setComentarios(comentarios.filter(c => c.id_comentario !== idComentario));

  try {
    await eliminarComentario(token, idComentario);
  } catch (error) {
    // Revertir si falla
    await cargarComentarios();
    alert('Error al eliminar comentario');
  }
}
```

### 3. Mostrar Indicadores de Carga

```javascript
function ComentarioCard({ comentario, onEliminar }) {
  const [eliminando, setEliminando] = useState(false);

  async function handleEliminar() {
    if (!confirm('¿Eliminar comentario?')) return;

    setEliminando(true);
    try {
      await onEliminar(comentario.id_comentario);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className={eliminando ? 'eliminando' : ''}>
      {/* Contenido del comentario */}
      <button onClick={handleEliminar} disabled={eliminando}>
        {eliminando ? 'Eliminando...' : 'Eliminar'}
      </button>
    </div>
  );
}
```

### 4. Validación de Imágenes

```javascript
function validarImagenesComentario(archivos) {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_COUNT = 5;
  const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (archivos.length > MAX_COUNT) {
    throw new Error(`Máximo ${MAX_COUNT} imágenes`);
  }

  archivos.forEach((archivo, index) => {
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      throw new Error(`Tipo de archivo no permitido: ${archivo.name}`);
    }
    if (archivo.size > MAX_SIZE) {
      throw new Error(`Archivo demasiado grande: ${archivo.name}`);
    }
  });

  return true;
}
```

### 5. Caché de Comentarios

```javascript
const CACHE_COMENTARIOS = new Map();

async function obtenerComentariosConCache(idProducto, opciones) {
  const cacheKey = `${idProducto}-${JSON.stringify(opciones)}`;
  const cached = CACHE_COMENTARIOS.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) { // 1 minuto
    return cached.data;
  }

  const data = await obtenerComentarios(idProducto, opciones);
  CACHE_COMENTARIOS.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
}
```

---

**Última actualización**: 15 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

**Relacionado con**:
- [API Reference](../README.md)
- [Endpoints de Comentarios](../endpoints/comentarios.md)
- [Guía de Carga de Imágenes](./IMAGE_UPLOAD.md)
- [Guía de Autenticación](./AUTHENTICATION.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
