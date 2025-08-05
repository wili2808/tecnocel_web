import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ComentarioImagen extends Model {
  declare id_imagen: number;
  declare id_comentario: number;
  declare nombre_archivo: string;
  declare ruta_imagen: string;
  declare tipo_archivo: string;
  declare tamaño_archivo: number | null;
  declare alt_text: string | null;
  declare orden: number;
  declare estado: 'activo' | 'eliminado';
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
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
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  ruta_imagen: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      isUrl: false // Permitir rutas relativas
    }
  },
  tipo_archivo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'jpg',
    validate: {
      isIn: [['jpg', 'jpeg', 'png', 'webp', 'gif']]
    }
  },
  tamaño_archivo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 10485760 // 10MB máximo
    }
  },
  alt_text: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  orden: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 5 // Máximo 5 imágenes por comentario
    }
  },
  estado: {
    type: DataTypes.ENUM('activo', 'eliminado'),
    allowNull: false,
    defaultValue: 'activo'
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
  modelName: 'ComentarioImagen',
  tableName: 'tb_comentario_imagenes',
  timestamps: false, // Ya manejamos fyh_creacion y fyh_actualizacion manualmente
  indexes: [
    {
      fields: ['id_comentario']
    },
    {
      fields: ['orden']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['id_comentario', 'estado', 'orden']
    }
  ],
  hooks: {
    beforeUpdate: (imagen) => {
      imagen.fyh_actualizacion = new Date();
    }
  }
});

export default ComentarioImagen;