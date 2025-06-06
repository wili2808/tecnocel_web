import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Devolucion extends Model {
  declare id_devolucion: number;
  declare id_cliente: number;
  declare total_a_devolver: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
  declare motivo_devolucion: string;
  declare estado_devolucion: string;
  declare tipo_devolucion: string;
  declare nro_venta: string | null;
}

Devolucion.init({
  id_devolucion: {
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
  total_a_devolver: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  motivo_devolucion: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  estado_devolucion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  tipo_devolucion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  nro_venta: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Devolucion',
  tableName: 'tb_devoluciones',
  timestamps: false
});

export default Devolucion; 