import React, { useState, memo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import styles from './ActivarCuenta.module.css';

const ActivarCuenta: React.FC = memo(() => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠️</div>
          <h1 className={styles.title}>Enlace inválido</h1>
          <p className={styles.text}>Este enlace no es válido o ya fue utilizado.</p>
          <Link to="/login" className={styles.btn}>Ir al inicio de sesión</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/clientes/activar-cuenta', {
        token,
        nueva_contrasena: form.password,
      });
      setExito(true);
      setTimeout(() => navigate('/login'), 3500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      setError(error.response?.data?.mensaje ?? 'El enlace expiró o es inválido.');
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h1 className={styles.title}>¡Cuenta activada!</h1>
          <p className={styles.text}>Tu contraseña fue establecida exitosamente. Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Activar tu cuenta</h1>
        <p className={styles.text}>Creá tu contraseña para acceder a TecnoCel.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Nueva contraseña
            <input
              className={styles.input}
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </label>
          <label className={styles.label}>
            Confirmar contraseña
            <input
              className={styles.input}
              type="password"
              placeholder="Repetí la contraseña"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              required
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Activando...' : 'Activar cuenta'}
          </button>
        </form>
        <Link to="/login" className={styles.link}>Volver al inicio de sesión</Link>
      </div>
    </div>
  );
});

export default ActivarCuenta;
