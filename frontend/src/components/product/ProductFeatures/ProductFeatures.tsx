/**
 * ProductFeatures — Especificaciones técnicas
 * Layout tabla: label | valor — limpio y scannable
 */
import React from 'react';
import type { Product, ProductoCaracteristica } from '../../../types';
import styles from './ProductFeatures.module.css';

interface ProductFeaturesProps {
    product: Product;
}

const ProductFeatures: React.FC<ProductFeaturesProps> = ({ product }) => {
    const { caracteristicas, productosCaracteristicas } = product;
    const specs = productosCaracteristicas || caracteristicas || [];

    const renderValue = (c: ProductoCaracteristica): string => {
        const tipo = c.tipo;
        const valor = c.valor;
        if (!tipo) return valor;

        switch (tipo.tipo_dato) {
            case 'numero': {
                const n = parseFloat(valor);
                if (isNaN(n)) return valor;
                return tipo.unidad_medida ? `${n} ${tipo.unidad_medida}` : String(n);
            }
            case 'booleano': {
                const v = valor.toLowerCase();
                return (v === 'true' || v === '1' || v === 'sí') ? 'Sí' : 'No';
            }
            default:
                return valor;
        }
    };

    if (!specs || specs.length === 0) return null;

    return (
        <div className={styles.productFeatures}>
            <h3 className={styles.sectionTitle}>Especificaciones</h3>
            <dl className={styles.specTable}>
                {specs.map((c) => (
                    <div key={c.id_caracteristica} className={styles.specRow}>
                        <dt className={styles.specLabel}>
                            {c.tipo?.nombre_tipo || 'Característica'}
                        </dt>
                        <dd className={styles.specValue}>
                            {renderValue(c)}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

ProductFeatures.displayName = 'ProductFeatures';

export default ProductFeatures;
