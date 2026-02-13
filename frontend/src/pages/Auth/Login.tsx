import { Link } from 'react-router-dom';
import AuthForm from '../../components/user/AuthForm';
import styles from './Login.module.css';

/**
 * Página de inicio de sesión
 * Contiene el formulario de login y el panel de información
 */
const Login = () => {
    return (
        <div className={styles.loginPage}>
            <div className={styles.loginContainer}>
                {/* Formulario de login */}
                <AuthForm />

                {/* Información adicional */}
                <div className={styles.loginInfo}>
                    <div className={styles.infoCard}>
                        <h3>¿Primera vez aquí?</h3>
                        <p>
                            Crea una cuenta para disfrutar de todos los beneficios:
                            seguimiento de pedidos, lista de deseos, ofertas exclusivas y más.
                        </p>
                        <Link to="/register" className={styles.infoButton}>
                            Crear cuenta
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login; 