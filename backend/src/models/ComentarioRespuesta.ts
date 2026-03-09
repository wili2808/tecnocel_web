import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ComentarioRespuesta extends Model {
  declare id_respuesta: number;
  declare id_comentario: number;
  declare id_cliente: number | null;
  declare id_usuario: number | null;
  declare tipo_autor: 'cliente' | 'admin';
  declare contenido: string;
  declare estado: 'activo' | 'oculto' | 'eliminado';
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

ComentarioRespuesta.init({
  id_respuesta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_comentario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tb_comentarios_productos', key: 'id_comentario' }
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'tb_clientes', key: 'id_cliente' }
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'tb_usuarios', key: 'id_usuario' }
  },
  tipo_autor: {
    type: DataTypes.ENUM('cliente', 'admin'),
    allowNull: false
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { len: [1, 1000] }
  },
  estado: {
    type: DataTypes.ENUM('activo', 'oculto', 'eliminado'),
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
  modelName: 'ComentarioRespuesta',
  tableName: 'tb_comentario_respuestas',
  timestamps: false,
  hooks: {
    beforeUpdate: (respuesta) => {
      respuesta.fyh_actualizacion = new Date();
    }
  }
});

export default ComentarioRespuesta;
