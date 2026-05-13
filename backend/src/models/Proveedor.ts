import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Proveedor extends Model {
  declare id_proveedor: number;
  declare nombre_proveedor: string;
  declare celular: string;
  declare telefono: string | null;
  declare empresa: string;
  declare email: string | null;
  declare direccion: string;
  declare activo: boolean;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Proveedor.init({
  id_proveedor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_proveedor: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  celular: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  empresa: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  modelName: 'Proveedor',
  tableName: 'tb_proveedores',
  timestamps: false
});

export default Proveedor; 