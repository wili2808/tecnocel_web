import { Model } from 'sequelize';
declare class Devolucion extends Model {
    id_devolucion: number;
    id_cliente: number;
    total_a_devolver: number;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
    motivo_devolucion: string;
    estado_devolucion: string;
    tipo_devolucion: string;
    nro_venta: string | null;
}
export default Devolucion;
