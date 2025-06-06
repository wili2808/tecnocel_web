import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class DetalleDevolucion extends Model {
  declare id_detalle: number;
  declare id_devolucion: number | null;
  declare id_producto: number | null;
  declare cantidad: number | null;
  declare fyh_creacion: Date | null;
  declare fyh_actualizacion: Date | null;
}

DetalleDevolucion.init({
  id_detalle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_devolucion: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'DetalleDevolucion',
  tableName: 'tb_detalle_devoluciones',
  timestamps: false
});

export default DetalleDevolucion; 