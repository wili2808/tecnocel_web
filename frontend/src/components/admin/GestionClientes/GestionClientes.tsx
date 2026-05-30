import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import {
  AdminEmptyState,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminDataTable,
  AdminLoading,
} from '../common';
import usuarioService from '../../../services/usuarioService';
import DetalleClienteModal from './DetalleClienteModal';
import EditarClienteModal from './EditarClienteModal';
import CrearClienteModal from './CrearClienteModal';
import styles from './GestionClientes.module.css';
import type { ClienteListItem } from '../../../types/usuario';

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';


const GestionClientes = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_clientes');
  const puedeCrear = tienePermiso('crear_cliente');
  const { showNotification } = useNotification();

  const [clientes, setClientes] = useState<ClienteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Paginación
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [total, setTotal] = useState(0);

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id_cliente', desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nombre', 'email', 'celular', 'nit_ci', 'estado', 'fecha'
  ]);

  // Modal state
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteListItem | null>(null);
  const [tipoModal, setTipoModal] = useState<'detalle' | 'editar' | null>(null);
  const [showCrearModal, setShowCrearModal] = useState(false);

  const cargarClientes = useCallback(async (p: PaginationState, s: SortingState) => {
    try {
      setLoading(true);
      setError(null);
      const off = p.pageIndex * p.pageSize;

      let sortBy = 'fyh_creacion';
      let order: 'ASC' | 'DESC' = 'DESC';

      if (s.length > 0) {
        const st = s[0];
        order = st.desc ? 'DESC' : 'ASC';
        switch (st.id) {
          case 'id_cliente': sortBy = 'id_cliente'; break;
          case 'nombre': sortBy = 'nombre_cliente'; break;
          case 'email': sortBy = 'email_cliente'; break;
          case 'celular': sortBy = 'celular_cliente'; break;
          case 'fecha': sortBy = 'fyh_creacion'; break;
          default: sortBy = 'fyh_creacion';
        }
      }

      const data = await usuarioService.listarClientes(p.pageSize, off, searchTerm || undefined, sortBy, order);
      setClientes(data.clientes || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes');
      showNotification(err.message || 'Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showNotification]);

  useEffect(() => {
    cargarClientes(pagination, sorting);
  }, [cargarClientes, pagination, sorting]);

  // ── Handlers de modal ──────────────────────────────────────────────────────
  const handleVerDetalle = useCallback((cliente: ClienteListItem) => {
    setClienteSeleccionado(cliente);
    setTipoModal('detalle');
  }, []);

  const handleEditar = useCallback((cliente: ClienteListItem) => {
    setClienteSeleccionado(cliente);
    setTipoModal('editar');
  }, []);

  const handleCerrarModal = () => {
    setClienteSeleccionado(null);
    setTipoModal(null);
  };

  // ── Columnas ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<ClienteListItem>[]>(() => [

    {
      accessorFn: row => `${row.nombre_cliente} ${row.apellido_cliente}`,
      id: 'nombre',
      header: 'Nombre Completo',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'email_cliente',
      id: 'email',
      header: 'Email',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'celular_cliente',
      id: 'celular',
      header: 'Celular',
      cell: info => info.getValue() ? (info.getValue() as string) : '-',
    },
    {
      accessorKey: 'nit_ci_cliente',
      id: 'nit_ci',
      header: 'NIT/CI',
      enableSorting: false,
      cell: info => info.getValue() ? (info.getValue() as string) : '-',
    },
    {
      accessorFn: row => row.email_verified && row.is_web_enabled ? 1 : 0,
      id: 'estado',
      header: 'Estado',
      cell: info => {
        const cliente = info.row.original;
        const isActive = cliente.email_verified && cliente.is_web_enabled;
        return (
          <span
            className={`${styles.badge} ${
              isActive ? styles.badgeActive : styles.badgeInactive
            }`}
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        );
      }
    },
    {
      accessorFn: row => row.fyh_creacion ? new Date(row.fyh_creacion).getTime() : 0,
      id: 'fecha',
      header: 'Fecha de Registro',
      cell: info => {
        const fyh_creacion = info.row.original.fyh_creacion;
        return fyh_creacion ? new Date(fyh_creacion).toLocaleDateString('es-AR') : '-';
      }
    },
  ], []);


  // ── Render ─────────────────────────────────────────────────────────────────


  // ── Si no tiene permisos para ver clientes ─────────────────────────────────
  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a clientes"
          message="Tu usuario no tiene permisos para consultar ni administrar la base de clientes."
          tone="warning"
        />
      </div>
    );
  }

  // ── Si tiene permisos para ver clientes ───────────────────────────────────
  return (
    <>
      <div className={styles.container}>

        {/* ── Panel de filtros ────────────────────────────────────────────────── */}
        <AdminFilterPanel>
          <AdminFilterPanel.Row variant="bottom">
            <AdminFilterPanel.Grow>
              <AdminEntitySearchBar
                searchValue={searchTerm}
                searchLabel="Búsqueda"
                searchPlaceholder="Buscar por nombre, email o celular..."
                onSearchChange={(val) => {
                  setSearchTerm(val);
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}
                primaryActionLabel="Crear Cliente"
                primaryActionIcon="person_add"
                onPrimaryAction={() => setShowCrearModal(true)}
                primaryActionDisabled={!puedeCrear}
              />
            </AdminFilterPanel.Grow>
          </AdminFilterPanel.Row>
        </AdminFilterPanel>

        {/* Estado de carga */}
        {loading && (
          <AdminLoading
            variant="panel"
            title="Cargando clientes"
            message="Obteniendo la base de datos de clientes registrados..."
          />
        )}

        {/* ── Tabla de clientes ─────────────────────────────────────────────── */}
        {!loading && (
          error && clientes.length === 0 ? (
            <AdminEmptyState
              icon="error_outline"
              title="No pudimos cargar los clientes"
              message={error}
              actionLabel="Reintentar"
              onAction={() => cargarClientes(pagination, sorting)}
              tone="danger"
              className={styles.stateBlock}
            />
          ) : (
            <AdminDataTable
              data={clientes}
              columns={columns}
              sorting={sorting}
              onSortingChange={setSorting}
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
              pagination={pagination}
              onPaginationChange={setPagination}
              totalItems={total}
              itemLabel="clientes"
              onRowClick={(row) => handleVerDetalle(row)}
              isLoading={loading}
              manualPagination={true}
              manualSorting={true}
              emptyMessage={error ? error : 'No se encontraron clientes'}
            />
          )
        )}
      </div>

      {/* ── Modal de detalle (solo lectura) ─────────────────────────── */}
      {tipoModal === 'detalle' && clienteSeleccionado && (
        <DetalleClienteModal 
          cliente={clienteSeleccionado} 
          onClose={handleCerrarModal} 
          onEdit={() => handleEditar(clienteSeleccionado)}
        />
      )}

      {/* ── Modal de edición ──────────────────────────────────────────── */}
      {tipoModal === 'editar' && clienteSeleccionado && (
        <EditarClienteModal cliente={clienteSeleccionado} onClose={handleCerrarModal} onGuardado={() => cargarClientes(pagination, sorting)} />
      )}

      {/* ── Modal de creación de cliente ──────────────────────────────── */}
      {showCrearModal && <CrearClienteModal onClose={() => setShowCrearModal(false)} onCreado={() => cargarClientes(pagination, sorting)} />}
    </>
  );
};

export default GestionClientes;
