import { Model } from 'sequelize';
declare class PresupuestoDetalle extends Model {
    id_detalle: number;
    nro_presupuesto: number | null;
    id_producto: number | null;
    cantidad: number | null;
    fyh_creacion: Date | null;
    fyh_actualizacion: Date | null;
}
export default PresupuestoDetalle;
