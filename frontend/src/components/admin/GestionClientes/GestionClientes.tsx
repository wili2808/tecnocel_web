/**
 * Componente GestionClientes - Lista y gestión de clientes de la tienda
 * Permite visualizar y editar información de clientes registrados
 */
import { useState, useEffect, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { usuarioService } from '../../../services/usuarioService';
import type { ClienteListItem } from '../../../types/usuario';
import styles from './GestionClientes.module.css';

type SortKey = 'id_cliente' | 'nombre' | 'email' | 'celular' | 'estado' | 'fecha';
type SortDir = 'asc' | 'desc';

const GestionClientes = () => {
  const { showNotification } = useNotification();
  const [clientes, setClientes] = useState<ClienteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('id_cliente');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usuarioService.listarClientes(50, 0, searchTerm);
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const sortedClientes = useMemo(() => {
    const sorted = [...clientes];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'id_cliente':
          valA = a.id_cliente;
          valB = b.id_cliente;
          break;
        case 'nombre':
          valA = `${a.nombre_cliente} ${a.apellido_cliente}`.toLowerCase();
          valB = `${b.nombre_cliente} ${b.apellido_cliente}`.toLowerCase();
          break;
        case 'email':
          valA = a.email_cliente.toLowerCase();
          valB = b.email_cliente.toLowerCase();
          break;
        case 'celular':
          valA = (a.celular_cliente || '').toLowerCase();
          valB = (b.celular_cliente || '').toLowerCase();
          break;
        case 'estado':
          valA = (a.email_verified && a.is_web_enabled) ? 1 : 0;
          valB = (b.email_verified && b.is_web_enabled) ? 1 : 0;
          break;
        case 'fecha':
          valA = a.fyh_creacion ? new Date(a.fyh_creacion).getTime() : 0;
          valB = b.fyh_creacion ? new Date(b.fyh_creacion).getTime() : 0;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [clientes, sortKey, sortDir]);

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
              <th className={styles.sortableHeader} onClick={() => handleSort('id_cliente')}>
                <span className={styles.sortableHeaderContent}>
                  ID
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'id_cliente' ? styles.sortIconActive : ''}`}>{getSortIcon('id_cliente')}</span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('nombre')}>
                <span className={styles.sortableHeaderContent}>
                  Nombre Completo
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'nombre' ? styles.sortIconActive : ''}`}>{getSortIcon('nombre')}</span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('email')}>
                <span className={styles.sortableHeaderContent}>
                  Email
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'email' ? styles.sortIconActive : ''}`}>{getSortIcon('email')}</span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('celular')}>
                <span className={styles.sortableHeaderContent}>
                  Celular
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'celular' ? styles.sortIconActive : ''}`}>{getSortIcon('celular')}</span>
                </span>
              </th>
              <th>NIT/CI</th>
              <th className={styles.sortableHeader} onClick={() => handleSort('estado')}>
                <span className={styles.sortableHeaderContent}>
                  Estado
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'estado' ? styles.sortIconActive : ''}`}>{getSortIcon('estado')}</span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('fecha')}>
                <span className={styles.sortableHeaderContent}>
                  Fecha de Registro
                  <span className={`material-icons ${styles.sortIcon} ${sortKey === 'fecha' ? styles.sortIconActive : ''}`}>{getSortIcon('fecha')}</span>
                </span>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedClientes.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyMessage}>
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              sortedClientes.map((cliente) => (
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
