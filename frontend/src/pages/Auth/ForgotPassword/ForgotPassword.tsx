import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import styles from './ForgotPassword.module.css';

const ForgotPassword: React.FC = memo(() => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailTrim = email.trim();
    if (!emailTrim) {
      setError('Ingresá tu email.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/clientes/forgot-password', { email_cliente: emailTrim });
      setEnviado(true);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string; mensaje?: string } } };
      const msg = e.response?.data?.error ?? e.response?.data?.mensaje;
      if (e.response?.status === 429) {
        setError(msg ?? 'Demasiados intentos. Esperá 15 minutos e intentá de nuevo.');
      } else {
        // Anti-enumeración: mostrar mensaje genérico en caso de error inesperado
        setEnviado(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <span className="material-icons" style={{ fontSize: 40, color: 'var(--color-success)' }}>mark_email_read</span>
          </div>
          <h1 className={styles.title}>Revisá tu email</h1>
          <p className={styles.text}>
            Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
            El enlace expira en <strong>1 hora</strong>.
          </p>
          <p className={styles.hint}>¿No llegó? Revisá la carpeta de spam.</p>
          <Link to="/login" className={styles.btn}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className="material-icons" style={{ fontSize: 40, color: 'var(--color-primary)' }}>lock_reset</span>
        </div>
        <h1 className={styles.title}>¿Olvidaste tu contraseña?</h1>
        <p className={styles.text}>
          Ingresá tu email y te enviaremos un enlace para restablecerla.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Email
            <div className={styles.inputWrapper}>
              <span className={`material-icons ${styles.inputIcon}`}>email</span>
              <input
                className={styles.input}
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner} />
                Enviando...
              </>
            ) : (
              'Enviar enlace'
            )}
          </button>
        </form>

        <Link to="/login" className={styles.link}>
          <span className="material-icons" style={{ fontSize: 16 }}>arrow_back</span>
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
});

export default ForgotPassword;
