import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Cancelacion extends Model {
  declare id_cancelacion: number;
  declare id_venta: number;
  declare id_usuario: number;
  declare motivo: string | null;
  declare fyh_cancelacion: Date;

  // Asociaciones
  declare usuario_cancelacion?: any;
}

Cancelacion.init({
  id_cancelacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_ventas',
      key: 'id_venta'
    }
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_usuarios',
      key: 'id_usuario'
    }
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fyh_cancelacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Cancelacion',
  tableName: 'tb_cancelaciones',
  timestamps: false
});

export default Cancelacion;
