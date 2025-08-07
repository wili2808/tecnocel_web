import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Oferta extends Model {
  declare id_oferta: number;
  declare nombre_oferta: string;
  declare descripcion: string | null;
  declare tipo_descuento: 'porcentaje' | 'monto_fijo';
  declare valor_descuento: number;
  declare fecha_inicio: Date;
  declare fecha_fin: Date;
  declare activo: boolean;
  declare precio_minimo: number | null;
  declare precio_maximo: number | null;
  declare limite_uso: number | null;
  declare uso_actual: number;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Oferta.init({
  id_oferta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_oferta: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo_descuento: {
    type: DataTypes.ENUM('porcentaje', 'monto_fijo'),
    allowNull: false
  },
  valor_descuento: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  precio_minimo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  precio_maximo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  limite_uso: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  uso_actual: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  modelName: 'Oferta',
  tableName: 'tb_ofertas',
  timestamps: false
});

export default Oferta;