import { Model } from 'sequelize';
declare class Presupuesto extends Model {
    id_presupuesto: number;
    nro_presupuesto: number | null;
    id_cliente: number | null;
    total_pagado: number | null;
    fyh_creacion: Date | null;
    moneda: string | null;
    valor_dolar: number | null;
    observaciones: string | null;
    estado: string | null;
}
export default Presupuesto;
