import { Model } from 'sequelize';
declare class Rol extends Model {
    id_rol: number;
    rol: string;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
}
export default Rol;
