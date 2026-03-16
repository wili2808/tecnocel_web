import RegisterForm from '../../components/user/RegisterForm';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import styles from './Register.module.css';

/**
 * Página de registro de usuarios
 * Contiene el formulario de registro y el panel de información
 */
const Register = () => {
    return (
        <div className={styles.registerPage}>
            <PageMeta title="Crear cuenta" noIndex />
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
                                Ofertas y descuentos
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