import React, { useEffect, useState, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import styles from './VerificarEmail.module.css';

type Estado = 'pendiente' | 'verificando' | 'exito' | 'error' | 'expirado';

const VerificarEmail: React.FC = memo(() => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [estado, setEstado] = useState<Estado>(token ? 'verificando' : 'pendiente');
  const [mensaje, setMensaje] = useState('');
  const [email, setEmail] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [reenvioOk, setReenvioOk] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verificar = async () => {
      try {
        await axiosInstance.get(`/clientes/verify-email?token=${token}`);
        setEstado('exito');
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        const msg = error.response?.data?.error ?? '';
        if (msg.toLowerCase().includes('expir')) {
          setEstado('expirado');
        } else {
          setEstado('error');
          setMensaje(msg || 'Token inválido o ya utilizado.');
        }
      }
    };

    verificar();
  }, [token]);

  const handleReenvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setReenviando(true);
    try {
      await axiosInstance.post('/clientes/verify-email/resend', { email });
      setReenvioOk(true);
    } catch {
      setReenvioOk(true);
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {estado === 'pendiente' && (
          <>
            <div className={styles.icon}>📧</div>
            <h1 className={styles.title}>Revisá tu email</h1>
            <p className={styles.text}>
              Te enviamos un enlace de activación. Hacé clic en él para activar tu cuenta.
            </p>
            <p className={styles.hint}>¿No llegó? Revisá tu carpeta de spam.</p>
            {!reenvioOk ? (
              <form className={styles.form} onSubmit={handleReenvio}>
                <p className={styles.formLabel}>¿Querés que te reenviemos el email?</p>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button className={styles.btn} type="submit" disabled={reenviando}>
                  {reenviando ? 'Enviando...' : 'Reenviar email'}
                </button>
              </form>
            ) : (
              <p className={styles.success}>✓ Si tu cuenta existe, recibirás el email en minutos.</p>
            )}
          </>
        )}

        {estado === 'verificando' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Verificando tu cuenta...</p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <div className={styles.icon}>✅</div>
            <h1 className={styles.title}>¡Cuenta activada!</h1>
            <p className={styles.text}>Tu cuenta está lista. Ya podés iniciar sesión.</p>
            <Link to="/login" className={styles.btn}>Iniciar sesión</Link>
          </>
        )}

        {estado === 'expirado' && (
          <>
            <div className={styles.icon}>⏱️</div>
            <h1 className={styles.title}>Enlace expirado</h1>
            <p className={styles.text}>El enlace de verificación expiró (válido 24 horas).</p>
            {!reenvioOk ? (
              <form className={styles.form} onSubmit={handleReenvio}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button className={styles.btn} type="submit" disabled={reenviando}>
                  {reenviando ? 'Enviando...' : 'Enviar nuevo enlace'}
                </button>
              </form>
            ) : (
              <p className={styles.success}>✓ Revisá tu email.</p>
            )}
          </>
        )}

        {estado === 'error' && (
          <>
            <div className={styles.icon}>❌</div>
            <h1 className={styles.title}>Error de verificación</h1>
            <p className={styles.text}>{mensaje}</p>
            <Link to="/register" className={styles.btn}>Volver al registro</Link>
          </>
        )}
      </div>
    </div>
  );
});

export default VerificarEmail;
