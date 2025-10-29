import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ProductoOferta extends Model {
  declare id_producto_oferta: number;
  declare id_producto: number;
  declare id_oferta: number;
  declare precio_oferta: number | null;
  declare es_precio_personalizado: boolean;
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
    allowNull: true,
    comment: 'Precio con oferta aplicada. NULL = calcular dinámicamente, valor = precio personalizado'
  },
  es_precio_personalizado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el precio_oferta es personalizado (true) o debe calcularse dinámicamente (false)'
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