import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class RolPermiso extends Model {
  declare id_rol: number;
  declare id_permiso: number;
  declare fyh_asignacion: Date;
}

RolPermiso.init({
  id_rol: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'tb_roles',
      key: 'id_rol'
    }
  },
  id_permiso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'tb_permisos',
      key: 'id_permiso'
    }
  },
  fyh_asignacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'RolPermiso',
  tableName: 'tb_roles_permisos',
  timestamps: false,
  underscored: true
});

export default RolPermiso;
