import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Direccion extends Model {
  declare id_direccion: number;
  declare id_cliente: number;
  declare nombre_direccion: string;
  declare calle: string;
  declare numero: string;
  declare piso: string | null;
  declare departamento: string | null;
  declare barrio: string | null;
  declare ciudad: string;
  declare provincia: string;
  declare codigo_postal: string | null;
  declare pais: string;
  declare referencia: string | null;
  declare es_predeterminada: boolean;
  declare es_facturacion: boolean;
  declare telefono_contacto: string | null;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Direccion.init({
  id_direccion: {
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
  nombre_direccion: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  calle: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  piso: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  departamento: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  barrio: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  provincia: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  codigo_postal: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  pais: {
    type: DataTypes.STRING(100),
    defaultValue: 'Argentina'
  },
  referencia: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  es_predeterminada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  es_facturacion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  telefono_contacto: {
    type: DataTypes.STRING(50),
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
  modelName: 'Direccion',
  tableName: 'tb_direcciones',
  timestamps: false
});

export default Direccion;