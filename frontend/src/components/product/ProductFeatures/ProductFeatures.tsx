/**
 * Componente ProductFeatures - Especificaciones técnicas del producto
 * Muestra especificaciones técnicas del producto
 * Incluye funcionalidades para renderizado de características y mapeo de iconos
 * Utiliza datos del producto para mostrar información estructurada
 */
import React from 'react';
import type { Product, ProductoCaracteristica } from '../../../types';
import styles from './ProductFeatures.module.css';

interface ProductFeaturesProps {
    product: Product;
}

const ProductFeatures: React.FC<ProductFeaturesProps> = ({ product }) => {
    // ============================================================================
    // EXTRACCIÓN DE DATOS DEL PRODUCTO
    // ============================================================================

    const {
        caracteristicas,
        productosCaracteristicas
    } = product;

    // Usar productosCaracteristicas si está disponible, sino caracteristicas
    const specs = productosCaracteristicas || caracteristicas || [];

    // ============================================================================
    // FUNCIONES DE FORMATEO Y UTILIDADES
    // ============================================================================

    /**
     * Renderizar valor de característica según su tipo de dato
     * Aplica formateo específico para números, booleanos y selecciones
     * Incluye unidades de medida cuando están disponibles
     */
    const renderCharacteristicValue = (caracteristica: ProductoCaracteristica) => {
        const tipoCaracteristica = caracteristica.tipo;
        const valor = caracteristica.valor;

        if (!tipoCaracteristica) return valor;

        switch (tipoCaracteristica.tipo_dato) {
            case 'numero':
                const numValue = parseFloat(valor);
                if (isNaN(numValue)) return valor;
                return `${numValue}${tipoCaracteristica.unidad_medida ? ` ${tipoCaracteristica.unidad_medida}` : ''}`;

            case 'booleano':
                const boolValue = valor.toLowerCase();
                return boolValue === 'true' || boolValue === '1' || boolValue === 'sí' ? 'Sí' : 'No';

            case 'seleccion':
            case 'texto':
            default:
                return valor;
        }
    };

    /**
     * Obtener icono para el tipo de característica
     * Mapea nombres de características a iconos de Material Design
     * Proporciona icono por defecto para características no mapeadas
     */
    const getCharacteristicIcon = (nombreTipo: string): string => {
        const iconMap: { [key: string]: string } = {
            'pantalla': 'monitor',
            'ram': 'memory',
            'almacenamiento': 'storage',
            'cámara principal': 'camera_alt',
            'cámara frontal': 'camera_front',
            'batería': 'battery_full',
            'sistema operativo': 'computer',
            'conectividad': 'wifi',
            'color': 'palette',
            'procesador': 'developer_board',
            'tarjeta gráfica': 'games',
            'peso': 'scale',
            'resistencia': 'security',
            'carga rápida': 'flash_on',
            'carga inalámbrica': 'battery_charging_full'
        };
        return iconMap[nombreTipo.toLowerCase()] || 'info';
    };

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.productFeatures}>
            {specs && specs.length > 0 && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <span className="material-icons">engineering</span>
                        Especificaciones técnicas
                    </h3>
                    <div className={styles.specificationsGrid}>
                        {specs.map((caracteristica) => (
                            <div key={caracteristica.id_caracteristica} className={styles.specificationItem}>
                                <div className={styles.featureIcon}>
                                    <span className="material-icons">
                                        {caracteristica.tipo ?
                                            getCharacteristicIcon(caracteristica.tipo.nombre_tipo) :
                                            'info'
                                        }
                                    </span>
                                </div>
                                <div className={styles.featureContent}>
                                    <span className={styles.featureLabel}>
                                        {caracteristica.tipo?.nombre_tipo || 'Característica'}
                                    </span>
                                    <span className={styles.featureValue}>
                                        {renderCharacteristicValue(caracteristica)}
                                    </span>
                                    {caracteristica.tipo?.descripcion && (
                                        <span className={styles.featureDescription}>
                                            {caracteristica.tipo.descripcion}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

ProductFeatures.displayName = 'ProductFeatures';

export default ProductFeatures; 