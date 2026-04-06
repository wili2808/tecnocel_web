import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import commentService from '../../../services/commentService';
import adminCommentService from '../../../services/adminCommentService';
import uploadService from '../../../services/uploadService';
import type { Comentario, EstadisticasComentarios, Respuesta } from '../../../services/commentService';
import CommentForm from './CommentForm';
import CommentCard from './CommentCard';
import CommentStats from './CommentStats';
import CommentFilters from './CommentFilters';
import LoadingSpinner from '../../common/LoadingSpinner';
import Button from '../../common/Button';
import styles from './ProductComments.module.css';

import { AnimatePresence, motion } from 'framer-motion';

interface ProductCommentsProps {
  productId: number;
  productName: string;
}

const ProductComments: React.FC<ProductCommentsProps> = ({ productId, productName }) => {
  const { user, isAuthenticated, isSystemUser } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasComentarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [orden, setOrden] = useState<'recientes' | 'antiguos' | 'mejor_calificacion' | 'peor_calificacion'>(
    'recientes',
  );
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

  const COMENTARIOS_POR_PAGINA = 10;

  // Cargar comentarios
  const cargarComentarios = async (pagina: number = 0, nuevoOrden?: typeof orden) => {
    try {
      setLoading(true);
      setError(null);

      const response = await commentService.getComentariosProducto(productId, {
        limite: COMENTARIOS_POR_PAGINA,
        offset: pagina * COMENTARIOS_POR_PAGINA,
        orden: nuevoOrden || orden,
        incluirOcultos: isSystemUser,
      });

      setComentarios(response.datos.comentarios);
      setEstadisticas(response.datos.estadisticas);
      setTotalPaginas(response.datos.paginacion.paginas);
      setCurrentPage(pagina);
    } catch (err) {
      setError('Error al cargar los comentarios. Por favor, intenta nuevamente.');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar comentarios iniciales
  useEffect(() => {
    cargarComentarios();
  }, [productId]);

  // Manejar cambio de orden
  const handleOrdenChange = (nuevoOrden: typeof orden) => {
    setOrden(nuevoOrden);
    cargarComentarios(0, nuevoOrden);
  };

  // Manejar cambio de página
  const handlePageChange = (nuevaPagina: number) => {
    cargarComentarios(nuevaPagina);
  };

  // Manejar envío de nuevo comentario
  const handleComentarioSubmit = async (datos: { comentario: string; calificacion?: number; imagenes?: File[] }) => {
    if (!user) return;

    try {
      setSubmittingComment(true);
      setError(null);

      // Procesar imágenes si las hay
      let imagenesData: any[] = [];
      if (datos.imagenes && datos.imagenes.length > 0) {
        try {
          // Subir imágenes realmente al servidor
          const imagenesSubidas = await uploadService.uploadCommentImages(datos.imagenes);
          imagenesData = imagenesSubidas;
        } catch (uploadError) {
          console.error('Error al subir imágenes:', uploadError);
          setError(
            `Error al subir imágenes: ${uploadError instanceof Error ? uploadError.message : 'Error desconocido'}`,
          );
          return;
        }
      }

      await commentService.crearComentario({
        id_producto: productId,
        id_cliente: user.id,
        comentario: datos.comentario,
        calificacion: datos.calificacion,
        imagenes: imagenesData,
      });

      // Recargar comentarios para mostrar el nuevo
      await cargarComentarios(0);
      setShowForm(false);
    } catch (err) {
      setError('Error al enviar el comentario. Por favor, intenta nuevamente.');
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Manejar eliminación de comentario
  const handleEliminarComentario = async (idComentario: number) => {
    try {
      if (isSystemUser) {
        // System users need eliminar_comentarios permission to delete comments
        await adminCommentService.eliminarComentarioAdmin(idComentario);
      } else {
        await commentService.eliminarComentario(idComentario);
      }
      await cargarComentarios(currentPage);
    } catch (err) {
      setError('Error al eliminar el comentario.');
      console.error('Error deleting comment:', err);
    }
  };

  // Manejar edición de comentario
  const handleEditarComentario = async (
    idComentario: number,
    datos: { comentario?: string; calificacion?: number; imagenes?: any[] },
  ) => {
    try {
      await commentService.actualizarComentario(idComentario, datos);

      // Recargar comentarios después de confirmar la edición
      await cargarComentarios(currentPage);

      // Limpiar el estado de edición
      setEditingCommentId(null);

      console.log('✅ Comentario actualizado, recargando comentarios');
    } catch (err) {
      setError('Error al actualizar el comentario.');
      console.error('Error updating comment:', err);
    }
  };

  // Manejar inicio de edición de comentario
  const handleIniciarEdicion = (idComentario: number) => {
    setEditingCommentId(idComentario);
    console.log('✏️ Iniciando edición del comentario:', idComentario);
  };

  // Manejar cancelación de edición de comentario
  const handleCancelarEdicion = () => {
    setEditingCommentId(null);
    console.log('❌ Cancelando edición');
  };

  // Manejar cambios en respuestas de un comentario
  const handleRepliesChange = (idComentario: number, nuevasRespuestas: Respuesta[]) => {
    setComentarios((prev) =>
      prev.map((c) => (c.id_comentario === idComentario ? { ...c, respuestas: nuevasRespuestas } : c)),
    );
  };

  // Manejar eliminación de imagen de comentario
  const handleEliminarImagenComentario = async (idComentario: number, idImagen: number) => {
    try {
      await commentService.eliminarImagenComentario(idComentario, idImagen);

      // Si el comentario está en modo de edición, no recargar comentarios
      // Solo actualizar el estado local del comentario específico
      if (editingCommentId === idComentario) {
        setComentarios((prevComentarios) =>
          prevComentarios.map((comentario) => {
            if (comentario.id_comentario === idComentario) {
              return {
                ...comentario,
                imagenes: comentario.imagenes?.filter((img) => img.id_imagen !== idImagen) || [],
              };
            }
            return comentario;
          }),
        );
        console.log('🔄 Imagen eliminada, actualizando estado local sin recargar');
      } else {
        // Si no está en edición, recargar comentarios normalmente
        await cargarComentarios(currentPage);
      }
    } catch (err) {
      setError('Error al eliminar la imagen del comentario.');
      console.error('Error deleting comment image:', err);
    }
  };

  if (loading && comentarios.length === 0) {
    return (
      <div className={styles.productComments}>
        <h3 className={styles.sectionTitle}>Comentarios y preguntas</h3>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.productComments}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Comentarios y preguntas</h3>
        {user && (
          <Button size="xs" onClick={() => setShowForm(!showForm)}>
            <span className="material-icons">add_comment</span>
            {showForm ? 'Cancelar' : 'Escribir comentario'}
          </Button>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      {/* Formulario de nuevo comentario */}
      <AnimatePresence>
        {showForm && user && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }} // Importante para que no salte el texto
          >
            <CommentForm
              productName={productName}
              onSubmit={handleComentarioSubmit}
              isSubmitting={submittingComment}
              className={styles.commentForm}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estadísticas */}
      {estadisticas && <CommentStats estadisticas={estadisticas} className={styles.statsSection} />}

      {/* Filtros y ordenamiento */}
      {comentarios.length > 0 && (
        <CommentFilters
          orden={orden}
          onOrdenChange={handleOrdenChange}
          totalComentarios={estadisticas?.total_comentarios || 0}
          className={styles.filtersSection}
        />
      )}

      {/* Mensaje para usuarios no autenticados */}
      {!user && (
        <div className={styles.loginPrompt}>
          <span className="material-icons">account_circle</span>
          <p>Inicia sesión para escribir un comentario</p>
        </div>
      )}

      {/* Lista de comentarios */}
      <div className={styles.commentsList}>
        {loading && <LoadingSpinner />}

        {!loading && comentarios.length === 0 && (
          <div className={styles.noComments}>
            <div className={styles.noCommentsIcon}>
              <span className="material-icons">chat_bubble_outline</span>
            </div>
            <h4>Sin comentarios aún</h4>
            <p>Sé el primero en comentar sobre este producto</p>
          </div>
        )}

        {!loading && comentarios.length > 0 && (
          <>
            {comentarios.map((comentario) => (
              <CommentCard
                key={comentario.id_comentario}
                comentario={comentario}
                currentUserId={user?.id}
                currentSystemUserId={user?.id}
                onDelete={handleEliminarComentario}
                onEdit={handleEditarComentario}
                onImageDelete={handleEliminarImagenComentario}
                onStartEdit={handleIniciarEdicion}
                onCancelEdit={handleCancelarEdicion}
                isEditing={editingCommentId === comentario.id_comentario}
                className={styles.commentCard}
                isSystemUser={isSystemUser}
                isAuthenticated={isAuthenticated}
                onRepliesChange={handleRepliesChange}
                onModerate={() => cargarComentarios(currentPage)}
              />
            ))}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={styles.pageButton}
                >
                  <span className="material-icons">chevron_left</span>
                  Anterior
                </button>

                <span className={styles.pageInfo}>
                  Página {currentPage + 1} de {totalPaginas}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPaginas - 1}
                  className={styles.pageButton}
                >
                  Siguiente
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductComments;
