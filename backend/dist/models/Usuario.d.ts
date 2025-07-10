import { Model } from 'sequelize';
declare class Usuario extends Model {
    id_usuario: number;
    nombres: string;
    email: string;
    password_user: string;
    token: string;
    id_rol: number;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
}
export default Usuario;
