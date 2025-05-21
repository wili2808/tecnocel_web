import { Model, DataTypes, Optional } from 'sequelize';
import Carrito from './Carrito.js';
import Producto from './Producto.js';

interface ItemCarritoAttributes {
  id: number;
  carrito_id: number;
  producto_id: number;
  cantidad: number;
  precio: number;
  detalles_personalizacion?: any;
  subtotal?: number; // subtotal es virtual, no se incluye en la creación
  creado_en: Date;
  actualizado_en: Date;
}

// Algunos atributos son opcionales cuando se crea una instancia del modelo
interface ItemCarritoCreationAttributes extends Optional<ItemCarritoAttributes, 'id' | 'subtotal' | 'creado_en' | 'actualizado_en'> {}

class ItemCarrito extends Model<ItemCarritoAttributes, ItemCarritoCreationAttributes> {
  // Las propiedades de instancia se definen aquí para la tipificación
  public id!: number;
  public carrito_id!: number;
  public producto_id!: number;
  public cantidad!: number;
  public precio!: number;
  public detalles_personalizacion?: any;
  public subtotal?: number;
  public creado_en!: Date;
  public actualizado_en!: Date;
}

export const initItemCarrito = (sequelizeInstance: any) => {
  ItemCarrito.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    carrito_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Carrito,
        key: 'id'
      }
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Producto,
        key: 'id'
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    precio: {
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
        return this.getDataValue('precio') * this.getDataValue('cantidad');
      }
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
    tableName: 'items_carrito',
    timestamps: false
  });

  ItemCarrito.belongsTo(Carrito, { foreignKey: 'carrito_id' });
  Carrito.hasMany(ItemCarrito, { foreignKey: 'carrito_id' });

  ItemCarrito.belongsTo(Producto, { foreignKey: 'producto_id' });
  Producto.hasMany(ItemCarrito, { foreignKey: 'producto_id' });
}

export default ItemCarrito;
