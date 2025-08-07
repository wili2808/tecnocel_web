import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class TipoCaracteristica extends Model {
  declare id_tipo: number;
  declare nombre_tipo: string;
  declare descripcion: string | null;
  declare tipo_dato: 'texto' | 'numero' | 'booleano' | 'seleccion';
  declare unidad_medida: string | null;
  declare opciones_seleccion: string[] | null;
  declare activo: boolean;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

TipoCaracteristica.init({
  id_tipo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_tipo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo_dato: {
    type: DataTypes.ENUM('texto', 'numero', 'booleano', 'seleccion'),
    defaultValue: 'texto'
  },
  unidad_medida: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  opciones_seleccion: {
    type: DataTypes.JSON,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  modelName: 'TipoCaracteristica',
  tableName: 'tb_tipos_caracteristicas',
  timestamps: false
});

export default TipoCaracteristica;