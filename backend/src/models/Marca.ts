import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Marca extends Model {
  declare id_marca: number;
  declare nombre_marca: string;
  declare logo_marca: string | null;
  declare descripcion_marca: string | null;
  declare activo: boolean;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Marca.init({
  id_marca: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_marca: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  logo_marca: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  descripcion_marca: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
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
  modelName: 'Marca',
  tableName: 'tb_marcas',
  timestamps: false
});

export default Marca;