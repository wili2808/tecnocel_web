/**
 * Componente Favoritos - Gestión de productos favoritos del usuario
 * Permite visualizar, cargar y eliminar productos marcados como favoritos
 */
import { useFavoritosProductos } from '../../../hooks/useFavoritosProductos';
import { useFavoritosGlobal } from '../../../contexts/FavoritosGlobalContext';
import { useNotification } from '../../../contexts/NotificationContext';
import ProductCard from '../../product/ProductCard';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from './Favoritos.module.css';
import Button from '../../common/Button';

/**
 * Componente principal de la sección de favoritos
 * Gestiona la visualización, carga y eliminación de productos favoritos
 */
const Favoritos = () => {
  // ============================================================================
  // HOOKS Y ESTADO
  // ============================================================================
  const { productos, loading, error, hasMore, loadMore } = useFavoritosProductos();
  const { showNotification } = useNotification();
  const { removeAllFavoritos, syncWithBackend } = useFavoritosGlobal();

  // ============================================================================
  // FUNCIONES DE GESTIÓN DE FAVORITOS
  // ============================================================================

  /**
   * Elimina todos los productos favoritos del usuario
   * Utiliza el método optimizado del contexto global y sincroniza con backend
   */
  const handleRemoveAllFavorites = async () => {
    if (productos.length === 0) return;

    try {
      const productIds = productos.map((p) => p.id_producto);
      const success = await removeAllFavoritos(productIds);

      if (success) {
        await syncWithBackend();
        showNotification('Todos los favoritos han sido eliminados', 'success', 3000);
      } else {
        showNotification('Error al eliminar algunos favoritos', 'error', 5000);
      }
    } catch (error) {
      console.error('Error al eliminar todos los favoritos:', error);
      showNotification('Error al eliminar todos los favoritos', 'error', 5000);
    }
  };

  // ============================================================================
  // DEBUG Y LOGGING
  // ============================================================================

  // Debug: Verificar datos de productos cargados
  console.log(
    'Favoritos - Productos cargados:',
    productos.map((p) => ({
      id: p.id_producto,
      nombre: p.nombre,
      imagen_url: p.imagen_url,
      imagenes_count: p.imagenes?.length || 0,
      imagenes: p.imagenes,
    })),
  );

  // ============================================================================
  // RENDERIZADO CONDICIONAL - ESTADOS DE CARGA
  // ============================================================================

  // Estado de carga inicial
  if (loading && productos.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Favoritos</h2>
          <p className={styles.subtitle}>Tus productos favoritos</p>
        </div>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>Cargando tus productos favoritos...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Favoritos</h2>
          <p className={styles.subtitle}>Tus productos favoritos</p>
        </div>
        <div className={styles.errorContainer}>
          <span className="material-icons">error_outline</span>
          <p>Error al cargar favoritos: {error}</p>
          <button onClick={() => window.location.reload()} className={styles.btnPrimary}>
            <span className="material-icons">refresh</span>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Estado vacío - Sin favoritos
  if (productos.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Favoritos</h2>
          <p className={styles.subtitle}>Tus productos favoritos</p>
        </div>
        <div className={styles.emptyState}>
          <span className="material-icons">favorite_border</span>
          <h3>No tienes productos favoritos</h3>
          <p>Explora nuestro catálogo y agrega productos a tus favoritos</p>
          <a href="/productos" className={styles.btnPrimary}>
            <span className="material-icons">storefront</span>
            Explorar productos
          </a>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZADO PRINCIPAL - LISTA DE FAVORITOS
  // ============================================================================

  return (
    <div className={styles.container}>
      {/* Encabezado de sección con contador y botón de eliminación masiva */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2 className={styles.title}>Favoritos</h2>
          <span className={styles.itemCount}>({productos.length})</span>
        </div>

        {/* Botón para eliminar todos los favoritos */}
        <Button
          ariaLabel="Eliminar todos los favoritos"
          onClick={handleRemoveAllFavorites}
          icon="delete_sweep"
          variant="danger"
          size="xs"
        >
          Eliminar todos
        </Button>
      </div>

      {/* Grid de productos favoritos */}
      <div className={styles.favoritesGrid}>
        {productos.map((producto) => (
          <div key={producto.id_producto} className={styles.favoriteItem}>
            <ProductCard
              id_producto={producto.id_producto}
              nombre={producto.nombre}
              descripcion={producto.descripcion}
              imagen_url={producto.imagen_url}
              imagenes={producto.imagenes}
              precio_venta={producto.precio_venta}
              stock={producto.stock}
              precio_original={producto.precio_original}
              precio_oferta={producto.precio_oferta}
              descuento_porcentaje={producto.descuento_porcentaje}
              en_oferta={producto.en_oferta}
            />
          </div>
        ))}
      </div>

      {/* Botón de carga adicional - Solo visible si hay más productos */}
      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button onClick={loadMore} disabled={loading} className={styles.btnSecondary}>
            {loading ? (
              <>
                <LoadingSpinner />
                Cargando...
              </>
            ) : (
              <>
                <span className="material-icons">expand_more</span>
                Cargar más
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Favoritos;
