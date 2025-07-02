import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Cliente extends Model {
  declare id_cliente: number;
  declare nombre_cliente: string;
  declare nit_ci_cliente: string;
  declare celular_cliente: string;
  declare email_cliente: string;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
  declare password_hash: string | null;
  declare is_web_enabled: boolean;
  declare last_login: Date | null;
  declare email_verified: boolean;
  declare verification_token: string | null;
  declare reset_token: string | null;
  declare reset_token_expires: Date | null;
}

Cliente.init({
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_cliente: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nit_ci_cliente: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  celular_cliente: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email_cliente: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_web_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Cliente',
  tableName: 'tb_clientes',
  timestamps: false
});

export default Cliente; 