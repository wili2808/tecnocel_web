import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class DetalleCompra extends Model {
  declare id_detalle_compra: number;
  declare nro_compra: number;
  declare id_producto: number;
  declare cantidad: number;
  declare precio_unitario: number;
  declare subtotal: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

DetalleCompra.init({
  id_detalle_compra: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nro_compra: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
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
  modelName: 'DetalleCompra',
  tableName: 'tb_detalle_compras',
  timestamps: false
});

export default DetalleCompra; 