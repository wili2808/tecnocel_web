import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Venta extends Model {
  declare id_venta: number;
  declare nro_venta: number;
  declare id_cliente: number;
  declare total_pagado: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
  declare observaciones: string | null;
  declare valor_dolar: number | null;
  declare moneda: string | null;
}

Venta.init({
  id_venta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nro_venta: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_clientes',
      key: 'id_cliente'
    }
  },
  total_pagado: {
    type: DataTypes.INTEGER,
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
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  valor_dolar: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: true
  },
  moneda: {
    type: DataTypes.STRING(15),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Venta',
  tableName: 'tb_ventas',
  timestamps: false
});

export default Venta; 