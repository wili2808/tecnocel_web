import React from 'react';
import { useMarcas } from '../../../hooks/useMarcas';
import styles from './BrandFilter.module.css';

interface BrandFilterProps {
    selectedBrand: string;
    onBrandChange: (brand: string) => void;
    className?: string;
}

const BrandFilter: React.FC<BrandFilterProps> = ({
    selectedBrand,
    onBrandChange,
    className = ''
}) => {
    const { marcas, loading, error } = useMarcas();

    if (loading) {
        return (
            <div className={`${styles.brandFilter} ${className}`}>
                <select disabled className={styles.select}>
                    <option>Cargando marcas...</option>
                </select>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.brandFilter} ${className}`}>
                <select disabled className={styles.select}>
                    <option>Error al cargar marcas</option>
                </select>
            </div>
        );
    }

    return (
        <div className={`${styles.brandFilter} ${className}`}>
            <select
                value={selectedBrand}
                onChange={(e) => onBrandChange(e.target.value)}
                className={styles.select}
            >
                <option value="">Todas las marcas</option>
                {marcas.map((marca) => (
                    <option key={marca.id_marca} value={marca.id_marca.toString()}>
                        {marca.nombre_marca}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default BrandFilter;