import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import proveedorAdminService from '../../../services/proveedorAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import ProveedorModal from './ProveedorModal';
import { AdminEntitySearchBar, AdminFilterPanel, AdminEmptyState, AdminDataTable } from '../common';
import styles from './GestionCompras.module.css';
import type { ProveedorListItem } from '../../../types';

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

const GestionProveedores: React.FC = memo(() => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_proveedores');
  const puedeCrear = tienePermiso('crear_proveedor');
  const puedeEditar = tienePermiso('editar_proveedor');
  const { showNotification } = useNotification();

  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalProveedor, setModalProveedor] = useState<ProveedorListItem | null | 'new'>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nombre', 'empresa', 'celular', 'email', 'direccion'
  ]);

  const cargarProveedores = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const off = pagination.pageIndex * pagination.pageSize;
      const response = await proveedorAdminService.listarProveedores(searchTerm || undefined, pagination.pageSize, off);
      setProveedores(response.data);
      setTotal(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
      setProveedores([]);
    } finally {
      setCargando(false);
    }
  }, [searchTerm, pagination]);

  // Ejecutar búsqueda cuando cambia searchTerm (ya viene debounced de AdminSearch)
  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  const handleGuardado = () => {
    cargarProveedores();
    setModalProveedor(null);
    showNotification('Proveedor guardado exitosamente', 'success');
  };

  // === Columnas TanStack ===
  const columns = useMemo<ColumnDef<ProveedorListItem>[]>(() => [
    {
      accessorKey: 'nombre_proveedor',
      id: 'nombre',
      header: 'Nombre',
      cell: info => <span style={{ fontWeight: 600 }}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'empresa',
      id: 'empresa',
      header: 'Empresa',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'celular',
      id: 'celular',
      header: 'Celular',
      cell: info => <span style={{ fontSize: '12px' }}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'email',
      id: 'email',
      header: 'Email',
      cell: info => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {(info.getValue() as string) || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'direccion',
      id: 'direccion',
      header: 'Dirección',
      cell: info => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '200px', display: 'inline-block', whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {(info.getValue() as string)}
        </span>
      ),
    },
  ], []);


  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className="material-icons">local_shipping</span>
            Gestión de Proveedores
          </h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <span className="material-icons" style={{ fontSize: 48, opacity: 0.5 }}>
            lock
          </span>
          <p style={{ marginTop: 16 }}>No tienes permisos para ver proveedores</p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <AdminEmptyState
        icon="hourglass_empty"
        title="Cargando proveedores"
        message="Estamos obteniendo la lista de proveedores registrados..."
        className={styles.loadingState}
      />
    );
  }

  if (error) {
    return (
      <AdminEmptyState
        icon="error_outline"
        title="No pudimos cargar los proveedores"
        message={error}
        actionLabel="Reintentar"
        onAction={cargarProveedores}
        tone="danger"
        className={styles.errorState}
      />
    );
  }

  return (
    <>
      <AdminFilterPanel>
        <AdminFilterPanel.Row variant="bottom">
          <AdminFilterPanel.Grow>
            <AdminEntitySearchBar
              searchValue={searchTerm}
              searchPlaceholder="Nombre, empresa, celular..."
              onSearchChange={(val) => {
                setSearchTerm(val);
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
              }}
              searchLabel="Búsqueda"
              primaryActionLabel="Nuevo Proveedor"
              primaryActionIcon="person_add"
              onPrimaryAction={() => setModalProveedor('new')}
              primaryActionDisabled={!puedeCrear}
            />
          </AdminFilterPanel.Grow>
        </AdminFilterPanel.Row>
      </AdminFilterPanel>

        <AdminDataTable
          data={proveedores}
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalItems={total}
          itemLabel="proveedores"
          onRowClick={(row) => {
            if (puedeEditar) {
              setModalProveedor(row);
            } else {
              showNotification('No tienes permisos para editar proveedores', 'info');
            }
          }}
          isLoading={cargando}
          manualPagination={true}
          emptyMessage={searchTerm ? `No se encontraron resultados para "${searchTerm}"` : "No hay proveedores registrados aún."}
        />

      {modalProveedor && (
        <ProveedorModal
          proveedor={modalProveedor === 'new' ? undefined : modalProveedor}
          onClose={() => setModalProveedor(null)}
          onGuardado={handleGuardado}
        />
      )}
    </>
  );
});

GestionProveedores.displayName = 'GestionProveedores';

export default GestionProveedores;
