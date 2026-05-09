import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Categoria extends Model {
  declare id_categoria: number;
  declare nombre_categoria: string;
  declare activo: boolean;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Categoria.init({
  id_categoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_categoria: {
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
  modelName: 'Categoria',
  tableName: 'tb_categorias',
  timestamps: false
});

export default Categoria;
