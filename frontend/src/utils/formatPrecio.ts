/**
 * Formatea un precio en USD como ARS usando el tipo de cambio actual
 * @param precioUSD - precio base almacenado en BD (en dólares)
 * @param tipoCambio - tipo de cambio ARS/USD actual
 */
export const formatARS = (precioUSD: number, tipoCambio: number): string => {
  const montoARS = Math.round(precioUSD * tipoCambio);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montoARS);
};

/**
 * Formatea un monto que ya está en ARS (ej: total_pagado de ventas guardadas en BD)
 * @param montoARS - monto en pesos argentinos
 */
export const formatARSDirecto = (montoARS: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montoARS);
};

/**
 * Formatea un precio como referencia en USD (para mostrar precio original en dólares)
 * @param precioUSD - precio en dólares
 */
export const formatUSD = (precioUSD: number): string => {
  return `USD ${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precioUSD)}`;
};
