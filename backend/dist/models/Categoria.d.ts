import { Model } from 'sequelize';
declare class Categoria extends Model {
    id_categoria: number;
    nombre_categoria: string;
    fyh_creacion: Date;
    fyh_actualizacion: Date;
}
export default Categoria;
