import { Model, DataTypes, Optional } from 'sequelize';
import Pedido from './Pedido.js';
import Producto from './Producto.js';

interface ItemPedidoAttributes {
  id: number;
  pedido_id: number;
  producto_id?: number;
  cantidad: number;
  precio_unitario: number;
  detalles_personalizacion?: any;
  subtotal?: number; // subtotal es virtual, no se incluye en la creación
  creado_en: Date;
}

// Algunos atributos son opcionales cuando se crea una instancia del modelo
interface ItemPedidoCreationAttributes extends Optional<ItemPedidoAttributes, 'id' | 'subtotal' | 'creado_en'> {}

class ItemPedido extends Model<ItemPedidoAttributes, ItemPedidoCreationAttributes> {
  // Las propiedades de instancia se definen aquí para la tipificación
  public id!: number;
  public pedido_id!: number;
  public producto_id?: number;
  public cantidad!: number;
  public precio_unitario!: number;
  public detalles_personalizacion?: any;
  public subtotal?: number;
  public creado_en!: Date;
}

export const initItemPedido = (sequelizeInstance: any) => {
  ItemPedido.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    pedido_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Pedido,
        key: 'id'
      }
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Producto,
        key: 'id'
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    detalles_personalizacion: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    subtotal: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('precio_unitario') * this.getDataValue('cantidad');
      }
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize: sequelizeInstance,
    tableName: 'items_pedido',
    timestamps: false
  });

  ItemPedido.belongsTo(Pedido, { foreignKey: 'pedido_id' });
  Pedido.hasMany(ItemPedido, { foreignKey: 'pedido_id' });

  ItemPedido.belongsTo(Producto, { foreignKey: 'producto_id' });
  Producto.hasMany(ItemPedido, { foreignKey: 'producto_id' });
}

export default ItemPedido;
