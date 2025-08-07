import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ComentarioImagen extends Model {
  declare id_imagen: number;
  declare id_comentario: number;
  declare url_imagen: string;
  declare alt_text: string | null;
  declare es_principal: boolean;
  declare orden: number;
  declare fyh_creacion: Date;
}

ComentarioImagen.init({
  id_imagen: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_comentario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_comentarios_productos',
      key: 'id_comentario'
    }
  },
  url_imagen: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  alt_text: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  es_principal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 5 // Máximo 5 imágenes por comentario
    }
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ComentarioImagen',
  tableName: 'tb_comentario_imagenes',
  timestamps: false,
  indexes: [
    {
      fields: ['id_comentario']
    },
    {
      fields: ['orden']
    },
    {
      fields: ['es_principal']
    },
    {
      fields: ['id_comentario', 'es_principal', 'orden']
    }
  ]
});

export default ComentarioImagen;