import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Envio extends Model {
  declare id_envio: number;
  declare id_venta: number;
  declare tipo_entrega: 'envio' | 'retiro_en_tienda';
  declare id_direccion: number | null;
  declare estado_envio: 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado' | 'no_aplica';
  declare fecha_despacho: Date | null;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Envio.init({
  id_envio: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'tb_ventas',
      key: 'id_venta'
    }
  },
  tipo_entrega: {
    type: DataTypes.ENUM('envio', 'retiro_en_tienda'),
    allowNull: false,
    defaultValue: 'retiro_en_tienda'
  },
  id_direccion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_direcciones',
      key: 'id_direccion'
    }
  },
  estado_envio: {
    type: DataTypes.ENUM('pendiente', 'en_preparacion', 'en_camino', 'entregado', 'no_aplica'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  fecha_despacho: {
    type: DataTypes.DATE,
    allowNull: true
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
  modelName: 'Envio',
  tableName: 'tb_envios',
  timestamps: false
});

export default Envio;
