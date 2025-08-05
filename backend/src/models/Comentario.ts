import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Comentario extends Model {
  declare id_comentario: number;
  declare id_producto: number;
  declare id_cliente: number;
  declare comentario: string;
  declare calificacion: number | null;
  declare es_verificado: boolean;
  declare estado: 'activo' | 'oculto' | 'eliminado';
  declare respuesta_admin: string | null;
  declare fecha_respuesta_admin: Date | null;
  declare id_admin_respuesta: number | null;
  declare fyh_creacion: Date;
  declare fyh_actualizacion: Date;
}

Comentario.init({
  id_comentario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_clientes',
      key: 'id_cliente'
    }
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 2000] // Mínimo 10 caracteres, máximo 2000
    }
  },
  calificacion: {
    type: DataTypes.TINYINT,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  es_verificado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  estado: {
    type: DataTypes.ENUM('activo', 'oculto', 'eliminado'),
    allowNull: false,
    defaultValue: 'activo'
  },
  respuesta_admin: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_respuesta_admin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  id_admin_respuesta: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tb_usuarios',
      key: 'id_usuario'
    }
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
  modelName: 'Comentario',
  tableName: 'tb_comentarios_productos',
  timestamps: false, // Ya manejamos fyh_creacion y fyh_actualizacion manualmente
  indexes: [
    {
      fields: ['id_producto']
    },
    {
      fields: ['id_cliente']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['calificacion']
    },
    {
      fields: ['fyh_creacion']
    },
    {
      fields: ['id_producto', 'estado', 'fyh_creacion']
    }
  ],
  hooks: {
    beforeUpdate: (comentario) => {
      comentario.fyh_actualizacion = new Date();
    }
  }
});

export default Comentario;