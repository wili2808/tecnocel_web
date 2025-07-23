import { Model } from 'sequelize';
declare class Venta extends Model {
    id_venta: number;
    nro_venta: number;
    id_cliente: number;
    id_carrito: number | null;
    total_pagado: number;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
    observaciones: string | null;
    valor_dolar: number | null;
    moneda: string | null;
}
export default Venta;
