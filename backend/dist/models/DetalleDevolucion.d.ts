import { Model } from 'sequelize';
declare class DetalleDevolucion extends Model {
    id_detalle: number;
    id_devolucion: number | null;
    id_producto: number | null;
    cantidad: number | null;
    fyh_creacion: Date | null;
    fyh_actualizacion: Date | null;
}
export default DetalleDevolucion;
