import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Cliente extends Model {
  declare id_cliente: number;
  declare nombre_cliente: string;
  declare apellido_cliente: string;
  declare nit_ci_cliente: string;
  declare celular_cliente: string;
  declare email_cliente: string;
  declare password_hash: string | null;
  declare is_web_enabled: boolean;
  declare last_login: Date | null;
  declare email_verified: boolean;
  declare verification_token: string | null;
  declare verification_token_expires: Date | null;
  declare reset_token: string | null;
  declare reset_token_expires: Date | null;
  declare google_id: string | null;
  // Sequelize gestiona estos campos automáticamente
  declare readonly fyh_creacion: Date;
  declare readonly fyh_actualizacion: Date;
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
  apellido_cliente: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  nit_ci_cliente: {
    type: DataTypes.STRING(255),
    allowNull: true // Se permite nulo si no se proporciona
  },
  celular_cliente: {
    type: DataTypes.STRING(50),
    allowNull: true // Se permite nulo si no se proporciona
  },
  email_cliente: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {isEmail: true}
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
  verification_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  }
}, {
  sequelize,
  modelName: 'Cliente',
  tableName: 'tb_clientes',
  timestamps: true,
  createdAt: 'fyh_creacion',
  updatedAt: 'fyh_actualizacion'
});

export default Cliente; 