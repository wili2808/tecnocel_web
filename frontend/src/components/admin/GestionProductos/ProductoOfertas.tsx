/**
 * Componente ProductoOfertas - Sección informativa de ofertas en el formulario de producto
 * Muestra las ofertas a las que pertenece el producto y permite removerlo
 */
import { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import type { OfertaDeProducto } from '../../../services/adminOfertaService';
import styles from './ProductoOfertas.module.css';

interface ProductoOfertasProps {
  idProducto: number;
}

/** Determina el estado visual de una oferta */
const getEstadoOferta = (oferta: OfertaDeProducto) => {
  if (!oferta.activo) return { label: 'Inactiva', className: styles.estadoInactiva };
  const now = new Date();
  const inicio = new Date(oferta.fecha_inicio);
  const fin = new Date(oferta.fecha_fin);
  if (now < inicio) return { label: 'Programada', className: styles.estadoProgramada };
  if (now > fin) return { label: 'Expirada', className: styles.estadoExpirada };
  return { label: 'Activa', className: styles.estadoActiva };
};

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ProductoOfertas = ({ idProducto }: ProductoOfertasProps) => {
  const { showNotification } = useNotification();
  const [ofertas, setOfertas] = useState<OfertaDeProducto[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      const data = await adminOfertaService.obtenerOfertasDeProducto(idProducto);
      setOfertas(data);
    } catch {
      showNotification('Error al cargar ofertas del producto', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOfertas();
  }, [idProducto]);

  const handleRemover = async (oferta: OfertaDeProducto) => {
    if (!confirm(`¿Remover este producto de la oferta "${oferta.nombre_oferta}"?`)) return;

    try {
      await adminOfertaService.removerProducto(oferta.id_oferta, idProducto);
      showNotification('Producto removido de la oferta', 'success');
      cargarOfertas();
    } catch (err: any) {
      showNotification(err.message || 'Error al remover de la oferta', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingSmall}>
        <p>Cargando ofertas...</p>
      </div>
    );
  }

  if (ofertas.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className="material-icons">info_outline</span>
        <p>Este producto no está asignado a ninguna oferta</p>
        <p className={styles.emptyHint}>
          Para asignar ofertas, ve a Gestión de Ofertas y agrega este producto desde allí
        </p>
      </div>
    );
  }

  return (
    <div className={styles.ofertasList}>
      {ofertas.map((oferta) => {
        const estado = getEstadoOferta(oferta);

        return (
          <div key={oferta.id_oferta} className={styles.ofertaCard}>
            <div className={styles.ofertaInfo}>
              <div className={styles.ofertaHeader}>
                <span className={styles.ofertaNombre}>{oferta.nombre_oferta}</span>
                <span className={`${styles.estadoBadge} ${estado.className}`}>
                  {estado.label}
                </span>
              </div>
              <div className={styles.ofertaDetalles}>
                <span className={styles.detalle}>
                  <span className="material-icons">discount</span>
                  {oferta.tipo_descuento === 'porcentaje'
                    ? `${oferta.valor_descuento}%`
                    : `${oferta.valor_descuento} BOB`
                  }
                </span>
                <span className={styles.detalle}>
                  <span className="material-icons">date_range</span>
                  {formatFecha(oferta.fecha_inicio)} — {formatFecha(oferta.fecha_fin)}
                </span>
                {oferta.es_precio_personalizado && oferta.precio_oferta != null && (
                  <span className={styles.detalle}>
                    <span className="material-icons">sell</span>
                    Precio personalizado: {oferta.precio_oferta} BOB
                  </span>
                )}
              </div>
            </div>
            <button
              className={styles.removeButton}
              title="Remover de esta oferta"
              onClick={() => handleRemover(oferta)}
            >
              <span className="material-icons">link_off</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ProductoOfertas;
