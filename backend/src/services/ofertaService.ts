import OfertaModel from '../models/Oferta.js';

/**
 * Interfaz para datos de oferta necesarios para el cálculo
 */
interface OfertaData {
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: number;
}

/**
 * Interfaz para datos de ProductoOferta
 */
interface ProductoOfertaData {
  precio_oferta: number | null;
  es_precio_personalizado: boolean;
}

/**
 * Calcula el precio de oferta de un producto usando lógica híbrida
 *
 * Esta función implementa el sistema híbrido de precios:
 * 1. Si es_precio_personalizado = true Y precio_oferta tiene valor → usa precio personalizado
 * 2. Si es_precio_personalizado = false O precio_oferta es NULL → calcula dinámicamente
 *
 * @param precioOriginal - Precio de venta original del producto (precio_venta)
 * @param oferta - Datos de la oferta (tipo y valor del descuento)
 * @param productoOferta - Datos de la relación producto-oferta (opcional)
 * @returns Precio final con descuento aplicado, nunca negativo
 *
 * @example
 * // Cálculo dinámico (porcentaje)
 * calcularPrecioOferta(1000, { tipo_descuento: 'porcentaje', valor_descuento: 20 })
 * // Returns: 800
 *
 * @example
 * // Precio personalizado
 * calcularPrecioOferta(1000, oferta, { precio_oferta: 750, es_precio_personalizado: true })
 * // Returns: 750
 *
 * @example
 * // Cálculo dinámico (monto fijo)
 * calcularPrecioOferta(1000, { tipo_descuento: 'monto_fijo', valor_descuento: 150 })
 * // Returns: 850
 */
export function calcularPrecioOferta(
  precioOriginal: number,
  oferta: OfertaData,
  productoOferta?: ProductoOfertaData | null
): number {
  // Caso 1: Precio personalizado
  if (productoOferta?.es_precio_personalizado && productoOferta.precio_oferta !== null) {
    return Math.max(0, productoOferta.precio_oferta);
  }

  // Caso 2: Cálculo dinámico
  let precioFinal = precioOriginal;

  if (oferta.tipo_descuento === 'porcentaje') {
    // Descuento porcentual: precio * (1 - porcentaje/100)
    precioFinal = precioOriginal * (1 - oferta.valor_descuento / 100);
  } else if (oferta.tipo_descuento === 'monto_fijo') {
    // Descuento monto fijo: precio - monto
    precioFinal = precioOriginal - oferta.valor_descuento;
  }

  // Asegurar que el precio nunca sea negativo
  return Math.max(0, precioFinal);
}

/**
 * Calcula el porcentaje de descuento entre dos precios
 *
 * @param precioOriginal - Precio original del producto
 * @param precioFinal - Precio final con descuento
 * @returns Porcentaje de descuento con 1 decimal
 *
 * @example
 * calcularPorcentajeDescuento(1000, 800)
 * // Returns: "20.0"
 */
export function calcularPorcentajeDescuento(
  precioOriginal: number,
  precioFinal: number
): string {
  if (precioOriginal <= 0) return "0.0";

  const descuento = ((precioOriginal - precioFinal) / precioOriginal) * 100;
  return Math.max(0, descuento).toFixed(1);
}

/**
 * Valida y prepara datos de oferta para asignación a producto
 *
 * Esta función procesa los datos de entrada para asignar un producto a una oferta,
 * validando si el precio es personalizado o debe calcularse dinámicamente.
 *
 * @param precioVentaProducto - Precio de venta del producto
 * @param oferta - Instancia del modelo Oferta
 * @param precioOfertaInput - Precio de oferta proporcionado (opcional)
 * @returns Objeto con precio_oferta y es_precio_personalizado
 *
 * @example
 * // Sin precio personalizado - se calculará dinámicamente
 * prepararDatosProductoOferta(1000, oferta)
 * // Returns: { precio_oferta: null, es_precio_personalizado: false }
 *
 * @example
 * // Con precio personalizado
 * prepararDatosProductoOferta(1000, oferta, 750)
 * // Returns: { precio_oferta: 750, es_precio_personalizado: true }
 */
export function prepararDatosProductoOferta(
  precioVentaProducto: number,
  oferta: OfertaModel,
  precioOfertaInput?: number
): { precio_oferta: number | null; es_precio_personalizado: boolean } {
  // Si se proporciona un precio específico, es personalizado
  if (precioOfertaInput !== undefined && precioOfertaInput !== null) {
    return {
      precio_oferta: Math.max(0, precioOfertaInput),
      es_precio_personalizado: true
    };
  }

  // Si no se proporciona precio, se calculará dinámicamente (NULL)
  return {
    precio_oferta: null,
    es_precio_personalizado: false
  };
}

/**
 * Enriquece un producto con información de oferta calculada
 *
 * Esta función agrega campos calculados de oferta a un objeto de producto,
 * incluyendo precio_original, precio_oferta, descuento_porcentaje y en_oferta.
 *
 * @param producto - Objeto producto con precio_venta y ofertas
 * @returns Producto enriquecido con datos de oferta
 *
 * @example
 * const producto = { precio_venta: "1000", ofertas: [...] };
 * const productoEnriquecido = enriquecerProductoConOferta(producto);
 * // Returns: { ...producto, precio_original: 1000, precio_oferta: 800, descuento_porcentaje: "20.0", en_oferta: true }
 */
export function enriquecerProductoConOferta(producto: any): any {
  const productoEnriquecido = { ...producto };

  // Si no hay ofertas, retornar producto sin modificar
  if (!producto.ofertas || producto.ofertas.length === 0) {
    productoEnriquecido.en_oferta = false;
    return productoEnriquecido;
  }

  // Tomar la primera oferta (puede haber múltiples pero generalmente es una)
  const oferta = producto.ofertas[0];
  const precioOriginal = parseFloat(producto.precio_venta);

  // Obtener datos de ProductoOferta si existen
  const productoOferta = oferta.ProductoOferta || null;

  // Calcular precio de oferta usando lógica híbrida
  const precioFinal = calcularPrecioOferta(
    precioOriginal,
    {
      tipo_descuento: oferta.tipo_descuento,
      valor_descuento: parseFloat(oferta.valor_descuento)
    },
    productoOferta
  );

  // Agregar campos calculados
  productoEnriquecido.precio_original = precioOriginal;
  productoEnriquecido.precio_oferta = precioFinal;
  productoEnriquecido.descuento_porcentaje = calcularPorcentajeDescuento(precioOriginal, precioFinal);
  productoEnriquecido.en_oferta = true;

  return productoEnriquecido;
}

export default {
  calcularPrecioOferta,
  calcularPorcentajeDescuento,
  prepararDatosProductoOferta,
  enriquecerProductoConOferta
};
