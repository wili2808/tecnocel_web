import { Model } from 'sequelize';
declare class Cliente extends Model {
    id_cliente: number;
    nombre_cliente: string;
    apellido_cliente: string;
    nit_ci_cliente: string;
    celular_cliente: string;
    email_cliente: string;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
    password_hash: string | null;
    is_web_enabled: boolean;
    last_login: Date | null;
    email_verified: boolean;
    verification_token: string | null;
    reset_token: string | null;
    reset_token_expires: Date | null;
    google_id: string | null;
}
export default Cliente;
