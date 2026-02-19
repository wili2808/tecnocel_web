import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Configuracion extends Model {
  declare clave: string;
  declare valor: string;
  declare fyh_actualizacion: Date;
}

Configuracion.init({
  clave: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  valor: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Configuracion',
  tableName: 'tb_configuracion',
  timestamps: false
});

export default Configuracion;
