import { Model } from 'sequelize';
declare class Proveedor extends Model {
    id_proveedor: number;
    nombre_proveedor: string;
    celular: string;
    telefono: string | null;
    empresa: string;
    email: string | null;
    direccion: string;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
}
export default Proveedor;
