import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class PresupuestoDetalle extends Model {
  declare id_detalle: number;
  declare nro_presupuesto: number | null;
  declare id_producto: number | null;
  declare cantidad: number | null;
  declare fyh_creacion: Date | null;
  declare fyh_actualizacion: Date | null;
}

PresupuestoDetalle.init({
  id_detalle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nro_presupuesto: {
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
  modelName: 'PresupuestoDetalle',
  tableName: 'tb_presupuesto_detalles',
  timestamps: false
});

export default PresupuestoDetalle; 