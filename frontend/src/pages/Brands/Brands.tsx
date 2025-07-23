import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Brands.module.css';

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
 * Página de marcas
 * Contiene el panel de marcas
 */
const Brands = () => {
    return (
        <div className={styles.brandsPage}>
            <ToastContainer {...TOAST_CONFIG} />

            <div className={styles.brandsContainer}>
                <h1>Marcas</h1>
            </div>
        </div>
    );
};

export default Brands; 