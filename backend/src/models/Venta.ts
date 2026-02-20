import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Venta extends Model {
  declare id_venta: number;
  declare nro_venta: number;
  declare id_cliente: number | null;
  declare id_carrito_web: number | null;
  declare total_pagado: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
  declare observaciones: string | null;
  declare valor_dolar: number | null;
  declare moneda: string | null;
  declare metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr' | null;
  declare tipo_venta: 'web' | 'manual';
  declare estado: 'completada' | 'cancelada' | 'pendiente';
  declare id_vendedor: number | null;
  declare estado_reembolso: 'sin_reembolso' | 'pendiente' | 'procesado' | 'rechazado' | null;
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
    allowNull: true,
    references: {
      model: 'tb_clientes',
      key: 'id_cliente'
    }
  },
  id_carrito_web: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_carritosweb',
      key: 'id_carrito'
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
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  moneda: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'qr'),
    allowNull: true
  },
  tipo_venta: {
    type: DataTypes.ENUM('web', 'manual'),
    allowNull: false,
    defaultValue: 'web'
  },
  estado: {
    type: DataTypes.ENUM('completada', 'cancelada', 'pendiente'),
    allowNull: false,
    defaultValue: 'completada'
  },
  id_vendedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_usuarios',
      key: 'id_usuario'
    }
  },
  estado_reembolso: {
    type: DataTypes.ENUM('sin_reembolso', 'pendiente', 'procesado', 'rechazado'),
    allowNull: true,
    defaultValue: null
  }
}, {
  sequelize,
  modelName: 'Venta',
  tableName: 'tb_ventas',
  timestamps: false
});

export default Venta;
