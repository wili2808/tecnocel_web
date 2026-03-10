import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export type TipoNotificacion =
  | 'respuesta_admin'
  | 'respuesta_cliente'
  | 'comentario_moderado'
  | 'venta_confirmada'
  | 'venta_cancelada';

class Notificacion extends Model {
  declare id_notificacion: number;
  declare id_cliente: number;
  declare tipo: TipoNotificacion;
  declare titulo: string;
  declare mensaje: string;
  declare id_referencia: number | null;
  declare enlace: string | null;
  declare leido: boolean;
  declare fyh_creacion: Date;
  declare fyh_lectura: Date | null;
}

Notificacion.init({
  id_notificacion: {
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
  tipo: {
    type: DataTypes.ENUM(
      'respuesta_admin',
      'respuesta_cliente',
      'comentario_moderado',
      'venta_confirmada',
      'venta_cancelada'
    ),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  id_referencia: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  enlace: {
    type: DataTypes.STRING(255),
    allowNull: true
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
  fyh_lectura: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Notificacion',
  tableName: 'tb_notificaciones',
  timestamps: false
});

export default Notificacion;
