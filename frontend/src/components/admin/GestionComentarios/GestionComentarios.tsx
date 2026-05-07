import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import adminCommentService from '../../../services/adminCommentService';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminTabs, AdminFilterPanel, AdminSearch, AdminDataTable } from '../common';
import DetalleComentarioModal from './DetalleComentarioModal';
import styles from './GestionComentarios.module.css';
import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

interface ComentarioAdmin {
  id_comentario: number;
  id_producto: number;
  comentario: string;
  calificacion: number | null;
  estado: 'pendiente' | 'activo' | 'oculto' | 'eliminado';
  fyh_creacion: string;
  cliente: {
    nombre_cliente: string;
    apellido_cliente: string;
    email_cliente: string;
  };
  producto: {
    nombre: string;
  };
  imagenes: Array<{
    id_imagen: number;
    imagen_url: string;
  }>;
}

const GestionComentarios: React.FC = memo(() => {
  const { showNotification } = useNotification();
  const [comentarios, setComentarios] = useState<ComentarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('pendiente');
  const [buscar, setBuscar] = useState('');
  const [total, setTotal] = useState(0);
  
  // Modal state
  const [comentarioSeleccionado, setComentarioSeleccionado] = useState<ComentarioAdmin | null>(null);

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['cliente', 'producto', 'calificacion', 'comentario', 'estado']);

  const fetchComentarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCommentService.listarComentarios({
        estado: filtroEstado || undefined,
        buscar: buscar || undefined,
        limite: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize
      });
      setComentarios(data.comentarios);
      setTotal(data.paginacion.total);
    } catch (error) {
      showNotification('Error al cargar comentarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, buscar, pagination.pageIndex, pagination.pageSize, showNotification]);

  useEffect(() => {
    fetchComentarios();
  }, [fetchComentarios]);

  const handleModerar = async (id: number, nuevoEstado: 'activo' | 'oculto' | 'eliminado') => {
    try {
      await adminCommentService.moderarComentario(id, nuevoEstado);
      showNotification(`Comentario ${nuevoEstado === 'activo' ? 'aprobado' : 'moderado'} correctamente`, 'success');
      fetchComentarios();
    } catch (error) {
      showNotification('Error al moderar el comentario', 'error');
    }
  };

  const columns = useMemo<ColumnDef<ComentarioAdmin>[]>(() => [
    {
      id: 'cliente',
      header: 'Cliente',
      accessorFn: (row) => `${row.cliente.nombre_cliente} ${row.cliente.apellido_cliente}`,
      cell: info => (
        <div className={styles.clientInfo}>
          <strong>{info.getValue() as string}</strong>
          <span>{info.row.original.cliente.email_cliente}</span>
        </div>
      )
    },
    {
      accessorKey: 'producto.nombre',
      id: 'producto',
      header: 'Producto',
      cell: info => <span className={styles.productName}>{info.getValue() as string}</span>
    },
    {
      accessorKey: 'calificacion',
      id: 'calificacion',
      header: 'Calificación',
      cell: info => {
        const rating = info.getValue() as number | null;
        if (!rating) return <span className={styles.noRating}>Sin calif.</span>;
        return (
          <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`material-icons ${i < rating ? styles.starFilled : styles.starEmpty}`}>
                star
              </span>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: 'comentario',
      id: 'comentario',
      header: 'Comentario',
      cell: info => <p className={styles.truncatedComment}>{info.getValue() as string}</p>
    },
    {
      accessorKey: 'estado',
      id: 'estado',
      header: 'Estado',
      cell: info => {
        const estado = info.getValue() as string;
        switch (estado) {
          case 'pendiente': return <span className={`${styles.badge} ${styles.pendiente}`}>Pendiente</span>;
          case 'activo': return <span className={`${styles.badge} ${styles.activo}`}>Activo</span>;
          case 'oculto': return <span className={`${styles.badge} ${styles.oculto}`}>Oculto</span>;
          default: return <span className={styles.badge}>{estado}</span>;
        }
      }
    }
  ], []);

  const tabConfigs = [
    { id: 'pendiente', label: 'Pendientes', icon: 'pending_actions' },
    { id: 'activo', label: 'Aprobados', icon: 'check_circle' },
    { id: 'todos', label: 'Todos', icon: 'reviews' },
  ];

  return (
    <div className={styles.container}>
      <AdminTabs 
        tabs={tabConfigs} 
        activeTab={filtroEstado || 'todos'} 
        onChange={(id) => setFiltroEstado(id === 'todos' ? '' : id)} 
      />

      <div className={styles.mainContent}>
        <AdminFilterPanel>
          <AdminFilterPanel.Row>
            <AdminSearch 
              placeholder="Buscar en comentarios..." 
              value={buscar}
              onChange={setBuscar}
            />
          </AdminFilterPanel.Row>
        </AdminFilterPanel>

        <AdminDataTable
          data={comentarios}
          columns={columns}
          isLoading={loading}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={pagination}
          onPaginationChange={setPagination}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          totalItems={total}
          onRowClick={setComentarioSeleccionado}
          manualPagination={true}
          emptyMessage="No se encontraron comentarios para mostrar."
        />
      </div>

      {comentarioSeleccionado && (
        <DetalleComentarioModal
          comentario={comentarioSeleccionado}
          onClose={() => setComentarioSeleccionado(null)}
          onModerar={handleModerar}
        />
      )}
    </div>
  );
});

GestionComentarios.displayName = 'GestionComentarios';

export default GestionComentarios;
