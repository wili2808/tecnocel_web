/**
 * Componente GestionClientes - Lista y gestión de clientes de la tienda
 * Permite visualizar y editar información de clientes registrados
 */
import { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { adminService, type ClienteData } from '../../../services/adminService';
import styles from './GestionClientes.module.css';

const GestionClientes = () => {
  const { showNotification } = useNotification();
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.listarClientes(50, 0, searchTerm);
      setClientes(data.clientes || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes');
      showNotification(err.message || 'Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    cargarClientes();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Cargando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
          <button onClick={cargarClientes} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className="material-icons">people</span>
          Gestión de Clientes
        </h2>
        <p className={styles.subtitle}>
          Visualiza y administra los clientes registrados en la plataforma
        </p>
      </div>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Buscar por nombre, email o celular..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          <span className="material-icons">search</span>
          Buscar
        </button>
      </form>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Celular</th>
              <th>NIT/CI</th>
              <th>Estado</th>
              <th>Fecha de Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyMessage}>
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id_cliente}>
                  <td>{cliente.id_cliente}</td>
                  <td>{`${cliente.nombre_cliente} ${cliente.apellido_cliente}`}</td>
                  <td>{cliente.email_cliente}</td>
                  <td>{cliente.celular_cliente || '-'}</td>
                  <td>{cliente.nit_ci_cliente || '-'}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        cliente.email_verified && cliente.is_web_enabled
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {cliente.email_verified && cliente.is_web_enabled
                        ? 'Activo'
                        : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {cliente.fyh_creacion
                      ? new Date(cliente.fyh_creacion).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionButton} title="Ver detalles">
                        <span className="material-icons">visibility</span>
                      </button>
                      <button className={styles.actionButton} title="Editar">
                        <span className="material-icons">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionClientes;
