/**
 * Página de confirmación de orden
 * Muestra detalles de la compra exitosa
 */
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './OrderConfirmation.module.css';

const OrderConfirmation = () => {
  const { id_venta } = useParams<{ id_venta: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id_venta) {
      navigate('/');
    }
  }, [id_venta, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>
          <span className="material-icons">check_circle</span>
        </div>

        <h1 className={styles.title}>¡Compra realizada con éxito!</h1>
        <p className={styles.subtitle}>
          Tu pedido ha sido confirmado y está siendo procesado
        </p>

        <div className={styles.orderNumber}>
          <span className={styles.orderLabel}>Número de pedido:</span>
          <span className={styles.orderValue}>#{id_venta?.padStart(5, '0')}</span>
        </div>

        <div className={styles.divider}></div>

        {/* Información adicional */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <span className="material-icons">email</span>
            <p>Te enviamos un correo con los detalles de tu pedido</p>
          </div>
          <div className={styles.infoCard}>
            <span className="material-icons">schedule</span>
            <p>Recibirás actualizaciones sobre el estado de tu envío</p>
          </div>
          <div className={styles.infoCard}>
            <span className="material-icons">headset_mic</span>
            <p>¿Necesitas ayuda? Contáctanos por WhatsApp</p>
          </div>
        </div>

        {/* Acciones */}
        <div className={styles.actions}>
          <button
            onClick={() => navigate('/panel', { state: { tab: 'purchases' } })}
            className={styles.btnSecondary}
            type="button"
          >
            <span className="material-icons">list_alt</span>
            Ver mis compras
          </button>
          <button
            onClick={() => navigate('/')}
            className={styles.btnPrimary}
            type="button"
          >
            <span className="material-icons">home</span>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
