/**
 * Componente ProductFeatures - Características y especificaciones del producto
 * Muestra información básica, especificaciones técnicas y datos adicionales del producto
 * Incluye funcionalidades para formateo de fechas, renderizado de características y mapeo de iconos
 * Utiliza datos del producto para mostrar información estructurada en secciones
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
        codigo,
        stock,
        stock_minimo,
        fecha_ingreso,
        Categoria,
        Usuario,
        marca,
        caracteristicas,
        productosCaracteristicas
    } = product;

    // Usar productosCaracteristicas si está disponible, sino caracteristicas
    const specs = productosCaracteristicas || caracteristicas || [];

    // ============================================================================
    // FUNCIONES DE FORMATEO Y UTILIDADES
    // ============================================================================

    /**
     * Formatear fecha en formato legible para el usuario
     * Convierte string de fecha a formato localizado en español argentino
     */
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Fecha no disponible';
        }
    };

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
    // CONSTRUCCIÓN DE DATOS PARA RENDERIZADO
    // ============================================================================

    // Información básica del producto
    const basicInfo = [
        {
            icon: 'qr_code',
            label: 'Código',
            value: codigo
        },
        {
            icon: 'inventory_2',
            label: 'Stock actual',
            value: `${stock} unidades`
        }
    ];

    // Agregar marca si existe
    if (marca) {
        basicInfo.push({
            icon: 'business',
            label: 'Marca',
            value: marca.nombre_marca
        });
    }

    // Agregar categoría si existe
    if (Categoria) {
        basicInfo.push({
            icon: 'category',
            label: 'Categoría',
            value: Categoria.nombre_categoria
        });
    }

    // Información adicional
    const additionalInfo = [
        {
            icon: 'trending_down',
            label: 'Stock mínimo',
            value: stock_minimo ? `${stock_minimo} unidades` : 'No definido'
        },
        {
            icon: 'event',
            label: 'Fecha de ingreso',
            value: formatDate(fecha_ingreso)
        }
    ];

    if (Usuario) {
        additionalInfo.push({
            icon: 'person',
            label: 'Registrado por',
            value: Usuario.nombres
        });
    }

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.productFeatures}>
            {/* Información básica del producto */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <span className="material-icons">info</span>
                    Información básica
                </h3>
                <div className={styles.featuresGrid}>
                    {basicInfo.map((feature, index) => (
                        <div key={index} className={styles.featureItem}>
                            <div className={styles.featureIcon}>
                                <span className="material-icons">{feature.icon}</span>
                            </div>
                            <div className={styles.featureContent}>
                                <span className={styles.featureLabel}>{feature.label}</span>
                                <span className={styles.featureValue}>{feature.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Especificaciones técnicas del producto */}
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

            {/* Información adicional del producto */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <span className="material-icons">more_horiz</span>
                    Información adicional
                </h3>
                <div className={styles.featuresGrid}>
                    {additionalInfo.map((feature, index) => (
                        <div key={index} className={styles.featureItem}>
                            <div className={styles.featureIcon}>
                                <span className="material-icons">{feature.icon}</span>
                            </div>
                            <div className={styles.featureContent}>
                                <span className={styles.featureLabel}>{feature.label}</span>
                                <span className={styles.featureValue}>{feature.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

ProductFeatures.displayName = 'ProductFeatures';

export default ProductFeatures; 