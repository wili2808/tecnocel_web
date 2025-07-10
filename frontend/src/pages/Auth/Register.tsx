import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RegisterForm from '../../components/user/RegisterForm';
import styles from './Register.module.css';

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
 * Página de registro de usuarios
 * Contiene el formulario de registro y el panel de información
 */
const Register = () => {
    return (
        <div className={styles.registerPage}>
            <ToastContainer {...TOAST_CONFIG} />

            <div className={styles.registerContainer}>
                {/* Formulario de registro */}
                <RegisterForm />

                {/* Información adicional */}
                <div className={styles.registerInfo}>
                    <div className={styles.infoCard}>
                        <h3>¿Por qué registrarte?</h3>
                        <ul className={styles.benefitsList}>
                            <li>
                                <span className="material-icons">check_circle</span>
                                Seguimiento de pedidos
                            </li>
                            <li>
                                <span className="material-icons">check_circle</span>
                                Ofertas y descuentos exclusivos
                            </li>
                            <li>
                                <span className="material-icons">check_circle</span>
                                Lista de deseos personalizada
                            </li>
                            <li>
                                <span className="material-icons">check_circle</span>
                                Historial de compras
                            </li>
                            <li>
                                <span className="material-icons">check_circle</span>
                                Soporte técnico prioritario
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register; 