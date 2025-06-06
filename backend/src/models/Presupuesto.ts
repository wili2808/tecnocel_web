import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Presupuesto extends Model {
  declare id_presupuesto: number;
  declare nro_presupuesto: number | null;
  declare id_cliente: number | null;
  declare total_pagado: number | null;
  declare fyh_creacion: Date | null;
  declare moneda: string | null;
  declare valor_dolar: number | null;
  declare observaciones: string | null;
  declare estado: string | null;
}

Presupuesto.init({
  id_presupuesto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nro_presupuesto: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_clientes',
      key: 'id_cliente'
    }
  },
  total_pagado: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: true
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  moneda: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  valor_dolar: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Presupuesto',
  tableName: 'tb_presupuestos',
  timestamps: false
});

export default Presupuesto; 