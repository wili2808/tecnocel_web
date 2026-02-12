import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Usuario extends Model {
  declare id_usuario: number;
  declare nombres: string;
  declare email: string;
  declare password_user: string;
  declare token: string;
  declare id_rol: number;
  declare readonly fyh_creacion: Date;
  declare readonly fyh_actualizacion: Date;
}

Usuario.init({
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombres: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  password_user: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  id_rol: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_roles',
      key: 'id_rol'
    }
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Usuario',
  tableName: 'tb_usuarios',
  timestamps: false
});

export default Usuario;
