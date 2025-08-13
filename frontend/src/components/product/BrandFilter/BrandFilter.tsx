import React from 'react';
import styles from './BrandFilter.module.css';
import type { Marca } from '../../../types/product';

interface BrandFilterProps {
    // Marcas del backend
    backendBrands: Marca[];
    selectedBackendBrand: string;
    onBackendBrandChange: (brandId: string) => void;
}

const BrandFilter: React.FC<BrandFilterProps> = ({
    backendBrands,
    selectedBackendBrand,
    onBackendBrandChange
}) => {
    return (
        <div className={styles.brandFilters}>
            {/* Dropdown de marcas del backend */}
            <div className={styles.filterGroup}>
                <select
                    className={styles.filterSelect}
                    value={selectedBackendBrand}
                    onChange={(e) => onBackendBrandChange(e.target.value)}
                    aria-label="Filtrar por marca del sistema"
                >
                    <option value="">Todas las marcas</option>
                    {backendBrands.map(brand => (
                        <option key={brand.id_marca} value={brand.id_marca.toString()}>
                            {brand.nombre_marca}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default BrandFilter;