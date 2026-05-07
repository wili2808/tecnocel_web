import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Modelo MensajeContacto
 * Representa los mensajes enviados desde el formulario de contacto web
 */
class MensajeContacto extends Model {
  declare id_mensaje_contacto: number;
  declare nombre: string;
  declare email: string;
  declare telefono: string | null;
  declare asunto: string;
  declare mensaje: string;
  declare leido: boolean;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

MensajeContacto.init({
  id_mensaje_contacto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  asunto: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  leido: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fyh_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'MensajeContacto',
  tableName: 'tb_mensajes_contacto',
  timestamps: false,
  indexes: [
    {
      fields: ['leido']
    },
    {
      fields: ['fyh_creacion']
    }
  ]
});

export default MensajeContacto;
