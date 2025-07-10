import { Model } from 'sequelize';
declare class DetalleCompra extends Model {
    id_detalle_compra: number;
    nro_compra: number;
    id_producto: number;
    cantidad: number;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
}
export default DetalleCompra;
