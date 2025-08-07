import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ProductoCaracteristica extends Model {
  declare id_caracteristica: number;
  declare id_producto: number;
  declare id_tipo: number;
  declare valor: string;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

ProductoCaracteristica.init({
  id_caracteristica: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  id_tipo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_tipos_caracteristicas',
      key: 'id_tipo'
    }
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: false
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
  modelName: 'ProductoCaracteristica',
  tableName: 'tb_producto_caracteristicas',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_producto', 'id_tipo']
    }
  ]
});

export default ProductoCaracteristica;