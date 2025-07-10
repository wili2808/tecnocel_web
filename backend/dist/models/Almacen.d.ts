import { Model } from 'sequelize';
declare class Almacen extends Model {
    id_producto: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    stock: number;
    stock_minimo: number | null;
    stock_maximo: number | null;
    precio_compra: string;
    precio_venta: string;
    fecha_ingreso: Date;
    imagen: string | null;
    id_usuario: number;
    id_categoria: number;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
}
export default Almacen;
