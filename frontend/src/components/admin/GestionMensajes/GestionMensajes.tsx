import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import {
  AdminEmptyState,
  AdminFilterPanel,
  AdminDataTable,
  AdminTabs,
  AdminSearch,
} from '../common';
import mensajeService from '../../../services/mensajeService';
import DetalleMensajeModal from './DetalleMensajeModal';
import styles from './GestionMensajes.module.css';
import type { MensajeContacto } from '../../../types/mensaje';
import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

const GestionMensajes = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_messages') || tienePermiso('ver_mensajes'); // Permiso que definimos en BD
  const puedeGestionar = tienePermiso('gestionar_mensajes');
  const { showNotification } = useNotification();

  const [mensajes, setMensajes] = useState<MensajeContacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroLeido, setFiltroLeido] = useState<boolean | undefined>(undefined);
  const [buscar, setBuscar] = useState('');

  // Paginación
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [total, setTotal] = useState(0);

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'estado', 'nombre', 'asunto', 'email', 'fecha'
  ]);

  // Modal state
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState<MensajeContacto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const cargarMensajes = useCallback(async (p: PaginationState, leido?: boolean, busqueda?: string) => {
    try {
      setLoading(true);
      const data = await mensajeService.getMensajes(p.pageIndex + 1, p.pageSize, leido, busqueda);
      
      // La API devuelve { items, pagination: { total, ... } }
      setMensajes(data.items || []);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      showNotification(err.message || 'Error al cargar mensajes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    cargarMensajes(pagination, filtroLeido, buscar);
  }, [cargarMensajes, pagination, filtroLeido, buscar]);

  const handleMarcarLeido = async (id: number, nuevoEstado: boolean) => {
    try {
      await mensajeService.updateStatus(id, nuevoEstado);
      showNotification(`Mensaje marcado como ${nuevoEstado ? 'leído' : 'no leído'}`, 'success');
      cargarMensajes(pagination, filtroLeido);
      if (mensajeSeleccionado?.id_mensaje_contacto === id) {
        setMensajeSeleccionado(prev => prev ? { ...prev, leido: nuevoEstado } : null);
      }
    } catch (err: any) {
      showNotification('Error al actualizar el estado del mensaje', 'error');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este mensaje permanentemente?')) return;
    
    try {
      setIsDeleting(true);
      await mensajeService.deleteMensaje(id);
      showNotification('Mensaje eliminado correctamente', 'success');
      setMensajeSeleccionado(null);
      cargarMensajes(pagination, filtroLeido);
    } catch (err: any) {
      showNotification('Error al eliminar el mensaje', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<MensajeContacto>[]>(() => [
    {
      accessorKey: 'leido',
      id: 'estado',
      header: 'Estado',
      size: 100,
      cell: info => {
        const leido = info.getValue() as boolean;
        return (
          <span className={`${styles.badge} ${leido ? styles.badgeRead : styles.badgeUnread}`}>
            <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>
              {leido ? 'drafts' : 'mark_email_unread'}
            </span>
            {leido ? 'Leído' : 'Nuevo'}
          </span>
        );
      }
    },
    {
      accessorKey: 'nombre',
      id: 'nombre',
      header: 'Remitente',
      cell: info => (
        <div className={styles.senderInfo}>
          <span className={styles.senderName}>{info.getValue() as string}</span>
        </div>
      )
    },
    {
      accessorKey: 'asunto',
      id: 'asunto',
      header: 'Asunto',
      cell: info => <span className={styles.subjectText}>{info.getValue() as string}</span>
    },
    {
      accessorKey: 'email',
      id: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'fyh_creacion',
      id: 'fecha',
      header: 'Fecha',
      cell: info => new Date(info.getValue() as string).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  ], []);

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Acceso restringido"
          message="No tienes permisos para visualizar los mensajes de contacto."
          tone="warning"
        />
      </div>
    );
  }

  const tabConfigs = [
    { id: 'todos', label: 'Todos', icon: 'forum' },
    { id: 'no-leidos', label: 'No leídos', icon: 'mark_email_unread' },
    { id: 'leidos', label: 'Leídos', icon: 'drafts' },
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'todos') setFiltroLeido(undefined);
    else if (tabId === 'no-leidos') setFiltroLeido(false);
    else if (tabId === 'leidos') setFiltroLeido(true);
  };

  const activeTabId = filtroLeido === undefined ? 'todos' : (filtroLeido ? 'leidos' : 'no-leidos');

  return (
    <>
      <div className={styles.container}>
        <AdminTabs 
          tabs={tabConfigs} 
          activeTab={activeTabId} 
          onChange={handleTabChange} 
        />

        <div className={styles.mainContent}>
          <AdminFilterPanel>
            <AdminFilterPanel.Row>
               <AdminSearch 
                  placeholder="Buscar en mensajes..." 
                  value={buscar}
                  onChange={setBuscar}
               />
            </AdminFilterPanel.Row>
          </AdminFilterPanel>

          <AdminDataTable
            data={mensajes}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            columnOrder={columnOrder}
            onColumnOrderChange={setColumnOrder}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalItems={total}
            itemLabel="mensajes"
            isLoading={loading}
            manualPagination={true}
            onRowClick={(row) => {
              setMensajeSeleccionado(row);
              if (!row.leido) handleMarcarLeido(row.id_mensaje_contacto, true);
            }}
            emptyMessage={loading ? 'Cargando mensajes...' : 'No hay mensajes recibidos'}
          />
        </div>
      </div>

      {mensajeSeleccionado && (
        <DetalleMensajeModal
          mensaje={mensajeSeleccionado}
          onClose={() => setMensajeSeleccionado(null)}
          onToggleLeido={() => handleMarcarLeido(mensajeSeleccionado.id_mensaje_contacto, !mensajeSeleccionado.leido)}
          onEliminar={() => handleEliminar(mensajeSeleccionado.id_mensaje_contacto)}
          isDeleting={isDeleting}
          puedeGestionar={puedeGestionar}
        />
      )}
    </>
  );
};

export default GestionMensajes;
