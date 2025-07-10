import { Model } from 'sequelize';
declare class Compra extends Model {
    id_compra: number;
    nro_compra: number;
    fecha_compra: Date;
    id_proveedor: number;
    comprobante: string;
    id_usuario: number;
    precio_total: string;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
}
export default Compra;
