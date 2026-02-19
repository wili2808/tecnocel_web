import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Modelo VentaItem - Detalle universal de ventas
 *
 * Tabla: tb_venta_items
 *
 * Almacena el detalle de productos vendidos para CUALQUIER tipo de venta
 * (web o manual). Es el registro permanente e histórico de cada línea de venta.
 *
 * Para ventas web: se crea como snapshot al confirmar la compra del carrito.
 * Para ventas manuales: se crea directamente al registrar la venta.
 *
 * Ventajas vs tb_carrito (legacy):
 * - FK directo a id_venta (no join por nro_venta)
 * - precio_unitario incluido (precio histórico al momento de la venta)
 * - subtotal calculado y almacenado
 * - Funciona igual para ventas web y manuales (query path único)
 */
class VentaItem extends Model {
  declare id_item: number;
  declare id_venta: number;
  declare id_producto: number;
  declare cantidad: number;
  declare precio_unitario: number;
  declare subtotal: number;
  declare fyh_creacion: Date;
}

VentaItem.init({
  id_item: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_ventas',
      key: 'id_venta'
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tb_almacen',
      key: 'id_producto'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
    comment: 'Precio al momento de la venta (registro histórico inmutable)'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  fyh_creacion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'VentaItem',
  tableName: 'tb_venta_items',
  timestamps: false
});

export default VentaItem;
