import { Model, DataTypes, Optional } from 'sequelize';
import Usuario from './Usuario.js';
import Direccion from './Direccion.js';

export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado'
}

interface PedidoAttributes {
  id: number;
  usuario_id?: number;
  direccion_id?: number;
  monto_total: number;
  estado: EstadoPedido;
  notas?: string;
  creado_en: Date;
  actualizado_en: Date;
}

// Algunos atributos son opcionales cuando se crea una instancia del modelo
interface PedidoCreationAttributes extends Optional<PedidoAttributes, 'id' | 'creado_en' | 'actualizado_en'> {}

class Pedido extends Model<PedidoAttributes, PedidoCreationAttributes> {
  // Las propiedades de instancia se definen aquí para la tipificación
  public id!: number;
  public usuario_id?: number;
  public direccion_id?: number;
  public monto_total!: number;
  public estado!: EstadoPedido;
  public notas?: string;
  public creado_en!: Date;
  public actualizado_en!: Date;
}

export const initPedido = (sequelizeInstance: any) => {
  Pedido.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Usuario,
        key: 'id'
      }
    },
    direccion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Direccion,
        key: 'id'
      }
    },
    monto_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: EstadoPedido.PENDIENTE,
      validate: {
        isIn: [Object.values(EstadoPedido)]
      }
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    actualizado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize: sequelizeInstance,
    tableName: 'pedidos',
    timestamps: false
  });

  Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id' });
  Usuario.hasMany(Pedido, { foreignKey: 'usuario_id' });

  Pedido.belongsTo(Direccion, { foreignKey: 'direccion_id' });
  Direccion.hasMany(Pedido, { foreignKey: 'direccion_id' });
}

export default Pedido;
