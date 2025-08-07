import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ProductoOferta extends Model {
  declare id_producto_oferta: number;
  declare id_producto: number;
  declare id_oferta: number;
  declare precio_oferta: number;
  declare fyh_creacion: Date;
}

ProductoOferta.init({
  id_producto_oferta: {
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
  id_oferta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_ofertas',
      key: 'id_oferta'
    }
  },
  precio_oferta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'ProductoOferta',
  tableName: 'tb_productos_ofertas',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_producto', 'id_oferta']
    }
  ]
});

export default ProductoOferta;