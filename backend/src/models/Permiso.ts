import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database.js';
import Rol from './Rol.js';

interface PermisoAttributes {
  id_permiso: number;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  accion: string;
  fyh_creacion: Date;
  fyh_actualizacion: Date;
}

interface PermisoCreationAttributes extends Optional<PermisoAttributes, 'id_permiso' | 'descripcion' | 'fyh_creacion' | 'fyh_actualizacion'> {}

class Permiso extends Model<PermisoAttributes, PermisoCreationAttributes> {
  declare id_permiso: number;
  declare nombre: string;
  declare descripcion: string | null;
  declare modulo: string;
  declare accion: string;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;

  declare readonly roles?: Rol[];
}

Permiso.init({
  id_permiso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  modulo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  accion: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Permiso',
  tableName: 'tb_permisos',
  timestamps: false
});

export default Permiso;
export type { PermisoAttributes, PermisoCreationAttributes };
