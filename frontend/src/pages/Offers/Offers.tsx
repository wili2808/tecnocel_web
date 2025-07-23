import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Offers.module.css';

/**
 * Configuración de notificaciones toast
 */
const TOAST_CONFIG = {
    position: "top-center" as const,
    autoClose: 3000,
    hideProgressBar: false,
    newestOnTop: true,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    draggable: true,
    pauseOnHover: true,
    theme: "light" as const,
    "aria-label": "Notificaciones del sistema"
};

/**
 * Página de ofertas
 * Contiene el panel de ofertas
 */
const Offers = () => {
    return (
        <div className={styles.offersPage}>
            <ToastContainer {...TOAST_CONFIG} />

            <div className={styles.offersContainer}>
                <h1>Ofertas</h1>
            </div>
        </div>
    );
};

export default Offers; 