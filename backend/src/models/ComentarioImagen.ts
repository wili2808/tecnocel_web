import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ComentarioImagen extends Model {
  declare id_imagen: number;
  declare id_comentario: number;
  declare url_imagen: string;
  declare alt_text: string | null;
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
    }
  ]
});

export default ComentarioImagen;