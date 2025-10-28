/**
 * Componente ProductsOfferFilter - Filtro de productos por oferta
 * Permite al usuario filtrar productos en oferta por la oferta específica
 * Diseño simple con select nativo siguiendo el patrón de ProductFilters
 */
import React from 'react';
import type { Oferta } from '../../../types';
import styles from './ProductsOfferFilter.module.css';

export type ProductOfferFilter = 'todas' | number; // 'todas' o id_oferta específico

interface ProductsOfferFilterProps {
    /** Filtro actual seleccionado */
    currentFilter: ProductOfferFilter;
    /** Lista de ofertas disponibles */
    ofertas: Oferta[];
    /** Callback cuando cambia el filtro */
    onFilterChange: (filter: ProductOfferFilter) => void;
    /** Desactivar el filtro */
    disabled?: boolean;
}

const ProductsOfferFilter: React.FC<ProductsOfferFilterProps> = ({
    currentFilter,
    ofertas,
    onFilterChange,
    disabled = false
}) => {
    // Filtrar solo ofertas activas
    const ofertasActivas = ofertas.filter(oferta => {
        const fechaFin = new Date(oferta.fecha_fin);
        return fechaFin >= new Date();
    });

    // Handler para el cambio de selección
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'todas') {
            onFilterChange('todas');
        } else {
            onFilterChange(parseInt(value, 10));
        }
    };

    return (
        <div className={styles.container}>
            {/* Select de ofertas */}
            <select
                className={styles.filterSelect}
                value={currentFilter === 'todas' ? 'todas' : currentFilter.toString()}
                onChange={handleSelectChange}
                disabled={disabled}
                aria-label="Filtrar productos por oferta"
            >
                <option value="todas">Todas las ofertas</option>
                {ofertasActivas.map((oferta) => (
                    <option key={oferta.id_oferta} value={oferta.id_oferta}>
                        {oferta.nombre_oferta} (-{oferta.valor_descuento}%)
                    </option>
                ))}
            </select>
        </div>
    );
};

ProductsOfferFilter.displayName = 'ProductsOfferFilter';

export default ProductsOfferFilter;
