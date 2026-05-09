/**
 * Componente GestionOfertas - CRUD completo de ofertas desde el admin
 * Lista, busca, crea, edita y elimina ofertas del sistema
 * Refactorizado con TanStack Table v8 y dnd-kit.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import adminOfertaService from '../../../services/adminOfertaService';
import OfertaModal from './OfertaModal';
import type { OfertaConConteo, OfertaConProductos } from '../../../types';
import {
  AdminEmptyState,
  AdminLoading,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminDataTable,
} from '../common';
import styles from './GestionOfertas.module.css';
import controlStyles from '../common/AdminControlStyles.module.css';

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

type FiltroEstado = 'todas' | 'activas' | 'inactivas' | 'expiradas';

const ITEMS_PER_PAGE = 10;

/** Determina el estado visual de una oferta basado en activo y fechas */
const getEstadoOferta = (oferta: OfertaConConteo) => {
  if (!oferta.activo) return { label: 'Inactiva', className: styles.badgeInactiva };
  const now = new Date();
  const inicio = new Date(oferta.fecha_inicio);
  const fin = new Date(oferta.fecha_fin);
  if (now < inicio) return { label: 'Programada', className: styles.badgeProgramada };
  if (now > fin) return { label: 'Expirada', className: styles.badgeExpirada };
  return { label: 'Activa', className: styles.badgeActiva };
};

/** Formatea una fecha ISO a formato legible */
const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const GestionOfertas = () => {
  const { tienePermiso } = useAuth();
  const { showNotification } = useNotification();
  const { tipoCambio } = useTipoCambio();
  const puedeVer = tienePermiso('ver_ofertas');
  const puedeCrear = tienePermiso('crear_oferta');
  const puedeEditar = tienePermiso('editar_oferta');
  const puedeEliminar = tienePermiso('eliminar_oferta');

  // Estado del modal
  const [showCrearForm, setShowCrearForm] = useState(false);
  const [editandoOferta, setEditandoOferta] = useState<OfertaConProductos | null>(null);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');

  // Estado de la lista
  const [allOfertas, setAllOfertas] = useState<OfertaConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda, filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre_oferta', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: ITEMS_PER_PAGE });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nombre_oferta', 'tipo_descuento', 'valor_descuento', 'fecha_inicio', 'fecha_fin', 'productos', 'activo'
  ]);

  // 1. Filtrar por búsqueda y estado
  const filteredOfertas = useMemo(() => {
    let result = allOfertas;

    // Filtro por búsqueda (nombre)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(o => o.nombre_oferta.toLowerCase().includes(term));
    }

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      result = result.filter(o => {
        const estado = getEstadoOferta(o);
        switch (filtroEstado) {
          case 'activas': return estado.label === 'Activa';
          case 'inactivas': return estado.label === 'Inactiva';
          case 'expiradas': return estado.label === 'Expirada';
          default: return true;
        }
      });
    }

    return result;
  }, [allOfertas, searchTerm, filtroEstado]);

  const cargarOfertas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminOfertaService.listarOfertas();
      setAllOfertas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar ofertas');
      showNotification(err.message || 'Error al cargar ofertas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    cargarOfertas();
  }, [cargarOfertas]);

  const handleEditarOferta = useCallback(async (oferta: OfertaConConteo) => {
    if (!puedeEditar) {
      showNotification('No tienes permisos para editar ofertas', 'error');
      return;
    }
    try {
      const data = await adminOfertaService.obtenerOferta(oferta.id_oferta);
      setEditandoOferta(data);
      setModoModal('editar');
      setShowCrearForm(true);
    } catch {
      showNotification('Error al cargar oferta para editar', 'error');
    }
  }, [puedeEditar, showNotification]);

  const handleCancelar = useCallback(() => {
    setShowCrearForm(false);
    setEditandoOferta(null);
    setModoModal('crear');
  }, []);

  const handleEliminarOferta = useCallback(async (id: number) => {
    if (!puedeEliminar) {
      showNotification('No tienes permisos para eliminar ofertas', 'error');
      return;
    }

    try {
      await adminOfertaService.eliminarOferta(id);
      showNotification('Oferta desactivada exitosamente', 'success');
      handleCancelar();
      await cargarOfertas();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar oferta', 'error');
    }
  }, [puedeEliminar, showNotification, handleCancelar, cargarOfertas]);

  const handleGuardado = useCallback(() => {
    setShowCrearForm(false);
    setEditandoOferta(null);
    setModoModal('crear');
    cargarOfertas();
  }, [cargarOfertas]);

  // --- Columnas ---
  const columns = useMemo<ColumnDef<OfertaConConteo>[]>(() => [
    {
      accessorKey: 'nombre_oferta',
      id: 'nombre_oferta',
      header: 'Nombre',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'tipo_descuento',
      id: 'tipo_descuento',
      header: 'Tipo',
      cell: info => (
        <span className={styles.badgeTipo}>
          {info.getValue() === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
        </span>
      ),
    },
    {
      accessorKey: 'valor_descuento',
      id: 'valor_descuento',
      header: 'Valor',
      cell: info => {
        const oferta = info.row.original;
        const valorMostrar = oferta.tipo_descuento === 'monto_fijo' 
          ? Math.round(oferta.valor_descuento * tipoCambio) 
          : Math.round(Number(oferta.valor_descuento));

        return (
          <span className={styles.valorCell}>
            {oferta.tipo_descuento === 'porcentaje'
              ? `${valorMostrar}%`
              : `$ ${Number(valorMostrar).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            }
          </span>
        );
      },
    },
    {
      accessorFn: row => new Date(row.fecha_inicio).getTime(),
      id: 'fecha_inicio',
      header: 'Inicio',
      cell: info => formatFecha(info.row.original.fecha_inicio),
    },
    {
      accessorFn: row => new Date(row.fecha_fin).getTime(),
      id: 'fecha_fin',
      header: 'Fin',
      cell: info => formatFecha(info.row.original.fecha_fin),
    },
    {
      id: 'productos',
      header: 'Productos',
      enableSorting: false,
      cell: info => (
        <span className={styles.productosCount}>
          {info.row.original.productos_count ?? '-'}
        </span>
      )
    },
    {
      accessorFn: row => row.activo ? 1 : 0,
      id: 'activo',
      header: 'Estado',
      cell: info => {
        const estado = getEstadoOferta(info.row.original);
        return (
          <span className={`${styles.estadoBadge} ${estado.className}`}>
            {estado.label}
          </span>
        );
      }
    }
  ], [tipoCambio]);


  // Vista de lista
  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a ofertas"
          message="No tienes permisos para administrar promociones, vigencias ni descuentos."
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AdminFilterPanel>
        <AdminFilterPanel.Row variant="top">
          <AdminFilterPanel.Group minWidth="sm">
            <AdminFilterPanel.Label>Estado</AdminFilterPanel.Label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value as FiltroEstado);
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
              }}
              className={controlStyles.field}
            >
              <option value="todas">Todas</option>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
              <option value="expiradas">Expiradas</option>
            </select>
          </AdminFilterPanel.Group>
        </AdminFilterPanel.Row>
        <AdminFilterPanel.Row variant="bottom">
          <AdminFilterPanel.Grow>
            <AdminEntitySearchBar
              searchValue={searchTerm}
              searchLabel="Búsqueda"
              searchPlaceholder="Buscar por nombre de oferta..."
              onSearchChange={(val) => {
                setSearchTerm(val);
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
              }}
              primaryActionLabel="Nueva Oferta"
              primaryActionIcon="add_box"
              onPrimaryAction={() => {
                setModoModal('crear');
                setEditandoOferta(null);
                setShowCrearForm(true);
              }}
              primaryActionDisabled={!puedeCrear}
            />
          </AdminFilterPanel.Grow>
        </AdminFilterPanel.Row>
      </AdminFilterPanel>

      {/* Estado de carga */}
      {loading && (
        <AdminLoading
          variant="panel"
          title="Cargando ofertas"
          message="Estamos recuperando las campañas y descuentos disponibles."
          className={styles.stateBlock}
        />
      )}

      {/* Error */}
      {error && !loading && (
        <AdminEmptyState
          icon="error_outline"
          title="No pudimos cargar las ofertas"
          message={error}
          actionLabel="Reintentar"
          onAction={cargarOfertas}
          tone="danger"
          className={styles.stateBlock}
        />
      )}

      {/* Tabla de ofertas */}
      {!loading && !error && (
        <>


          <AdminDataTable
            data={filteredOfertas}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            columnOrder={columnOrder}
            onColumnOrderChange={setColumnOrder}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalItems={filteredOfertas.length}
            itemLabel="ofertas"
            onRowClick={(row) => handleEditarOferta(row)}
            isLoading={loading}
            manualPagination={false}
            emptyMessage={
              searchTerm || filtroEstado !== 'todas'
                ? 'No se encontraron ofertas con los filtros aplicados'
                : 'No hay ofertas registradas'
            }
          />
        </>
      )}

      {/* Modal para crear/editar oferta */}
      {showCrearForm && (
        <OfertaModal
          oferta={editandoOferta}
          onCancelar={handleCancelar}
          onGuardado={handleGuardado}
          onEliminar={editandoOferta ? () => handleEliminarOferta(editandoOferta.id_oferta) : undefined}
          modo={modoModal}
        />
      )}
    </div>
  );
};

export default GestionOfertas;
