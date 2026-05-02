import React, { memo } from "react";
import { flexRender } from '@tanstack/react-table';
import type { Header } from '@tanstack/react-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './DraggableTableHeader.module.css';

interface DraggableTableHeaderProps {
  header: Header<any, unknown>;
  className?: string;
}

/**
 * DraggableTableHeader
 * 
 * Componente reutilizable para cabeceras de tabla que soporta:
 * 1. Reordenamiento por Drag & Drop (usando dnd-kit)
 * 2. Ordenamiento de datos (usando TanStack Table)
 * 3. Estilos consistentes y responsivos
 */
const DraggableTableHeader: React.FC<DraggableTableHeaderProps> = memo(({ header, className }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
    id: header.column.id,
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  const canSort = header.column.getCanSort();
  const isSorted = header.column.getIsSorted();

  return (
    <th 
      ref={setNodeRef} 
      style={style} 
      className={`${styles.sortableHeader} ${className || ''}`}
    >
      <div className={styles.headerContentWrapper}>
        {/* Agarradera para drag & drop */}
        <span 
          {...attributes} 
          {...listeners} 
          className={`material-icons ${styles.dragHandle}`}
          title="Arrastrar para mover columna"
        >
          drag_indicator
        </span>
        
        {/* Contenido clickeable para ordenar */}
        <div
          className={canSort ? styles.sortableContent : ''}
          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
          style={{ 
            cursor: canSort ? 'pointer' : 'default',
          }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          
          {/* Icono de ordenamiento de TanStack Table */}
          {canSort && (
            <span
              className={`material-icons ${styles.sortIcon} ${isSorted ? styles.sortIconActive : ''}`}
            >
              {{
                asc: 'arrow_upward',
                desc: 'arrow_downward',
              }[isSorted as string] ?? 'unfold_more'}
            </span>
          )}
        </div>
      </div>
    </th>
  );
});

export default DraggableTableHeader;
