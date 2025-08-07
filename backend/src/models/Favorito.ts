import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Favorito extends Model {
  declare id_favorito: number;
  declare id_cliente: number;
  declare id_producto: number;
  declare fyh_creacion: Date;
}

Favorito.init({
  id_favorito: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_clientes',
      key: 'id_cliente'
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Favorito',
  tableName: 'tb_favoritos',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_cliente', 'id_producto']
    }
  ]
});

export default Favorito;