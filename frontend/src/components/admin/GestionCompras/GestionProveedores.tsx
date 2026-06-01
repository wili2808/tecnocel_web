import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import proveedorAdminService from '../../../services/proveedorAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import ProveedorModal from './ProveedorModal';
import { AdminEntitySearchBar, AdminFilterPanel, AdminEmptyState, AdminDataTable, AdminLoading } from '../common';
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

  const cargarProveedores = useCallback(async (p: PaginationState, s: SortingState) => {
    try {
      setCargando(true);
      setError(null);
      const off = p.pageIndex * p.pageSize;
      
      let sortBy = 'nombre_proveedor';
      let order: 'ASC' | 'DESC' = 'ASC';

      if (s.length > 0) {
        const st = s[0];
        order = st.desc ? 'DESC' : 'ASC';
        switch (st.id) {
          case 'nombre': sortBy = 'nombre_proveedor'; break;
          case 'empresa': sortBy = 'empresa'; break;
          case 'email': sortBy = 'email'; break;
          default: sortBy = 'nombre_proveedor';
        }
      }

      const response = await proveedorAdminService.listarProveedores(searchTerm || undefined, p.pageSize, off, sortBy, order);
      setProveedores(response.data);
      setTotal(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
      setProveedores([]);
    } finally {
      setCargando(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    cargarProveedores(pagination, sorting);
  }, [cargarProveedores, pagination, sorting]);

  const handleGuardado = () => {
    cargarProveedores(pagination, sorting);
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
      <div>
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

      {/* Estado de carga inicial */}
      {cargando && proveedores.length === 0 && !error && (
        <AdminLoading
          variant="panel"
          title="Cargando proveedores"
          message="Estamos obteniendo la lista de proveedores registrados…"
          className={styles.loadingState}
        />
      )}

      {/* Error */}
      {!cargando && error && (
        <AdminEmptyState
          icon="error_outline"
          title="No pudimos cargar los proveedores"
          message={error}
          actionLabel="Reintentar"
          onAction={() => cargarProveedores(pagination, sorting)}
          tone="danger"
          className={styles.errorState}
        />
      )}

      {/* Tabla (siempre montada una vez que hay data) */}
      {!error && (proveedores.length > 0 || !cargando) && (
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
          manualSorting={true}
          emptyMessage={searchTerm ? `No se encontraron resultados para "${searchTerm}"` : "No hay proveedores registrados aún."}
        />
      )}

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
