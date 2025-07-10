import { Model } from 'sequelize';
declare class Carrito extends Model {
    id_carrito: number;
    nro_venta: number;
    id_producto: number;
    cantidad: number;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
}
export default Carrito;
